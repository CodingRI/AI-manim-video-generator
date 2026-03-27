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
  You are generating structured scenes for math animations.
  
  Return ONLY JSON array.
  
  Each scene MUST include:
  - title
  - explanation
  - type (one of: "graph", "text", "comparison")
  - duration
  
  Rules:
  - Use "graph" for math concepts (functions, derivatives)
  - Use "text" for explanations
  - Keep scenes simple and logical progression
  
  Topic: ${structuredData.topic}
  Difficulty: ${structuredData.difficulty}
  Scenes: ${structuredData.scenes}
  `;
  }

  export function buildManimPrompt(scene: any, index: number): string {
    return `
    You are an expert in Manim (Python animation library).

    Generate clean, executable Manim code.
    Just spit the code block with efficiency, no extra lines of an AI agent, just code. 
    
    STRICT RULES:
    - Use Manim Community Edition
    - One Scene class only
    - Class name: Scene${index}
    - DO NOT use MathTex
    - DO NOT use LaTeX
    - Use Text() for all labels
    - Code must run without external dependencie
    - Only generate code block without any explanatory text
    
    Scene details:
    Title: ${scene.title}
    Description: ${scene.description}
    Visual: ${scene.visual}
    Duration: ${scene.duration}
    
    Return ONLY Python code.
  `;
  }