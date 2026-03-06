"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GameSettings } from "../../games/word-search/page";
import { getRandomWords, GRID_SIZES, DIRECTIONS_BY_GRADE } from "../../data/word-pools";
import { generatePuzzle, type Puzzle, type WordPlacement } from "../../lib/wordSearchGenerator";
import { WordGrid } from "./WordGrid";
import { WordList } from "./WordList";
import { CongratsOverlay } from "./CongratsOverlay";
import { useSound } from "../../hooks/useSound";

interface GameScreenProps {
  settings: GameSettings;
  onVictory: () => void;
}

export interface FoundWord {
  word: string;
  cells: { row: number; col: number }[];
}

export function GameScreen({ settings, onVictory }: GameScreenProps) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [showCongrats, setShowCongrats] = useState(false);
  const [lastFoundWord, setLastFoundWord] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);
  
  const { playDing, playVictory } = useSound();

  // Generate puzzle on mount
  useEffect(() => {
    const words = getRandomWords(settings.grade, settings.category, settings.wordCount);
    const gridSize = GRID_SIZES[settings.grade];
    const directions = DIRECTIONS_BY_GRADE[settings.grade];
    
    const newPuzzle = generatePuzzle(words, gridSize, directions);
    setPuzzle(newPuzzle);
    setFoundWords([]);
  }, [settings]);

  // Check for victory
  useEffect(() => {
    if (puzzle && foundWords.length === puzzle.placements.length && puzzle.placements.length > 0) {
      setTimeout(() => {
        playVictory();
        onVictory();
      }, 500);
    }
  }, [foundWords, puzzle, onVictory, playVictory]);

  const handleSelectionChange = useCallback((cells: { row: number; col: number }[]) => {
    setSelectedCells(cells);
  }, []);

  const handleSelectionEnd = useCallback((cells: { row: number; col: number }[]) => {
    if (!puzzle) return;

    // Check if selection matches any word
    const selectionStr = cells.map(c => puzzle.grid[c.row][c.col]).join("");
    const reversedStr = [...selectionStr].reverse().join("");

    for (const placement of puzzle.placements) {
      // Skip already found words
      if (foundWords.some(fw => fw.word === placement.word)) continue;

      const wordStr = placement.word;
      const matches = selectionStr === wordStr || reversedStr === wordStr;

      if (matches) {
        // Found a word!
        const newFound: FoundWord = {
          word: placement.word,
          cells: placement.cells,
        };
        
        setFoundWords(prev => [...prev, newFound]);
        setLastFoundWord(placement.word);
        setShowCongrats(true);
        playDing();
        
        setTimeout(() => setShowCongrats(false), 1500);
        break;
      }
    }

    setSelectedCells([]);
  }, [puzzle, foundWords, playDing]);

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {/* Header */}
      <header className="text-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#FF6B6B]">
          🔤 Word Search
        </h1>
        <p className="text-[#2C3E50]/60 font-semibold">
          Found: {foundWords.length} / {puzzle.placements.length}
        </p>
      </header>

      {/* Game Container */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto w-full">
        {/* Word Grid */}
        <div className="flex-1 flex items-center justify-center">
          <WordGrid
            grid={puzzle.grid}
            foundWords={foundWords}
            selectedCells={selectedCells}
            onSelectionChange={handleSelectionChange}
            onSelectionEnd={handleSelectionEnd}
          />
        </div>

        {/* Word List */}
        <div className="lg:w-64 flex-shrink-0">
          <WordList
            words={puzzle.placements.map(p => p.word)}
            foundWords={foundWords.map(fw => fw.word)}
          />
        </div>
      </div>

      {/* Congrats Overlay */}
      {showCongrats && (
        <CongratsOverlay word={lastFoundWord} />
      )}
    </div>
  );
}
