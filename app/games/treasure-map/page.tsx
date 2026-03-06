"use client";

import { useState, useCallback, useEffect } from "react";

type Phase = "menu" | "playing" | "found";

const DIRECTIONS = ["⬆️ North", "➡️ East", "⬇️ South", "⬅️ West"];

export default function TreasureMapPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [playerPos, setPlayerPos] = useState({ x: 2, y: 2 });
  const [treasurePos, setTreasurePos] = useState({ x: 0, y: 0 });
  const [clues, setClues] = useState<string[]>([]);
  const [currentClue, setCurrentClue] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const generateTreasure = useCallback(() => {
    const x = Math.floor(Math.random() * 5);
    const y = Math.floor(Math.random() * 5);
    setTreasurePos({ x, y });
    setPlayerPos({ x: 2, y: 2 });
    generateClues(2, 2, x, y);
  }, []);

  const generateClues = (px: number, py: number, tx: number, ty: number) => {
    const newClues: string[] = [];
    let cx = px, cy = py;
    
    while (cx !== tx || cy !== ty) {
      if (cx < tx) { newClues.push("Go East"); cx++; }
      else if (cx > tx) { newClues.push("Go West"); cx--; }
      else if (cy < ty) { newClues.push("Go South"); cy++; }
      else if (cy > ty) { newClues.push("Go North"); cy--; }
    }
    setClues(newClues);
    setCurrentClue(0);
  };

  const move = (dir: string) => {
    const newPos = { ...playerPos };
    if (dir === "North") newPos.y = Math.max(0, newPos.y - 1);
    if (dir === "South") newPos.y = Math.min(4, newPos.y + 1);
    if (dir === "West") newPos.x = Math.max(0, newPos.x - 1);
    if (dir === "East") newPos.x = Math.min(4, newPos.x + 1);
    setPlayerPos(newPos);
    setCurrentClue((c) => Math.min(c + 1, clues.length));

    if (newPos.x === treasurePos.x && newPos.y === treasurePos.y) {
      setScore((s) => s + 100);
      setPhase("found");
    }
  };

  const startGame = () => {
    setScore(0);
    generateTreasure();
    setPhase("playing");
  };

  useEffect(() => {
    const saved = localStorage.getItem("treasure-map-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("treasure-map-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-300 to-orange-400 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-amber-900 mb-4">🗺️ Treasure Map</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-amber-800 mb-2">Follow clues to find the treasure!</p>
          <p className="text-amber-700 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={startGame} className="px-8 py-4 bg-amber-600 text-white font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-amber-900 mb-2">Score: {score}</p>
          <p className="text-amber-800 mb-2">Clue: {clues[currentClue] || "You're close!"}</p>

          <div className="grid grid-cols-5 gap-1 bg-amber-200 p-2 rounded-xl mb-4">
            {Array.from({ length: 25 }).map((_, i) => {
              const x = i % 5;
              const y = Math.floor(i / 5);
              const isPlayer = x === playerPos.x && y === playerPos.y;
              const isTreasure = x === treasurePos.x && y === treasurePos.y;
              return (
                <div
                  key={i}
                  className={`w-10 h-10 rounded flex items-center justify-center text-xl ${
                    isPlayer ? "bg-blue-500" : isTreasure ? "bg-amber-400" : "bg-amber-100"
                  }`}
                >
                  {isPlayer ? "🧑" : isTreasure ? "❓" : ""}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
            <div />
            <button onClick={() => move("North")} className="bg-amber-600 text-white p-2 rounded">⬆️</button>
            <div />
            <button onClick={() => move("West")} className="bg-amber-600 text-white p-2 rounded">⬅️</button>
            <div className="bg-amber-400 rounded" />
            <button onClick={() => move("East")} className="bg-amber-600 text-white p-2 rounded">➡️</button>
            <div />
            <button onClick={() => move("South")} className="bg-amber-600 text-white p-2 rounded">⬇️</button>
            <div />
          </div>

          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-amber-700 text-white rounded-lg">
            Back to Menu
          </button>
        </div>
      )}

      {phase === "found" && (
        <div className="text-center">
          <p className="text-4xl mb-4">💎</p>
          <p className="text-2xl text-amber-900 mb-2">Treasure Found!</p>
          <p className="text-amber-700 mb-4">Score: {score}</p>
          <button onClick={startGame} className="px-8 py-4 bg-amber-600 text-white font-bold rounded-xl">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
