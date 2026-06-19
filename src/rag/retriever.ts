import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  title: string;
  category: string;
  content: string;
  distance: number;
}

export async function retrieveKnowledge(
  query: string,
  limit = 5
): Promise<RetrievedChunk[]> {
  const embedding =
    await generateEmbedding(query);

  const vector =
    `[${embedding.join(",")}]`;

  const results =
    await prisma.$queryRawUnsafe<RetrievedChunk[]>(
      `
      SELECT
        id,
        title,
        category,
        content,
        embedding <=> '${vector}'::vector
          AS distance
      FROM "KnowledgeChunk"
      ORDER BY embedding <=> '${vector}'::vector
      LIMIT ${limit}
      `
    );

  return results;
}