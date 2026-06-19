import { generateEmbedding } from "./embeddings";
import "dotenv/config";

async function main() {
  console.log(
    "API Key Exists:",
    !!process.env.OPENROUTER_API_KEY
  );
  const embedding = await generateEmbedding(
    "MathTex derivative example"
  );

  console.log(
    "Embedding length:",
    embedding.length
  );

  console.log(
    embedding.slice(0, 10)
  );
}

main();