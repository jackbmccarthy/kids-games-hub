"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

interface Item {
  id: number;
  emoji: string;
  period: "ancient" | "medieval" | "modern" | "future";
}

const PERIODS = {
  ancient: { name: "Ancient", color: "#D4A574", items: ["🏺", "📜", "🏛️", "🦴", "⚰️"] },
  medieval: { name: "Medieval", color: "#8B4513", items: ["⚔️", "🛡️", "🏰", "👑", "🤴"] },
  modern: { name: "Modern", color: "#4169E1", items: ["🚗", "📱", "💻", "✈️", "🏙️"] },
  future: { name: "Future", color: "#9370DB", items: ["🚀", "🤖", "🛸", "🧬", "🥽"] },
};

const ALL_ITEMS: Item[] = [
  ...PERIODS.ancient.items.map((e, i) => ({ id: i, emoji: e, period: "ancient" as const })),
  ...PERIODS.medieval.items.map((e, i) => ({ id: 5 + i, emoji: e, period: "medieval" as const })),
  ...PERIODS.modern.items.map((e, i) => ({ id: 10 + i, emoji: e, period: "modern" as const })),
  ...PERIODS.future.items.map((e, i) => ({ id: 15 + i, emoji: e, period: "future" as const })),
];

export default function TimeTravelPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");

  const nextItem = useCallback(() => {
    const item = ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)];
    setCurrentItem(item);
    setSelectedPeriod(null);
    setMessage("");
  }, []);

  const checkMatch = () => {
    if (!currentItem || !selectedPeriod) return;
    if (currentItem.period === selectedPeriod) {
      setScore(s => s + 10);
      setMessage("✓ Correct era!");
      setTimeout(nextItem, 1000);
    } else {
      setMessage("✗ Wrong era!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-yellow-300 mb-4">⏰ Time Travel</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-purple-200 mb-4">Match items to their time period!</p>
          <button onClick={() => { setScore(0); nextItem(); setPhase("playing"); }} className="px-8 py-4 bg-yellow-500 text-purple-900 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && currentItem && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>

          <div className="text-8xl mb-6">{currentItem.emoji}</div>
          <p className="text-purple-200 mb-4">When did this exist?</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {Object.entries(PERIODS).map(([key, period]) => (
              <button
                key={key}
                onClick={() => setSelectedPeriod(key)}
                className={`px-6 py-4 rounded-xl font-bold ${selectedPeriod === key ? "ring-4 ring-yellow-400" : ""}`}
                style={{ backgroundColor: period.color }}
              >
                {period.name}
              </button>
            ))}
          </div>

          <button onClick={checkMatch} disabled={!selectedPeriod} className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl disabled:opacity-50">Check!</button>
          <p className="mt-2 text-xl">{message}</p>
          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
