"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Bug {
  id: number;
  type: "butterfly" | "ladybug" | "beetle" | "bee";
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  points: number;
}

export default function BugGardenPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [collection, setCollection] = useState<string[]>([]);

  const bugsRef = useRef<Bug[]>([]);
  const netRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  const BUG_TYPES = [
    { type: "butterfly", emoji: "🦋", points: 10 },
    { type: "ladybug", emoji: "🐞", points: 5 },
    { type: "beetle", emoji: "🪲", points: 7 },
    { type: "bee", emoji: "🐝", points: -10 },
  ];

  const spawnBug = useCallback(() => {
    const type = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)];
    const bug: Bug = {
      id: Date.now() + Math.random(),
      type: type.type as "butterfly" | "ladybug" | "beetle" | "bee",
      x: Math.random() * (canvasRef.current?.width || 400),
      y: -30,
      vx: (Math.random() - 0.5) * 2,
      vy: 0.5 + Math.random(),
      emoji: type.emoji,
      points: type.points,
    };
    bugsRef.current.push(bug);
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Garden background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#90EE90");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw flowers
    const flowers = ["🌸", "🌺", "🌻", "🌼", "🌷"];
    ctx.font = "30px Arial";
    for (let i = 0; i < 10; i++) {
      const x = (i * 80 + 40) % canvas.width;
      ctx.fillText(flowers[i % flowers.length], x, canvas.height - 20);
    }

    // Spawn bugs
    if (timestamp - lastSpawnRef.current > 1500) {
      spawnBug();
      lastSpawnRef.current = timestamp;
    }

    // Update and draw bugs
    bugsRef.current = bugsRef.current.filter(bug => {
      bug.x += bug.vx;
      bug.y += bug.vy;
      bug.vx += (Math.random() - 0.5) * 0.2;
      bug.vx = Math.max(-2, Math.min(2, bug.vx));

      // Bounce off walls
      if (bug.x < 0 || bug.x > canvas.width - 30) bug.vx *= -1;

      ctx.font = "36px Arial";
      ctx.fillText(bug.emoji, bug.x, bug.y);

      return bug.y < canvas.height + 50;
    });

    // Draw net cursor
    ctx.font = "40px Arial";
    ctx.fillText("🥅", netRef.current.x - 20, netRef.current.y);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, spawnBug]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    netRef.current.x = clientX - rect.left;
    netRef.current.y = clientY - rect.top;
  }, []);

  const handleCatch = useCallback(() => {
    const net = netRef.current;
    bugsRef.current = bugsRef.current.filter(bug => {
      const dist = Math.sqrt((bug.x - net.x) ** 2 + (bug.y - net.y) ** 2);
      if (dist < 50) {
        if (bug.type === "bee") {
          setLives(l => {
            if (l <= 1) setPhase("gameOver");
            return l - 1;
          });
        } else {
          setScore(s => s + bug.points);
          if (!collection.includes(bug.type)) {
            setCollection(c => [...c, bug.type]);
          }
        }
        return false;
      }
      return true;
    });
  }, [collection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.min(500, window.innerWidth);
    canvas.height = 500;

    const moveHandler = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      handleMove(x, y);
    };

    const clickHandler = () => handleCatch();

    canvas.addEventListener("mousemove", moveHandler);
    canvas.addEventListener("touchmove", moveHandler);
    canvas.addEventListener("click", clickHandler);
    canvas.addEventListener("touchstart", clickHandler);

    return () => {
      canvas.removeEventListener("mousemove", moveHandler);
      canvas.removeEventListener("touchmove", moveHandler);
      canvas.removeEventListener("click", clickHandler);
      canvas.removeEventListener("touchstart", clickHandler);
    };
  }, [handleMove, handleCatch]);

  useEffect(() => {
    if (phase === "playing") {
      bugsRef.current = [];
      setScore(0);
      setLives(3);
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  return (
    <main className="min-h-screen bg-green-200 flex flex-col items-center justify-center p-4">
      {phase === "playing" && (
        <div className="flex gap-4 mb-2">
          <div className="bg-white/80 rounded-xl px-4 py-2 shadow">Score: {score}</div>
          <div className="bg-white/80 rounded-xl px-4 py-2 shadow">
            {[...Array(3)].map((_, i) => (
              <span key={i} className={i < lives ? "" : "opacity-30"}>❤️</span>
            ))}
          </div>
          <div className="bg-white/80 rounded-xl px-4 py-2 shadow">🪲 {collection.length}/3</div>
        </div>
      )}

      <canvas ref={canvasRef} className="rounded-2xl shadow-xl" />

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-green-600 mb-2">🦋 Bug Garden</h1>
            <p className="text-gray-600 mb-4">Catch bugs with your net!</p>
            <p className="text-sm text-gray-500 mb-4">🦋🐞🪲 = Points | 🐝 = Avoid!</p>
            <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-green-500 text-white font-bold rounded-xl text-xl">
              ▶️ Play
            </button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-red-500 mb-2">🐝 Ouch!</h2>
            <p className="text-2xl font-bold text-gray-700 my-4">Score: {score}</p>
            <p className="text-lg text-gray-500 mb-4">Collected: {collection.length} types</p>
            <div className="space-y-2">
              <button onClick={() => setPhase("playing")} className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl">Play Again</button>
              <button onClick={() => setPhase("menu")} className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl">Menu</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
