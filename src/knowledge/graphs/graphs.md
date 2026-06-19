# Graphs

```python
axes = Axes(
    x_range=[-5, 5],
    y_range=[-5, 25]
)

graph = axes.plot(
    lambda x: x**2
)

self.play(Create(graph))
```

Label graph:

```python
label = axes.get_graph_label(
    graph,
    label="f(x)=x^2"
)
```