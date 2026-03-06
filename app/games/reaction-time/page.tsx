"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "waiting" | "ready" | "clicked" | "falseStart" | "results";

interface RoundResult {
  time: number;
  wasFalseStart: boolean;
}

const WAIT_COLORS = [
  { bg: "from-red-500 to-red-700", text: "Red", emoji: "🔴" },
  { bg: "from-blue-500 to-blue-700", text: "Blue", emoji: "🔵" },
  { bg: "from-purple-500 to-purple-700", text: "Purple", emoji: "🟣" },
  { bg: "from-orange-500 to-orange-700", text: "Orange", emoji: "🟠" },
];

const TOTAL_ROUNDS = 5;

export default function ReactionTimePage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [waitColorIndex, setWaitColorIndex] = useState(0);
  
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getAverageTime = useCallback(() => {
    const validResults = roundResults.filter(r => !r.wasFalseStart);
    if (validResults.length === 0) return null;
    const sum = validResults.reduce((acc, r) => acc + r.time, 0);
    return Math.round(sum / validResults.length);
  }, [roundResults]);

  const startRound = useCallback(() => {
    // Pick a random wait color
    setWaitColorIndex(Math.floor(Math.random() * WAIT_COLORS.length));
    setPhase("waiting");
    setReactionTime(null);

    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000;
    
    timeoutRef.current = setTimeout(() => {
      setPhase("ready");
      startTimeRef.current = Date.now();
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === "waiting") {
      // False start!
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase("falseStart");
      setRoundResults(prev => [...prev, { time: 0, wasFalseStart: true }]);
    } else if (phase === "ready") {
      // Valid click!
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setPhase("clicked");
      setRoundResults(prev => [...prev, { time, wasFalseStart: false }]);
      
      // Update best time
      setBestTime(prev => {
        if (prev === null || time < prev) {
          localStorage.setItem("reaction-best-time", String(time));
          return time;
        }
        return prev;
      });
    }
  }, [phase]);

  const nextRound = useCallback(() => {
    if (currentRound >= TOTAL_ROUNDS) {
      setPhase("results");
    } else {
      setCurrentRound(prev => prev + 1);
      startRound();
    }
  }, [currentRound, startRound]);

  const resetGame = useCallback(() => {
    setCurrentRound(1);
    setRoundResults([]);
    setReactionTime(null);
    setPhase("menu");
  }, []);

  const startGame = useCallback(() => {
    setCurrentRound(1);
    setRoundResults([]);
    startRound();
  }, [startRound]);

  // Load best time on mount
  useEffect(() => {
    const saved = localStorage.getItem("reaction-best-time");
    if (saved) setBestTime(parseInt(saved, 10));
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const waitColor = WAIT_COLORS[waitColorIndex];

  const getFeedback = (time: number) => {
    if (time < 200) return { emoji: "🚀", text: "Lightning Fast!", color: "text-yellow-400" };
    if (time < 300) return { emoji: "⚡", text: "Super Quick!", color: "text-green-400" };
    if (time < 400) return { emoji: "🎉", text: "Great!", color: "text-blue-400" };
    if (time < 500) return { emoji: "👍", text: "Good!", color: "text-purple-400" };
    return { emoji: "🐢", text: "Keep Practicing!", color: "text-orange-400" };
  };

  return (
    <main 
      className={`min-h-screen flex flex-col items-center justify-center transition-all duration-300 ${
        phase === "waiting" ? `bg-gradient-to-b ${waitColor.bg}` :
        phase === "ready" ? "bg-gradient-to-b from-green-400 to-green-600" :
        phase === "falseStart" ? "bg-gradient-to-b from-gray-600 to-gray-800" :
        "bg-gradient-to-b from-indigo-400 to-indigo-600"
      }`}
      onClick={phase === "waiting" || phase === "ready" ? handleClick : undefined}
    >
      {/* Menu Screen */}
      {phase === "menu" && (
        <div className="text-center px-6 max-w-md">
          <div className="text-7xl mb-4">⚡</div>
          <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
            Reaction Time!
          </h1>
          <p className="text-white/90 text-lg mb-6">
            When the screen turns <span className="text-green-300 font-bold">GREEN</span>, tap as fast as you can!
          </p>
          
          {bestTime !== null && (
            <div className="bg-white/20 rounded-2xl px-6 py-3 mb-6">
              <p className="text-white/80 text-sm">🏆 Best Time</p>
              <p className="text-3xl font-black text-yellow-300">{bestTime}ms</p>
            </div>
          )}

          <button
            onClick={startGame}
            className="w-full px-8 py-5 bg-white hover:bg-yellow-100 text-indigo-600 font-black rounded-2xl text-2xl shadow-xl transform hover:scale-105 transition-all"
          >
            ▶️ Start Game
          </button>

          <p className="text-white/60 text-sm mt-6">
            {TOTAL_ROUNDS} rounds • Don&apos;t tap too early!
          </p>
        </div>
      )}

      {/* Waiting Screen */}
      {phase === "waiting" && (
        <div className="text-center px-6">
          <div className="text-6xl mb-4">{waitColor.emoji}</div>
          <h2 className="text-4xl font-black text-white mb-4 drop-shadow-lg">
            Wait for Green...
          </h2>
          <p className="text-white/80 text-xl">
            Round {currentRound} of {TOTAL_ROUNDS}
          </p>
          <div className="mt-8">
            <div className="w-24 h-24 mx-auto border-4 border-white/50 rounded-full flex items-center justify-center">
              <span className="text-4xl animate-pulse">🤚</span>
            </div>
          </div>
        </div>
      )}

      {/* Ready Screen (Green) */}
      {phase === "ready" && (
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🟢</div>
          <h2 className="text-5xl font-black text-white mb-4 drop-shadow-lg animate-pulse">
            TAP NOW!
          </h2>
          <p className="text-white/80 text-xl">
            Quick! Quick! Quick!
          </p>
        </div>
      )}

      {/* Clicked Screen */}
      {phase === "clicked" && reactionTime !== null && (
        <div className="text-center px-6">
          <div className="text-7xl mb-2">{getFeedback(reactionTime).emoji}</div>
          <h2 className="text-6xl font-black text-white mb-2 drop-shadow-lg">
            {reactionTime}ms
          </h2>
          <p className={`text-2xl font-bold ${getFeedback(reactionTime).color} drop-shadow mb-6`}>
            {getFeedback(reactionTime).text}
          </p>
          
          {bestTime !== null && reactionTime <= bestTime && (
            <div className="bg-yellow-400/90 rounded-xl px-4 py-2 mb-4 inline-block">
              <p className="text-lg font-bold text-yellow-900">🏆 New Best!</p>
            </div>
          )}

          <button
            onClick={nextRound}
            className="w-full max-w-xs px-8 py-4 bg-white hover:bg-yellow-100 text-indigo-600 font-bold rounded-2xl text-xl shadow-xl"
          >
            {currentRound >= TOTAL_ROUNDS ? "📊 See Results" : "➡️ Next Round"}
          </button>
        </div>
      )}

      {/* False Start Screen */}
      {phase === "falseStart" && (
        <div className="text-center px-6">
          <div className="text-7xl mb-4">❌</div>
          <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
            Too Early!
          </h2>
          <p className="text-white/80 text-xl mb-6">
            Wait for the green screen!
          </p>
          
          <button
            onClick={nextRound}
            className="w-full max-w-xs px-8 py-4 bg-white hover:bg-yellow-100 text-gray-700 font-bold rounded-2xl text-xl shadow-xl"
          >
            {currentRound >= TOTAL_ROUNDS ? "📊 See Results" : "➡️ Try Again"}
          </button>
        </div>
      )}

      {/* Results Screen */}
      {phase === "results" && (
        <div className="text-center px-6 max-w-md w-full">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-4xl font-black text-white mb-6 drop-shadow-lg">
            All Done!
          </h2>

          {/* Round breakdown */}
          <div className="bg-white/20 rounded-2xl p-4 mb-6">
            <p className="text-white/80 text-sm mb-3">Your Times:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {roundResults.map((result, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 rounded-xl ${
                    result.wasFalseStart 
                      ? "bg-gray-500/50" 
                      : result.time === bestTime
                        ? "bg-yellow-400/50"
                        : "bg-white/30"
                  }`}
                >
                  {result.wasFalseStart ? (
                    <span className="text-white font-bold">❌</span>
                  ) : (
                    <span className="text-white font-bold">{result.time}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Average time */}
          {getAverageTime() !== null && (
            <div className="bg-yellow-400 rounded-2xl px-6 py-4 mb-6">
              <p className="text-yellow-900 text-sm font-bold">Average Time</p>
              <p className="text-4xl font-black text-yellow-900">{getAverageTime()}ms</p>
            </div>
          )}

          {/* Best time */}
          {bestTime !== null && (
            <div className="bg-white/20 rounded-2xl px-6 py-3 mb-6">
              <p className="text-white/80 text-sm">🏆 Best Time Ever</p>
              <p className="text-2xl font-black text-yellow-300">{bestTime}ms</p>
            </div>
          )}

          {/* False starts count */}
          {roundResults.filter(r => r.wasFalseStart).length > 0 && (
            <p className="text-white/60 text-sm mb-4">
              ⚠️ {roundResults.filter(r => r.wasFalseStart).length} false start(s)
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full px-8 py-4 bg-white hover:bg-yellow-100 text-indigo-600 font-bold rounded-2xl text-xl shadow-xl"
            >
              🔄 Play Again
            </button>
            <button
              onClick={resetGame}
              className="w-full px-6 py-3 bg-white/30 hover:bg-white/40 text-white font-bold rounded-2xl"
            >
              🏠 Menu
            </button>
          </div>
        </div>
      )}

      {/* Round indicator */}
      {(phase === "waiting" || phase === "ready" || phase === "clicked" || phase === "falseStart") && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
            const result = roundResults[i];
            let bgColor = "bg-white/30";
            if (i < roundResults.length) {
              bgColor = result?.wasFalseStart ? "bg-red-400" : "bg-green-400";
            } else if (i === currentRound - 1) {
              bgColor = "bg-white/60 ring-2 ring-white";
            }
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${bgColor} transition-colors`}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
