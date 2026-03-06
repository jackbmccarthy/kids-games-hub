"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "placing" | "falling" | "complete";

interface Domino {
  id: number;
  x: number;
  y: number;
  standing: boolean;
  falling: boolean;
  fallen: boolean;
  angle: number;
}

export default function DominoChainPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [dominoes, setDominoes] = useState<Domino[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [fallenCount, setFallenCount] = useState(0);

  const animationRef = useRef<number>(0);

  const startGame = () => {
    setDominoes([]);
    setScore(0);
    setFallenCount(0);
    setPhase("placing");
  };

  const placeDomino = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "placing") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDominoes((d) => [
      ...d,
      { id: Date.now(), x, y, standing: true, falling: false, fallen: false, angle: 0 },
    ]);
  };

  const startChain = () => {
    if (dominoes.length < 2) return;
    setPhase("falling");
    // Push first domino
    setDominoes((d) =>
      d.map((dom, i) => (i === 0 ? { ...dom, falling: true } : dom))
    );
  };

  useEffect(() => {
    if (phase === "falling") {
      const animate = () => {
        setDominoes((prev) => {
          const newDominoes = prev.map((dom, i) => {
            if (dom.fallen) return dom;
            if (!dom.falling) return dom;

            const newAngle = dom.angle + 5;
            if (newAngle >= 85) {
              // Check if next domino should fall
              const nextDom = prev[i + 1];
              if (nextDom && !nextDom.falling) {
                const dist = Math.hypot(nextDom.x - dom.x, nextDom.y - dom.y);
                if (dist < 50) {
                  prev[i + 1] = { ...nextDom, falling: true };
                }
              }
              setFallenCount((c) => c + 1);
              setScore((s) => s + 10);
              return { ...dom, angle: 85, fallen: true };
            }
            return { ...dom, angle: newAngle };
          });

          // Check if all done
          if (newDominoes.every((d) => d.fallen || !d.falling)) {
            const allFallen = newDominoes.filter((d) => d.fallen).length;
            if (allFallen === newDominoes.length) {
              setTimeout(() => setPhase("complete"), 500);
            }
          }

          return newDominoes;
        });

        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [phase]);

  useEffect(() => {
    const saved = localStorage.getItem("domino-chain-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("domino-chain-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-200 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-amber-800 mb-4">🁣 Domino Chain</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-amber-700 mb-2">Place dominoes and watch them fall!</p>
          <p className="text-amber-600 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={startGame} className="px-8 py-4 bg-amber-600 text-white font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {(phase === "placing" || phase === "falling" || phase === "complete") && (
        <div className="text-center">
          <p className="text-amber-800 mb-2">
            {phase === "placing" && `Dominoes: ${dominoes.length} (click to place)`}
            {phase === "falling" && `Chain reaction... ${fallenCount}/${dominoes.length}`}
            {phase === "complete" && `Chain Complete! Score: ${score}`}
          </p>

          <div
            onClick={placeDomino}
            className="relative w-[400px] h-[400px] bg-amber-50 rounded-2xl border-4 border-amber-300 cursor-crosshair overflow-hidden"
          >
            {dominoes.map((dom) => (
              <div
                key={dom.id}
                className="absolute w-3 h-8 bg-gradient-to-b from-black to-gray-700 rounded origin-bottom"
                style={{
                  left: dom.x - 6,
                  top: dom.y - 32,
                  transform: `rotate(${dom.angle}deg)`,
                }}
              />
            ))}
          </div>

          {phase === "placing" && (
            <div className="flex gap-4 mt-4">
              <button
                onClick={startChain}
                disabled={dominoes.length < 2}
                className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                Knock Over!
              </button>
              <button onClick={() => setDominoes([])} className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl">
                Clear
              </button>
            </div>
          )}

          {phase === "complete" && (
            <button onClick={startGame} className="mt-4 px-6 py-3 bg-amber-600 text-white font-bold rounded-xl">
              Play Again
            </button>
          )}

          <button
            onClick={() => setPhase("menu")}
            className="mt-4 px-4 py-2 bg-amber-700 text-white rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
