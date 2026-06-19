// lib/llm.ts
// Model selection is handled entirely through router.ts.
// Call as: callLLM(prompt, TaskType.CODE)

import { TaskType, getModelForTask } from "@/lib/router";

type LLMResponse = {
  content: string;
};

export async function callLLM(
  prompt: string,
  taskType: TaskType
): Promise<LLMResponse> {
  const model = getModelForTask(taskType);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM Error [${model}]: ${text}`);
  }

  const data = await res.json();
  console.log("FULL LLM RESPONSE:", JSON.stringify(data, null, 2));

  return {
    content: data.choices[0].message.content,
  };
}