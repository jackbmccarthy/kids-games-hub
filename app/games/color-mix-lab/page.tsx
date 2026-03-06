"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "playing" | "levelComplete" | "freePlay";

interface TargetColor {
  name: string;
  hex: string;
  ryb: { r: number; y: number; b: number };
}

interface MixedColor {
  r: number;
  y: number;
  b: number;
}

// RYB Color mixing targets
const TARGET_COLORS: TargetColor[] = [
  { name: "Orange", hex: "#FF8C00", ryb: { r: 50, y: 50, b: 0 } },
  { name: "Green", hex: "#228B22", ryb: { r: 0, y: 50, b: 50 } },
  { name: "Purple", hex: "#800080", ryb: { r: 50, y: 0, b: 50 } },
  { name: "Brown", hex: "#8B4513", ryb: { r: 33, y: 33, b: 33 } },
  { name: "Lime", hex: "#32CD32", ryb: { r: 25, y: 75, b: 0 } },
  { name: "Teal", hex: "#008080", ryb: { r: 0, y: 25, b: 75 } },
  { name: "Magenta", hex: "#FF00FF", ryb: { r: 75, y: 0, b: 25 } },
  { name: "Peach", hex: "#FFDAB9", ryb: { r: 75, y: 25, b: 0 } },
  { name: "Lavender", hex: "#E6E6FA", ryb: { r: 25, y: 0, b: 25 } },
  { name: "Olive", hex: "#808000", ryb: { r: 25, y: 50, b: 25 } },
];

const COLOR_TIPS = [
  "Red + Yellow = Orange! 🍊",
  "Yellow + Blue = Green! 🌿",
  "Red + Blue = Purple! 💜",
  "Mix all three for Brown! 🟤",
  "More red makes warmer colors! 🔥",
  "More blue makes cooler colors! ❄️",
  "Yellow brightens any color! ☀️",
  "Subtractive mixing: paint blends darker!",
];

// Convert RYB to RGB for display (simplified)
function rybToRgb(r: number, y: number, b: number): string {
  // Simplified RYB to RGB conversion
  const total = r + y + b || 1;
  const rn = r / total;
  const yn = y / total;
  const bn = b / total;

  // Approximate RGB values
  let red = Math.round((rn * 255 + yn * 128) * 1.2);
  let green = Math.round((yn * 200 + bn * 50) * 1.1);
  let blue = Math.round((bn * 255 + rn * 50) * 1.2);

  red = Math.min(255, Math.max(0, red));
  green = Math.min(255, Math.max(0, green));
  blue = Math.min(255, Math.max(0, blue));

  return `rgb(${red}, ${green}, ${blue})`;
}

// Calculate match percentage between two RYB colors
function calculateMatch(
  mixed: MixedColor,
  target: { r: number; y: number; b: number }
): number {
  const dr = Math.abs(mixed.r - target.r);
  const dy = Math.abs(mixed.y - target.y);
  const db = Math.abs(mixed.b - target.b);
  const avgDiff = (dr + dy + db) / 3;
  return Math.max(0, 100 - avgDiff * 2);
}

export default function ColorMixLabPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [mixedColor, setMixedColor] = useState<MixedColor>({ r: 0, y: 0, b: 0 });
  const [currentTarget, setCurrentTarget] = useState<TargetColor | null>(null);
  const [drops, setDrops] = useState(0);
  const [maxDrops, setMaxDrops] = useState(10);
  const [unlockedColors, setUnlockedColors] = useState(1);
  const [tip, setTip] = useState("");
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [isFreePlay, setIsFreePlay] = useState(false);

  const bowlRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Get audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play splash sound
  const playSplashSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Start game
  const startGame = useCallback(() => {
    setLevel(0);
    setScore(0);
    setUnlockedColors(1);
    setMixedColor({ r: 0, y: 0, b: 0 });
    setDrops(0);
    setMaxDrops(10);
    setColorHistory([]);
    setIsFreePlay(false);
    setPhase("playing");
    setTip(COLOR_TIPS[Math.floor(Math.random() * COLOR_TIPS.length)]);
    setCurrentTarget(TARGET_COLORS[0]);
  }, []);

  // Start free play mode
  const startFreePlay = useCallback(() => {
    setMixedColor({ r: 0, y: 0, b: 0 });
    setDrops(0);
    setColorHistory([]);
    setIsFreePlay(true);
    setCurrentTarget(null);
    setPhase("freePlay");
  }, []);

  // Add color drop
  const addDrop = useCallback((color: "r" | "y" | "b") => {
    playSplashSound();
    setMixedColor(prev => {
      const newColor = { ...prev };
      newColor[color] = Math.min(100, prev[color] + 10);
      return newColor;
    });
    setDrops(prev => prev + 1);

    // Add animation effect
    if (bowlRef.current) {
      bowlRef.current.classList.add("ripple");
      setTimeout(() => bowlRef.current?.classList.remove("ripple"), 300);
    }
  }, [playSplashSound]);

  // Reset bowl
  const resetBowl = useCallback(() => {
    setMixedColor({ r: 0, y: 0, b: 0 });
    setDrops(0);
  }, []);

  // Check match (only in challenge mode)
  const checkMatch = useCallback(() => {
    if (!currentTarget || isFreePlay) return;

    const matchPercent = calculateMatch(mixedColor, currentTarget.ryb);
    const total = mixedColor.r + mixedColor.y + mixedColor.b;
    
    if (total === 0) return; // No color mixed

    let stars = 0;
    if (matchPercent >= 90) stars = 3;
    else if (matchPercent >= 70) stars = 2;
    else if (matchPercent >= 50) stars = 1;

    const points = stars * 100 + Math.max(0, 50 - drops * 5);
    setScore(prev => prev + points);

    // Save color to history
    const colorHex = rybToRgb(mixedColor.r, mixedColor.y, mixedColor.b);
    setColorHistory(prev => [...prev, colorHex]);

    // Unlock next color
    if (stars >= 2 && level < TARGET_COLORS.length - 1) {
      setUnlockedColors(prev => Math.min(TARGET_COLORS.length, prev + 1));
    }

    setPhase("levelComplete");
  }, [currentTarget, mixedColor, isFreePlay, drops, level]);

  // Next level
  const nextLevel = useCallback(() => {
    if (level < unlockedColors - 1) {
      setLevel(prev => prev + 1);
      setCurrentTarget(TARGET_COLORS[level + 1]);
      setMixedColor({ r: 0, y: 0, b: 0 });
      setDrops(0);
      setMaxDrops(10 + level);
      setTip(COLOR_TIPS[Math.floor(Math.random() * COLOR_TIPS.length)]);
      setPhase("playing");
    } else {
      startGame();
    }
  }, [level, unlockedColors, startGame]);

  // Calculate match percentage for display
  const matchPercent = currentTarget ? calculateMatch(mixedColor, currentTarget.ryb) : 0;

  // Get stars for current match
  const getStars = useCallback((percent: number): number => {
    if (percent >= 90) return 3;
    if (percent >= 70) return 2;
    if (percent >= 50) return 1;
    return 0;
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFF8E1] to-[#E1F5FE] p-4">
      {/* Header */}
      <header className="max-w-2xl mx-auto text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-[#2C3E50] mb-2">
          🧪 Color Mix Lab 🎨
        </h1>
        {phase === "playing" && currentTarget && (
          <div className="flex justify-center gap-6 text-lg font-bold">
            <span className="text-[#4ECDC4]">Score: {score}</span>
            <span className="text-[#FF6B6B]">Level: {level + 1}</span>
            <span className="text-gray-600">Drops: {drops}/{maxDrops}</span>
          </div>
        )}
      </header>

      {/* Menu */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <p className="text-gray-600 mb-6">Mix colors to match targets!</p>

          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
            >
              🎯 Challenge Mode
            </button>
            <button
              onClick={startFreePlay}
              className="w-full px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
            >
              🎨 Free Play Mode
            </button>
          </div>

          <div className="mt-6 p-4 bg-[#F5F5F5] rounded-xl text-sm text-gray-600">
            <p className="font-bold mb-2">How to Play:</p>
            <ul className="text-left space-y-1">
              <li>• Click colors to add drops to the bowl</li>
              <li>• Match the target color as closely as possible</li>
              <li>• Red + Yellow = Orange, Yellow + Blue = Green</li>
              <li>• Red + Blue = Purple, All three = Brown</li>
            </ul>
          </div>
        </div>
      )}

      {/* Game */}
      {(phase === "playing" || phase === "freePlay") && (
        <div className="max-w-2xl mx-auto">
          {/* Target Color (Challenge Mode Only) */}
          {currentTarget && !isFreePlay && (
            <div className="text-center mb-4">
              <p className="text-lg font-bold text-[#2C3E50] mb-2">Target: {currentTarget.name}</p>
              <div className="flex justify-center items-center gap-4">
                <div
                  className="w-20 h-20 rounded-2xl shadow-lg border-4 border-white"
                  style={{ backgroundColor: currentTarget.hex }}
                />
                <span className="text-4xl">→</span>
                <div
                  className="w-20 h-20 rounded-2xl shadow-lg border-4 border-white"
                  style={{ backgroundColor: rybToRgb(mixedColor.r, mixedColor.y, mixedColor.b) }}
                />
              </div>
              <p className="mt-2 text-lg font-bold">
                Match: {matchPercent.toFixed(0)}% {"⭐".repeat(getStars(matchPercent))}
              </p>
            </div>
          )}

          {/* Mixing Bowl */}
          <div className="flex justify-center mb-6">
            <div
              ref={bowlRef}
              className="relative w-48 h-48 rounded-full border-8 border-gray-300 bg-white shadow-xl flex items-center justify-center transition-all"
              style={{
                backgroundColor: rybToRgb(mixedColor.r, mixedColor.y, mixedColor.b),
              }}
            >
              {/* Bowl rim */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 opacity-50" />
              
              {/* Bubble effects */}
              {mixedColor.r + mixedColor.y + mixedColor.b > 0 && (
                <div className="absolute inset-4">
                  <div className="absolute w-4 h-4 bg-white/30 rounded-full animate-pulse top-4 left-4" />
                  <div className="absolute w-3 h-3 bg-white/20 rounded-full animate-pulse bottom-6 right-6" style={{ animationDelay: "0.5s" }} />
                  <div className="absolute w-2 h-2 bg-white/40 rounded-full animate-pulse top-8 right-8" style={{ animationDelay: "1s" }} />
                </div>
              )}
            </div>
          </div>

          {/* Color Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => addDrop("r")}
              className="w-20 h-20 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xl shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              Red
            </button>
            <button
              onClick={() => addDrop("y")}
              className="w-20 h-20 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-xl shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              Yellow
            </button>
            <button
              onClick={() => addDrop("b")}
              className="w-20 h-20 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              Blue
            </button>
          </div>

          {/* Color Percentages */}
          <div className="flex justify-center gap-8 mb-6 text-sm font-bold">
            <span className="text-red-500">R: {mixedColor.r}%</span>
            <span className="text-yellow-600">Y: {mixedColor.y}%</span>
            <span className="text-blue-500">B: {mixedColor.b}%</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetBowl}
              className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
            >
              🗑️ Reset
            </button>
            {currentTarget && !isFreePlay && (
              <button
                onClick={checkMatch}
                disabled={mixedColor.r + mixedColor.y + mixedColor.b === 0}
                className={`px-6 py-3 font-bold rounded-xl transition-all ${
                  mixedColor.r + mixedColor.y + mixedColor.b === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white"
                }`}
              >
                ✅ Check Match
              </button>
            )}
            <button
              onClick={() => setPhase("menu")}
              className="px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
            >
              🏠 Menu
            </button>
          </div>

          {/* Tip */}
          {tip && (
            <div className="mt-6 text-center p-4 bg-white/80 rounded-xl">
              <p className="text-[#2C3E50] font-semibold">💡 {tip}</p>
            </div>
          )}

          {/* Color History */}
          {colorHistory.length > 0 && (
            <div className="mt-6 text-center">
              <p className="font-bold text-[#2C3E50] mb-2">Colors Created:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {colorHistory.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg shadow border-2 border-white"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Level Complete */}
      {phase === "levelComplete" && currentTarget && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#4ECDC4] mb-4">
            {matchPercent >= 90 ? "🌟 Perfect Match! 🌟" : matchPercent >= 70 ? "✨ Great Job! ✨" : "👍 Good Try!"}
          </h2>
          
          <div className="flex justify-center items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-xl shadow"
              style={{ backgroundColor: rybToRgb(mixedColor.r, mixedColor.y, mixedColor.b) }}
            />
            <span className="text-2xl">≈</span>
            <div
              className="w-16 h-16 rounded-xl shadow"
              style={{ backgroundColor: currentTarget.hex }}
            />
          </div>

          <p className="text-xl font-bold mb-2">
            {matchPercent.toFixed(0)}% Match! {"⭐".repeat(getStars(matchPercent))}
          </p>
          <p className="text-lg text-[#FFD700] font-bold mb-6">
            +{getStars(matchPercent) * 100 + Math.max(0, 50 - drops * 5)} points!
          </p>

          <div className="space-y-3">
            <button
              onClick={nextLevel}
              className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
            >
              {level < unlockedColors - 1 ? "Next Level ▶" : "🔄 Play Again"}
            </button>
            <button
              onClick={() => setPhase("menu")}
              className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      )}

      {/* Free Play Mode */}
      {phase === "freePlay" && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-xl font-bold text-[#2C3E50]">🎨 Free Play Mode</p>
            <p className="text-gray-600">Mix any colors you want!</p>
          </div>

          {/* Current Color Display */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div
              className="w-32 h-32 rounded-2xl shadow-lg border-4 border-white"
              style={{ backgroundColor: rybToRgb(mixedColor.r, mixedColor.y, mixedColor.b) }}
            />
          </div>

          {/* Color Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => addDrop("r")}
              className="w-20 h-20 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xl shadow-lg transition-all hover:scale-110"
            >
              Red
            </button>
            <button
              onClick={() => addDrop("y")}
              className="w-20 h-20 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-xl shadow-lg transition-all hover:scale-110"
            >
              Yellow
            </button>
            <button
              onClick={() => addDrop("b")}
              className="w-20 h-20 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl shadow-lg transition-all hover:scale-110"
            >
              Blue
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetBowl}
              className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
            >
              🗑️ Reset
            </button>
            <button
              onClick={() => setPhase("menu")}
              className="px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
            >
              🏠 Menu
            </button>
          </div>

          {/* Color History */}
          {colorHistory.length > 0 && (
            <div className="mt-6 text-center">
              <p className="font-bold text-[#2C3E50] mb-2">Colors Created:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {colorHistory.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg shadow border-2 border-white"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes ripple {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .ripple {
          animation: ripple 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
