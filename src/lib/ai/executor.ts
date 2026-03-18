// ============================================================
// NexusFlow — AI Node Executor
// ============================================================

import OpenAI from "openai";

function getOpenAIClient(credentials?: Record<string, string>): OpenAI {
  const apiKey = credentials?.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");
  return new OpenAI({ apiKey });
}

export async function executeAINode(
  type: string,
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  switch (type) {
    case "llm_chat":
      return executeLLMChat(config, credentials);
    case "summarize":
      return executeSummarize(config, credentials);
    case "classify":
      return executeClassify(config, credentials);
    case "extract":
      return executeExtract(config, credentials);
    case "translate":
      return executeTranslate(config, credentials);
    case "sentiment":
      return executeSentiment(config, credentials);
    default:
      throw new Error(`Unknown AI node type: ${type}`);
  }
}

// --- LLM Chat ---

async function executeLLMChat(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const openai = getOpenAIClient(credentials);
  const model = (config.model as string) || "gpt-4o-mini";
  const temperature = (config.temperature as number) || 0.7;
  const maxTokens = (config.maxTokens as number) || 1000;
  const responseFormat = config.responseFormat as string;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (config.systemPrompt) {
    messages.push({ role: "system", content: String(config.systemPrompt) });
  }
  messages.push({ role: "user", content: String(config.userPrompt) });

  const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat === "json") {
    params.response_format = { type: "json_object" };
  }

  const completion = await openai.chat.completions.create(params);
  const content = completion.choices[0]?.message?.content || "";

  return {
    response: responseFormat === "json" ? JSON.parse(content) : content,
    model: completion.model,
    usage: {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
    },
  };
}

// --- Summarize ---

async function executeSummarize(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const openai = getOpenAIClient(credentials);
  const text = String(config.text);
  const length = (config.length as string) || "short";
  const format = (config.format as string) || "paragraph";

  const lengthInstructions: Record<string, string> = {
    brief: "in 1-2 sentences",
    short: "in a short paragraph (3-5 sentences)",
    detailed: "in a detailed summary with key points",
  };

  const formatInstructions: Record<string, string> = {
    paragraph: "as a paragraph",
    bullets: "as bullet points",
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a summarization expert. Summarize the following text ${lengthInstructions[length] || lengthInstructions.short} ${formatInstructions[format] || formatInstructions.paragraph}. Be concise and accurate.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return {
    summary: completion.choices[0]?.message?.content || "",
    originalLength: text.length,
    usage: completion.usage,
  };
}

// --- Classify ---

async function executeClassify(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const openai = getOpenAIClient(credentials);
  const text = String(config.text);
  const categories = config.categories as string[];
  const multiLabel = config.multiLabel as boolean;
  const minConfidence = (config.confidence as number) || 0.7;

  if (!categories || categories.length === 0) {
    throw new Error("Categories are required for classification");
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a text classifier. Classify the given text into ${
          multiLabel ? "one or more" : "exactly one"
        } of the following categories: ${categories.join(", ")}.

Respond with valid JSON in this format:
${
  multiLabel
    ? '{"categories": [{"label": "category", "confidence": 0.95}], "reasoning": "brief explanation"}'
    : '{"category": "most_likely_category", "confidence": 0.95, "reasoning": "brief explanation"}'
}

Only return categories with confidence >= ${minConfidence}.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
  return { ...result, usage: completion.usage };
}

// --- Extract ---

async function executeExtract(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const openai = getOpenAIClient(credentials);
  const text = String(config.text);
  const extractionSchema = config.schema;
  const instructions = config.instructions as string;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a data extraction expert. Extract structured data from the given text according to this schema:
${JSON.stringify(extractionSchema, null, 2)}

${instructions ? `Additional instructions: ${instructions}` : ""}

Respond with valid JSON matching the schema. Use null for fields that cannot be found.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  const extracted = JSON.parse(
    completion.choices[0]?.message?.content || "{}"
  );
  return { extracted, usage: completion.usage };
}

// --- Translate ---

async function executeTranslate(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const openai = getOpenAIClient(credentials);
  const text = String(config.text);
  const sourceLang = (config.sourceLang as string) || "auto";
  const targetLang = String(config.targetLang);
  const tone = (config.tone as string) || "formal";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert translator. Translate the following text ${
          sourceLang !== "auto" ? `from ${sourceLang} ` : ""
        }to ${targetLang}. Use a ${tone} tone. Only output the translation, nothing else.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  return {
    translation: completion.choices[0]?.message?.content || "",
    sourceLang,
    targetLang,
    usage: completion.usage,
  };
}

// --- Sentiment ---

async function executeSentiment(
  config: Record<string, unknown>,
  credentials?: Record<string, string>
): Promise<Record<string, unknown>> {
  const openai = getOpenAIClient(credentials);
  const text = String(config.text);
  const granularity = (config.granularity as string) || "document";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a sentiment analysis expert. Analyze the sentiment of the given text${
          granularity === "sentence" ? " at the sentence level" : ""
        }.

Respond with valid JSON:
${
  granularity === "sentence"
    ? '{"overall": {"label": "positive|negative|neutral|mixed", "score": 0.85}, "sentences": [{"text": "...", "label": "...", "score": 0.9}]}'
    : '{"label": "positive|negative|neutral|mixed", "score": 0.85, "emotions": ["joy", "trust"], "reasoning": "brief explanation"}'
}

Score ranges: -1.0 (very negative) to 1.0 (very positive). 0 is neutral.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
  return { ...result, usage: completion.usage };
}
