"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { FoundWord } from "./GameScreen";

interface WordGridProps {
  grid: string[][];
  foundWords: FoundWord[];
  selectedCells: { row: number; col: number }[];
  onSelectionChange: (cells: { row: number; col: number }[]) => void;
  onSelectionEnd: (cells: { row: number; col: number }[]) => void;
}

export function WordGrid({
  grid,
  foundWords,
  selectedCells,
  onSelectionChange,
  onSelectionEnd,
}: WordGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(40);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const [currentCell, setCurrentCell] = useState<{ row: number; col: number } | null>(null);

  const gridSize = grid.length;

  // Calculate cell size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const maxSize = Math.min(containerWidth, containerHeight);
        const newCellSize = Math.floor(maxSize / gridSize);
        setCellSize(Math.max(28, Math.min(50, newCellSize)));
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [gridSize]);

  // Draw grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = gridSize * cellSize;
    const height = gridSize * cellSize;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw found word highlights
    foundWords.forEach((found) => {
      ctx.fillStyle = "#95E1A3"; // Green for found words
      found.cells.forEach(({ row, col }) => {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      });
    });

    // Draw selection highlight
    if (selectedCells.length > 0) {
      ctx.fillStyle = "#FFEAA7"; // Yellow for selection
      selectedCells.forEach(({ row, col }) => {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      });
    }

    // Draw grid lines
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Draw letters
    ctx.fillStyle = "#2C3E50";
    ctx.font = `bold ${cellSize * 0.6}px Nunito, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const letter = grid[row][col];
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        ctx.fillText(letter, x, y);
      }
    }
  }, [grid, cellSize, foundWords, selectedCells, gridSize]);

  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        return { row, col };
      }
      return null;
    },
    [cellSize, gridSize]
  );

  const getCellsInLine = useCallback(
    (start: { row: number; col: number }, end: { row: number; col: number }) => {
      const cells: { row: number; col: number }[] = [];
      const dRow = Math.sign(end.row - start.row);
      const dCol = Math.sign(end.col - start.col);
      const rowDiff = Math.abs(end.row - start.row);
      const colDiff = Math.abs(end.col - start.col);

      // Must be horizontal, vertical, or diagonal
      if (rowDiff !== 0 && colDiff !== 0 && rowDiff !== colDiff) {
        return [start]; // Invalid, return just start
      }

      const steps = Math.max(rowDiff, colDiff);
      for (let i = 0; i <= steps; i++) {
        cells.push({
          row: start.row + i * dRow,
          col: start.col + i * dCol,
        });
      }

      return cells;
    },
    []
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      const cell = getCellFromPoint(clientX, clientY);
      if (cell) {
        setIsSelecting(true);
        setStartCell(cell);
        setCurrentCell(cell);
        onSelectionChange([cell]);
      }
    },
    [getCellFromPoint, onSelectionChange]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isSelecting || !startCell) return;

      const cell = getCellFromPoint(clientX, clientY);
      if (cell && (cell.row !== currentCell?.row || cell.col !== currentCell?.col)) {
        setCurrentCell(cell);
        const cells = getCellsInLine(startCell, cell);
        onSelectionChange(cells);
      }
    },
    [isSelecting, startCell, currentCell, getCellFromPoint, getCellsInLine, onSelectionChange]
  );

  const handleEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!isSelecting || !startCell) return;

      const cell = getCellFromPoint(clientX, clientY) || currentCell;
      if (cell) {
        const cells = getCellsInLine(startCell, cell);
        onSelectionEnd(cells);
      }

      setIsSelecting(false);
      setStartCell(null);
      setCurrentCell(null);
    },
    [isSelecting, startCell, currentCell, getCellFromPoint, getCellsInLine, onSelectionEnd]
  );

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const handleMouseUp = (e: React.MouseEvent) => handleEnd(e.clientX, e.clientY);
  const handleMouseLeave = () => {
    if (isSelecting && startCell) {
      onSelectionEnd(selectedCells);
      setIsSelecting(false);
      setStartCell(null);
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    handleEnd(touch.clientX, touch.clientY);
  };

  return (
    <div ref={containerRef} className="flex items-center justify-center w-full h-full">
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow-lg cursor-pointer touch-none"
        style={{
          maxWidth: "100%",
          maxHeight: "60vh",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
