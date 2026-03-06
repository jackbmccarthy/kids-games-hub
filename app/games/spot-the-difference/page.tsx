"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "playing" | "levelComplete" | "gameComplete";

interface Difference {
  id: number;
  x: number;
  y: number;
  radius: number;
  found: boolean;
  hint: boolean;
}

interface Scene {
  id: number;
  name: string;
  emoji: string;
  background: string;
  items: SceneItem[];
  differences: Omit<Difference, "found" | "hint">[];
}

interface SceneItem {
  type: "emoji" | "shape";
  value: string;
  x: number;
  y: number;
  size: number;
  color?: string;
  modified?: boolean; // if true, this item only appears in one version
  modifiedValue?: string; // the modified version's value
}

const SCENES: Scene[] = [
  {
    id: 1,
    name: "Sunny Garden",
    emoji: "🌻",
    background: "linear-gradient(180deg, #87CEEB 0%, #87CEEB 50%, #90EE90 50%, #228B22 100%)",
    items: [
      { type: "emoji", value: "☀️", x: 15, y: 15, size: 50 },
      { type: "emoji", value: "☁️", x: 70, y: 12, size: 40 },
      { type: "emoji", value: "🏠", x: 70, y: 55, size: 70 },
      { type: "emoji", value: "🌳", x: 25, y: 65, size: 60 },
      { type: "emoji", value: "🌷", x: 10, y: 85, size: 35 },
      { type: "emoji", value: "🌻", x: 30, y: 88, size: 35 },
      { type: "emoji", value: "🦋", x: 45, y: 35, size: 30 },
      { type: "emoji", value: "🐝", x: 55, y: 75, size: 25 },
      { type: "emoji", value: "🌸", x: 85, y: 88, size: 30 },
      // Modified items for differences
      { type: "emoji", value: "🌸", x: 50, y: 85, size: 30, modified: true },
      { type: "emoji", value: "🌺", x: 50, y: 85, size: 30, modified: true, modifiedValue: "🌹" },
    ],
    differences: [
      { id: 1, x: 15, y: 15, radius: 35 }, // sun moved/changed
      { id: 2, x: 70, y: 12, radius: 30 }, // cloud changed
      { id: 3, x: 45, y: 35, radius: 25 }, // butterfly
      { id: 4, x: 55, y: 75, radius: 22 }, // bee
      { id: 5, x: 50, y: 85, radius: 25 }, // flower changed
      { id: 6, x: 30, y: 88, radius: 28 }, // sunflower
    ],
  },
  {
    id: 2,
    name: "Under the Sea",
    emoji: "🐠",
    background: "linear-gradient(180deg, #00CED1 0%, #20B2AA 50%, #008B8B 100%)",
    items: [
      { type: "emoji", value: "🐠", x: 20, y: 30, size: 45 },
      { type: "emoji", value: "🐠", x: 75, y: 50, size: 45, modified: true, modifiedValue: "🐟" },
      { type: "emoji", value: "🐙", x: 50, y: 70, size: 55 },
      { type: "emoji", value: "🦀", x: 15, y: 85, size: 35 },
      { type: "emoji", value: "🐚", x: 80, y: 88, size: 35, modified: true, modifiedValue: "⭐" },
      { type: "emoji", value: "🌊", x: 85, y: 15, size: 40 },
      { type: "emoji", value: "🫧", x: 30, y: 15, size: 25, modified: true, modifiedValue: "💫" },
      { type: "emoji", value: "🐡", x: 60, y: 25, size: 40 },
      { type: "emoji", value: "🌿", x: 40, y: 90, size: 30 },
      { type: "emoji", value: "🐠", x: 35, y: 55, size: 35 },
    ],
    differences: [
      { id: 1, x: 20, y: 30, radius: 32 },
      { id: 2, x: 75, y: 50, radius: 32 },
      { id: 3, x: 50, y: 70, radius: 38 },
      { id: 4, x: 80, y: 88, radius: 28 },
      { id: 5, x: 30, y: 15, radius: 22 },
      { id: 6, x: 60, y: 25, radius: 30 },
      { id: 7, x: 35, y: 55, radius: 28 },
    ],
  },
  {
    id: 3,
    name: "Space Adventure",
    emoji: "🚀",
    background: "linear-gradient(180deg, #0F0F23 0%, #1A1A3E 50%, #2D1B69 100%)",
    items: [
      { type: "emoji", value: "🌙", x: 20, y: 20, size: 50 },
      { type: "emoji", value: "⭐", x: 80, y: 15, size: 30, modified: true, modifiedValue: "🌟" },
      { type: "emoji", value: "🚀", x: 50, y: 45, size: 60 },
      { type: "emoji", value: "🛸", x: 75, y: 65, size: 45, modified: true, modifiedValue: "🛰️" },
      { type: "emoji", value: "🪐", x: 25, y: 70, size: 50 },
      { type: "emoji", value: "⭐", x: 40, y: 25, size: 20 },
      { type: "emoji", value: "⭐", x: 65, y: 30, size: 22, modified: true, modifiedValue: "💫" },
      { type: "emoji", value: "👨‍🚀", x: 85, y: 85, size: 35 },
      { type: "emoji", value: "🌍", x: 10, y: 50, size: 40, modified: true, modifiedValue: "🌎" },
      { type: "emoji", value: "☄️", x: 55, y: 80, size: 30 },
    ],
    differences: [
      { id: 1, x: 20, y: 20, radius: 35 },
      { id: 2, x: 80, y: 15, radius: 25 },
      { id: 3, x: 50, y: 45, radius: 42 },
      { id: 4, x: 75, y: 65, radius: 35 },
      { id: 5, x: 65, y: 30, radius: 22 },
      { id: 6, x: 10, y: 50, radius: 30 },
      { id: 7, x: 55, y: 80, radius: 25 },
    ],
  },
  {
    id: 4,
    name: "Farm Friends",
    emoji: "🐄",
    background: "linear-gradient(180deg, #87CEEB 0%, #87CEEB 40%, #90EE90 40%, #228B22 100%)",
    items: [
      { type: "emoji", value: "☀️", x: 15, y: 12, size: 45 },
      { type: "emoji", value: "☁️", x: 75, y: 10, size: 35, modified: true, modifiedValue: "⛅" },
      { type: "emoji", value: "🏡", x: 70, y: 50, size: 65 },
      { type: "emoji", value: "🐄", x: 25, y: 70, size: 55 },
      { type: "emoji", value: "🐷", x: 45, y: 80, size: 45, modified: true, modifiedValue: "🐑" },
      { type: "emoji", value: "🐔", x: 60, y: 85, size: 35 },
      { type: "emoji", value: "🌳", x: 10, y: 60, size: 50 },
      { type: "emoji", value: "🌻", x: 85, y: 70, size: 30, modified: true, modifiedValue: "🌷" },
      { type: "emoji", value: "🚜", x: 40, y: 50, size: 45 },
      { type: "emoji", value: "🐎", x: 15, y: 88, size: 40, modified: true, modifiedValue: "🐴" },
    ],
    differences: [
      { id: 1, x: 15, y: 12, radius: 32 },
      { id: 2, x: 75, y: 10, radius: 28 },
      { id: 3, x: 25, y: 70, radius: 38 },
      { id: 4, x: 45, y: 80, radius: 32 },
      { id: 5, x: 85, y: 70, radius: 25 },
      { id: 6, x: 40, y: 50, radius: 32 },
      { id: 7, x: 15, y: 88, radius: 30 },
    ],
  },
  {
    id: 5,
    name: "Forest Friends",
    emoji: "🦊",
    background: "linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #228B22 30%, #006400 100%)",
    items: [
      { type: "emoji", value: "🌲", x: 15, y: 60, size: 70 },
      { type: "emoji", value: "🌲", x: 75, y: 55, size: 80 },
      { type: "emoji", value: "🦊", x: 40, y: 75, size: 45, modified: true, modifiedValue: "🐰" },
      { type: "emoji", value: "🦉", x: 55, y: 35, size: 40 },
      { type: "emoji", value: "🐿️", x: 25, y: 85, size: 30, modified: true, modifiedValue: "🐀" },
      { type: "emoji", value: "🍄", x: 60, y: 88, size: 30 },
      { type: "emoji", value: "🌸", x: 85, y: 70, size: 25, modified: true, modifiedValue: "🌺" },
      { type: "emoji", value: "🐦", x: 70, y: 25, size: 30 },
      { type: "emoji", value: "🦋", x: 30, y: 50, size: 25 },
      { type: "emoji", value: "🌳", x: 50, y: 65, size: 60, modified: true, modifiedValue: "🌴" },
    ],
    differences: [
      { id: 1, x: 15, y: 60, radius: 45 },
      { id: 2, x: 75, y: 55, radius: 50 },
      { id: 3, x: 40, y: 75, radius: 32 },
      { id: 4, x: 55, y: 35, radius: 30 },
      { id: 5, x: 25, y: 85, radius: 25 },
      { id: 6, x: 60, y: 88, radius: 25 },
      { id: 7, x: 50, y: 65, radius: 40 },
    ],
  },
];

const DIFFICULTY_CONFIG = {
  easy: { time: 120, pointsPerFind: 15, hintCost: 10, differencesCount: 5 },
  medium: { time: 90, pointsPerFind: 20, hintCost: 15, differencesCount: 6 },
  hard: { time: 60, pointsPerFind: 25, hintCost: 20, differencesCount: 7 },
};

type Difficulty = keyof typeof DIFFICULTY_CONFIG;

export default function SpotTheDifferencePage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [differences, setDifferences] = useState<Difference[]>([]);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [foundCount, setFoundCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("spot-diff-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const currentScene = SCENES[currentLevel];
  const config = DIFFICULTY_CONFIG[difficulty];

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setCurrentLevel(0);
    setScore(0);
    setTotalScore(0);
    setHintsUsed(0);
    initLevel(0, diff);
    setPhase("playing");
  }, []);

  const initLevel = useCallback((levelIndex: number, diff: Difficulty = difficulty) => {
    const scene = SCENES[levelIndex];
    const diffConfig = DIFFICULTY_CONFIG[diff];
    
    // Select random differences based on difficulty
    const shuffledDiffs = [...scene.differences].sort(() => Math.random() - 0.5);
    const selectedDiffs = shuffledDiffs.slice(0, diffConfig.differencesCount);
    
    setDifferences(selectedDiffs.map(d => ({
      ...d,
      found: false,
      hint: false,
    })));
    setTimeLeft(diffConfig.time);
    setFoundCount(0);
    setScore(0);
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (phase === "playing" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (phase === "playing" && timeLeft === 0) {
      // Time's up - still complete level but with reduced score
      setPhase("levelComplete");
    }
  }, [phase, timeLeft]);

  // Check for level complete
  useEffect(() => {
    if (phase === "playing" && differences.length > 0 && differences.every(d => d.found)) {
      setTimeout(() => {
        setPhase("levelComplete");
      }, 500);
    }
  }, [differences, phase]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Check if click is near any unfound difference
    const clickRadius = 8; // Percentage radius for click detection
    
    for (const diff of differences) {
      if (diff.found) continue;
      
      const distance = Math.sqrt((x - diff.x) ** 2 + (y - diff.y) ** 2);
      if (distance <= clickRadius) {
        // Found a difference!
        setDifferences(prev => prev.map(d => 
          d.id === diff.id ? { ...d, found: true } : d
        ));
        setFoundCount(prev => prev + 1);
        setScore(prev => prev + config.pointsPerFind + Math.floor(timeLeft / 10));
        return;
      }
    }
    
    // Wrong click - small penalty
    setScore(prev => Math.max(0, prev - 2));
  }, [differences, config.pointsPerFind, timeLeft]);

  const useHint = useCallback(() => {
    if (score < config.hintCost) return;
    
    const unfound = differences.find(d => !d.found && !d.hint);
    if (!unfound) return;
    
    setScore(prev => Math.max(0, prev - config.hintCost));
    setHintsUsed(prev => prev + 1);
    setDifferences(prev => prev.map(d => 
      d.id === unfound.id ? { ...d, hint: true } : d
    ));
    
    // Remove hint after 3 seconds
    setTimeout(() => {
      setDifferences(prev => prev.map(d => 
        d.id === unfound.id ? { ...d, hint: false } : d
      ));
    }, 3000);
  }, [differences, score, config.hintCost]);

  const nextLevel = useCallback(() => {
    const newTotalScore = totalScore + score;
    setTotalScore(newTotalScore);
    
    if (currentLevel < SCENES.length - 1) {
      setCurrentLevel(prev => prev + 1);
      initLevel(currentLevel + 1);
      setPhase("playing");
    } else {
      // Game complete!
      if (newTotalScore > highScore) {
        setHighScore(newTotalScore);
        localStorage.setItem("spot-diff-high-score", String(newTotalScore));
      }
      setPhase("gameComplete");
    }
  }, [currentLevel, score, totalScore, highScore, initLevel]);

  const renderScene = (isModified: boolean) => {
    const items = currentScene.items.filter(item => {
      if (item.modified) {
        return isModified ? true : false; // Show modified items only in modified version
      }
      return true;
    });

    return (
      <div 
        className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg"
        style={{ background: currentScene.background }}
      >
        {items.map((item, index) => {
          // Determine which value to show
          let displayValue = item.value;
          if (item.modified && isModified && item.modifiedValue) {
            displayValue = item.modifiedValue;
          }
          if (item.modified && !isModified) {
            displayValue = item.value;
          }
          
          return (
            <div
              key={`${item.type}-${index}-${isModified}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontSize: `${item.size}px`,
                lineHeight: 1,
              }}
            >
              {item.type === "emoji" ? displayValue : item.value}
            </div>
          );
        })}
        
        {/* Render found difference circles */}
        {isModified && differences.filter(d => d.found).map(diff => (
          <div
            key={`found-${diff.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${diff.x}%`,
              top: `${diff.y}%`,
            }}
          >
            <div 
              className="rounded-full border-4 border-green-400 animate-pulse"
              style={{
                width: `${diff.radius * 2}px`,
                height: `${diff.radius * 2}px`,
                marginLeft: `-${diff.radius}px`,
                marginTop: `-${diff.radius}px`,
              }}
            />
          </div>
        ))}
        
        {/* Render hint circles */}
        {isModified && differences.filter(d => d.hint && !d.found).map(diff => (
          <div
            key={`hint-${diff.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-bounce"
            style={{
              left: `${diff.x}%`,
              top: `${diff.y}%`,
            }}
          >
            <div 
              className="rounded-full border-4 border-yellow-400 bg-yellow-400/20"
              style={{
                width: `${diff.radius * 2}px`,
                height: `${diff.radius * 2}px`,
                marginLeft: `-${diff.radius}px`,
                marginTop: `-${diff.radius}px`,
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 p-4">
      {/* Menu */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-black text-purple-600 mb-2">Spot the Difference</h1>
          <p className="text-gray-600 mb-6">Find what&apos;s different!</p>
          
          {highScore > 0 && (
            <p className="text-xl font-bold text-yellow-500 mb-4">
              🏆 High Score: {highScore}
            </p>
          )}

          <div className="space-y-3 mb-6">
            <p className="font-bold text-gray-700">Choose Difficulty:</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => startGame("easy")}
                className="px-6 py-4 bg-green-400 hover:bg-green-500 text-white font-bold rounded-xl text-xl transition-all hover:scale-105 shadow-lg"
              >
                🌱 Easy
                <span className="block text-sm font-normal">More time, fewer differences</span>
              </button>
              <button
                onClick={() => startGame("medium")}
                className="px-6 py-4 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl text-xl transition-all hover:scale-105 shadow-lg"
              >
                ⭐ Medium
                <span className="block text-sm font-normal">Balanced challenge</span>
              </button>
              <button
                onClick={() => startGame("hard")}
                className="px-6 py-4 bg-red-400 hover:bg-red-500 text-white font-bold rounded-xl text-xl transition-all hover:scale-105 shadow-lg"
              >
                🔥 Hard
                <span className="block text-sm font-normal">Less time, more differences</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>👀 Look closely at both pictures</p>
            <p>🖱️ Click where you see differences</p>
            <p>💡 Use hints if you get stuck</p>
          </div>
        </div>
      )}

      {/* Game */}
      {phase === "playing" && currentScene && (
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
              {currentScene.emoji} {currentScene.name}
            </h2>
            <div className="flex justify-center gap-6 mt-2 text-lg font-bold text-white">
              <span className="bg-white/30 px-4 py-1 rounded-full">
                🎯 {foundCount}/{differences.length}
              </span>
              <span className={`px-4 py-1 rounded-full ${timeLeft <= 10 ? "bg-red-500 animate-pulse" : "bg-white/30"}`}>
                ⏱️ {timeLeft}s
              </span>
              <span className="bg-white/30 px-4 py-1 rounded-full">
                ⭐ {totalScore + score}
              </span>
            </div>
          </div>

          {/* Level indicator */}
          <div className="flex justify-center gap-2 mb-4">
            {SCENES.map((scene, index) => (
              <div
                key={scene.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  index === currentLevel 
                    ? "bg-white text-purple-600 scale-110" 
                    : index < currentLevel 
                      ? "bg-green-400 text-white" 
                      : "bg-white/30 text-white/70"
                }`}
              >
                {index < currentLevel ? "✓" : index + 1}
              </div>
            ))}
          </div>

          {/* Images */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-white font-bold mb-2 text-sm bg-white/20 rounded-lg py-1">Original</p>
              {renderScene(false)}
            </div>
            <div className="text-center">
              <p className="text-white font-bold mb-2 text-sm bg-white/20 rounded-lg py-1">Find the differences!</p>
              <div 
                ref={imageRef}
                onClick={handleClick}
                className="cursor-crosshair"
              >
                {renderScene(true)}
              </div>
            </div>
          </div>

          {/* Hint Button */}
          <div className="flex justify-center gap-4">
            <button
              onClick={useHint}
              disabled={score < config.hintCost || !differences.some(d => !d.found && !d.hint)}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all shadow-lg ${
                score < config.hintCost || !differences.some(d => !d.found && !d.hint)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 hover:scale-105"
              }`}
            >
              💡 Hint (-{config.hintCost} pts)
            </button>
          </div>

          {/* Found differences display */}
          <div className="mt-4 flex justify-center gap-2">
            {differences.map(diff => (
              <div
                key={diff.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                  diff.found 
                    ? "bg-green-400 scale-110" 
                    : "bg-white/30"
                }`}
              >
                {diff.found ? "✓" : "?"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level Complete */}
      {phase === "levelComplete" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-green-500 mb-2">
            {foundCount === differences.length ? "Perfect!" : "Great Job!"}
          </h2>
          <p className="text-xl text-gray-700 mb-2">
            Level {currentLevel + 1} Complete!
          </p>
          <p className="text-2xl font-bold text-purple-600 mb-4">
            +{score} points
          </p>
          {hintsUsed > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Hints used: {hintsUsed}
            </p>
          )}
          
          <button
            onClick={nextLevel}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-xl transition-all hover:scale-105 shadow-lg"
          >
            {currentLevel < SCENES.length - 1 ? "Next Level ▶" : "See Results 🏆"}
          </button>
        </div>
      )}

      {/* Game Complete */}
      {phase === "gameComplete" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="text-6xl mb-2">🏆</div>
          <h2 className="text-3xl font-black text-purple-600 mb-2">Amazing!</h2>
          <p className="text-xl text-gray-700 mb-4">You completed all levels!</p>
          
          <div className="bg-purple-100 rounded-2xl p-6 mb-6">
            <p className="text-4xl font-black text-purple-600">{totalScore + score}</p>
            <p className="text-gray-600">Total Score</p>
          </div>
          
          {(totalScore + score) >= highScore && (totalScore + score) > 0 && (
            <p className="text-xl font-bold text-yellow-500 mb-4 animate-bounce">
              🌟 New High Score! 🌟
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={() => startGame(difficulty)}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-xl transition-all hover:scale-105 shadow-lg"
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => setPhase("menu")}
              className="w-full px-6 py-4 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      )}

      {/* Confetti effect for celebration */}
      {phase === "levelComplete" && foundCount === differences.length && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${20 + Math.random() * 20}px`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
              }}
            >
              {["🎉", "⭐", "🌟", "✨", "🎊"][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
