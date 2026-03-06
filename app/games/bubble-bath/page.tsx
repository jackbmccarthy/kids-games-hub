"use client";

import { useState, useCallback, useEffect } from "react";

type Phase = "menu" | "playing";

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

const COLORS = ["#87CEEB", "#98FB98", "#FFB6C1", "#DDA0DD", "#F0E68C"];

export default function BubbleBathPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const spawnBubble = useCallback(() => {
    const bubble: Bubble = {
      id: Date.now() + Math.random(),
      x: Math.random() * 350 + 25,
      y: Math.random() * 350 + 25,
      size: 20 + Math.random() * 30,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    setBubbles((prev) => [...prev.slice(-19), bubble]);
  }, []);

  const popBubble = (id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setScore((s) => s + 10 * (streak + 1));
    setStreak((s) => s + 1);
  };

  useEffect(() => {
    if (phase === "playing") {
      const interval = setInterval(spawnBubble, 500);
      return () => clearInterval(interval);
    }
  }, [phase, spawnBubble]);

  useEffect(() => {
    if (phase === "playing") {
      const timeout = setTimeout(() => setStreak(0), 1500);
      return () => clearTimeout(timeout);
    }
  }, [streak, phase]);

  const startGame = () => {
    setBubbles([]);
    setScore(0);
    setStreak(0);
    setPhase("playing");
  };

  useEffect(() => {
    const saved = localStorage.getItem("bubble-bath-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("bubble-bath-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-300 to-blue-400 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🛁 Bubble Bath</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-white mb-2">Pop bubbles in the bath!</p>
          <p className="text-cyan-100 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={startGame} className="px-8 py-4 bg-white text-blue-500 font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score} | Streak: {streak}x</p>

          <div className="relative w-[400px] h-[400px] bg-gradient-to-b from-blue-200 to-cyan-300 rounded-3xl border-4 border-white overflow-hidden">
            {/* Duck decoration */}
            <div className="absolute bottom-4 right-4 text-4xl">🦆</div>

            {bubbles.map((bubble) => (
              <button
                key={bubble.id}
                onClick={() => popBubble(bubble.id)}
                className="absolute rounded-full transition-transform hover:scale-110"
                style={{
                  left: bubble.x - bubble.size / 2,
                  top: bubble.y - bubble.size / 2,
                  width: bubble.size,
                  height: bubble.size,
                  background: `radial-gradient(circle at 30% 30%, white, ${bubble.color})`,
                  boxShadow: "0 0 10px rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>

          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
