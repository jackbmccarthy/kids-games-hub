"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type GamePhase = "menu" | "playing" | "complete";

interface Pokemon {
  id: number;
  name: string;
  japanese: string;
  romaji: string;
  kana: string[];
  romajiParts: string[];
  sprite: string;
}

// Popular Pokémon with Japanese names, romaji, and kana breakdown
const POKEMON_DATA: Pokemon[] = [
  { id: 1, name: "Bulbasaur", japanese: "フシギダネ", romaji: "Fushigidane", kana: ["フ", "シ", "ギ", "ダ", "ネ"], romajiParts: ["fu", "shi", "gi", "da", "ne"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" },
  { id: 4, name: "Charmander", japanese: "ヒトカゲ", romaji: "Hitokage", kana: ["ヒ", "ト", "カ", "ゲ"], romajiParts: ["hi", "to", "ka", "ge"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png" },
  { id: 7, name: "Squirtle", japanese: "ゼニガメ", romaji: "Zenigame", kana: ["ゼ", "ニ", "ガ", "メ"], romajiParts: ["ze", "ni", "ga", "me"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
  { id: 25, name: "Pikachu", japanese: "ピカチュウ", romaji: "Pikachuu", kana: ["ピ", "カ", "チュ", "ウ"], romajiParts: ["pi", "ka", "chu", "u"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },
  { id: 39, name: "Jigglypuff", japanese: "プリン", romaji: "Purin", kana: ["プ", "リ", "ン"], romajiParts: ["pu", "ri", "n"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png" },
  { id: 52, name: "Meowth", japanese: "ニャース", romaji: "Nyaasu", kana: ["ニャ", "ー", "ス"], romajiParts: ["nya", "a", "su"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png" },
  { id: 54, name: "Psyduck", japanese: "コダック", romaji: "Kodakku", kana: ["コ", "ダ", "ッ", "ク"], romajiParts: ["ko", "da", "tsu", "ku"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png" },
  { id: 63, name: "Abra", japanese: "ケーシィ", romaji: "Keeshi", kana: ["ケ", "ー", "シ", "ィ"], romajiParts: ["ke", "e", "shi", "i"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/63.png" },
  { id: 94, name: "Gengar", japanese: "ゲンガー", romaji: "Gengaa", kana: ["ゲ", "ン", "ガ", "ー"], romajiParts: ["ge", "n", "ga", "a"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png" },
  { id: 129, name: "Magikarp", japanese: "コイキング", romaji: "Koikingu", kana: ["コ", "イ", "キ", "ン", "グ"], romajiParts: ["ko", "i", "ki", "n", "gu"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png" },
  { id: 130, name: "Gyarados", japanese: "ギャラドス", romaji: "Gyaradosu", kana: ["ギャ", "ラ", "ド", "ス"], romajiParts: ["gya", "ra", "do", "su"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png" },
  { id: 133, name: "Eevee", japanese: "イーブイ", romaji: "Iibui", kana: ["イ", "ー", "ブ", "イ"], romajiParts: ["i", "i", "bu", "i"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png" },
  { id: 143, name: "Snorlax", japanese: "カビゴン", romaji: "Kabigon", kana: ["カ", "ビ", "ゴ", "ン"], romajiParts: ["ka", "bi", "go", "n"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png" },
  { id: 150, name: "Mewtwo", japanese: "ミュウツー", romaji: "Myuutsuu", kana: ["ミュ", "ウ", "ツ", "ー"], romajiParts: ["myu", "u", "tsu", "u"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png" },
  { id: 151, name: "Mew", japanese: "ミュウ", romaji: "Myuu", kana: ["ミュ", "ウ"], romajiParts: ["myu", "u"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png" },
  // Add more Gen 1
  { id: 6, name: "Charizard", japanese: "リザードン", romaji: "Rizaadon", kana: ["リ", "ザ", "ー", "ド", "ン"], romajiParts: ["ri", "za", "a", "do", "n"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" },
  { id: 9, name: "Blastoise", japanese: "カメックス", romaji: "Kamekkusu", kana: ["カ", "メ", "ッ", "ク", "ス"], romajiParts: ["ka", "me", "tsu", "ku", "su"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png" },
  { id: 35, name: "Clefairy", japanese: "ピッピ", romaji: "Pippi", kana: ["ピ", "ッ", "ピ"], romajiParts: ["pi", "tsu", "pi"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/35.png" },
  { id: 37, name: "Vulpix", japanese: "ロコン", romaji: "Rokon", kana: ["ロ", "コ", "ン"], romajiParts: ["ro", "ko", "n"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/37.png" },
  { id: 58, name: "Growlithe", japanese: "ガーディ", romaji: "Gaadi", kana: ["ガ", "ー", "デ", "ィ"], romajiParts: ["ga", "a", "de", "i"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/58.png" },
  // Gen 2 favorites
  { id: 152, name: "Chikorita", japanese: "チコリータ", romaji: "Chikoriita", kana: ["チ", "コ", "リ", "ー", "タ"], romajiParts: ["chi", "ko", "ri", "i", "ta"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/152.png" },
  { id: 155, name: "Cyndaquil", japanese: "ヒノアラシ", romaji: "Hinoarashi", kana: ["ヒ", "ノ", "ア", "ラ", "シ"], romajiParts: ["hi", "no", "a", "ra", "shi"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/155.png" },
  { id: 158, name: "Totodile", japanese: "ワニノコ", romaji: "Waninoko", kana: ["ワ", "ニ", "ノ", "コ"], romajiParts: ["wa", "ni", "no", "ko"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/158.png" },
  { id: 175, name: "Togepi", japanese: "トゲピー", romaji: "Togepii", kana: ["ト", "ゲ", "ピ", "ー"], romajiParts: ["to", "ge", "pi", "i"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/175.png" },
  { id: 196, name: "Espeon", japanese: "エーフィ", romaji: "Eefi", kana: ["エ", "ー", "フ", "ィ"], romajiParts: ["e", "e", "fi", "i"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png" },
  { id: 197, name: "Umbreon", japanese: "ブラッキー", romaji: "Burakkii", kana: ["ブ", "ラ", "ッ", "キ", "ー"], romajiParts: ["bu", "ra", "tsu", "ki", "i"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png" },
  // Gen 3
  { id: 252, name: "Treecko", japanese: "キモリ", romaji: "Kimori", kana: ["キ", "モ", "リ"], romajiParts: ["ki", "mo", "ri"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/252.png" },
  { id: 255, name: "Torchic", japanese: "アチャモ", romaji: "Achamo", kana: ["ア", "チャ", "モ"], romajiParts: ["a", "cha", "mo"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/255.png" },
  { id: 258, name: "Mudkip", japanese: "ミズゴロウ", romaji: "Mizugorou", kana: ["ミ", "ズ", "ゴ", "ロ", "ウ"], romajiParts: ["mi", "zu", "go", "ro", "u"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/258.png" },
  { id: 282, name: "Gardevoir", japanese: "サーナイト", romaji: "Saanaito", kana: ["サ", "ー", "ナ", "イ", "ト"], romajiParts: ["sa", "a", "na", "i", "to"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/282.png" },
  // Gen 4
  { id: 387, name: "Turtwig", japanese: "ナエトル", romaji: "Naetoru", kana: ["ナ", "エ", "ト", "ル"], romajiParts: ["na", "e", "to", "ru"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/387.png" },
  { id: 390, name: "Chimchar", japanese: "ヒコザル", romaji: "Hikozaru", kana: ["ヒ", "コ", "ザ", "ル"], romajiParts: ["hi", "ko", "za", "ru"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/390.png" },
  { id: 393, name: "Piplup", japanese: "ポッチャマ", romaji: "Potchama", kana: ["ポ", "ッ", "チャ", "マ"], romajiParts: ["po", "tsu", "cha", "ma"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/393.png" },
  { id: 448, name: "Lucario", japanese: "ルカリオ", romaji: "Rukario", kana: ["ル", "カ", "リ", "オ"], romajiParts: ["ru", "ka", "ri", "o"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png" },
  // Gen 5
  { id: 495, name: "Snivy", japanese: "ツタージャ", romaji: "Tsutaaja", kana: ["ツ", "タ", "ー", "ジャ"], romajiParts: ["tsu", "ta", "a", "ja"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/495.png" },
  { id: 498, name: "Tepig", japanese: "ポカブ", romaji: "Pokabu", kana: ["ポ", "カ", "ブ"], romajiParts: ["po", "ka", "bu"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/498.png" },
  { id: 501, name: "Oshawott", japanese: "ミジュマル", romaji: "Mijumaru", kana: ["ミ", "ジュ", "マ", "ル"], romajiParts: ["mi", "ju", "ma", "ru"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/501.png" },
  // Gen 6
  { id: 650, name: "Chespin", japanese: "ハリマロン", romaji: "Harimaron", kana: ["ハ", "リ", "マ", "ロ", "ン"], romajiParts: ["ha", "ri", "ma", "ro", "n"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/650.png" },
  { id: 653, name: "Fennekin", japanese: "フォッコ", romaji: "Fokko", kana: ["フォ", "ッ", "コ"], romajiParts: ["fo", "tsu", "ko"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/653.png" },
  { id: 656, name: "Froakie", japanese: "ケロマツ", romaji: "Keromatsu", kana: ["ケ", "ロ", "マ", "ツ"], romajiParts: ["ke", "ro", "ma", "tsu"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/656.png" },
  { id: 700, name: "Sylveon", japanese: "ニンフィア", romaji: "Ninfia", kana: ["ニ", "ン", "フィ", "ア"], romajiParts: ["ni", "n", "fi", "a"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/700.png" },
  // Gen 7
  { id: 722, name: "Rowlet", japanese: "モクロー", romaji: "Mokuroo", kana: ["モ", "ク", "ロ", "ー"], romajiParts: ["mo", "ku", "ro", "o"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/722.png" },
  { id: 725, name: "Litten", japanese: "ニャビー", romaji: "Nyabii", kana: ["ニャ", "ビ", "ー"], romajiParts: ["nya", "bi", "i"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/725.png" },
  { id: 728, name: "Popplio", japanese: "アシマリ", romaji: "Ashimari", kana: ["ア", "シ", "マ", "リ"], romajiParts: ["a", "shi", "ma", "ri"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/728.png" },
  // Gen 8
  { id: 810, name: "Grookey", japanese: "サルノリ", romaji: "Sarunori", kana: ["サ", "ル", "ノ", "リ"], romajiParts: ["sa", "ru", "no", "ri"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/810.png" },
  { id: 813, name: "Scorbunny", japanese: "ヒバニー", romaji: "Hibanii", kana: ["ヒ", "バ", "ニ", "ー"], romajiParts: ["hi", "ba", "ni", "i"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/813.png" },
  { id: 816, name: "Sobble", japanese: "メッソン", romaji: "Messon", kana: ["メ", "ッ", "ソ", "ン"], romajiParts: ["me", "tsu", "so", "n"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/816.png" },
  // Gen 9
  { id: 906, name: "Sprigatito", japanese: "ニャオハ", romaji: "Nyaoha", kana: ["ニャ", "オ", "ハ"], romajiParts: ["nya", "o", "ha"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/906.png" },
  { id: 909, name: "Fuecoco", japanese: "ホゲータ", romaji: "Hogeeta", kana: ["ホ", "ゲ", "ー", "タ"], romajiParts: ["ho", "ge", "e", "ta"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/909.png" },
  { id: 912, name: "Quaxly", japanese: "クワッス", romaji: "Kuwassu", kana: ["ク", "ワ", "ッ", "ス"], romajiParts: ["ku", "wa", "tsu", "su"], sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/912.png" },
];

export default function PokemonKanaSpellerPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>([]);
  const [availableKana, setAvailableKana] = useState<string[]>([]);
  const [draggedKana, setDraggedKana] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const audioRef = useRef<SpeechSynthesisUtterance | null>(null);

  const shuffleKana = useCallback((kana: string[]) => {
    const shuffled = [...kana];
    // Add some wrong kana as distractors
    const distractors = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ", "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト", "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ", "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ラ", "リ", "ル", "レ", "ロ", "ワ", "ン"];
    const numDistractors = Math.min(3, kana.length);
    for (let i = 0; i < numDistractors; i++) {
      const distractor = distractors[Math.floor(Math.random() * distractors.length)];
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
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }, []);

  const startGame = useCallback(() => {
    const available = POKEMON_DATA.filter(p => !completed.includes(p.id));
    if (available.length === 0) {
      setCompleted([]);
      startGame();
      return;
    }
    const pokemon = available[Math.floor(Math.random() * available.length)];
    setCurrentPokemon(pokemon);
    setFilledSlots(new Array(pokemon.kana.length).fill(null));
    setAvailableKana(shuffleKana(pokemon.kana));
    setShowHint(false);
    setPhase("playing");
  }, [completed, shuffleKana]);

  const handleDragStart = (kana: string) => {
    setDraggedKana(kana);
  };

  const handleDragEnd = () => {
    setDraggedKana(null);
  };

  const handleDrop = (slotIndex: number) => {
    if (!draggedKana || !currentPokemon) return;

    const correctKana = currentPokemon.kana[slotIndex];
    
    if (draggedKana === correctKana) {
      // Correct!
      const newFilled = [...filledSlots];
      newFilled[slotIndex] = draggedKana;
      setFilledSlots(newFilled);
      
      // Remove from available
      setAvailableKana(prev => {
        const index = prev.indexOf(draggedKana);
        if (index > -1) {
          const newAvailable = [...prev];
          newAvailable.splice(index, 1);
          return newAvailable;
        }
        return prev;
      });

      // Speak the kana
      const romaji = currentPokemon.romajiParts[slotIndex];
      speakJapanese(correctKana);

      // Check if complete
      if (newFilled.every(f => f !== null)) {
        setTimeout(() => {
          speakJapanese(currentPokemon.japanese);
          setScore(s => s + 10);
          setCompleted(prev => [...prev, currentPokemon.id]);
          setPhase("complete");
        }, 500);
      }
    } else {
      // Wrong - shake animation would go here
      // Just don't place it
    }
    
    setDraggedKana(null);
  };

  const handleTouchDrop = (slotIndex: number, kana: string) => {
    if (!currentPokemon) return;

    const correctKana = currentPokemon.kana[slotIndex];
    
    if (filledSlots[slotIndex] !== null) return; // Already filled
    
    if (kana === correctKana) {
      const newFilled = [...filledSlots];
      newFilled[slotIndex] = kana;
      setFilledSlots(newFilled);
      
      setAvailableKana(prev => {
        const index = prev.indexOf(kana);
        if (index > -1) {
          const newAvailable = [...prev];
          newAvailable.splice(index, 1);
          return newAvailable;
        }
        return prev;
      });

      const romaji = currentPokemon.romajiParts[slotIndex];
      speakJapanese(correctKana);

      if (newFilled.every(f => f !== null)) {
        setTimeout(() => {
          speakJapanese(currentPokemon.japanese);
          setScore(s => s + 10);
          setCompleted(prev => [...prev, currentPokemon.id]);
          setPhase("complete");
        }, 500);
      }
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("pokemon-kana-score");
    if (saved) setScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem("pokemon-kana-score", String(score));
  }, [score]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-400 via-yellow-300 to-red-500 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg mb-2">
          ⚡ ポケモン カナ Speller ⚡
        </h1>
        <p className="text-white/90 font-semibold">Learn to spell Pokémon names in Japanese!</p>
        <div className="mt-2 bg-white/30 rounded-full px-4 py-1 inline-block">
          <span className="font-bold text-white">Score: {score} | Completed: {completed.length}/{POKEMON_DATA.length}</span>
        </div>
      </div>

      {phase === "menu" && (
        <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">How to Play</h2>
          <div className="text-left text-gray-700 space-y-2 mb-6">
            <p>1. A Pokémon appears with its Japanese name shown as empty slots</p>
            <p>2. Drag the correct Japanese characters (kana) into the slots</p>
            <p>3. Each correct placement speaks the sound!</p>
            <p>4. Complete the word to hear the full name!</p>
          </div>
          <button
            onClick={startGame}
            className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xl transition-all shadow-lg hover:scale-105"
          >
            ▶️ Start Learning!
          </button>
        </div>
      )}

      {phase === "playing" && currentPokemon && (
        <div className="max-w-2xl mx-auto">
          {/* Pokémon Card */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Pokémon Image */}
              <div className="relative">
                <img
                  src={currentPokemon.sprite}
                  alt={currentPokemon.name}
                  className="w-40 h-40 object-contain pixelated"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              
              {/* Name Info */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-gray-500">#{currentPokemon.id}</p>
                <h2 className="text-2xl font-bold text-gray-800">{currentPokemon.name}</h2>
                <p className="text-lg text-gray-600">{currentPokemon.romaji}</p>
              </div>
            </div>

            {/* Kana Slots */}
            <div className="mt-6">
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                {filledSlots.map((filled, index) => (
                  <div
                    key={index}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    onClick={() => {
                      // If mobile, we handle this differently
                    }}
                    className={`w-16 h-20 rounded-xl border-4 flex items-center justify-center text-3xl font-bold transition-all ${
                      filled
                        ? "bg-green-100 border-green-400 text-green-700"
                        : "bg-gray-100 border-dashed border-gray-300"
                    } ${draggedKana && !filled ? "border-yellow-400 bg-yellow-50" : ""}`}
                  >
                    {filled || "?"}
                  </div>
                ))}
              </div>
              
              {/* Romaji hints */}
              <div className="flex justify-center gap-2 flex-wrap">
                {currentPokemon.romajiParts.map((romaji, index) => (
                  <div
                    key={index}
                    className={`w-16 text-center text-sm font-semibold ${
                      filledSlots[index] ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {showHint ? romaji : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Hint Button */}
            <div className="text-center mt-4">
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold"
              >
                {showHint ? "🙈 Hide Hints" : "💡 Show Romaji"}
              </button>
            </div>
          </div>

          {/* Available Kana */}
          <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
            <p className="text-center text-gray-600 font-semibold mb-3">Drag the kana to spell {currentPokemon.romaji}:</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {availableKana.map((kana, index) => (
                <div
                  key={`${kana}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(kana)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    // Find first empty slot this kana fits
                    for (let i = 0; i < currentPokemon.kana.length; i++) {
                      if (filledSlots[i] === null && kana === currentPokemon.kana[i]) {
                        handleTouchDrop(i, kana);
                        break;
                      }
                    }
                  }}
                  className={`w-14 h-16 bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${
                    draggedKana === kana ? "opacity-50" : ""
                  }`}
                >
                  {kana}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "complete" && currentPokemon && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-2xl animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-green-600 mb-2">Perfect!</h2>
            <img
              src={currentPokemon.sprite}
              alt={currentPokemon.name}
              className="w-32 h-32 mx-auto mb-4"
              style={{ imageRendering: "pixelated" }}
            />
            <p className="text-2xl font-bold text-gray-800">{currentPokemon.japanese}</p>
            <p className="text-lg text-gray-600 mb-4">{currentPokemon.romaji} ({currentPokemon.name})</p>
            <button
              onClick={() => speakJapanese(currentPokemon.japanese)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold mb-4"
            >
              🔊 Hear Again
            </button>
            <div className="space-y-2">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl"
              >
                Next Pokémon →
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl"
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
