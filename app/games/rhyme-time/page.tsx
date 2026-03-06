"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "playing" | "complete";

interface RhymeWord {
  id: string;
  word: string;
  emoji: string;
  rhymeGroup: string;
}

interface RhymePair {
  word1: RhymeWord;
  word2: RhymeWord;
}

const RHYME_DATA: RhymeWord[] = [
  // -at family
  { id: "cat", word: "Cat", emoji: "🐱", rhymeGroup: "at" },
  { id: "hat", word: "Hat", emoji: "🎩", rhymeGroup: "at" },
  { id: "bat", word: "Bat", emoji: "🦇", rhymeGroup: "at" },
  { id: "mat", word: "Mat", emoji: "🟫", rhymeGroup: "at" },
  
  // -og family
  { id: "dog", word: "Dog", emoji: "🐕", rhymeGroup: "og" },
  { id: "frog", word: "Frog", emoji: "🐸", rhymeGroup: "og" },
  { id: "log", word: "Log", emoji: "🪵", rhymeGroup: "og" },
  { id: "bog", word: "Bog", emoji: "🌿", rhymeGroup: "og" },
  
  // -ig family
  { id: "pig", word: "Pig", emoji: "🐷", rhymeGroup: "ig" },
  { id: "dig", word: "Dig", emoji: "🕳️", rhymeGroup: "ig" },
  { id: "wig", word: "Wig", emoji: "💇", rhymeGroup: "ig" },
  { id: "fig", word: "Fig", emoji: "🍇", rhymeGroup: "ig" },
  
  // -un family
  { id: "sun", word: "Sun", emoji: "☀️", rhymeGroup: "un" },
  { id: "bun", word: "Bun", emoji: "🥯", rhymeGroup: "un" },
  { id: "run", word: "Run", emoji: "🏃", rhymeGroup: "un" },
  { id: "fun", word: "Fun", emoji: "🎉", rhymeGroup: "un" },
  
  // -ed family
  { id: "bed", word: "Bed", emoji: "🛏️", rhymeGroup: "ed" },
  { id: "red", word: "Red", emoji: "🔴", rhymeGroup: "ed" },
  { id: "fed", word: "Fed", emoji: "🍽️", rhymeGroup: "ed" },
  { id: "sled", word: "Sled", emoji: "🛷", rhymeGroup: "ed" },
  
  // -ee family
  { id: "bee", word: "Bee", emoji: "🐝", rhymeGroup: "ee" },
  { id: "tree", word: "Tree", emoji: "🌳", rhymeGroup: "ee" },
  { id: "see", word: "See", emoji: "👀", rhymeGroup: "ee" },
  { id: "sea", word: "Sea", emoji: "🌊", rhymeGroup: "ee" },
  
  // -op family
  { id: "hop", word: "Hop", emoji: "🐇", rhymeGroup: "op" },
  { id: "top", word: "Top", emoji: "🔝", rhymeGroup: "op" },
  { id: "pop", word: "Pop", emoji: "🎈", rhymeGroup: "op" },
  { id: "mop", word: "Mop", emoji: "🧹", rhymeGroup: "op" },
  
  // -ake family
  { id: "cake", word: "Cake", emoji: "🎂", rhymeGroup: "ake" },
  { id: "lake", word: "Lake", emoji: "🏞️", rhymeGroup: "ake" },
  { id: "bake", word: "Bake", emoji: "👨‍🍳", rhymeGroup: "ake" },
  { id: "wake", word: "Wake", emoji: "⏰", rhymeGroup: "ake" },
  
  // -ock family
  { id: "clock", word: "Clock", emoji: "🕐", rhymeGroup: "ock" },
  { id: "rock", word: "Rock", emoji: "🪨", rhymeGroup: "ock" },
  { id: "sock", word: "Sock", emoji: "🧦", rhymeGroup: "ock" },
  { id: "lock", word: "Lock", emoji: "🔒", rhymeGroup: "ock" },
  
  // -all family
  { id: "ball", word: "Ball", emoji: "⚽", rhymeGroup: "all" },
  { id: "tall", word: "Tall", emoji: "📏", rhymeGroup: "all" },
  { id: "wall", word: "Wall", emoji: "🧱", rhymeGroup: "all" },
  { id: "fall", word: "Fall", emoji: "🍂", rhymeGroup: "all" },
];

const COLORS = {
  primary: "#FF6B9D",
  secondary: "#4ECDC4",
  accent: "#FFE66D",
  success: "#95E1D3",
  purple: "#A855F7",
  blue: "#3B82F6",
};

export default function RhymeTimePage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(8);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentPair, setCurrentPair] = useState<RhymePair | null>(null);
  const [options, setOptions] = useState<RhymeWord[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [usedPairs, setUsedPairs] = useState<Set<string>>(new Set());
  
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis;
    }
  }, []);

  // Speak word
  const speak = useCallback((word: string) => {
    if (!speechSynthRef.current) return;
    
    // Cancel any ongoing speech
    speechSynthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthRef.current.speak(utterance);
  }, []);

  // Shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Get random rhyme pair
  const getRandomPair = useCallback((): RhymePair => {
    const groups = [...new Set(RHYME_DATA.map(w => w.rhymeGroup))];
    const availableGroups = groups.filter(g => {
      const words = RHYME_DATA.filter(w => w.rhymeGroup === g);
      // Check if we have unused pairs in this group
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
          const pairKey = `${words[i].id}-${words[j].id}`;
          if (!usedPairs.has(pairKey)) {
            return true;
          }
        }
      }
      return false;
    });
    
    // If all pairs used, reset
    if (availableGroups.length === 0) {
      setUsedPairs(new Set());
      return getRandomPair();
    }
    
    const group = availableGroups[Math.floor(Math.random() * availableGroups.length)];
    const groupWords = RHYME_DATA.filter(w => w.rhymeGroup === group);
    
    // Find unused pair in this group
    const availablePairs: Array<[RhymeWord, RhymeWord]> = [];
    for (let i = 0; i < groupWords.length; i++) {
      for (let j = i + 1; j < groupWords.length; j++) {
        const pairKey = `${groupWords[i].id}-${groupWords[j].id}`;
        if (!usedPairs.has(pairKey)) {
          availablePairs.push([groupWords[i], groupWords[j]]);
        }
      }
    }
    
    const [word1, word2] = availablePairs[Math.floor(Math.random() * availablePairs.length)];
    const pairKey = `${word1.id}-${word2.id}`;
    setUsedPairs(prev => new Set(prev).add(pairKey));
    
    return { word1, word2 };
  }, [usedPairs]);

  // Get wrong options (different rhyme group)
  const getWrongOptions = useCallback((correctWord: RhymeWord, count: number): RhymeWord[] => {
    const wrongWords = RHYME_DATA.filter(w => w.rhymeGroup !== correctWord.rhymeGroup);
    return shuffleArray(wrongWords).slice(0, count);
  }, []);

  // Start round
  const startRound = useCallback(() => {
    const pair = getRandomPair();
    setCurrentPair(pair);
    
    // Create options: correct rhyme + 3 wrong ones
    const wrongOptions = getWrongOptions(pair.word1, 3);
    const allOptions = shuffleArray([pair.word2, ...wrongOptions]);
    
    setOptions(allOptions);
    setResult(null);
    
    // Speak the target word
    setTimeout(() => speak(pair.word1.word), 300);
  }, [getRandomPair, getWrongOptions, speak]);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setRound(1);
    setStreak(0);
    setCorrectAnswers(0);
    setUsedPairs(new Set());
    setPhase("playing");
    startRound();
  }, [startRound]);

  // Handle answer
  const handleAnswer = useCallback((selected: RhymeWord) => {
    if (!currentPair || result) return;

    if (selected.id === currentPair.word2.id) {
      // Correct!
      const points = 10 + streak * 5;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      setResult("correct");
      
      // Next round or complete
      if (round >= totalRounds) {
        setTimeout(() => setPhase("complete"), 1500);
      } else {
        setTimeout(() => {
          setRound(prev => prev + 1);
          startRound();
        }, 1500);
      }
    } else {
      // Wrong
      setStreak(0);
      setResult("wrong");
      
      // Allow retry after delay
      setTimeout(() => {
        setResult(null);
        speak(currentPair.word1.word);
      }, 1000);
    }
  }, [currentPair, result, streak, round, totalRounds, startRound, speak]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("rhyme-time-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("rhyme-time-high-score", String(score));
    }
  }, [score, highScore]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFE5EC] via-[#E8F5E9] to-[#E3F2FD] p-4">
      {/* Header */}
      <header className="max-w-2xl mx-auto text-center mb-4">
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#FF6B9D] via-[#A855F7] to-[#4ECDC4] text-transparent bg-clip-text mb-2">
          🎵 Rhyme Time! 🎵
        </h1>
        {phase === "playing" && (
          <div className="flex justify-center gap-4 flex-wrap text-lg font-bold">
            <span className="bg-white/80 px-4 py-2 rounded-full shadow-md">
              ⭐ Score: {score}
            </span>
            <span className="bg-white/80 px-4 py-2 rounded-full shadow-md">
              🎯 Round: {round}/{totalRounds}
            </span>
            {streak > 1 && (
              <span className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-4 py-2 rounded-full shadow-md animate-pulse">
                🔥 Streak: {streak}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Menu */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="text-6xl mb-4">🎭</div>
          <p className="text-gray-700 text-lg mb-4">
            Find words that <strong>rhyme</strong>! 
            Listen to the word and tap the one that sounds the same!
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-pink-100 rounded-xl p-4">
              <span className="text-4xl">🐱</span>
              <p className="font-bold text-pink-700 mt-2">Cat</p>
              <p className="text-2xl">⬇️</p>
              <span className="text-4xl">🎩</span>
              <p className="font-bold text-pink-700">Hat</p>
            </div>
            <div className="bg-green-100 rounded-xl p-4">
              <span className="text-4xl">🐕</span>
              <p className="font-bold text-green-700 mt-2">Dog</p>
              <p className="text-2xl">⬇️</p>
              <span className="text-4xl">🐸</span>
              <p className="font-bold text-green-700">Frog</p>
            </div>
          </div>

          {highScore > 0 && (
            <p className="text-xl font-bold text-[#FFD700] mb-4">
              🏆 High Score: {highScore}
            </p>
          )}

          <button
            onClick={startGame}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#FF6B9D] to-[#A855F7] hover:opacity-90 text-white font-bold rounded-xl text-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            ▶️ Play!
          </button>
        </div>
      )}

      {/* Playing Phase */}
      {phase === "playing" && currentPair && (
        <div className="max-w-2xl mx-auto">
          {/* Target Word Card */}
          <div className="text-center mb-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl inline-block">
              <p className="text-gray-600 text-sm font-bold mb-2">This word rhymes with...</p>
              <button
                onClick={() => speak(currentPair.word1.word)}
                disabled={isSpeaking}
                className={`text-8xl mb-2 transition-transform ${isSpeaking ? "scale-110" : "hover:scale-110 active:scale-95"}`}
              >
                {currentPair.word1.emoji}
              </button>
              <h2 className="text-4xl font-black text-[#2C3E50] mb-2">
                {currentPair.word1.word}
              </h2>
              <button
                onClick={() => speak(currentPair.word1.word)}
                disabled={isSpeaking}
                className="bg-[#4ECDC4] hover:bg-[#45B7AA] text-white font-bold py-2 px-6 rounded-full transition-all text-lg"
              >
                {isSpeaking ? "🔊 Listening..." : "🔊 Hear it again"}
              </button>
            </div>
          </div>

          {/* Result Overlay */}
          {result && (
            <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${
              result === "correct" ? "bg-green-500/20" : "bg-red-500/20"
            }`}>
              <div className={`text-9xl animate-bounce ${
                result === "correct" ? "text-green-500" : "text-red-500"
              }`}>
                {result === "correct" ? "✅" : "❌"}
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            {options.map((option, index) => {
              const bgColors = [
                "from-pink-400 to-pink-500",
                "from-blue-400 to-blue-500",
                "from-green-400 to-green-500",
                "from-orange-400 to-orange-500",
              ];
              const isCorrect = result === "correct" && option.id === currentPair.word2.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option)}
                  disabled={result === "correct"}
                  className={`bg-gradient-to-br ${bgColors[index]} rounded-3xl p-6 text-white transition-all shadow-lg hover:shadow-xl ${
                    result === "correct" 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:scale-105 active:scale-95 cursor-pointer"
                  } ${isCorrect ? "ring-4 ring-green-500 scale-110" : ""}`}
                >
                  <span className="text-6xl block mb-2">{option.emoji}</span>
                  <span className="text-2xl font-black">
                    {option.word}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wrong answer hint */}
          {result === "wrong" && (
            <div className="text-center mt-4">
              <p className="text-red-500 font-bold text-lg">
                ❌ Try again! Listen carefully 👂
              </p>
            </div>
          )}
        </div>
      )}

      {/* Complete Phase */}
      {phase === "complete" && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-black text-[#2C3E50] mb-2">
              Amazing Job!
            </h2>
            <div className="space-y-2 mb-6">
              <p className="text-2xl font-bold text-[#4ECDC4]">
                ⭐ Score: {score}
              </p>
              <p className="text-xl text-gray-600">
                ✅ {correctAnswers}/{totalRounds} Correct
              </p>
              {score >= highScore && score > 0 && (
                <p className="text-xl font-bold text-[#FFD700]">
                  🏆 New High Score!
                </p>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#FF6B9D] to-[#A855F7] hover:opacity-90 text-white font-bold rounded-xl text-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Menu Button */}
      {phase === "playing" && (
        <div className="max-w-2xl mx-auto mt-6 text-center">
          <button
            onClick={() => setPhase("menu")}
            className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
          >
            🏠 Menu
          </button>
        </div>
      )}
    </main>
  );
}
