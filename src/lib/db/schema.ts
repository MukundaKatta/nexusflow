// ============================================================
// NexusFlow — Database Schema (Drizzle ORM + Supabase/Postgres)
// ============================================================

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  uuid,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Enums ---

export const workflowStatusEnum = pgEnum("workflow_status", [
  "draft",
  "active",
  "paused",
  "archived",
]);

export const executionStatusEnum = pgEnum("execution_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "waiting",
  "skipped",
]);

export const triggerTypeEnum = pgEnum("trigger_type", [
  "webhook",
  "schedule",
  "email_received",
  "file_uploaded",
  "manual",
]);

export const logLevelEnum = pgEnum("log_level", [
  "debug",
  "info",
  "warn",
  "error",
]);

// --- Tables ---

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    status: workflowStatusEnum("status").notNull().default("draft"),
    nodes: jsonb("nodes").notNull().default("[]"),
    edges: jsonb("edges").notNull().default("[]"),
    variables: jsonb("variables").notNull().default("{}"),
    settings: jsonb("settings").notNull().default("{}"),
    tags: jsonb("tags").notNull().default("[]"),
    version: integer("version").notNull().default(1),
    templateId: uuid("template_id"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("workflows_status_idx").on(table.status),
    createdByIdx: index("workflows_created_by_idx").on(table.createdBy),
  })
);

export const executions = pgTable(
  "executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    status: executionStatusEnum("status").notNull().default("pending"),
    triggerType: triggerTypeEnum("trigger_type").notNull(),
    triggerData: jsonb("trigger_data"),
    output: jsonb("output"),
    error: text("error"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    duration: integer("duration"),
  },
  (table) => ({
    workflowIdx: index("executions_workflow_idx").on(table.workflowId),
    statusIdx: index("executions_status_idx").on(table.status),
    startedAtIdx: index("executions_started_at_idx").on(table.startedAt),
  })
);

export const nodeExecutions = pgTable(
  "node_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    nodeId: text("node_id").notNull(),
    nodeType: text("node_type").notNull(),
    status: executionStatusEnum("status").notNull().default("pending"),
    input: jsonb("input"),
    output: jsonb("output"),
    error: text("error"),
    retryCount: integer("retry_count").notNull().default(0),
    logs: jsonb("logs").notNull().default("[]"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    duration: integer("duration"),
  },
  (table) => ({
    executionIdx: index("node_executions_execution_idx").on(table.executionId),
    nodeIdx: index("node_executions_node_idx").on(table.nodeId),
  })
);

export const credentials = pgTable(
  "credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    encryptedData: text("encrypted_data").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    typeIdx: index("credentials_type_idx").on(table.type),
    createdByIdx: index("credentials_created_by_idx").on(table.createdBy),
  })
);

export const webhooks = pgTable(
  "webhooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    path: text("path").notNull().unique(),
    method: text("method").notNull().default("POST"),
    isActive: boolean("is_active").notNull().default(true),
    secret: text("secret"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pathIdx: index("webhooks_path_idx").on(table.path),
    workflowIdx: index("webhooks_workflow_idx").on(table.workflowId),
  })
);

export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  cron: text("cron").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  isActive: boolean("is_active").notNull().default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workflowTemplates = pgTable("workflow_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  tags: jsonb("tags").notNull().default("[]"),
  nodes: jsonb("nodes").notNull().default("[]"),
  edges: jsonb("edges").notNull().default("[]"),
  variables: jsonb("variables").notNull().default("{}"),
  settings: jsonb("settings").notNull().default("{}"),
  icon: text("icon").notNull().default("Workflow"),
  popularity: integer("popularity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Relations ---

export const workflowRelations = relations(workflows, ({ many }) => ({
  executions: many(executions),
  webhooks: many(webhooks),
  schedules: many(schedules),
}));

export const executionRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id],
  }),
  nodeExecutions: many(nodeExecutions),
}));

export const nodeExecutionRelations = relations(nodeExecutions, ({ one }) => ({
  execution: one(executions, {
    fields: [nodeExecutions.executionId],
    references: [executions.id],
  }),
}));

export const webhookRelations = relations(webhooks, ({ one }) => ({
  workflow: one(workflows, {
    fields: [webhooks.workflowId],
    references: [workflows.id],
  }),
}));

export const scheduleRelations = relations(schedules, ({ one }) => ({
  workflow: one(workflows, {
    fields: [schedules.workflowId],
    references: [workflows.id],
  }),
}));
