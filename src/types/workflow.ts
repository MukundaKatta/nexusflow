// ============================================================
// NexusFlow — Core Workflow Type Definitions
// ============================================================

export type NodeCategory =
  | "trigger"
  | "action"
  | "condition"
  | "loop"
  | "ai"
  | "error"
  | "utility";

export type TriggerType =
  | "webhook"
  | "schedule"
  | "email_received"
  | "file_uploaded"
  | "manual";

export type AINodeType =
  | "llm_chat"
  | "summarize"
  | "classify"
  | "extract"
  | "translate"
  | "sentiment";

export type IntegrationNodeType =
  | "http_request"
  | "email_send"
  | "slack_message"
  | "discord_message"
  | "google_sheets"
  | "database_query"
  | "s3_upload"
  | "s3_download"
  | "webhook_response"
  | "delay"
  | "set_variable"
  | "code_execute"
  | "json_transform"
  | "csv_parse"
  | "xml_parse"
  | "html_extract"
  | "file_read"
  | "file_write"
  | "ftp_upload"
  | "ftp_download"
  | "ssh_command"
  | "graphql_request"
  | "soap_request"
  | "mqtt_publish"
  | "redis_command"
  | "mongodb_query"
  | "mysql_query"
  | "postgres_query"
  | "firebase_read"
  | "firebase_write"
  | "twilio_sms"
  | "twilio_call"
  | "stripe_charge"
  | "stripe_webhook"
  | "github_api"
  | "jira_api"
  | "notion_api"
  | "airtable_api"
  | "hubspot_api"
  | "salesforce_api"
  | "zendesk_api"
  | "mailchimp_api"
  | "sendgrid_email"
  | "telegram_message"
  | "whatsapp_message"
  | "pdf_generate"
  | "image_resize"
  | "qr_generate"
  | "crypto_encrypt"
  | "crypto_decrypt"
  | "jwt_sign"
  | "jwt_verify"
  | "base64_encode"
  | "base64_decode"
  | "hash_generate"
  | "regex_match"
  | "math_compute";

export type NodeType =
  | TriggerType
  | AINodeType
  | IntegrationNodeType
  | "condition"
  | "loop"
  | "error_handler"
  | "retry"
  | "fallback";

export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "waiting"
  | "skipped";

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

// --- Node Definition ---

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodePort {
  id: string;
  label: string;
  type: "input" | "output";
}

export interface NodeConfig {
  [key: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  category: NodeCategory;
  label: string;
  description?: string;
  position: NodePosition;
  config: NodeConfig;
  inputs: NodePort[];
  outputs: NodePort[];
  credentialId?: string;
  retryConfig?: RetryConfig;
  errorHandlerId?: string;
  isDisabled?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  label?: string;
  condition?: string;
}

// --- Retry / Error ---

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // ms
  backoffMultiplier: number;
  retryOn: string[]; // error codes
}

export interface ErrorHandlerConfig {
  type: "retry" | "fallback" | "notification" | "ignore";
  fallbackNodeId?: string;
  notificationChannel?: string;
  notificationMessage?: string;
}

// --- Workflow ---

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, unknown>;
  settings: WorkflowSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  version: number;
  templateId?: string;
}

export interface WorkflowSettings {
  timezone: string;
  maxExecutionTime: number; // ms
  retryOnFailure: boolean;
  notifyOnFailure: boolean;
  notifyOnSuccess: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  concurrency: number;
}

// --- Execution ---

export interface Execution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  triggerType: TriggerType;
  triggerData?: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  nodeExecutions: NodeExecution[];
  error?: string;
  output?: Record<string, unknown>;
}

export interface NodeExecution {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: NodeType;
  status: ExecutionStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  retryCount: number;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: Record<string, unknown>;
}

// --- Credential ---

export interface Credential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // encrypted data is never sent to client
}

export interface CredentialData {
  [key: string]: string;
}

// --- Template ---

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, unknown>;
  settings: WorkflowSettings;
  icon: string;
  popularity: number;
  createdAt: string;
}

// --- Node Registry ---

export interface NodeDefinition {
  type: NodeType;
  category: NodeCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  inputs: NodePort[];
  outputs: NodePort[];
  configSchema: ConfigField[];
  credentialType?: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select" | "code" | "json" | "expression" | "credential" | "array" | "keyvalue";
  description?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// --- API Types ---

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface WebhookPayload {
  workflowId: string;
  headers: Record<string, string>;
  body: unknown;
  method: string;
  query: Record<string, string>;
  timestamp: string;
}

export interface ScheduleConfig {
  cron: string;
  timezone: string;
  enabled: boolean;
}
