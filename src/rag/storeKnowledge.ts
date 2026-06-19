import "dotenv/config";

import fs from "fs";
import path from "path";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "./embeddings";

async function main() {

  await prisma.knowledgeChunk.deleteMany();

  console.log(
    "Knowledge table cleared."
  );

  const knowledgeRoot = path.join(
    process.cwd(),
    "src",
    "knowledge"
  );

  const categories = fs.readdirSync(
    knowledgeRoot
  );

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
          "utf8"
        );

      const embedding =
        await generateEmbedding(
          content
        );

      const vectorString =
        `[${embedding.join(",")}]`;

      await prisma.$executeRawUnsafe(`
        INSERT INTO "KnowledgeChunk"
        (
          id,
          category,
          title,
          content,
          embedding,
          "createdAt"
        )
        VALUES
        (
          gen_random_uuid()::text,
          '${category}',
          '${file}',
          $content$${content}$content$,
          '${vectorString}'::vector,
          NOW()
        )
      `);

      console.log(
        `Stored ${category}/${file}`
      );
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });