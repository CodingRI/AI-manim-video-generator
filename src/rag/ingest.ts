import "dotenv/config";
import fs from "fs";
import path from "path";
import { generateEmbedding } from "./embeddings";

async function ingest() {
  const knowledgeRoot = path.join(
    process.cwd(),
    "src",
    "knowledge"
  );

  const categories =
    fs.readdirSync(knowledgeRoot);

  for (const category of categories) {
    const categoryPath = path.join(
      knowledgeRoot,
      category
    );

    if (
      !fs.statSync(categoryPath).isDirectory()
    ) {
      continue;
    }

    const files =
      fs.readdirSync(categoryPath);

    for (const file of files) {
      const fullPath = path.join(
        categoryPath,
        file
      );

      const content =
        fs.readFileSync(
          fullPath,
          "utf-8"
        );

      const embedding =
        await generateEmbedding(
          content
        );

      console.log("\n==========");

      console.log(
        "CATEGORY:",
        category
      );

      console.log(
        "FILE:",
        file
      );

      console.log(
        "Embedding Length:",
        embedding.length
      );
    }
  }
}

ingest();