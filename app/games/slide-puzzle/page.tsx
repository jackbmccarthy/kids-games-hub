"use client";

import { useState, useCallback, useEffect } from "react";

type Phase = "menu" | "playing" | "complete";

const GRID_SIZE = 3;

export default function SlidePuzzlePage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [tiles, setTiles] = useState<number[]>([]);
  const [emptyIndex, setEmptyIndex] = useState(8);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState(999);

  const initPuzzle = useCallback(() => {
    // Create solvable puzzle
    let newTiles: number[];
    do {
      newTiles = [...Array(GRID_SIZE * GRID_SIZE - 1).keys()].map((i) => i + 1);
      newTiles.push(0);
      // Shuffle
      for (let i = newTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
      }
    } while (!isSolvable(newTiles));
    
    setTiles(newTiles);
    setEmptyIndex(newTiles.indexOf(0));
    setMoves(0);
  }, []);

  const isSolvable = (arr: number[]): boolean => {
    let inversions = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] && arr[j] && arr[i] > arr[j]) inversions++;
      }
    }
    return inversions % 2 === 0;
  };

  const isComplete = (arr: number[]): boolean => {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return true;
  };

  const canMove = (index: number): boolean => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;
    
    return (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    );
  };

  const moveTile = (index: number) => {
    if (!canMove(index)) return;

    const newTiles = [...tiles];
    [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
    setTiles(newTiles);
    setEmptyIndex(index);
    setMoves((m) => m + 1);

    if (isComplete(newTiles)) {
      setPhase("complete");
    }
  };

  const startGame = () => {
    initPuzzle();
    setPhase("playing");
  };

  useEffect(() => {
    const saved = localStorage.getItem("slide-puzzle-best");
    if (saved) setBestMoves(parseInt(saved));
  }, []);

  useEffect(() => {
    if (phase === "complete" && moves < bestMoves) {
      setBestMoves(moves);
      localStorage.setItem("slide-puzzle-best", moves.toString());
    }
  }, [phase, moves, bestMoves]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🧩 Slide Puzzle</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-indigo-200 mb-2">Arrange numbers 1-8 in order!</p>
          <p className="text-purple-200 mb-4 text-sm">Best: {bestMoves === 999 ? "-" : `${bestMoves} moves`}</p>
          <button onClick={startGame} className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl text-xl">
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-4">Moves: {moves}</p>

          <div className="grid grid-cols-3 gap-2 bg-indigo-900 p-3 rounded-xl">
            {tiles.map((tile, index) => (
              <button
                key={index}
                onClick={() => moveTile(index)}
                disabled={tile === 0 || !canMove(index)}
                className={`w-20 h-20 text-3xl font-bold rounded-lg transition-all ${
                  tile === 0
                    ? "bg-indigo-800"
                    : canMove(index)
                    ? "bg-white text-indigo-600 hover:scale-105"
                    : "bg-indigo-300 text-indigo-600"
                }`}
              >
                {tile || ""}
              </button>
            ))}
          </div>

          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-indigo-700 text-white rounded-lg">
            Back to Menu
          </button>
        </div>
      )}

      {phase === "complete" && (
        <div className="text-center">
          <p className="text-4xl mb-4">🎉</p>
          <p className="text-2xl text-white mb-2">Puzzle Solved!</p>
          <p className="text-indigo-200 mb-4">Completed in {moves} moves</p>
          <button onClick={startGame} className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl text-xl">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
