"use client";

import React, { useState, useEffect } from "react";
import {
  History, CheckCircle2, XCircle, Clock, Loader2,
  ChevronDown, ChevronRight, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExecutionItem {
  id: string;
  workflowId: string;
  status: string;
  triggerType: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

interface NodeExecutionItem {
  id: string;
  nodeId: string;
  nodeType: string;
  status: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  logs: { timestamp: string; level: string; message: string }[];
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<ExecutionItem[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [nodeExecutions, setNodeExecutions] = useState<NodeExecutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      const response = await fetch("/api/executions");
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch executions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNodeExecutions = async (executionId: string) => {
    try {
      const response = await fetch(`/api/executions?id=${executionId}`);
      if (response.ok) {
        const data = await response.json();
        setNodeExecutions(data.data?.nodeExecutions || []);
      }
    } catch (error) {
      console.error("Failed to fetch node executions:", error);
    }
  };

  const handleSelectExecution = (id: string) => {
    setSelectedExecution(id);
    fetchNodeExecutions(id);
  };

  const statusIcons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    running: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    cancelled: <AlertCircle className="h-4 w-4 text-gray-500" />,
  };

  const statusColors: Record<string, "success" | "destructive" | "default" | "warning" | "secondary"> = {
    completed: "success",
    failed: "destructive",
    running: "default",
    pending: "warning",
    cancelled: "secondary",
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "--";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Execution History</h1>
        <p className="mt-1 text-muted-foreground">
          View detailed logs and status for all workflow executions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Execution list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Executions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {loading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : executions.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <History className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No executions yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {executions.map((execution) => (
                      <button
                        key={execution.id}
                        onClick={() => handleSelectExecution(execution.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                          selectedExecution === execution.id ? "bg-accent" : ""
                        }`}
                      >
                        {statusIcons[execution.status] || statusIcons.pending}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {execution.id.substring(0, 8)}
                            </span>
                            <Badge
                              variant={statusColors[execution.status] || "default"}
                              className="text-[10px]"
                            >
                              {execution.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{execution.triggerType}</span>
                            <span>{formatDuration(execution.duration)}</span>
                            <span>
                              {new Date(execution.startedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Execution detail */}
        <div className="lg:col-span-3">
          {selectedExecution ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Execution Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="space-y-3">
                    {nodeExecutions.map((nodeExec) => (
                      <div
                        key={nodeExec.id}
                        className="rounded-lg border"
                      >
                        <button
                          className="flex w-full items-center gap-3 p-3 text-left"
                          onClick={() => {
                            const next = new Set(expandedNodes);
                            if (next.has(nodeExec.id)) {
                              next.delete(nodeExec.id);
                            } else {
                              next.add(nodeExec.id);
                            }
                            setExpandedNodes(next);
                          }}
                        >
                          {expandedNodes.has(nodeExec.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {statusIcons[nodeExec.status] || statusIcons.pending}
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium">
                              {nodeExec.nodeId}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({nodeExec.nodeType})
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(nodeExec.duration)}
                          </span>
                        </button>

                        {expandedNodes.has(nodeExec.id) && (
                          <div className="border-t p-3">
                            {nodeExec.error && (
                              <div className="mb-2 rounded bg-red-500/10 p-2 text-xs text-red-500">
                                {nodeExec.error}
                              </div>
                            )}
                            {nodeExec.input && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold">Input:</span>
                                <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                                  {JSON.stringify(nodeExec.input, null, 2)}
                                </pre>
                              </div>
                            )}
                            {nodeExec.output && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold">Output:</span>
                                <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                                  {JSON.stringify(nodeExec.output, null, 2)}
                                </pre>
                              </div>
                            )}
                            {nodeExec.logs?.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold">Logs:</span>
                                <div className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2">
                                  {nodeExec.logs.map((log, i) => (
                                    <div
                                      key={i}
                                      className={`text-xs ${
                                        log.level === "error"
                                          ? "text-red-500"
                                          : log.level === "warn"
                                          ? "text-yellow-500"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      [{log.timestamp}] [{log.level}] {log.message}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-24">
                <History className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select an execution to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
