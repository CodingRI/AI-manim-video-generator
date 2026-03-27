type Scene = {
    type: "text" | "bullet" | "equation";
    content: string;
    position: "center" | "top" | "bottom";
    animation: "fadeIn" | "write";
  };
  
  export function generateManimCode(scene: Scene, index: number) {
    const safeContent = scene.content.replace(/"/g, '\\"');
  
    let positionCode = "";
    if (scene.position === "top") positionCode = ".to_edge(UP)";
    if (scene.position === "bottom") positionCode = ".to_edge(DOWN)";
  
    const animation =
      scene.animation === "write"
        ? "Write(obj)"
        : "FadeIn(obj)";
  
    return [
      "from manim import *",
      "",
      `class Scene${index}(Scene):`,
      "    def construct(self):",
      `        obj = Text("${safeContent}")${positionCode}`,
      `        self.play(${animation})`,
      "        self.wait(1)",
      "",
    ].join("\n");
  }