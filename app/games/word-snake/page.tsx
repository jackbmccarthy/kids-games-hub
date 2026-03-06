"use client";

import { useState, useCallback, useEffect } from "react";

interface Cell {
  letter: string;
  selected: boolean;
  used: boolean;
  bonus: "none" | "doubleWord" | "doubleLetter";
}

interface FoundWord {
  word: string;
  points: number;
}

type GamePhase = "menu" | "playing" | "gameOver";
type GameMode = "timed" | "endless";

const GRID_SIZE = 5;
const VOWELS = "AEIOU";
const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";

const COMMON_WORDS = new Set([
  "cat", "dog", "run", "sun", "fun", "hat", "bat", "rat", "mat", "sat",
  "car", "bar", "far", "jar", "tar", "red", "bed", "fed", "led", "wed",
  "big", "dig", "fig", "pig", "wig", "hot", "dot", "got", "lot", "not",
  "cup", "pup", "up", "box", "fox", "top", "hop", "mop", "pop", "cop",
  "ant", "art", "ask", "bad", "bag", "ban", "bet", "bit", "bow", "bud",
  "bug", "bus", "buy", "can", "cap", "cow", "cry", "cut", "day", "did",
  "end", "eye", "fan", "fat", "fit", "fly", "gas", "god", "gun", "gut",
  "guy", "ham", "hen", "hit", "ice", "ill", "ink", "jam", "jet", "job",
  "joy", "key", "kid", "kin", "lab", "lap", "law", "leg", "let", "lid",
  "lip", "log", "low", "mad", "man", "map", "may", "men", "mix", "mob",
  "mom", "mud", "nap", "net", "new", "nod", "nor", "now", "nut", "oak",
  "odd", "oil", "old", "one", "our", "out", "owl", "own", "pan", "pay",
  "pen", "pet", "pie", "pin", "pit", "pot", "raw", "rid", "rig", "rim",
  "rip", "rob", "rod", "row", "rub", "rug", "sad", "sap", "saw", "sea",
  "set", "sew", "sin", "sip", "sir", "ski", "sky", "sly", "sob", "sod",
  "son", "spa", "spy", "tab", "tag", "tan", "tap", "tax", "tea", "the",
  "tie", "tin", "tip", "toe", "ton", "too", "tow", "toy", "tub", "tug",
  "two", "van", "vet", "war", "wax", "way", "web", "who", "why", "win",
  "wit", "won", "yak", "yes", "yet", "yew", "you", "zap", "zen", "zip",
  "zoo", "able", "back", "ball", "been", "best", "bill", "black", "blue",
  "book", "born", "both", "bring", "brow", "call", "came", "camp", "card",
  "case", "cool", "come", "cost", "dark", "deep", "door", "down", "draw",
  "drop", "each", "east", "easy", "even", "face", "fact", "fall", "farm",
  "fast", "feel", "feet", "fire", "five", "food", "four", "free", "from",
  "game", "gave", "girl", "give", "gold", "good", "gray", "grew", "grow",
  "hair", "half", "hall", "hand", "hard", "have", "head", "hear", "heat",
  "held", "help", "here", "high", "hill", "hold", "home", "hope", "hour",
  "huge", "idea", "into", "iron", "just", "keep", "kept", "kind", "king",
  "knew", "know", "lady", "lake", "land", "last", "late", "lead", "left",
  "less", "life", "lift", "like", "line", "list", "live", "long", "look",
  "love", "luck", "made", "make", "many", "mark", "mean", "meet", "mile",
  "milk", "mind", "mine", "miss", "moon", "more", "most", "move", "much",
  "must", "name", "near", "neck", "need", "nest", "news", "next", "nice",
  "nine", "noon", "nose", "note", "okay", "once", "only", "open", "over",
  "page", "pair", "park", "part", "pass", "past", "pick", "pink", "plan",
  "play", "poor", "pull", "pure", "push", "race", "rain", "rank", "rare",
  "rate", "read", "real", "rest", "rice", "rich", "ride", "ring", "rise",
  "road", "rock", "roof", "room", "rose", "rule", "rush", "safe", "said",
  "same", "sand", "save", "seat", "seed", "seek", "seem", "seen", "self",
  "sell", "send", "ship", "shop", "shot", "show", "shut", "sick", "side",
  "sign", "sing", "site", "size", "skin", "snow", "soft", "soil", "sold",
  "sole", "some", "song", "soon", "sort", "soul", "spot", "star", "stay",
  "step", "stop", "such", "suit", "sure", "take", "tall", "tank", "tape",
  "task", "team", "tell", "tend", "term", "test", "text", "than", "that",
  "them", "then", "they", "thin", "this", "thus", "till", "time", "tiny",
  "told", "tone", "took", "tool", "town", "tree", "trip", "true", "turn",
  "twin", "type", "unit", "upon", "used", "very", "view", "vote", "wage",
  "wait", "wake", "walk", "wall", "want", "warm", "wash", "wave", "weak",
  "wear", "week", "well", "went", "were", "west", "what", "when", "whom",
  "wide", "wife", "wild", "will", "wind", "wine", "wing", "wire", "wise",
  "wish", "with", "wolf", "wood", "word", "work", "wrap", "yard", "yeah",
  "year", "your", "zero", "zone",
]);

const LETTER_POINTS: { [key: string]: number } = {
  A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
};

export default function WordSnakePage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [mode, setMode] = useState<GameMode>("timed");
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [longestWord, setLongestWord] = useState("");
  const [highScore, setHighScore] = useState(0);

  // Generate random letter
  const randomLetter = useCallback((): string => {
    // Favor vowels slightly
    if (Math.random() < 0.35) {
      return VOWELS[Math.floor(Math.random() * VOWELS.length)];
    }
    return CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
  }, []);

  // Initialize grid
  const initGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const gridRow: Cell[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const bonus = Math.random() < 0.1 ? 
          (Math.random() < 0.5 ? "doubleWord" : "doubleLetter") : "none";
        gridRow.push({
          letter: randomLetter(),
          selected: false,
          used: false,
          bonus,
        });
      }
      newGrid.push(gridRow);
    }
    setGrid(newGrid);
  }, [randomLetter]);

  // Start game
  const startGame = useCallback((gameMode: GameMode) => {
    setMode(gameMode);
    setPhase("playing");
    setScore(0);
    setFoundWords([]);
    setSelectedCells([]);
    setCurrentWord("");
    setLongestWord("");
    if (gameMode === "timed") {
      setTimeLeft(120);
    }
    initGrid();
  }, [initGrid]);

  // Check if cells are adjacent
  const isAdjacent = useCallback((r1: number, c1: number, r2: number, c2: number): boolean => {
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2);
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (phase !== "playing") return;

    const cell = grid[row]?.[col];
    if (!cell || cell.used) return;

    // Check if this cell is already selected (deselect)
    const existingIndex = selectedCells.findIndex(s => s.row === row && s.col === col);
    if (existingIndex !== -1) {
      // Deselect this and all cells after it
      const newSelected = selectedCells.slice(0, existingIndex);
      setSelectedCells(newSelected);
      setCurrentWord(newSelected.map(s => grid[s.row][s.col].letter).join(""));
      
      // Update grid
      setGrid(prev => prev.map((r, ri) => 
        r.map((c, ci) => ({
          ...c,
          selected: newSelected.some(s => s.row === ri && s.col === ci),
        }))
      ));
      return;
    }

    // Check if adjacent to last selected
    if (selectedCells.length > 0) {
      const last = selectedCells[selectedCells.length - 1];
      if (!isAdjacent(last.row, last.col, row, col)) return;
    }

    // Add to selection
    const newSelected = [...selectedCells, { row, col }];
    setSelectedCells(newSelected);
    setCurrentWord(prev => prev + cell.letter);

    // Update grid
    setGrid(prev => prev.map((r, ri) => 
      r.map((c, ci) => ({
        ...c,
        selected: ri === row && ci === col ? true : c.selected,
      }))
    ));
  }, [phase, grid, selectedCells, isAdjacent]);

  // Submit word
  const submitWord = useCallback(() => {
    if (currentWord.length < 3) return;
    if (!COMMON_WORDS.has(currentWord.toLowerCase())) return;
    if (foundWords.some(f => f.word === currentWord)) return;

    // Calculate points
    let points = 0;
    let doubleWord = false;
    
    selectedCells.forEach(({ row, col }) => {
      const cell = grid[row][col];
      let letterPoints = LETTER_POINTS[cell.letter] || 1;
      if (cell.bonus === "doubleLetter") letterPoints *= 2;
      if (cell.bonus === "doubleWord") doubleWord = true;
      points += letterPoints;
    });

    if (doubleWord) points *= 2;
    points += (currentWord.length - 3) * 5; // Bonus for longer words

    setScore(prev => prev + points);
    setFoundWords(prev => [...prev, { word: currentWord, points }]);
    
    if (currentWord.length > longestWord.length) {
      setLongestWord(currentWord);
    }

    // Mark cells as used and refill
    setGrid(prev => {
      const newGrid = prev.map((r, ri) => 
        r.map((c, ci) => {
          const wasSelected = selectedCells.some(s => s.row === ri && s.col === ci);
          if (wasSelected) {
            const newBonus: "none" | "doubleWord" | "doubleLetter" = Math.random() < 0.1 ? 
              (Math.random() < 0.5 ? "doubleWord" : "doubleLetter") : "none";
            return {
              ...c,
              letter: randomLetter(),
              selected: false,
              used: false,
              bonus: newBonus,
            };
          }
          return { ...c, selected: false };
        })
      );
      return newGrid;
    });

    setSelectedCells([]);
    setCurrentWord("");
  }, [currentWord, selectedCells, grid, foundWords, longestWord, randomLetter]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCells([]);
    setCurrentWord("");
    setGrid(prev => prev.map(r => r.map(c => ({ ...c, selected: false }))));
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || mode !== "timed") return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase("gameOver");
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("word-snake-high-score", String(score));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, mode, score, highScore]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("word-snake-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#E3F2FD] p-4">
      <header className="max-w-md mx-auto text-center mb-4">
        <h1 className="text-3xl font-black text-[#2C3E50] mb-2">🐍 Word Snake 🐍</h1>
        {phase === "playing" && (
          <div className="flex justify-center gap-6 text-lg font-bold">
            <span className="text-[#4ECDC4]">Score: {score}</span>
            {mode === "timed" && (
              <span className={timeLeft <= 10 ? "text-red-500" : "text-[#2C3E50]"}>
                ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Game */}
      {phase === "playing" && (
        <div className="max-w-md mx-auto">
          {/* Current word */}
          <div className="text-center mb-4">
            <div className="bg-white rounded-xl p-4 shadow min-h-[48px]">
              <span className={`text-2xl font-bold ${currentWord.length >= 3 && COMMON_WORDS.has(currentWord.toLowerCase()) ? "text-[#4ECDC4]" : "text-gray-400"}`}>
                {currentWord || "Select letters..."}
              </span>
            </div>
          </div>

          {/* Grid */}
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
              {grid.map((row, ri) =>
                row.map((cell, ci) => (
                  <button
                    key={`${ri}-${ci}`}
                    onClick={() => handleCellClick(ri, ci)}
                    disabled={cell.used}
                    className={`
                      aspect-square rounded-lg font-bold text-xl
                      transition-all duration-150
                      ${cell.used ? "bg-gray-200 text-gray-400 cursor-not-allowed" : ""}
                      ${cell.selected ? "bg-[#4ECDC4] text-white scale-110 shadow-lg" : ""}
                      ${!cell.selected && !cell.used ? "bg-[#E8F5E9] text-[#2C3E50] hover:bg-[#C8E6C9]" : ""}
                      ${cell.bonus === "doubleWord" && !cell.selected ? "ring-2 ring-[#FFE66D]" : ""}
                      ${cell.bonus === "doubleLetter" && !cell.selected ? "ring-2 ring-[#FF6B6B]" : ""}
                    `}
                  >
                    {cell.letter}
                    {cell.bonus === "doubleWord" && <span className="text-xs">2W</span>}
                    {cell.bonus === "doubleLetter" && <span className="text-xs">2L</span>}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl"
            >
              Clear
            </button>
            <button
              onClick={submitWord}
              disabled={currentWord.length < 3 || !COMMON_WORDS.has(currentWord.toLowerCase())}
              className={`px-6 py-2 font-bold rounded-xl transition-all ${
                currentWord.length >= 3 && COMMON_WORDS.has(currentWord.toLowerCase())
                  ? "bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Submit ✓
            </button>
          </div>

          {/* Found words */}
          {foundWords.length > 0 && (
            <div className="mt-4 bg-white rounded-xl p-3 shadow">
              <p className="font-bold text-[#2C3E50] mb-2">
                Words Found: {foundWords.length} | Longest: {longestWord}
              </p>
              <div className="flex flex-wrap gap-2">
                {foundWords.slice(-10).map((fw, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-[#E8F5E9] rounded text-sm font-semibold text-[#2C3E50]"
                  >
                    {fw.word} (+{fw.points})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <p className="text-gray-600 mb-6">Connect letters to form words!</p>

          {highScore > 0 && (
            <p className="text-[#FFE66D] font-bold mb-4">🏆 High Score: {highScore}</p>
          )}

          <div className="space-y-3 mb-6">
            <button
              onClick={() => startGame("timed")}
              className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
            >
              ⏱️ Timed Mode (2 min)
            </button>
            <button
              onClick={() => startGame("endless")}
              className="w-full px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
            >
              ♾️ Endless Mode
            </button>
          </div>

          <div className="text-sm text-gray-400">
            <p>• Click adjacent letters to form words</p>
            <p>• 3+ letters, must be a real word</p>
            <p>• 🟡 2W = Double Word | 🔴 2L = Double Letter</p>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#FF6B6B] mb-4">⏰ Time&apos;s Up!</h2>
          
          <div className="my-6 space-y-2">
            <p className="text-2xl font-bold text-[#2C3E50]">Score: {score}</p>
            <p className="text-gray-600">Words Found: {foundWords.length}</p>
            <p className="text-gray-600">Longest Word: {longestWord || "None"}</p>
            {score >= highScore && score > 0 && (
              <p className="text-[#FFE66D] font-bold text-xl">🏆 New High Score!</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startGame(mode)}
              className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
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
      )}
    </main>
  );
}
