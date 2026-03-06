"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

const SHAPES = ["🐶", "🐱", "🐰", "🦋", "🦆"];
const SHAPE_NAMES = ["dog", "cat", "bunny", "butterfly", "duck"];

export default function ShadowPuppetsPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [fingerPositions, setFingerPositions] = useState([0, 0, 0, 0, 0]);
  const [targetShape, setTargetShape] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const checkMatch = useCallback(() => {
    const correctPositions = getShapePositions(targetShape);
    const match = fingerPositions.every((pos, i) => Math.abs(pos - correctPositions[i]) < 20);
    
    if (match) {
      setScore((s) => s + 100);
      setTargetShape((t) => (t + 1) % SHAPES.length);
    }
  }, [fingerPositions, targetShape]);

  const getShapePositions = (shapeIndex: number): number[] => {
    const positions: number[][] = [
      [80, 50, 30, 0, 0],   // dog
      [60, 60, 20, 0, 0],   // cat
      [100, 40, 0, 0, 0],   // bunny
      [40, 40, 40, 40, 40], // butterfly
      [80, 30, 30, 0, 0],   // duck
    ];
    return positions[shapeIndex] || [0, 0, 0, 0, 0];
  };

  const adjustFinger = (index: number, delta: number) => {
    setFingerPositions((prev) => {
      const newPos = [...prev];
      newPos[index] = Math.max(0, Math.min(100, newPos[index] + delta));
      return newPos;
    });
  };

  const startGame = () => {
    setScore(0);
    setFingerPositions([0, 0, 0, 0, 0]);
    setTargetShape(0);
    setPhase("playing");
  };

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("shadow-puppets-high");
    if (saved && highScore === 0) setHighScore(parseInt(saved));
    if (score > highScore && score !== highScore) {
      setHighScore(score);
      localStorage.setItem("shadow-puppets-high", score.toString());
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🎭 Shadow Puppets</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-gray-300 mb-2">Make shadow shapes with your hands!</p>
          <p className="text-gray-400 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={startGame} className="px-8 py-4 bg-yellow-500 text-gray-900 font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Make a {SHAPE_NAMES[targetShape]}! Score: {score}</p>

          {/* Shadow screen */}
          <div className="w-80 h-48 bg-gray-800 rounded-2xl border-4 border-gray-700 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Light beam */}
              <div className="w-32 h-32 bg-yellow-200/20 rounded-full blur-xl" />
              {/* Fingers shadow */}
              {fingerPositions.map((pos, i) => (
                pos > 0 && (
                  <div
                    key={i}
                    className="absolute w-4 bg-black rounded-full"
                    style={{
                      height: `${pos}px`,
                      left: `${20 + i * 15}%`,
                      bottom: "20%",
                    }}
                  />
                )
              ))}
            </div>
          </div>

          {/* Target shape */}
          <div className="text-6xl mb-4">{SHAPES[targetShape]}</div>

          {/* Finger controls */}
          <div className="flex gap-1 justify-center">
            {fingerPositions.map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <button onClick={() => adjustFinger(i, 10)} className="bg-gray-600 text-white px-2 rounded">▲</button>
                <div className="text-white text-center">{fingerPositions[i]}</div>
                <button onClick={() => adjustFinger(i, -10)} className="bg-gray-600 text-white px-2 rounded">▼</button>
              </div>
            ))}
          </div>

          <button onClick={checkMatch} className="mt-4 px-6 py-3 bg-green-500 text-white font-bold rounded-xl">
            Check Match!
          </button>

          <button onClick={() => setPhase("menu")} className="mt-4 ml-4 px-4 py-2 bg-gray-700 text-white rounded-lg">
            Back
          </button>
        </div>
      )}
    </div>
  );
}
