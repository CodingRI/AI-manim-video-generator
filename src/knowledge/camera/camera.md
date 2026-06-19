# Camera

```python
class ZoomScene(MovingCameraScene):
    def construct(self):
        square = Square()

        self.play(Create(square))

        self.play(
            self.camera.frame.animate.scale(0.5)
        )
```