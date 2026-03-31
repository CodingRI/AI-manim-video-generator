// lib/promptBuilder.ts

export function buildStructuringPrompt(userPrompt: string): string {
    return `
  You are an AI that converts user prompts into structured JSON for a math animation system.
  
  Return ONLY valid JSON. No explanation.
  
  Format:
  {
    "topic": string,
    "difficulty": "beginner" | "intermediate" | "advanced",
    "style": string,
    "scenes": number
  }
  
  User prompt:
  "${userPrompt}"
  `;
  }

  export function buildScenePrompt(structuredData: any): string {
    return `
  You are generating structured scenes for math animations using Manim Community Edition.
  
  Return ONLY a JSON array. No explanation.
  
  Each scene must have:
  - title: short heading
  - explanation: one sentence describing what the viewer learns
  - type: one of "text" | "graph" | "geometry" | "numberline" | "transform" | "comparison"
  - visual: describe exactly what should be drawn or animated (e.g. "a sine wave plotted on axes from -2pi to 2pi, then a cosine wave added in red")
  - duration: seconds (2-5)
  
  Type guide:
  - "text" → key concept explanation with bullet points or stepped reveals
  - "graph" → plotting functions on Axes
  - "geometry" → shapes, angles, triangles, circles
  - "numberline" → number lines, inequalities, intervals
  - "transform" → morphing one shape or equation into another
  - "comparison" → two graphs or concepts side by side
  
  Topic: ${structuredData.topic}
  Difficulty: ${structuredData.difficulty}
  Scenes: ${structuredData.scenes}
  
  Make scenes flow logically. Start simple, build up complexity.
  `;
  }

  export function buildManimPrompt(scene: any, index: number): string {
    return `
  You are an expert Manim Community Edition developer. Generate clean, working Python code.
  
  WHAT YOU CAN USE:
  - Text(), VGroup(), Axes(), NumberLine()
  - Circle(), Square(), Triangle(), Polygon(), Arc(), Line(), Arrow(), DashedLine()
  - Dot(), MathTex() is BANNED — use Text() only
  - Axes().plot(), always_redraw()
  - animate.shift(), animate.scale(), animate.rotate(), FadeIn, FadeOut, Write, Create, Transform, ReplacementTransform
  - Colors: BLUE, RED, GREEN, YELLOW, ORANGE, WHITE, GRAY, PURPLE
  - numpy is available as np

  
  BANNED - never use these, they don't exist in Manim v0.20.0:
- reverse_tip, tip_length on Arrow (use Arrow(start, end) only)
- FunctionGraph (use axes.plot() instead)
- ShowCreation (use Create() instead)
- CurvedArrow with angle param
- ApplyMethod (use .animate instead)
- TextMobject, TexMobject (use Text() only)

Arrow usage: Arrow(start_point, end_point) — no extra arguments
  
  STRICT RULES:
  - Class name must be: Scene${index}
  - No LaTeX, no MathTex, no external libraries, no file imports
  - No \\frac, no \\sqrt in strings — write "sqrt" or "x/y" as plain text
  - All math labels must use Text(), not MathTex()
  - Code must be fully self-contained and run with: manim -ql script.py Scene${index}
  
  Scene to animate:
  Title: ${scene.title}
  What to show: ${scene.visual}
  Explanation: ${scene.explanation}
  Duration: ${scene.duration} seconds
  
  Return ONLY the Python code block. No explanation. No comments outside the code.
  `;
  }