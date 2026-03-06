"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "showing" | "playing" | "correct" | "wrong" | "gameOver";
type PatternType = "colors" | "shapes" | "numbers" | "sizes";

interface PatternElement {
  type: PatternType;
  value: string | number;
  display: string;
  color?: string;
  size?: number;
}

interface RoundData {
  pattern: PatternElement[];
  correctAnswer: PatternElement;
  options: PatternElement[];
  patternType: PatternType;
}

const PATTERN_CONFIGS: Record<PatternType, { 
  values: (string | number)[], 
  colors?: string[], 
  label: string,
  emoji?: string 
}> = {
  colors: {
    values: ["red", "blue", "green", "yellow", "purple", "orange"],
    colors: ["#FF6B6B", "#4ECDC4", "#95E1A3", "#FFE66D", "#B19CD9", "#FFA07A"],
    label: "Colors",
    emoji: "🎨",
  },
  shapes: {
    values: ["circle", "square", "triangle", "star", "heart", "diamond"],
    colors: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#957DAD", "#F38181", "#A8E6CF"],
    label: "Shapes",
    emoji: "🔷",
  },
  numbers: {
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    label: "Numbers",
    emoji: "🔢",
  },
  sizes: {
    values: ["tiny", "small", "medium", "large", "huge"],
    label: "Sizes",
    emoji: "📏",
  },
};

const SHAPE_PATHS: Record<string, string> = {
  circle: "M 0,-30 A 30,30 0 1,1 0,30 A 30,30 0 1,1 0,-30",
  square: "M -25,-25 L 25,-25 L 25,25 L -25,25 Z",
  triangle: "M 0,-30 L 26,20 L -26,20 Z",
  star: "M 0,-30 L 7,-10 L 28,-10 L 12,5 L 18,28 L 0,15 L -18,28 L -12,5 L -28,-10 L -7,-10 Z",
  heart: "M 0,-10 C -10,-25 -30,-15 -30,5 C -30,20 0,35 0,35 C 0,35 30,20 30,5 C 30,-15 10,-25 0,-10 Z",
  diamond: "M 0,-30 L 25,0 L 0,30 L -25,0 Z",
};

const SIZE_SCALE: Record<string, number> = {
  tiny: 0.4,
  small: 0.6,
  medium: 0.8,
  large: 1.0,
  huge: 1.2,
};

export default function PatternBuilderPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showingIndex, setShowingIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(10);
  const [explanation, setExplanation] = useState("");
  const [animatingElement, setAnimatingElement] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Generate a random pattern element
  const generateElement = useCallback((type: PatternType, usedValues: (string | number)[] = []): PatternElement => {
    const config = PATTERN_CONFIGS[type];
    let availableValues = config.values.filter(v => !usedValues.includes(v));
    if (availableValues.length === 0) availableValues = [...config.values];
    
    const value = availableValues[Math.floor(Math.random() * availableValues.length)];
    const colorIndex = config.values.indexOf(value);
    const color = config.colors?.[colorIndex] || "#FF6B6B";
    
    if (type === "colors") {
      return { type, value, display: "●", color: color };
    } else if (type === "shapes") {
      return { type, value, display: value as string, color };
    } else if (type === "numbers") {
      return { type, value, display: String(value) };
    } else {
      return { type, value, display: "●", size: SIZE_SCALE[value as string] };
    }
  }, []);

  // Determine the pattern rule and generate the next element
  const generatePattern = useCallback((patternLength: number): RoundData => {
    const types: PatternType[] = ["colors", "shapes", "numbers", "sizes"];
    const patternType = types[Math.floor(Math.random() * types.length)];
    
    const pattern: PatternElement[] = [];
    const usedValues: (string | number)[] = [];
    
    // Create a repeating pattern (e.g., ABAB, ABCABC, AABB)
    const patternRules = ["AB", "ABC", "AABB", "ABAB", "AAB"];
    const rule = patternRules[Math.min(Math.floor((patternLength - 3) / 2), patternRules.length - 1)];
    
    // Generate unique elements for the pattern rule
    const uniqueElements: PatternElement[] = [];
    const uniqueChars = Array.from(new Set(rule.split("")));
    
    for (const _ of uniqueChars) {
      const element = generateElement(patternType, usedValues);
      usedValues.push(element.value);
      uniqueElements.push(element);
    }
    
    // Build pattern following the rule
    for (let i = 0; i < patternLength; i++) {
      const ruleChar = rule[i % rule.length];
      const ruleIndex = uniqueChars.indexOf(ruleChar);
      pattern.push({ ...uniqueElements[ruleIndex] });
    }
    
    // The correct answer is the next element in the pattern
    const nextRuleChar = rule[patternLength % rule.length];
    const nextRuleIndex = uniqueChars.indexOf(nextRuleChar);
    const correctAnswer = uniqueElements[nextRuleIndex];
    
    // Generate wrong options
    const wrongOptions: PatternElement[] = [];
    while (wrongOptions.length < 3) {
      const wrongElement = generateElement(patternType, usedValues);
      if (!wrongOptions.some(o => o.value === wrongElement.value) && 
          wrongElement.value !== correctAnswer.value) {
        wrongOptions.push(wrongElement);
      }
    }
    
    // Shuffle options
    const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    return { pattern, correctAnswer, options, patternType };
  }, [generateElement]);

  // Start a new round
  const startRound = useCallback(() => {
    const patternLength = Math.min(3 + Math.floor(level / 2), 8);
    const data = generatePattern(patternLength);
    setRoundData(data);
    setShowingIndex(-1);
    setTimeLeft(Math.max(5, 12 - Math.floor(level / 3)));
    setExplanation("");
    setPhase("showing");
    
    // Animate showing the pattern
    let currentIndex = -1;
    const showNext = () => {
      currentIndex++;
      if (currentIndex <= data.pattern.length) {
        setShowingIndex(currentIndex);
        setAnimatingElement(currentIndex - 1);
        if (currentIndex <= data.pattern.length) {
          setTimeout(showNext, 600);
        }
      } else {
        setPhase("playing");
        startTimeRef.current = Date.now();
      }
    };
    setTimeout(showNext, 300);
  }, [level, generatePattern]);

  // Start the game
  const startGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setStreak(0);
    startRound();
  }, [startRound]);

  // Handle answer selection
  const handleAnswer = useCallback((selected: PatternElement) => {
    if (phase !== "playing" || !roundData) return;
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const speedBonus = Math.max(0, Math.floor((timeLeft - timeTaken) * 2));
    
    if (selected.value === roundData.correctAnswer.value) {
      // Correct answer!
      const basePoints = 10 * level;
      const streakMultiplier = 1 + streak * 0.1;
      const points = Math.round(basePoints * streakMultiplier) + speedBonus;
      
      setScore(s => s + points);
      setStreak(s => {
        const newStreak = s + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      setPhase("correct");
      
      // Move to next level after delay
      setTimeout(() => {
        setLevel(l => l + 1);
        startRound();
      }, 1200);
    } else {
      // Wrong answer
      const patternDesc = describePattern(roundData);
      setExplanation(
        `The pattern was ${patternDesc}. The correct answer was ${roundData.correctAnswer.display}${roundData.correctAnswer.color ? ` (${roundData.correctAnswer.value})` : ""}!`
      );
      setStreak(0);
      setPhase("wrong");
      
      // Check if game over or continue
      setTimeout(() => {
        if (streak === 0 && score === 0) {
          // Give another chance
          startRound();
        } else if (streak === 0) {
          setPhase("gameOver");
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("pattern-builder-high-score", String(score));
          }
        } else {
          // Reset streak but continue
          startRound();
        }
      }, 2500);
    }
  }, [phase, roundData, streak, score, bestStreak, highScore, timeLeft, startRound]);

  // Describe the pattern for explanation
  const describePattern = (data: RoundData): string => {
    const values = data.pattern.map(p => {
      if (p.color) return p.value;
      if (p.size) return p.value;
      return p.display;
    });
    return values.join(" → ") + " → ?";
  };

  // Timer
  useEffect(() => {
    if (phase !== "playing") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Time's up - count as wrong
          if (roundData) {
            const patternDesc = describePattern(roundData);
            setExplanation(`Time's up! The pattern was ${patternDesc}. The answer was ${roundData.correctAnswer.display}!`);
          }
          setStreak(0);
          setPhase("wrong");
          setTimeout(() => {
            if (score === 0) {
              startRound();
            } else {
              setPhase("gameOver");
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem("pattern-builder-high-score", String(score));
              }
            }
          }, 2500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, roundData, score, highScore, startRound]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("pattern-builder-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Render pattern element
  const renderElement = (element: PatternElement, index: number, isMissing: boolean = false) => {
    const isAnimating = animatingElement === index && phase === "showing";
    
    if (element.type === "colors") {
      return (
        <div
          className={`
            w-14 h-14 md:w-16 md:h-16 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${isAnimating ? "scale-125 shadow-lg" : "scale-100"}
            ${isMissing ? "opacity-30 border-4 border-dashed border-gray-400" : ""}
          `}
          style={{ 
            backgroundColor: isMissing ? "transparent" : element.color,
            boxShadow: isAnimating ? `0 0 20px ${element.color}` : "none",
          }}
        >
          {isMissing && <span className="text-3xl">?</span>}
        </div>
      );
    }
    
    if (element.type === "shapes") {
      return (
        <div
          className={`
            w-14 h-14 md:w-16 md:h-16
            flex items-center justify-center
            transition-all duration-300
            ${isAnimating ? "scale-125" : "scale-100"}
            ${isMissing ? "opacity-30" : ""}
          `}
        >
          <svg 
            width={48} 
            height={48} 
            viewBox="-35 -35 70 70"
            style={{ filter: isAnimating ? "drop-shadow(0 0 10px " + element.color + ")" : "none" }}
          >
            <path
              d={SHAPE_PATHS[element.value as string] || SHAPE_PATHS.circle}
              fill={isMissing ? "none" : element.color}
              stroke={isMissing ? "#9CA3AF" : "none"}
              strokeWidth={isMissing ? 3 : 0}
              strokeDasharray={isMissing ? "5,5" : "none"}
            />
          </svg>
          {isMissing && <span className="absolute text-3xl">?</span>}
        </div>
      );
    }
    
    if (element.type === "numbers") {
      return (
        <div
          className={`
            w-14 h-14 md:w-16 md:h-16 rounded-2xl
            bg-gradient-to-br from-indigo-400 to-purple-500
            flex items-center justify-center
            text-2xl md:text-3xl font-black text-white
            transition-all duration-300
            ${isAnimating ? "scale-125 shadow-lg" : "scale-100"}
            ${isMissing ? "opacity-30 bg-gray-300" : ""}
          `}
        >
          {isMissing ? "?" : element.value}
        </div>
      );
    }
    
    if (element.type === "sizes") {
      const size = element.size || 0.8;
      return (
        <div
          className={`
            w-14 h-14 md:w-16 md:h-16
            flex items-center justify-center
            transition-all duration-300
            ${isAnimating ? "scale-110" : "scale-100"}
            ${isMissing ? "opacity-30" : ""}
          `}
        >
          <div
            className="rounded-full bg-gradient-to-br from-teal-400 to-cyan-500"
            style={{
              width: `${40 * size}px`,
              height: `${40 * size}px`,
              boxShadow: isAnimating ? "0 0 15px #2DD4BF" : "none",
            }}
          />
          {isMissing && <span className="absolute text-3xl">?</span>}
        </div>
      );
    }
    
    return null;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-2xl text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
          🧩 Pattern Builder 🧩
        </h1>
        {phase !== "menu" && (
          <div className="flex justify-center gap-4 md:gap-8 text-sm md:text-lg">
            <span className="text-[#4ECDC4]">Level: {level}</span>
            <span className="text-[#FFE66D]">Score: {score}</span>
            <span className="text-[#FF6B6B]">Streak: {streak}🔥</span>
          </div>
        )}
      </header>

      {/* Menu */}
      {phase === "menu" && (
        <div className="bg-[#16213e] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl text-center">
          <p className="text-gray-300 mb-4 text-lg">
            Find the missing piece to complete the pattern!
          </p>

          {highScore > 0 && (
            <p className="text-[#FFE66D] font-bold mb-4 text-xl">🏆 High Score: {highScore}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="bg-[#0f3460] rounded-xl p-3">
              <span className="text-2xl">🎨</span>
              <p className="text-gray-300 mt-1">Colors</p>
            </div>
            <div className="bg-[#0f3460] rounded-xl p-3">
              <span className="text-2xl">🔷</span>
              <p className="text-gray-300 mt-1">Shapes</p>
            </div>
            <div className="bg-[#0f3460] rounded-xl p-3">
              <span className="text-2xl">🔢</span>
              <p className="text-gray-300 mt-1">Numbers</p>
            </div>
            <div className="bg-[#0f3460] rounded-xl p-3">
              <span className="text-2xl">📏</span>
              <p className="text-gray-300 mt-1">Sizes</p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#4ECDC4] to-[#44B3A9] hover:from-[#3DBDB5] hover:to-[#3AA39C] text-white font-bold rounded-xl text-xl transition-all shadow-lg"
          >
            ▶️ Start Game
          </button>

          <div className="mt-6 text-sm text-gray-400">
            <p>🔥 Build streaks for bonus points!</p>
            <p>⚡ Answer fast for speed multipliers!</p>
          </div>
        </div>
      )}

      {/* Game Area */}
      {(phase === "showing" || phase === "playing" || phase === "correct" || phase === "wrong") && roundData && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
          {/* Timer */}
          {phase === "playing" && (
            <div className="mb-4 w-full max-w-md">
              <div className="bg-[#0f3460] rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 3 ? "bg-red-500 animate-pulse" : "bg-[#4ECDC4]"
                  }`}
                  style={{ width: `${(timeLeft / (12 - Math.floor(level / 3))) * 100}%` }}
                />
              </div>
              <p className="text-center text-white mt-1 font-bold">{timeLeft}s</p>
            </div>
          )}

          {/* Pattern Type Badge */}
          <div className="mb-4">
            <span className="px-4 py-2 bg-[#0f3460] rounded-full text-white font-bold">
              {PATTERN_CONFIGS[roundData.patternType].emoji} {PATTERN_CONFIGS[roundData.patternType].label}
            </span>
          </div>

          {/* Pattern Display */}
          <div className="bg-[#16213e] rounded-3xl p-6 mb-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
              {roundData.pattern.map((element, index) => (
                <div key={index} className="relative">
                  {renderElement(element, index)}
                </div>
              ))}
              {/* Missing piece */}
              <div className="relative">
                {renderElement(roundData.correctAnswer, roundData.pattern.length, true)}
              </div>
            </div>
          </div>

          {/* Options */}
          {(phase === "playing" || phase === "showing") && (
            <div className="w-full max-w-md">
              <p className="text-center text-gray-300 mb-3 font-bold">
                {phase === "showing" ? "👀 Watch the pattern..." : "👆 Pick the missing piece!"}
              </p>
              <div className="grid grid-cols-4 gap-3">
                {roundData.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={phase !== "playing"}
                    className={`
                      bg-[#0f3460] rounded-2xl p-3
                      flex items-center justify-center
                      transition-all duration-200
                      ${phase === "playing" 
                        ? "hover:bg-[#1a4a6e] hover:scale-105 active:scale-95 cursor-pointer" 
                        : "opacity-50 cursor-not-allowed"}
                    `}
                  >
                    {renderElement(option, -1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Correct Feedback */}
          {phase === "correct" && (
            <div className="text-center animate-bounce">
              <span className="text-6xl">✨</span>
              <p className="text-[#4ECDC4] font-bold text-2xl mt-2">Correct!</p>
              {streak > 1 && (
                <p className="text-[#FFE66D] font-bold text-lg">{streak}x Streak! 🔥</p>
              )}
            </div>
          )}

          {/* Wrong Feedback */}
          {phase === "wrong" && (
            <div className="text-center bg-[#16213e] rounded-2xl p-6 max-w-md">
              <span className="text-5xl">😔</span>
              <p className="text-[#FF6B6B] font-bold text-xl mt-2">Not quite...</p>
              <p className="text-gray-300 mt-3 text-sm">{explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
            <h2 className="text-3xl font-black text-[#FF6B6B] mb-2">💔 Game Over!</h2>
            
            <div className="my-6 space-y-2 text-white">
              <p className="text-3xl font-bold">{score} points</p>
              <p className="text-lg text-gray-400">Level {level}</p>
              <p className="text-lg text-[#FFE66D]">Best Streak: {bestStreak}🔥</p>
              {score >= highScore && score > 0 && (
                <p className="text-[#4ECDC4] font-bold text-xl mt-2">🏆 New High Score!</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#44B3A9] hover:from-[#3DBDB5] hover:to-[#3AA39C] text-white font-bold rounded-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
