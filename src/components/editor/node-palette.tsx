"use client";

import React, { useState } from "react";
import {
  Zap, Bot, Play, GitBranch, Repeat, AlertTriangle, Search,
  Brain,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils/cn";
import { NODE_DEFINITIONS, NODE_CATEGORIES } from "@/config/nodes";
import { useWorkflowStore } from "@/store/workflow-store";
import type { NodeType } from "@/types/workflow";

const categoryIcons: Record<string, React.ElementType> = {
  trigger: Zap,
  ai: Brain,
  action: Play,
  condition: GitBranch,
  loop: Repeat,
  error: AlertTriangle,
};

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("trigger");
  const { addNode, nodes } = useWorkflowStore();

  const filteredNodes = searchQuery
    ? NODE_DEFINITIONS.filter(
        (n) =>
          n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : NODE_DEFINITIONS;

  const handleAddNode = (type: NodeType) => {
    // Calculate a good position for the new node
    const existingPositions = nodes.map((n) => n.position);
    const x = existingPositions.length > 0
      ? Math.max(...existingPositions.map((p) => p.x)) + 250
      : 100;
    const y = existingPositions.length > 0
      ? existingPositions[existingPositions.length - 1]?.y || 200
      : 200;

    addNode(type, { x, y });
  };

  return (
    <div className="flex h-full w-72 flex-col border-r bg-card">
      <div className="border-b p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Node Palette</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {searchQuery ? (
            // Search results
            <div className="space-y-1">
              {filteredNodes.map((node) => (
                <button
                  key={node.type}
                  onClick={() => handleAddNode(node.type)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/nexusflow-node", node.type);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
                    style={{ backgroundColor: `${node.color}20`, color: node.color }}
                  >
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{node.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {node.description}
                    </div>
                  </div>
                </button>
              ))}
              {filteredNodes.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No nodes found
                </p>
              )}
            </div>
          ) : (
            // Category view
            <div className="space-y-1">
              {NODE_CATEGORIES.map((category) => {
                const Icon = categoryIcons[category.id] || Zap;
                const categoryNodes = filteredNodes.filter(
                  (n) => n.category === category.id
                );
                const isExpanded = expandedCategory === category.id;

                return (
                  <div key={category.id}>
                    <button
                      onClick={() =>
                        setExpandedCategory(isExpanded ? null : category.id)
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent",
                        isExpanded && "bg-accent"
                      )}
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1">{category.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {categoryNodes.length}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="ml-4 space-y-0.5 border-l py-1 pl-3">
                        {categoryNodes.map((node) => (
                          <button
                            key={node.type}
                            onClick={() => handleAddNode(node.type)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "application/nexusflow-node",
                                node.type
                              );
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                          >
                            <span className="truncate">{node.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <p className="text-xs text-muted-foreground">
          Drag nodes to the canvas or click to add.
          {NODE_DEFINITIONS.length} nodes available.
        </p>
      </div>
    </div>
  );
}
