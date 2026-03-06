"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "complete";

const PICTURES = [
  { name: "Star", points: [50, 30, 80, 30, 20, 90, 80, 90, 50, 40], count: 5 },
  { name: "Heart", points: [50, 20, 80, 50, 50, 100, 20, 50, 50, 20], count: 5 },
  { name: "House", points: [20, 80, 50, 20, 80, 80, 20, 80, 80, 80, 80, 40, 60, 40], count: 7 },
  { name: "Cat", points: [30, 40, 30, 20, 70, 20, 70, 40, 50, 80, 20, 60, 80, 60], count: 7 },
];

export default function ConnectTheDotsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [currentDot, setCurrentDot] = useState(1);
  const [currentPic, setCurrentPic] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const dotsRef = useRef<{ x: number; y: number }[]>([]);
  const linesRef = useRef<{ from: number; to: number }[]>([]);

  const generateDots = useCallback(() => {
    const pic = PICTURES[currentPic];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < pic.points.length; i += 2) {
      points.push({
        x: (pic.points[i] / 100) * canvas.width * 0.6 + canvas.width * 0.2,
        y: (pic.points[i + 1] / 100) * canvas.height * 0.6 + canvas.height * 0.15,
      });
    }
    dotsRef.current = points;
    linesRef.current = [];
    setCurrentDot(1);
  }, [currentPic]);

  const handleDotClick = useCallback((index: number) => {
    if (index !== currentDot - 1) return;
    if (index > 0) {
      linesRef.current.push({ from: index - 1, to: index });
    }
    
    if (index >= dotsRef.current.length - 1) {
      setCompleted(c => [...c, currentPic]);
      setPhase("complete");
    } else {
      setCurrentDot(d => d + 1);
    }
  }, [currentDot, currentPic]);

  useEffect(() => {
    if (phase === "playing") {
      generateDots();
    }
  }, [phase, generateDots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.min(500, window.innerWidth - 40);
    canvas.height = 400;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = "#FFF8E1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    linesRef.current.forEach(line => {
      const from = dotsRef.current[line.from];
      const to = dotsRef.current[line.to];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });

    // Draw dots
    dotsRef.current.forEach((dot, i) => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = i < currentDot ? "#4CAF50" : "#2196F3";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Number
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), dot.x, dot.y);
    });

    // Draw hint line to next dot
    if (currentDot <= dotsRef.current.length && dotsRef.current[currentDot - 1]) {
      const last = dotsRef.current[currentDot - 1];
      const next = dotsRef.current[currentDot];
      if (next) {
        ctx.strokeStyle = "rgba(100,100,100,0.3)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [currentDot, phase, linesRef.current.length]);

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      {phase === "playing" && (
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-amber-700">Connect: {PICTURES[currentPic].name}</h2>
          <p className="text-gray-600">Tap dot {currentDot} of {dotsRef.current.length}</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="bg-white rounded-2xl shadow-xl cursor-pointer"
        onClick={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          dotsRef.current.forEach((dot, i) => {
            const dist = Math.sqrt((dot.x - x) ** 2 + (dot.y - y) ** 2);
            if (dist < 25) {
              handleDotClick(i);
            }
          });
        }}
      />

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-50">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-amber-600 mb-2">🔢 Connect the Dots</h1>
            <p className="text-gray-600 mb-6">Tap the numbers in order!</p>
            <div className="grid grid-cols-2 gap-3">
              {PICTURES.map((pic, i) => (
                <button
                  key={pic.name}
                  onClick={() => { setCurrentPic(i); setPhase("playing"); }}
                  className={`px-4 py-3 rounded-xl font-bold ${completed.includes(i) ? "bg-green-400 text-white" : "bg-amber-400 text-white hover:bg-amber-500"}`}
                >
                  {pic.name} {completed.includes(i) && "✓"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-green-500 mb-2">🎉 Complete!</h2>
            <p className="text-xl text-gray-700 mb-4">You drew a {PICTURES[currentPic].name}!</p>
            <div className="space-y-2">
              {currentPic < PICTURES.length - 1 ? (
                <button
                  onClick={() => { setCurrentPic(c => c + 1); setPhase("playing"); }}
                  className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl"
                >
                  Next Picture →
                </button>
              ) : (
                <button
                  onClick={() => { setCurrentPic(0); setPhase("playing"); }}
                  className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl"
                >
                  🔄 Play Again
                </button>
              )}
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl"
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
