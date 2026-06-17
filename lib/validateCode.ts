export function validateCode(code: string) {
  const bannedPatterns: Array<{ pattern: string; reason: string }> = [
    { pattern: "ShowCreation",  reason: "Removed in v0.18 — use Create()" },
    { pattern: "FunctionGraph", reason: "Removed — use axes.plot()" },
    { pattern: "ApplyMethod",   reason: "Removed — use .animate" },
    { pattern: "TextMobject",   reason: "Removed — use Text()" },
    { pattern: "TexMobject",    reason: "Removed — use MathTex()" },
    { pattern: "reverse_tip",   reason: "Not a valid Arrow parameter" },
    { pattern: "tip_length",    reason: "Not a valid Arrow parameter in v0.20" },
  ];

  // Detect Code() called with a bare positional string (e.g. Code("print('hi')"))
  // The correct form is Code(code="...", language="...")
  const codePositionalArg = /\bCode\s*\(\s*["']/.test(code);

  const errors: string[] = [];

  for (const { pattern, reason } of bannedPatterns) {
    if (code.includes(pattern)) {
      errors.push(`Unsupported Manim API: ${pattern} — ${reason}`);
    }
  }

  if (codePositionalArg) {
    errors.push(
      "Code() called with positional string argument. Use Code(code='...', language='python') instead."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}