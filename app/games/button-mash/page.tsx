"use client";

import { useState, useEffect, useCallback } from "react";

type Phase = "menu" | "playing" | "gameOver";

const BUTTONS = ["red", "blue", "green", "yellow"];
const BUTTON_COLORS: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
};

export default function ButtonMashPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [showingSequence, setShowingSequence] = useState(true);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const addToSequence = useCallback(() => {
    const newButton = BUTTONS[Math.floor(Math.random() * BUTTONS.length)];
    setSequence((s) => [...s, newButton]);
  }, []);

  const playSequence = useCallback(async () => {
    setShowingSequence(true);
    setPlayerSequence([]);
    
    for (const button of sequence) {
      await new Promise((r) => setTimeout(r, 500));
      setActiveButton(button);
      await new Promise((r) => setTimeout(r, 400));
      setActiveButton(null);
    }
    
    setShowingSequence(false);
  }, [sequence]);

  useEffect(() => {
    if (phase === "playing" && sequence.length > 0) {
      playSequence();
    }
  }, [phase, sequence.length, playSequence]);

  const startGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setPhase("playing");
    setTimeout(() => addToSequence(), 500);
  };

  const handleButtonClick = (color: string) => {
    if (showingSequence) return;

    setActiveButton(color);
    setTimeout(() => setActiveButton(null), 200);

    const newPlayerSeq = [...playerSequence, color];
    setPlayerSequence(newPlayerSeq);

    const currentIndex = newPlayerSeq.length - 1;
    if (newPlayerSeq[currentIndex] !== sequence[currentIndex]) {
      setPhase("gameOver");
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      setScore(sequence.length);
      setTimeout(() => addToSequence(), 500);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("button-mash-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("button-mash-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🔘 Button Mash</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-gray-300 mb-2">Watch and repeat the sequence!</p>
          <p className="text-gray-400 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xl transition-all"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">
            {showingSequence ? "Watch the sequence..." : "Your turn!"}
          </p>
          <p className="text-gray-400 mb-4">Score: {sequence.length}</p>

          <div className="grid grid-cols-2 gap-4">
            {BUTTONS.map((color) => (
              <button
                key={color}
                onClick={() => handleButtonClick(color)}
                disabled={showingSequence}
                className={`w-24 h-24 rounded-xl transition-all transform ${
                  BUTTON_COLORS[color]
                } ${activeButton === color ? "scale-110 brightness-150" : ""} ${
                  !showingSequence ? "hover:brightness-110" : ""
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="text-center">
          <p className="text-2xl text-red-400 mb-2">Game Over!</p>
          <p className="text-xl text-white mb-4">Score: {score}</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xl transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      {phase === "playing" && (
        <button
          onClick={() => setPhase("menu")}
          className="mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Back to Menu
        </button>
      )}
    </div>
  );
}
