"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

interface Animal {
  id: number;
  name: string;
  emoji: string;
  problem: string;
  solution: string;
  treated: boolean;
}

const ANIMALS: Omit<Animal, "id" | "treated">[] = [
  { name: "Dog", emoji: "🐕", problem: "Hurt paw", solution: "bandage" },
  { name: "Cat", emoji: "🐱", problem: "Fever", solution: "medicine" },
  { name: "Bunny", emoji: "🐰", problem: "Ear ache", solution: "drops" },
  { name: "Bird", emoji: "🐦", problem: "Sore wing", solution: "splint" },
  { name: "Hamster", emoji: "🐹", problem: "Tooth ache", solution: "checkup" },
];

const TOOLS = ["bandage", "medicine", "drops", "splint", "checkup"];
const TOOL_EMOJIS: Record<string, string> = {
  bandage: "🩹",
  medicine: "💊",
  drops: "💧",
  splint: "🩼",
  checkup: "🩺",
};

export default function PetVetPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const initGame = useCallback(() => {
    const shuffled = [...ANIMALS].sort(() => Math.random() - 0.5).slice(0, 3);
    setAnimals(shuffled.map((a, i) => ({ ...a, id: i, treated: false })));
    setSelectedTool(null);
    setScore(0);
  }, []);

  const treatAnimal = (animalId: number) => {
    if (!selectedTool) return;
    const animal = animals.find((a) => a.id === animalId);
    if (!animal || animal.treated) return;

    if (animal.solution === selectedTool) {
      setAnimals((prev) =>
        prev.map((a) => (a.id === animalId ? { ...a, treated: true } : a))
      );
      setScore((s) => s + 50);

      // Add new animal if all treated
      if (animals.filter((a) => !a.treated).length === 1) {
        setTimeout(() => {
          const newAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
          setAnimals((prev) => [
            ...prev.map((a) => (a.treated ? { ...a, treated: false, problem: newAnimal.problem, solution: newAnimal.solution } : a)),
          ]);
        }, 500);
      }
    }
  };

  const savedHigh = typeof window !== "undefined" ? localStorage.getItem("pet-vet-high") : null;
  if (savedHigh && highScore === 0) setHighScore(parseInt(savedHigh));
  if (score > highScore && score !== highScore) {
    setHighScore(score);
    localStorage.setItem("pet-vet-high", score.toString());
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-teal-200 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-teal-700 mb-4">🩺 Pet Vet</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-teal-600 mb-2">Help sick animals feel better!</p>
          <p className="text-teal-500 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={() => {
              initGame();
              setPhase("playing");
            }}
            className="px-8 py-4 bg-teal-500 text-white font-bold rounded-xl text-xl"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-teal-700 mb-2">Score: {score}</p>

          {/* Animals */}
          <div className="flex gap-4 mb-6">
            {animals.map((animal) => (
              <button
                key={animal.id}
                onClick={() => treatAnimal(animal.id)}
                disabled={animal.treated}
                className={`p-4 bg-white rounded-2xl shadow-lg ${
                  animal.treated ? "opacity-50" : "hover:scale-105"
                }`}
              >
                <div className="text-5xl">{animal.emoji}</div>
                <p className="text-teal-600 font-bold">{animal.name}</p>
                <p className="text-red-500 text-sm">{animal.treated ? "✓ Better!" : animal.problem}</p>
              </button>
            ))}
          </div>

          {/* Tools */}
          <p className="text-teal-600 mb-2">Select a tool:</p>
          <div className="flex gap-2 justify-center">
            {TOOLS.map((tool) => (
              <button
                key={tool}
                onClick={() => setSelectedTool(tool)}
                className={`p-3 rounded-xl text-3xl ${
                  selectedTool === tool ? "bg-teal-500 ring-4 ring-teal-300" : "bg-white"
                }`}
              >
                {TOOL_EMOJIS[tool]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPhase("menu")}
            className="mt-6 px-4 py-2 bg-teal-600 text-white rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
