import type { Direction } from "~/app/data/word-pools";

export interface WordPlacement {
  word: string;
  row: number;
  col: number;
  direction: Direction;
  cells: { row: number; col: number }[];
}

export interface Puzzle {
  grid: string[][];
  placements: WordPlacement[];
  words: string[];
}

// Direction vectors: [rowDelta, colDelta]
const DIRECTION_VECTORS: Record<Direction, [number, number]> = {
  right: [0, 1],
  left: [0, -1],
  down: [1, 0],
  up: [-1, 0],
  downRight: [1, 1],
  downLeft: [1, -1],
  upRight: [-1, 1],
  upLeft: [-1, -1],
};

export function generatePuzzle(
  words: string[],
  gridSize: number,
  allowedDirections: Direction[]
): Puzzle {
  // Initialize empty grid
  const grid: string[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(""));

  const placements: WordPlacement[] = [];

  // Sort words by length (longest first for better placement)
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    const upperWord = word.toUpperCase();
    const placement = placeWord(grid, upperWord, allowedDirections);
    
    if (placement) {
      placements.push(placement);
    }
  }

  // Fill empty cells with random letters
  fillEmptyCells(grid);

  return {
    grid,
    placements,
    words: placements.map(p => p.word),
  };
}

function placeWord(
  grid: string[][],
  word: string,
  allowedDirections: Direction[]
): WordPlacement | null {
  const gridSize = grid.length;
  const maxAttempts = 100;

  // Shuffle directions for randomness
  const directions = shuffleArray([...allowedDirections]);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const direction of directions) {
      const [dRow, dCol] = DIRECTION_VECTORS[direction];
      
      // Calculate valid starting positions
      let minRow = 0, maxRow = gridSize - 1;
      let minCol = 0, maxCol = gridSize - 1;

      if (dRow === 1) maxRow = gridSize - word.length;
      if (dRow === -1) minRow = word.length - 1;
      if (dCol === 1) maxCol = gridSize - word.length;
      if (dCol === -1) minCol = word.length - 1;

      if (minRow > maxRow || minCol > maxCol) continue;

      // Try random positions
      const startRow = Math.floor(Math.random() * (maxRow - minRow + 1)) + minRow;
      const startCol = Math.floor(Math.random() * (maxCol - minCol + 1)) + minCol;

      if (canPlaceWord(grid, word, startRow, startCol, dRow, dCol)) {
        const cells = placeWordOnGrid(grid, word, startRow, startCol, dRow, dCol);
        return {
          word,
          row: startRow,
          col: startCol,
          direction,
          cells,
        };
      }
    }
  }

  return null;
}

function canPlaceWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  dRow: number,
  dCol: number
): boolean {
  const gridSize = grid.length;

  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dRow;
    const col = startCol + i * dCol;

    // Check bounds
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return false;
    }

    // Check if cell is empty or has the same letter
    const existingLetter = grid[row][col];
    if (existingLetter !== "" && existingLetter !== word[i]) {
      return false;
    }
  }

  return true;
}

function placeWordOnGrid(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  dRow: number,
  dCol: number
): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];

  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dRow;
    const col = startCol + i * dCol;
    grid[row][col] = word[i];
    cells.push({ row, col });
  }

  return cells;
}

function fillEmptyCells(grid: string[][]): void {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === "") {
        grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
