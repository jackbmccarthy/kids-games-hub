"use client";

import { useState, useCallback, useEffect } from "react";

type Phase = "menu" | "playing";

interface Plant {
  id: number;
  type: "flower" | "vegetable" | "fruit";
  emoji: string;
  stage: number;
  water: number;
}

const SEEDS = [
  { type: "flower" as const, emoji: "🌹", name: "Rose" },
  { type: "flower" as const, emoji: "🌻", name: "Sunflower" },
  { type: "vegetable" as const, emoji: "🥕", name: "Carrot" },
  { type: "vegetable" as const, emoji: "🍅", name: "Tomato" },
  { type: "fruit" as const, emoji: "🍓", name: "Strawberry" },
];

const GROWTH_STAGES = ["🌱", "🌿", "🌸", "FLOWER"];

export default function PlantSeedsPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [dayTime, setDayTime] = useState(0);

  const plantSeed = (seedIndex: number) => {
    if (plants.length >= 6) return;
    const seed = SEEDS[seedIndex];
    const plant: Plant = {
      id: Date.now(),
      type: seed.type,
      emoji: seed.emoji,
      stage: 0,
      water: 50,
    };
    setPlants((p) => [...p, plant]);
  };

  const waterPlant = (id: number) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, water: Math.min(100, p.water + 25) } : p))
    );
  };

  // Growth and water decay
  useEffect(() => {
    if (phase !== "playing") return;
    
    const interval = setInterval(() => {
      setDayTime((d) => (d + 1) % 4);
      setPlants((prev) =>
        prev.map((p) => {
          const newWater = Math.max(0, p.water - 5);
          let newStage = p.stage;
          
          // Grow if watered enough
          if (newWater >= 60 && p.stage < 3) {
            newStage = p.stage + 1;
            if (newStage === 3) setScore((s) => s + 50);
          }
          
          return { ...p, water: newWater, stage: newStage };
        })
      );
    }, 2000);
    
    return () => clearInterval(interval);
  }, [phase]);

  const startGame = () => {
    setPlants([]);
    setScore(0);
    setDayTime(0);
    setPhase("playing");
  };

  useEffect(() => {
    const saved = localStorage.getItem("plant-seeds-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("plant-seeds-high", score.toString());
    }
  }, [score, highScore]);

  const getPlantDisplay = (plant: Plant) => {
    if (plant.stage < 3) return GROWTH_STAGES[plant.stage];
    return plant.emoji;
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
      dayTime === 0 ? "bg-gradient-to-b from-yellow-200 to-orange-200" :
      dayTime === 1 ? "bg-gradient-to-b from-blue-200 to-cyan-200" :
      dayTime === 2 ? "bg-gradient-to-b from-orange-300 to-yellow-300" :
      "bg-gradient-to-b from-indigo-400 to-purple-500"
    }`}>
      <h1 className="text-4xl font-bold text-green-800 mb-4">🌱 Plant Seeds</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-green-700 mb-2">Plant and grow a garden!</p>
          <p className="text-green-600 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={startGame} className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-green-800 mb-2">Score: {score} | {["Morning", "Day", "Evening", "Night"][dayTime]}</p>

          {/* Garden */}
          <div className="w-96 h-48 bg-amber-600 rounded-xl border-4 border-amber-800 p-2 mb-4">
            <div className="grid grid-cols-3 gap-2 h-full">
              {plants.map((plant) => (
                <div key={plant.id} className="bg-amber-700 rounded-lg p-1 text-center">
                  <div className="text-3xl">{getPlantDisplay(plant)}</div>
                  <div className="h-2 bg-gray-300 rounded overflow-hidden">
                    <div className="h-full bg-blue-400" style={{ width: `${plant.water}%` }} />
                  </div>
                  <button
                    onClick={() => waterPlant(plant.id)}
                    className="text-xs bg-blue-500 text-white px-2 rounded mt-1"
                  >
                    💧
                  </button>
                </div>
              ))}
              {Array.from({ length: 6 - plants.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-amber-800 rounded-lg flex items-center justify-center text-gray-400">
                  Empty
                </div>
              ))}
            </div>
          </div>

          {/* Seeds */}
          <p className="text-green-700 mb-2">Plant seeds:</p>
          <div className="flex gap-2 justify-center mb-4">
            {SEEDS.map((seed, i) => (
              <button
                key={i}
                onClick={() => plantSeed(i)}
                disabled={plants.length >= 6}
                className="p-2 bg-white rounded-xl text-2xl hover:scale-110 disabled:opacity-50"
              >
                {seed.emoji}
              </button>
            ))}
          </div>

          <button onClick={() => setPhase("menu")} className="px-4 py-2 bg-green-700 text-white rounded-lg">
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
