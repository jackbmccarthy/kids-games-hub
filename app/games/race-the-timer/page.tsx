"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";
type PuzzleType = "colorMatch" | "countShapes" | "findPattern" | "memory";

interface Puzzle {
  type: PuzzleType;
  question: string;
  options: string[];
  correct: number;
  timeLimit: number;
}

const COLORS = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠"];
const SHAPES = ["⭐", "❤️", "🔷", "🟡", "🔸", "⬛"];

const generatePuzzle = (level: number): Puzzle => {
  const types: PuzzleType[] = ["colorMatch", "countShapes", "findPattern", "memory"];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const timeLimit = Math.max(5, 15 - level);

  switch (type) {
    case "colorMatch": {
      const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const options = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 4);
      if (!options.includes(targetColor)) options[0] = targetColor;
      options.sort(() => Math.random() - 0.5);
      return {
        type,
        question: `Find the ${targetColor} circle!`,
        options,
        correct: options.indexOf(targetColor),
        timeLimit,
      };
    }
    case "countShapes": {
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const count = Math.floor(Math.random() * 5) + 1;
      const display = Array(count).fill(shape).join(" ");
      const options = ["1", "2", "3", "4", "5"].sort(() => Math.random() - 0.5).slice(0, 4);
      if (!options.includes(count.toString())) options[0] = count.toString();
      options.sort(() => Math.random() - 0.5);
      return {
        type,
        question: `How many ${shape}? ${display}`,
        options,
        correct: options.indexOf(count.toString()),
        timeLimit,
      };
    }
    case "findPattern": {
      const patterns = ["🔴🔵🔴🔵❓", "⭐⭐🔷⭐⭐❓", "🟡🟢🟡🟢❓"];
      const answers = ["🔴", "⭐", "🟡"];
      const idx = Math.floor(Math.random() * patterns.length);
      const wrongAnswers = ["🔵", "🔷", "🟢"].filter((_, i) => i !== idx);
      const options = [answers[idx], ...wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 3)];
      options.sort(() => Math.random() - 0.5);
      return {
        type,
        question: `What comes next? ${patterns[idx]}`,
        options,
        correct: options.indexOf(answers[idx]),
        timeLimit,
      };
    }
    case "memory": {
      const sequence = Array(4).fill(0).map(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
      const targetIdx = Math.floor(Math.random() * 4);
      const targetColor = sequence[targetIdx];
      return {
        type,
        question: `Remember: ${sequence.join(" ")} ... What was position ${targetIdx + 1}?`,
        options: COLORS.sort(() => Math.random() - 0.5).slice(0, 4),
        correct: -1, // Will be set after shuffle
        timeLimit: timeLimit + 3, // Extra time for memory
      };
    }
    default:
      return {
        type: "colorMatch",
        question: "Find the 🔴 circle!",
        options: ["🔴", "🔵", "🟢", "🟡"],
        correct: 0,
        timeLimit,
      };
  }
};

export default function RaceTheTimerPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [strikes, setStrikes] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startNewPuzzle = useCallback(() => {
    const newPuzzle = generatePuzzle(level);
    setPuzzle(newPuzzle);
    setTimeLeft(newPuzzle.timeLimit);
    setShowResult(null);
  }, [level]);

  const handleAnswer = useCallback((index: number) => {
    if (!puzzle || showResult) return;

    if (index === puzzle.correct) {
      setShowResult("correct");
      setScore(prev => prev + Math.ceil(timeLeft * 10));
      setLevel(prev => prev + 1);
      setTimeout(() => startNewPuzzle(), 500);
    } else {
      setShowResult("wrong");
      setStrikes(prev => {
        const newStrikes = prev + 1;
        if (newStrikes >= 3) {
          setPhase("gameOver");
        }
        return newStrikes;
      });
      setTimeout(() => startNewPuzzle(), 500);
    }
  }, [puzzle, showResult, timeLeft, startNewPuzzle]);

  useEffect(() => {
    if (phase === "playing" && puzzle && !showResult) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - count as wrong
            setStrikes(s => {
              if (s + 1 >= 3) setPhase("gameOver");
              return s + 1;
            });
            startNewPuzzle();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, puzzle, showResult, startNewPuzzle]);

  useEffect(() => {
    if (phase === "playing") {
      startNewPuzzle();
    }
  }, [phase, startNewPuzzle]);

  useEffect(() => {
    const saved = localStorage.getItem("race-timer-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("race-timer-high", score.toString());
    }
  }, [score, highScore]);

  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setStrikes(0);
    setPuzzle(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">⏱️ Race the Timer</h1>
      
      {phase === "menu" && (
        <div className="text-center">
          <p className="text-purple-200 mb-2">Solve puzzles before time runs out!</p>
          <p className="text-purple-300 mb-2 text-sm">3 strikes and you&apos;re out!</p>
          <p className="text-purple-400 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={() => {
              resetGame();
              setPhase("playing");
            }}
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-xl transition-all transform hover:scale-105"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && puzzle && (
        <div className="text-center w-full max-w-lg">
          {/* Timer */}
          <div className="mb-4">
            <div className="bg-gray-800 rounded-full h-6 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  timeLeft > 5 ? "bg-green-500" : timeLeft > 2 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${(timeLeft / puzzle.timeLimit) * 100}%` }}
              />
            </div>
            <p className="text-white mt-2 text-2xl font-bold">{timeLeft}s</p>
          </div>

          {/* Stats */}
          <div className="flex justify-between mb-4 text-white">
            <span>Score: {score}</span>
            <span>Level: {level}</span>
            <span>Strikes: {"❤️".repeat(3 - strikes)}{"🖤".repeat(strikes)}</span>
          </div>

          {/* Question */}
          <div className={`bg-white rounded-2xl p-6 mb-4 transition-all ${
            showResult === "correct" ? "ring-4 ring-green-500" : 
            showResult === "wrong" ? "ring-4 ring-red-500" : ""
          }`}>
            <p className="text-2xl text-gray-800 font-medium">{puzzle.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {puzzle.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult !== null}
                className={`p-4 text-3xl rounded-xl transition-all transform hover:scale-105 ${
                  showResult === null 
                    ? "bg-white hover:bg-gray-100" 
                    : index === puzzle.correct
                    ? "bg-green-400"
                    : showResult === "wrong" && "bg-gray-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="text-center">
          <p className="text-3xl text-white mb-2">Game Over!</p>
          <p className="text-xl text-yellow-400 mb-2">Score: {score}</p>
          <p className="text-lg text-purple-300 mb-4">Level Reached: {level}</p>
          <button
            onClick={() => {
              resetGame();
              setPhase("playing");
            }}
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-xl transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      {phase === "playing" && (
        <button
          onClick={() => setPhase("menu")}
          className="mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg"
        >
          Back to Menu
        </button>
      )}
    </div>
  );
}
