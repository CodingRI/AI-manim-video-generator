// lib/router.ts
// Multi-model router — separates model selection from business logic.
// Each TaskType maps to a primary + fallback model on OpenRouter.
// Future: swap to fallback on 429s, add cost-aware routing.

export enum TaskType {
  STRUCTURE = "STRUCTURE",
  PLAN      = "PLAN",
  CODE      = "CODE",
  REPAIR    = "REPAIR",
}

type ModelEntry = {
  primary:  string;
  fallback: string;
};

// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------

const MODEL_REGISTRY: Record<TaskType, ModelEntry> = {
  [TaskType.STRUCTURE]: {
    primary:  "google/gemini-2.5-flash",
    fallback: "deepseek/deepseek-chat",
  },
  [TaskType.PLAN]: {
    primary:  "qwen/qwen3-32b",
    fallback: "deepseek/deepseek-chat",
  },
  [TaskType.CODE]: {
    primary:  "openai/gpt-4o-mini",
    fallback: "deepseek/deepseek-chat",
  },
  [TaskType.REPAIR]: {
    primary:  "deepseek/deepseek-chat",
    fallback: "openai/gpt-4o-mini",
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the primary model for the given task type.
 * Emits a structured [ROUTER] log so every LLM call is traceable.
 */
export function getModelForTask(taskType: TaskType): string {
  const entry = MODEL_REGISTRY[taskType];
  const model = entry.primary;
  console.log(`[ROUTER] ${taskType} -> ${model}`);
  return model;
}

/**
 * Returns the fallback model for the given task type.
 * Call this when the primary model fails (e.g. 429 / 5xx).
 */
export function getFallbackModelForTask(taskType: TaskType): string {
  const entry = MODEL_REGISTRY[taskType];
  const model = entry.fallback;
  console.log(`[ROUTER] ${taskType} -> ${model} (fallback)`);
  return model;
}
