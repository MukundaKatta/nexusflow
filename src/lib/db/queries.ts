// ============================================================
// NexusFlow — Database Queries
// ============================================================

import { db, schema } from "./index";
import { eq, desc, and, sql, count, inArray } from "drizzle-orm";
import type {
  Workflow,
  Execution,
  WorkflowNode,
  WorkflowEdge,
  WorkflowSettings,
} from "@/types/workflow";

// --- Workflows ---

export async function getWorkflows(userId: string, status?: string) {
  const conditions = [eq(schema.workflows.createdBy, userId)];
  if (status) {
    conditions.push(
      eq(schema.workflows.status, status as "draft" | "active" | "paused" | "archived")
    );
  }
  return db
    .select()
    .from(schema.workflows)
    .where(and(...conditions))
    .orderBy(desc(schema.workflows.updatedAt));
}

export async function getWorkflowById(id: string) {
  const [workflow] = await db
    .select()
    .from(schema.workflows)
    .where(eq(schema.workflows.id, id))
    .limit(1);
  return workflow;
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  createdBy: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  settings?: WorkflowSettings;
  templateId?: string;
}) {
  const [workflow] = await db
    .insert(schema.workflows)
    .values({
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
      nodes: JSON.stringify(data.nodes || []),
      edges: JSON.stringify(data.edges || []),
      settings: JSON.stringify(
        data.settings || {
          timezone: "UTC",
          maxExecutionTime: 300000,
          retryOnFailure: false,
          notifyOnFailure: false,
          notifyOnSuccess: false,
          logLevel: "info",
          concurrency: 1,
        }
      ),
      templateId: data.templateId,
    })
    .returning();
  return workflow;
}

export async function updateWorkflow(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    status: "draft" | "active" | "paused" | "archived";
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables: Record<string, unknown>;
    settings: WorkflowSettings;
    tags: string[];
  }>
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.nodes !== undefined) updateData.nodes = JSON.stringify(data.nodes);
  if (data.edges !== undefined) updateData.edges = JSON.stringify(data.edges);
  if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);
  if (data.settings !== undefined) updateData.settings = JSON.stringify(data.settings);
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

  const [workflow] = await db
    .update(schema.workflows)
    .set(updateData)
    .where(eq(schema.workflows.id, id))
    .returning();
  return workflow;
}

export async function deleteWorkflow(id: string) {
  await db.delete(schema.workflows).where(eq(schema.workflows.id, id));
}

// --- Executions ---

export async function getExecutions(workflowId: string, limit = 50, offset = 0) {
  return db
    .select()
    .from(schema.executions)
    .where(eq(schema.executions.workflowId, workflowId))
    .orderBy(desc(schema.executions.startedAt))
    .limit(limit)
    .offset(offset);
}

export async function getExecutionById(id: string) {
  const [execution] = await db
    .select()
    .from(schema.executions)
    .where(eq(schema.executions.id, id))
    .limit(1);
  return execution;
}

export async function createExecution(data: {
  workflowId: string;
  triggerType: "webhook" | "schedule" | "email_received" | "file_uploaded" | "manual";
  triggerData?: Record<string, unknown>;
}) {
  const [execution] = await db
    .insert(schema.executions)
    .values({
      workflowId: data.workflowId,
      triggerType: data.triggerType,
      triggerData: data.triggerData ? JSON.stringify(data.triggerData) : undefined,
      status: "pending",
    })
    .returning();
  return execution;
}

export async function updateExecution(
  id: string,
  data: Partial<{
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    output: Record<string, unknown>;
    error: string;
    completedAt: Date;
    duration: number;
  }>
) {
  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.output) updateData.output = JSON.stringify(data.output);
  if (data.error) updateData.error = data.error;
  if (data.completedAt) updateData.completedAt = data.completedAt;
  if (data.duration !== undefined) updateData.duration = data.duration;

  const [execution] = await db
    .update(schema.executions)
    .set(updateData)
    .where(eq(schema.executions.id, id))
    .returning();
  return execution;
}

// --- Node Executions ---

export async function getNodeExecutions(executionId: string) {
  return db
    .select()
    .from(schema.nodeExecutions)
    .where(eq(schema.nodeExecutions.executionId, executionId))
    .orderBy(schema.nodeExecutions.startedAt);
}

export async function createNodeExecution(data: {
  executionId: string;
  nodeId: string;
  nodeType: string;
  input?: Record<string, unknown>;
}) {
  const [nodeExecution] = await db
    .insert(schema.nodeExecutions)
    .values({
      executionId: data.executionId,
      nodeId: data.nodeId,
      nodeType: data.nodeType,
      input: data.input ? JSON.stringify(data.input) : undefined,
      status: "running",
    })
    .returning();
  return nodeExecution;
}

export async function updateNodeExecution(
  id: string,
  data: Partial<{
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    output: Record<string, unknown>;
    error: string;
    retryCount: number;
    logs: unknown[];
    completedAt: Date;
    duration: number;
  }>
) {
  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.output) updateData.output = JSON.stringify(data.output);
  if (data.error) updateData.error = data.error;
  if (data.retryCount !== undefined) updateData.retryCount = data.retryCount;
  if (data.logs) updateData.logs = JSON.stringify(data.logs);
  if (data.completedAt) updateData.completedAt = data.completedAt;
  if (data.duration !== undefined) updateData.duration = data.duration;

  const [nodeExecution] = await db
    .update(schema.nodeExecutions)
    .set(updateData)
    .where(eq(schema.nodeExecutions.id, id))
    .returning();
  return nodeExecution;
}

// --- Credentials ---

export async function getCredentials(userId: string) {
  return db
    .select({
      id: schema.credentials.id,
      name: schema.credentials.name,
      type: schema.credentials.type,
      createdBy: schema.credentials.createdBy,
      createdAt: schema.credentials.createdAt,
      updatedAt: schema.credentials.updatedAt,
    })
    .from(schema.credentials)
    .where(eq(schema.credentials.createdBy, userId))
    .orderBy(desc(schema.credentials.updatedAt));
}

export async function getCredentialById(id: string) {
  const [credential] = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.id, id))
    .limit(1);
  return credential;
}

export async function createCredential(data: {
  name: string;
  type: string;
  encryptedData: string;
  createdBy: string;
}) {
  const [credential] = await db
    .insert(schema.credentials)
    .values(data)
    .returning();
  return credential;
}

export async function updateCredential(
  id: string,
  data: { name?: string; encryptedData?: string }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name) updateData.name = data.name;
  if (data.encryptedData) updateData.encryptedData = data.encryptedData;

  const [credential] = await db
    .update(schema.credentials)
    .set(updateData)
    .where(eq(schema.credentials.id, id))
    .returning();
  return credential;
}

export async function deleteCredential(id: string) {
  await db.delete(schema.credentials).where(eq(schema.credentials.id, id));
}

// --- Webhooks ---

export async function getWebhookByPath(path: string) {
  const [webhook] = await db
    .select()
    .from(schema.webhooks)
    .where(and(eq(schema.webhooks.path, path), eq(schema.webhooks.isActive, true)))
    .limit(1);
  return webhook;
}

export async function createWebhook(data: {
  workflowId: string;
  path: string;
  method: string;
  secret?: string;
}) {
  const [webhook] = await db
    .insert(schema.webhooks)
    .values(data)
    .returning();
  return webhook;
}

// --- Schedules ---

export async function getActiveSchedules() {
  return db
    .select()
    .from(schema.schedules)
    .where(eq(schema.schedules.isActive, true));
}

export async function createSchedule(data: {
  workflowId: string;
  cron: string;
  timezone?: string;
}) {
  const [schedule] = await db
    .insert(schema.schedules)
    .values(data)
    .returning();
  return schedule;
}

// --- Templates ---

export async function getTemplates(category?: string) {
  if (category) {
    return db
      .select()
      .from(schema.workflowTemplates)
      .where(eq(schema.workflowTemplates.category, category))
      .orderBy(desc(schema.workflowTemplates.popularity));
  }
  return db
    .select()
    .from(schema.workflowTemplates)
    .orderBy(desc(schema.workflowTemplates.popularity));
}

export async function getTemplateById(id: string) {
  const [template] = await db
    .select()
    .from(schema.workflowTemplates)
    .where(eq(schema.workflowTemplates.id, id))
    .limit(1);
  return template;
}

// --- Stats ---

export async function getWorkflowStats(userId: string) {
  const [totalWorkflows] = await db
    .select({ count: count() })
    .from(schema.workflows)
    .where(eq(schema.workflows.createdBy, userId));

  const [activeWorkflows] = await db
    .select({ count: count() })
    .from(schema.workflows)
    .where(
      and(
        eq(schema.workflows.createdBy, userId),
        eq(schema.workflows.status, "active")
      )
    );

  const recentExecutions = await db
    .select({
      status: schema.executions.status,
      count: count(),
    })
    .from(schema.executions)
    .innerJoin(
      schema.workflows,
      eq(schema.executions.workflowId, schema.workflows.id)
    )
    .where(eq(schema.workflows.createdBy, userId))
    .groupBy(schema.executions.status);

  return {
    totalWorkflows: totalWorkflows?.count || 0,
    activeWorkflows: activeWorkflows?.count || 0,
    executionStats: recentExecutions,
  };
}
