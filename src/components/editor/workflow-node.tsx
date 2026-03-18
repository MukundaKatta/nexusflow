"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Zap, Bot, Globe, Mail, MessageSquare, GitBranch, Repeat,
  AlertTriangle, Clock, Play, Upload, Database, Code, Hash,
  Shield, Lock, Unlock, Binary, Send, CreditCard, Table,
  FileText, Heart, Tags, Search, Languages, Timer, Variable,
  Braces, Webhook, CloudUpload, CloudDownload, Reply,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WorkflowNode } from "@/types/workflow";

const iconMap: Record<string, React.ElementType> = {
  Webhook: Zap, Zap, Bot, Globe, Mail, MessageSquare, GitBranch,
  Repeat, AlertTriangle, Clock, Play, Upload, Database, Code,
  Hash, Shield, Lock, Unlock, Binary, Send, CreditCard, Table,
  FileText, Heart, Tags, Search, Languages, Timer, Variable,
  Braces, CloudUpload, CloudDownload, Reply, MessageCircle: MessageSquare,
  ShieldCheck: Shield, Code2: Code, Workflow: GitBranch,
  FileSpreadsheet: Table, Smartphone: Globe, BookOpen: FileText,
  LayoutGrid: Table, Image: FileText, QrCode: Hash, Calculator: Hash,
  FileCode: Code, Users: Globe, Cloud: Globe, Bug: AlertTriangle,
  Headphones: Globe, Regex: Hash,
};

const categoryColors: Record<string, string> = {
  trigger: "border-green-500 bg-green-500/10",
  ai: "border-purple-500 bg-purple-500/10",
  action: "border-blue-500 bg-blue-500/10",
  condition: "border-yellow-500 bg-yellow-500/10",
  loop: "border-cyan-500 bg-cyan-500/10",
  error: "border-red-500 bg-red-500/10",
  utility: "border-gray-500 bg-gray-500/10",
};

const categoryIconColors: Record<string, string> = {
  trigger: "bg-green-500 text-white",
  ai: "bg-purple-500 text-white",
  action: "bg-blue-500 text-white",
  condition: "bg-yellow-500 text-white",
  loop: "bg-cyan-500 text-white",
  error: "bg-red-500 text-white",
  utility: "bg-gray-500 text-white",
};

function WorkflowNodeInner({ data }: NodeProps<WorkflowNode & { onSelect: () => void }>) {
  const IconComponent = iconMap[data.type] || iconMap[data.category] || Zap;

  return (
    <div
      className={cn(
        "relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-shadow hover:shadow-lg",
        categoryColors[data.category] || "border-gray-500",
        data.isDisabled && "opacity-50"
      )}
    >
      {/* Input handles */}
      {data.inputs?.map((port, index) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
          style={{
            top: `${((index + 1) / (data.inputs.length + 1)) * 100}%`,
          }}
        />
      ))}

      {/* Node content */}
      <div className="flex items-center gap-3 p-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            categoryIconColors[data.category]
          )}
        >
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {data.label}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {data.type.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Output handles */}
      {data.outputs?.map((port, index) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          className={cn(
            "!h-3 !w-3 !border-2 !border-background",
            port.id === "true" && "!bg-green-500",
            port.id === "false" && "!bg-red-500",
            port.id === "item" && "!bg-cyan-500",
            port.id === "done" && "!bg-blue-500",
            port.id === "output" && "!bg-muted-foreground",
            port.id === "error" && "!bg-red-500"
          )}
          style={{
            top: `${((index + 1) / (data.outputs.length + 1)) * 100}%`,
          }}
        >
          {data.outputs.length > 1 && (
            <span className="absolute left-4 whitespace-nowrap text-[10px] text-muted-foreground">
              {port.label}
            </span>
          )}
        </Handle>
      ))}

      {data.isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50">
          <span className="text-xs font-medium text-muted-foreground">Disabled</span>
        </div>
      )}
    </div>
  );
}

export const WorkflowNodeComponent = memo(WorkflowNodeInner);
