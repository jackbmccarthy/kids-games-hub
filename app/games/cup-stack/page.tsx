"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Phase = "menu" | "playing" | "gameOver";

interface Cup {
  id: number;
  x: number;
  y: number;
  dropping: boolean;
}

export default function CupStackPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [stack, setStack] = useState<Cup[]>([]);
  const [currentCup, setCurrentCup] = useState({ x: 200, direction: 1 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [dropping, setDropping] = useState(false);

  const animationRef = useRef<number>(0);
  const cupWidth = 60;
  const cupHeight = 40;

  const startGame = () => {
    setStack([{ id: 0, x: 170, y: 500, dropping: false }]);
    setCurrentCup({ x: 0, direction: 1 });
    setScore(0);
    setPhase("playing");
    setDropping(false);
  };

  const dropCup = useCallback(() => {
    if (dropping || stack.length === 0) return;
    setDropping(true);

    const lastCup = stack[stack.length - 1];
    const newY = 500 - stack.length * cupHeight;
    const overlap = Math.max(0, Math.min(
      currentCup.x + cupWidth,
      lastCup.x + cupWidth
    ) - Math.max(currentCup.x, lastCup.x));
    const newWidth = overlap;

    if (newWidth < 10) {
      setPhase("gameOver");
      return;
    }

    const newCup: Cup = {
      id: stack.length,
      x: Math.max(currentCup.x, lastCup.x),
      y: newY,
      dropping: true,
    };

    setStack((s) => [...s, newCup]);
    setScore(stack.length);
    setCurrentCup({ x: 0, direction: 1 });

    setTimeout(() => {
      setDropping(false);
    }, 300);
  }, [dropping, stack, currentCup]);

  useEffect(() => {
    if (phase === "playing" && !dropping) {
      const animate = () => {
        setCurrentCup((c) => {
          let newX = c.x + c.direction * 3;
          let newDir = c.direction;
          if (newX > 340) newDir = -1;
          if (newX < 0) newDir = 1;
          return { x: newX, direction: newDir };
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [phase, dropping]);

  useEffect(() => {
    const saved = localStorage.getItem("cup-stack-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("cup-stack-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-200 to-orange-300 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-amber-800 mb-4">🥤 Cup Stack</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-amber-700 mb-2">Stack cups to build a tower!</p>
          <p className="text-amber-600 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xl transition-all"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-amber-800 mb-2">Height: {stack.length} cups</p>
          <div className="relative w-[400px] h-[550px] bg-amber-100 rounded-2xl overflow-hidden">
            {/* Table */}
            <div className="absolute bottom-0 w-full h-10 bg-amber-700" />

            {/* Stacked cups */}
            {stack.map((cup) => (
              <div
                key={cup.id}
                className="absolute bg-gradient-to-b from-red-400 to-red-600 rounded-b-lg"
                style={{
                  left: cup.x,
                  top: cup.y,
                  width: cupWidth,
                  height: cupHeight,
                }}
              />
            ))}

            {/* Current cup */}
            {!dropping && (
              <div
                className="absolute bg-gradient-to-b from-red-400 to-red-600 rounded-b-lg"
                style={{
                  left: currentCup.x,
                  top: 10,
                  width: cupWidth,
                  height: cupHeight,
                }}
              />
            )}

            <button
              onClick={dropCup}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl"
            >
              Drop Cup!
            </button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="text-center">
          <p className="text-2xl text-amber-800 mb-2">Tower Collapsed!</p>
          <p className="text-xl text-amber-600 mb-4">Height: {score} cups</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xl transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      {phase === "playing" && (
        <button
          onClick={() => setPhase("menu")}
          className="mt-4 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg"
        >
          Back to Menu
        </button>
      )}
    </div>
  );
}
