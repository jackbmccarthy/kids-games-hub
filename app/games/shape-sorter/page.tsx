"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Shape {
  id: number;
  type: "circle" | "square" | "triangle" | "star";
  x: number;
  y: number;
  rotation: number;
  color: string;
  isDragging: boolean;
}

type GamePhase = "menu" | "playing" | "gameOver";

const SHAPES = ["circle", "square", "triangle", "star"] as const;
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181"];

const SHAPE_PATHS: Record<string, string> = {
  circle: "M 0,-30 A 30,30 0 1,1 0,30 A 30,30 0 1,1 0,-30",
  square: "M -25,-25 L 25,-25 L 25,25 L -25,25 Z",
  triangle: "M 0,-30 L 26,20 L -26,20 Z",
  star: "M 0,-30 L 7,-10 L 28,-10 L 12,5 L 18,28 L 0,15 L -18,28 L -12,5 L -28,-10 L -7,-10 Z",
};

export default function ShapeSorterPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<Shape[]>([]);
  const draggingRef = useRef<Shape | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const createShape = useCallback(() => {
    const type = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const shape: Shape = {
      id: Date.now() + Math.random(),
      type,
      x: 50 + Math.random() * (window.innerWidth - 100),
      y: -50,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      isDragging: false,
    };
    shapesRef.current.push(shape);
  }, []);

  const checkMatch = useCallback((shape: Shape, holeType: string, holeX: number, holeY: number) => {
    const dist = Math.sqrt((shape.x - holeX) ** 2 + (shape.y - holeY) ** 2);
    return dist < 60 && shape.type === holeType;
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, shape: Shape) => {
    e.preventDefault();
    shape.isDragging = true;
    draggingRef.current = shape;
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    draggingRef.current.x = clientX;
    draggingRef.current.y = clientY;
    // Force re-render
    setScore(s => s);
  }, []);

  const handleDragEnd = useCallback((holePositions: Record<string, { x: number; y: number }>) => {
    if (!draggingRef.current) return;
    const shape = draggingRef.current;
    shape.isDragging = false;

    // Check if dropped on correct hole
    const hole = holePositions[shape.type];
    if (hole && checkMatch(shape, shape.type, hole.x, hole.y)) {
      // Correct match!
      shapesRef.current = shapesRef.current.filter(s => s.id !== shape.id);
      const points = 10 * (1 + combo * 0.5);
      setScore(s => s + Math.round(points));
      setCombo(c => c + 1);
    } else {
      // Wrong or missed
      setCombo(0);
      setLives(l => l - 1);
      shapesRef.current = shapesRef.current.filter(s => s.id !== shape.id);
      if (lives <= 1) {
        setPhase("gameOver");
      }
    }

    draggingRef.current = null;
  }, [checkMatch, combo, lives]);

  useEffect(() => {
    if (phase !== "playing") {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      return;
    }

    shapesRef.current = [];
    setScore(0);
    setLives(3);
    setCombo(0);

    spawnIntervalRef.current = setInterval(() => {
      if (shapesRef.current.length < 3 + level) {
        createShape();
      }
    }, 2000 - level * 100);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [phase, level, createShape]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      handleDragMove(x, y);
    };

    const handleUp = () => {
      // Hole positions - bottom of screen
      const holePositions: Record<string, { x: number; y: number }> = {
        circle: { x: window.innerWidth * 0.2, y: window.innerHeight - 100 },
        square: { x: window.innerWidth * 0.4, y: window.innerHeight - 100 },
        triangle: { x: window.innerWidth * 0.6, y: window.innerHeight - 100 },
        star: { x: window.innerWidth * 0.8, y: window.innerHeight - 100 },
      };
      handleDragEnd(holePositions);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [handleDragMove, handleDragEnd]);

  // Animate shapes falling
  useEffect(() => {
    if (phase !== "playing") return;

    const animate = () => {
      shapesRef.current.forEach(shape => {
        if (!shape.isDragging) {
          shape.y += 1 + level * 0.2;
          shape.rotation += 0.5;
        }
      });
      // Remove shapes that fell past screen
      shapesRef.current = shapesRef.current.filter(s => s.y < window.innerHeight + 100);
    };

    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, [phase, level]);

  const holePositions: Record<string, { x: number; y: number }> = {
    circle: { x: 0, y: 0 },
    square: { x: 0, y: 0 },
    triangle: { x: 0, y: 0 },
    star: { x: 0, y: 0 },
  };

  if (typeof window !== "undefined") {
    holePositions.circle = { x: window.innerWidth * 0.2, y: window.innerHeight - 100 };
    holePositions.square = { x: window.innerWidth * 0.4, y: window.innerHeight - 100 };
    holePositions.triangle = { x: window.innerWidth * 0.6, y: window.innerHeight - 100 };
    holePositions.star = { x: window.innerWidth * 0.8, y: window.innerHeight - 100 };
  }

  return (
    <main ref={containerRef} className="min-h-screen bg-gradient-to-b from-purple-200 to-pink-200 relative overflow-hidden">
      {/* Holes at bottom */}
      {Object.entries(holePositions).map(([type, pos]) => (
        <div
          key={type}
          className="absolute"
          style={{ left: pos.x - 40, top: pos.y - 40 }}
        >
          <svg width="80" height="80" viewBox="-40 -40 80 80">
            <path
              d={SHAPE_PATHS[type]}
              fill="rgba(0,0,0,0.3)"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="4"
            />
          </svg>
          <p className="text-center text-xs font-bold text-gray-600 capitalize mt-1">{type}</p>
        </div>
      ))}

      {/* Falling shapes */}
      {phase === "playing" && shapesRef.current.map(shape => (
        <div
          key={shape.id}
          className="absolute cursor-grab active:cursor-grabbing touch-none"
          style={{
            left: shape.x - 40,
            top: shape.y - 40,
            transform: `rotate(${shape.rotation}deg)`,
          }}
          onMouseDown={(e) => handleDragStart(e, shape)}
          onTouchStart={(e) => handleDragStart(e, shape)}
        >
          <svg width="80" height="80" viewBox="-40 -40 80 80">
            <path
              d={SHAPE_PATHS[shape.type]}
              fill={shape.color}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="3"
            />
          </svg>
        </div>
      ))}

      {/* UI */}
      {phase === "playing" && (
        <>
          <div className="absolute top-4 left-4 bg-white/80 rounded-xl px-4 py-2 shadow-lg">
            <p className="font-bold text-gray-700">Score: {score}</p>
            <p className="text-sm text-gray-500">Level {level}</p>
          </div>
          <div className="absolute top-4 right-4 bg-white/80 rounded-xl px-4 py-2 shadow-lg">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={`text-2xl ${i < lives ? "" : "opacity-30"}`}>❤️</span>
              ))}
            </div>
            {combo > 1 && (
              <p className="text-sm font-bold text-orange-500">{combo}x Combo!</p>
            )}
          </div>
        </>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-purple-600 mb-2">🔷 Shape Sorter</h1>
            <p className="text-gray-600 mb-6">Drag shapes to their matching holes!</p>
            <button
              onClick={() => setPhase("playing")}
              className="w-full px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xl transition-all"
            >
              ▶️ Play
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-red-500 mb-2">💔 Game Over!</h2>
            <p className="text-2xl font-bold text-gray-700 my-4">Score: {score}</p>
            <p className="text-lg text-gray-500 mb-4">Level {level}</p>
            <div className="space-y-2">
              <button
                onClick={() => { setLevel(1); setPhase("playing"); }}
                className="w-full px-6 py-3 bg-purple-500 text-white font-bold rounded-xl"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
