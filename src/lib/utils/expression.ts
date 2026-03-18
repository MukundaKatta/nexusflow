// ============================================================
// NexusFlow — Expression Engine
// Resolves template expressions like {{input.data.name}}
// ============================================================

type Context = Record<string, unknown>;

/**
 * Resolve all {{...}} expressions in a string against a context object.
 */
export function resolveExpression(template: string, context: Context): unknown {
  // If the entire string is a single expression, return the raw value (not stringified)
  const singleExprMatch = template.match(/^\{\{(.+?)\}\}$/);
  if (singleExprMatch) {
    return evaluatePath(singleExprMatch[1].trim(), context);
  }

  // Otherwise, replace all expressions in the string
  return template.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
    const value = evaluatePath(expr.trim(), context);
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

/**
 * Evaluate a dot-notation path against a context object.
 * Supports: input.data.items[0].name, env.API_KEY, etc.
 */
function evaluatePath(path: string, context: Context): unknown {
  // Handle array index notation: items[0] -> items.0
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  const parts = normalized.split(".");

  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Evaluate a conditional expression for branching.
 * Supports basic comparison operators.
 */
export function evaluateCondition(expression: string, context: Context): boolean {
  // Resolve all template expressions first
  const resolved = String(resolveExpression(expression, context));

  // Safe evaluation of simple expressions
  try {
    // Replace common operators for readability
    const sanitized = resolved
      .replace(/\b(true)\b/gi, "true")
      .replace(/\b(false)\b/gi, "false")
      .replace(/\b(null)\b/gi, "null")
      .replace(/\b(undefined)\b/gi, "undefined");

    // Use Function constructor for safe-ish eval (sandboxed in the worker)
    const fn = new Function("context", `"use strict"; return (${sanitized});`);
    return Boolean(fn(context));
  } catch {
    return false;
  }
}

/**
 * Evaluate a simple comparison condition.
 */
export function evaluateSimpleCondition(
  field: unknown,
  operator: string,
  value: unknown
): boolean {
  switch (operator) {
    case "eq":
      return field === value;
    case "neq":
      return field !== value;
    case "gt":
      return Number(field) > Number(value);
    case "lt":
      return Number(field) < Number(value);
    case "gte":
      return Number(field) >= Number(value);
    case "lte":
      return Number(field) <= Number(value);
    case "contains":
      return String(field).includes(String(value));
    case "not_contains":
      return !String(field).includes(String(value));
    case "starts_with":
      return String(field).startsWith(String(value));
    case "ends_with":
      return String(field).endsWith(String(value));
    case "is_empty":
      return field === null || field === undefined || field === "" || (Array.isArray(field) && field.length === 0);
    case "is_not_empty":
      return field !== null && field !== undefined && field !== "" && !(Array.isArray(field) && field.length === 0);
    case "regex":
      return new RegExp(String(value)).test(String(field));
    default:
      return false;
  }
}

/**
 * Resolve all expressions in a config object recursively.
 */
export function resolveConfig(
  config: Record<string, unknown>,
  context: Context
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      resolved[key] = resolveExpression(value, context);
    } else if (Array.isArray(value)) {
      resolved[key] = value.map((item) =>
        typeof item === "string"
          ? resolveExpression(item, context)
          : typeof item === "object" && item !== null
          ? resolveConfig(item as Record<string, unknown>, context)
          : item
      );
    } else if (typeof value === "object" && value !== null) {
      resolved[key] = resolveConfig(value as Record<string, unknown>, context);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
