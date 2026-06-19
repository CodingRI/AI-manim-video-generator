// lib/repairCode.ts
// Single-shot code repair using the REPAIR model via the router.
// Calls the LLM once and returns cleaned Python.
// No loops, no retries, no recursion.

import { cleanCode } from "@/lib/cleanCode";
import { callLLM } from "@/lib/llm";
import { buildRepairPrompt } from "@/lib/repairPrompt";
import { TaskType } from "@/lib/router";

/**
 * Sends broken code + validation errors to the REPAIR model.
 * Returns cleaned, corrected Python code.
 *
 * @param originalObjective  The Manim generation prompt that produced the broken code.
 * @param brokenCode         The Python code that failed validation.
 * @param errors             Validation error strings to include in the repair prompt.
 */
export async function repairCode(
  originalObjective: string,
  brokenCode: string,
  errors: string[]
): Promise<string> {
  console.log("[REPAIR] Attempting correction");
  console.log("[REPAIR] Errors to fix:", errors);

  const repairPrompt = buildRepairPrompt(originalObjective, brokenCode, errors);
  const response = await callLLM(repairPrompt, TaskType.REPAIR);
  const repairedCode = cleanCode(response.content);

  console.log("[REPAIR] Repair complete");
  return repairedCode;
}
