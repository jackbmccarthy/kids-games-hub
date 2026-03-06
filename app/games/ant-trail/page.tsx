"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing";

interface Ant {
  id: number;
  x: number;
  y: number;
  hasFood: boolean;
}

interface Food {
  x: number;
  y: number;
  collected: boolean;
}

export default function AntTrailPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [ants, setAnts] = useState<Ant[]>([]);
  const [food, setFood] = useState<Food[]>([]);
  const [path, setPath] = useState<{x: number, y: number}[]>([]);
  const [score, setScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startGame = () => {
    setAnts([{ id: 1, x: 200, y: 350, hasFood: false }]);
    setFood([
      { x: 100, y: 100, collected: false },
      { x: 300, y: 150, collected: false },
      { x: 200, y: 50, collected: false },
    ]);
    setPath([]);
    setScore(0);
    setPhase("playing");
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 0, 400, 400);

    // Path
    if (path.length > 1) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    // Food
    food.filter(f => !f.collected).forEach(f => {
      ctx.fillStyle = "#90EE90";
      ctx.beginPath();
      ctx.arc(f.x, f.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#228B22";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🍃", f.x, f.y + 5);
    });

    // Nest
    ctx.fillStyle = "#654321";
    ctx.beginPath();
    ctx.ellipse(200, 380, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ants
    ants.forEach(ant => {
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(ant.hasFood ? "🐜🍎" : "🐜", ant.x, ant.y);
    });
  }, [path, food, ants]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPath(prev => [...prev, { x, y }]);
  };

  useEffect(() => {
    if (phase === "playing") draw();
  }, [phase, draw]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-emerald-700 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🐜 Ant Trail</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-green-100 mb-4">Draw a path for ants to collect food!</p>
          <button onClick={startGame} className="px-8 py-4 bg-yellow-500 text-green-900 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>
          <canvas ref={canvasRef} width={400} height={400} onClick={handleCanvasClick} className="rounded-2xl cursor-crosshair" />
          <p className="text-green-200 mt-2 text-sm">Click to draw path</p>
          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-green-800 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
