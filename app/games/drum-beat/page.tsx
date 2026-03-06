"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "listening" | "playing";

const DRUMS = ["kick", "snare", "hihat", "tom"];
const DRUM_EMOJIS = ["🥁", "🪘", "🎩", "🥁"];
const DRUM_COLORS = ["#E74C3C", "#3498DB", "#F1C40F", "#9B59B6"];

export default function DrumBeatPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerPattern, setPlayerPattern] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [activeDrum, setActiveDrum] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playDrum = (index: number) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const freqs = [100, 200, 400, 150];
    osc.frequency.value = freqs[index];
    osc.type = "square";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);

    setActiveDrum(index);
    setTimeout(() => setActiveDrum(null), 100);

    if (phase === "playing") {
      setPlayerPattern(prev => [...prev, index]);
    }
  };

  const generatePattern = useCallback(() => {
    const newPattern = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
    setPattern(newPattern);
    setPlayerPattern([]);
    
    setPhase("listening");
    newPattern.forEach((drum, i) => {
      setTimeout(() => playDrum(drum), i * 500 + 500);
    });
    setTimeout(() => setPhase("playing"), newPattern.length * 500 + 600);
  }, []);

  useEffect(() => {
    if (phase === "playing" && playerPattern.length === pattern.length) {
      if (playerPattern.every((p, i) => p === pattern[i])) {
        setScore(s => s + 10);
        setTimeout(generatePattern, 500);
      } else {
        setPhase("menu");
      }
    }
  }, [playerPattern, pattern, phase, generatePattern]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🥁 Drum Beat</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-purple-200 mb-4">Repeat the drum pattern!</p>
          <button onClick={() => { setScore(0); generatePattern(); }} className="px-8 py-4 bg-yellow-400 text-purple-900 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {(phase === "listening" || phase === "playing") && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>
          <p className="text-purple-200 mb-4">{phase === "listening" ? "Listen..." : "Your turn!"}</p>

          <div className="flex gap-4">
            {DRUMS.map((drum, i) => (
              <button
                key={drum}
                onClick={() => playDrum(i)}
                disabled={phase !== "playing"}
                className={`w-20 h-20 rounded-full text-3xl transition-all ${activeDrum === i ? "scale-110" : ""}`}
                style={{ backgroundColor: DRUM_COLORS[i], opacity: activeDrum === i ? 1 : 0.8 }}
              >
                {DRUM_EMOJIS[i]}
              </button>
            ))}
          </div>

          <button onClick={() => setPhase("menu")} className="mt-6 px-4 py-2 bg-purple-800 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
