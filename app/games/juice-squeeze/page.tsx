"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

interface Fruit {
  id: number;
  name: string;
  emoji: string;
  juice: number;
  color: string;
}

const FRUITS: Fruit[] = [
  { id: 1, name: "Orange", emoji: "🍊", juice: 30, color: "#FFA500" },
  { id: 2, name: "Apple", emoji: "🍎", juice: 25, color: "#FF0000" },
  { id: 3, name: "Grape", emoji: "🍇", juice: 20, color: "#800080" },
  { id: 4, name: "Lemon", emoji: "🍋", juice: 25, color: "#FFFF00" },
  { id: 5, name: "Watermelon", emoji: "🍉", juice: 35, color: "#00FF00" },
];

export default function JuiceSqueezePage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [selectedFruit, setSelectedFruit] = useState<Fruit | null>(null);
  const [juiceLevel, setJuiceLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [squeezing, setSqueezing] = useState(false);

  const squeeze = useCallback(() => {
    if (!selectedFruit) return;
    setSqueezing(true);
    setJuiceLevel((prev) => {
      const newLevel = Math.min(100, prev + selectedFruit.juice / 5);
      if (newLevel >= 100) {
        setScore((s) => s + 100);
        setTimeout(() => {
          setJuiceLevel(0);
          setSelectedFruit(null);
        }, 500);
      }
      return newLevel;
    });
    setTimeout(() => setSqueezing(false), 100);
  }, [selectedFruit]);

  const startGame = () => {
    setScore(0);
    setJuiceLevel(0);
    setSelectedFruit(null);
    setPhase("playing");
  };

  const savedHigh = typeof window !== "undefined" ? localStorage.getItem("juice-squeeze-high") : null;
  if (savedHigh && highScore === 0) setHighScore(parseInt(savedHigh));

  if (score > highScore && score !== highScore) {
    setHighScore(score);
    localStorage.setItem("juice-squeeze-high", score.toString());
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-200 to-orange-300 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-orange-600 mb-4">🧃 Juice Squeeze</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-orange-700 mb-2">Squeeze fruits to make juice!</p>
          <p className="text-orange-600 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-orange-500 text-white font-bold rounded-xl text-xl"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-orange-700 mb-2">Score: {score}</p>

          {/* Fruit Selection */}
          {!selectedFruit && (
            <div className="mb-4">
              <p className="text-orange-600 mb-2">Pick a fruit:</p>
              <div className="flex gap-2 justify-center">
                {FRUITS.map((fruit) => (
                  <button
                    key={fruit.id}
                    onClick={() => setSelectedFruit(fruit)}
                    className="text-4xl p-2 bg-white rounded-xl hover:scale-110 transition-transform"
                  >
                    {fruit.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Squeeze Area */}
          {selectedFruit && (
            <div className="relative">
              {/* Glass */}
              <div className="w-32 h-48 bg-white/50 rounded-b-3xl border-4 border-white mx-auto overflow-hidden relative">
                <div
                  className="absolute bottom-0 w-full transition-all duration-100"
                  style={{
                    height: `${juiceLevel}%`,
                    backgroundColor: selectedFruit.color,
                  }}
                />
                {juiceLevel >= 100 && (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    🥤
                  </div>
                )}
              </div>

              {/* Fruit to squeeze */}
              <button
                onClick={squeeze}
                disabled={juiceLevel >= 100}
                className={`mt-4 text-6xl transition-transform ${squeezing ? "scale-75" : "scale-100"}`}
              >
                {selectedFruit.emoji}
              </button>
              <p className="text-orange-600 mt-2">Tap to squeeze!</p>
            </div>
          )}

          <button
            onClick={() => setPhase("menu")}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
