"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing" | "gameOver";

interface Balloon {
  id: number;
  x: number;
  y: number;
  number: number;
  speed: number;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

export default function BalloonPopMathPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [equation, setEquation] = useState({ a: 1, b: 2, op: "+", answer: 3 });

  const balloonsRef = useRef<Balloon[]>([]);
  const animationRef = useRef<number>(0);

  const generateEquation = useCallback(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const ops = ["+", "-"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const answer = op === "+" ? a + b : a - b;
    setEquation({ a, b, op, answer });
  }, []);

  const spawnBalloon = useCallback(() => {
    const correctAnswer = equation.answer;
    const numbers = [correctAnswer];
    while (numbers.length < 4) {
      const n = Math.floor(Math.random() * 20) - 5;
      if (!numbers.includes(n)) numbers.push(n);
    }
    numbers.sort(() => Math.random() - 0.5);

    numbers.forEach((num, i) => {
      const balloon: Balloon = {
        id: Date.now() + i,
        x: 50 + i * 90,
        y: GAME_HEIGHT + 50,
        number: num,
        speed: 1 + Math.random(),
      };
      balloonsRef.current.push(balloon);
    });
  }, [equation]);

  const popBalloon = (id: number) => {
    const balloon = balloonsRef.current.find((b) => b.id === id);
    if (!balloon) return;

    if (balloon.number === equation.answer) {
      setScore((s) => s + 10);
      balloonsRef.current = [];
      generateEquation();
      setTimeout(spawnBalloon, 500);
    } else {
      setLives((l) => l - 1);
      if (lives <= 1) setPhase("gameOver");
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Equation
    ctx.fillStyle = "#333";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${equation.a} ${equation.op} ${equation.b} = ?`, GAME_WIDTH / 2, 50);

    // Lives
    ctx.textAlign = "left";
    ctx.fillText("❤️".repeat(lives), 10, 30);

    // Score
    ctx.textAlign = "right";
    ctx.fillText(`${score}`, GAME_WIDTH - 10, 30);

    // Balloons
    balloonsRef.current.forEach((b) => {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 35, 45, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${(b.number * 30) % 360}, 70%, 60%)`;
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#FFF";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${b.number}`, b.x, b.y + 8);
    });
  }, [equation, lives, score]);

  const update = useCallback(() => {
    balloonsRef.current.forEach((b) => {
      b.y -= b.speed;
    });
    balloonsRef.current = balloonsRef.current.filter((b) => b.y > -50);
  }, []);

  const gameLoop = useCallback(() => {
    if (phase === "playing") {
      update();
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [phase, update, draw]);

  useEffect(() => {
    if (phase === "playing") {
      balloonsRef.current = [];
      setLives(3);
      generateEquation();
      setTimeout(spawnBalloon, 500);
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, generateEquation, spawnBalloon, gameLoop]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    balloonsRef.current.forEach((b) => {
      if (Math.hypot(x - b.x, y - b.y) < 40) {
        popBalloon(b.id);
      }
    });
  };

  return (
    <div className="min-h-screen bg-sky-200 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">🎈 Balloon Pop Math</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-blue-700 mb-4">Pop the balloon with the correct answer!</p>
          <p className="text-blue-500 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={() => { setScore(0); setPhase("playing"); }} className="px-8 py-4 bg-blue-500 text-white font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} onClick={handleClick} className="rounded-2xl shadow-xl cursor-pointer" />
      )}

      {phase === "gameOver" && (
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-2">Game Over!</p>
          <p className="text-xl text-blue-600 mb-4">Score: {score}</p>
          <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-blue-500 text-white font-bold rounded-xl">Play Again</button>
        </div>
      )}
    </div>
  );
}
