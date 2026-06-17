
export function cleanJSON(input: string): string {
  return input
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export function cleanCode(input: string): string {
  let code = input
    .replace(/```python/g, "")
    .replace(/```/g, "")
    .trim();

  const manimStart = code.indexOf("from manim import");

  if (manimStart !== -1) {
    code = code.slice(manimStart);
  }

  // Ensure manim import exists
  if (!code.includes("from manim import")) {
    code = "from manim import *\n\n" + code;
  }

  // Ensure numpy import exists if needed
  if (code.includes("np.") && !code.includes("import numpy as np")) {
    code =
      "import numpy as np\n" +
      code;
  }

  // Remove markdown artifacts
  code = code
    .replace(/^Here'?s.*$/gm, "")
    .replace(/^The following.*$/gm, "")
    .replace(/^Python code.*$/gm, "")
    .trim();

  return code;
}