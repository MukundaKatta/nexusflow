// ============================================================
// NexusFlow — Workflow Editor Store (Zustand)
// ============================================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowSettings,
  NodeType,
  NodeCategory,
} from "@/types/workflow";
import { getNodeDefinition } from "@/config/nodes";
import { v4 as uuidv4 } from "uuid";

interface WorkflowState {
  // Workflow data
  id: string | null;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "archived";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, unknown>;
  settings: WorkflowSettings;
  tags: string[];
  version: number;
  isDirty: boolean;

  // Editor state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isPanelOpen: boolean;
  zoom: number;
  panPosition: { x: number; y: number };

  // Actions
  setWorkflow: (data: Partial<WorkflowState>) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => string;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => string;
  addEdge: (edge: Omit<WorkflowEdge, "id">) => string;
  removeEdge: (edgeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  setVariable: (key: string, value: unknown) => void;
  removeVariable: (key: string) => void;
  updateSettings: (settings: Partial<WorkflowSettings>) => void;
  togglePanel: () => void;
  setZoom: (zoom: number) => void;
  setPanPosition: (position: { x: number; y: number }) => void;
  resetEditor: () => void;
  markClean: () => void;

  // Serialization
  toJSON: () => {
    name: string;
    description: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables: Record<string, unknown>;
    settings: WorkflowSettings;
    tags: string[];
  };
}

const defaultSettings: WorkflowSettings = {
  timezone: "UTC",
  maxExecutionTime: 300000,
  retryOnFailure: false,
  notifyOnFailure: false,
  notifyOnSuccess: false,
  logLevel: "info",
  concurrency: 1,
};

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      // Initial state
      id: null,
      name: "Untitled Workflow",
      description: "",
      status: "draft",
      nodes: [],
      edges: [],
      variables: {},
      settings: defaultSettings,
      tags: [],
      version: 1,
      isDirty: false,
      selectedNodeId: null,
      selectedEdgeId: null,
      isPanelOpen: true,
      zoom: 1,
      panPosition: { x: 0, y: 0 },

      setWorkflow: (data) => {
        set({ ...data, isDirty: false });
      },

      addNode: (type, position) => {
        const definition = getNodeDefinition(type);
        if (!definition) throw new Error(`Unknown node type: ${type}`);

        const nodeId = `node-${uuidv4().substring(0, 8)}`;
        const newNode: WorkflowNode = {
          id: nodeId,
          type,
          category: definition.category,
          label: definition.label,
          position,
          config: {},
          inputs: definition.inputs.map((p) => ({ ...p })),
          outputs: definition.outputs.map((p) => ({ ...p })),
        };

        // Set default config values
        for (const field of definition.configSchema) {
          if (field.defaultValue !== undefined) {
            newNode.config[field.key] = field.defaultValue;
          }
        }

        set((state) => ({
          nodes: [...state.nodes, newNode],
          isDirty: true,
        }));

        return nodeId;
      },

      updateNode: (nodeId, updates) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, ...updates } : n
          ),
          isDirty: true,
        }));
      },

      removeNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
          selectedNodeId:
            state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          isDirty: true,
        }));
      },

      duplicateNode: (nodeId) => {
        const state = get();
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        const newId = `node-${uuidv4().substring(0, 8)}`;
        const newNode: WorkflowNode = {
          ...JSON.parse(JSON.stringify(node)),
          id: newId,
          label: `${node.label} (copy)`,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
        };

        set((state) => ({
          nodes: [...state.nodes, newNode],
          isDirty: true,
        }));

        return newId;
      },

      addEdge: (edge) => {
        const edgeId = `edge-${uuidv4().substring(0, 8)}`;
        const newEdge: WorkflowEdge = { ...edge, id: edgeId };

        // Check for duplicate edges
        const exists = get().edges.some(
          (e) =>
            e.source === edge.source &&
            e.sourceHandle === edge.sourceHandle &&
            e.target === edge.target &&
            e.targetHandle === edge.targetHandle
        );
        if (exists) return "";

        set((state) => ({
          edges: [...state.edges, newEdge],
          isDirty: true,
        }));

        return edgeId;
      },

      removeEdge: (edgeId) => {
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== edgeId),
          selectedEdgeId:
            state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
          isDirty: true,
        }));
      },

      selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId, selectedEdgeId: null, isPanelOpen: !!nodeId });
      },

      selectEdge: (edgeId) => {
        set({ selectedEdgeId: edgeId, selectedNodeId: null });
      },

      updateNodeConfig: (nodeId, config) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
          ),
          isDirty: true,
        }));
      },

      updateNodePosition: (nodeId, position) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, position } : n
          ),
        }));
      },

      setVariable: (key, value) => {
        set((state) => ({
          variables: { ...state.variables, [key]: value },
          isDirty: true,
        }));
      },

      removeVariable: (key) => {
        set((state) => {
          const { [key]: _, ...rest } = state.variables;
          return { variables: rest, isDirty: true };
        });
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
          isDirty: true,
        }));
      },

      togglePanel: () => {
        set((state) => ({ isPanelOpen: !state.isPanelOpen }));
      },

      setZoom: (zoom) => set({ zoom }),
      setPanPosition: (panPosition) => set({ panPosition }),

      resetEditor: () => {
        set({
          id: null,
          name: "Untitled Workflow",
          description: "",
          status: "draft",
          nodes: [],
          edges: [],
          variables: {},
          settings: defaultSettings,
          tags: [],
          version: 1,
          isDirty: false,
          selectedNodeId: null,
          selectedEdgeId: null,
          isPanelOpen: true,
          zoom: 1,
          panPosition: { x: 0, y: 0 },
        });
      },

      markClean: () => set({ isDirty: false }),

      toJSON: () => {
        const state = get();
        return {
          name: state.name,
          description: state.description,
          nodes: state.nodes,
          edges: state.edges,
          variables: state.variables,
          settings: state.settings,
          tags: state.tags,
        };
      },
    }),
    { name: "workflow-store" }
  )
);
