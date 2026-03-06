"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

const PATTERNS = ["🔴🔴🟡", "🔵🟡🔵🔴", "🟡🟢🟡🟢", "🔵🔴🔵🔴"];

export default function BeadPatternPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [beads, setBeads] = useState<string[]>([]);
  const [targetPattern, setTargetPattern] = useState<number>(0);
  const [score, setScore] = useState(0);

  const BEAD_COLORS = ["red", "blue", "yellow", "green"];

  const generateTarget = useCallback(() => {
    setTargetPattern(Math.floor(Math.random() * PATTERNS.length));
    setBeads([]);
  }, []);

  const addBead = (color: string) => {
    setBeads(prev => [...prev, color]);
    if (beads.length + 1 === PATTERNS[targetPattern].length) {
      const correct = beads.every((b, i) => b === PATTERNS[targetPattern][i]);
      if (correct) {
        setScore(s => s + 10);
        setTimeout(generateTarget, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-300 to-purple-400 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">📿 Bead Pattern</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-pink-200 mb-4">Copy the bead pattern!</p>
          <button onClick={() => { setScore(0); generateTarget(); setPhase("playing"); }} className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>
          <p className="text-pink-200 mb-4">Pattern: {PATTERNS[targetPattern]}</p>

          <div className="flex gap-2 justify-center mb-4">
            {BEAD_COLORS.map(color => (
              <button key={color} onClick={() => addBead(color)}
                className={`w-16 h-16 rounded-full text-2xl ${color === "red" ? "bg-red-500" : color === "blue" ? "bg-blue-500" : color === "yellow" ? "bg-yellow-400" : "bg-green-500"}`}>
                ⚫
              </button>
            ))}
          </div>

          <p className="text-white">Your beads: {beads.join(" ")}</p>
          <button onClick={() => setBeads([])} className="mt-4 px-4 py-2 bg-pink-700 text-white rounded-lg">Reset</button>
          <button onClick={() => setPhase("menu")} className="ml-2 px-4 py-2 bg-purple-700 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
