"use client";

import { useState, useCallback, useRef } from "react";

type Phase = "menu" | "playing";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function AlphabetTracePage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [currentLetter, setCurrentLetter] = useState("A");
  const [isDrawing, setIsDrawing] = useState(false);
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 300, 300);
    ctx.font = "bold 200px Arial";
    ctx.fillStyle = "#eee";
    ctx.textAlign = "center";
    ctx.fillText(currentLetter, 150, 220);
  };

  const handleMouseDown = () => setIsDrawing(true);
  const handleMouseUp = () => setIsDrawing(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.fillStyle = "#4ECDC4";
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  };

  const nextLetter = () => {
    const next = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
    if (next > "Z") {
      setCurrentLetter("A");
    } else {
      setCurrentLetter(next);
    }
    setScore(s => s + 10);
    startDrawing();
  };

  const clearCanvas = () => startDrawing();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-300 to-purple-400 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">✍️ Alphabet Trace</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-pink-100 mb-4">Trace letters to practice writing!</p>
          <button onClick={() => { setScore(0); setCurrentLetter("A"); setPhase("playing"); setTimeout(startDrawing, 100); }} className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Letter: {currentLetter} | Score: {score}</p>
          <canvas ref={canvasRef} width={300} height={300} className="rounded-2xl bg-white shadow-xl cursor-crosshair"
            onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} />
          <div className="flex gap-4 mt-4 justify-center">
            <button onClick={clearCanvas} className="px-6 py-3 bg-pink-500 text-white font-bold rounded-xl">Clear</button>
            <button onClick={nextLetter} className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl">Next →</button>
          </div>
          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
