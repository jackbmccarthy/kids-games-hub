"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

export default function DiceRollPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [target, setTarget] = useState(7);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const rollDice = useCallback(() => {
    setRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        setRolling(false);
        const total = dice[0] + dice[1];
        if (total === target) {
          setScore((s) => s + target * 10);
        }
        setTarget(Math.floor(Math.random() * 11) + 2);
      }
    }, 100);
  }, [dice, target]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-700 to-emerald-800 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🎲 Dice Roll</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-green-200 mb-4">Roll dice to match the target!</p>
          <p className="text-green-300 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={() => { setScore(0); setPhase("playing"); }} className="px-8 py-4 bg-white text-green-700 font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Target: {target}</p>
          <p className="text-green-200 mb-4">Score: {score}</p>

          <div className="flex gap-4 mb-6">
            {dice.map((d, i) => (
              <div
                key={i}
                className={`w-20 h-20 bg-white rounded-xl flex items-center justify-center text-4xl font-bold text-green-700 shadow-xl ${
                  rolling ? "animate-bounce" : ""
                }`}
              >
                {["⚀","⚁","⚂","⚃","⚄","⚅"][d - 1]}
              </div>
            ))}
          </div>

          <button
            onClick={rollDice}
            disabled={rolling}
            className="px-8 py-4 bg-yellow-400 text-green-800 font-bold rounded-xl text-xl disabled:opacity-50"
          >
            Roll!
          </button>

          <button onClick={() => setPhase("menu")} className="mt-4 ml-4 px-4 py-2 bg-green-600 text-white rounded-lg">
            Menu
          </button>
        </div>
      )}
    </div>
  );
}
