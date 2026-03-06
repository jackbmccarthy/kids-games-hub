"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Balloon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  wobble: number;
}

type GamePhase = "menu" | "playing" | "gameOver";

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#F472B6"];

export default function BalloonKeepyUpPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [keepUpTime, setKeepUpTime] = useState(0);

  const balloonsRef = useRef<Balloon[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const createBalloon = useCallback((canvasWidth: number) => {
    const balloon: Balloon = {
      id: Date.now() + Math.random(),
      x: 50 + Math.random() * (canvasWidth - 100),
      y: canvasHeight - 100,
      vx: (Math.random() - 0.5) * 2,
      vy: -1.5 - Math.random(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 30 + Math.random() * 20,
      wobble: Math.random() * Math.PI * 2,
    };
    balloonsRef.current.push(balloon);
  }, []);

  let canvasHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F7FA");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 200 + timestamp / 50) % (canvas.width + 100)) - 50;
      const y = 50 + i * 40;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spawn balloon if needed
    if (balloonsRef.current.length === 0) {
      createBalloon(canvas.width);
    }

    // Update and draw balloons
    balloonsRef.current = balloonsRef.current.filter(balloon => {
      balloon.wobble += 0.05;
      balloon.x += balloon.vx + Math.sin(balloon.wobble) * 0.5;
      balloon.vy += 0.02; // Gravity
      balloon.y += balloon.vy;

      // Bounce off walls
      if (balloon.x < balloon.size || balloon.x > canvas.width - balloon.size) {
        balloon.vx *= -1;
      }

      // Draw balloon
      ctx.save();
      ctx.translate(balloon.x, balloon.y);

      // String
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, balloon.size);
      ctx.quadraticCurveTo(Math.sin(balloon.wobble) * 10, balloon.size + 30, 0, balloon.size + 50);
      ctx.stroke();

      // Balloon body
      ctx.fillStyle = balloon.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, balloon.size * 0.8, balloon.size, 0, 0, Math.PI * 2);
      ctx.fill();

      // Knot
      ctx.beginPath();
      ctx.moveTo(-5, balloon.size);
      ctx.lineTo(0, balloon.size + 8);
      ctx.lineTo(5, balloon.size);
      ctx.fill();

      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.ellipse(-balloon.size * 0.3, -balloon.size * 0.3, balloon.size * 0.25, balloon.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Check if hit ground
      if (balloon.y > canvas.height - 50) {
        return false;
      }

      return true;
    });

    // Update time
    setKeepUpTime(Math.floor((timestamp - startTimeRef.current) / 1000));

    // Game over check
    if (balloonsRef.current.length === 0) {
      const finalScore = Math.floor((timestamp - startTimeRef.current) / 100);
      setScore(finalScore);
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("balloon-high-score", String(finalScore));
      }
      setPhase("gameOver");
      return;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, highScore, createBalloon]);

  const handleBounce = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || phase !== "playing") return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    balloonsRef.current.forEach(balloon => {
      const dist = Math.sqrt((balloon.x - x) ** 2 + (balloon.y - y) ** 2);
      if (dist < balloon.size + 30) {
        balloon.vy = -4 - Math.random() * 2;
        balloon.vx = (balloon.x - x) * 0.1;
        setScore(s => s + 1);
      }
    });
  }, [phase]);

  const startGame = useCallback(() => {
    balloonsRef.current = [];
    setScore(0);
    setKeepUpTime(0);
    startTimeRef.current = performance.now();
    setPhase("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("balloon-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onClick={(e) => handleBounce(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleBounce(touch.clientX, touch.clientY);
        }}
      />

      {phase === "playing" && (
        <div className="absolute top-4 left-4 bg-white/80 rounded-xl px-4 py-2 shadow-lg">
          <p className="font-bold text-gray-700">🎈 {keepUpTime}s</p>
        </div>
      )}

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-[#F472B6] mb-2">🎈 Balloon Keepy-Up</h1>
            <p className="text-gray-600 mb-4">Tap balloons to keep them in the air!</p>
            {highScore > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">🏆 Best: {highScore}s</p>
            )}
            <button
              onClick={startGame}
              className="w-full px-6 py-4 bg-[#F472B6] hover:bg-[#EC4899] text-white font-bold rounded-xl text-xl"
            >
              ▶️ Play
            </button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-[#F472B6] mb-2">🎈 Dropped!</h2>
            <p className="text-2xl font-bold text-gray-700 my-4">{score} seconds!</p>
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">🏆 New Best!</p>
            )}
            <div className="space-y-2">
              <button onClick={startGame} className="w-full px-6 py-3 bg-[#F472B6] text-white font-bold rounded-xl">Play Again</button>
              <button onClick={() => setPhase("menu")} className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl">Menu</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
