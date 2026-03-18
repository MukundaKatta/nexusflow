// ============================================================
// NexusFlow — Database Seed (Workflow Templates)
// ============================================================

import { db, schema } from "./index";

const templates = [
  {
    name: "Webhook to Slack Notification",
    description: "Receive a webhook and send a formatted message to Slack",
    category: "notifications",
    tags: JSON.stringify(["webhook", "slack", "notification"]),
    icon: "MessageSquare",
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "webhook",
        category: "trigger",
        label: "Webhook Trigger",
        position: { x: 100, y: 200 },
        config: { method: "POST", path: "/slack-notify", authentication: "none" },
        inputs: [],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "slack-1",
        type: "slack_message",
        category: "action",
        label: "Send Slack Message",
        position: { x: 400, y: 200 },
        config: {
          channel: "#notifications",
          text: "New event: {{trigger.body.message}}",
        },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
        credentialId: "",
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", sourceHandle: "output", target: "slack-1", targetHandle: "input" },
    ]),
    settings: JSON.stringify({ timezone: "UTC", maxExecutionTime: 30000, logLevel: "info", concurrency: 1 }),
    popularity: 95,
  },
  {
    name: "Scheduled Data Sync",
    description: "Fetch data from an API on a schedule and save to a database",
    category: "data",
    tags: JSON.stringify(["schedule", "api", "database", "sync"]),
    icon: "RefreshCw",
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "schedule",
        category: "trigger",
        label: "Every Hour",
        position: { x: 100, y: 200 },
        config: { cron: "0 * * * *", timezone: "UTC" },
        inputs: [],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "http-1",
        type: "http_request",
        category: "action",
        label: "Fetch API Data",
        position: { x: 350, y: 200 },
        config: { method: "GET", url: "https://api.example.com/data", bodyType: "none" },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "db-1",
        type: "database_query",
        category: "action",
        label: "Save to DB",
        position: { x: 600, y: 200 },
        config: {
          dbType: "postgres",
          query: "INSERT INTO sync_data (payload, synced_at) VALUES ($1, NOW())",
        },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", sourceHandle: "output", target: "http-1", targetHandle: "input" },
      { id: "e2", source: "http-1", sourceHandle: "output", target: "db-1", targetHandle: "input" },
    ]),
    settings: JSON.stringify({ timezone: "UTC", maxExecutionTime: 60000, logLevel: "info", concurrency: 1 }),
    popularity: 88,
  },
  {
    name: "AI Email Classifier",
    description: "Classify incoming emails using AI and route to appropriate channels",
    category: "ai",
    tags: JSON.stringify(["ai", "email", "classification", "routing"]),
    icon: "Brain",
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "email_received",
        category: "trigger",
        label: "Email Received",
        position: { x: 100, y: 250 },
        config: { mailbox: "INBOX", pollInterval: 60 },
        inputs: [],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "classify-1",
        type: "classify",
        category: "ai",
        label: "Classify Email",
        position: { x: 350, y: 250 },
        config: {
          text: "{{trigger.subject}} {{trigger.body}}",
          categories: ["support", "sales", "billing", "spam"],
          confidence: 0.7,
        },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "condition-1",
        type: "condition",
        category: "condition",
        label: "Route by Category",
        position: { x: 600, y: 250 },
        config: { expression: "{{classify-1.category}} !== 'spam'", mode: "expression" },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [
          { id: "true", label: "Valid", type: "output" },
          { id: "false", label: "Spam", type: "output" },
        ],
      },
      {
        id: "slack-1",
        type: "slack_message",
        category: "action",
        label: "Notify Team",
        position: { x: 850, y: 150 },
        config: {
          channel: "#{{classify-1.category}}",
          text: "New {{classify-1.category}} email from {{trigger.from}}: {{trigger.subject}}",
        },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", sourceHandle: "output", target: "classify-1", targetHandle: "input" },
      { id: "e2", source: "classify-1", sourceHandle: "output", target: "condition-1", targetHandle: "input" },
      { id: "e3", source: "condition-1", sourceHandle: "true", target: "slack-1", targetHandle: "input" },
    ]),
    settings: JSON.stringify({ timezone: "UTC", maxExecutionTime: 60000, logLevel: "info", concurrency: 1 }),
    popularity: 92,
  },
  {
    name: "Content Summarizer",
    description: "Fetch a URL, extract content, and generate an AI summary",
    category: "ai",
    tags: JSON.stringify(["ai", "summarize", "content", "web"]),
    icon: "FileText",
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "manual",
        category: "trigger",
        label: "Manual Trigger",
        position: { x: 100, y: 200 },
        config: { inputSchema: '{"url": "string"}' },
        inputs: [],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "http-1",
        type: "http_request",
        category: "action",
        label: "Fetch URL",
        position: { x: 350, y: 200 },
        config: { method: "GET", url: "{{trigger.url}}", bodyType: "none" },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "summarize-1",
        type: "summarize",
        category: "ai",
        label: "Summarize Content",
        position: { x: 600, y: 200 },
        config: { text: "{{http-1.body}}", length: "short", format: "bullets" },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", sourceHandle: "output", target: "http-1", targetHandle: "input" },
      { id: "e2", source: "http-1", sourceHandle: "output", target: "summarize-1", targetHandle: "input" },
    ]),
    settings: JSON.stringify({ timezone: "UTC", maxExecutionTime: 120000, logLevel: "info", concurrency: 1 }),
    popularity: 85,
  },
  {
    name: "Batch Data Processor",
    description: "Process a list of items using a loop with error handling",
    category: "data",
    tags: JSON.stringify(["loop", "batch", "error-handling"]),
    icon: "Repeat",
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "webhook",
        category: "trigger",
        label: "Receive Data",
        position: { x: 100, y: 200 },
        config: { method: "POST", path: "/batch-process" },
        inputs: [],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "loop-1",
        type: "loop",
        category: "loop",
        label: "Process Items",
        position: { x: 350, y: 200 },
        config: { array: "{{trigger.body.items}}", batchSize: 1, concurrency: 5 },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [
          { id: "item", label: "Current Item", type: "output" },
          { id: "done", label: "Done", type: "output" },
        ],
      },
      {
        id: "http-1",
        type: "http_request",
        category: "action",
        label: "Process Item",
        position: { x: 600, y: 150 },
        config: { method: "POST", url: "https://api.example.com/process", body: "{{loop-1.item}}" },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
        retryConfig: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2, retryOn: ["TIMEOUT", "500"] },
      },
      {
        id: "response-1",
        type: "webhook_response",
        category: "action",
        label: "Send Response",
        position: { x: 600, y: 300 },
        config: { statusCode: 200, body: '{"processed": {{loop-1.totalProcessed}}}' },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", sourceHandle: "output", target: "loop-1", targetHandle: "input" },
      { id: "e2", source: "loop-1", sourceHandle: "item", target: "http-1", targetHandle: "input" },
      { id: "e3", source: "loop-1", sourceHandle: "done", target: "response-1", targetHandle: "input" },
    ]),
    settings: JSON.stringify({ timezone: "UTC", maxExecutionTime: 300000, logLevel: "info", concurrency: 1 }),
    popularity: 78,
  },
  {
    name: "Sentiment Monitor",
    description: "Analyze sentiment of incoming messages and alert on negative trends",
    category: "ai",
    tags: JSON.stringify(["ai", "sentiment", "monitoring", "alerts"]),
    icon: "Heart",
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "webhook",
        category: "trigger",
        label: "Receive Message",
        position: { x: 100, y: 200 },
        config: { method: "POST", path: "/sentiment-check" },
        inputs: [],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "sentiment-1",
        type: "sentiment",
        category: "ai",
        label: "Analyze Sentiment",
        position: { x: 350, y: 200 },
        config: { text: "{{trigger.body.message}}", granularity: "document" },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
      {
        id: "condition-1",
        type: "condition",
        category: "condition",
        label: "Is Negative?",
        position: { x: 600, y: 200 },
        config: { expression: "{{sentiment-1.score}} < -0.5", mode: "expression" },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [
          { id: "true", label: "Negative", type: "output" },
          { id: "false", label: "OK", type: "output" },
        ],
      },
      {
        id: "slack-1",
        type: "slack_message",
        category: "action",
        label: "Alert Team",
        position: { x: 850, y: 100 },
        config: {
          channel: "#alerts",
          text: "Negative sentiment detected (score: {{sentiment-1.score}}): {{trigger.body.message}}",
        },
        inputs: [{ id: "input", label: "Input", type: "input" }],
        outputs: [{ id: "output", label: "Output", type: "output" }],
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", sourceHandle: "output", target: "sentiment-1", targetHandle: "input" },
      { id: "e2", source: "sentiment-1", sourceHandle: "output", target: "condition-1", targetHandle: "input" },
      { id: "e3", source: "condition-1", sourceHandle: "true", target: "slack-1", targetHandle: "input" },
    ]),
    settings: JSON.stringify({ timezone: "UTC", maxExecutionTime: 30000, logLevel: "info", concurrency: 1 }),
    popularity: 82,
  },
];

async function seed() {
  console.log("Seeding workflow templates...");

  for (const template of templates) {
    await db.insert(schema.workflowTemplates).values(template);
    console.log(`  Created template: ${template.name}`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
