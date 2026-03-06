"use client";

import { useState, useCallback } from "react";

type Phase = "menu" | "building" | "running";

interface TrackPiece {
  type: "straight" | "curve";
  x: number;
  y: number;
  rotation: number;
}

export default function TrainTrackPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [tracks, setTracks] = useState<TrackPiece[]>([]);
  const [trainPos, setTrainPos] = useState(0);
  const [score, setScore] = useState(0);

  const placeTrack = (x: number, y: number) => {
    const types: ("straight" | "curve")[] = ["straight", "curve"];
    setTracks((t) => [...t, { type: types[Math.floor(Math.random() * 2)], x, y, rotation: 0 }]);
  };

  const startTrain = () => {
    if (tracks.length < 3) return;
    setPhase("running");
    setTrainPos(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-emerald-500 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🚂 Train Track</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-green-100 mb-4">Build tracks to guide the train!</p>
          <button onClick={() => { setTracks([]); setPhase("building"); }} className="px-8 py-4 bg-yellow-500 text-green-900 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "building" && (
        <div className="text-center">
          <p className="text-white mb-2">Tracks: {tracks.length}</p>
          <div
            className="w-[400px] h-[400px] bg-green-600 rounded-2xl border-4 border-green-700 relative cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.floor((e.clientX - rect.left) / 40);
              const y = Math.floor((e.clientY - rect.top) / 40);
              placeTrack(x, y);
            }}
          >
            {tracks.map((t, i) => (
              <div key={i} className="absolute w-10 h-10 flex items-center justify-center text-2xl"
                style={{ left: t.x * 40, top: t.y * 40 }}>
                {t.type === "straight" ? "━" : "┗"}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <button onClick={startTrain} disabled={tracks.length < 3} className="px-6 py-3 bg-yellow-500 text-green-900 font-bold rounded-xl disabled:opacity-50">
              Start Train!
            </button>
            <button onClick={() => setTracks([])} className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl">Clear</button>
          </div>
        </div>
      )}

      {phase === "running" && (
        <div className="text-center">
          <p className="text-white mb-2">🚂 Choo choo!</p>
          <div className="w-[400px] h-[400px] bg-green-600 rounded-2xl border-4 border-green-700 relative">
            {tracks.map((t, i) => (
              <div key={i} className={`absolute w-10 h-10 flex items-center justify-center text-2xl ${i === trainPos ? "animate-pulse" : ""}`}
                style={{ left: t.x * 40, top: t.y * 40 }}>
                {i === trainPos ? "🚂" : t.type === "straight" ? "━" : "┗"}
              </div>
            ))}
          </div>
          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-green-700 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
