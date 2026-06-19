// lib/validateCode.ts
// Lightweight structural validation for Manim-generated Python code.
// Designed to catch obvious failures before rendering.
// Keep each check as a standalone function so more can be added later.

export type ValidationResult = {
  success: boolean;
  errors: string[];
};

// ---------------------------------------------------------------------------
// Individual checks (modular — add new ones here)
// ---------------------------------------------------------------------------

function checkNotEmpty(code: string): string | null {
  if (!code || code.trim().length === 0) {
    return "Generated code is empty.";
  }
  return null;
}

function checkManimImport(code: string): string | null {
  if (!code.includes("from manim import")) {
    return "Missing required Manim import: from manim import *";
  }
  return null;
}

function checkSceneClass(code: string): string | null {
  // Matches: class Foo(Scene): or class Scene1(Scene):
  if (!/class\s+\w+\s*\(\s*\w*Scene\w*\s*\)/.test(code)) {
    return "Missing Scene class definition (e.g. class MyScene(Scene):).";
  }
  return null;
}

function checkConstructMethod(code: string): string | null {
  if (!code.includes("def construct(self)")) {
    return "Missing required construct() method.";
  }
  return null;
}

const FORBIDDEN_IMPORTS = [
  "os",
  "subprocess",
  "socket",
  "requests",
  "shutil",
] as const;

function checkForbiddenImports(code: string): string[] {
  const found: string[] = [];
  for (const mod of FORBIDDEN_IMPORTS) {
    // Match: import os  |  from os import  |  import os,
    const pattern = new RegExp(
      `(^|\\s)import\\s+${mod}(\\s|,|$)|(^|\\s)from\\s+${mod}\\s+import`,
      "m"
    );
    if (pattern.test(code)) {
      found.push(`Forbidden import detected: "${mod}"`);
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// Deprecated API checks (carried over from original validateCode.ts)
// ---------------------------------------------------------------------------

const BANNED_PATTERNS: Array<{ pattern: string; reason: string }> = [
  { pattern: "ShowCreation",  reason: "Removed in v0.18 — use Create()" },
  { pattern: "FunctionGraph", reason: "Removed — use axes.plot()" },
  { pattern: "ApplyMethod",   reason: "Removed — use .animate" },
  { pattern: "TextMobject",   reason: "Removed — use Text()" },
  { pattern: "TexMobject",    reason: "Removed — use MathTex()" },
  { pattern: "reverse_tip",   reason: "Not a valid Arrow parameter" },
  { pattern: "tip_length",    reason: "Not a valid Arrow parameter in v0.20" },
];

function checkDeprecatedAPIs(code: string): string[] {
  const errors: string[] = [];
  for (const { pattern, reason } of BANNED_PATTERNS) {
    if (code.includes(pattern)) {
      errors.push(`Unsupported Manim API: ${pattern} — ${reason}`);
    }
  }
  // Code() positional string arg
  if (/\bCode\s*\(\s*["']/.test(code)) {
    errors.push(
      "Code() called with positional string argument. Use Code(code='...', language='python') instead."
    );
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function validateCode(code: string): ValidationResult {
  const errors: string[] = [];

  const singleChecks = [
    checkNotEmpty,
    checkManimImport,
    checkSceneClass,
    checkConstructMethod,
  ];

  for (const check of singleChecks) {
    const err = check(code);
    if (err) errors.push(err);
  }

  errors.push(...checkForbiddenImports(code));
  errors.push(...checkDeprecatedAPIs(code));

  return {
    success: errors.length === 0,
    errors,
  };
}