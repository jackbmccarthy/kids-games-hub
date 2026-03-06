"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Phase = "menu" | "playing";

interface Note {
  pitch: number;
  duration: number;
  time: number;
}

const KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const KEY_COLORS = ["#FF6B6B", "#FF9F43", "#FFE66D", "#4ECDC4", "#45B7D1", "#96CEB4", "#9B59B6"];

export default function MusicMakerPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [currentInstrument, setCurrentInstrument] = useState("piano");
  const [recording, setRecording] = useState<Note[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playNote = useCallback((pitch: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = currentInstrument === "piano" ? "triangle" : currentInstrument === "synth" ? "square" : "sine";
    osc.frequency.value = 261.63 * Math.pow(2, pitch / 12);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);

    if (isRecording) {
      setRecording((r) => [...r, { pitch, duration: 0.5, time: Date.now() }]);
    }
    setScore((s) => s + 1);
  }, [currentInstrument, isRecording]);

  const playRecording = useCallback(() => {
    if (recording.length === 0) return;
    setIsPlaying(true);
    recording.forEach((note, i) => {
      setTimeout(() => playNote(note.pitch), i * 300);
    });
    setTimeout(() => setIsPlaying(false), recording.length * 300);
  }, [recording, playNote]);

  const clearRecording = () => {
    setRecording([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🎵 Music Maker</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-purple-200 mb-4">Create your own melodies!</p>
          <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-yellow-400 text-purple-900 font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Notes played: {score}</p>

          {/* Instrument selector */}
          <div className="flex gap-2 justify-center mb-4">
            {["piano", "synth", "bell"].map((inst) => (
              <button key={inst} onClick={() => setCurrentInstrument(inst)}
                className={`px-4 py-2 rounded-lg font-bold ${currentInstrument === inst ? "bg-yellow-400 text-purple-900" : "bg-white/20 text-white"}`}>
                {inst.charAt(0).toUpperCase() + inst.slice(1)}
              </button>
            ))}
          </div>

          {/* Keyboard */}
          <div className="flex gap-1 justify-center mb-4">
            {KEYS.map((key, i) => (
              <button key={key} onClick={() => playNote(i * 2)}
                className="w-12 h-32 rounded-b-lg text-white font-bold flex items-end justify-center pb-2 shadow-lg hover:scale-105 transition-transform"
                style={{ backgroundColor: KEY_COLORS[i] }}>
                {key}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center mb-4">
            <button onClick={() => setIsRecording(!isRecording)}
              className={`px-4 py-2 rounded-lg font-bold ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500"} text-white`}>
              {isRecording ? "⏹ Recording..." : "⏺ Record"}
            </button>
            <button onClick={playRecording} disabled={recording.length === 0 || isPlaying}
              className="px-4 py-2 rounded-lg font-bold bg-green-500 text-white disabled:opacity-50">
              ▶ Play
            </button>
            <button onClick={clearRecording} disabled={recording.length === 0}
              className="px-4 py-2 rounded-lg font-bold bg-gray-500 text-white disabled:opacity-50">
              Clear
            </button>
          </div>

          <p className="text-purple-200 text-sm">Notes recorded: {recording.length}</p>

          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
