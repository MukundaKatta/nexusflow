"use client";

import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  BackgroundVariant,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { useWorkflowStore } from "@/store/workflow-store";
import { WorkflowNodeComponent } from "./workflow-node";
import type { WorkflowNode, WorkflowEdge } from "@/types/workflow";

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

export function WorkflowCanvas() {
  const {
    nodes: workflowNodes,
    edges: workflowEdges,
    selectNode,
    updateNodePosition,
    addEdge: storeAddEdge,
    removeEdge,
    removeNode,
  } = useWorkflowStore();

  // Convert workflow nodes to ReactFlow nodes
  const nodes: Node[] = useMemo(
    () =>
      workflowNodes.map((node: WorkflowNode) => ({
        id: node.id,
        type: "workflowNode",
        position: node.position,
        data: {
          ...node,
          onSelect: () => selectNode(node.id),
        },
        draggable: true,
      })),
    [workflowNodes, selectNode]
  );

  // Convert workflow edges to ReactFlow edges
  const edges: Edge[] = useMemo(
    () =>
      workflowEdges.map((edge: WorkflowEdge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        label: edge.label,
        animated: true,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
        labelStyle: { fill: "hsl(var(--foreground))", fontSize: 12 },
      })),
    [workflowEdges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          updateNodePosition(change.id, change.position);
        }
        if (change.type === "remove") {
          removeNode(change.id);
        }
      }
    },
    [updateNodePosition, removeNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === "remove") {
          removeEdge(change.id);
        }
      }
    },
    [removeEdge]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        storeAddEdge({
          source: connection.source,
          sourceHandle: connection.sourceHandle || "output",
          target: connection.target,
          targetHandle: connection.targetHandle || "input",
        });
      }
    },
    [storeAddEdge]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode="Delete"
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground) / 0.2)"
        />
        <Controls
          className="rounded-lg border bg-background shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="rounded-lg border bg-background shadow-lg"
          nodeColor={(node) => {
            const data = node.data as WorkflowNode;
            switch (data.category) {
              case "trigger":
                return "hsl(142, 71%, 45%)";
              case "ai":
                return "hsl(270, 76%, 55%)";
              case "action":
                return "hsl(210, 76%, 55%)";
              case "condition":
                return "hsl(45, 93%, 47%)";
              case "loop":
                return "hsl(200, 80%, 50%)";
              case "error":
                return "hsl(0, 84%, 60%)";
              default:
                return "hsl(var(--muted))";
            }
          }}
          maskColor="hsl(var(--background) / 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
