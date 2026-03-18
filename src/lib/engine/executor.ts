// ============================================================
// NexusFlow — Workflow Execution Engine
// ============================================================

import type {
  WorkflowNode,
  WorkflowEdge,
  ExecutionLog,
  NodeExecution,
  ExecutionStatus,
} from "@/types/workflow";
import {
  getWorkflowById,
  getCredentialById,
  createNodeExecution,
  updateNodeExecution,
  updateExecution,
} from "@/lib/db/queries";
import { decryptCredentialData } from "@/lib/utils/crypto";
import {
  resolveExpression,
  resolveConfig,
  evaluateCondition,
  evaluateSimpleCondition,
} from "@/lib/utils/expression";
import { executeAINode } from "@/lib/ai/executor";
import { executeIntegrationNode } from "@/lib/integrations/executor";

interface ExecutionContext {
  executionId: string;
  workflowId: string;
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
  triggerData: Record<string, unknown>;
  credentials: Record<string, Record<string, string>>;
  logs: ExecutionLog[];
}

export async function executeWorkflow(
  workflowId: string,
  executionId: string,
  triggerType: string,
  triggerData?: Record<string, unknown>
): Promise<void> {
  const startTime = Date.now();

  // Update execution status to running
  await updateExecution(executionId, { status: "running" });

  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    await updateExecution(executionId, {
      status: "failed",
      error: "Workflow not found",
      completedAt: new Date(),
      duration: Date.now() - startTime,
    });
    return;
  }

  const nodes: WorkflowNode[] =
    typeof workflow.nodes === "string"
      ? JSON.parse(workflow.nodes as string)
      : (workflow.nodes as WorkflowNode[]);
  const edges: WorkflowEdge[] =
    typeof workflow.edges === "string"
      ? JSON.parse(workflow.edges as string)
      : (workflow.edges as WorkflowEdge[]);
  const variables: Record<string, unknown> =
    typeof workflow.variables === "string"
      ? JSON.parse(workflow.variables as string)
      : (workflow.variables as Record<string, unknown>) || {};

  // Build context
  const context: ExecutionContext = {
    executionId,
    workflowId,
    variables,
    nodeOutputs: {},
    triggerData: triggerData || {},
    credentials: {},
    logs: [],
  };

  // Set trigger data in context
  context.nodeOutputs["trigger"] = triggerData || {};

  try {
    // Find trigger node (entry point)
    const triggerNode = nodes.find((n) => n.category === "trigger");
    if (!triggerNode) {
      throw new Error("No trigger node found in workflow");
    }

    // Execute the workflow graph starting from trigger
    await executeNode(triggerNode, nodes, edges, context);

    // Mark execution as completed
    await updateExecution(executionId, {
      status: "completed",
      output: context.nodeOutputs,
      completedAt: new Date(),
      duration: Date.now() - startTime,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await updateExecution(executionId, {
      status: "failed",
      error: errorMsg,
      completedAt: new Date(),
      duration: Date.now() - startTime,
    });
  }
}

async function executeNode(
  node: WorkflowNode,
  allNodes: WorkflowNode[],
  allEdges: WorkflowEdge[],
  context: ExecutionContext
): Promise<void> {
  if (node.isDisabled) {
    addLog(context, "info", `Skipping disabled node: ${node.label}`);
    // Continue to next nodes
    await executeDownstreamNodes(node.id, "output", allNodes, allEdges, context);
    return;
  }

  const nodeStartTime = Date.now();
  addLog(context, "info", `Executing node: ${node.label} (${node.type})`);

  // Create node execution record
  const nodeExec = await createNodeExecution({
    executionId: context.executionId,
    nodeId: node.id,
    nodeType: node.type,
    input: getNodeInput(node.id, allEdges, context),
  });

  try {
    // Load credentials if needed
    if (node.credentialId) {
      if (!context.credentials[node.credentialId]) {
        const cred = await getCredentialById(node.credentialId);
        if (cred) {
          context.credentials[node.credentialId] = decryptCredentialData(
            cred.encryptedData
          );
        }
      }
    }

    // Resolve config expressions
    const resolvedConfig = resolveConfig(node.config, {
      ...context.variables,
      ...context.nodeOutputs,
      trigger: context.triggerData,
      input: getNodeInput(node.id, allEdges, context),
    });

    let output: Record<string, unknown> = {};
    let nextOutputHandle = "output";

    // Execute based on node type
    switch (node.category) {
      case "trigger":
        // Trigger node just passes through trigger data
        output = context.triggerData;
        break;

      case "ai":
        output = await executeAINode(
          node.type,
          resolvedConfig,
          context.credentials[node.credentialId || ""]
        );
        break;

      case "action":
        output = await executeIntegrationNode(
          node.type,
          resolvedConfig,
          context.credentials[node.credentialId || ""]
        );
        break;

      case "condition": {
        const condResult = evaluateConditionNode(resolvedConfig, {
          ...context.variables,
          ...context.nodeOutputs,
          trigger: context.triggerData,
          input: getNodeInput(node.id, allEdges, context),
        });
        output = { result: condResult };
        nextOutputHandle = condResult ? "true" : "false";
        break;
      }

      case "loop": {
        output = await executeLoopNode(
          node,
          resolvedConfig,
          allNodes,
          allEdges,
          context
        );
        break;
      }

      case "error": {
        output = await executeErrorHandler(resolvedConfig, context);
        break;
      }

      default:
        addLog(context, "warn", `Unknown node category: ${node.category}`);
    }

    // Store output
    context.nodeOutputs[node.id] = output;

    // Update node execution
    await updateNodeExecution(nodeExec.id, {
      status: "completed",
      output,
      logs: context.logs,
      completedAt: new Date(),
      duration: Date.now() - nodeStartTime,
    });

    addLog(context, "info", `Node completed: ${node.label}`);

    // Execute downstream nodes
    if (node.category === "condition") {
      await executeDownstreamNodes(
        node.id,
        nextOutputHandle,
        allNodes,
        allEdges,
        context
      );
    } else if (node.category === "loop") {
      // Loop handles its own downstream execution
      await executeDownstreamNodes(node.id, "done", allNodes, allEdges, context);
    } else {
      await executeDownstreamNodes(node.id, "output", allNodes, allEdges, context);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    addLog(context, "error", `Node failed: ${node.label} - ${errorMsg}`);

    // Check for retry config
    if (node.retryConfig && node.retryConfig.maxRetries > 0) {
      const retryResult = await retryNode(
        node,
        allNodes,
        allEdges,
        context,
        nodeExec.id,
        nodeStartTime
      );
      if (retryResult) return;
    }

    // Check for error handler
    if (node.errorHandlerId) {
      const errorHandler = allNodes.find((n) => n.id === node.errorHandlerId);
      if (errorHandler) {
        context.nodeOutputs[node.id] = { error: errorMsg };
        await executeNode(errorHandler, allNodes, allEdges, context);
        return;
      }
    }

    await updateNodeExecution(nodeExec.id, {
      status: "failed",
      error: errorMsg,
      logs: context.logs,
      completedAt: new Date(),
      duration: Date.now() - nodeStartTime,
    });

    throw error;
  }
}

async function executeDownstreamNodes(
  sourceNodeId: string,
  sourceHandle: string,
  allNodes: WorkflowNode[],
  allEdges: WorkflowEdge[],
  context: ExecutionContext
): Promise<void> {
  const outEdges = allEdges.filter(
    (e) => e.source === sourceNodeId && e.sourceHandle === sourceHandle
  );

  for (const edge of outEdges) {
    const targetNode = allNodes.find((n) => n.id === edge.target);
    if (targetNode) {
      await executeNode(targetNode, allNodes, allEdges, context);
    }
  }
}

function getNodeInput(
  nodeId: string,
  edges: WorkflowEdge[],
  context: ExecutionContext
): Record<string, unknown> {
  const inputEdges = edges.filter((e) => e.target === nodeId);
  const input: Record<string, unknown> = {};

  for (const edge of inputEdges) {
    const sourceOutput = context.nodeOutputs[edge.source];
    if (sourceOutput) {
      Object.assign(input, sourceOutput);
    }
  }

  return input;
}

function evaluateConditionNode(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): boolean {
  const mode = config.mode as string;

  if (mode === "simple") {
    const field = resolveExpression(String(config.field || ""), context);
    const operator = config.operator as string;
    const value = resolveExpression(String(config.value || ""), context);
    return evaluateSimpleCondition(field, operator, value);
  }

  return evaluateCondition(String(config.expression || "false"), context);
}

async function executeLoopNode(
  node: WorkflowNode,
  config: Record<string, unknown>,
  allNodes: WorkflowNode[],
  allEdges: WorkflowEdge[],
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const array = config.array;
  if (!Array.isArray(array)) {
    throw new Error("Loop node requires an array input");
  }

  const maxIterations = (config.maxIterations as number) || 1000;
  const results: unknown[] = [];
  const limit = Math.min(array.length, maxIterations);

  // Find downstream nodes connected to "item" output
  const itemEdges = allEdges.filter(
    (e) => e.source === node.id && e.sourceHandle === "item"
  );

  for (let i = 0; i < limit; i++) {
    addLog(context, "debug", `Loop iteration ${i + 1}/${limit}`);

    // Set current item in context
    context.nodeOutputs[node.id] = {
      item: array[i],
      index: i,
      total: array.length,
      isFirst: i === 0,
      isLast: i === limit - 1,
    };

    // Execute downstream nodes for each item
    for (const edge of itemEdges) {
      const targetNode = allNodes.find((n) => n.id === edge.target);
      if (targetNode) {
        await executeNode(targetNode, allNodes, allEdges, context);
        results.push(context.nodeOutputs[targetNode.id]);
      }
    }
  }

  return { results, totalProcessed: results.length };
}

async function executeErrorHandler(
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const strategy = config.strategy as string;

  switch (strategy) {
    case "fallback":
      return (config.fallbackValue as Record<string, unknown>) || {};
    case "ignore":
      return { handled: true, strategy: "ignored" };
    case "stop":
      throw new Error("Workflow stopped by error handler");
    case "notify":
      addLog(context, "info", `Error notification: ${config.notificationMessage}`);
      return { handled: true, strategy: "notified" };
    default:
      return { handled: true };
  }
}

async function retryNode(
  node: WorkflowNode,
  allNodes: WorkflowNode[],
  allEdges: WorkflowEdge[],
  context: ExecutionContext,
  nodeExecId: string,
  startTime: number
): Promise<boolean> {
  const retryConfig = node.retryConfig!;
  let retryCount = 0;

  while (retryCount < retryConfig.maxRetries) {
    retryCount++;
    const delay =
      retryConfig.retryDelay *
      Math.pow(retryConfig.backoffMultiplier, retryCount - 1);

    addLog(
      context,
      "info",
      `Retrying node ${node.label} (attempt ${retryCount}/${retryConfig.maxRetries}) after ${delay}ms`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      // Re-execute the node logic
      const resolvedConfig = resolveConfig(node.config, {
        ...context.variables,
        ...context.nodeOutputs,
        trigger: context.triggerData,
        input: getNodeInput(node.id, allEdges, context),
      });

      let output: Record<string, unknown> = {};
      if (node.category === "ai") {
        output = await executeAINode(
          node.type,
          resolvedConfig,
          context.credentials[node.credentialId || ""]
        );
      } else if (node.category === "action") {
        output = await executeIntegrationNode(
          node.type,
          resolvedConfig,
          context.credentials[node.credentialId || ""]
        );
      }

      context.nodeOutputs[node.id] = output;

      await updateNodeExecution(nodeExecId, {
        status: "completed",
        output,
        retryCount,
        completedAt: new Date(),
        duration: Date.now() - startTime,
      });

      await executeDownstreamNodes(
        node.id,
        "output",
        allNodes,
        allEdges,
        context
      );
      return true;
    } catch {
      addLog(context, "warn", `Retry ${retryCount} failed for node ${node.label}`);
    }
  }

  return false;
}

function addLog(
  context: ExecutionContext,
  level: ExecutionLog["level"],
  message: string,
  data?: Record<string, unknown>
): void {
  context.logs.push({
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  });
}
