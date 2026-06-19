// src/lib/validateAndRepair.ts
// Validation orchestrator — validate → repair once → validate again.
// Never loops. Never retries more than once.
// Returns a typed result so callers don't need to try/catch for validation failures.

import { repairCode } from "@/lib/repairCode";
import { validateCode } from "@/lib/validateCode";

export type RepairResult = {
  success: boolean;
  code: string;
  errors: string[];
};

/**
 * Validates generated Manim code and attempts a single repair pass if needed.
 *
 * Flow:
 *   1. Validate generatedCode
 *   2. If valid → return immediately
 *   3. If invalid → repair once using originalPrompt + errors
 *   4. Validate repaired code
 *   5. If valid → return repaired code
 *   6. If still invalid → return failure with final errors
 *
 * @param originalPrompt  The Manim generation prompt (used as repair context).
 * @param generatedCode   Raw Python code to validate.
 */
export async function validateAndRepair(
  originalPrompt: string,
  generatedCode: string
): Promise<RepairResult> {
  // ── Pass 1: Validate original code ────────────────────────────────────────
  const firstValidation = validateCode(generatedCode);

  if (firstValidation.success) {
    console.log("[VALIDATION] Passed");
    return {
      success: true,
      code: generatedCode,
      errors: [],
    };
  }

  console.log("[VALIDATION] Failed");
  console.log("[VALIDATION] Errors:", firstValidation.errors);

  // ── Single repair attempt ─────────────────────────────────────────────────
  const repairedCode = await repairCode(
    originalPrompt,
    generatedCode,
    firstValidation.errors
  );

  // ── Pass 2: Validate repaired code ────────────────────────────────────────
  const secondValidation = validateCode(repairedCode);

  if (secondValidation.success) {
    console.log("[VALIDATION] Passed");
    return {
      success: true,
      code: repairedCode,
      errors: [],
    };
  }

  console.log("[VALIDATION] Failed (after repair)");
  console.log("[VALIDATION] Remaining errors:", secondValidation.errors);

  return {
    success: false,
    code: repairedCode,
    errors: secondValidation.errors,
  };
}
