"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Phase = "menu" | "playing";

interface Note {
  pitch: number;
  time: number;
}

const INSTRUMENTS = ["🎻 Violin", "🎺 Trumpet", "🥁 Drums", "🎹 Piano"];

export default function SymphonyConductorPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [currentInstrument, setCurrentInstrument] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [batonY, setBatonY] = useState(200);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playNote = useCallback((pitch: number) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const types: OscillatorType[] = ["sine", "square", "triangle", "sawtooth"];
    osc.type = types[currentInstrument] || "sine";
    osc.frequency.value = 220 + pitch * 55;
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);

    setScore(s => s + 1);
    if (isRecording) setNotes(prev => [...prev, { pitch, time: Date.now() }]);
  }, [currentInstrument, isRecording]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setBatonY(y);
    const pitch = Math.floor((400 - y) / 50);
    if (e.buttons === 1) playNote(pitch);
  };

  const playRecording = useCallback(() => {
    if (notes.length === 0) return;
    setIsPlaying(true);
    notes.forEach((note, i) => {
      setTimeout(() => playNote(note.pitch), i * 200);
    });
    setTimeout(() => setIsPlaying(false), notes.length * 200 + 300);
  }, [notes, playNote]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">🎼 Symphony Conductor</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-slate-300 mb-4">Wave your baton to make music!</p>
          <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-yellow-500 text-slate-900 font-bold rounded-xl text-xl">Conduct!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>

          {/* Instruments */}
          <div className="flex gap-2 justify-center mb-4">
            {INSTRUMENTS.map((inst, i) => (
              <button key={inst} onClick={() => setCurrentInstrument(i)}
                className={`px-3 py-2 rounded-lg text-sm ${currentInstrument === i ? "bg-yellow-500 text-slate-900" : "bg-slate-600 text-white"}`}>
                {inst}
              </button>
            ))}
          </div>

          {/* Stage */}
          <div
            onMouseMove={handleMouseMove}
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            className="w-[400px] h-[400px] bg-gradient-to-b from-purple-900 to-slate-900 rounded-2xl relative cursor-crosshair overflow-hidden"
          >
            {/* Staff lines */}
            {[100, 150, 200, 250, 300].map(y => (
              <div key={y} className="absolute left-0 right-0 h-px bg-white/20" style={{ top: y }} />
            ))}
            
            {/* Baton */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-1 h-20 bg-white rounded-full shadow-lg"
              style={{ top: batonY - 40 }}
            />
            <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full"
              style={{ top: batonY - 45 }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2 mt-4 justify-center">
            <button onClick={playRecording} disabled={notes.length === 0 || isPlaying}
              className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg disabled:opacity-50">▶ Play</button>
            <button onClick={() => setNotes([])} className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg">Clear</button>
          </div>

          <p className="text-slate-400 text-sm mt-2">Notes: {notes.length}</p>
          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg">Menu</button>
        </div>
      )}
    </div>
  );
}
