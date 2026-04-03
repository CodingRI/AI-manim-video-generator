import { cleanJSON, cleanCode } from "@/lib/cleanCode";
import { callLLM } from "@/lib/llm";
import { buildStructuringPrompt, buildScenePrompt, buildManimPrompt } from "@/lib/promptBuilder";
import { ScenesArraySchema } from "@/lib/schema";
import { generateSceneCode } from "@/lib/template";
import fs from "fs";
import path from "path";
import {prisma} from "@/lib/prisma"
import { execSync } from "child_process";

export async function runPipeline(data: any) {
  const { prompt } = data;

  console.log("Running pipeline for:", prompt);
  let log = "";
  log += "Starting pipeline\n"
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

  log += "Structuring completed\n"
  console.log("Structured data:", structuredData);

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

  const outputDir = path.join(process.cwd(), "generated");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const sceneFiles: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
  
    console.log(`\n--- Generating Scene ${i + 1} (AI) ---`);
  
    const manimPrompt = buildManimPrompt(scene, i + 1);
    const codeRes = await callLLM(manimPrompt);
    const code = cleanCode(codeRes.content);
  
    console.log(`Scene ${i + 1} code:\n`, code);
  
    const fileName = `scene${i + 1}.py`;
    const filePath = path.join(outputDir, fileName);
  
    fs.writeFileSync(filePath, code);
  
    console.log(`Saved: ${filePath}`);
  
    sceneFiles.push(filePath);
  }

  log += "Scenes genrated\n"

  const videoPaths: string[] = [];

  for (let i = 0; i < sceneFiles.length; i++) {
    const filePath = sceneFiles[i];
    const sceneName = `Scene${i + 1}`;

    console.log(`\n--- Rendering ${sceneName} ---`);

    try {
      execSync(`manim ${filePath} ${sceneName} -ql --disable_caching`,
      { stdio: "inherit" });

      const videoPath = `media/videos/${path.basename(
        filePath,
        ".py"
      )}/480p15/${sceneName}.mp4`;

      console.log(`Rendered: ${videoPath}`);

      videoPaths.push(videoPath);
    } catch (err) {
      console.error(`Scene ${sceneName} failed, skipping...`);
      continue; 
    }
  }

  log += "Rendering complete\n"


  const concatFilePath = path.join(process.cwd(), "generated", "concat.txt");

  let concatContent = "";

  if(videoPaths.length == 0) {
    throw new Error("All scenes failed, no video generated")
  }

  for (const videoPath of videoPaths) {
    concatContent += `file '${path.resolve(videoPath)}'\n`;
  }

  fs.writeFileSync(concatFilePath, concatContent);

  console.log("Concat file created:", concatFilePath);

  const fileName = `final-${Date.now()}.mp4`;

  const finalOutputPath = path.join(process.cwd(), "public/videos", fileName);

  try {
    console.log("\n--- Merging videos ---");

    execSync(
      `ffmpeg -f concat -safe 0 -i ${concatFilePath} -c copy ${finalOutputPath}`,
      { stdio: "inherit" }
    );

    console.log("Final video created:", finalOutputPath);
  } catch (err) {
    console.error("FFmpeg merge failed");
    throw err;
  }

  log += "Video merge\n"

  await prisma.videoJob.update({
    where: { id: data.jobId },
    data: { log },
  });

  return {
    videoUrl: `/videos/${fileName}`,
    //videoUrl: `/public/final.mp4`,
    structuredData,
    scenes,
    //sceneFiles,
    //videoPaths,
  };
}
// const firstScene = scenes[0]
// const manimPrompt = buildManimPrompt(firstScene, 1);
// const codeRes = await callLLM(manimPrompt)
// const rawcCode = codeRes.content;
// const cleanedCode = cleanCode(rawcCode)

// console.log("MANIM CODE RAW:", codeRes.content);
// console.log("CLEANED MANIM CODE:\n", cleanedCode);

// console.log("Scenes:", scenes);

// const filePath = path.join(process.cwd(), `scene1.py`)
// fs.writeFileSync(filePath, cleanedCode)

// console.log("Saved Manim file:", filePath);
