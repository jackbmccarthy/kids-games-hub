"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing";

const KEYS = [
  { note: "C", color: "#FF6B6B", freq: 261.63 },
  { note: "D", color: "#FF8E53", freq: 293.66 },
  { note: "E", color: "#FFD93D", freq: 329.63 },
  { note: "F", color: "#6BCB77", freq: 349.23 },
  { note: "G", color: "#4D96FF", freq: 392.00 },
  { note: "A", color: "#845EC2", freq: 440.00 },
  { note: "B", color: "#D65DB1", freq: 493.88 },
  { note: "C2", color: "#FF6B6B", freq: 523.25 },
];

const SONGS = [
  { name: "Twinkle Twinkle", notes: [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0] },
  { name: "Mary's Lamb", notes: [2, 1, 0, 1, 2, 2, 2, -1, 1, 1, 1, -1, 2, 4, 4] },
];

export default function PianoKeysPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [mode, setMode] = useState<"free" | "learn">("free");
  const [currentSong, setCurrentSong] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);
  const [recording, setRecording] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const audioRef = useRef<AudioContext | null>(null);

  const playNote = useCallback((index: number) => {
    if (!audioRef.current) {
      audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = KEYS[index].freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setActiveKey(index);
    setTimeout(() => setActiveKey(null), 200);

    if (isRecording) {
      setRecording(r => [...r, index]);
    }

    // Learn mode
    if (mode === "learn") {
      const song = SONGS[currentSong];
      if (song.notes[noteIndex] === index) {
        const nextIndex = noteIndex + 1;
        if (nextIndex >= song.notes.length) {
          setNoteIndex(0);
        } else {
          setNoteIndex(nextIndex);
        }
      }
    }
  }, [isRecording, mode, currentSong, noteIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, number> = { a: 0, s: 1, d: 2, f: 3, g: 4, h: 5, j: 6, k: 7 };
      if (keyMap[e.key.toLowerCase()] !== undefined && phase === "playing") {
        playNote(keyMap[e.key.toLowerCase()]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, playNote]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      {phase === "playing" && (
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white">🎹 Piano Keys</h2>
          <p className="text-white/60 text-sm">Press A-K or tap keys</p>
          {mode === "learn" && (
            <p className="text-yellow-300 mt-2">
              Play: {SONGS[currentSong].name} - Note {noteIndex + 1}/{SONGS[currentSong].notes.length}
            </p>
          )}
        </div>
      )}

      {phase === "playing" && (
        <div className="flex gap-1">
          {KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => playNote(i)}
              className={`w-12 sm:w-16 h-40 sm:h-48 rounded-b-xl transition-all ${
                activeKey === i ? "scale-105 brightness-125" : ""
              }`}
              style={{ backgroundColor: key.color }}
            >
              <div className="flex flex-col items-center justify-end h-full pb-4">
                <span className="text-white font-bold text-lg">{key.note}</span>
                <span className="text-white/60 text-xs mt-1">
                  {["A", "S", "D", "F", "G", "H", "J", "K"][i]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {phase === "playing" && (
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-4 py-2 rounded-lg font-bold ${isRecording ? "bg-red-500" : "bg-gray-600"} text-white`}
          >
            {isRecording ? "⏹️ Stop" : "⏺️ Record"}
          </button>
          {recording.length > 0 && (
            <button
              onClick={() => {
                recording.forEach((n, i) => setTimeout(() => playNote(n), i * 400));
              }}
              className="px-4 py-2 rounded-lg font-bold bg-green-600 text-white"
            >
              ▶️ Play
            </button>
          )}
        </div>
      )}

      {phase === "menu" && (
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full">
          <h1 className="text-4xl font-black text-purple-600 mb-2">🎹 Piano Keys</h1>
          <p className="text-gray-600 mb-6">Play music with colorful keys!</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <p className="font-bold mb-2">Mode:</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setMode("free")}
                  className={`px-4 py-2 rounded-lg ${mode === "free" ? "bg-purple-500 text-white" : "bg-gray-200"}`}>
                  Free Play
                </button>
                <button onClick={() => setMode("learn")}
                  className={`px-4 py-2 rounded-lg ${mode === "learn" ? "bg-purple-500 text-white" : "bg-gray-200"}`}>
                  Learn Songs
                </button>
              </div>
            </div>
            {mode === "learn" && (
              <div>
                <p className="font-bold mb-2">Song:</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {SONGS.map((s, i) => (
                    <button key={i} onClick={() => setCurrentSong(i)}
                      className={`px-4 py-2 rounded-lg ${currentSong === i ? "bg-purple-500 text-white" : "bg-gray-200"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setPhase("playing")}
            className="w-full px-6 py-4 bg-purple-500 text-white font-bold rounded-xl text-xl">
            ▶️ Play
          </button>
        </div>
      )}
    </main>
  );
}
