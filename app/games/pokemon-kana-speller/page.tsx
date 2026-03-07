"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

type GamePhase = "menu" | "loading" | "playing" | "complete";
type Mode = "generation" | "kana";

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

// All individual kana characters for selection
const ALL_KANA = [
  // Vowels
  { kana: 'ア', romaji: 'a' }, { kana: 'イ', romaji: 'i' }, { kana: 'ウ', romaji: 'u' }, { kana: 'エ', romaji: 'e' }, { kana: 'オ', romaji: 'o' },
  // K-row
  { kana: 'カ', romaji: 'ka' }, { kana: 'キ', romaji: 'ki' }, { kana: 'ク', romaji: 'ku' }, { kana: 'ケ', romaji: 'ke' }, { kana: 'コ', romaji: 'ko' },
  // S-row
  { kana: 'サ', romaji: 'sa' }, { kana: 'シ', romaji: 'shi' }, { kana: 'ス', romaji: 'su' }, { kana: 'セ', romaji: 'se' }, { kana: 'ソ', romaji: 'so' },
  // T-row
  { kana: 'タ', romaji: 'ta' }, { kana: 'チ', romaji: 'chi' }, { kana: 'ツ', romaji: 'tsu' }, { kana: 'テ', romaji: 'te' }, { kana: 'ト', romaji: 'to' },
  // N-row
  { kana: 'ナ', romaji: 'na' }, { kana: 'ニ', romaji: 'ni' }, { kana: 'ヌ', romaji: 'nu' }, { kana: 'ネ', romaji: 'ne' }, { kana: 'ノ', romaji: 'no' },
  // H-row
  { kana: 'ハ', romaji: 'ha' }, { kana: 'ヒ', romaji: 'hi' }, { kana: 'フ', romaji: 'fu' }, { kana: 'ヘ', romaji: 'he' }, { kana: 'ホ', romaji: 'ho' },
  // M-row
  { kana: 'マ', romaji: 'ma' }, { kana: 'ミ', romaji: 'mi' }, { kana: 'ム', romaji: 'mu' }, { kana: 'メ', romaji: 'me' }, { kana: 'モ', romaji: 'mo' },
  // Y-row
  { kana: 'ヤ', romaji: 'ya' }, { kana: 'ユ', romaji: 'yu' }, { kana: 'ヨ', romaji: 'yo' },
  // R-row
  { kana: 'ラ', romaji: 'ra' }, { kana: 'リ', romaji: 'ri' }, { kana: 'ル', romaji: 'ru' }, { kana: 'レ', romaji: 're' }, { kana: 'ロ', romaji: 'ro' },
  // W-row
  { kana: 'ワ', romaji: 'wa' }, { kana: 'ヲ', romaji: 'wo' }, { kana: 'ン', romaji: 'n' },
  // G-row
  { kana: 'ガ', romaji: 'ga' }, { kana: 'ギ', romaji: 'gi' }, { kana: 'グ', romaji: 'gu' }, { kana: 'ゲ', romaji: 'ge' }, { kana: 'ゴ', romaji: 'go' },
  // Z-row
  { kana: 'ザ', romaji: 'za' }, { kana: 'ジ', romaji: 'ji' }, { kana: 'ズ', romaji: 'zu' }, { kana: 'ゼ', romaji: 'ze' }, { kana: 'ゾ', romaji: 'zo' },
  // D-row
  { kana: 'ダ', romaji: 'da' }, { kana: 'ヂ', romaji: 'ji' }, { kana: 'ヅ', romaji: 'zu' }, { kana: 'デ', romaji: 'de' }, { kana: 'ド', romaji: 'do' },
  // B-row
  { kana: 'バ', romaji: 'ba' }, { kana: 'ビ', romaji: 'bi' }, { kana: 'ブ', romaji: 'bu' }, { kana: 'ベ', romaji: 'be' }, { kana: 'ボ', romaji: 'bo' },
  // P-row
  { kana: 'パ', romaji: 'pa' }, { kana: 'ピ', romaji: 'pi' }, { kana: 'プ', romaji: 'pu' }, { kana: 'ペ', romaji: 'pe' }, { kana: 'ポ', romaji: 'po' },
  // Special
  { kana: 'ヴ', romaji: 'vu' }, { kana: 'ー', romaji: '-' },
];

// Kana to Romaji lookup
const KANA_TO_ROMAJI: Record<string, string> = {
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
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  'ヴ': 'vu', 'ー': '-',
  'ァ': 'a', 'ィ': 'i', 'ゥ': 'u', 'ェ': 'e', 'ォ': 'o',
  'ャ': 'ya', 'ュ': 'yu', 'ョ': 'yo', 'ッ': 'tsu',
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
  'ヴァ': 'va', 'ヴィ': 'vi', 'ヴェ': 've', 'ヴォ': 'vo',
  'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo',
  'ティ': 'ti', 'ディ': 'di', 'トゥ': 'tu',
  'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo',
  'シェ': 'she', 'ジェ': 'je', 'チェ': 'che',
};

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

function getRomaji(kana: string): string {
  return KANA_TO_ROMAJI[kana] || kana;
}

export default function PokemonKanaSpellerPage() {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [mode, setMode] = useState<Mode>("generation");
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>([]);
  const [availableKana, setAvailableKana] = useState<{kana: string, romaji: string}[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [generation, setGeneration] = useState<number>(0);
  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [kanaPool, setKanaPool] = useState<Pokemon[]>([]);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  // Calculate kana usage counts
  const kanaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allPokemon.forEach(p => {
      p.kana.forEach(k => {
        if (k.length === 1) {
          counts[k] = (counts[k] || 0) + 1;
        }
      });
    });
    return counts;
  }, [allPokemon]);

  // Get Pokemon containing a specific kana
  const getPokemonWithKana = useCallback((kana: string) => {
    return allPokemon.filter(p => p.kana.includes(kana));
  }, [allPokemon]);

  useEffect(() => {
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
    const shuffled = kana.map(k => ({ kana: k, romaji: getRomaji(k) }));
    const allKanaChars = Object.keys(KANA_TO_ROMAJI).filter(k => k.length === 1);
    const numDistractors = Math.min(4, Math.max(2, kana.length));
    for (let i = 0; i < numDistractors; i++) {
      const distractor = allKanaChars[Math.floor(Math.random() * allKanaChars.length)];
      if (!shuffled.find(s => s.kana === distractor)) {
        shuffled.push({ kana: distractor, romaji: getRomaji(distractor) });
      }
    }
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

  // Start game by generation
  const startGameByGeneration = useCallback((gen: number) => {
    setMode("generation");
    setGeneration(gen);
    
    const genData = GENERATIONS.find(g => g.num === gen) || GENERATIONS[0];
    const pool = allPokemon.filter(p => p.id >= genData.start && p.id <= genData.end);
    const available = pool.filter(p => !completed.has(p.id));
    const pokemon = available.length > 0 
      ? available[Math.floor(Math.random() * available.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    
    setSelectedKana(null);
    setKanaPool([]);
    setCurrentPokemon(pokemon);
    setFilledSlots(new Array(pokemon.kana.length).fill(null));
    setAvailableKana(shuffleKana(pokemon.kana));
    setPhase("playing");
  }, [allPokemon, completed, shuffleKana]);

  // Start game by kana
  const startGameByKana = useCallback((kana: string) => {
    setMode("kana");
    setSelectedKana(kana);
    
    const pool = getPokemonWithKana(kana);
    setKanaPool(pool);
    
    const available = pool.filter(p => !completed.has(p.id));
    const pokemon = available.length > 0 
      ? available[Math.floor(Math.random() * available.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    
    setCurrentPokemon(pokemon);
    setFilledSlots(new Array(pokemon.kana.length).fill(null));
    setAvailableKana(shuffleKana(pokemon.kana));
    setPhase("playing");
  }, [getPokemonWithKana, completed, shuffleKana]);

  // Next Pokemon in current mode
  const nextPokemon = useCallback(() => {
    if (!currentPokemon) return;
    
    let pool: Pokemon[] = [];
    
    if (mode === "kana" && selectedKana) {
      pool = kanaPool.filter(p => !completed.has(p.id));
      if (pool.length === 0) {
        pool = kanaPool;
      }
    } else {
      const genData = GENERATIONS.find(g => g.num === generation) || GENERATIONS[0];
      pool = allPokemon.filter(p => p.id >= genData.start && p.id <= genData.end);
      pool = pool.filter(p => !completed.has(p.id));
      if (pool.length === 0) {
        pool = allPokemon.filter(p => p.id >= genData.start && p.id <= genData.end);
      }
    }
    
    if (pool.length === 0) return;
    
    const pokemon = pool[Math.floor(Math.random() * pool.length)];
    setCurrentPokemon(pokemon);
    setFilledSlots(new Array(pokemon.kana.length).fill(null));
    setAvailableKana(shuffleKana(pokemon.kana));
    setPhase("playing");
  }, [mode, selectedKana, kanaPool, generation, allPokemon, completed, currentPokemon, shuffleKana]);

  const handlePlace = useCallback((slotIndex: number, kana: string) => {
    if (!currentPokemon || filledSlots[slotIndex] !== null) return;
    
    const correctKana = currentPokemon.kana[slotIndex];
    
    if (kana === correctKana) {
      const newFilled = [...filledSlots];
      newFilled[slotIndex] = kana;
      setFilledSlots(newFilled);
      
      setAvailableKana(prev => {
        const idx = prev.findIndex(k => k.kana === kana);
        if (idx > -1) {
          const newAvailable = [...prev];
          newAvailable.splice(idx, 1);
          return newAvailable;
        }
        return prev;
      });
      
      speakJapanese(kana);
      
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
      setStreak(0);
    }
  }, [currentPokemon, filledSlots, speakJapanese, streak]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-red-500 p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
          ⚡ ポケモン カナ Speller ⚡
        </h1>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <span className="bg-white/30 rounded-full px-3 py-1 text-white font-bold text-xs">
            Score: {score}
          </span>
          <span className="bg-white/30 rounded-full px-3 py-1 text-white font-bold text-xs">
            Streak: {streak}🔥
          </span>
          <span className="bg-white/30 rounded-full px-3 py-1 text-white font-bold text-xs">
            Seen: {seen.size}/{TOTAL_POKEMON}
          </span>
        </div>
      </div>

      {phase === "loading" && (
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="text-6xl mb-4 animate-bounce">⚡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Pokémon...</h2>
        </div>
      )}

      {phase === "menu" && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-green-100 rounded-2xl p-3 shadow mb-4 text-center">
            <p className="font-bold text-green-700">✅ All {TOTAL_POKEMON} Pokémon loaded!</p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("generation")}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                mode === "generation"
                  ? "bg-white text-purple-600 shadow-lg"
                  : "bg-white/30 text-white hover:bg-white/50"
              }`}
            >
              🎮 By Generation
            </button>
            <button
              onClick={() => setMode("kana")}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                mode === "kana"
                  ? "bg-white text-purple-600 shadow-lg"
                  : "bg-white/30 text-white hover:bg-white/50"
              }`}
            >
              📝 By Character
            </button>
          </div>

          {mode === "generation" && (
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Choose a Generation</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {GENERATIONS.map(gen => (
                  <button
                    key={gen.num}
                    onClick={() => startGameByGeneration(gen.num)}
                    className="p-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-br from-blue-400 to-purple-500 text-white hover:scale-105 shadow"
                  >
                    <div>{gen.name}</div>
                    {gen.range && <div className="text-xs opacity-75">#{gen.range}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "kana" && (
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Choose a Character</h2>
              <p className="text-center text-sm text-gray-500 mb-4">
                Practice all Pokémon containing a specific kana!
              </p>
              
              {/* Kana grid organized by rows */}
              <div className="space-y-2">
                {[
                  ['ア','イ','ウ','エ','オ'],
                  ['カ','キ','ク','ケ','コ'],
                  ['サ','シ','ス','セ','ソ'],
                  ['タ','チ','ツ','テ','ト'],
                  ['ナ','ニ','ヌ','ネ','ノ'],
                  ['ハ','ヒ','フ','ヘ','ホ'],
                  ['マ','ミ','ム','メ','モ'],
                  ['ヤ','ユ','ヨ'],
                  ['ラ','リ','ル','レ','ロ'],
                  ['ワ','ヲ','ン'],
                  ['ガ','ギ','グ','ゲ','ゴ'],
                  ['ザ','ジ','ズ','ゼ','ゾ'],
                  ['ダ','ヂ','ヅ','デ','ド'],
                  ['バ','ビ','ブ','ベ','ボ'],
                  ['パ','ピ','プ','ペ','ポ'],
                ].map((row, rowIdx) => (
                  <div key={rowIdx} className="flex justify-center gap-1 flex-wrap">
                    {row.map(kana => {
                      const info = ALL_KANA.find(k => k.kana === kana);
                      const count = kanaCounts[kana] || 0;
                      return (
                        <button
                          key={kana}
                          onClick={() => startGameByKana(kana)}
                          disabled={count === 0}
                          className={`flex flex-col items-center w-12 h-14 rounded-lg transition-all
                            ${count > 0
                              ? "bg-gradient-to-br from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 hover:scale-105 border-2 border-purple-200"
                              : "bg-gray-100 opacity-40 cursor-not-allowed"
                            }`}
                        >
                          <span className="text-xl font-bold text-gray-800">{kana}</span>
                          <span className="text-[10px] text-gray-500">{info?.romaji}</span>
                          <span className="text-[9px] text-purple-500 font-bold">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              <p className="text-center text-xs text-gray-400 mt-4">
                Numbers show how many Pokémon contain each character
              </p>
            </div>
          )}

          <div className="mt-4 p-3 bg-white/50 rounded-xl text-sm text-white">
            <p className="font-bold mb-1">How to Play:</p>
            <p>• Match kana tiles to spell the Pokémon name</p>
            <p>• Each tile shows the romaji pronunciation</p>
            <p>• Tap matching tiles to fill the word!</p>
          </div>
        </div>
      )}

      {phase === "playing" && currentPokemon && (
        <div className="max-w-2xl mx-auto">
          {/* Mode indicator */}
          {mode === "kana" && selectedKana && (
            <div className="text-center mb-2">
              <span className="bg-white/30 rounded-full px-3 py-1 text-white font-bold text-sm">
                Practicing: {selectedKana} ({getRomaji(selectedKana)}) - {kanaPool.length} Pokémon
              </span>
            </div>
          )}

          {/* Pokémon Card */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl mb-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <img
                src={currentPokemon.sprite}
                alt={currentPokemon.name}
                className="w-24 h-24 md:w-32 md:h-32 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-gray-500">#{currentPokemon.id}</p>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">{currentPokemon.name}</h2>
                <p className="text-gray-600">{currentPokemon.romaji}</p>
              </div>
            </div>

            {/* Kana Slots */}
            <div className="mt-4">
              <div className="flex justify-center gap-1.5 md:gap-2 flex-wrap">
                {filledSlots.map((filled, index) => {
                  const targetKana = currentPokemon.kana[index];
                  const targetRomaji = getRomaji(targetKana);
                  const isTargetKana = mode === "kana" && selectedKana && targetKana === selectedKana;
                  
                  return (
                    <div
                      key={index}
                      onClick={() => {}}
                      className={`relative flex flex-col items-center transition-all
                        ${filled ? "scale-105" : "hover:scale-105"}`}
                    >
                      <div
                        className={`w-14 h-16 md:w-16 md:h-20 rounded-xl border-3 flex flex-col items-center justify-center
                          transition-all
                          ${filled
                            ? "bg-green-100 border-green-500 shadow-lg"
                            : isTargetKana
                              ? "bg-yellow-50 border-yellow-400 border-dashed"
                              : "bg-gray-50 border-dashed border-gray-300"
                          }`}
                      >
                        {filled ? (
                          <span className="text-2xl md:text-3xl font-bold text-green-700">{filled}</span>
                        ) : (
                          <span className={`text-2xl md:text-3xl font-bold select-none ${
                            isTargetKana ? "text-yellow-300" : "text-gray-200"
                          }`}>
                            {targetKana}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] md:text-xs font-semibold mt-0.5
                        ${filled ? "text-green-600" : "text-gray-400"}`}>
                        {targetRomaji}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => speakJapanese(currentPokemon.japanese)}
                className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-lg text-sm font-bold"
              >
                🔊 Listen
              </button>
            </div>
          </div>

          {/* Available Kana Tiles */}
          <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
            <p className="text-center text-sm text-gray-600 font-semibold mb-3">
              Tap the matching kana:
            </p>
            <div className="flex justify-center gap-1.5 md:gap-2 flex-wrap">
              {availableKana.map((item, index) => (
                <button
                  key={`${item.kana}-${index}`}
                  onClick={() => {
                    for (let i = 0; i < currentPokemon.kana.length; i++) {
                      if (filledSlots[i] === null && item.kana === currentPokemon.kana[i]) {
                        handlePlace(i, item.kana);
                        break;
                      }
                    }
                  }}
                  className={`flex flex-col items-center rounded-xl shadow-lg hover:scale-110 transition-transform
                    active:scale-95 w-12 h-14 md:w-14 md:h-16
                    ${mode === "kana" && selectedKana === item.kana
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                      : "bg-gradient-to-br from-blue-500 to-purple-600"
                    } text-white`}
                >
                  <span className="text-xl md:text-2xl font-bold mt-0.5">{item.kana}</span>
                  <span className="text-[9px] md:text-[10px] font-semibold opacity-80">{item.romaji}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-4 flex justify-center gap-2">
            <button
              onClick={nextPokemon}
              className="px-4 py-2 bg-white/50 text-white font-bold rounded-lg hover:bg-white/70"
            >
              ⏭️ Skip
            </button>
            <button
              onClick={() => setPhase("menu")}
              className="px-4 py-2 bg-white/30 text-white font-bold rounded-lg hover:bg-white/50"
            >
              📋 Menu
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
                onClick={nextPokemon}
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
