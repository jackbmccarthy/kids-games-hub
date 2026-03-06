"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Mole {
  id: number;
  row: number;
  col: number;
  showTime: number;
  isGolden: boolean;
  isRed: boolean;
  visible: boolean;
}

export default function WhackAMolePage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(0);

  const molesRef = useRef<Mole[]>([]);
  const moleTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const GRID_SIZE = 3;

  const spawnMole = useCallback(() => {
    const emptySpots: { row: number; col: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!molesRef.current.find(m => m.row === r && m.col === c && m.visible)) {
          emptySpots.push({ row: r, col: c });
        }
      }
    }
    if (emptySpots.length === 0) return;

    const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
    const roll = Math.random();
    const mole: Mole = {
      id: Date.now(),
      row: spot.row,
      col: spot.col,
      showTime: 1000 + Math.random() * 500,
      isGolden: roll < 0.1,
      isRed: roll > 0.9,
      visible: true,
    };
    molesRef.current.push(mole);

    // Auto-hide after time
    const timer = setTimeout(() => {
      molesRef.current = molesRef.current.filter(m => m.id !== mole.id);
      if (!mole.isGolden) setCombo(0);
    }, mole.showTime);
    moleTimersRef.current.set(mole.id, timer);
  }, []);

  const whackMole = useCallback((mole: Mole) => {
    if (!mole.visible) return;

    clearTimeout(moleTimersRef.current.get(mole.id));
    moleTimersRef.current.delete(mole.id);
    molesRef.current = molesRef.current.filter(m => m.id !== mole.id);

    if (mole.isRed) {
      setScore(s => Math.max(0, s - 5));
      setCombo(0);
    } else {
      const points = (mole.isGolden ? 10 : 1) * (1 + combo * 0.5);
      setScore(s => s + Math.round(points));
      setCombo(c => c + 1);
    }
  }, [combo]);

  useEffect(() => {
    if (phase !== "playing") return;

    molesRef.current = [];
    setScore(0);
    setCombo(0);
    setTimeLeft(30);

    const spawnInterval = setInterval(spawnMole, 800);
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase("gameOver");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(timer);
      moleTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, [phase, spawnMole]);

  useEffect(() => {
    const saved = localStorage.getItem("whack-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase === "gameOver" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("whack-high-score", String(score));
    }
  }, [phase, score, highScore]);

  const getHolePosition = (row: number, col: number) => {
    const holeSize = 100;
    const gap = 20;
    const totalWidth = GRID_SIZE * holeSize + (GRID_SIZE - 1) * gap;
    const startX = (typeof window !== "undefined" ? window.innerWidth : 400) / 2 - totalWidth / 2;
    const startY = 200;
    return {
      x: startX + col * (holeSize + gap),
      y: startY + row * (holeSize + gap),
    };
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-400 to-green-600 flex flex-col items-center pt-8">
      {/* Score UI */}
      {phase === "playing" && (
        <div className="flex gap-8 mb-4">
          <div className="bg-white/90 rounded-xl px-6 py-2 shadow-lg">
            <p className="text-2xl font-bold text-green-700">🔨 {score}</p>
          </div>
          <div className="bg-white/90 rounded-xl px-6 py-2 shadow-lg">
            <p className="text-2xl font-bold text-orange-500">⏱️ {timeLeft}s</p>
          </div>
          {combo > 1 && (
            <div className="bg-yellow-400 rounded-xl px-6 py-2 shadow-lg">
              <p className="text-2xl font-bold text-white">{combo}x!</p>
            </div>
          )}
        </div>
      )}

      {/* Game Grid */}
      <div className="relative" style={{ width: 340, height: 340 }}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const row = Math.floor(i / GRID_SIZE);
          const col = i % GRID_SIZE;
          const pos = getHolePosition(row, col);
          return (
            <div
              key={i}
              className="absolute rounded-full bg-amber-800 shadow-inner"
              style={{
                left: pos.x,
                top: pos.y,
                width: 100,
                height: 100,
              }}
            />
          );
        })}

        {/* Moles */}
        {phase === "playing" && molesRef.current.map(mole => {
          const pos = getHolePosition(mole.row, mole.col);
          return (
            <button
              key={mole.id}
              className="absolute rounded-full cursor-pointer transform hover:scale-110 transition-transform animate-bounce"
              style={{
                left: pos.x + 20,
                top: pos.y + 10,
                width: 60,
                height: 60,
              }}
              onClick={() => whackMole(mole)}
            >
              <span className="text-4xl">
                {mole.isGolden ? "🌟" : mole.isRed ? "💀" : "🐹"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Menu */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-amber-700 mb-2">🔨 Whack-a-Mole</h1>
            <p className="text-gray-600 mb-4">Tap the moles before they hide!</p>
            <p className="text-sm text-gray-500 mb-4">🌟 Bonus | 💀 Avoid!</p>
            {highScore > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">🏆 Best: {highScore}</p>
            )}
            <button
              onClick={() => setPhase("playing")}
              className="w-full px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xl"
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
            <h2 className="text-3xl font-black text-amber-700 mb-2">⏱️ Time's Up!</h2>
            <p className="text-2xl font-bold text-gray-700 my-4">Score: {score}</p>
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">🏆 New Best!</p>
            )}
            <div className="space-y-2">
              <button
                onClick={() => setPhase("playing")}
                className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-xl"
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
