"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

interface Animal {
  name: string;
  emoji: string;
  food: string;
}

const ANIMALS: Animal[] = [
  { name: "Cat", emoji: "🐱", food: "fish" },
  { name: "Dog", emoji: "🐕", food: "bone" },
  { name: "Bird", emoji: "🐦", food: "seeds" },
  { name: "Rabbit", emoji: "🐰", food: "carrot" },
  { name: "Bear", emoji: "🐻", food: "honey" },
];

const FOODS = [
  { name: "fish", emoji: "🐟" },
  { name: "bone", emoji: "🦴" },
  { name: "seeds", emoji: "🌾" },
  { name: "carrot", emoji: "🥕" },
  { name: "honey", emoji: "🍯" },
];

export default function FoodChainPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [currentAnimal, setCurrentAnimal] = useState<Animal | null>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");

  const nextAnimal = useCallback(() => {
    setCurrentAnimal(ANIMALS[Math.floor(Math.random() * ANIMALS.length)]);
    setSelectedFood(null);
    setMessage("");
  }, []);

  const checkMatch = () => {
    if (!currentAnimal || !selectedFood) return;
    if (currentAnimal.food === selectedFood) {
      setScore((s) => s + 10);
      setMessage("✓ Yummy!");
      setTimeout(nextAnimal, 1000);
    } else {
      setMessage("✗ Not that!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-lime-500 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🔗 Food Chain</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-green-100 mb-4">Match animals to their favorite food!</p>
          <button onClick={() => { setScore(0); nextAnimal(); setPhase("playing"); }} className="px-8 py-4 bg-yellow-500 text-green-900 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && currentAnimal && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>
          <p className="text-green-100 mb-4">What does the {currentAnimal.name} eat?</p>

          <div className="text-8xl mb-6">{currentAnimal.emoji}</div>

          <div className="flex gap-2 justify-center mb-4">
            {FOODS.map((food) => (
              <button key={food.name} onClick={() => setSelectedFood(food.name)}
                className={`p-3 text-4xl rounded-xl ${selectedFood === food.name ? "bg-yellow-400 ring-4 ring-yellow-200" : "bg-white"}`}>
                {food.emoji}
              </button>
            ))}
          </div>

          <button onClick={checkMatch} disabled={!selectedFood} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50">
            Feed!
          </button>
          <p className="mt-2 text-xl">{message}</p>

          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-green-700 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
