"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type GamePhase = "menu" | "loading" | "playing" | "complete" | "finished";

interface Pokemon {
  id: number;
  name: string;
  japanese: string;
  romaji: string;
  kana: string[];
  romajiParts: string[];
  sprite: string;
}

// Katakana to Romaji mapping
const KATAKANA_MAP: Record<string, string> = {
  // Basic
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
  // Dakuten (voiced)
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  // Handakuten (p-sounds)
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  // Combinations (youon) - these need to be checked first
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
  'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
  'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
  'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
  'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
  // Special combinations
  'ヴァ': 'va', 'ヴィ': 'vi', 'ヴ': 'vu', 'ヴェ': 've', 'ヴォ': 'vo',
  'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo',
  'ティ': 'ti', 'ディ': 'di', 'トゥ': 'tu', 'ドゥ': 'du',
  'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo',
  'シェ': 'she', 'ジェ': 'je', 'チェ': 'che',
  'ツァ': 'tsa', 'ツィ': 'tsi', 'ツェ': 'tse', 'ツォ': 'tso',
  'ファ': 'fa', 'フュ': 'fyu',
  // Small characters
  'ァ': 'a', 'ィ': 'i', 'ゥ': 'u', 'ェ': 'e', 'ォ': 'o',
  'ャ': 'ya', 'ュ': 'yu', 'ョ': 'yo',
  'ッ': 'tsu', // Small tsu (doubles consonant)
  'ー': '-', // Long vowel mark
};

// Get sorted katakana keys by length (longest first for matching)
const KATAKANA_KEYS = Object.keys(KATAKANA_MAP).sort((a, b) => b.length - a.length);

function breakdownKana(kana: string): { chars: string[]; romaji: string[] } {
  const chars: string[] = [];
  const romaji: string[] = [];
  let i = 0;
  
  while (i < kana.length) {
    let matched = false;
    
    // Try each katakana key (longest first)
    for (const key of KATAKANA_KEYS) {
      if (kana.startsWith(key, i)) {
        chars.push(key);
        romaji.push(KATAKANA_MAP[key]);
        i += key.length;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // Unknown character - keep it as-is
      chars.push(kana[i]);
      romaji.push(kana[i]);
      i++;
    }
  }
  
  return { chars, romaji };
}

const TOTAL_POKEMON = 1025;
const CACHE_KEY = "pokemon-kana-cache";

export default function PokemonKanaSpellerPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>([]);
  const [availableKana, setAvailableKana] = useState<string[]>([]);
  const [draggedKana, setDraggedKana] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [generation, setGeneration] = useState<number>(0); // 0 = all
  const [seen, setSeen] = useState<Set<number>>(new Set());

  // Load cached data
  useEffect(() => {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      try {
        const cached = JSON.parse(saved);
        if (cached.pokemon && cached.pokemon.length > 0) {
          setAllPokemon(cached.pokemon);
        }
      } catch (e) {
        console.error("Failed to load cache:", e);
      }
    }
    
    const savedScore = localStorage.getItem("pokemon-kana-score");
    if (savedScore) setScore(parseInt(savedScore, 10) || 0);
    
    const savedSeen = localStorage.getItem("pokemon-kana-seen");
    if (savedSeen) setSeen(new Set(JSON.parse(savedSeen)));
  }, []);

  // Save data
  useEffect(() => {
    if (allPokemon.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ pokemon: allPokemon, timestamp: Date.now() }));
    }
  }, [allPokemon]);

  useEffect(() => {
    localStorage.setItem("pokemon-kana-score", String(score));
  }, [score]);

  useEffect(() => {
    localStorage.setItem("pokemon-kana-seen", JSON.stringify([...seen]));
  }, [seen]);

  // Fetch all Pokemon data
  const fetchAllPokemon = useCallback(async () => {
    setPhase("loading");
    setLoadingProgress({ loaded: allPokemon.length, total: TOTAL_POKEMON });
    
    const startId = allPokemon.length + 1;
    const pokemon: Pokemon[] = [...allPokemon];
    
    for (let id = startId; id <= TOTAL_POKEMON; id++) {
      try {
        // Fetch Pokemon basic data
        const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!pokemonRes.ok) continue;
        const pokemonData = await pokemonRes.json();
        
        // Fetch species data for Japanese name
        const speciesRes = await fetch(pokemonData.species.url);
        if (!speciesRes.ok) continue;
        const speciesData = await speciesRes.json();
        
        // Find Japanese name
        const japaneseName = speciesData.names.find((n: any) => n.language.name === 'ja')?.name;
        if (!japaneseName) continue;
        
        // Format English name
        let englishName = pokemonData.name;
        // Handle special forms
        if (englishName.includes('-')) {
          const parts = englishName.split('-');
          englishName = parts[0];
          // Keep form suffix for some
          if (['mega', 'gmax', 'alola', 'galar', 'hisui', 'paldea'].includes(parts[1])) {
            englishName = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          }
        }
        englishName = englishName.charAt(0).toUpperCase() + englishName.slice(1);
        
        // Break down katakana
        const { chars, romaji } = breakdownKana(japaneseName);
        
        pokemon.push({
          id,
          name: englishName,
          japanese: japaneseName,
          romaji: romaji.join('').replace(/-/g, ''),
          kana: chars,
          romajiParts: romaji.map(r => r.replace(/-/g, '')),
          sprite: pokemonData.sprites.front_default || 
                  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        });
        
        setLoadingProgress({ loaded: id, total: TOTAL_POKEMON });
        
        // Update cache periodically
        if (id % 50 === 0) {
          setAllPokemon([...pokemon]);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 50));
      } catch (e) {
        console.error(`Error fetching Pokemon ${id}:`, e);
      }
    }
    
    setAllPokemon(pokemon);
    setPhase("menu");
  }, [allPokemon]);

  const shuffleKana = useCallback((kana: string[]) => {
    const shuffled = [...kana];
    // Add distractors
    const allKana = Object.keys(KATAKANA_MAP).filter(k => k.length === 1 || k.length === 2);
    const numDistractors = Math.min(4, kana.length);
    for (let i = 0; i < numDistractors; i++) {
      const distractor = allKana[Math.floor(Math.random() * allKana.length)];
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
    if (gen !== undefined) {
      setGeneration(gen);
    }
    
    // Filter by generation if selected
    let pool = allPokemon;
    if (gen !== undefined && gen !== 0) {
      const genRanges: Record<number, [number, number]> = {
        1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
        5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
      };
      const [start, end] = genRanges[gen] || [1, 1025];
      pool = allPokemon.filter(p => p.id >= start && p.id <= end);
    }
    
    // Filter out completed, or use all if all completed
    const available = pool.filter(p => !completed.has(p.id));
    if (available.length === 0) {
      // Reset for this generation
      const pokemon = pool[Math.floor(Math.random() * pool.length)];
      setCurrentPokemon(pokemon);
    } else {
      const pokemon = available[Math.floor(Math.random() * available.length)];
      setCurrentPokemon(pokemon);
    }
    
    if (!currentPokemon && pool.length === 0) return;
    
    const pokemon = currentPokemon || pool[Math.floor(Math.random() * pool.length)];
    setCurrentPokemon(pokemon);
    setFilledSlots(new Array(pokemon.kana.length).fill(null));
    setAvailableKana(shuffleKana(pokemon.kana));
    setShowHint(false);
    setPhase("playing");
  }, [allPokemon, completed, currentPokemon, shuffleKana]);

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

  // Get generations
  const generations = [
    { num: 0, name: "All Pokémon", range: "" },
    { num: 1, name: "Gen 1 (Kanto)", range: "1-151" },
    { num: 2, name: "Gen 2 (Johto)", range: "152-251" },
    { num: 3, name: "Gen 3 (Hoenn)", range: "252-386" },
    { num: 4, name: "Gen 4 (Sinnoh)", range: "387-493" },
    { num: 5, name: "Gen 5 (Unova)", range: "494-649" },
    { num: 6, name: "Gen 6 (Kalos)", range: "650-721" },
    { num: 7, name: "Gen 7 (Alola)", range: "722-809" },
    { num: 8, name: "Gen 8 (Galar)", range: "810-905" },
    { num: 9, name: "Gen 9 (Paldea)", range: "906-1025" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-red-500 p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
          ⚡ ポケモン カナ Speller ⚡
        </h1>
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

      {phase === "menu" && (
        <div className="max-w-2xl mx-auto">
          {/* Data status */}
          {allPokemon.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 shadow-xl mb-4 text-center">
              <div className="text-4xl mb-2">📥</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Download Pokémon Data</h2>
              <p className="text-gray-600 mb-4">Click below to load all {TOTAL_POKEMON} Pokémon with their Japanese names!</p>
              <button
                onClick={fetchAllPokemon}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600"
              >
                Download All Pokémon
              </button>
            </div>
          ) : allPokemon.length < TOTAL_POKEMON ? (
            <div className="bg-yellow-100 rounded-2xl p-4 shadow-xl mb-4 text-center">
              <p className="font-bold">⚠️ {allPokemon.length}/{TOTAL_POKEMON} Pokémon loaded</p>
              <button onClick={fetchAllPokemon} className="mt-2 px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg">
                Continue Loading
              </button>
            </div>
          ) : (
            <div className="bg-green-100 rounded-2xl p-3 shadow mb-4 text-center">
              <p className="font-bold text-green-700">✅ All {TOTAL_POKEMON} Pokémon loaded!</p>
            </div>
          )}

          {/* Generation selector */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Choose a Generation</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {generations.map(gen => (
                <button
                  key={gen.num}
                  onClick={() => startGame(gen.num)}
                  disabled={allPokemon.length === 0}
                  className={`p-3 rounded-xl font-bold text-sm transition-all ${
                    allPokemon.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-br from-blue-400 to-purple-500 text-white hover:scale-105 shadow"
                  }`}
                >
                  <div>{gen.name}</div>
                  {gen.range && <div className="text-xs opacity-75">#{gen.range}</div>}
                </button>
              ))}
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

      {phase === "loading" && (
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Pokémon...</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-red-500 h-4 rounded-full transition-all"
              style={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-gray-600">{loadingProgress.loaded} / {loadingProgress.total}</p>
          <p className="text-sm text-gray-400 mt-2">This may take a few minutes on first load</p>
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
