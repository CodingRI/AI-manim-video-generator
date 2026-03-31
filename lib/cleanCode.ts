export function cleanJSON(input: string): string {
    return input
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/\n/g, "")
    .trim();
  }

export function cleanCode(input: string): string {
    let code =  input
      .replace(/```python/g, "")
      .replace(/```/g, "")
      .trim();

      if (code.includes("np.") && !code.includes("import numpy as np")) {
        code = "import numpy as np\n" + code;
      }

      code = code.replace(/MathTex\((.*?)\)/g, "Text($1)");
      code = code.replace(/r"(.*?)"/g, '"$1"');

      if (!code.includes("from manim import")) {
        code = "from manim import *\n" + code;
      }
    
      return code;
  }