"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing" | "complete";

interface Square {
  number: number;
  x: number;
  y: number;
  type: "single" | "double";
  tapped: boolean;
}

export default function HopscotchPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [squares, setSquares] = useState<Square[]>([]);
  const [currentSquare, setCurrentSquare] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [mistakes, setMistakes] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const createCourse = useCallback(() => {
    const newSquares: Square[] = [];
    let y = 350;
    let num = 1;

    while (num <= 10) {
      if (num === 1 || num === 10) {
        newSquares.push({ number: num, x: 175, y, type: "single", tapped: false });
        y -= 60;
        num++;
      } else if (num === 2 || num === 6) {
        // Double squares
        newSquares.push({ number: num, x: 120, y, type: "double", tapped: false });
        newSquares.push({ number: num, x: 230, y, type: "double", tapped: false });
        y -= 60;
        num++;
      } else {
        newSquares.push({ number: num, x: 175, y, type: "single", tapped: false });
        y -= 60;
        num++;
      }
    }

    setSquares(newSquares);
    setCurrentSquare(1);
  }, []);

  const startGame = () => {
    createCourse();
    setScore(0);
    setTimer(30);
    setMistakes(0);
    setPhase("playing");
  };

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setPhase("complete");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase]);

  const tapSquare = (square: Square) => {
    if (square.number !== currentSquare) {
      setMistakes((m) => m + 1);
      return;
    }

    setSquares((prev) =>
      prev.map((s) =>
        s.number === square.number ? { ...s, tapped: true } : s
      )
    );

    setScore((s) => s + 10);

    if (square.number === 10) {
      setPhase("complete");
    } else {
      setCurrentSquare((n) => n + 1);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("hopscotch-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("hopscotch-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 to-rose-300 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-rose-700 mb-4">🏃 Hopscotch</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-rose-600 mb-2">Tap squares in order 1-10!</p>
          <p className="text-rose-500 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-rose-500 text-white font-bold rounded-xl text-xl"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-rose-700 mb-2">
            Time: {timer}s | Score: {score} | Next: {currentSquare}
          </p>

          <div className="relative w-[350px] h-[420px] bg-rose-100 rounded-2xl border-4 border-rose-300">
            {squares.map((square, i) => (
              <button
                key={i}
                onClick={() => tapSquare(square)}
                disabled={square.tapped}
                className={`absolute w-12 h-12 rounded-lg font-bold text-xl transition-all ${
                  square.tapped
                    ? "bg-green-400 text-white"
                    : square.number === currentSquare
                    ? "bg-yellow-400 text-rose-700 animate-pulse"
                    : "bg-white text-rose-600 hover:bg-rose-50"
                }`}
                style={{
                  left: square.x,
                  top: square.y,
                  boxShadow: "2px 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {square.number}
              </button>
            ))}

            {/* Chalk lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg className="w-full h-full">
                <line x1="0" y1="70" x2="350" y2="70" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="0" y1="130" x2="350" y2="130" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="0" y1="190" x2="350" y2="190" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="0" y1="250" x2="350" y2="250" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="0" y1="310" x2="350" y2="310" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
              </svg>
            </div>
          </div>

          <p className="mt-4 text-rose-500 text-sm">Mistakes: {mistakes}</p>

          <button
            onClick={() => setPhase("menu")}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      )}

      {phase === "complete" && (
        <div className="text-center">
          <p className="text-2xl text-rose-700 mb-2">
            {currentSquare > 10 ? "Course Complete!" : "Time's Up!"}
          </p>
          <p className="text-xl text-rose-600 mb-2">Score: {score}</p>
          <p className="text-rose-500 mb-4">Mistakes: {mistakes}</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-rose-500 text-white font-bold rounded-xl text-xl"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
