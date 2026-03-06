"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Lock {
  progress: number;
  targetAngle: number;
  currentAngle: number;
  speed: number;
  completed: boolean;
}

const GAME_SIZE = 400;
const LOCK_RADIUS = 150;
const TARGET_SIZE = 20;
const HIT_TOLERANCE = 15;

export default function PopTheLockPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);

  const lockRef = useRef<Lock>({
    progress: 0,
    targetAngle: Math.random() * 360,
    currentAngle: 0,
    speed: 2,
    completed: false,
  });
  const animationRef = useRef<number>(0);

  const initGame = useCallback(() => {
    lockRef.current = {
      progress: 0,
      targetAngle: Math.random() * 360,
      currentAngle: 0,
      speed: 2 + level * 0.5,
      completed: false,
    };
    setScore(0);
    setCombo(0);
  }, [level]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lock = lockRef.current;
    const centerX = GAME_SIZE / 2;
    const centerY = GAME_SIZE / 2;

    // Clear
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, GAME_SIZE, GAME_SIZE);

    // Draw lock circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, LOCK_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = "#4a4a6a";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw progress arc
    const progressAngle = (lock.progress / 100) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, LOCK_RADIUS, -Math.PI / 2, progressAngle);
    ctx.strokeStyle = "#4ECDC4";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw target
    const targetRad = (lock.targetAngle * Math.PI) / 180;
    const targetX = centerX + Math.cos(targetRad) * LOCK_RADIUS;
    const targetY = centerY + Math.sin(targetRad) * LOCK_RADIUS;
    
    ctx.beginPath();
    ctx.arc(targetX, targetY, TARGET_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = "#FFE66D";
    ctx.fill();
    ctx.strokeStyle = "#FFD93D";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw indicator
    const indicatorRad = (lock.currentAngle * Math.PI) / 180;
    const indicatorX = centerX + Math.cos(indicatorRad) * LOCK_RADIUS;
    const indicatorY = centerY + Math.sin(indicatorRad) * LOCK_RADIUS;
    
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, TARGET_SIZE - 5, 0, Math.PI * 2);
    ctx.fillStyle = "#FF6B6B";
    ctx.fill();

    // Draw center lock icon
    ctx.fillStyle = "#6a6a8a";
    ctx.fillRect(centerX - 30, centerY - 10, 60, 50);
    ctx.beginPath();
    ctx.arc(centerX, centerY - 20, 25, Math.PI, 0);
    ctx.strokeStyle = "#6a6a8a";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw keyhole
    ctx.beginPath();
    ctx.arc(centerX, centerY + 5, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.fillRect(centerX - 4, centerY + 5, 8, 20);

    // Draw score and combo
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Score: ${score}`, centerX, 40);
    
    if (combo > 1) {
      ctx.fillStyle = "#FFE66D";
      ctx.fillText(`${combo}x Combo!`, centerX, 70);
    }

    // Draw level
    ctx.fillStyle = "#4ECDC4";
    ctx.font = "18px Arial";
    ctx.fillText(`Level ${level}`, centerX, GAME_SIZE - 20);
  }, [score, combo, level]);

  const update = useCallback(() => {
    const lock = lockRef.current;
    lock.currentAngle += lock.speed;
    if (lock.currentAngle >= 360) {
      lock.currentAngle -= 360;
    }
  }, []);

  const checkHit = useCallback(() => {
    const lock = lockRef.current;
    const diff = Math.abs(lock.currentAngle - lock.targetAngle);
    const normalizedDiff = Math.min(diff, 360 - diff);

    if (normalizedDiff < HIT_TOLERANCE) {
      // Hit!
      lock.progress += 20;
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(prev => prev + 10 * newCombo);

      if (lock.progress >= 100) {
        // Level complete!
        setLevel(prev => prev + 1);
        lock.progress = 0;
        lock.speed += 0.5;
      }

      // New target
      lock.targetAngle = Math.random() * 360;
      return true;
    } else {
      // Miss - reset progress
      lock.progress = Math.max(0, lock.progress - 10);
      setCombo(0);
      return false;
    }
  }, [combo]);

  const handleClick = useCallback(() => {
    if (phase === "playing") {
      const success = checkHit();
      // Could add visual feedback for success/fail
    }
  }, [phase, checkHit]);

  const gameLoop = useCallback(() => {
    if (phase === "playing") {
      update();
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [phase, update, draw]);

  useEffect(() => {
    if (phase === "playing") {
      initGame();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, initGame, gameLoop]);

  useEffect(() => {
    const saved = localStorage.getItem("pop-lock-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("pop-lock-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🔓 Pop the Lock</h1>
      
      {phase === "menu" && (
        <div className="text-center">
          <p className="text-gray-300 mb-2">Tap when the red indicator aligns with the yellow target!</p>
          <p className="text-gray-400 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={() => setPhase("playing")}
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-xl transition-all transform hover:scale-105"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <canvas
          ref={canvasRef}
          width={GAME_SIZE}
          height={GAME_SIZE}
          onClick={handleClick}
          className="cursor-pointer rounded-2xl shadow-2xl"
        />
      )}

      {phase === "gameOver" && (
        <div className="text-center">
          <p className="text-2xl text-white mb-2">Game Over!</p>
          <p className="text-xl text-yellow-400 mb-4">Score: {score}</p>
          <button
            onClick={() => setPhase("playing")}
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-xl transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      {phase === "playing" && (
        <button
          onClick={() => setPhase("menu")}
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Back to Menu
        </button>
      )}
    </div>
  );
}
