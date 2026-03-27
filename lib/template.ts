import dedent from "dedent";

function safeText(text: string) {
  return text.replace(/"/g, '\\"');
}

export function generateSceneCode(scene: any, index: number) {
  if (scene.type === "text") {
    return dedent(`
      from manim import *

      class Scene${index}(Scene):
          def construct(self):
              title = Text("${safeText(scene.title)}").to_edge(UP)
              body = Text("${safeText(scene.explanation)}", font_size=28).next_to(title, DOWN, buff=0.5)

              self.play(Write(title))
              self.play(FadeIn(body))
              self.wait(${scene.duration})
    `);
  }

  if (scene.type === "graph") {
    return dedent(`
      from manim import *

      class Scene${index}(Scene):
          def construct(self):
              axes = Axes(x_range=[-3,3], y_range=[-1,9])
              graph = axes.plot(lambda x: x**2, color=BLUE)

              title = Text("${safeText(scene.title)}", font_size=32).to_edge(UP)

              self.play(Create(axes))
              self.play(Create(graph))
              self.play(Write(title))
              self.wait(${scene.duration})
    `);
  }

  if (scene.type === "comparison") {
    return dedent(`
      from manim import *
      import numpy as np

      class Scene${index}(Scene):
          def construct(self):
              axes = Axes(x_range=[-3,3], y_range=[-2,2])

              graph1 = axes.plot(lambda x: np.sin(x), color=BLUE)
              graph2 = axes.plot(lambda x: np.sin(2*x), color=RED)

              title = Text("${safeText(scene.title)}", font_size=32).to_edge(UP)

              self.play(Create(axes))
              self.play(Create(graph1))
              self.play(Create(graph2))
              self.play(Write(title))
              self.wait(${scene.duration})
    `);
  }

  return "";
}