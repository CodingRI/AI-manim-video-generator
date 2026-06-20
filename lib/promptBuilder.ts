// lib/promptBuilder.ts

export function buildStructuringPrompt(userPrompt: string): string {
  return `
You are an AI system that converts educational video requests into structured JSON.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations.

Format:
{
  "topic": string,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "style": string,
  "animationType": "math" | "algorithm" | "physics" | "general",
  "sceneCount": number,
  "estimatedDuration": number
}

Rules:
- Determine the primary topic.
- Estimate difficulty.
- Estimate total video duration in seconds. Keep it tight: aim for 90–180 seconds total.
- sceneCount must be 3–5. Never more than 5.
- Each scene should last 20–40 seconds, not 60.
- Choose an animation type.

User Prompt:
"${userPrompt}"
`;
}

export function buildScenePrompt(structuredData: any): string {
  return `
You are an expert educational storyboard designer creating scenes for Manim Community Edition v0.20.0.

Return ONLY a JSON array.
Do not include markdown.
Do not include explanations.

Each scene must contain:

{
  "title": string,
  "explanation": string,
  "type": string,
  "visual": string,
  "duration": number,
  "camera": "static" | "zoom" | "pan",
  "transition": "fade" | "transform" | "replacement",
  "components": string[]
}

Available scene types:
- text
- graph
- geometry
- numberline
- transform
- comparison
- algorithm
- equation
- diagram

DURATION RULES:
- Each scene duration: 20–40 seconds maximum. Never 60.
- Total across all scenes must be under 150 seconds.
- Pack information densely — this is a short-form educational video.

VISUAL DESIGN RULES:
- Every visual element must have EXPLICIT POSITIONING using .to_edge(), .shift(), .next_to(), or .move_to().
- Never place two objects at the same default center position (0,0,0). This causes overlapping.
- When building trees or diagrams, reserve specific screen regions for each element.
- Use VGroup to batch-position related elements together.
- Leave clear margins: no element should go beyond 6 units from center horizontally or 3.5 units vertically.

Guidelines:
- Build scenes progressively.
- Each scene should teach exactly one concept.
- Prefer visual explanations over text.
- Avoid large blocks of text.
- Use mathematical notation where appropriate.
- Include relevant Manim components in the "components" array.

Example Components:
[
  "MathTex",
  "Axes",
  "NumberLine",
  "Circle",
  "Arrow",
  "VGroup",
  "TransformMatchingTex",
  "Rectangle"
]

Topic:
${structuredData.topic}

Difficulty:
${structuredData.difficulty}

Animation Type:
${structuredData.animationType}

Scene Count:
${structuredData.sceneCount}

Estimated Duration:
${structuredData.estimatedDuration}

Create scenes that flow naturally from introduction to conclusion.
`;
}

export function buildManimPrompt(scene: any, index: number, retrievedContext: string = ""): string {
  const knowledgeBlock = retrievedContext.trim()
    ? `Relevant Manim Knowledge:\n\n${retrievedContext}\n`
    : "";

  return `
You are an expert Manim Community Edition v0.20.0 developer.

${knowledgeBlock}
Generate ONLY executable Python code.

CRITICAL OUTPUT RULES:
- Return only Python code.
- No markdown.
- No code fences.
- No explanations.
- No introductory text.
- First line must be: from manim import *

The generated code must run successfully using:
manim -ql script.py Scene${index}

════════════════════════════════════════
MANIM v0.20.0 API — EXACT SIGNATURES
════════════════════════════════════════

Code() signature (CRITICAL — very commonly misused):
  Code(file_name=None, code=None, language="python", ...)
  ✓ Use: Code(code="print('hi')", language="python", font_size=20)
  ✗ NEVER: Code(code="...", code="...")  — no duplicate kwargs
  ✗ NEVER positional string arg: Code("print('hi')")

Arrow:
  Arrow(start, end)                        ✓
  Arrow(start, end, buff=0.1)              ✓
  ✗ NEVER: reverse_tip, tip_length, CurvedArrow(angle=...)

Axes:
  axes.plot(lambda x: x**2, color=BLUE)   ✓
  ✗ NEVER: FunctionGraph (removed)

Deprecated — never use these:
  ShowCreation  → use Create()
  ApplyMethod   → use .animate
  TextMobject   → use Text()
  TexMobject    → use MathTex()
  FunctionGraph → use axes.plot()

════════════════════════════════════════
LAYOUT & POSITIONING — MANDATORY RULES
════════════════════════════════════════

1. NEVER place two objects at the default origin (0,0,0).
   Every object needs explicit placement:
   obj.to_edge(UP)
   obj.shift(LEFT * 2)
   obj.next_to(other_obj, DOWN, buff=0.4)
   obj.move_to([x, y, 0])

2. SCREEN COORDINATE SYSTEM:
   - Safe horizontal range: -6 to +6
   - Safe vertical range:   -3.5 to +3.5
   - Title zone:  y > 2.5  (use .to_edge(UP) or .shift(UP*2.8))
   - Content zone: y between -2.5 and 2.0
   - Never place content at y < -3.2 or y > 3.5

3. TREES & HIERARCHICAL DIAGRAMS:
   Calculate exact pixel positions for EVERY node before placing.
   Use a layout formula, e.g. for a binary tree of depth d:
     - Root at (0, 2.5)
     - Level 1: (-2, 1), (+2, 1)
     - Level 2: (-3, -0.5), (-1, -0.5), (+1, -0.5), (+3, -0.5)
   Horizontal spacing must be >= 1.5 to prevent overlap.
   Draw arrows AFTER all nodes are placed.

4. STACKS & LISTS:
   Stack frames must be rectangles with fixed height (e.g. 0.7).
   Position each frame relative to the previous:
     frame_n.next_to(frame_{n-1}, DOWN, buff=0.05)
   Keep the stack within y range [-2.5, 2.5].

5. SIDE-BY-SIDE COMPARISON:
   Left panel:  x = -3.5, right panel: x = +3.5
   Add a vertical divider line at x=0.
   Both panels must have identical y-ranges.

6. VGroup usage:
   Group related elements, then position the group as one unit.
   group = VGroup(obj1, obj2, obj3).arrange(DOWN, buff=0.3)
   group.move_to(ORIGIN)

════════════════════════════════════════
ANIMATION TIMING — MANDATORY RULES
════════════════════════════════════════

Target total scene runtime: ${scene.duration} seconds.
The sum of all run_time values + self.wait() calls must be ≈ ${scene.duration}s.

Rules:
- self.play(..., run_time=N)  — use short run_times: 0.5–1.5s per step
- self.wait(N) — use sparingly: 0.5–1s between major steps, 1–2s at end
- Never: self.wait(5) or longer
- Never let a single animation run for >3 seconds
- Keep the scene moving — dead time kills engagement
- Aim for 6–12 animation steps per scene

Fast animation pattern:
  self.play(Create(obj), run_time=0.8)
  self.wait(0.5)
  self.play(obj.animate.shift(UP), run_time=0.6)

════════════════════════════════════════
CODE QUALITY RULES
════════════════════════════════════════

- Use descriptive variable names (not obj1, obj2).
- Group creation and placement together before animating.
- Use color constants: BLUE, RED, GREEN, YELLOW, ORANGE, PURPLE, WHITE, GRAY.
- Use consistent font sizes: titles 36–40, body 24–28, code 18–22.
- Use FadeOut() to clear old elements before introducing new ones.
- Never accumulate more than 8–10 mobjects on screen at once.
- For algorithm scenes: show one step at a time, highlight the active element.

════════════════════════════════════════
SCENE REQUIREMENTS
════════════════════════════════════════

Class Name:
Scene${index}

Title:
${scene.title}

Explanation:
${scene.explanation}

Visual:
${scene.visual}

Duration:
${scene.duration} seconds

Camera:
${scene.camera}

Transition:
${scene.transition}

Suggested Components:
${JSON.stringify(scene.components || [])}

════════════════════════════════════════
GOAL
════════════════════════════════════════

Create a tight, visually excellent educational animation.
Every element must be precisely positioned — no overlaps.
Keep animations fast and engaging.
Generate complete, directly executable Python code.
`;
}