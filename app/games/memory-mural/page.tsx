"use client";

import { useState, useEffect, useCallback } from "react";

type GamePhase = "menu" | "playing" | "complete";

interface Tile {
  id: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const THEMES = {
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"],
  food: ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🥝", "🍒"],
  space: ["🌙", "⭐", "🌟", "💫", "🚀", "🛸", "🌍", "🌙"],
};

export default function MemoryMuralPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [theme, setTheme] = useState<keyof typeof THEMES>("animals");
  const [gridSize, setGridSize] = useState(4);

  const initGame = useCallback(() => {
    const images = THEMES[theme];
    const pairs = (gridSize * gridSize) / 2;
    const selected = [...images.slice(0, pairs), ...images.slice(0, pairs)];
    
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    setTiles(selected.map((img, i) => ({
      id: i, image: img, isFlipped: false, isMatched: false
    })));
    setFlipped([]);
    setMoves(0);
  }, [theme, gridSize]);

  const handleTile = useCallback((id: number) => {
    if (flipped.length >= 2) return;
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.isFlipped || tile.isMatched) return;

    const newTiles = tiles.map(t => t.id === id ? { ...t, isFlipped: true } : t);
    setTiles(newTiles);
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      const tileA = newTiles.find(t => t.id === a);
      const tileB = newTiles.find(t => t.id === b);

      if (tileA?.image === tileB?.image) {
        setTimeout(() => {
          setTiles(prev => {
            const updated = prev.map(t => 
              t.id === a || t.id === b ? { ...t, isMatched: true, isFlipped: false } : t
            );
            if (updated.every(t => t.isMatched)) {
              setTimeout(() => setPhase("complete"), 500);
            }
            return updated;
          });
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            t.id === a || t.id === b ? { ...t, isFlipped: false } : t
          ));
          setFlipped([]);
        }, 1000);
      }
    }
  }, [tiles, flipped]);

  useEffect(() => {
    if (phase === "playing") initGame();
  }, [phase, initGame]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center p-4">
      {phase === "playing" && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">🖼️ Memory Mural</h2>
          <p className="text-white/80 mb-4">Moves: {moves}</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {tiles.map(tile => (
              <button
                key={tile.id}
                onClick={() => handleTile(tile.id)}
                disabled={tile.isFlipped || tile.isMatched}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl text-3xl transition-all ${
                  tile.isMatched ? "bg-green-400/50 scale-95" :
                  tile.isFlipped ? "bg-white scale-105" : "bg-white/30 hover:bg-white/50"
                }`}
              >
                {tile.isFlipped || tile.isMatched ? tile.image : "❓"}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "menu" && (
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full">
          <h1 className="text-4xl font-black text-indigo-600 mb-2">🖼️ Memory Mural</h1>
          <p className="text-gray-600 mb-6">Match all the pairs!</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <p className="font-bold mb-2">Theme:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {Object.keys(THEMES).map(t => (
                  <button key={t} onClick={() => setTheme(t as keyof typeof THEMES)}
                    className={`px-4 py-2 rounded-lg capitalize ${theme === t ? "bg-indigo-500 text-white" : "bg-gray-200"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold mb-2">Size:</p>
              <div className="flex gap-2 justify-center">
                {[4, 6].map(s => (
                  <button key={s} onClick={() => setGridSize(s)}
                    className={`px-4 py-2 rounded-lg ${gridSize === s ? "bg-indigo-500 text-white" : "bg-gray-200"}`}>
                    {s}x{s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => setPhase("playing")}
            className="w-full px-6 py-4 bg-indigo-500 text-white font-bold rounded-xl text-xl">
            ▶️ Play
          </button>
        </div>
      )}

      {phase === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-green-500 mb-2">🎉 Complete!</h2>
            <p className="text-xl text-gray-700 mb-4">{moves} moves</p>
            <div className="space-y-2">
              <button onClick={() => setPhase("playing")}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl">Play Again</button>
              <button onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl">Menu</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
