"use client";

import { useState, useEffect, useCallback } from "react";

type GamePhase = "menu" | "loading" | "playing" | "complete";

interface Pokemon {
  id: number;
  name: string;
  japanese: string;
  romaji: string;
  kana: string[];
  romajiParts: string[];
  sprite: string;
}

const TOTAL_POKEMON = 1025;

// Generation ranges
const GENERATIONS = [
  { num: 0, name: "All Pokémon", range: "", start: 1, end: 1025 },
  { num: 1, name: "Gen 1 (Kanto)", range: "1-151", start: 1, end: 151 },
  { num: 2, name: "Gen 2 (Johto)", range: "152-251", start: 152, end: 251 },
  { num: 3, name: "Gen 3 (Hoenn)", range: "252-386", start: 252, end: 386 },
  { num: 4, name: "Gen 4 (Sinnoh)", range: "387-493", start: 387, end: 493 },
  { num: 5, name: "Gen 5 (Unova)", range: "494-649", start: 494, end: 649 },
  { num: 6, name: "Gen 6 (Kalos)", range: "650-721", start: 650, end: 721 },
  { num: 7, name: "Gen 7 (Alola)", range: "722-809", start: 722, end: 809 },
  { num: 8, name: "Gen 8 (Galar)", range: "810-905", start: 810, end: 905 },
  { num: 9, name: "Gen 9 (Paldea)", range: "906-1025", start: 906, end: 1025 },
];

export default function PokemonKanaSpellerPage() {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>([]);
  const [availableKana, setAvailableKana] = useState<string[]>([]);
  const [draggedKana, setDraggedKana] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [generation, setGeneration] = useState<number>(0);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  // Load saved data
  useEffect(() => {
    // Load Pokemon data from local file
    fetch('/pokemon/data.json')
      .then(res => res.json())
      .then(data => {
        setAllPokemon(data);
        setPhase("menu");
      })
      .catch(err => {
        console.error('Failed to load Pokemon data:', err);
      });
    
    const savedScore = localStorage.getItem("pokemon-kana-score");
    if (savedScore) setScore(parseInt(savedScore, 10) || 0);
    
    const savedSeen = localStorage.getItem("pokemon-kana-seen");
    if (savedSeen) {
      try {
        setSeen(new Set(JSON.parse(savedSeen)));
      } catch {}
    }
    
    const savedCompleted = localStorage.getItem("pokemon-kana-completed");
    if (savedCompleted) {
      try {
        setCompleted(new Set(JSON.parse(savedCompleted)));
      } catch {}
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem("pokemon-kana-score", String(score));
  }, [score]);

  useEffect(() => {
    localStorage.setItem("pokemon-kana-seen", JSON.stringify([...seen]));
  }, [seen]);

  useEffect(() => {
    localStorage.setItem("pokemon-kana-completed", JSON.stringify([...completed]));
  }, [completed]);

  const shuffleKana = useCallback((kana: string[]) => {
    const shuffled = [...kana];
    // Add distractors from the current pokemon's kana pool
    const allKanaChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴャュョッー";
    const numDistractors = Math.min(4, Math.max(2, kana.length));
    for (let i = 0; i < numDistractors; i++) {
      const distractor = allKanaChars[Math.floor(Math.random() * allKanaChars.length)];
      if (!shuffled.includes(distractor)) {
        shuffled.push(distractor);
      }
    }
    // Shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const speakJapanese = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.75;
    window.speechSynthesis.speak(utterance);
  }, []);

  const startGame = useCallback((gen?: number) => {
    if (allPokemon.length === 0) return;
    
    if (gen !== undefined) {
      setGeneration(gen);
    }
    
    const activeGen = gen ?? generation;
    const genData = GENERATIONS.find(g => g.num === activeGen) || GENERATIONS[0];
    
    // Filter by generation
    const pool = allPokemon.filter(p => p.id >= genData.start && p.id <= genData.end);
    
    // Filter out completed, or use all if all completed
    const available = pool.filter(p => !completed.has(p.id));
    const pokemon = available.length > 0 
      ? available[Math.floor(Math.random() * available.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    
    setCurrentPokemon(pokemon);
    setFilledSlots(new Array(pokemon.kana.length).fill(null));
    setAvailableKana(shuffleKana(pokemon.kana));
    setShowHint(false);
    setPhase("playing");
  }, [completed, generation, shuffleKana, allPokemon]);

  const handlePlace = useCallback((slotIndex: number, kana: string) => {
    if (!currentPokemon || filledSlots[slotIndex] !== null) return;
    
    const correctKana = currentPokemon.kana[slotIndex];
    
    if (kana === correctKana) {
      const newFilled = [...filledSlots];
      newFilled[slotIndex] = kana;
      setFilledSlots(newFilled);
      
      setAvailableKana(prev => {
        const idx = prev.indexOf(kana);
        if (idx > -1) {
          const newAvailable = [...prev];
          newAvailable.splice(idx, 1);
          return newAvailable;
        }
        return prev;
      });
      
      // Speak the kana
      speakJapanese(kana);
      
      // Check if complete
      if (newFilled.every(f => f !== null)) {
        setTimeout(() => {
          speakJapanese(currentPokemon.japanese);
          setScore(s => s + 10 + streak * 2);
          setStreak(st => st + 1);
          setCompleted(prev => new Set([...prev, currentPokemon.id]));
          setSeen(prev => new Set([...prev, currentPokemon.id]));
          setPhase("complete");
        }, 400);
      }
    } else {
      // Wrong - lose streak
      setStreak(0);
    }
  }, [currentPokemon, filledSlots, speakJapanese, streak]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-red-500 p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
          ⚡ ポケモン カナ Speller ⚡
        </h1>
        <p className="text-white/90 font-semibold text-sm md:text-base">Learn Japanese with all {TOTAL_POKEMON} Pokémon!</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <span className="bg-white/30 rounded-full px-3 py-1 text-white font-bold text-sm">
            Score: {score}
          </span>
          <span className="bg-white/30 rounded-full px-3 py-1 text-white font-bold text-sm">
            Streak: {streak}🔥
          </span>
          <span className="bg-white/30 rounded-full px-3 py-1 text-white font-bold text-sm">
            Seen: {seen.size}/{TOTAL_POKEMON}
          </span>
        </div>
      </div>

      {phase === "loading" && (
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="text-6xl mb-4 animate-bounce">⚡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Pokémon...</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div className="bg-yellow-400 h-4 rounded-full animate-pulse w-3/4" />
          </div>
          <p className="text-gray-600">All {TOTAL_POKEMON} Pokémon are ready!</p>
        </div>
      )}

      {phase === "menu" && (
        <div className="max-w-2xl mx-auto">
          {/* Ready indicator */}
          <div className="bg-green-100 rounded-2xl p-3 shadow mb-4 text-center">
            <p className="font-bold text-green-700">✅ All {TOTAL_POKEMON} Pokémon loaded locally!</p>
            <p className="text-xs text-green-600">Works offline • No API calls needed</p>
          </div>

          {/* Generation selector */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Choose a Generation</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {GENERATIONS.map(gen => (
                <button
                  key={gen.num}
                  onClick={() => startGame(gen.num)}
                  className="p-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-br from-blue-400 to-purple-500 text-white hover:scale-105 shadow"
                >
                  <div>{gen.name}</div>
                  {gen.range && <div className="text-xs opacity-75">#{gen.range}</div>}
                </button>
              ))}
            </div>
            
            {/* Progress per generation */}
            <div className="mt-4 p-3 bg-gray-100 rounded-xl">
              <p className="font-bold text-gray-700 mb-2">Your Progress:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs">
                {GENERATIONS.slice(1).map(gen => {
                  const genPokemon = allPokemon.filter(p => p.id >= gen.start && p.id <= gen.end);
                  const genSeen = genPokemon.filter(p => seen.has(p.id)).length;
                  return (
                    <div key={gen.num} className="bg-white rounded p-2">
                      <div className="font-semibold">Gen {gen.num}</div>
                      <div className="text-gray-500">{genSeen}/{genPokemon.length}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-xl text-sm text-gray-600">
              <p className="font-bold mb-1">How to Play:</p>
              <p>1. A Pokémon appears with empty kana slots</p>
              <p>2. Drag/click the correct Japanese characters</p>
              <p>3. Each correct placement speaks the sound!</p>
              <p>4. Complete the word to hear the full name!</p>
            </div>
          </div>
        </div>
      )}

      {phase === "playing" && currentPokemon && (
        <div className="max-w-2xl mx-auto">
          {/* Pokémon Card */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl mb-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <img
                src={currentPokemon.sprite}
                alt={currentPokemon.name}
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-gray-500">#{currentPokemon.id}</p>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{currentPokemon.name}</h2>
                <p className="text-gray-600">{currentPokemon.romaji}</p>
              </div>
            </div>

            {/* Kana Slots */}
            <div className="mt-4">
              <div className="flex justify-center gap-1 md:gap-2 flex-wrap mb-2">
                {filledSlots.map((filled, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      if (filled === null && draggedKana) {
                        handlePlace(index, draggedKana);
                      }
                    }}
                    className={`w-12 h-14 md:w-14 md:h-16 rounded-lg border-3 flex items-center justify-center text-xl md:text-2xl font-bold transition-all cursor-pointer
                      ${filled
                        ? "bg-green-100 border-green-400 text-green-700"
                        : "bg-gray-100 border-2 border-dashed border-gray-300 hover:border-yellow-400"
                      }`}
                  >
                    {filled || "?"}
                  </div>
                ))}
              </div>
              
              {/* Romaji hints */}
              <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                {currentPokemon.romajiParts.map((r, index) => (
                  <div
                    key={index}
                    className={`w-12 md:w-14 text-center text-xs md:text-sm font-semibold
                      ${filledSlots[index] ? "text-green-600" : "text-gray-400"}
                    `}
                  >
                    {showHint ? r : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Hint & Listen buttons */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold"
              >
                {showHint ? "🙈 Hide" : "💡 Hints"}
              </button>
              <button
                onClick={() => speakJapanese(currentPokemon.japanese)}
                className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-lg text-sm font-bold"
              >
                🔊 Listen
              </button>
            </div>
          </div>

          {/* Available Kana */}
          <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
            <div className="flex justify-center gap-2 flex-wrap">
              {availableKana.map((kana, index) => (
                <button
                  key={`${kana}-${index}`}
                  draggable
                  onDragStart={() => setDraggedKana(kana)}
                  onDragEnd={() => setDraggedKana(null)}
                  onClick={() => {
                    // Auto-place in first correct empty slot
                    for (let i = 0; i < currentPokemon.kana.length; i++) {
                      if (filledSlots[i] === null && kana === currentPokemon.kana[i]) {
                        handlePlace(i, kana);
                        break;
                      }
                    }
                  }}
                  className={`w-12 h-14 md:w-14 md:h-16 bg-gradient-to-br from-blue-400 to-purple-500 
                    text-white rounded-lg flex items-center justify-center text-xl md:text-2xl font-bold 
                    shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform
                    ${draggedKana === kana ? "opacity-50" : ""}`}
                >
                  {kana}
                </button>
              ))}
            </div>
          </div>
          
          {/* Skip button */}
          <div className="text-center mt-4">
            <button
              onClick={() => startGame(generation)}
              className="px-4 py-2 bg-white/50 text-white font-bold rounded-lg hover:bg-white/70"
            >
              ⏭️ Skip
            </button>
          </div>
        </div>
      )}

      {phase === "complete" && currentPokemon && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-black text-green-600 mb-2">Perfect!</h2>
            <img
              src={currentPokemon.sprite}
              alt={currentPokemon.name}
              className="w-24 h-24 mx-auto mb-2"
              style={{ imageRendering: "pixelated" }}
            />
            <p className="text-2xl font-bold text-gray-800">{currentPokemon.japanese}</p>
            <p className="text-gray-600 mb-1">{currentPokemon.romaji}</p>
            <p className="text-sm text-gray-500 mb-3">{currentPokemon.name} #{currentPokemon.id}</p>
            <p className="text-lg font-bold text-yellow-600 mb-3">+{10 + streak * 2} points!</p>
            <div className="space-y-2">
              <button
                onClick={() => speakJapanese(currentPokemon.japanese)}
                className="w-full px-4 py-2 bg-blue-500 text-white font-bold rounded-lg"
              >
                🔊 Hear Again
              </button>
              <button
                onClick={() => startGame(generation)}
                className="w-full px-4 py-3 bg-green-500 text-white font-bold rounded-lg"
              >
                Next Pokémon →
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 font-bold rounded-lg"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
