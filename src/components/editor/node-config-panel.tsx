"use client";

import React from "react";
import { X, Trash2, Copy, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflowStore } from "@/store/workflow-store";
import { getNodeDefinition } from "@/config/nodes";
import type { ConfigField } from "@/types/workflow";

export function NodeConfigPanel() {
  const {
    nodes,
    selectedNodeId,
    selectNode,
    updateNode,
    updateNodeConfig,
    removeNode,
    duplicateNode,
  } = useWorkflowStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNode) return null;

  const definition = getNodeDefinition(selectedNode.type);
  if (!definition) return null;

  return (
    <div className="flex h-full w-80 flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{selectedNode.label}</h3>
          <p className="text-xs text-muted-foreground">
            {selectedNode.type.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => duplicateNode(selectedNode.id)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => {
              removeNode(selectedNode.id);
              selectNode(null);
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => selectNode(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="flex-1">
        <TabsList className="mx-4 mt-2 w-[calc(100%-2rem)]">
          <TabsTrigger value="config" className="flex-1">Config</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="flex-1">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-4 p-4">
              {/* Node label */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Node Label
                </label>
                <Input
                  value={selectedNode.label}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { label: e.target.value })
                  }
                  placeholder="Node label"
                />
              </div>

              {/* Config fields */}
              {definition.configSchema.map((field) => (
                <ConfigFieldInput
                  key={field.key}
                  field={field}
                  value={selectedNode.config[field.key]}
                  onChange={(value) =>
                    updateNodeConfig(selectedNode.id, { [field.key]: value })
                  }
                />
              ))}

              {/* Credential selector */}
              {definition.credentialType && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Credential
                  </label>
                  <Select
                    value={selectedNode.credentialId || ""}
                    onValueChange={(value) =>
                      updateNode(selectedNode.id, { credentialId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credential..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No credential</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Type: {definition.credentialType}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="flex-1">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-4 p-4">
              {/* Disable toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium">Disable Node</label>
                  <p className="text-xs text-muted-foreground">
                    Skip this node during execution
                  </p>
                </div>
                <Switch
                  checked={selectedNode.isDisabled || false}
                  onCheckedChange={(checked) =>
                    updateNode(selectedNode.id, { isDisabled: checked })
                  }
                />
              </div>

              {/* Retry config */}
              <div className="space-y-3 rounded-lg border p-3">
                <h4 className="text-xs font-semibold">Retry Configuration</h4>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Max Retries
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={selectedNode.retryConfig?.maxRetries || 0}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        retryConfig: {
                          maxRetries: parseInt(e.target.value) || 0,
                          retryDelay:
                            selectedNode.retryConfig?.retryDelay || 1000,
                          backoffMultiplier:
                            selectedNode.retryConfig?.backoffMultiplier || 2,
                          retryOn: selectedNode.retryConfig?.retryOn || [],
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Retry Delay (ms)
                  </label>
                  <Input
                    type="number"
                    min={100}
                    value={selectedNode.retryConfig?.retryDelay || 1000}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        retryConfig: {
                          maxRetries:
                            selectedNode.retryConfig?.maxRetries || 0,
                          retryDelay: parseInt(e.target.value) || 1000,
                          backoffMultiplier:
                            selectedNode.retryConfig?.backoffMultiplier || 2,
                          retryOn: selectedNode.retryConfig?.retryOn || [],
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Backoff Multiplier
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={selectedNode.retryConfig?.backoffMultiplier || 2}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        retryConfig: {
                          maxRetries:
                            selectedNode.retryConfig?.maxRetries || 0,
                          retryDelay:
                            selectedNode.retryConfig?.retryDelay || 1000,
                          backoffMultiplier:
                            parseFloat(e.target.value) || 2,
                          retryOn: selectedNode.retryConfig?.retryOn || [],
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Node info */}
              <div className="rounded-lg border p-3">
                <h4 className="text-xs font-semibold">Node Info</h4>
                <dl className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">ID</dt>
                    <dd className="font-mono">{selectedNode.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd>{selectedNode.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>{selectedNode.category}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Inputs</dt>
                    <dd>{selectedNode.inputs.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Outputs</dt>
                    <dd>{selectedNode.outputs.length}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Config Field Components ---

function ConfigFieldInput({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case "string":
    case "expression":
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </label>
          <Input
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
          {field.description && (
            <p className="mt-1 text-xs text-muted-foreground">{field.description}</p>
          )}
          {field.type === "expression" && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Use {"{{nodeId.field}}"} for dynamic values
            </p>
          )}
        </div>
      );

    case "number":
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </label>
          <Input
            type="number"
            value={value !== undefined ? Number(value) : ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">
            {field.label}
          </label>
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </label>
          <Select
            value={String(value || field.defaultValue || "")}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "code":
    case "json":
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </label>
          <Textarea
            value={
              typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value || "")
            }
            onChange={(e) => {
              if (field.type === "json") {
                try {
                  onChange(JSON.parse(e.target.value));
                } catch {
                  onChange(e.target.value);
                }
              } else {
                onChange(e.target.value);
              }
            }}
            placeholder={field.placeholder}
            className="min-h-[100px] font-mono text-xs"
          />
        </div>
      );

    case "keyvalue":
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            {field.label}
          </label>
          <KeyValueEditor
            value={(value as Record<string, string>) || {}}
            onChange={onChange}
          />
        </div>
      );

    case "array":
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            {field.label}
          </label>
          <Textarea
            value={Array.isArray(value) ? value.join("\n") : String(value || "")}
            onChange={(e) =>
              onChange(e.target.value.split("\n").filter(Boolean))
            }
            placeholder={field.placeholder || "One item per line"}
            className="min-h-[80px] text-xs"
          />
        </div>
      );

    default:
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            {field.label}
          </label>
          <Input
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}

function KeyValueEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (value: unknown) => void;
}) {
  const entries = Object.entries(value || {});

  const updateEntry = (index: number, key: string, val: string) => {
    const newEntries = [...entries];
    newEntries[index] = [key, val];
    onChange(Object.fromEntries(newEntries));
  };

  const addEntry = () => {
    onChange({ ...value, "": "" });
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(Object.fromEntries(newEntries));
  };

  return (
    <div className="space-y-2">
      {entries.map(([k, v], index) => (
        <div key={index} className="flex gap-1">
          <Input
            value={k}
            onChange={(e) => updateEntry(index, e.target.value, v)}
            placeholder="Key"
            className="h-8 text-xs"
          />
          <Input
            value={v}
            onChange={(e) => updateEntry(index, k, e.target.value)}
            placeholder="Value"
            className="h-8 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => removeEntry(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-full text-xs"
        onClick={addEntry}
      >
        Add Entry
      </Button>
    </div>
  );
}
