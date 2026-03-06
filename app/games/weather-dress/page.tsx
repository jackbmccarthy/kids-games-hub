"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

const WEATHERS = ["☀️ Sunny", "🌧️ Rainy", "❄️ Snowy", "🌬️ Windy"];
const CLOTHES = [
  { id: "tshirt", name: "T-Shirt", emoji: "👕", good: ["sunny"] },
  { id: "jacket", name: "Jacket", emoji: "🧥", good: ["rainy", "windy"] },
  { id: "coat", name: "Coat", emoji: "🧥", good: ["snowy"] },
  { id: "shorts", name: "Shorts", emoji: "🩳", good: ["sunny"] },
  { id: "boots", name: "Boots", emoji: "👢", good: ["rainy", "snowy"] },
  { id: "hat", name: "Hat", emoji: "🧢", good: ["sunny"] },
];

export default function WeatherDressPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [currentWeather, setCurrentWeather] = useState("");
  const [selectedClothes, setSelectedClothes] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");

  const newRound = useCallback(() => {
    const weatherTypes = ["sunny", "rainy", "snowy", "windy"];
    const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    setCurrentWeather(weather);
    setSelectedClothes([]);
    setMessage("");
  }, []);

  const toggleClothing = (id: string) => {
    setSelectedClothes(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const checkOutfit = () => {
    const goodClothes = CLOTHES.filter(c => c.good.includes(currentWeather));
    const correct = goodClothes.every(c => selectedClothes.includes(c.id));
    
    if (correct) {
      setScore(s => s + 10);
      setMessage("✓ Perfect outfit!");
      setTimeout(newRound, 1000);
    } else {
      setMessage("✗ Try different clothes!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-500 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">👔 Weather Dress</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-sky-100 mb-4">Dress for the weather!</p>
          <button onClick={() => { setScore(0); newRound(); setPhase("playing"); }} className="px-8 py-4 bg-yellow-400 text-blue-900 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>
          <p className="text-3xl mb-4">{WEATHERS.find(w => w.toLowerCase().includes(currentWeather))}</p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {CLOTHES.map(item => (
              <button key={item.id} onClick={() => toggleClothing(item.id)}
                className={`p-3 rounded-xl text-3xl ${selectedClothes.includes(item.id) ? "bg-yellow-400 ring-4 ring-yellow-200" : "bg-white/50"}`}>
                {item.emoji}
              </button>
            ))}
          </div>

          <button onClick={checkOutfit} className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl">Check!</button>
          <p className="mt-2 text-xl">{message}</p>
          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
