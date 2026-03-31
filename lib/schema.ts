import { z } from "zod";

export const SceneSchema = z.object({
    title: z.string(),
    explanation: z.string(),
    type: z.enum(["text", "graph", "comparison", "geometry", "numberline", "transform"]),
    visual: z.string(),        
    duration: z.number(),
  });

export const ScenesArraySchema = z.array(SceneSchema);