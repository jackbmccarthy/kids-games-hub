"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

export default function ClockTimePage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [targetHour, setTargetHour] = useState(3);
  const [targetMinute, setTargetMinute] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");

  const generateTarget = useCallback(() => {
    setTargetHour(Math.floor(Math.random() * 12) + 1);
    setTargetMinute([0, 15, 30, 45][Math.floor(Math.random() * 4)]);
    setHour(12);
    setMinute(0);
    setMessage("");
  }, []);

  const checkAnswer = () => {
    if (hour === targetHour && minute === targetMinute) {
      setScore((s) => s + 10);
      setMessage("✓ Correct!");
      setTimeout(generateTarget, 1000);
    } else {
      setMessage("✗ Try again!");
    }
  };

  const adjustHour = (delta: number) => {
    setHour((h) => ((h + delta - 1 + 12) % 12) + 1);
  };

  const adjustMinute = (delta: number) => {
    setMinute((m) => (m + delta + 60) % 60);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-cyan-300 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">🕐 Clock Time</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-blue-600 mb-4">Set the clock to match the target time!</p>
          <button onClick={() => { setScore(0); generateTarget(); setPhase("playing"); }} className="px-8 py-4 bg-blue-500 text-white font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-blue-700 mb-2">Score: {score}</p>
          <p className="text-2xl text-blue-800 mb-4">Set to: {targetHour}:{targetMinute.toString().padStart(2, "0")}</p>

          {/* Clock face */}
          <div className="relative w-64 h-64 bg-white rounded-full border-8 border-blue-500 mb-4 mx-auto">
            {/* Hour numbers */}
            {[...Array(12)].map((_, i) => (
              <div key={i} className="absolute text-xl font-bold text-blue-700"
                style={{
                  left: `${50 + 42 * Math.sin(((i + 1) * 30 * Math.PI) / 180)}%`,
                  top: `${50 - 42 * Math.cos(((i + 1) * 30 * Math.PI) / 180)}%`,
                  transform: "translate(-50%, -50%)",
                }}>
                {i + 1}
              </div>
            ))}
            {/* Hour hand */}
            <div className="absolute w-2 h-16 bg-blue-700 rounded origin-bottom left-1/2 bottom-1/2 -ml-1"
              style={{ transform: `rotate(${(hour % 12) * 30 + minute * 0.5}deg)` }} />
            {/* Minute hand */}
            <div className="absolute w-1 h-24 bg-blue-500 rounded origin-bottom left-1/2 bottom-1/2 -ml-0.5"
              style={{ transform: `rotate(${minute * 6}deg)` }} />
            {/* Center */}
            <div className="absolute w-4 h-4 bg-blue-800 rounded-full left-1/2 top-1/2 -ml-2 -mt-2" />
          </div>

          <p className="text-blue-600 mb-2">Your time: {hour}:{minute.toString().padStart(2, "0")}</p>

          <div className="flex gap-4 justify-center mb-4">
            <div className="text-center">
              <button onClick={() => adjustHour(1)} className="px-4 py-2 bg-blue-500 text-white rounded">+Hour</button>
              <button onClick={() => adjustHour(-1)} className="px-4 py-2 bg-blue-400 text-white rounded mt-1">-Hour</button>
            </div>
            <div className="text-center">
              <button onClick={() => adjustMinute(15)} className="px-4 py-2 bg-blue-500 text-white rounded">+15min</button>
              <button onClick={() => adjustMinute(-15)} className="px-4 py-2 bg-blue-400 text-white rounded mt-1">-15min</button>
            </div>
          </div>

          <button onClick={checkAnswer} className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl">Check!</button>
          <p className="mt-2 text-xl">{message}</p>

          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
