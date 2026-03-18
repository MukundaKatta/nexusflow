"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, MoreHorizontal, Play, Pause, Trash2, Copy,
  Workflow, Clock, CheckCircle2, XCircle, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  nodes: unknown[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchWorkflows();
  }, [statusFilter]);

  const fetchWorkflows = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/workflows?${params}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await fetch(`/api/workflows?id=${id}`, { method: "DELETE" });
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, "default" | "success" | "warning" | "secondary"> = {
    draft: "secondary",
    active: "success",
    paused: "warning",
    archived: "default",
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage your automation workflows
          </p>
        </div>
        <Button onClick={() => router.push("/editor/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <Input
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Workflows", value: workflows.length, icon: Workflow },
          { label: "Active", value: workflows.filter((w) => w.status === "active").length, icon: Play },
          { label: "Draft", value: workflows.filter((w) => w.status === "draft").length, icon: Clock },
          { label: "Paused", value: workflows.filter((w) => w.status === "paused").length, icon: Pause },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Workflow className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No workflows yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first workflow to get started
            </p>
            <Button className="mt-4" onClick={() => router.push("/editor/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkflows.map((workflow) => {
            const nodeCount = Array.isArray(workflow.nodes)
              ? workflow.nodes.length
              : 0;

            return (
              <Card
                key={workflow.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/editor/${workflow.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">
                        {workflow.name}
                      </CardTitle>
                      {workflow.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {workflow.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={statusColors[workflow.status] || "default"}>
                      {workflow.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{nodeCount} nodes</span>
                    <span>
                      Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/editor/${workflow.id}`);
                      }}
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(workflow.id);
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
