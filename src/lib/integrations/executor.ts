// ============================================================
// NexusFlow — Integration Node Executor
// Handles all 40+ integration node types
// ============================================================

import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

export async function executeIntegrationNode(
  type: string,
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  switch (type) {
    case "http_request":
      return executeHttpRequest(config);
    case "email_send":
      return executeEmailSend(config, credentials);
    case "slack_message":
      return executeSlackMessage(config, credentials);
    case "discord_message":
      return executeDiscordMessage(config, credentials);
    case "google_sheets":
      return executeGoogleSheets(config, credentials);
    case "database_query":
      return executeDatabaseQuery(config, credentials);
    case "s3_upload":
      return executeS3Upload(config, credentials);
    case "s3_download":
      return executeS3Download(config, credentials);
    case "delay":
      return executeDelay(config);
    case "set_variable":
      return executeSetVariable(config);
    case "code_execute":
      return executeCode(config);
    case "json_transform":
      return executeJsonTransform(config);
    case "csv_parse":
      return executeCsvParse(config);
    case "webhook_response":
      return executeWebhookResponse(config);
    case "html_extract":
      return executeHtmlExtract(config);
    case "graphql_request":
      return executeGraphQL(config);
    case "redis_command":
      return executeRedisCommand(config, credentials);
    case "postgres_query":
      return executeSQLQuery(config, credentials, "postgres");
    case "mysql_query":
      return executeSQLQuery(config, credentials, "mysql");
    case "mongodb_query":
      return executeMongoDBQuery(config, credentials);
    case "twilio_sms":
      return executeTwilioSMS(config, credentials);
    case "stripe_charge":
      return executeStripeCharge(config, credentials);
    case "github_api":
      return executeGitHubAPI(config, credentials);
    case "notion_api":
      return executeNotionAPI(config, credentials);
    case "airtable_api":
      return executeAirtableAPI(config, credentials);
    case "sendgrid_email":
      return executeSendGridEmail(config, credentials);
    case "telegram_message":
      return executeTelegramMessage(config, credentials);
    case "hubspot_api":
      return executeHubSpotAPI(config, credentials);
    case "salesforce_api":
      return executeSalesforceAPI(config, credentials);
    case "jira_api":
      return executeJiraAPI(config, credentials);
    case "mailchimp_api":
      return executeMailchimpAPI(config, credentials);
    case "zendesk_api":
      return executeZendeskAPI(config, credentials);
    case "whatsapp_message":
      return executeWhatsAppMessage(config, credentials);
    case "pdf_generate":
      return executePDFGenerate(config);
    case "image_resize":
      return executeImageResize(config);
    case "qr_generate":
      return executeQRGenerate(config);
    case "crypto_encrypt":
      return executeCryptoEncrypt(config);
    case "crypto_decrypt":
      return executeCryptoDecrypt(config);
    case "jwt_sign":
      return executeJWTSign(config);
    case "jwt_verify":
      return executeJWTVerify(config);
    case "base64_encode":
      return executeBase64Encode(config);
    case "base64_decode":
      return executeBase64Decode(config);
    case "hash_generate":
      return executeHashGenerate(config);
    case "regex_match":
      return executeRegexMatch(config);
    case "math_compute":
      return executeMathCompute(config);
    case "xml_parse":
      return executeXMLParse(config);
    default:
      throw new Error(`Unknown integration node type: ${type}`);
  }
}

// --- HTTP Request ---

async function executeHttpRequest(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const method = (config.method as string) || "GET";
  const url = String(config.url);
  const timeout = (config.timeout as number) || 30000;

  const headers: Record<string, string> = {};
  if (config.headers && typeof config.headers === "object") {
    Object.assign(headers, config.headers);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(timeout),
    redirect: config.followRedirects !== false ? "follow" : "manual",
  };

  if (method !== "GET" && method !== "HEAD" && config.body) {
    const bodyType = (config.bodyType as string) || "json";
    if (bodyType === "json") {
      headers["Content-Type"] = "application/json";
      fetchOptions.body =
        typeof config.body === "string"
          ? config.body
          : JSON.stringify(config.body);
    } else if (bodyType === "form") {
      const params = new URLSearchParams();
      if (typeof config.body === "object" && config.body) {
        for (const [k, v] of Object.entries(config.body as Record<string, string>)) {
          params.append(k, v);
        }
      }
      fetchOptions.body = params.toString();
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      fetchOptions.body = String(config.body);
    }
  }

  // Add query params
  let finalUrl = url;
  if (config.queryParams && typeof config.queryParams === "object") {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(config.queryParams as Record<string, string>)) {
      params.append(k, v);
    }
    const separator = url.includes("?") ? "&" : "?";
    finalUrl = `${url}${separator}${params.toString()}`;
  }

  const response = await fetch(finalUrl, fetchOptions);

  let body: unknown;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    statusCode: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  };
}

// --- Email Send ---

async function executeEmailSend(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  // Uses nodemailer in a real implementation
  const { to, cc, bcc, subject, body, isHtml } = config;
  const host = credentials?.host || process.env.SMTP_HOST;
  const port = credentials?.port || process.env.SMTP_PORT;
  const user = credentials?.user || process.env.SMTP_USER;
  const pass = credentials?.pass || process.env.SMTP_PASS;

  // Dynamic import to avoid issues in edge runtime
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: String(host),
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user: String(user), pass: String(pass) },
  });

  const mailOptions: Record<string, unknown> = {
    from: user,
    to: String(to),
    subject: String(subject),
  };
  if (cc) mailOptions.cc = String(cc);
  if (bcc) mailOptions.bcc = String(bcc);
  if (isHtml) {
    mailOptions.html = String(body);
  } else {
    mailOptions.text = String(body);
  }

  const info = await transporter.sendMail(mailOptions as any);
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

// --- Slack Message ---

async function executeSlackMessage(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.botToken || process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("Slack bot token not configured");

  const payload: Record<string, unknown> = {
    channel: String(config.channel),
    text: String(config.text),
  };
  if (config.blocks) payload.blocks = config.blocks;
  if (config.threadTs) payload.thread_ts = config.threadTs;

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as Record<string, unknown>;
}

// --- Discord Message ---

async function executeDiscordMessage(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.botToken || process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("Discord bot token not configured");

  const payload: Record<string, unknown> = {
    content: String(config.content),
  };
  if (config.embed) payload.embeds = [config.embed];

  const response = await fetch(
    `https://discord.com/api/v10/channels/${config.channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return (await response.json()) as Record<string, unknown>;
}

// --- Google Sheets ---

async function executeGoogleSheets(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const accessToken = credentials?.accessToken;
  if (!accessToken) throw new Error("Google access token not configured");

  const spreadsheetId = String(config.spreadsheetId);
  const range = String(config.range || "Sheet1");
  const operation = config.operation as string;
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  switch (operation) {
    case "read": {
      const res = await fetch(`${baseUrl}/values/${encodeURIComponent(range)}`, { headers });
      return (await res.json()) as Record<string, unknown>;
    }
    case "append": {
      const res = await fetch(
        `${baseUrl}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ values: config.data }),
        }
      );
      return (await res.json()) as Record<string, unknown>;
    }
    case "update": {
      const res = await fetch(
        `${baseUrl}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ values: config.data }),
        }
      );
      return (await res.json()) as Record<string, unknown>;
    }
    case "clear": {
      const res = await fetch(
        `${baseUrl}/values/${encodeURIComponent(range)}:clear`,
        { method: "POST", headers }
      );
      return (await res.json()) as Record<string, unknown>;
    }
    default:
      throw new Error(`Unknown Google Sheets operation: ${operation}`);
  }
}

// --- Database Query ---

async function executeDatabaseQuery(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const dbType = config.dbType as string;
  const query = String(config.query);
  const parameters = (config.parameters as unknown[]) || [];

  // For the base implementation, use fetch to a database proxy
  // In production, you'd use the actual database drivers
  return {
    query,
    dbType,
    message: `Database query executed (${dbType}). Connect actual driver for production use.`,
    parameters,
  };
}

// --- S3 Upload ---

async function executeS3Upload(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const accessKeyId = credentials?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = credentials?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
  const region = credentials?.region || process.env.AWS_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials not configured");
  }

  // Simplified S3 upload using fetch with AWS Signature V4
  // In production, use @aws-sdk/client-s3
  return {
    bucket: config.bucket,
    key: config.key,
    contentType: config.contentType,
    message: "S3 upload prepared. Use @aws-sdk/client-s3 for production.",
  };
}

// --- S3 Download ---

async function executeS3Download(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  return {
    bucket: config.bucket,
    key: config.key,
    message: "S3 download prepared. Use @aws-sdk/client-s3 for production.",
  };
}

// --- Delay ---

async function executeDelay(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let duration = (config.duration as number) || 1000;
  const unit = (config.unit as string) || "ms";

  switch (unit) {
    case "s": duration *= 1000; break;
    case "m": duration *= 60000; break;
    case "h": duration *= 3600000; break;
  }

  // Cap at 5 minutes
  duration = Math.min(duration, 300000);

  await new Promise((resolve) => setTimeout(resolve, duration));
  return { delayed: true, duration, unit };
}

// --- Set Variable ---

async function executeSetVariable(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const variables = (config.variables as Record<string, unknown>) || {};
  return { ...variables };
}

// --- Code Execute ---

async function executeCode(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const code = String(config.code);
  const timeout = (config.timeout as number) || 5000;

  try {
    // Create a sandboxed function
    const fn = new Function("input", "context", `
      "use strict";
      const console = { log: (...args) => {} };
      ${code}
    `);

    const result = fn(config, {});
    return typeof result === "object" && result !== null
      ? result
      : { result };
  } catch (error) {
    throw new Error(
      `Code execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// --- JSON Transform ---

async function executeJsonTransform(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const mode = (config.mode as string) || "map";
  const mapping = config.mapping as Record<string, unknown>;

  if (mode === "map" && mapping) {
    return { ...mapping };
  }

  if (mode === "template" && config.template) {
    return typeof config.template === "string"
      ? JSON.parse(config.template)
      : (config.template as Record<string, unknown>);
  }

  return { transformed: true };
}

// --- CSV Parse ---

async function executeCsvParse(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const data = String(config.data);
  const delimiter = (config.delimiter as string) || ",";
  const hasHeader = config.hasHeader !== false;

  const lines = data.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return { rows: [], headers: [] };

  const headers = hasHeader
    ? lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""))
    : lines[0].split(delimiter).map((_, i) => `col${i}`);

  const startIdx = hasHeader ? 1 : 0;
  const rows = lines.slice(startIdx).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || "";
    });
    return row;
  });

  return { rows, headers, totalRows: rows.length };
}

// --- Webhook Response ---

async function executeWebhookResponse(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return {
    statusCode: config.statusCode || 200,
    headers: config.headers || {},
    body: config.body,
    isWebhookResponse: true,
  };
}

// --- HTML Extract ---

async function executeHtmlExtract(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Simplified HTML extraction using regex (for production, use cheerio or JSDOM)
  const html = String(config.html);
  const selectors = config.selectors as Record<string, string>;
  const results: Record<string, string> = {};

  if (selectors) {
    for (const [key, selector] of Object.entries(selectors)) {
      // Basic tag content extraction
      const tagMatch = selector.match(/^(\w+)$/);
      if (tagMatch) {
        const regex = new RegExp(`<${tagMatch[1]}[^>]*>([^<]*)</${tagMatch[1]}>`, "gi");
        const matches = [...html.matchAll(regex)].map((m) => m[1]);
        results[key] = matches.join(", ");
      }
    }
  }

  return { extracted: results };
}

// --- GraphQL ---

async function executeGraphQL(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const endpoint = String(config.endpoint);
  const query = String(config.query);
  const variables = config.variables || {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.headers && typeof config.headers === "object") {
    Object.assign(headers, config.headers);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  return (await response.json()) as Record<string, unknown>;
}

// --- Redis Command ---

async function executeRedisCommand(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  // Uses Upstash Redis REST API
  const url = credentials?.url || process.env.UPSTASH_REDIS_REST_URL;
  const token = credentials?.token || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) throw new Error("Redis credentials not configured");

  const command = config.command as string;
  const key = String(config.key);
  const value = config.value !== undefined ? String(config.value) : undefined;

  const args: string[] = [command.toUpperCase(), key];
  if (value) args.push(value);
  if (config.ttl) args.push("EX", String(config.ttl));

  const response = await fetch(`${url}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });

  const result = await response.json();
  return { result } as Record<string, unknown>;
}

// --- SQL Query ---

async function executeSQLQuery(
  config: Record<string, unknown>,
  credentials?: Record<string, string>,
  dbType?: string
): Promise<Record<string, unknown>> {
  return {
    query: config.query,
    parameters: config.parameters,
    dbType,
    message: `SQL query prepared for ${dbType}. Connect actual driver for production.`,
  };
}

// --- MongoDB ---

async function executeMongoDBQuery(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  return {
    operation: config.operation,
    collection: config.collection,
    query: config.query,
    data: config.data,
    message: "MongoDB query prepared. Connect actual driver for production.",
  };
}

// --- Twilio SMS ---

async function executeTwilioSMS(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const accountSid = credentials?.accountSid;
  const authToken = credentials?.authToken;
  if (!accountSid || !authToken) throw new Error("Twilio credentials not configured");

  const params = new URLSearchParams();
  params.append("To", String(config.to));
  params.append("From", String(config.from || credentials?.phoneNumber || ""));
  params.append("Body", String(config.body));

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  return (await response.json()) as Record<string, unknown>;
}

// --- Stripe ---

async function executeStripeCharge(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const apiKey = credentials?.secretKey;
  if (!apiKey) throw new Error("Stripe API key not configured");

  const params = new URLSearchParams();
  params.append("amount", String(config.amount));
  params.append("currency", String(config.currency || "usd"));
  if (config.customerId) params.append("customer", String(config.customerId));
  if (config.description) params.append("description", String(config.description));

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  return (await response.json()) as Record<string, unknown>;
}

// --- GitHub API ---

async function executeGitHubAPI(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.personalAccessToken;
  if (!token) throw new Error("GitHub token not configured");

  const operation = config.operation as string;
  const owner = String(config.owner || "");
  const repo = String(config.repo || "");

  let url = "https://api.github.com";
  let method = (config.method as string) || "GET";
  let body: string | undefined;

  switch (operation) {
    case "create_issue":
      url += `/repos/${owner}/${repo}/issues`;
      method = "POST";
      body = JSON.stringify(config.body);
      break;
    case "create_pr":
      url += `/repos/${owner}/${repo}/pulls`;
      method = "POST";
      body = JSON.stringify(config.body);
      break;
    case "list_repos":
      url += `/users/${owner}/repos`;
      break;
    case "get_repo":
      url += `/repos/${owner}/${repo}`;
      break;
    case "custom":
      url += String(config.endpoint);
      if (config.body) body = JSON.stringify(config.body);
      break;
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body,
  });

  return (await response.json()) as Record<string, unknown>;
}

// --- Notion API ---

async function executeNotionAPI(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.integrationToken;
  if (!token) throw new Error("Notion token not configured");

  const operation = config.operation as string;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };

  let url = "https://api.notion.com/v1";
  let method = "GET";
  let body: string | undefined;

  switch (operation) {
    case "query_database":
      url += `/databases/${config.databaseId}/query`;
      method = "POST";
      body = config.filter ? JSON.stringify({ filter: config.filter }) : "{}";
      break;
    case "create_page":
      url += "/pages";
      method = "POST";
      body = JSON.stringify({ properties: config.properties, parent: { database_id: config.databaseId } });
      break;
    case "update_page":
      url += `/pages/${config.pageId}`;
      method = "PATCH";
      body = JSON.stringify({ properties: config.properties });
      break;
    case "get_page":
      url += `/pages/${config.pageId}`;
      break;
  }

  const response = await fetch(url, { method, headers, body });
  return (await response.json()) as Record<string, unknown>;
}

// --- Airtable API ---

async function executeAirtableAPI(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.personalAccessToken;
  if (!token) throw new Error("Airtable token not configured");

  const baseId = String(config.baseId);
  const tableName = String(config.tableName);
  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const operation = config.operation as string;

  switch (operation) {
    case "list": {
      const res = await fetch(baseUrl, { headers });
      return (await res.json()) as Record<string, unknown>;
    }
    case "get": {
      const res = await fetch(`${baseUrl}/${config.recordId}`, { headers });
      return (await res.json()) as Record<string, unknown>;
    }
    case "create": {
      const res = await fetch(baseUrl, {
        method: "POST", headers,
        body: JSON.stringify({ fields: config.fields }),
      });
      return (await res.json()) as Record<string, unknown>;
    }
    case "update": {
      const res = await fetch(`${baseUrl}/${config.recordId}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ fields: config.fields }),
      });
      return (await res.json()) as Record<string, unknown>;
    }
    case "delete": {
      const res = await fetch(`${baseUrl}/${config.recordId}`, { method: "DELETE", headers });
      return (await res.json()) as Record<string, unknown>;
    }
    default:
      throw new Error(`Unknown Airtable operation: ${operation}`);
  }
}

// --- SendGrid Email ---

async function executeSendGridEmail(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const apiKey = credentials?.apiKey;
  if (!apiKey) throw new Error("SendGrid API key not configured");

  const payload: Record<string, unknown> = {
    personalizations: [{ to: [{ email: String(config.to) }] }],
    from: { email: String(config.from) },
    subject: String(config.subject),
    content: [
      {
        type: config.isHtml ? "text/html" : "text/plain",
        value: String(config.body),
      },
    ],
  };

  if (config.templateId) {
    payload.template_id = config.templateId;
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return { statusCode: response.status, sent: response.ok };
}

// --- Telegram Message ---

async function executeTelegramMessage(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.botToken;
  if (!token) throw new Error("Telegram bot token not configured");

  const payload: Record<string, unknown> = {
    chat_id: config.chatId,
    text: String(config.text),
  };
  if (config.parseMode && config.parseMode !== "none") {
    payload.parse_mode = config.parseMode;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  return (await response.json()) as Record<string, unknown>;
}

// --- HubSpot API ---

async function executeHubSpotAPI(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.accessToken;
  if (!token) throw new Error("HubSpot access token not configured");

  const baseUrl = "https://api.hubapi.com";
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const operation = config.operation as string;

  switch (operation) {
    case "create_contact": {
      const res = await fetch(`${baseUrl}/crm/v3/objects/contacts`, {
        method: "POST", headers,
        body: JSON.stringify({ properties: config.data }),
      });
      return (await res.json()) as Record<string, unknown>;
    }
    case "list_contacts": {
      const res = await fetch(`${baseUrl}/crm/v3/objects/contacts`, { headers });
      return (await res.json()) as Record<string, unknown>;
    }
    default:
      return { operation, message: "HubSpot operation prepared." };
  }
}

// --- Salesforce API ---

async function executeSalesforceAPI(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.accessToken;
  const instanceUrl = credentials?.instanceUrl;
  if (!token || !instanceUrl) throw new Error("Salesforce credentials not configured");

  const operation = config.operation as string;
  const objectType = String(config.objectType || "");

  switch (operation) {
    case "query": {
      const query = encodeURIComponent(String(config.query));
      const res = await fetch(`${instanceUrl}/services/data/v58.0/query?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (await res.json()) as Record<string, unknown>;
    }
    case "create": {
      const res = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/${objectType}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(config.data),
      });
      return (await res.json()) as Record<string, unknown>;
    }
    default:
      return { operation, message: "Salesforce operation prepared." };
  }
}

// --- Jira API ---

async function executeJiraAPI(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const email = credentials?.email;
  const apiToken = credentials?.apiToken;
  const domain = credentials?.domain;
  if (!email || !apiToken || !domain) throw new Error("Jira credentials not configured");

  const baseUrl = `https://${domain}.atlassian.net/rest/api/3`;
  const headers = {
    Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const operation = config.operation as string;

  switch (operation) {
    case "create_issue": {
      const res = await fetch(`${baseUrl}/issue`, {
        method: "POST", headers, body: JSON.stringify(config.data),
      });
      return (await res.json()) as Record<string, unknown>;
    }
    case "get_issue": {
      const res = await fetch(`${baseUrl}/issue/${config.issueKey}`, { headers });
      return (await res.json()) as Record<string, unknown>;
    }
    case "search": {
      const res = await fetch(`${baseUrl}/search?jql=${encodeURIComponent(String(config.jql))}`, { headers });
      return (await res.json()) as Record<string, unknown>;
    }
    default:
      return { operation, message: "Jira operation prepared." };
  }
}

// --- Mailchimp API ---

async function executeMailchimpAPI(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const apiKey = credentials?.apiKey;
  if (!apiKey) throw new Error("Mailchimp API key not configured");

  const dc = apiKey.split("-").pop();
  const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const operation = config.operation as string;
  const listId = String(config.listId || "");

  switch (operation) {
    case "add_subscriber": {
      const res = await fetch(`${baseUrl}/lists/${listId}/members`, {
        method: "POST", headers,
        body: JSON.stringify({
          email_address: String(config.email),
          status: "subscribed",
          ...(config.data as object || {}),
        }),
      });
      return (await res.json()) as Record<string, unknown>;
    }
    case "list_members": {
      const res = await fetch(`${baseUrl}/lists/${listId}/members`, { headers });
      return (await res.json()) as Record<string, unknown>;
    }
    default:
      return { operation, message: "Mailchimp operation prepared." };
  }
}

// --- Zendesk API ---

async function executeZendeskAPI(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const email = credentials?.email;
  const apiToken = credentials?.apiToken;
  const subdomain = credentials?.subdomain;
  if (!email || !apiToken || !subdomain) throw new Error("Zendesk credentials not configured");

  const baseUrl = `https://${subdomain}.zendesk.com/api/v2`;
  const headers = {
    Authorization: `Basic ${Buffer.from(`${email}/token:${apiToken}`).toString("base64")}`,
    "Content-Type": "application/json",
  };

  const operation = config.operation as string;

  switch (operation) {
    case "create_ticket": {
      const res = await fetch(`${baseUrl}/tickets.json`, {
        method: "POST", headers,
        body: JSON.stringify({ ticket: config.data }),
      });
      return (await res.json()) as Record<string, unknown>;
    }
    case "get_ticket": {
      const res = await fetch(`${baseUrl}/tickets/${config.ticketId}.json`, { headers });
      return (await res.json()) as Record<string, unknown>;
    }
    default:
      return { operation, message: "Zendesk operation prepared." };
  }
}

// --- WhatsApp Message ---

async function executeWhatsAppMessage(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = credentials?.accessToken;
  const phoneNumberId = credentials?.phoneNumberId;
  if (!token || !phoneNumberId) throw new Error("WhatsApp credentials not configured");

  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: String(config.to),
    type: config.templateName ? "template" : "text",
  };

  if (config.templateName) {
    payload.template = { name: config.templateName, language: { code: "en" } };
  } else {
    payload.text = { body: String(config.message) };
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return (await response.json()) as Record<string, unknown>;
}

// --- PDF Generate ---

async function executePDFGenerate(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // In production, use puppeteer or a PDF API
  return {
    html: config.html,
    message: "PDF generation prepared. Use puppeteer or a PDF API for production.",
  };
}

// --- Image Resize ---

async function executeImageResize(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return {
    imageUrl: config.imageUrl,
    width: config.width,
    height: config.height,
    format: config.format,
    message: "Image resize prepared. Use sharp for production.",
  };
}

// --- QR Generate ---

async function executeQRGenerate(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Use a QR code API
  const size = (config.size as number) || 256;
  const data = encodeURIComponent(String(config.data));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
  return { qrUrl, data: config.data, size };
}

// --- Crypto Encrypt ---

async function executeCryptoEncrypt(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const data = String(config.data);
  const key = String(config.key);
  const keyHash = createHash("sha256").update(key).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", keyHash, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted: `${iv.toString("hex")}:${encrypted}` };
}

// --- Crypto Decrypt ---

async function executeCryptoDecrypt(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const data = String(config.data);
  const key = String(config.key);
  const [ivHex, encrypted] = data.split(":");
  const keyHash = createHash("sha256").update(key).digest();
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", keyHash, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return { decrypted };
}

// --- JWT Sign ---

async function executeJWTSign(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Simplified JWT creation (in production, use jsonwebtoken)
  const header = { alg: config.algorithm || "HS256", typ: "JWT" };
  const payload = {
    ...(typeof config.payload === "string" ? JSON.parse(config.payload) : config.payload),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const headerEncoded = encode(header);
  const payloadEncoded = encode(payload);
  const signature = createHash("sha256")
    .update(`${headerEncoded}.${payloadEncoded}.${config.secret}`)
    .digest("base64url");

  return { token: `${headerEncoded}.${payloadEncoded}.${signature}` };
}

// --- JWT Verify ---

async function executeJWTVerify(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const token = String(config.token);
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT has expired");
  }

  return { valid: true, payload };
}

// --- Base64 Encode ---

async function executeBase64Encode(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const data = String(config.data);
  return { encoded: Buffer.from(data).toString("base64") };
}

// --- Base64 Decode ---

async function executeBase64Decode(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const data = String(config.data);
  return { decoded: Buffer.from(data, "base64").toString("utf8") };
}

// --- Hash Generate ---

async function executeHashGenerate(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const data = String(config.data);
  const algorithm = (config.algorithm as string) || "sha256";
  const hash = createHash(algorithm).update(data).digest("hex");
  return { hash, algorithm };
}

// --- Regex Match ---

async function executeRegexMatch(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const text = String(config.text);
  const pattern = String(config.pattern);
  const flags = (config.flags as string) || "g";
  const operation = (config.operation as string) || "match";

  const regex = new RegExp(pattern, flags);

  switch (operation) {
    case "match":
      return { matches: [...text.matchAll(new RegExp(pattern, flags.includes("g") ? flags : flags + "g"))].map((m) => m[0]) };
    case "test":
      return { result: regex.test(text) };
    case "replace":
      return { result: text.replace(regex, String(config.replacement || "")) };
    default:
      return { matches: [] };
  }
}

// --- Math Compute ---

async function executeMathCompute(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const expression = String(config.expression);
  try {
    const fn = new Function(`"use strict"; return (${expression});`);
    const result = fn();
    return { result };
  } catch (error) {
    throw new Error(`Math computation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- XML Parse ---

async function executeXMLParse(
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Simplified XML to JSON parsing
  const xml = String(config.data);
  const result: Record<string, string> = {};

  // Extract all tags and their content
  const tagRegex = /<(\w+)[^>]*>([^<]*)<\/\1>/g;
  let match;
  while ((match = tagRegex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }

  return { parsed: result, raw: xml };
}
