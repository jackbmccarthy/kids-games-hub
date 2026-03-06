"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing" | "complete";

interface Gear {
  id: number;
  x: number;
  y: number;
  size: number;
  connected: boolean;
  spinning: boolean;
  rotation: number;
}

export default function GearSpinPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [gears, setGears] = useState<Gear[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);

  const animationRef = useRef<number>(0);

  const generateLevel = useCallback((lvl: number) => {
    const count = 3 + Math.floor(lvl / 2);
    const newGears: Gear[] = [];
    
    // Fixed source gear
    newGears.push({ id: 0, x: 100, y: 200, size: 40, connected: true, spinning: true, rotation: 0 });
    
    // Fixed target gear
    newGears.push({ id: 1, x: 300, y: 200, size: 40, connected: false, spinning: false, rotation: 0 });
    
    // Placeable gears
    for (let i = 2; i < count; i++) {
      newGears.push({
        id: i,
        x: 100 + (i - 2) * 80,
        y: 100 + Math.random() * 200,
        size: 30 + Math.random() * 20,
        connected: false,
        spinning: false,
        rotation: 0,
      });
    }
    
    setGears(newGears);
  }, []);

  const startGame = () => {
    setLevel(1);
    setScore(0);
    generateLevel(1);
    setPhase("playing");
  };

  const handleGearDrag = (id: number, dx: number, dy: number) => {
    setGears((prev) =>
      prev.map((g) => {
        if (g.id !== id || g.id === 0 || g.id === 1) return g;
        return { ...g, x: Math.max(40, Math.min(360, g.x + dx)), y: Math.max(40, Math.min(360, g.y + dy)) };
      })
    );
  };

  const checkConnections = useCallback(() => {
    const sourceGear = gears.find((g) => g.id === 0);
    const targetGear = gears.find((g) => g.id === 1);
    if (!sourceGear || !targetGear) return;

    // Simple distance-based connection check
    const newGears = gears.map((g) => {
      if (g.id === 0) return g;
      
      // Check if connected to any spinning gear
      const connected = gears.some(
        (other) =>
          other.id !== g.id &&
          other.spinning &&
          Math.hypot(g.x - other.x, g.y - other.y) < g.size + other.size + 10
      );
      
      return { ...g, connected, spinning: connected };
    });

    setGears(newGears);

    // Check if target gear is spinning
    if (newGears.find((g) => g.id === 1)?.spinning) {
      setScore((s) => s + level * 100);
      setTimeout(() => {
        setLevel((l) => l + 1);
        generateLevel(level + 1);
      }, 1000);
    }
  }, [gears, level, generateLevel]);

  // Animate spinning gears
  useEffect(() => {
    if (phase !== "playing") return;

    const animate = () => {
      setGears((prev) =>
        prev.map((g) => {
          if (!g.spinning) return g;
          return { ...g, rotation: (g.rotation + 3) % 360 };
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase]);

  useEffect(() => {
    const saved = localStorage.getItem("gear-spin-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("gear-spin-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-700 to-slate-800 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">⚙️ Gear Spin</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-gray-300 mb-2">Connect gears to make them all spin!</p>
          <p className="text-gray-400 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={startGame} className="px-8 py-4 bg-orange-500 text-white font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Level: {level} | Score: {score}</p>

          <div
            className="relative w-[400px] h-[400px] bg-slate-600 rounded-2xl"
            onMouseMove={(e) => {
              if (e.buttons !== 1) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              gears.forEach((g) => {
                if (Math.hypot(x - g.x, y - g.y) < g.size && g.id > 1) {
                  handleGearDrag(g.id, e.movementX, e.movementY);
                }
              });
            }}
            onMouseUp={checkConnections}
          >
            {gears.map((gear) => (
              <div
                key={gear.id}
                className="absolute rounded-full flex items-center justify-center"
                style={{
                  left: gear.x - gear.size,
                  top: gear.y - gear.size,
                  width: gear.size * 2,
                  height: gear.size * 2,
                  background: gear.spinning
                    ? "conic-gradient(from 0deg, #f59e0b, #d97706, #f59e0b)"
                    : gear.id === 1
                    ? "#ef4444"
                    : "#6b7280",
                  transform: `rotate(${gear.rotation}deg)`,
                  cursor: gear.id > 1 ? "grab" : "default",
                }}
              >
                {/* Gear teeth */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-current"
                    style={{
                      top: 0,
                      left: "50%",
                      transform: `translateX(-50%) rotate(${i * 45}deg) translateY(-${gear.size - 5}px)`,
                    }}
                  />
                ))}
                <div className="w-4 h-4 bg-slate-800 rounded-full" />
              </div>
            ))}

            {/* Labels */}
            <div className="absolute top-2 left-2 text-green-400 text-sm">Source</div>
            <div className="absolute top-2 right-2 text-red-400 text-sm">Target</div>
          </div>

          <p className="mt-4 text-gray-400 text-sm">Drag gray gears to connect source to target!</p>

          <button
            onClick={() => setPhase("menu")}
            className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
