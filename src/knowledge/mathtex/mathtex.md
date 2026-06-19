# MathTex

Basic equation:

```python
eq = MathTex(r"E = mc^2")
self.play(Write(eq))
```

Fraction:

```python
eq = MathTex(r"\frac{dy}{dx}")
self.play(Write(eq))
```

Transform equation:

```python
eq1 = MathTex(r"x^2")
eq2 = MathTex(r"2x")

self.play(
    TransformMatchingTex(eq1, eq2)
)
```