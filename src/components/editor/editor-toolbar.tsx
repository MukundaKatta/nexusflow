"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Play, Pause, ArrowLeft, Settings, Undo2, Redo2,
  Download, Upload, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkflowStore } from "@/store/workflow-store";

export function EditorToolbar() {
  const router = useRouter();
  const {
    id,
    name,
    status,
    isDirty,
    nodes,
    edges,
    setWorkflow,
    toJSON,
  } = useWorkflowStore();
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = toJSON();
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/workflows?id=${id}` : "/api/workflows";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (!id && result.data?.id) {
          setWorkflow({ id: result.data.id });
          router.replace(`/editor/${result.data.id}`);
        }
        setWorkflow({ isDirty: false });
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!id) return;
    const newStatus = status === "active" ? "paused" : "active";
    try {
      await fetch(`/api/workflows?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setWorkflow({ status: newStatus });
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const handleTestRun = async () => {
    if (!id) {
      await handleSave();
      return;
    }

    try {
      const response = await fetch("/api/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: id,
          triggerType: "manual",
          triggerData: {},
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/executions?id=${result.data?.executionId}`);
      }
    } catch (error) {
      console.error("Test run failed:", error);
    }
  };

  const handleExport = () => {
    const data = toJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.nexusflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = {
    draft: "secondary",
    active: "success",
    paused: "warning",
    archived: "outline",
  } as const;

  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/workflows")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {isEditingName ? (
          <Input
            value={name}
            onChange={(e) => setWorkflow({ name: e.target.value })}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
            className="h-8 w-64"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="text-sm font-semibold hover:underline"
          >
            {name}
          </button>
        )}

        <Badge variant={statusColor[status]}>{status}</Badge>

        {isDirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}

        <span className="text-xs text-muted-foreground">
          {nodes.length} nodes, {edges.length} edges
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1.5 h-4 w-4" />
          Export
        </Button>

        <Button variant="outline" size="sm" onClick={handleTestRun}>
          <Eye className="mr-1.5 h-4 w-4" />
          Test Run
        </Button>

        <Button
          variant={status === "active" ? "outline" : "default"}
          size="sm"
          onClick={handleActivate}
          disabled={!id}
        >
          {status === "active" ? (
            <>
              <Pause className="mr-1.5 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-1.5 h-4 w-4" />
              Activate
            </>
          )}
        </Button>

        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="mr-1.5 h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
