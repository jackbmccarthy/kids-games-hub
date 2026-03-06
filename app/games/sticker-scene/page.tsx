"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "playing";

interface Sticker {
  id: number;
  emoji: string;
  x: number;
  y: number;
  scale: number;
}

const STICKERS = ["🌟", "🦋", "🌸", "🌈", "🐱", "🐸", "🍎", "🎈", "🌺", "🦄", "🍀", "🐝"];
const BACKGROUNDS = ["#87CEEB", "#98FB98", "#FFB6C1", "#FFE4E1", "#E6E6FA", "#FFFACD"];

export default function StickerScenePage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [background, setBackground] = useState("#87CEEB");
  const [placedStickers, setPlacedStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const placeSticker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedSticker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPlacedStickers(prev => [...prev, {
      id: Date.now(),
      emoji: selectedSticker,
      x,
      y,
      scale
    }]);
  };

  const clearScene = () => setPlacedStickers([]);

  return (
    <div className="min-h-screen bg-pink-200 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-pink-600 mb-4">🎨 Sticker Scene</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-pink-500 mb-4">Create your own sticker masterpiece!</p>
          <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-pink-500 text-white font-bold rounded-xl text-xl">Create!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <div
            onClick={placeSticker}
            className="w-[500px] h-[400px] rounded-2xl shadow-xl cursor-crosshair relative overflow-hidden"
            style={{ backgroundColor: background }}
          >
            {placedStickers.map(sticker => (
              <div
                key={sticker.id}
                className="absolute pointer-events-none"
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  fontSize: `${40 * sticker.scale}px`,
                  transform: "translate(-50%, -50%)"
                }}
              >
                {sticker.emoji}
              </div>
            ))}
          </div>

          {/* Sticker palette */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-[500px]">
            {STICKERS.map(sticker => (
              <button
                key={sticker}
                onClick={() => setSelectedSticker(sticker)}
                className={`text-3xl p-2 rounded-lg ${selectedSticker === sticker ? "bg-white ring-4 ring-pink-400" : "bg-white/50"}`}
              >
                {sticker}
              </button>
            ))}
          </div>

          {/* Background colors */}
          <div className="mt-4 flex gap-2 justify-center">
            {BACKGROUNDS.map(color => (
              <button
                key={color}
                onClick={() => setBackground(color)}
                className="w-10 h-10 rounded-full border-4 border-white shadow"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Size slider */}
          <div className="mt-4 flex items-center gap-2 justify-center">
            <span>Size:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-32"
            />
          </div>

          <div className="mt-4 flex gap-2 justify-center">
            <button onClick={clearScene} className="px-4 py-2 bg-red-400 text-white rounded-lg">Clear</button>
            <button onClick={() => setPhase("menu")} className="px-4 py-2 bg-pink-600 text-white rounded-lg">Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
