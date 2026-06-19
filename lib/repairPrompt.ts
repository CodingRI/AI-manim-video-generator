// lib/repairPrompt.ts
// Builds the single-shot repair prompt sent to the REPAIR model.
// Instructs the model to return corrected Python only —
// no markdown fences, no explanations, no commentary.

/**
 * @param originalObjective  The full Manim generation prompt used to produce the broken code.
 * @param generatedCode      The broken Python code that failed validation.
 * @param errors             List of validation error strings.
 */
export function buildRepairPrompt(
  originalObjective: string,
  generatedCode: string,
  errors: string[]
): string {
  const errorList = errors.map((e, i) => `${i + 1}. ${e}`).join("\n");

  return `You are an expert Manim Community Edition v0.20.0 developer.

The following Python code was generated to fulfil this objective:

--- ORIGINAL OBJECTIVE ---
${originalObjective}
--- END OBJECTIVE ---

The code contains errors and failed validation.

--- VALIDATION ERRORS ---
${errorList}
--- END ERRORS ---

--- BROKEN CODE ---
${generatedCode}
--- END CODE ---

Fix ALL validation errors and return the corrected, complete Python code.

STRICT OUTPUT RULES:
- Return ONLY raw Python code.
- Do NOT include markdown code fences (\`\`\`).
- Do NOT include any explanation, commentary, or text before or after the code.
- The first line of your response must be: from manim import *
- The code must define a class that extends Scene and implements construct(self).
- Do not use any forbidden modules: os, subprocess, socket, requests, shutil.
`;
}
