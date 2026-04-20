"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Github, Menu, Play, Sparkles, X } from "lucide-react";
import * as THREE from "three";

export default function WelcomePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const [cardTilts, setCardTilts] = useState([
    { rx: 0, ry: 0 },
    { rx: 0, ry: 0 },
    { rx: 0, ry: 0 },
  ]);
  const [cardGlows, setCardGlows] = useState([
    { x: 50, y: 50 },
    { x: 50, y: 50 },
    { x: 50, y: 50 },
  ]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    camera.position.set(0, 0, 55);

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    resize();

    const lm = (col: number, op = 1.0) =>
      new THREE.LineBasicMaterial({
        color: col,
        transparent: true,
        opacity: op,
      });
    const ln = (pts: THREE.Vector3[], mat: THREE.LineBasicMaterial) =>
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);

    const P = 0x7f77dd,
      T = 0x1d9e75,
      C = 0xd85a30,
      B = 0x5bb8f5,
      A = 0xef9f27,
      PK = 0xe879f9,
      W = 0xffffff;

    const groups: THREE.Group[] = [];

    function mkGroup(
      label: string,
      x: number,
      y: number,
      z: number,
      build: (g: THREE.Group) => void,
    ) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      (g as any).label = label;
      (g as any).oy = y;
      (g as any).fp = Math.random() * Math.PI * 2;
      (g as any).fs = 0.2 + Math.random() * 0.25;
      (g as any).rx = (Math.random() - 0.5) * 0.003;
      (g as any).ry = (Math.random() - 0.5) * 0.005;
      build(g);
      scene.add(g);
      groups.push(g);
      return g;
    }

    /* ===== INTERACTIVE GRADIENT BACKGROUND PLANE ===== */
    const gradientMat = new THREE.ShaderMaterial({
      uniforms: {
        uMouse: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 uMouse;
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 mouseUV = uMouse * 0.5 + 0.5;
          float d = distance(vUv, mouseUV);
          vec3 purple = vec3(0.35, 0.32, 0.62);
          vec3 teal = vec3(0.1, 0.45, 0.35);
          vec3 dark = vec3(0.025, 0.025, 0.04);
          float wave = sin(d * 5.0 - uTime * 0.7) * 0.5 + 0.5;
          vec3 accent = mix(purple, teal, wave);
          float glow = exp(-d * d * 2.5) * 0.35;
          float ambient = 0.04 + sin(uTime * 0.3 + vUv.x * 3.0) * 0.015;
          float edgeSoft = smoothstep(0.0, 0.15, min(min(vUv.x, vUv.y), min(1.0 - vUv.x, 1.0 - vUv.y)));
          vec3 color = dark + accent * (glow + ambient);
          float alpha = (glow + ambient) * edgeSoft;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    const bgPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 170),
      gradientMat,
    );
    bgPlane.position.z = -38;
    scene.add(bgPlane);

    /* ===== INTERACTIVE GRID MESH ===== */
    const GRID_N = 28,
      GRID_RES = 60,
      GRID_W = 240,
      GRID_H = 140;
    const gridLines: {
      geo: THREE.BufferGeometry;
      mat: THREE.LineBasicMaterial;
      baseCoord: number;
      isH: boolean;
      baseOp: number;
    }[] = [];

    for (let i = 0; i <= GRID_N; i++) {
      const t = i / GRID_N;
      const gradCol = new THREE.Color().lerpColors(
        new THREE.Color(0x2a2444),
        new THREE.Color(0x1a3535),
        t,
      );
      const op = 0.3 + Math.sin(t * Math.PI) * 0.12;

      const hGeo = new THREE.BufferGeometry();
      const hPos = new Float32Array((GRID_RES + 1) * 3);
      const baseY = (t - 0.5) * GRID_H;
      for (let j = 0; j <= GRID_RES; j++) {
        hPos[j * 3] = (j / GRID_RES - 0.5) * GRID_W;
        hPos[j * 3 + 1] = baseY;
        hPos[j * 3 + 2] = -32;
      }
      hGeo.setAttribute("position", new THREE.BufferAttribute(hPos, 3));
      const hMat = lm(gradCol.getHex(), op);
      scene.add(new THREE.Line(hGeo, hMat));
      gridLines.push({ geo: hGeo, mat: hMat, baseCoord: baseY, isH: true, baseOp: op });

      const vGeo = new THREE.BufferGeometry();
      const vPos = new Float32Array((GRID_RES + 1) * 3);
      const baseX = (t - 0.5) * GRID_W;
      for (let j = 0; j <= GRID_RES; j++) {
        vPos[j * 3] = baseX;
        vPos[j * 3 + 1] = (j / GRID_RES - 0.5) * GRID_H;
        vPos[j * 3 + 2] = -32;
      }
      vGeo.setAttribute("position", new THREE.BufferAttribute(vPos, 3));
      const vMat = lm(gradCol.getHex(), op);
      scene.add(new THREE.Line(vGeo, vMat));
      gridLines.push({ geo: vGeo, mat: vMat, baseCoord: baseX, isH: false, baseOp: op });
    }

    const gridPlaneRef = new THREE.Plane(new THREE.Vector3(0, 0, 1), 32);
    const gridTargetVec = new THREE.Vector3();

    /* ===== FLOATING ELEMENTS ===== */

    /* 1. LORENZ ATTRACTOR */
    mkGroup("Lorenz attractor", -36, 16, -8, (g) => {
      const pts: THREE.Vector3[] = [];
      let x = 0.1,
        y = 0,
        z = 0;
      const s = 10,
        r = 28,
        b = 8 / 3,
        dt = 0.005;
      for (let i = 0; i < 8000; i++) {
        const dx = s * (y - x),
          dy = x * (r - z) - y,
          dz = x * y - b * z;
        x += dx * dt;
        y += dy * dt;
        z += dz * dt;
        pts.push(new THREE.Vector3(x * 0.13, y * 0.13, z * 0.1 - 2));
      }
      const cols = [0x4fc3f7, 0x60a5fa, 0x818cf8, 0xa78bfa, 0x7dd3fc, 0x93c5fd];
      const N = pts.length;
      for (let s2 = 0; s2 < 6; s2++) {
        const a2 = Math.floor((N * s2) / 6),
          b2 = Math.floor((N * (s2 + 1)) / 6);
        g.add(ln(pts.slice(a2, b2 + 1), lm(cols[s2], 0.72)));
      }
    });

    /* 2. SPACETIME GRID */
    mkGroup("Spacetime curvature", 34, 20, -10, (g) => {
      g.rotation.x = 0.5;
      const N = 18,
        SZ = 7;
      const wy = (xi: number, zi: number) => {
        const dx = xi - N / 2,
          dz = zi - N / 2;
        return -2.6 / (Math.sqrt(dx * dx + dz * dz) + 0.6);
      };
      for (let i = 0; i <= N; i++) {
        const row: THREE.Vector3[] = [],
          col: THREE.Vector3[] = [];
        for (let j = 0; j <= N; j++) {
          row.push(
            new THREE.Vector3(
              (j - N / 2) * (SZ / N),
              wy(j, i),
              (i - N / 2) * (SZ / N),
            ),
          );
          col.push(
            new THREE.Vector3(
              (i - N / 2) * (SZ / N),
              wy(i, j),
              (j - N / 2) * (SZ / N),
            ),
          );
        }
        g.add(ln(row, lm(T, 0.5)));
        g.add(ln(col, lm(T, 0.5)));
      }
      const sph = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 14, 14),
        new THREE.MeshBasicMaterial({ color: A }),
      );
      sph.position.set(0, -0.45, 0);
      g.add(sph);
    });

    /* 3. DEEP NEURAL NETWORK */
    mkGroup("Deep neural network", -28, -18, -6, (g) => {
      const layers = [[0], [1, -1], [1.6, 0.53, -0.53, -1.6], [1, -1], [0]];
      const xs = [-3.5, -1.75, 0, 1.75, 3.5];
      const ncols = [B, PK, PK, PK, 0xfde047];
      const nodes: { x: number; y: number; li: number }[] = [];
      layers.forEach((ys, li) => {
        ys.forEach((y) => {
          nodes.push({ x: xs[li], y, li });
          const ring: THREE.Vector3[] = [];
          for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.14)
            ring.push(
              new THREE.Vector3(
                xs[li] + Math.cos(t) * 0.22,
                y + Math.sin(t) * 0.22,
                0,
              ),
            );
          g.add(ln(ring, lm(ncols[li], 0.88)));
        });
      });
      nodes.forEach((a) => {
        nodes.forEach((b) => {
          if (b.li === a.li + 1)
            g.add(
              ln(
                [
                  new THREE.Vector3(a.x, a.y, 0),
                  new THREE.Vector3(b.x, b.y, 0),
                ],
                lm(0x2a3060, 0.38),
              ),
            );
        });
      });
    });

    /* 4. GAUSSIAN SURFACE */
    mkGroup("Gaussian surface e^(-r²)", 36, -16, -10, (g) => {
      g.rotation.x = 0.4;
      g.rotation.y = 0.45;
      const N = 20,
        R = 3.2;
      const grid: THREE.Vector3[][] = Array.from({ length: N + 1 }, () => []);
      for (let i = 0; i <= N; i++)
        for (let j = 0; j <= N; j++) {
          const x = (i / N) * 2 - 1,
            y2 = (j / N) * 2 - 1;
          grid[i][j] = new THREE.Vector3(
            x * R,
            Math.exp(-(x * x * R * R + y2 * y2 * R * R) * 0.5) * 2.8,
            y2 * R,
          );
        }
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const col = new THREE.Color().setHSL(0.52 - t * 0.18, 0.8, 0.55);
        g.add(ln(grid[i], lm(col.getHex(), 0.6)));
        g.add(
          ln(
            grid.map((row) => row[i]),
            lm(col.getHex(), 0.55),
          ),
        );
      }
      const ax = 3.6;
      (
        [
          [1, 0, 0, C],
          [0, 1, 0, W],
          [0, 0, 1, B],
        ] as [number, number, number, number][]
      ).forEach(([dx, dy, dz, c]) => {
        g.add(
          ln(
            [
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(dx * ax, dy * ax, dz * ax),
            ],
            lm(c, 0.4),
          ),
        );
      });
    });

    /* 5. TORUS KNOT */
    mkGroup("Torus knot (2,3)", 3, 24, -14, (g) => {
      const pts: THREE.Vector3[] = [];
      for (let t = 0; t <= Math.PI * 4 + 0.01; t += 0.012) {
        const r = Math.cos(3 * t) + 2;
        pts.push(
          new THREE.Vector3(
            r * Math.cos(2 * t) * 1.5,
            r * Math.sin(2 * t) * 1.5,
            -Math.sin(3 * t) * 1.5,
          ),
        );
      }
      const N = pts.length;
      const cols = [P, 0x818cf8, PK, C, A, T, B, 0xa78bfa];
      for (let s = 0; s < 8; s++)
        g.add(
          ln(
            pts.slice(
              Math.floor((N * s) / 8),
              Math.floor((N * (s + 1)) / 8) + 1,
            ),
            lm(cols[s], 0.82),
          ),
        );
    });

    /* 6. FOURIER DECOMPOSITION */
    mkGroup("Fourier decomposition", -14, -24, -6, (g) => {
      const ax = 4.2;
      g.add(
        ln(
          [new THREE.Vector3(-ax, 0, 0), new THREE.Vector3(ax, 0, 0)],
          lm(0x222233, 0.8),
        ),
      );
      g.add(
        ln(
          [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(0, 1.8, 0)],
          lm(0x222233, 0.8),
        ),
      );
      const harmonics: [number, number, number][] = [
        [1, P, 0.9],
        [3, T, 0.65],
        [5, C, 0.5],
        [7, B, 0.4],
      ];
      harmonics.forEach(([n, col, op]) => {
        const pts: THREE.Vector3[] = [];
        for (let x = -ax; x <= ax; x += 0.04)
          pts.push(new THREE.Vector3(x, Math.sin(n * x * 0.85) / n, 0));
        g.add(ln(pts, lm(col, op)));
      });
      const sumPts: THREE.Vector3[] = [];
      for (let x = -ax; x <= ax; x += 0.04) {
        let y = 0;
        harmonics.forEach(([n]) => {
          y += Math.sin(n * x * 0.85) / n;
        });
        sumPts.push(new THREE.Vector3(x, y, 0));
      }
      g.add(ln(sumPts, lm(W, 0.65)));
    });

    /* 7. RÖSSLER ATTRACTOR */
    mkGroup("Rössler attractor", 40, 2, -12, (g) => {
      const pts: THREE.Vector3[] = [];
      let x = 1,
        y = 0,
        z = 0;
      const a = 0.2,
        bv = 0.2,
        cv = 5.7,
        dt = 0.006;
      for (let i = 0; i < 6000; i++) {
        const dx = -y - z,
          dy = x + a * y,
          dz = bv + z * (x - cv);
        x += dx * dt;
        y += dy * dt;
        z += dz * dt;
        if (i > 200)
          pts.push(new THREE.Vector3(x * 0.18, y * 0.18, z * 0.09 - 1.2));
      }
      const N = pts.length;
      const cols = [PK, 0xf472b6, C, 0xfb923c, A];
      for (let s = 0; s < 5; s++)
        g.add(
          ln(
            pts.slice(
              Math.floor((N * s) / 5),
              Math.floor((N * (s + 1)) / 5) + 1,
            ),
            lm(cols[s], 0.72),
          ),
        );
    });

    /* 8. 4×4 MATRIX */
    mkGroup("4×4 linear transform matrix", -42, 4, -8, (g) => {
      const cell = 0.9,
        rows = 4,
        cols = 4;
      const pal = [B, T, P, 0x60a5fa];
      for (let r = 0; r < rows; r++)
        for (let c2 = 0; c2 < cols; c2++) {
          const rx = (c2 - (cols - 1) / 2) * cell,
            ry = (r - (rows - 1) / 2) * cell;
          g.add(
            ln(
              [
                new THREE.Vector3(rx, ry, 0),
                new THREE.Vector3(rx + cell * 0.85, ry, 0),
                new THREE.Vector3(rx + cell * 0.85, ry + cell * 0.85, 0),
                new THREE.Vector3(rx, ry + cell * 0.85, 0),
                new THREE.Vector3(rx, ry, 0),
              ],
              lm(pal[(r + c2) % 4], 0.55),
            ),
          );
        }
    });

    /* 9. DERIVATIVE + TANGENT LINES */
    mkGroup("Derivative — tangent lines", 20, 22, -8, (g) => {
      const ax = 2.5;
      g.add(
        ln(
          [new THREE.Vector3(-ax, 0, 0), new THREE.Vector3(ax, 0, 0)],
          lm(0x222233, 0.8),
        ),
      );
      g.add(
        ln(
          [
            new THREE.Vector3(0, -0.2, 0),
            new THREE.Vector3(0, ax * ax * 0.85 + 0.2, 0),
          ],
          lm(0x222233, 0.8),
        ),
      );
      const curve: THREE.Vector3[] = [];
      for (let x = -ax; x <= ax; x += 0.04)
        curve.push(new THREE.Vector3(x, x * x * 0.85, 0));
      g.add(ln(curve, lm(A, 0.9)));
      [-1.4, -0.7, 0, 0.8, 1.5].forEach((x0) => {
        const y0 = x0 * x0 * 0.85,
          m = 2 * x0 * 0.85;
        g.add(
          ln(
            [
              new THREE.Vector3(x0 - 0.7, y0 - m * 0.7, 0),
              new THREE.Vector3(x0 + 0.7, y0 + m * 0.7, 0),
            ],
            lm(T, 0.48),
          ),
        );
        const dot: THREE.Vector3[] = [];
        for (let t = 0; t <= Math.PI * 2; t += 0.22)
          dot.push(
            new THREE.Vector3(
              x0 + Math.cos(t) * 0.07,
              y0 + Math.sin(t) * 0.07,
              0,
            ),
          );
        g.add(ln(dot, lm(W, 0.85)));
      });
    });

    /* 10. SINE WAVE */
    mkGroup("Sine wave — f(x) = sin(x)", -24, 22, -7, (g) => {
      const ax = 3.5;
      g.add(
        ln(
          [new THREE.Vector3(-ax, 0, 0), new THREE.Vector3(ax, 0, 0)],
          lm(0x333344, 0.6),
        ),
      );
      const pts: THREE.Vector3[] = [];
      for (let x = -ax; x <= ax; x += 0.04)
        pts.push(new THREE.Vector3(x, Math.sin(x) * 1.1, 0));
      g.add(ln(pts, lm(P, 0.9)));
    });

    /* 11. PARABOLA */
    mkGroup("Parabola — f(x) = x²", 28, 8, -5, (g) => {
      const ax = 2.2;
      g.add(
        ln(
          [new THREE.Vector3(-ax, 0, 0), new THREE.Vector3(ax, 0, 0)],
          lm(0x333344, 0.6),
        ),
      );
      g.add(
        ln(
          [
            new THREE.Vector3(0, -0.1, 0),
            new THREE.Vector3(0, ax * ax + 0.2, 0),
          ],
          lm(0x333344, 0.6),
        ),
      );
      const pts: THREE.Vector3[] = [];
      for (let x = -ax; x <= ax; x += 0.05)
        pts.push(new THREE.Vector3(x, x * x, 0));
      g.add(ln(pts, lm(A, 0.88)));
    });

    /* 12. CIRCLE WITH RADIUS */
    mkGroup("Unit circle", -10, 16, -5, (g) => {
      const ring: THREE.Vector3[] = [];
      for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.06)
        ring.push(new THREE.Vector3(Math.cos(t) * 1.2, Math.sin(t) * 1.2, 0));
      g.add(ln(ring, lm(T, 0.85)));
      g.add(
        ln(
          [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.2, 0, 0)],
          lm(T, 0.5),
        ),
      );
      g.add(
        ln(
          [new THREE.Vector3(-1.4, 0, 0), new THREE.Vector3(1.4, 0, 0)],
          lm(0x333344, 0.5),
        ),
      );
      g.add(
        ln(
          [new THREE.Vector3(0, -1.4, 0), new THREE.Vector3(0, 1.4, 0)],
          lm(0x333344, 0.5),
        ),
      );
    });

    /* 13. COORDINATE AXES */
    mkGroup("Coordinate axes", 10, -8, -4, (g) => {
      const len = 2.2;
      (
        [
          [1, 0, 0, C],
          [0, 1, 0, T],
          [0, 0, 1, B],
        ] as [number, number, number, number][]
      ).forEach(([dx, dy, dz, c]) => {
        g.add(
          ln(
            [
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(dx * len, dy * len, dz * len),
            ],
            lm(c, 0.8),
          ),
        );
      });
      for (let i = -1.5; i <= 1.5; i += 0.5) {
        if (Math.abs(i) < 0.01) continue;
        g.add(
          ln(
            [new THREE.Vector3(i, -0.08, 0), new THREE.Vector3(i, 0.08, 0)],
            lm(0x333344, 0.5),
          ),
        );
        g.add(
          ln(
            [new THREE.Vector3(-0.08, i, 0), new THREE.Vector3(0.08, i, 0)],
            lm(0x333344, 0.5),
          ),
        );
      }
    });

    /* 14. HELIX */
    mkGroup("Parametric helix", -36, -22, -9, (g) => {
      const pts: THREE.Vector3[] = [];
      for (let t = 0; t <= Math.PI * 6; t += 0.06)
        pts.push(
          new THREE.Vector3(
            Math.cos(t) * 1.2,
            t / 6 - Math.PI / 2,
            Math.sin(t) * 1.2,
          ),
        );
      g.add(ln(pts, lm(PK, 0.82)));
      g.add(
        ln(
          [
            new THREE.Vector3(0, -Math.PI / 2, 0),
            new THREE.Vector3(0, Math.PI / 2 + 0.5, 0),
          ],
          lm(0x333344, 0.5),
        ),
      );
    });

    /* 15. PI SYMBOL */
    mkGroup("π — Pi", -6, -20, -5, (g) => {
      g.add(
        ln(
          [new THREE.Vector3(-1.1, 0.9, 0), new THREE.Vector3(1.1, 0.9, 0)],
          lm(C, 0.9),
        ),
      );
      (
        [
          [-0.65, -0.4],
          [0.15, 0.35],
        ] as [number, number][]
      ).forEach(([sx, ex]) => {
        const pts: THREE.Vector3[] = [];
        for (let t = 0; t <= 1; t += 0.05) {
          const x = sx + (ex - sx) * t;
          const y = 0.9 - t * t * 1.3;
          pts.push(new THREE.Vector3(x, y, 0));
        }
        g.add(ln(pts, lm(C, 0.82)));
      });
    });

    /* 16. INTEGRAL */
    mkGroup("∫ Integral symbol", 20, -22, -6, (g) => {
      const pts: THREE.Vector3[] = [];
      for (let t = -1; t <= 1; t += 0.04)
        pts.push(
          new THREE.Vector3(Math.sin(t * Math.PI * 0.5) * 0.38, t * 1.1, 0),
        );
      g.add(ln(pts, lm(T, 0.9)));
      const area: THREE.Vector3[] = [];
      for (let t = 0; t <= Math.PI; t += 0.08)
        area.push(
          new THREE.Vector3(
            0.7 + Math.cos(t) * 0.55,
            (t / Math.PI) * 1.7 - 0.55,
            0,
          ),
        );
      g.add(ln(area, lm(P, 0.55)));
    });

    /* 17. TRANSFORMER ATTENTION */
    mkGroup("Transformer attention head", -20, 0, -7, (g) => {
      const rows = 5,
        cols2 = 5,
        cell = 0.55;
      const intensity = [
        [0.9, 0.1, 0.3, 0.05, 0.6],
        [0.1, 0.8, 0.2, 0.4, 0.1],
        [0.4, 0.2, 0.7, 0.1, 0.3],
        [0.05, 0.5, 0.1, 0.9, 0.2],
        [0.3, 0.1, 0.4, 0.2, 0.8],
      ];
      for (let r = 0; r < rows; r++)
        for (let c2 = 0; c2 < cols2; c2++) {
          const rx = (c2 - (cols2 - 1) / 2) * cell,
            ry = (r - (rows - 1) / 2) * cell;
          const val = intensity[r][c2];
          const col = new THREE.Color().setHSL(
            0.7 - val * 0.3,
            0.8,
            0.3 + val * 0.4,
          );
          const filled = new THREE.Mesh(
            new THREE.PlaneGeometry(cell * 0.84, cell * 0.84),
            new THREE.MeshBasicMaterial({
              color: col.getHex(),
              transparent: true,
              opacity: val * 0.6,
            }),
          );
          filled.position.set(rx + cell * 0.42, ry + cell * 0.42, 0);
          g.add(filled);
          g.add(
            ln(
              [
                new THREE.Vector3(rx, ry, 0),
                new THREE.Vector3(rx + cell * 0.84, ry, 0),
                new THREE.Vector3(rx + cell * 0.84, ry + cell * 0.84, 0),
                new THREE.Vector3(rx, ry + cell * 0.84, 0),
                new THREE.Vector3(rx, ry, 0),
              ],
              lm(P, 0.45),
            ),
          );
        }
    });

    /* 18. GRAPH NEURAL NETWORK */
    mkGroup("Graph neural network", 4, -14, -7, (g) => {
      const nodePos = [
        [0, 0],
        [2, 1.2],
        [2, -1.2],
        [-2, 1.2],
        [-2, -1.2],
        [0, 2.5],
        [0, -2.5],
      ];
      const edges = [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 5],
        [4, 6],
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      edges.forEach(([a, b]) => {
        const pa = nodePos[a],
          pb = nodePos[b];
        g.add(
          ln(
            [
              new THREE.Vector3(pa[0], pa[1], 0),
              new THREE.Vector3(pb[0], pb[1], 0),
            ],
            lm(0x334466, 0.4),
          ),
        );
      });
      nodePos.forEach(([nx, ny], i) => {
        const ring: THREE.Vector3[] = [];
        for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.18)
          ring.push(
            new THREE.Vector3(
              nx + Math.cos(t) * 0.25,
              ny + Math.sin(t) * 0.25,
              0,
            ),
          );
        g.add(ln(ring, lm(i === 0 ? A : B, 0.82)));
      });
    });

    /* 19. 3×3 MATRIX */
    mkGroup("3×3 matrix", 30, 16, -9, (g) => {
      const cell = 0.7,
        rows = 3,
        cols = 3;
      const pal = [P, B, T];
      for (let r = 0; r < rows; r++)
        for (let c2 = 0; c2 < cols; c2++) {
          const rx = (c2 - (cols - 1) / 2) * cell,
            ry = (r - (rows - 1) / 2) * cell;
          g.add(
            ln(
              [
                new THREE.Vector3(rx, ry, 0),
                new THREE.Vector3(rx + cell * 0.85, ry, 0),
                new THREE.Vector3(rx + cell * 0.85, ry + cell * 0.85, 0),
                new THREE.Vector3(rx, ry + cell * 0.85, 0),
                new THREE.Vector3(rx, ry, 0),
              ],
              lm(pal[(r + c2) % 3], 0.6),
            ),
          );
        }
    });

    /* ===== NEW ELEMENTS ===== */

    /* 20. SERVER CLUSTER */
    mkGroup("Server cluster", -40, -12, -8, (g) => {
      for (let s = 0; s < 3; s++) {
        const by = (s - 1) * 1.5;
        const w = 2.6,
          h = 1.1;
        g.add(
          ln(
            [
              new THREE.Vector3(-w / 2, by - h / 2, 0),
              new THREE.Vector3(w / 2, by - h / 2, 0),
              new THREE.Vector3(w / 2, by + h / 2, 0),
              new THREE.Vector3(-w / 2, by + h / 2, 0),
              new THREE.Vector3(-w / 2, by - h / 2, 0),
            ],
            lm(B, 0.55),
          ),
        );
        for (let d = 0; d < 3; d++) {
          const ring: THREE.Vector3[] = [];
          for (let t = 0; t <= Math.PI * 2; t += 0.3)
            ring.push(
              new THREE.Vector3(
                -w / 2 + 0.4 + d * 0.35 + Math.cos(t) * 0.06,
                by + Math.sin(t) * 0.06,
                0,
              ),
            );
          g.add(ln(ring, lm(d === 0 ? T : d === 1 ? A : B, 0.8)));
        }
        for (let v = 0; v < 4; v++) {
          const vx = 0.3 + v * 0.4;
          g.add(
            ln(
              [
                new THREE.Vector3(vx, by - h * 0.3, 0),
                new THREE.Vector3(vx, by + h * 0.3, 0),
              ],
              lm(0x222244, 0.3),
            ),
          );
        }
      }
    });

    /* 21. MÖBIUS STRIP */
    mkGroup("Möbius strip", 42, -10, -11, (g) => {
      const strips = 12;
      for (let s = 0; s <= strips; s++) {
        const pts: THREE.Vector3[] = [];
        const v = (s / strips - 0.5) * 0.6;
        for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.08) {
          const halfT = t / 2;
          const r = 2 + v * Math.cos(halfT);
          pts.push(
            new THREE.Vector3(
              r * Math.cos(t),
              r * Math.sin(t),
              v * Math.sin(halfT),
            ),
          );
        }
        const col = new THREE.Color().setHSL(
          0.75 + (s / strips) * 0.2,
          0.6,
          0.5,
        );
        g.add(ln(pts, lm(col.getHex(), 0.55)));
      }
    });

    /* 22. FIBONACCI SPIRAL */
    mkGroup("Fibonacci spiral", 14, 14, -7, (g) => {
      const pts: THREE.Vector3[] = [];
      const golden = 1.618033988749;
      for (let t = 0; t <= Math.PI * 8; t += 0.04) {
        const r = Math.pow(golden, t / (Math.PI * 2)) * 0.12;
        pts.push(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), 0));
      }
      g.add(ln(pts, lm(A, 0.78)));
      const rectSizes = [0.12, 0.12, 0.24, 0.36, 0.6, 0.96, 1.56];
      let rx = 0,
        ry = 0;
      rectSizes.forEach((s, i) => {
        const corners = [
          new THREE.Vector3(rx, ry, 0),
          new THREE.Vector3(rx + s, ry, 0),
          new THREE.Vector3(rx + s, ry + s, 0),
          new THREE.Vector3(rx, ry + s, 0),
          new THREE.Vector3(rx, ry, 0),
        ];
        g.add(ln(corners, lm(0x222244, 0.25)));
        if (i % 4 === 0) rx += s;
        else if (i % 4 === 1) ry += s;
        else if (i % 4 === 2) rx -= rectSizes[i - 1];
        else ry -= rectSizes[i - 1];
      });
    });

    /* 23. LISSAJOUS CURVE */
    mkGroup("Lissajous curve", -30, 10, -6, (g) => {
      const pts: THREE.Vector3[] = [];
      for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.015) {
        pts.push(
          new THREE.Vector3(Math.sin(3 * t + 0.5) * 2, Math.sin(2 * t) * 2, 0),
        );
      }
      const N = pts.length;
      const cols = [PK, 0xf472b6, P, 0x818cf8];
      for (let s = 0; s < 4; s++)
        g.add(
          ln(
            pts.slice(
              Math.floor((N * s) / 4),
              Math.floor((N * (s + 1)) / 4) + 1,
            ),
            lm(cols[s], 0.75),
          ),
        );
    });

    /* 24. WAVE INTERFERENCE */
    mkGroup("Wave interference", 24, -14, -7, (g) => {
      const ax = 4;
      g.add(
        ln(
          [new THREE.Vector3(-ax, 0, 0), new THREE.Vector3(ax, 0, 0)],
          lm(0x222233, 0.5),
        ),
      );
      const w1: THREE.Vector3[] = [];
      for (let x = -ax; x <= ax; x += 0.04)
        w1.push(new THREE.Vector3(x, Math.sin(x * 2) * 0.6, 0));
      g.add(ln(w1, lm(B, 0.45)));
      const w2: THREE.Vector3[] = [];
      for (let x = -ax; x <= ax; x += 0.04)
        w2.push(new THREE.Vector3(x, Math.sin(x * 2.5 + 1) * 0.6, 0));
      g.add(ln(w2, lm(T, 0.45)));
      const ws: THREE.Vector3[] = [];
      for (let x = -ax; x <= ax; x += 0.04)
        ws.push(
          new THREE.Vector3(
            x,
            Math.sin(x * 2) * 0.6 + Math.sin(x * 2.5 + 1) * 0.6,
            0,
          ),
        );
      g.add(ln(ws, lm(P, 0.85)));
    });

    /* 25. DOUBLE HELIX */
    mkGroup("Double helix", -38, 20, -9, (g) => {
      const pts1: THREE.Vector3[] = [],
        pts2: THREE.Vector3[] = [];
      for (let t = 0; t <= Math.PI * 6; t += 0.06) {
        const y = t / 3 - Math.PI;
        pts1.push(new THREE.Vector3(Math.cos(t) * 1, y, Math.sin(t) * 1));
        pts2.push(
          new THREE.Vector3(
            Math.cos(t + Math.PI) * 1,
            y,
            Math.sin(t + Math.PI) * 1,
          ),
        );
      }
      g.add(ln(pts1, lm(B, 0.72)));
      g.add(ln(pts2, lm(PK, 0.72)));
      for (let t = 0; t <= Math.PI * 6; t += Math.PI / 2) {
        const y = t / 3 - Math.PI;
        g.add(
          ln(
            [
              new THREE.Vector3(Math.cos(t), y, Math.sin(t)),
              new THREE.Vector3(
                Math.cos(t + Math.PI),
                y,
                Math.sin(t + Math.PI),
              ),
            ],
            lm(0x334466, 0.3),
          ),
        );
      }
    });

    /* ===== RAYCASTER & MOUSE ===== */
    const ray = new THREE.Raycaster();
    (ray.params as any).Line = { threshold: 0.3 };
    const mouse = { px: 0, py: 0, sx: 0, sy: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth,
        h = window.innerHeight;
      mouse.px = (e.clientX / w) * 2 - 1;
      mouse.py = -(e.clientY / h) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let clock = 0;

    function tick() {
      requestAnimationFrame(tick);
      clock += 0.009;

      mouse.sx += (mouse.px - mouse.sx) * 0.05;
      mouse.sy += (mouse.py - mouse.sy) * 0.05;

      camera.position.x += (mouse.sx * 2.5 - camera.position.x) * 0.03;
      camera.position.y += (mouse.sy * 1.2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      gradientMat.uniforms.uMouse.value.set(mouse.sx, mouse.sy);
      gradientMat.uniforms.uTime.value = clock;

      ray.setFromCamera(new THREE.Vector2(mouse.sx, mouse.sy), camera);
      const intersected = ray.ray.intersectPlane(gridPlaneRef, gridTargetVec);
      const gpx = intersected ? gridTargetVec.x : 0;
      const gpy = intersected ? gridTargetVec.y : 0;

      gridLines.forEach(({ geo, mat, baseCoord, isH, baseOp }) => {
        const pos = geo.getAttribute("position") as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        const count = pos.count;
        for (let j = 0; j < count; j++) {
          const x = arr[j * 3],
            y = arr[j * 3 + 1];
          const dx = x - gpx,
            dy = y - gpy;
          const dist2 = dx * dx + dy * dy;
          const mouseWarp = Math.exp(-dist2 / 600) * 10;
          const ambient = Math.sin(clock * 1.2 + x * 0.04 + y * 0.06) * 0.4;
          arr[j * 3 + 2] = -32 + mouseWarp + ambient;
        }
        pos.needsUpdate = true;

        const perpDist = isH
          ? Math.abs(baseCoord - gpy)
          : Math.abs(baseCoord - gpx);
        const highlight = Math.exp(-(perpDist * perpDist) / 250) * 0.45;
        mat.opacity = baseOp + highlight;
      });

      const allC: THREE.Object3D[] = [];
      groups.forEach((g) =>
        g.traverse((c) => {
          if ((c as any).isLine || (c as any).isMesh) {
            (c as any)._pg = g;
            allC.push(c);
          }
        }),
      );

      const hits = ray.intersectObjects(allC, false);
      const hitG: THREE.Group | null =
        hits.length > 0 ? (hits[0].object as any)._pg : null;

      groups.forEach((g) => {
        const isH = g === hitG;
        const ts = isH ? 1.22 : 1.0;
        g.scale.x += (ts - g.scale.x) * 0.1;
        g.scale.y = g.scale.z = g.scale.x;

        g.rotation.x += (g as any).rx;
        g.rotation.y += (g as any).ry;

        const oy: number = (g as any).oy;
        g.position.y =
          oy + Math.sin(clock * (g as any).fs + (g as any).fp) * 1.6;

        g.traverse((c) => {
          const mat = (c as any).material;
          if (!mat || mat.opacity === undefined) return;
          if ((c as any)._bop === undefined) (c as any)._bop = mat.opacity;
          const base: number = (c as any)._bop;
          const target = isH ? Math.min(1.0, base * 1.9) : base;
          mat.opacity += (target - mat.opacity) * 0.1;
        });
      });

      renderer.render(scene, camera);
    }

    tick();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
    };
  }, []);

  const aboutCards = [
    {
      step: "Step 01",
      title: "Describe",
      desc: "Type a natural language prompt describing the math concept you want to visualize.",
    },
    {
      step: "Step 02",
      title: "Generate",
      desc: "AI plans scenes, generates Manim code, and renders each animation segment automatically.",
    },
    {
      step: "Step 03",
      title: "Export",
      desc: "Get a polished MP4 video ready to share, embed, or present anywhere.",
    },
  ];

  const handleCardMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setCardTilts((prev) => {
      const next = [...prev];
      next[i] = { rx: -(y - 0.5) * 14, ry: (x - 0.5) * 14 };
      return next;
    });
    setCardGlows((prev) => {
      const next = [...prev];
      next[i] = { x: x * 100, y: y * 100 };
      return next;
    });
  };

  const handleCardLeave = (i: number) => {
    setCardTilts((prev) => {
      const next = [...prev];
      next[i] = { rx: 0, ry: 0 };
      return next;
    });
    setCardGlows((prev) => {
      const next = [...prev];
      next[i] = { x: 50, y: 50 };
      return next;
    });
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main
      className="relative bg-[#050508] text-white overflow-x-hidden"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* THREE.JS LAYER — fixed so it persists behind scroll */}
      <div className="fixed inset-0 z-0">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none opacity-0 transition-opacity duration-200 bg-[#0c0c14]/95 border border-[#7F77DD]/30 rounded-md px-2.5 py-1.5 text-[10px] text-[#9d98e8] whitespace-nowrap z-50"
          style={{ top: 0, left: 0 }}
        />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-30 border-b border-neutral-800/40 bg-[#050508]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 md:px-8 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
                  stroke="white"
                  strokeWidth="1.2"
                  fill="none"
                />
                <circle cx="7" cy="7" r="1.5" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-medium text-neutral-200 tracking-tight">
              Manim Studio
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={scrollToAbout}
              className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/50 transition-colors"
            >
              About
            </button>
            {["Pricing", "Docs"].map((item) => (
              <button
                key={item}
                className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/50 transition-colors"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => window.open("https://github.com", "_blank")}
              className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-500 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/50 transition-colors ml-1"
            >
              <Github size={13} />
              GitHub
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/auth")}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#7F77DD] hover:bg-[#6e66cc] text-white text-xs rounded-lg transition-all active:scale-95"
            >
              <Sparkles size={11} />
              Create video
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 px-4 pb-4 border-t border-neutral-800/30 pt-3">
            <button
              onClick={() => {
                scrollToAbout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/50 transition-colors"
            >
              About
            </button>
            {["Pricing", "Docs"].map((item) => (
              <button
                key={item}
                className="w-full text-left px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/50 transition-colors"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => window.open("https://github.com", "_blank")}
              className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/50 transition-colors"
            >
              <Github size={13} />
              GitHub
            </button>
            <button
              onClick={() => {
                router.push("/auth");
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-[#7F77DD] hover:bg-[#6e66cc] text-white text-xs rounded-lg transition-all active:scale-95"
            >
              <Sparkles size={11} />
              Create video
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7F77DD]/8 border border-[#7F77DD]/20 rounded-full text-[10px] text-[#9d98e8] tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7F77DD] animate-pulse" />
          Powered by Manim Community
        </div>

        <h1
          className="text-6xl font-light text-neutral-100 mb-4 leading-tight tracking-tight max-w-3xl"
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontStyle: "italic",
          }}
        >
          Math,{" "}
          <span style={{ color: "#7F77DD", fontStyle: "normal" }}>
            animated.
          </span>
        </h1>

        <div className="text-[11px] text-neutral-700 tracking-[0.18em] mb-6 uppercase">
          <span style={{ color: "rgba(127,119,221,0.28)" }}>// </span>
          prompt &nbsp;→&nbsp; scenes &nbsp;→&nbsp; render &nbsp;→&nbsp; merge
        </div>

        <p
          className="text-neutral-500 mb-10 max-w-md leading-relaxed"
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: "18px",
            fontWeight: 300,
          }}
        >
          Generate beautiful mathematical videos from a single sentence. No
          code. No Manim knowledge needed.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/auth")}
            className="flex items-center gap-2.5 px-6 py-3 bg-[#7F77DD] hover:bg-[#6e66cc] text-white text-xs rounded-xl transition-all active:scale-95 font-medium tracking-wide"
          >
            Start creating
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => router.push("/auth")}
            className="px-6 py-3 bg-transparent border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 text-xs rounded-xl transition-all"
          >
            View examples
          </button>
        </div>

        <div className="flex items-center gap-10 mt-16">
          {[
            { val: "25+", label: "object types" },
            { val: "AI", label: "scene planning" },
            { val: "MP4", label: "direct export" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="text-2xl font-light text-neutral-300"
                style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
              >
                {s.val}
              </p>
              <p className="text-[10px] text-neutral-700 uppercase tracking-widest mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section
        ref={aboutRef}
        id="about"
        className="relative z-10 py-32 px-6"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,5,8,0.97), rgba(5,5,8,1) 30%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7F77DD]/8 border border-[#7F77DD]/15 rounded-full text-[10px] text-[#7F77DD]/70 tracking-widest uppercase mb-6">
              How it works
            </div>
            <h2
              className="text-4xl font-light text-neutral-200 mb-4"
              style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
            >
              Three steps to{" "}
              <span className="italic" style={{ color: "#7F77DD" }}>
                stunning
              </span>{" "}
              math videos
            </h2>
            <p
              className="text-neutral-600 max-w-md mx-auto leading-relaxed"
              style={{
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontSize: "16px",
              }}
            >
              From prompt to polished mathematical animation — no expertise
              required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aboutCards.map((card, i) => (
              <div
                key={i}
                className="group"
                style={{ perspective: "1000px" }}
                onMouseMove={(e) => handleCardMove(e, i)}
                onMouseLeave={() => handleCardLeave(i)}
              >
                <div
                  className="relative rounded-2xl border border-neutral-800/60 bg-[#0a0a12]/90 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-out group-hover:border-[#7F77DD]/20 group-hover:shadow-[0_0_40px_-12px_rgba(127,119,221,0.15)]"
                  style={{
                    transform: `rotateX(${cardTilts[i].rx}deg) rotateY(${cardTilts[i].ry}deg) scale(${cardTilts[i].rx !== 0 || cardTilts[i].ry !== 0 ? 1.02 : 1})`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#0f0f1a] via-[#0d0d18] to-[#0a0a12]">
                    <video
                      className="w-full h-full object-cover opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full border border-[#7F77DD]/15 group-hover:border-[#7F77DD]/35 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_-5px_rgba(127,119,221,0.2)]">
                        <Play
                          size={20}
                          className="text-[#7F77DD]/30 group-hover:text-[#7F77DD]/65 ml-0.5 transition-colors duration-500"
                        />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent" />
                  </div>

                  <div
                    className="p-6"
                    style={{ transform: "translateZ(20px)" }}
                  >
                    <div className="text-[10px] text-[#7F77DD]/60 uppercase tracking-[0.2em] mb-2.5 font-medium">
                      {card.step}
                    </div>
                    <h3
                      className="text-lg font-medium text-neutral-200 mb-2"
                      style={{
                        fontFamily: "'Crimson Pro', Georgia, serif",
                      }}
                    >
                      {card.title}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>

                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(400px circle at ${cardGlows[i].x}% ${cardGlows[i].y}%, rgba(127,119,221,0.06), transparent 60%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
