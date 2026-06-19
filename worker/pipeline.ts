import { cleanJSON, cleanCode } from "@/lib/cleanCode";
import { callLLM } from "@/lib/llm";
import {
  buildStructuringPrompt,
  buildScenePrompt,
  buildManimPrompt,
} from "@/lib/promptBuilder";
import { ScenesArraySchema } from "@/lib/schema";
import { generateSceneCode } from "@/lib/template";
import { validateCode } from "@/lib/validateCode";
import {retrieveKnowledge} from "@/src/rag/retriever";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { execSync } from "child_process";
import { uploadToS3 } from "./s3";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Silently delete a file — never throws. */
function safeUnlink(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[cleanup] Deleted: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[cleanup] Could not delete ${filePath}:`, err);
  }
}

/** Recursively delete a directory — never throws. */
function safeRmdir(dirPath: string) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`[cleanup] Deleted dir: ${dirPath}`);
    }
  } catch (err) {
    console.warn(`[cleanup] Could not delete dir ${dirPath}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export async function runPipeline(data: any) {
  const { prompt } = data;

  console.log("Running pipeline for:", prompt);
  let log = "";
  log += "Starting pipeline\n";

  // ── 1. Structure ──────────────────────────────────────────────────────────
  const structuredPrompt = buildStructuringPrompt(prompt);
  const structRes = await callLLM(structuredPrompt);
  const cleanedStruct = cleanJSON(structRes.content);
  let structuredData;
  try {
    structuredData = JSON.parse(cleanedStruct);
  } catch (err) {
    console.error("RAW STRUCT OUTPUT:", structRes.content);
    console.error("CLEANED STRUCT OUTPUT:", cleanedStruct);
    throw new Error("Structuring JSON failed");
  }

  log += "Structuring completed\n";
  console.log("Structured data:", structuredData);

  // ── 2. Scene planning ─────────────────────────────────────────────────────
  const scenePrompt = buildScenePrompt(structuredData);
  const sceneRes = await callLLM(scenePrompt);
  const cleaned = cleanJSON(sceneRes.content);

  let scenes;
  try {
    const parsed = JSON.parse(cleaned);
    const normalized = parsed.map((scene: any) => ({
      ...scene,
      type: ["text", "graph", "comparison"].includes(scene.type)
        ? scene.type
        : "text",
    }));
    scenes = ScenesArraySchema.parse(normalized);
  } catch (err) {
    console.error("RAW SCENE OUTPUT:", cleaned);
    throw new Error("Scene JSON failed");
  }

  // ── 3. Generate scene Python files ───────────────────────────────────────
  const outputDir = path.join(process.cwd(), "generated");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sceneFiles: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    console.log(`\n--- Generating Scene ${i + 1} (AI) ---`);


  //RAG retrieval

  const retrievalQuery = `
${scene.title}

${scene.explanation}

${scene.visual}
`;
    const retrieved =
      await retrieveKnowledge(
        retrievalQuery,
        5
      );

    
    console.log(
      "Retrieved Chunks:",
      retrieved.map((r: any) => r.title)
    );
    
    const retrievedContext = retrieved.map((r: any) => `SOURCE: ${r.title}\n${r.content}`).join("\n\n");

    const manimPrompt = buildManimPrompt(scene, i + 1, retrievedContext);
    const codeRes = await callLLM(manimPrompt);
    const code = cleanCode(codeRes.content);
    const validation = validateCode(code);

    if (!validation.valid) {
      console.error("Validation Failed:", validation.errors);
      continue;
    }

    console.log(`Scene ${i + 1} code:\n`, code);

    const fileName = `scene${i + 1}.py`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, code);

    console.log("Validated Scene Code:");
    console.log(code);
    console.log(`Saved: ${filePath}`);

    sceneFiles.push(filePath);
  }

  log += "Scenes generated\n";

  // ── 4. Render each scene with manim ──────────────────────────────────────
  //
  // The worker process runs INSIDE the Docker image (which has manim installed),
  // so we call `manim` directly — no nested `docker run` needed.
  // Paths are local to the container's working directory (/app in production,
  // or the project root when running on the host for development).

  const videoPaths: string[] = [];
  const mediaDir = path.join(process.cwd(), "media");

  for (let i = 0; i < sceneFiles.length; i++) {
    const filePath = sceneFiles[i];
    const baseName = path.basename(filePath, ".py"); // e.g. "scene1"
    const sceneName = `Scene${i + 1}`;

    console.log(`\n--- Rendering ${sceneName} ---`);

    try {
      execSync(`manim "${filePath}" ${sceneName} -ql`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      // manim writes output to: media/videos/<baseName>/480p15/<SceneName>.mp4
      const videoPath = path.join(
        mediaDir,
        "videos",
        baseName,
        "480p15",
        `${sceneName}.mp4`
      );

      console.log(`Rendered: ${videoPath}`);
      videoPaths.push(videoPath);
    } catch (err) {
      console.error(`Scene ${sceneName} failed, skipping...`);
    } finally {
      // Delete the generated Python file regardless of render outcome
      safeUnlink(filePath);
    }
  }

  log += "Rendering complete\n";

  if (videoPaths.length === 0) {
    throw new Error("All scenes failed, no video generated");
  }

  // ── 5. Concatenate scenes with ffmpeg ─────────────────────────────────────
  const concatFilePath = path.join(outputDir, "concat.txt");

  let concatContent = "";
  for (const videoPath of videoPaths) {
    concatContent += `file '${videoPath}'\n`;
  }

  fs.writeFileSync(concatFilePath, concatContent);
  console.log("Concat file created:", concatFilePath);

  const finalFileName = `final-${Date.now()}.mp4`;
  const publicVideosDir = path.join(process.cwd(), "public", "videos");

  if (!fs.existsSync(publicVideosDir)) {
    fs.mkdirSync(publicVideosDir, { recursive: true });
  }

  const finalOutputPath = path.join(publicVideosDir, finalFileName);

  try {
    console.log("\n--- Merging videos ---");

    execSync(
      `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${finalOutputPath}"`,
      { stdio: "inherit" }
    );

    console.log("Final video created:", finalOutputPath);
  } catch (err) {
    console.error("FFmpeg merge failed");
    throw err;
  } finally {
    // Clean up concat manifest
    safeUnlink(concatFilePath);

    // Clean up individual scene mp4 clips
    for (const videoPath of videoPaths) {
      safeUnlink(videoPath);
    }

    // Clean up the per-scene media subdirectories left by manim
    for (let i = 0; i < sceneFiles.length; i++) {
      const baseName = path.basename(sceneFiles[i], ".py");
      safeRmdir(path.join(mediaDir, "videos", baseName));
    }
  }

  log += "Video merge\n";

  // ── 6. Upload to S3 ───────────────────────────────────────────────────────
  console.log("\n--- Uploading to S3 ---");

  const s3FileName = `videos/${finalFileName}`;
  let s3Url: string;

  try {
    s3Url = await uploadToS3(finalOutputPath, s3FileName);
    console.log("Uploaded to S3:", s3Url);
  } finally {
    // Delete the local merged mp4 — it now lives on S3
    safeUnlink(finalOutputPath);
  }

  await prisma.videoJob.update({
    where: { id: data.jobId },
    data: { log },
  });

  return {
    videoUrl: s3Url!,
    structuredData,
    scenes,
  };
}
