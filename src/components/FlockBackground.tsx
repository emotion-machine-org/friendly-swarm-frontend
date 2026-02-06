"use client";

import { useEffect, useRef } from "react";

const FONT = "13px JetBrains Mono, monospace";
const COLORS_NEUTRAL = ["#ccc", "#bbb", "#aaa", "#999", "#888"];
const COLORS_WARM = ["#cca", "#cc9", "#ddaa00", "#eebb00", "#ffcc00"];
const COLS = 40;
const NUM_BOIDS = 80;

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  restTimer: number;
  isResting: boolean;
  wanderAngle: number;
  energy: number;
}

interface Crumb {
  x: number;
  y: number;
  gx: number;
  gy: number;
  strength: number;
}

function blendColors(neutral: string, warm: string, t: number): string {
  const n = parseInt(neutral.slice(1), 16);
  const wc = parseInt(warm.slice(1), 16);
  const nr = (n >> 16) & 255,
    ng = (n >> 8) & 255,
    nb = n & 255;
  const wr = (wc >> 16) & 255,
    wg = (wc >> 8) & 255,
    wb = wc & 255;
  const r = Math.round(nr + (wr - nr) * t);
  const g = Math.round(ng + (wg - ng) * t);
  const b = Math.round(nb + (wb - nb) * t);
  return `rgb(${r},${g},${b})`;
}

export default function FlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.pointerEvents = "auto";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let ROWS = 0;
    let cellW = 0;
    let cellH = 0;
    let density: number[][] = [];
    let warmth: number[][] = [];
    let mouseActivity = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let lastMouseX = -1000;
    let lastMouseY = -1000;
    const boids: Boid[] = [];
    const crumbs: Crumb[] = [];
    let animFrameId: number;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      if (w === 0 || h === 0) return;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);

      cellW = w / COLS;
      cellH = cellW;
      ROWS = Math.ceil(h / cellH);

      density = [];
      warmth = [];
      for (let y = 0; y < ROWS; y++) {
        density[y] = [];
        warmth[y] = [];
        for (let x = 0; x < COLS; x++) {
          density[y][x] = 0;
          warmth[y][x] = 0;
        }
      }
    }

    function initBoids() {
      boids.length = 0;
      for (let i = 0; i < NUM_BOIDS; i++) {
        boids.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          restTimer: Math.random() * 200,
          isResting: Math.random() > 0.5,
          wanderAngle: Math.random() * Math.PI * 2,
          energy: 0.5 + Math.random() * 0.5,
        });
      }
    }

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const moved = Math.abs(mouseX - lastMouseX) + Math.abs(mouseY - lastMouseY);
      if (moved > 2) {
        mouseActivity = Math.min(1, mouseActivity + 0.15);
        if (moved > 8 && cellW > 0) {
          const gx = Math.floor(mouseX / cellW);
          const gy = Math.floor(mouseY / cellH);
          const snapX = gx * cellW + cellW / 2;
          const snapY = gy * cellH + cellH / 2;
          const exists = crumbs.some((c) => c.gx === gx && c.gy === gy);
          if (!exists) {
            crumbs.push({ x: snapX, y: snapY, gx, gy, strength: 1.0 });
            if (crumbs.length > 60) crumbs.shift();
          }
        }
      }
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }

    function step() {
      if (w === 0) return;

      mouseActivity *= 0.985;

      for (let i = crumbs.length - 1; i >= 0; i--) {
        if (crumbs[i].strength <= 0) crumbs.splice(i, 1);
      }

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          density[y][x] *= 0.92;
          warmth[y][x] *= 0.9;
        }
      }

      boids.forEach((boid) => {
        let isAttracted = false;
        let crumbPullX = 0;
        let crumbPullY = 0;
        let nearestCrumbDist = Infinity;
        let nearestCrumbDx = 0;
        let nearestCrumbDy = 0;

        crumbs.forEach((crumb) => {
          const dx = crumb.x - boid.x;
          const dy = crumb.y - boid.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < nearestCrumbDist) {
            nearestCrumbDist = d;
            nearestCrumbDx = dx;
            nearestCrumbDy = dy;
          }

          if (d < 250 && d > 5) {
            const pull = (crumb.strength * (250 - d)) / 250;
            crumbPullX += (dx / d) * pull;
            crumbPullY += (dy / d) * pull;
            isAttracted = true;
          }
          if (d < 20) {
            crumb.strength -= 0.03;
            boid.energy = Math.min(boid.energy + 0.25, 5.0);
          }
        });

        if (crumbs.length > 0 && nearestCrumbDist > 250 && nearestCrumbDist < 600) {
          const pull = (0.3 * (600 - nearestCrumbDist)) / 600;
          crumbPullX += (nearestCrumbDx / nearestCrumbDist) * pull;
          crumbPullY += (nearestCrumbDy / nearestCrumbDist) * pull;
          isAttracted = true;
        }

        if (isAttracted) {
          boid.isResting = false;
          boid.vx += crumbPullX * 0.03;
          boid.vy += crumbPullY * 0.03;
        }

        let sepX = 0,
          sepY = 0,
          sepCount = 0;
        let alignX = 0,
          alignY = 0,
          alignCount = 0;
        let cohX = 0,
          cohY = 0,
          cohCount = 0;

        boids.forEach((other) => {
          if (other === boid) return;
          const dx = other.x - boid.x;
          const dy = other.y - boid.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < 25) {
            sepX -= dx / (d + 1);
            sepY -= dy / (d + 1);
            sepCount++;
          }
          if (d < 60) {
            alignX += other.vx;
            alignY += other.vy;
            alignCount++;
          }
          if (d < 100) {
            cohX += dx;
            cohY += dy;
            cohCount++;
          }
        });

        if (!boid.isResting) {
          if (sepCount > 0) {
            boid.vx += sepX * 0.02;
            boid.vy += sepY * 0.02;
          }
          if (alignCount > 0) {
            boid.vx += (alignX / alignCount - boid.vx) * 0.015;
            boid.vy += (alignY / alignCount - boid.vy) * 0.015;
          }
          if (cohCount > 0) {
            boid.vx += (cohX / cohCount) * 0.0005;
            boid.vy += (cohY / cohCount) * 0.0005;
          }

          if (Math.random() < 0.002) {
            boid.wanderAngle += (Math.random() - 0.5) * 1.5;
            boid.vx += Math.cos(boid.wanderAngle) * 0.15;
            boid.vy += Math.sin(boid.wanderAngle) * 0.15;
          }
        } else {
          boid.vx *= 0.95;
          boid.vy *= 0.95;
        }

        boid.restTimer--;
        if (boid.restTimer <= 0) {
          boid.isResting = !boid.isResting;
          boid.restTimer = 100 + Math.random() * 300;
        }

        const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
        const maxSpeed = isAttracted ? 1.2 : 0.6;
        if (speed > maxSpeed) {
          boid.vx = (boid.vx / speed) * maxSpeed;
          boid.vy = (boid.vy / speed) * maxSpeed;
        }

        boid.x += boid.vx;
        boid.y += boid.vy;

        if (boid.x < 0) boid.x += w;
        if (boid.x >= w) boid.x -= w;
        if (boid.y < 0) boid.y += h;
        if (boid.y >= h) boid.y -= h;

        boid.energy -= 0.0002;

        const gx = Math.floor(boid.x / cellW);
        const gy = Math.floor(boid.y / cellH);
        if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
          density[gy][gx] = Math.min(density[gy][gx] + 0.15 * boid.energy, 1);
          if (isAttracted) {
            warmth[gy][gx] = Math.min(warmth[gy][gx] + 0.15, 0.6);
          }
        }
      });

      const newBoids: Boid[] = [];
      for (let i = boids.length - 1; i >= 0; i--) {
        if (boids[i].energy <= 0 && boids.length > 20) {
          boids.splice(i, 1);
        } else if (
          boids[i].energy > 2.0 &&
          Math.random() < 0.01 &&
          boids.length < 300
        ) {
          const parent = boids[i];
          parent.energy -= 1.0;
          newBoids.push({
            x: parent.x + (Math.random() - 0.5) * 20,
            y: parent.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            restTimer: Math.random() * 200,
            isResting: false,
            wanderAngle: Math.random() * Math.PI * 2,
            energy: 0.8,
          });
        }
      }
      boids.push(...newBoids);
    }

    function draw() {
      if (w === 0) {
        animFrameId = requestAnimationFrame(draw);
        return;
      }

      step();
      ctx!.clearRect(0, 0, w, h);
      ctx!.font = FONT;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      const chars = " .\u00b7:\u2218\u2219\u00b0\u02da*\u2726~";

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const val = density[y][x];
          if (val > 0.03) {
            const charIdx = Math.min(
              Math.floor(val * chars.length),
              chars.length - 1
            );
            const colorIdx = Math.min(
              Math.floor(val * COLORS_NEUTRAL.length),
              COLORS_NEUTRAL.length - 1
            );
            const cellWarmth = warmth[y] ? warmth[y][x] || 0 : 0;
            ctx!.fillStyle = blendColors(
              COLORS_NEUTRAL[colorIdx],
              COLORS_WARM[colorIdx],
              cellWarmth
            );
            ctx!.globalAlpha = Math.min(val * 1.5 + 0.5, 1.0);
            ctx!.fillText(
              chars[charIdx],
              x * cellW + cellW / 2,
              y * cellH + cellH / 2
            );
          }
        }
      }

      const crumbChars = "\u2726*\u00b0\u00b7";
      ctx!.fillStyle = "#d4a000";
      ctx!.globalAlpha = 1;
      crumbs.forEach((crumb) => {
        const charIdx = Math.min(
          Math.floor((1 - crumb.strength) * crumbChars.length),
          crumbChars.length - 1
        );
        ctx!.fillText(crumbChars[charIdx], crumb.x, crumb.y);
      });

      ctx!.globalAlpha = 1;

      // Population counter
      ctx!.fillStyle = "#d4a000";
      ctx!.globalAlpha = 0.3;
      ctx!.font = "10px JetBrains Mono, monospace";
      ctx!.textAlign = "right";
      ctx!.textBaseline = "top";
      ctx!.fillText(String(boids.length), w - 12, 12);
      ctx!.globalAlpha = 1;

      animFrameId = requestAnimationFrame(draw);
    }

    resize();
    initBoids();
    animFrameId = requestAnimationFrame(draw);

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animFrameId);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="flock-bg" />;
}
