"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface GameObject {
  id: number;
  type: "ball" | "block" | "star" | "diamond";
  color: "red" | "blue" | "green";
  x: number;
  y: number;
  rotation: number;
  isDragging: boolean;
  bounceVelocity: number;
  isBouncing: boolean;
}

type GamePhase = "menu" | "playing" | "gameOver";

const COLORS = {
  red: "#FF6B6B",
  blue: "#4ECDC4",
  green: "#95E1D3",
};

const OBJECT_TYPES = ["ball", "block", "star", "diamond"] as const;

export default function ColorSortPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [binPositions, setBinPositions] = useState<Record<string, { x: number; y: number }>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<GameObject | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const speedRef = useRef(1);

  // Create new falling object
  const createObject = useCallback(() => {
    const type = OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)];
    const colorKeys = Object.keys(COLORS) as ("red" | "blue" | "green")[];
    const color = colorKeys[Math.floor(Math.random() * colorKeys.length)];

    const obj: GameObject = {
      id: Date.now() + Math.random(),
      type,
      color,
      x: 80 + Math.random() * (typeof window !== "undefined" ? window.innerWidth - 160 : 400),
      y: -60,
      rotation: Math.random() * 360,
      isDragging: false,
      bounceVelocity: 0,
      isBouncing: false,
    };

    setObjects(prev => [...prev, obj]);
  }, []);

  // Check if object matches bin
  const checkBinMatch = useCallback((obj: GameObject, binColor: string, binX: number, binY: number) => {
    const dist = Math.sqrt((obj.x - binX) ** 2 + (obj.y - binY) ** 2);
    return dist < 70;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, obj: GameObject) => {
    e.preventDefault();
    e.stopPropagation();

    setObjects(prev => prev.map(o =>
      o.id === obj.id ? { ...o, isDragging: true, isBouncing: false } : o
    ));
    draggingRef.current = obj;
  }, []);

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return;

    setObjects(prev => prev.map(o =>
      o.id === draggingRef.current!.id
        ? { ...o, x: clientX, y: clientY }
        : o
    ));
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!draggingRef.current) return;

    const obj = draggingRef.current;
    let matched = false;

    // Check each bin
    for (const [binColor, pos] of Object.entries(binPositions)) {
      if (checkBinMatch(obj, binColor, pos.x, pos.y)) {
        if (obj.color === binColor) {
          // Correct match!
          matched = true;
          setObjects(prev => prev.filter(o => o.id !== obj.id));

          const points = 10 * (1 + combo * 0.5);
          setScore(s => s + Math.round(points));
          setCombo(c => c + 1);

          // Level up every 50 points
          if ((score + Math.round(points)) >= level * 50) {
            const newLevel = level + 1;
            setLevel(newLevel);
            speedRef.current = 1 + newLevel * 0.3;
          }
        } else {
          // Wrong bin - bounce back
          setObjects(prev => prev.map(o =>
            o.id === obj.id
              ? { ...o, isDragging: false, isBouncing: true, bounceVelocity: -15 }
              : o
          ));
          setCombo(0);
        }
        break;
      }
    }

    if (!matched && !objects.find(o => o.id === obj.id)?.isBouncing) {
      // Released not on a bin - just stop dragging
      setObjects(prev => prev.map(o =>
        o.id === obj.id ? { ...o, isDragging: false } : o
      ));
    }

    draggingRef.current = null;
  }, [binPositions, checkBinMatch, combo, objects, score, level]);

  // Game loop - spawn objects
  useEffect(() => {
    if (phase !== "playing") {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      return;
    }

    setObjects([]);
    setScore(0);
    setCombo(0);
    setLevel(1);
    speedRef.current = 1;

    // Spawn objects periodically
    spawnIntervalRef.current = setInterval(() => {
      if (objects.length < 5 + level) {
        createObject();
      }
    }, Math.max(1500 - level * 100, 600));

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [phase, level, createObject, objects.length]);

  // Animation loop - make objects fall
  useEffect(() => {
    if (phase !== "playing") return;

    const animate = () => {
      setObjects(prev => {
        const updated = prev.map(obj => {
          if (obj.isDragging) return obj;

          // Handle bouncing (wrong bin)
          if (obj.isBouncing) {
            const newY = obj.y + obj.bounceVelocity;
            const newVelocity = obj.bounceVelocity + 0.8; // gravity

            if (newVelocity > 0 && newY > window.innerHeight - 200) {
              // Finished bouncing
              return { ...obj, y: window.innerHeight - 200, isBouncing: false, bounceVelocity: 0 };
            }
            return { ...obj, y: newY, bounceVelocity: newVelocity, rotation: obj.rotation + 5 };
          }

          // Normal falling
          const fallSpeed = 1.5 * speedRef.current;
          return {
            ...obj,
            y: obj.y + fallSpeed,
            rotation: obj.rotation + 1,
          };
        }).filter(obj => obj.y < window.innerHeight + 100);

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase]);

  // Global mouse/touch handlers
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      handleDragMove(x, y);
    };

    const handleUp = () => {
      handleDragEnd();
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

  // Calculate bin positions on mount and resize
  useEffect(() => {
    const updateBinPositions = () => {
      if (typeof window !== "undefined") {
        const w = window.innerWidth;
        const h = window.innerHeight;
        setBinPositions({
          red: { x: w * 0.2, y: h - 120 },
          blue: { x: w * 0.5, y: h - 120 },
          green: { x: w * 0.8, y: h - 120 },
        });
      }
    };

    updateBinPositions();
    window.addEventListener("resize", updateBinPositions);
    return () => window.removeEventListener("resize", updateBinPositions);
  }, []);

  // Render object shape
  const renderObject = (obj: GameObject) => {
    const size = 60;
    const color = COLORS[obj.color];

    switch (obj.type) {
      case "ball":
        return (
          <div
            className="rounded-full shadow-lg"
            style={{
              width: size,
              height: size,
              background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
              boxShadow: `0 8px 16px ${color}66`,
            }}
          />
        );
      case "block":
        return (
          <div
            className="rounded-lg shadow-lg"
            style={{
              width: size,
              height: size,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              boxShadow: `0 8px 16px ${color}66`,
            }}
          />
        );
      case "star":
        return (
          <svg width={size} height={size} viewBox="0 0 60 60">
            <defs>
              <linearGradient id={`star-${obj.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={`${color}cc`} />
              </linearGradient>
            </defs>
            <path
              d="M30 5 L36 22 L55 22 L40 33 L46 52 L30 42 L14 52 L20 33 L5 22 L24 22 Z"
              fill={`url(#star-${obj.id})`}
              filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
            />
          </svg>
        );
      case "diamond":
        return (
          <div
            className="shadow-lg"
            style={{
              width: size * 0.7,
              height: size,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              transform: "rotate(45deg)",
              boxShadow: `0 8px 16px ${color}66`,
            }}
          />
        );
    }
  };

  // Render bin
  const renderBin = (color: "red" | "blue" | "green", x: number, y: number) => {
    const hexColor = COLORS[color];

    return (
      <div
        key={color}
        className="absolute flex flex-col items-center"
        style={{ left: x - 50, top: y - 80 }}
      >
        {/* Bin */}
        <div
          className="relative rounded-b-3xl border-4 border-b-8"
          style={{
            width: 100,
            height: 90,
            backgroundColor: `${hexColor}44`,
            borderColor: hexColor,
            boxShadow: `inset 0 -20px 40px ${hexColor}22, 0 8px 20px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Bin opening */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 rounded-full"
            style={{
              width: 80,
              height: 20,
              backgroundColor: hexColor,
              boxShadow: `inset 0 -4px 8px rgba(0,0,0,0.3)`,
            }}
          />
        </div>
        {/* Label */}
        <p
          className="mt-2 font-black text-xl capitalize"
          style={{ color: hexColor, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
        >
          {color}
        </p>
      </div>
    );
  };

  return (
    <main
      ref={containerRef}
      className="fixed inset-0 overflow-hidden overscroll-none touch-none"
      style={{
        background: `
          linear-gradient(180deg, 
            #8B7355 0%, 
            #A0896C 20%, 
            #B8A080 40%,
            #C4AC8D 60%,
            #D4BC9E 80%,
            #E8D5B5 100%
          )
        `,
      }}
    >
      {/* Prevent body scroll on mobile */}
      <style jsx global>{`
        body { overflow: hidden; overscroll-behavior: none; }
      `}</style>
      
      {/* Warehouse background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Wooden floor lines */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-1 bg-amber-900/10"
            style={{ top: `${i * 5}%` }}
          />
        ))}
        {/* Shelf on wall */}
        <div
          className="absolute top-10 left-10 right-10 h-20 bg-amber-800/30 rounded-lg"
          style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
        >
          {/* Boxes on shelf */}
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute top-2 w-16 h-16 bg-amber-700/40 rounded"
              style={{ left: `${20 + i * 30}%` }}
            />
          ))}
        </div>
        {/* Crates */}
        <div className="absolute bottom-40 left-8 w-24 h-24 bg-amber-900/20 rounded-lg" />
        <div className="absolute bottom-48 right-8 w-20 h-20 bg-amber-800/20 rounded-lg" />
        <div className="absolute top-32 right-12 w-16 h-16 bg-amber-700/20 rounded" />
      </div>

      {/* Bins */}
      {Object.entries(binPositions).map(([color, pos]) =>
        renderBin(color as "red" | "blue" | "green", pos.x, pos.y)
      )}

      {/* Falling objects */}
      {phase === "playing" && objects.map(obj => (
        <div
          key={obj.id}
          className={`absolute cursor-grab active:cursor-grabbing ${obj.isBouncing ? "animate-pulse" : ""}`}
          style={{
            left: obj.x - 30,
            top: obj.y - 30,
            transform: `rotate(${obj.rotation}deg)`,
            zIndex: obj.isDragging ? 100 : 10,
            opacity: obj.isBouncing ? 0.7 : 1,
          }}
          onMouseDown={(e) => handleDragStart(e, obj)}
          onTouchStart={(e) => handleDragStart(e, obj)}
        >
          {renderObject(obj)}
        </div>
      ))}

      {/* UI */}
      {phase === "playing" && (
        <>
          <div className="absolute top-4 left-4 bg-white/90 rounded-2xl px-5 py-3 shadow-xl">
            <p className="font-black text-2xl text-gray-800">Score: {score}</p>
            <p className="text-sm font-bold text-gray-500">Level {level}</p>
          </div>
          <div className="absolute top-4 right-4 bg-white/90 rounded-2xl px-5 py-3 shadow-xl">
            {combo > 1 && (
              <p className="text-xl font-black text-orange-500 animate-bounce">
                🔥 {combo}x Combo!
              </p>
            )}
            {combo <= 1 && (
              <p className="text-sm text-gray-500">Drag to matching bin!</p>
            )}
          </div>
        </>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-5xl font-black mb-2">
              <span style={{ color: COLORS.red }}>C</span>
              <span style={{ color: COLORS.blue }}>o</span>
              <span style={{ color: COLORS.green }}>l</span>
              <span style={{ color: COLORS.red }}>o</span>
              <span style={{ color: COLORS.blue }}>r</span>
              <span className="text-gray-700"> Sort</span>
            </h1>
            <p className="text-gray-600 mb-6 text-lg">
              Drag objects to their matching color bins!
            </p>
            <div className="flex justify-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: COLORS.red }} />
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: COLORS.blue }} />
              <div className="w-12 h-12" style={{ 
                background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.green}cc)`,
                transform: "rotate(45deg)",
                width: 35,
                height: 50,
              }} />
            </div>
            <button
              onClick={() => setPhase("playing")}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black rounded-2xl text-2xl transition-all shadow-lg hover:shadow-xl"
            >
              ▶️ Play!
            </button>
            <p className="text-sm text-gray-400 mt-4">
              ⚡ Speed increases as you level up!
            </p>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-4xl font-black text-purple-600 mb-4">🎉 Great Job!</h2>
            <p className="text-3xl font-black text-gray-800 my-6">Score: {score}</p>
            <div className="bg-purple-100 rounded-xl p-4 mb-6">
              <p className="text-lg font-bold text-purple-700">Level {level} reached!</p>
              <p className="text-sm text-purple-600">Speed: {Math.round((1 + level * 0.3) * 100)}%</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { setLevel(1); setPhase("playing"); }}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-xl shadow-lg"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-xl"
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
