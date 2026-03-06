"use client";

import { useState, useCallback, useEffect } from "react";

type Phase = "menu" | "playing";

interface Flower {
  id: number;
  x: number;
  y: number;
  type: "rose" | "tulip" | "daisy" | "sunflower";
  water: number;
  stage: number;
  lastWatered: number;
}

const FLOWERS = ["🌹", "🌷", "🌼", "🌻"];

export default function FlowerBloomPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const startGame = () => {
    const types: ("rose" | "tulip" | "daisy" | "sunflower")[] = ["rose", "tulip", "daisy", "sunflower"];
    const newFlowers: Flower[] = [];
    for (let i = 0; i < 4; i++) {
      newFlowers.push({
        id: i,
        x: 50 + i * 80,
        y: 200,
        type: types[i],
        water: 50,
        stage: 1,
        lastWatered: 0,
      });
    }
    setFlowers(newFlowers);
    setScore(0);
    setPhase("playing");
  };

  const waterFlower = (id: number) => {
    setFlowers((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const newWater = Math.min(100, f.water + 20);
        let newStage = f.stage;
        
        // Grow if water reaches threshold
        if (newWater >= 80 && f.stage < 4) {
          newStage = f.stage + 1;
          setScore((s) => s + 25);
        }
        
        return { ...f, water: newWater, stage: newStage, lastWatered: Date.now() };
      })
    );
  };

  // Water decays over time
  useEffect(() => {
    if (phase !== "playing") return;
    
    const interval = setInterval(() => {
      setFlowers((prev) =>
        prev.map((f) => {
          const newWater = Math.max(0, f.water - 2);
          return { ...f, water: newWater };
        })
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    const saved = localStorage.getItem("flower-bloom-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("flower-bloom-high", score.toString());
    }
  }, [score, highScore]);

  const getFlowerEmoji = (type: string, stage: number) => {
    if (stage < 3) return "🌱";
    if (stage === 3) return "🌿";
    const typeIndex = ["rose", "tulip", "daisy", "sunflower"].indexOf(type);
    return FLOWERS[typeIndex];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-emerald-300 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-green-800 mb-4">🌸 Flower Bloom</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-green-700 mb-2">Water flowers to make them bloom!</p>
          <p className="text-green-600 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl text-xl"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-green-800 mb-2">Score: {score}</p>

          {/* Garden */}
          <div className="relative w-[400px] h-[300px] bg-amber-200 rounded-2xl border-4 border-amber-400">
            {/* Pots and flowers */}
            {flowers.map((flower) => (
              <div
                key={flower.id}
                className="absolute"
                style={{ left: flower.x, top: flower.y }}
              >
                {/* Pot */}
                <div className="w-16 h-12 bg-amber-600 rounded-b-lg" />
                
                {/* Flower */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-5xl">
                  {getFlowerEmoji(flower.type, flower.stage)}
                </div>

                {/* Water meter */}
                <div className="absolute -top-2 left-0 w-16 h-2 bg-gray-300 rounded">
                  <div
                    className="h-full bg-blue-400 rounded transition-all"
                    style={{ width: `${flower.water}%` }}
                  />
                </div>

                {/* Water button */}
                <button
                  onClick={() => waterFlower(flower.id)}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-sm rounded"
                >
                  💧
                </button>
              </div>
            ))}
          </div>

          <p className="mt-16 text-green-700 text-sm">Click 💧 to water flowers!</p>

          <button
            onClick={() => setPhase("menu")}
            className="mt-4 px-4 py-2 bg-green-700 text-white rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
