"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

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

const ALL_KANA = [
  { kana: 'ア', romaji: 'a', strokes: 2 }, { kana: 'イ', romaji: 'i', strokes: 2 }, 
  { kana: 'ウ', romaji: 'u', strokes: 3 }, { kana: 'エ', romaji: 'e', strokes: 2 }, 
  { kana: 'オ', romaji: 'o', strokes: 3 },
  { kana: 'カ', romaji: 'ka', strokes: 2 }, { kana: 'キ', romaji: 'ki', strokes: 2 }, 
  { kana: 'ク', romaji: 'ku', strokes: 2 }, { kana: 'ケ', romaji: 'ke', strokes: 3 }, 
  { kana: 'コ', romaji: 'ko', strokes: 2 },
  { kana: 'サ', romaji: 'sa', strokes: 3 }, { kana: 'シ', romaji: 'shi', strokes: 3 }, 
  { kana: 'ス', romaji: 'su', strokes: 2 }, { kana: 'セ', romaji: 'se', strokes: 2 }, 
  { kana: 'ソ', romaji: 'so', strokes: 2 },
  { kana: 'タ', romaji: 'ta', strokes: 4 }, { kana: 'チ', romaji: 'chi', strokes: 3 }, 
  { kana: 'ツ', romaji: 'tsu', strokes: 3 }, { kana: 'テ', romaji: 'te', strokes: 3 }, 
  { kana: 'ト', romaji: 'to', strokes: 2 },
  { kana: 'ナ', romaji: 'na', strokes: 2 }, { kana: 'ニ', romaji: 'ni', strokes: 3 }, 
  { kana: 'ヌ', romaji: 'nu', strokes: 4 }, { kana: 'ネ', romaji: 'ne', strokes: 4 }, 
  { kana: 'ノ', romaji: 'no', strokes: 1 },
  { kana: 'ハ', romaji: 'ha', strokes: 2 }, { kana: 'ヒ', romaji: 'hi', strokes: 2 }, 
  { kana: 'フ', romaji: 'fu', strokes: 1 }, { kana: 'ヘ', romaji: 'he', strokes: 1 }, 
  { kana: 'ホ', romaji: 'ho', strokes: 4 },
  { kana: 'マ', romaji: 'ma', strokes: 3 }, { kana: 'ミ', romaji: 'mi', strokes: 3 }, 
  { kana: 'ム', romaji: 'mu', strokes: 2 }, { kana: 'メ', romaji: 'me', strokes: 2 }, 
  { kana: 'モ', romaji: 'mo', strokes: 3 },
  { kana: 'ヤ', romaji: 'ya', strokes: 3 }, { kana: 'ユ', romaji: 'yu', strokes: 2 }, 
  { kana: 'ヨ', romaji: 'yo', strokes: 3 },
  { kana: 'ラ', romaji: 'ra', strokes: 2 }, { kana: 'リ', romaji: 'ri', strokes: 2 }, 
  { kana: 'ル', romaji: 'ru', strokes: 2 }, { kana: 'レ', romaji: 're', strokes: 1 }, 
  { kana: 'ロ', romaji: 'ro', strokes: 3 },
  { kana: 'ワ', romaji: 'wa', strokes: 2 }, { kana: 'ヲ', romaji: 'wo', strokes: 3 }, 
  { kana: 'ン', romaji: 'n', strokes: 1 },
  { kana: 'ガ', romaji: 'ga', strokes: 3 }, { kana: 'ギ', romaji: 'gi', strokes: 3 }, 
  { kana: 'グ', romaji: 'gu', strokes: 3 }, { kana: 'ゲ', romaji: 'ge', strokes: 4 }, 
  { kana: 'ゴ', romaji: 'go', strokes: 3 },
  { kana: 'ザ', romaji: 'za', strokes: 4 }, { kana: 'ジ', romaji: 'ji', strokes: 4 }, 
  { kana: 'ズ', romaji: 'zu', strokes: 3 }, { kana: 'ゼ', romaji: 'ze', strokes: 3 }, 
  { kana: 'ゾ', romaji: 'zo', strokes: 3 },
  { kana: 'ダ', romaji: 'da', strokes: 5 }, { kana: 'ヂ', romaji: 'ji', strokes: 4 }, 
  { kana: 'ヅ', romaji: 'zu', strokes: 4 }, { kana: 'デ', romaji: 'de', strokes: 4 }, 
  { kana: 'ド', romaji: 'do', strokes: 3 },
  { kana: 'バ', romaji: 'ba', strokes: 3 }, { kana: 'ビ', romaji: 'bi', strokes: 3 }, 
  { kana: 'ブ', romaji: 'bu', strokes: 2 }, { kana: 'ベ', romaji: 'be', strokes: 2 }, 
  { kana: 'ボ', romaji: 'bo', strokes: 5 },
  { kana: 'パ', romaji: 'pa', strokes: 3 }, { kana: 'ピ', romaji: 'pi', strokes: 3 }, 
  { kana: 'プ', romaji: 'pu', strokes: 2 }, { kana: 'ペ', romaji: 'pe', strokes: 2 }, 
  { kana: 'ポ', romaji: 'po', strokes: 5 },
  { kana: 'ヴ', romaji: 'vu', strokes: 2 }, { kana: 'ー', romaji: '-', strokes: 1 },
];

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
  'ヴ': 'vu', 'ー': '-', 'ァ': 'a', 'ィ': 'i', 'ゥ': 'u', 'ェ': 'e', 'ォ': 'o',
  'ャ': 'ya', 'ュ': 'yu', 'ョ': 'yo', 'ッ': 'tsu',
};

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

function getKanaInfo(kana: string) {
  return ALL_KANA.find(k => k.kana === kana);
}

// Sparkle Animation Component
function Sparkles({ active, x, y }: { active: boolean; x: number; y: number }) {
  if (!active) return null;
  
  const sparkles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30) * (Math.PI / 180);
    const distance = 60 + Math.random() * 40;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: Math.random() * 0.2,
      size: 12 + Math.random() * 16,
      emoji: ['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)],
    };
  });

  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle"
          style={{
            '--sparkle-x': `${sparkle.x}px`,
            '--sparkle-y': `${sparkle.y}px`,
            animationDelay: `${sparkle.delay}s`,
            fontSize: sparkle.size,
          } as React.CSSProperties}
        >
          {sparkle.emoji}
        </div>
      ))}
      <style jsx>{`
        @keyframes sparkle {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(var(--sparkle-x), var(--sparkle-y)) scale(1);
            opacity: 0;
          }
        }
        .animate-sparkle {
          animation: sparkle 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Drawing Canvas Component - Auto-detects completion by checking character overlap
function DrawingCanvas({ 
  targetKana, 
  onComplete,
  onSparkle
}: { 
  targetKana: string; 
  onComplete: () => void;
  onSparkle: (x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const characterMaskRef = useRef<Uint8Array | null>(null);
  const characterPixelCountRef = useRef(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [completionPercent, setCompletionPercent] = useState(0);
  const lastPosRef = useRef<{x: number, y: number} | null>(null);
  const completedRef = useRef(false);
  
  const kanaInfo = getKanaInfo(targetKana);
  const requiredStrokes = kanaInfo?.strokes || 2;

  // Create character mask when targetKana changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Clear user drawing
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create hidden canvas for character mask
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement('canvas');
    }
    const maskCanvas = maskCanvasRef.current;
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;
    
    // Draw the kana character to get its shape
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.font = '180px sans-serif';
    maskCtx.textAlign = 'center';
    maskCtx.textBaseline = 'middle';
    maskCtx.fillStyle = 'black';
    maskCtx.fillText(targetKana, maskCanvas.width / 2, maskCanvas.height / 2);
    
    // Extract mask - which pixels are part of the character
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;
    const mask = new Uint8Array(maskCanvas.width * maskCanvas.height);
    let pixelCount = 0;
    
    // A pixel is part of the character if it's darker than light gray
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // Character pixels are dark (black text on white bg)
      if (brightness < 200) {
        mask[i / 4] = 1;
        pixelCount++;
      }
    }
    
    characterMaskRef.current = mask;
    characterPixelCountRef.current = pixelCount;
    setStrokeCount(0);
    setCompletionPercent(0);
    completedRef.current = false;
  }, [targetKana]);

  // Check what percentage of the character has been traced
  const checkCoverage = useCallback(() => {
    const canvas = canvasRef.current;
    const mask = characterMaskRef.current;
    if (!canvas || !mask) return 0;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Count how many character pixels have been drawn over
    let tracedPixels = 0;
    
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 1) {
        // This pixel is part of the character - check if user drew here
        const idx = i * 4;
        // Check for blue drawing color
        if (data[idx + 2] > 200 && data[idx + 3] > 0) {
          tracedPixels++;
        }
      }
    }
    
    const totalCharacterPixels = characterPixelCountRef.current;
    if (totalCharacterPixels === 0) return 0;
    
    return tracedPixels / totalCharacterPixels;
  }, []);

  // Clear canvas manually
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeCount(0);
    completedRef.current = false;
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (completedRef.current) return; // Don't draw if completed
    const pos = getPos(e);
    if (!pos) return;
    setIsDrawing(true);
    lastPosRef.current = pos;
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || completedRef.current) return;
    const canvas = canvasRef.current;
    const pos = getPos(e);
    if (!canvas || !pos || !lastPosRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastPosRef.current = pos;
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;
    
    if (completedRef.current) return;
    
    // Count this stroke
    const newStrokeCount = strokeCount + 1;
    setStrokeCount(newStrokeCount);
    
    // Check coverage - what percentage of character is traced
    const percent = checkCoverage();
    setCompletionPercent(Math.round(percent * 100));
    
    // Auto-complete if enough strokes AND enough coverage (35% of character traced)
    if (newStrokeCount >= requiredStrokes && percent >= 0.35) {
      completedRef.current = true;
      
      // Short delay for satisfaction
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          onSparkle(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
        onComplete();
      }, 200);
    }
  }, [isDrawing, strokeCount, requiredStrokes, checkCoverage, onSparkle, onComplete]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-3">
        <p className="text-lg font-bold text-gray-800">
          Draw: <span className="text-3xl text-blue-600">{targetKana}</span>
        </p>
        <p className="text-sm text-gray-500">
          {requiredStrokes} strokes • {kanaInfo?.romaji || getRomaji(targetKana)}
        </p>
        <div className="flex justify-center gap-1 mt-1">
          {Array.from({ length: requiredStrokes }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < strokeCount ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-xs mt-1 font-semibold" style={{ color: completionPercent >= 35 ? '#22c55e' : '#6b7280' }}>
          {completionPercent}% traced {completionPercent >= 35 && '✓'}
        </p>
      </div>

      <div className="relative bg-white rounded-2xl border-4 border-blue-200 shadow-lg overflow-hidden">
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          aria-hidden="true"
        >
          <span className="text-[180px] text-gray-200 leading-none">
            {targetKana}
          </span>
        </div>
        
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="relative z-10 touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <p className="text-xs text-gray-400 mt-2">
        💡 Trace the gray character - it auto-completes when done!
      </p>

      <button
        onClick={clearCanvas}
        className="mt-3 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-sm"
      >
        🗑️ Clear
      </button>
    </div>
  );
}

export default function PokemonKanaSpellerPage() {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [mode, setMode] = useState<Mode>("generation");
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [generation, setGeneration] = useState<number>(0);
  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [kanaPool, setKanaPool] = useState<Pokemon[]>([]);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  
  const [sparklePos, setSparklePos] = useState({ x: 0, y: 0, active: false });
  const [slotSparkles, setSlotSparkles] = useState<Record<number, { x: number; y: number; active: boolean }>>({});
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      .catch(err => console.error('Failed to load Pokemon data:', err));
    
    const savedScore = localStorage.getItem("pokemon-kana-score");
    if (savedScore) setScore(parseInt(savedScore, 10) || 0);
    
    const savedSeen = localStorage.getItem("pokemon-kana-seen");
    if (savedSeen) {
      try { setSeen(new Set(JSON.parse(savedSeen))); } catch {}
    }
    
    const savedCompleted = localStorage.getItem("pokemon-kana-completed");
    if (savedCompleted) {
      try { setCompleted(new Set(JSON.parse(savedCompleted))); } catch {}
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

  const speakJapanese = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.75;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleCanvasSparkle = useCallback((x: number, y: number) => {
    setSparklePos({ x, y, active: true });
    setTimeout(() => setSparklePos(prev => ({ ...prev, active: false })), 700);
  }, []);

  const triggerSlotSparkle = useCallback((slotIndex: number) => {
    const slotEl = slotRefs.current[slotIndex];
    if (!slotEl) return;
    
    const rect = slotEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setSlotSparkles(prev => ({
      ...prev,
      [slotIndex]: { x, y, active: true }
    }));
    
    setTimeout(() => {
      setSlotSparkles(prev => ({
        ...prev,
        [slotIndex]: { ...prev[slotIndex], active: false }
      }));
    }, 700);
  }, []);

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
    setCurrentSlotIndex(0);
    setPhase("playing");
  }, [allPokemon, completed]);

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
    setCurrentSlotIndex(0);
    setPhase("playing");
  }, [getPokemonWithKana, completed]);

  const handleCharacterComplete = useCallback(() => {
    if (!currentPokemon) return;
    
    const kana = currentPokemon.kana[currentSlotIndex];
    speakJapanese(kana);
    
    const newFilled = [...filledSlots];
    newFilled[currentSlotIndex] = kana;
    setFilledSlots(newFilled);
    
    setTimeout(() => {
      triggerSlotSparkle(currentSlotIndex);
    }, 300);
    
    if (currentSlotIndex === currentPokemon.kana.length - 1) {
      setTimeout(() => {
        speakJapanese(currentPokemon.japanese);
        setScore(s => s + 10 + streak * 2);
        setStreak(st => st + 1);
        setCompleted(prev => new Set([...prev, currentPokemon.id]));
        setSeen(prev => new Set([...prev, currentPokemon.id]));
        setPhase("complete");
      }, 600);
    } else {
      setCurrentSlotIndex(currentSlotIndex + 1);
    }
  }, [currentPokemon, currentSlotIndex, filledSlots, speakJapanese, streak, triggerSlotSparkle]);

  const nextPokemon = useCallback(() => {
    if (!currentPokemon) return;
    
    let pool: Pokemon[] = [];
    
    if (mode === "kana" && selectedKana) {
      pool = kanaPool.filter(p => !completed.has(p.id));
      if (pool.length === 0) pool = kanaPool;
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
    setCurrentSlotIndex(0);
    setPhase("playing");
  }, [mode, selectedKana, kanaPool, generation, allPokemon, completed, currentPokemon]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-red-500 p-4">
      <Sparkles active={sparklePos.active} x={sparklePos.x} y={sparklePos.y} />
      {Object.entries(slotSparkles).map(([idx, pos]) => (
        <Sparkles key={idx} active={pos.active} x={pos.x} y={pos.y} />
      ))}

      <div className="text-center mb-4">
        <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
          ⚡ ポケモン カナ Writer ⚡
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
            <p className="text-xs text-green-600">Draw kana to spell Pokémon names!</p>
          </div>

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
                      const info = getKanaInfo(kana);
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
            <p>• Draw each kana - it auto-detects when done!</p>
            <p>• Trace the gray guide character</p>
            <p>• Complete all characters to win!</p>
          </div>
        </div>
      )}

      {phase === "playing" && currentPokemon && (
        <div className="max-w-lg mx-auto">
          {mode === "kana" && selectedKana && (
            <div className="text-center mb-2">
              <span className="bg-white/30 rounded-full px-3 py-1 text-white font-bold text-sm">
                Practicing: {selectedKana} ({getRomaji(selectedKana)}) - {kanaPool.length} Pokémon
              </span>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={currentPokemon.sprite}
                alt={currentPokemon.name}
                className="w-16 h-16"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="flex-1">
                <p className="text-xs text-gray-500">#{currentPokemon.id}</p>
                <h2 className="text-lg font-bold text-gray-800">{currentPokemon.name}</h2>
                <p className="text-sm text-gray-600">{currentPokemon.romaji}</p>
              </div>
              <button
                onClick={() => speakJapanese(currentPokemon.japanese)}
                className="p-2 bg-blue-500 text-white rounded-lg"
              >
                🔊
              </button>
            </div>
            
            <div className="flex justify-center gap-2 flex-wrap">
              {filledSlots.map((filled, index) => {
                const targetKana = currentPokemon.kana[index];
                const isCurrent = index === currentSlotIndex;
                const isTargetKana = mode === "kana" && selectedKana && targetKana === selectedKana;
                
                return (
                  <div
                    key={index}
                    ref={el => { slotRefs.current[index] = el; }}
                    className={`flex flex-col items-center transition-all ${
                      isCurrent ? "scale-110" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all
                        ${filled
                          ? "bg-green-100 border-green-500 text-green-700 animate-pop"
                          : isCurrent
                            ? "bg-blue-50 border-blue-400 animate-pulse"
                            : isTargetKana
                              ? "bg-yellow-50 border-yellow-300"
                              : "bg-gray-50 border-gray-200"
                        }`}
                    >
                      {filled || targetKana}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {getRomaji(targetKana)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <DrawingCanvas
              key={currentSlotIndex}
              targetKana={currentPokemon.kana[currentSlotIndex]}
              onComplete={handleCharacterComplete}
              onSparkle={handleCanvasSparkle}
            />
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

          <style jsx>{`
            @keyframes pop {
              0% { transform: scale(0.5); opacity: 0; }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-pop {
              animation: pop 0.3s ease-out forwards;
            }
          `}</style>
        </div>
      )}

      {phase === "complete" && currentPokemon && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-bounce-in">
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

          <style jsx>{`
            @keyframes bounce-in {
              0% { transform: scale(0.3); opacity: 0; }
              50% { transform: scale(1.05); }
              70% { transform: scale(0.9); }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-bounce-in {
              animation: bounce-in 0.5s ease-out forwards;
            }
          `}</style>
        </div>
      )}
    </main>
  );
}
