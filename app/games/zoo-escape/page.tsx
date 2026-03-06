"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing" | "escaped";

const MAZE_SIZE = 11;
const CELL_SIZE = 30;

export default function ZooEscapePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [score, setScore] = useState(0);
  const [maze, setMaze] = useState<number[][]>([]);

  const generateMaze = useCallback(() => {
    const newMaze: number[][] = Array(MAZE_SIZE).fill(null).map(() => Array(MAZE_SIZE).fill(1));
    
    const carve = (x: number, y: number) => {
      newMaze[y][x] = 0;
      const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (ny > 0 && ny < MAZE_SIZE - 1 && nx > 0 && nx < MAZE_SIZE - 1 && newMaze[ny][nx] === 1) {
          newMaze[y + dy / 2][x + dx / 2] = 0;
          carve(nx, ny);
        }
      }
    };
    carve(1, 1);
    newMaze[MAZE_SIZE - 2][MAZE_SIZE - 2] = 2; // Exit
    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, 0, MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE);

    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillStyle = "#654321";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell === 2) {
          ctx.fillStyle = "#FFD700";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.fillStyle = "#FFF";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.fillText("🚪", x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 6);
        }
      });
    });

    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🦁", playerPos.x * CELL_SIZE + CELL_SIZE / 2, playerPos.y * CELL_SIZE + CELL_SIZE / 2 + 8);
  }, [maze, playerPos]);

  const move = useCallback((dx: number, dy: number) => {
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    if (maze[newY]?.[newX] !== 1) {
      setPlayerPos({ x: newX, y: newY });
      if (maze[newY][newX] === 2) {
        setScore((s) => s + 100);
        setPhase("escaped");
      }
    }
  }, [playerPos, maze]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      if (e.key === "ArrowUp") move(0, -1);
      if (e.key === "ArrowDown") move(0, 1);
      if (e.key === "ArrowLeft") move(-1, 0);
      if (e.key === "ArrowRight") move(1, 0);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, move]);

  useEffect(() => {
    if (phase === "playing") draw();
  }, [phase, draw]);

  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🦁 Zoo Escape</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-green-200 mb-4">Find the exit to escape the zoo!</p>
          <button onClick={() => { generateMaze(); setPhase("playing"); }} className="px-8 py-4 bg-yellow-500 text-green-900 font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>
          <canvas ref={canvasRef} width={MAZE_SIZE * CELL_SIZE} height={MAZE_SIZE * CELL_SIZE} className="rounded-xl" />
          <p className="text-green-200 mt-2 text-sm">Use arrow keys to move</p>
          <div className="flex gap-2 mt-4 justify-center">
            <button onClick={() => move(0, -1)} className="p-4 bg-green-600 text-white rounded-lg">↑</button>
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={() => move(-1, 0)} className="p-4 bg-green-600 text-white rounded-lg">←</button>
            <button onClick={() => move(0, 1)} className="p-4 bg-green-600 text-white rounded-lg">↓</button>
            <button onClick={() => move(1, 0)} className="p-4 bg-green-600 text-white rounded-lg">→</button>
          </div>
        </div>
      )}

      {phase === "escaped" && (
        <div className="text-center">
          <p className="text-2xl text-yellow-300 mb-4">🎉 Escaped! Score: {score}</p>
          <button onClick={() => { generateMaze(); setPhase("playing"); }} className="px-8 py-4 bg-yellow-500 text-green-900 font-bold rounded-xl">Play Again</button>
        </div>
      )}
    </div>
  );
}
