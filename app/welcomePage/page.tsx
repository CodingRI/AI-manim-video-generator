"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import * as THREE from "three";

export default function WelcomePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const tooltipEl = tooltipRef.current;
    if (!canvas || !tooltipEl) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    camera.position.set(0, 0, 55);

    function resize() {
      const w = canvas!.parentElement!.clientWidth;
      const h = canvas!.parentElement!.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    const lm = (col: number, op = 1.0) =>
      new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op });
    const ln = (pts: THREE.Vector3[], mat: THREE.LineBasicMaterial) =>
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);

    const P = 0x7f77dd, T = 0x1d9e75, C = 0xd85a30,
          B = 0x5bb8f5, A = 0xef9f27, PK = 0xe879f9,
          W = 0xffffff, DIM = 0x181828;

    const groups: THREE.Group[] = [];

    function mkGroup(
      label: string, x: number, y: number, z: number,
      build: (g: THREE.Group) => void
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

    /* BACKGROUND GRID MESH */
    (() => {
      const N = 28, S = 110;
      for (let i = 0; i <= N; i++) {
        const t = (i / N - 0.5) * S;
        scene.add(ln([new THREE.Vector3(-S / 2, t * 0.45, -32), new THREE.Vector3(S / 2, t * 0.45, -32)], lm(DIM, 0.7)));
        scene.add(ln([new THREE.Vector3(t, -S * 0.25, -32), new THREE.Vector3(t, S * 0.25, -32)], lm(DIM, 0.7)));
      }
    })();

    /* 1. LORENZ ATTRACTOR */
    mkGroup("Lorenz attractor", -22, 8, -5, (g) => {
      const pts: THREE.Vector3[] = [];
      let x = 0.1, y = 0, z = 0;
      const s = 10, r = 28, b = 8 / 3, dt = 0.005;
      for (let i = 0; i < 8000; i++) {
        const dx = s*(y-x), dy = x*(r-z)-y, dz = x*y-b*z;
        x+=dx*dt; y+=dy*dt; z+=dz*dt;
        pts.push(new THREE.Vector3(x*0.13, y*0.13, z*0.1-2));
      }
      const cols = [0x4fc3f7,0x60a5fa,0x818cf8,0xa78bfa,0x7dd3fc,0x93c5fd];
      const N = pts.length;
      for (let s2 = 0; s2 < 6; s2++) {
        const a = Math.floor(N*s2/6), b2 = Math.floor(N*(s2+1)/6);
        g.add(ln(pts.slice(a, b2+1), lm(cols[s2], 0.72)));
      }
    });

    /* 2. SPACETIME GRID */
    mkGroup("Spacetime curvature", 20, 7, -8, (g) => {
      g.rotation.x = 0.5;
      const N = 18, SZ = 7;
      const wy = (xi: number, zi: number) => {
        const dx = xi - N/2, dz = zi - N/2;
        return -2.6 / (Math.sqrt(dx*dx + dz*dz) + 0.6);
      };
      for (let i = 0; i <= N; i++) {
        const row: THREE.Vector3[] = [], col: THREE.Vector3[] = [];
        for (let j = 0; j <= N; j++) {
          row.push(new THREE.Vector3((j-N/2)*SZ/N, wy(j,i), (i-N/2)*SZ/N));
          col.push(new THREE.Vector3((i-N/2)*SZ/N, wy(i,j), (j-N/2)*SZ/N));
        }
        g.add(ln(row, lm(T, 0.5)));
        g.add(ln(col, lm(T, 0.5)));
      }
      const sph = new THREE.Mesh(new THREE.SphereGeometry(0.42,14,14), new THREE.MeshBasicMaterial({color:A}));
      sph.position.set(0,-0.45,0);
      g.add(sph);
    });

    /* 3. DEEP NEURAL NETWORK */
    mkGroup("Deep neural network", -18, -8, -4, (g) => {
      const layers = [[0],[1,-1],[1.6,0.53,-0.53,-1.6],[1,-1],[0]];
      const xs = [-3.5,-1.75,0,1.75,3.5];
      const ncols = [B,PK,PK,PK,0xfde047];
      const nodes: {x:number;y:number;li:number}[] = [];
      layers.forEach((ys,li) => {
        ys.forEach(y => {
          nodes.push({x:xs[li],y,li});
          const ring: THREE.Vector3[] = [];
          for (let t = 0; t <= Math.PI*2+0.01; t+=0.14)
            ring.push(new THREE.Vector3(xs[li]+Math.cos(t)*0.22, y+Math.sin(t)*0.22, 0));
          g.add(ln(ring, lm(ncols[li], 0.88)));
        });
      });
      nodes.forEach(a => {
        nodes.forEach(b => {
          if (b.li === a.li+1)
            g.add(ln([new THREE.Vector3(a.x,a.y,0),new THREE.Vector3(b.x,b.y,0)], lm(0x2a3060, 0.38)));
        });
      });
    });

    /* 4. GAUSSIAN SURFACE */
    mkGroup("Gaussian surface e^(-r²)", 18, -8, -8, (g) => {
      g.rotation.x = 0.4; g.rotation.y = 0.45;
      const N = 20, R = 3.2;
      const grid: THREE.Vector3[][] = Array.from({length:N+1},()=>[]);
      for (let i = 0; i <= N; i++)
        for (let j = 0; j <= N; j++) {
          const x=(i/N*2-1)*R, y=(j/N*2-1)*R;
          grid[i][j] = new THREE.Vector3(x, Math.exp(-(x*x+y*y)*0.5)*2.8, y);
        }
      for (let i = 0; i <= N; i++) {
        const t = i/N;
        const col = new THREE.Color().setHSL(0.52-t*0.18, 0.8, 0.55);
        g.add(ln(grid[i], lm(col.getHex(), 0.6)));
        g.add(ln(grid.map(row=>row[i]), lm(col.getHex(), 0.55)));
      }
      const ax = 3.6;
      [[1,0,0,C],[0,1,0,W],[0,0,1,B]].forEach(([dx,dy,dz,c]) => {
        g.add(ln([new THREE.Vector3(0,0,0),new THREE.Vector3(dx*ax,dy*ax,dz*ax)], lm(c,0.4)));
      });
    });

    /* 5. TORUS KNOT */
    mkGroup("Torus knot (2,3)", 2, 15, -12, (g) => {
      const pts: THREE.Vector3[] = [];
      for (let t = 0; t <= Math.PI*4+0.01; t+=0.012) {
        const r = Math.cos(3*t)+2;
        pts.push(new THREE.Vector3(r*Math.cos(2*t)*1.5, r*Math.sin(2*t)*1.5, -Math.sin(3*t)*1.5));
      }
      const N = pts.length;
      const cols = [P,0x818cf8,PK,C,A,T,B,0xa78bfa];
      for (let s = 0; s < 8; s++)
        g.add(ln(pts.slice(Math.floor(N*s/8), Math.floor(N*(s+1)/8)+1), lm(cols[s], 0.82)));
    });

    /* 6. FOURIER DECOMPOSITION */
    mkGroup("Fourier decomposition", -8, -15, -4, (g) => {
      const ax = 4.2;
      g.add(ln([new THREE.Vector3(-ax,0,0),new THREE.Vector3(ax,0,0)], lm(0x222233,0.8)));
      g.add(ln([new THREE.Vector3(0,-1.8,0),new THREE.Vector3(0,1.8,0)], lm(0x222233,0.8)));
      const harmonics: [number,number,number][] = [[1,P,0.9],[3,T,0.65],[5,C,0.5],[7,B,0.4]];
      harmonics.forEach(([n,col,op]) => {
        const pts: THREE.Vector3[] = [];
        for (let x = -ax; x <= ax; x+=0.04)
          pts.push(new THREE.Vector3(x, Math.sin(n*x*0.85)/n, 0));
        g.add(ln(pts, lm(col, op)));
      });
      const sumPts: THREE.Vector3[] = [];
      for (let x = -ax; x <= ax; x+=0.04) {
        let y = 0;
        harmonics.forEach(([n]) => { y += Math.sin(n*x*0.85)/n; });
        sumPts.push(new THREE.Vector3(x,y,0));
      }
      g.add(ln(sumPts, lm(W, 0.65)));
    });

    /* 7. RÖSSLER ATTRACTOR */
    mkGroup("Rössler attractor", 22, -6, -9, (g) => {
      const pts: THREE.Vector3[] = [];
      let x=1, y=0, z=0;
      const a=0.2, b=0.2, c=5.7, dt=0.006;
      for (let i=0; i<6000; i++) {
        const dx=-y-z, dy=x+a*y, dz=b+z*(x-c);
        x+=dx*dt; y+=dy*dt; z+=dz*dt;
        if (i>200) pts.push(new THREE.Vector3(x*0.18, y*0.18, z*0.09-1.2));
      }
      const N = pts.length;
      const cols = [PK,0xf472b6,C,0xfb923c,A];
      for (let s=0; s<5; s++)
        g.add(ln(pts.slice(Math.floor(N*s/5), Math.floor(N*(s+1)/5)+1), lm(cols[s], 0.72)));
    });

    /* 8. 4×4 MATRIX */
    mkGroup("4×4 linear transform matrix", -24, 2, -6, (g) => {
      const cell=0.9, rows=4, cols=4;
      const pal=[B,T,P,0x60a5fa];
      for (let r=0; r<rows; r++)
        for (let c2=0; c2<cols; c2++) {
          const rx=(c2-(cols-1)/2)*cell, ry=(r-(rows-1)/2)*cell;
          g.add(ln([
            new THREE.Vector3(rx,ry,0),new THREE.Vector3(rx+cell*0.85,ry,0),
            new THREE.Vector3(rx+cell*0.85,ry+cell*0.85,0),
            new THREE.Vector3(rx,ry+cell*0.85,0),new THREE.Vector3(rx,ry,0),
          ], lm(pal[(r+c2)%4], 0.55)));
        }
    });

    /* 9. DERIVATIVE + TANGENT LINES */
    mkGroup("Derivative — tangent lines", 9, 13, -6, (g) => {
      const ax = 2.5;
      g.add(ln([new THREE.Vector3(-ax,0,0),new THREE.Vector3(ax,0,0)], lm(0x222233,0.8)));
      g.add(ln([new THREE.Vector3(0,-0.2,0),new THREE.Vector3(0,ax*ax*0.85+0.2,0)], lm(0x222233,0.8)));
      const curve: THREE.Vector3[] = [];
      for (let x=-ax; x<=ax; x+=0.04) curve.push(new THREE.Vector3(x, x*x*0.85, 0));
      g.add(ln(curve, lm(A, 0.9)));
      [-1.4,-0.7,0,0.8,1.5].forEach(x0 => {
        const y0=x0*x0*0.85, m=2*x0*0.85;
        g.add(ln([new THREE.Vector3(x0-0.7,y0-m*0.7,0),new THREE.Vector3(x0+0.7,y0+m*0.7,0)], lm(T,0.48)));
        const dot: THREE.Vector3[] = [];
        for (let t=0; t<=Math.PI*2; t+=0.22)
          dot.push(new THREE.Vector3(x0+Math.cos(t)*0.07, y0+Math.sin(t)*0.07, 0));
        g.add(ln(dot, lm(W, 0.85)));
      });
    });

    /* 10. SINE WAVE */
    mkGroup("Sine wave — f(x) = sin(x)", -13, 13, -5, (g) => {
      const ax = 3.5;
      g.add(ln([new THREE.Vector3(-ax,0,0),new THREE.Vector3(ax,0,0)], lm(0x333344,0.6)));
      const pts: THREE.Vector3[] = [];
      for (let x=-ax; x<=ax; x+=0.04)
        pts.push(new THREE.Vector3(x, Math.sin(x)*1.1, 0));
      g.add(ln(pts, lm(P, 0.9)));
    });

    /* 11. PARABOLA */
    mkGroup("Parabola — f(x) = x²", 14, 2, -3, (g) => {
      const ax = 2.2;
      g.add(ln([new THREE.Vector3(-ax,0,0),new THREE.Vector3(ax,0,0)], lm(0x333344,0.6)));
      g.add(ln([new THREE.Vector3(0,-0.1,0),new THREE.Vector3(0,ax*ax+0.2,0)], lm(0x333344,0.6)));
      const pts: THREE.Vector3[] = [];
      for (let x=-ax; x<=ax; x+=0.05) pts.push(new THREE.Vector3(x, x*x, 0));
      g.add(ln(pts, lm(A, 0.88)));
    });

    /* 12. CIRCLE WITH RADIUS */
    mkGroup("Unit circle", -5, 10, -3, (g) => {
      const ring: THREE.Vector3[] = [];
      for (let t=0; t<=Math.PI*2+0.01; t+=0.06)
        ring.push(new THREE.Vector3(Math.cos(t)*1.2, Math.sin(t)*1.2, 0));
      g.add(ln(ring, lm(T, 0.85)));
      g.add(ln([new THREE.Vector3(0,0,0),new THREE.Vector3(1.2,0,0)], lm(T,0.5)));
      g.add(ln([new THREE.Vector3(-1.4,0,0),new THREE.Vector3(1.4,0,0)], lm(0x333344,0.5)));
      g.add(ln([new THREE.Vector3(0,-1.4,0),new THREE.Vector3(0,1.4,0)], lm(0x333344,0.5)));
    });

    /* 13. COORDINATE AXES */
    mkGroup("Coordinate axes", 5, -4, -2, (g) => {
      const len = 2.2;
      [[1,0,0,C],[0,1,0,T],[0,0,1,B]].forEach(([dx,dy,dz,c]) => {
        g.add(ln([new THREE.Vector3(0,0,0),new THREE.Vector3(dx*len,dy*len,dz*len)], lm(c,0.8)));
      });
      for (let i=-1.5; i<=1.5; i+=0.5) {
        if (Math.abs(i)<0.01) continue;
        g.add(ln([new THREE.Vector3(i,-0.08,0),new THREE.Vector3(i,0.08,0)], lm(0x333344,0.5)));
        g.add(ln([new THREE.Vector3(-0.08,i,0),new THREE.Vector3(0.08,i,0)], lm(0x333344,0.5)));
      }
    });

    /* 14. HELIX */
    mkGroup("Parametric helix", -20, -14, -7, (g) => {
      const pts: THREE.Vector3[] = [];
      for (let t=0; t<=Math.PI*6; t+=0.06)
        pts.push(new THREE.Vector3(Math.cos(t)*1.2, t/6-Math.PI/2, Math.sin(t)*1.2));
      g.add(ln(pts, lm(PK, 0.82)));
      g.add(ln([new THREE.Vector3(0,-Math.PI/2,0),new THREE.Vector3(0,Math.PI/2+0.5,0)], lm(0x333344,0.5)));
    });

    /* 15. PI SYMBOL */
    mkGroup("π — Pi", -3, -12, -3, (g) => {
      g.add(ln([new THREE.Vector3(-1.1,0.9,0),new THREE.Vector3(1.1,0.9,0)], lm(C,0.9)));
      [[-0.65,-0.4],[0.15,0.35]].forEach(([sx,ex]) => {
        const pts: THREE.Vector3[] = [];
        for (let t=0; t<=1; t+=0.05) {
          const x = sx+(ex-sx)*t;
          const y = 0.9-t*t*1.3;
          pts.push(new THREE.Vector3(x,y,0));
        }
        g.add(ln(pts, lm(C,0.82)));
      });
    });

    /* 16. INTEGRAL */
    mkGroup("∫ Integral symbol", 10, -13, -4, (g) => {
      const pts: THREE.Vector3[] = [];
      for (let t=-1; t<=1; t+=0.04)
        pts.push(new THREE.Vector3(Math.sin(t*Math.PI*0.5)*0.38, t*1.1, 0));
      g.add(ln(pts, lm(T,0.9)));
      const area: THREE.Vector3[] = [];
      for (let t=0; t<=Math.PI; t+=0.08)
        area.push(new THREE.Vector3(0.7+Math.cos(t)*0.55, t/Math.PI*1.7-0.55, 0));
      g.add(ln(area, lm(P,0.55)));
    });

    /* 17. TRANSFORMER ATTENTION */
    mkGroup("Transformer attention head", -10, 4, -5, (g) => {
      const rows=5, cols2=5, cell=0.55;
      const intensity = [
        [0.9,0.1,0.3,0.05,0.6],[0.1,0.8,0.2,0.4,0.1],
        [0.4,0.2,0.7,0.1,0.3],[0.05,0.5,0.1,0.9,0.2],[0.3,0.1,0.4,0.2,0.8],
      ];
      for (let r=0; r<rows; r++)
        for (let c2=0; c2<cols2; c2++) {
          const rx=(c2-(cols2-1)/2)*cell, ry=(r-(rows-1)/2)*cell;
          const val = intensity[r][c2];
          const col = new THREE.Color().setHSL(0.7-val*0.3, 0.8, 0.3+val*0.4);
          const filled = new THREE.Mesh(
            new THREE.PlaneGeometry(cell*0.84, cell*0.84),
            new THREE.MeshBasicMaterial({color:col.getHex(),transparent:true,opacity:val*0.6})
          );
          filled.position.set(rx+cell*0.42, ry+cell*0.42, 0);
          g.add(filled);
          g.add(ln([
            new THREE.Vector3(rx,ry,0),new THREE.Vector3(rx+cell*0.84,ry,0),
            new THREE.Vector3(rx+cell*0.84,ry+cell*0.84,0),
            new THREE.Vector3(rx,ry+cell*0.84,0),new THREE.Vector3(rx,ry,0),
          ], lm(P,0.45)));
        }
    });

    /* 18. GRAPH NEURAL NETWORK */
    mkGroup("Graph neural network", 0, -9, -5, (g) => {
      const nodePos = [[0,0],[2,1.2],[2,-1.2],[-2,1.2],[-2,-1.2],[0,2.5],[0,-2.5]];
      const edges = [[0,1],[0,2],[0,3],[0,4],[1,5],[2,6],[3,5],[4,6],[1,2],[3,4],[5,6]];
      edges.forEach(([a,b]) => {
        const pa=nodePos[a], pb=nodePos[b];
        g.add(ln([new THREE.Vector3(pa[0],pa[1],0),new THREE.Vector3(pb[0],pb[1],0)], lm(0x334466,0.4)));
      });
      nodePos.forEach(([nx,ny],i) => {
        const ring: THREE.Vector3[] = [];
        for (let t=0; t<=Math.PI*2+0.01; t+=0.18)
          ring.push(new THREE.Vector3(nx+Math.cos(t)*0.25, ny+Math.sin(t)*0.25, 0));
        g.add(ln(ring, lm(i===0?A:B, 0.82)));
      });
    });

    /* 19. 3×3 MATRIX */
    mkGroup("3×3 matrix", 17, 13, -7, (g) => {
      const cell=0.7, rows=3, cols=3;
      const pal=[P,B,T];
      for (let r=0; r<rows; r++)
        for (let c2=0; c2<cols; c2++) {
          const rx=(c2-(cols-1)/2)*cell, ry=(r-(rows-1)/2)*cell;
          g.add(ln([
            new THREE.Vector3(rx,ry,0),new THREE.Vector3(rx+cell*0.85,ry,0),
            new THREE.Vector3(rx+cell*0.85,ry+cell*0.85,0),
            new THREE.Vector3(rx,ry+cell*0.85,0),new THREE.Vector3(rx,ry,0),
          ], lm(pal[(r+c2)%3], 0.6)));
        }
    });

    /* RAYCASTER */
    const ray = new THREE.Raycaster();
    (ray.params as any).Line = { threshold: 0.3 };
    const mouse = { px:0, py:0, sx:0, sy:0 };
    let hovLabel: string | null = null;

    const container = canvas.parentElement!;
    container.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.px = ((e.clientX-rect.left)/rect.width)*2-1;
      mouse.py = -((e.clientY-rect.top)/rect.height)*2+1;
      tooltipEl.style.left = (e.clientX-rect.left+14)+"px";
      tooltipEl.style.top  = (e.clientY-rect.top-32)+"px";
    });
    container.addEventListener("mouseleave", () => {
      mouse.px=0; mouse.py=0;
      tooltipEl.style.opacity="0";
    });

    let clock = 0;

    function tick() {
      requestAnimationFrame(tick);
      clock += 0.009;

      mouse.sx += (mouse.px - mouse.sx)*0.05;
      mouse.sy += (mouse.py - mouse.sy)*0.05;

      camera.position.x += (mouse.sx*2.5 - camera.position.x)*0.03;
      camera.position.y += (mouse.sy*1.2 - camera.position.y)*0.03;
      camera.lookAt(0,0,0);

      ray.setFromCamera(new THREE.Vector2(mouse.px, mouse.py), camera);
      const allC: THREE.Object3D[] = [];
      groups.forEach(g => g.traverse(c => {
        if ((c as any).isLine || (c as any).isMesh) {
          (c as any)._pg = g;
          allC.push(c);
        }
      }));

      const hits = ray.intersectObjects(allC, false);
      const hitG: THREE.Group | null = hits.length>0 ? (hits[0].object as any)._pg : null;

    //   if (hitG) {
    //     const lbl: string = (hitG as any).label;
    //     if (lbl !== hovLabel) {
    //       hovLabel = lbl;
    //       tooltipEl.textContent = lbl;
    //       tooltipEl.style.opacity = "1";
    //     }
    //   } else {
    //     if (hovLabel) { hovLabel=null; tooltipEl.style.opacity="0"; }
    //   }

      groups.forEach(g => {
        const isH = g===hitG;
        const ts = isH ? 1.22 : 1.0;
        g.scale.x += (ts-g.scale.x)*0.1;
        g.scale.y = g.scale.z = g.scale.x;

        g.rotation.x += (g as any).rx;
        g.rotation.y += (g as any).ry;

        const oy: number = (g as any).oy;
        g.position.y = oy + Math.sin(clock*(g as any).fs+(g as any).fp)*1.6;

        g.traverse(c => {
          const mat = (c as any).material;
          if (!mat || mat.opacity===undefined) return;
          if ((c as any)._bop===undefined) (c as any)._bop = mat.opacity;
          const base: number = (c as any)._bop;
          const target = isH ? Math.min(1.0, base*1.9) : base;
          mat.opacity += (target-mat.opacity)*0.1;
        });
      });

      renderer.render(scene, camera);
    }

    tick();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, []);

  return (
    <main
      className="relative min-h-screen bg-[#050508] text-white overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* THREE.JS LAYER */}
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none opacity-0 transition-opacity duration-200 bg-[#0c0c14]/95 border border-[#7F77DD]/30 rounded-md px-2.5 py-1.5 text-[10px] text-[#9d98e8] whitespace-nowrap z-50"
          style={{ top: 0, left: 0 }}
        />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-neutral-800/40 bg-[#050508]/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="7" cy="7" r="1.5" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-200 tracking-tight">Manim Studio</span>
        </div>

        <div className="flex items-center gap-1">
          {["About","Pricing","Docs"].map(item => (
            <button key={item} className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/50 transition-colors">
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/auth")}
            className="flex items-center gap-2 px-4 py-2 bg-[#7F77DD] hover:bg-[#6e66cc] text-white text-xs rounded-lg transition-all active:scale-95"
          >
            <Sparkles size={11} />
            Create video
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-6 text-center">

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7F77DD]/8 border border-[#7F77DD]/20 rounded-full text-[10px] text-[#9d98e8] tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7F77DD] animate-pulse" />
          Powered by Manim Community
        </div>

        <h1
          className="text-6xl font-light text-neutral-100 mb-4 leading-tight tracking-tight max-w-3xl"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontStyle: "italic" }}
        >
          Math,{" "}
          <span style={{ color: "#7F77DD", fontStyle: "normal" }}>animated.</span>
        </h1>

        <div className="text-[11px] text-neutral-700 tracking-[0.18em] mb-6 uppercase">
          <span style={{ color: "rgba(127,119,221,0.28)" }}>// </span>
          prompt &nbsp;→&nbsp; scenes &nbsp;→&nbsp; render &nbsp;→&nbsp; merge
        </div>

        <p
          className="text-neutral-500 mb-10 max-w-md leading-relaxed"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "18px", fontWeight: 300 }}
        >
          Generate beautiful mathematical videos from a single sentence.
          No code. No Manim knowledge needed.
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
            { val: "19+", label: "object types" },
            { val: "AI", label: "scene planning" },
            { val: "MP4", label: "direct export" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p
                className="text-2xl font-light text-neutral-300"
                style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
              >
                {s.val}
              </p>
              <p className="text-[10px] text-neutral-700 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}