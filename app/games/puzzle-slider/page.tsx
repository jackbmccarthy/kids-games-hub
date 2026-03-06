"use client";

import { useState, useCallback, useEffect } from "react";

type Phase = "menu" | "playing" | "complete";

const GRID_SIZE = 3;

export default function PuzzleSliderPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [tiles, setTiles] = useState<number[]>([]);
  const [emptyIndex, setEmptyIndex] = useState(8);
  const [moves, setMoves] = useState(0);

  const initPuzzle = useCallback(() => {
    let newTiles = [...Array(GRID_SIZE * GRID_SIZE - 1).keys()].map((i) => i + 1);
    newTiles.push(0);
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }
    setTiles(newTiles);
    setEmptyIndex(newTiles.indexOf(0));
    setMoves(0);
  }, []);

  const canMove = (index: number): boolean => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;
    return (Math.abs(row - emptyRow) === 1 && col === emptyCol) || (Math.abs(col - emptyCol) === 1 && row === emptyRow);
  };

  const moveTile = (index: number) => {
    if (!canMove(index)) return;
    const newTiles = [...tiles];
    [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
    setTiles(newTiles);
    setEmptyIndex(index);
    setMoves((m) => m + 1);
    if (newTiles.every((t, i) => t === (i === 8 ? 0 : i + 1))) setPhase("complete");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500 to-indigo-600 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🧩 Puzzle Slider</h1>
      {phase === "menu" && (
        <div className="text-center">
          <p className="text-purple-200 mb-4">Arrange tiles 1-8!</p>
          <button onClick={() => { initPuzzle(); setPhase("playing"); }} className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}
      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-4">Moves: {moves}</p>
          <div className="grid grid-cols-3 gap-2 bg-purple-900 p-3 rounded-xl">
            {tiles.map((tile, i) => (
              <button key={i} onClick={() => moveTile(i)} disabled={tile === 0 || !canMove(i)}
                className={`w-20 h-20 text-3xl font-bold rounded-lg ${tile === 0 ? "bg-purple-800" : canMove(i) ? "bg-white text-purple-600 hover:scale-105" : "bg-purple-300 text-purple-600"}`}>
                {tile || ""}
              </button>
            ))}
          </div>
          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg">Menu</button>
        </div>
      )}
      {phase === "complete" && (
        <div className="text-center">
          <p className="text-2xl text-white mb-4">🎉 Solved in {moves} moves!</p>
          <button onClick={() => { initPuzzle(); setPhase("playing"); }} className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl">Play Again</button>
        </div>
      )}
    </div>
  );
}
