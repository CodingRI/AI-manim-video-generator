
export async function generateEmbedding(
  text: string
): Promise<number[]> {
  const res = await fetch(
    "https://openrouter.ai/api/v1/embeddings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: text,
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();

    throw new Error(
      `Embedding Error: ${error}`
    );
  }

  const data = await res.json();

  return data.data[0].embedding;
}