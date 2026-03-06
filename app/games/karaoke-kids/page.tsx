"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing";

const SONGS = [
  { title: "Twinkle Twinkle", lyrics: ["Twinkle", "twinkle", "little", "star", "How", "I", "wonder", "what", "you", "are"] },
  { title: "ABC Song", lyrics: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"] },
  { title: "Happy Song", lyrics: ["Happy", "happy", "joy", "joy", "Sing", "with", "me", "today", "Let's", "play"] },
];

export default function KaraokeKidsPage() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [currentSong, setCurrentSong] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playing, setPlaying] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startSong = () => {
    setCurrentWord(0);
    setPlaying(true);
  };

  useEffect(() => {
    if (playing && phase === "playing") {
      intervalRef.current = setInterval(() => {
        setCurrentWord((prev) => {
          if (prev >= SONGS[currentSong].lyrics.length - 1) {
            setPlaying(false);
            setScore((s) => s + 100);
            return prev;
          }
          setScore((s) => s + 5);
          return prev + 1;
        });
      }, 800);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [playing, phase, currentSong]);

  const selectSong = (index: number) => {
    setCurrentSong(index);
    setCurrentWord(0);
    setPlaying(false);
    setScore(0);
    setPhase("playing");
  };

  useEffect(() => {
    const saved = localStorage.getItem("karaoke-kids-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("karaoke-kids-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-pink-600 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-4">🎤 Karaoke Kids</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-purple-200 mb-2">Sing along with the lyrics!</p>
          <p className="text-pink-200 mb-4 text-sm">High Score: {highScore}</p>
          
          <p className="text-white mb-2">Choose a song:</p>
          <div className="flex flex-col gap-2">
            {SONGS.map((song, i) => (
              <button
                key={i}
                onClick={() => selectSong(i)}
                className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl"
              >
                🎵 {song.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-white mb-2">Score: {score}</p>
          <p className="text-pink-200 mb-4">🎵 {SONGS[currentSong].title}</p>

          {/* Stage */}
          <div className="w-80 h-48 bg-purple-900 rounded-2xl border-4 border-yellow-400 mb-4 flex flex-wrap items-center justify-center p-4 gap-2">
            {SONGS[currentSong].lyrics.map((word, i) => (
              <span
                key={i}
                className={`text-xl font-bold transition-all ${
                  i === currentWord && playing
                    ? "text-yellow-300 scale-125"
                    : i < currentWord
                    ? "text-gray-400"
                    : "text-gray-600"
                }`}
              >
                {word}
              </span>
            ))}
          </div>

          {/* Mic */}
          <div className="text-6xl mb-4 animate-bounce">🎤</div>

          <div className="flex gap-2 justify-center">
            {!playing && currentWord === 0 && (
              <button onClick={startSong} className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl">
                Start Singing!
              </button>
            )}
            {!playing && currentWord > 0 && (
              <button onClick={() => setPhase("menu")} className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl">
                Song Complete! 🎉
              </button>
            )}
          </div>

          <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg">
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
