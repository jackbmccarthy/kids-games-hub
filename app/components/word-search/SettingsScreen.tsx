"use client";

import { useState } from "react";
import type { Grade, WordCount, GameSettings } from "../../games/word-search/page";
import { getCategoriesForGrade } from "../../data/word-pools";

interface SettingsScreenProps {
  onStart: (settings: GameSettings) => void;
  initialSettings: GameSettings;
}

const GRADES: { value: Grade; label: string; description: string }[] = [
  { value: "k", label: "K", description: "Kindergarten" },
  { value: "1", label: "1st", description: "First Grade" },
  { value: "2", label: "2nd", description: "Second Grade" },
  { value: "3", label: "3rd", description: "Third Grade" },
  { value: "4", label: "4th", description: "Fourth Grade" },
  { value: "5", label: "5th", description: "Fifth Grade" },
];

const WORD_COUNTS: WordCount[] = [10, 15, 20];

export function SettingsScreen({ onStart, initialSettings }: SettingsScreenProps) {
  const [grade, setGrade] = useState<Grade>(initialSettings.grade);
  const [wordCount, setWordCount] = useState<WordCount>(initialSettings.wordCount);
  const [category, setCategory] = useState<string>(initialSettings.category);

  const availableCategories = getCategoriesForGrade(grade);

  const handleStart = () => {
    onStart({ grade, wordCount, category });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-[#FF6B6B] mb-2">
          ⚙️ Game Settings
        </h1>
        <p className="text-[#2C3E50]/70">Choose your grade, category, and word count!</p>
      </div>

      {/* Settings Container */}
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Grade Selection */}
        <section>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">📚 Pick Your Grade</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {GRADES.map((g) => (
              <button
                key={g.value}
                onClick={() => {
                  setGrade(g.value);
                  // Reset category if current one isn't available for new grade
                  const newCategories = getCategoriesForGrade(g.value);
                  if (!newCategories.find(c => c.id === category)) {
                    setCategory(newCategories[0]?.id || "animals");
                  }
                }}
                className={`p-4 rounded-xl font-bold text-lg transition-all ${
                  grade === g.value
                    ? "bg-[#4ECDC4] text-white scale-105 shadow-lg"
                    : "bg-white text-[#2C3E50] hover:bg-[#4ECDC4]/20 shadow"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>

        {/* Category Selection */}
        <section>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">🎯 Pick a Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-4 rounded-xl transition-all ${
                  category === cat.id
                    ? "bg-[#FF6B6B] text-white scale-105 shadow-lg"
                    : "bg-white text-[#2C3E50] hover:bg-[#FF6B6B]/20 shadow"
                }`}
              >
                <span className="text-2xl mb-1 block">{cat.icon}</span>
                <span className="font-semibold text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Word Count Selection */}
        <section>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">🔢 How Many Words?</h2>
          <div className="flex gap-4 justify-center">
            {WORD_COUNTS.map((count) => (
              <button
                key={count}
                onClick={() => setWordCount(count)}
                className={`w-20 h-20 rounded-xl font-black text-2xl transition-all ${
                  wordCount === count
                    ? "bg-[#FFE66D] text-[#2C3E50] scale-110 shadow-lg"
                    : "bg-white text-[#2C3E50] hover:bg-[#FFE66D]/50 shadow"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </section>

        {/* Play Button */}
        <div className="text-center pt-4">
          <button
            onClick={handleStart}
            className="bg-[#FF6B6B] hover:bg-[#ff5252] text-white text-2xl font-bold py-4 px-12 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Start Game! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
