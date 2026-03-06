"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Note {
  id: number;
  x: number;
  y: number;
  note: string;
  color: string;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const KEY_WIDTH = 50;
const KEY_HEIGHT = 100;

const KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const KEY_COLORS = ["#FF6B6B", "#FF9F43", "#FFE66D", "#4ECDC4", "#45B7D1", "#96CEB4", "#9B59B6"];

export default function PianoTilesDropPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);

  const notesRef = useRef<Note[]>([]);
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  const spawnNote = useCallback(() => {
    const keyIndex = Math.floor(Math.random() * KEYS.length);
    const note: Note = {
      id: Date.now() + Math.random(),
      x: keyIndex * KEY_WIDTH + KEY_WIDTH / 2,
      y: -50,
      note: KEYS[keyIndex],
      color: KEY_COLORS[keyIndex],
    };
    notesRef.current.push(note);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background - music sheet
    ctx.fillStyle = "#FFF8DC";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Staff lines
    ctx.strokeStyle = "#DDD";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 100 + i * 20);
      ctx.lineTo(GAME_WIDTH, 100 + i * 20);
      ctx.stroke();
    }

    // Draw notes
    notesRef.current.forEach((note) => {
      ctx.beginPath();
      ctx.arc(note.x, note.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = note.color;
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Note letter
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(note.note, note.x, note.y + 6);
    });

    // Draw piano keys
    KEYS.forEach((key, i) => {
      const x = i * KEY_WIDTH;
      ctx.fillStyle = KEY_COLORS[i];
      ctx.fillRect(x, GAME_HEIGHT - KEY_HEIGHT, KEY_WIDTH - 2, KEY_HEIGHT);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, GAME_HEIGHT - KEY_HEIGHT, KEY_WIDTH - 2, KEY_HEIGHT);
      
      ctx.fillStyle = "#333";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(key, x + KEY_WIDTH / 2, GAME_HEIGHT - 20);
    });

    // UI
    ctx.fillStyle = "#333";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Combo: ${combo}x`, 10, 55);
    
    // Lives
    ctx.fillText("❤️".repeat(lives), GAME_WIDTH - 100, 30);
  }, [score, combo, lives]);

  const update = useCallback(() => {
    const notes = notesRef.current;

    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      note.y += 3;

      // Remove if past keyboard
      if (note.y > GAME_HEIGHT) {
        notes.splice(i, 1);
        setLives((l) => l - 1);
        setCombo(0);
      }
    }

    if (lives <= 0) {
      setPhase("gameOver");
      return;
    }

    const now = Date.now();
    if (now - lastSpawnRef.current > 1500) {
      spawnNote();
      lastSpawnRef.current = now;
    }
  }, [lives, spawnNote]);

  const gameLoop = useCallback(() => {
    if (phase === "playing") {
      update();
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [phase, update, draw]);

  useEffect(() => {
    if (phase === "playing") {
      notesRef.current = [];
      lastSpawnRef.current = Date.now();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  useEffect(() => {
    const saved = localStorage.getItem("piano-tiles-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("piano-tiles-high", score.toString());
    }
  }, [score, highScore]);

  const handleKeyClick = useCallback((keyIndex: number) => {
    const keyX = keyIndex * KEY_WIDTH + KEY_WIDTH / 2;
    const notes = notesRef.current;
    
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      if (Math.abs(note.x - keyX) < KEY_WIDTH / 2 && note.y > GAME_HEIGHT - KEY_HEIGHT - 50) {
        notes.splice(i, 1);
        setScore((s) => s + 10 * (combo + 1));
        setCombo((c) => c + 1);
        return;
      }
    }
  }, [combo]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const keyIndex = Math.floor(x / KEY_WIDTH);
    handleKeyClick(keyIndex);
  }, [handleKeyClick]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-pink-200 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-purple-800 mb-4">🎹 Piano Tiles Drop</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-purple-700 mb-2">Tap the keys when notes reach them!</p>
          <p className="text-purple-600 mb-4 text-sm">High Score: {highScore}</p>
          <button
            onClick={() => {
              setScore(0);
              setCombo(0);
              setLives(3);
              setPhase("playing");
            }}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xl transition-all"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onClick={handleClick}
          className="rounded-2xl shadow-2xl cursor-pointer"
        />
      )}

      {phase === "gameOver" && (
        <div className="text-center">
          <p className="text-2xl text-purple-800 mb-2">Game Over!</p>
          <p className="text-xl text-purple-600 mb-4">Score: {score}</p>
          <button
            onClick={() => {
              setScore(0);
              setCombo(0);
              setLives(3);
              setPhase("playing");
            }}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xl transition-all"
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
