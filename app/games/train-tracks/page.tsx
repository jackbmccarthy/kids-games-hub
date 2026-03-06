"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "complete" | "derailed";

type TrackType = "horizontal" | "vertical" | "curve-ne" | "curve-nw" | "curve-se" | "curve-sw" | "bridge-h" | "bridge-v";

type CellType = "empty" | "start" | "station" | "rock" | "water";

interface Cell {
  track: TrackType | null;
  type: CellType;
}

interface Train {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  moving: boolean;
  progress: number;
}

interface Level {
  name: string;
  gridSize: { w: number; h: number };
  start: { x: number; y: number };
  station: { x: number; y: number };
  obstacles: { x: number; y: number; type: "rock" | "water" }[];
  pieces: { type: TrackType; count: number }[];
  minPieces: number;
}

const LEVELS: Level[] = [
  {
    name: "First Ride",
    gridSize: { w: 5, h: 3 },
    start: { x: 0, y: 1 },
    station: { x: 4, y: 1 },
    obstacles: [],
    pieces: [
      { type: "horizontal", count: 5 },
    ],
    minPieces: 3,
  },
  {
    name: "Turn Ahead",
    gridSize: { w: 5, h: 4 },
    start: { x: 0, y: 0 },
    station: { x: 4, y: 3 },
    obstacles: [],
    pieces: [
      { type: "horizontal", count: 4 },
      { type: "vertical", count: 4 },
      { type: "curve-se", count: 2 },
      { type: "curve-nw", count: 2 },
    ],
    minPieces: 6,
  },
  {
    name: "Rocky Path",
    gridSize: { w: 6, h: 4 },
    start: { x: 0, y: 1 },
    station: { x: 5, y: 2 },
    obstacles: [
      { x: 2, y: 1, type: "rock" },
      { x: 3, y: 2, type: "rock" },
    ],
    pieces: [
      { type: "horizontal", count: 5 },
      { type: "vertical", count: 4 },
      { type: "curve-se", count: 2 },
      { type: "curve-sw", count: 2 },
      { type: "curve-ne", count: 2 },
      { type: "curve-nw", count: 2 },
    ],
    minPieces: 7,
  },
  {
    name: "Water Crossing",
    gridSize: { w: 6, h: 4 },
    start: { x: 0, y: 0 },
    station: { x: 5, y: 3 },
    obstacles: [
      { x: 2, y: 1, type: "water" },
      { x: 2, y: 2, type: "water" },
    ],
    pieces: [
      { type: "horizontal", count: 4 },
      { type: "vertical", count: 3 },
      { type: "curve-se", count: 2 },
      { type: "curve-sw", count: 2 },
      { type: "curve-nw", count: 2 },
      { type: "bridge-h", count: 1 },
    ],
    minPieces: 8,
  },
  {
    name: "Mountain Pass",
    gridSize: { w: 7, h: 5 },
    start: { x: 0, y: 2 },
    station: { x: 6, y: 0 },
    obstacles: [
      { x: 2, y: 1, type: "rock" },
      { x: 2, y: 2, type: "rock" },
      { x: 3, y: 3, type: "rock" },
      { x: 4, y: 1, type: "rock" },
      { x: 4, y: 2, type: "water" },
    ],
    pieces: [
      { type: "horizontal", count: 5 },
      { type: "vertical", count: 5 },
      { type: "curve-se", count: 3 },
      { type: "curve-sw", count: 3 },
      { type: "curve-ne", count: 3 },
      { type: "curve-nw", count: 3 },
      { type: "bridge-h", count: 1 },
    ],
    minPieces: 10,
  },
  {
    name: "Grand Journey",
    gridSize: { w: 8, h: 6 },
    start: { x: 0, y: 0 },
    station: { x: 7, y: 5 },
    obstacles: [
      { x: 1, y: 2, type: "rock" },
      { x: 2, y: 4, type: "rock" },
      { x: 3, y: 1, type: "rock" },
      { x: 3, y: 3, type: "water" },
      { x: 4, y: 5, type: "rock" },
      { x: 5, y: 2, type: "rock" },
      { x: 5, y: 3, type: "water" },
      { x: 6, y: 4, type: "rock" },
    ],
    pieces: [
      { type: "horizontal", count: 6 },
      { type: "vertical", count: 6 },
      { type: "curve-se", count: 3 },
      { type: "curve-sw", count: 3 },
      { type: "curve-ne", count: 3 },
      { type: "curve-nw", count: 3 },
      { type: "bridge-h", count: 1 },
      { type: "bridge-v", count: 1 },
    ],
    minPieces: 12,
  },
];

const TRACK_CONNECTIONS: Record<TrackType, { from: string[]; to: string[] }> = {
  "horizontal": { from: ["left", "right"], to: ["left", "right"] },
  "vertical": { from: ["up", "down"], to: ["up", "down"] },
  "curve-ne": { from: ["up", "right"], to: ["up", "right"] },
  "curve-nw": { from: ["up", "left"], to: ["up", "left"] },
  "curve-se": { from: ["down", "right"], to: ["down", "right"] },
  "curve-sw": { from: ["down", "left"], to: ["down", "left"] },
  "bridge-h": { from: ["left", "right"], to: ["left", "right"] },
  "bridge-v": { from: ["up", "down"], to: ["up", "down"] },
};

export default function TrainTracksPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selectedPiece, setSelectedPiece] = useState<TrackType | null>(null);
  const [availablePieces, setAvailablePieces] = useState<{ type: TrackType; count: number }[]>([]);
  const [piecesPlaced, setPiecesPlaced] = useState(0);
  const [train, setTrain] = useState<Train>({ x: 0, y: 0, direction: "right", moving: false, progress: 0 });
  const [stars, setStars] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([0]);
  const [completedLevels, setCompletedLevels] = useState<Record<number, number>>({});

  const cellSize = 60;
  const trainRef = useRef<Train>({ x: 0, y: 0, direction: "right", moving: false, progress: 0 });
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play train sound
  const playTrainSound = useCallback((type: "chug" | "whistle" | "success" | "crash") => {
    try {
      const ctx = initAudio();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      switch (type) {
        case "chug":
          oscillator.frequency.setValueAtTime(150, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case "whistle":
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case "success":
          oscillator.frequency.setValueAtTime(523, ctx.currentTime);
          oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
          oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.5);
          break;
        case "crash":
          oscillator.type = "sawtooth";
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
      }
    } catch {
      // Audio not supported
    }
  }, [initAudio]);

  // Initialize level
  const initLevel = useCallback((levelIndex: number) => {
    const level = LEVELS[levelIndex];
    const newGrid: Cell[][] = [];
    
    for (let y = 0; y < level.gridSize.h; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < level.gridSize.w; x++) {
        let cellType: CellType = "empty";
        
        if (x === level.start.x && y === level.start.y) {
          cellType = "start";
        } else if (x === level.station.x && y === level.station.y) {
          cellType = "station";
        } else {
          const obstacle = level.obstacles.find(o => o.x === x && o.y === y);
          if (obstacle) {
            cellType = obstacle.type;
          }
        }
        
        row.push({ track: null, type: cellType });
      }
      newGrid.push(row);
    }
    
    setGrid(newGrid);
    setAvailablePieces(level.pieces.map(p => ({ ...p })));
    setSelectedPiece(null);
    setPiecesPlaced(0);
    setTrain({ x: level.start.x, y: level.start.y, direction: "right", moving: false, progress: 0 });
    trainRef.current = { x: level.start.x, y: level.start.y, direction: "right", moving: false, progress: 0 };
    setPhase("playing");
  }, []);

  // Place track
  const placeTrack = useCallback((x: number, y: number) => {
    if (!selectedPiece) return;
    if (phase !== "playing") return;
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;
    
    const cell = grid[y][x];
    if (cell.type === "rock") return;
    
    // Check if we have pieces available
    const pieceIndex = availablePieces.findIndex(p => p.type === selectedPiece && p.count > 0);
    if (pieceIndex === -1) return;
    
    // Place or replace track
    const newGrid = [...grid];
    const wasEmpty = !newGrid[y][x].track;
    newGrid[y][x] = { ...newGrid[y][x], track: selectedPiece };
    setGrid(newGrid);
    
    if (wasEmpty) {
      setPiecesPlaced(p => p + 1);
    }
    
    // Decrease piece count
    const newPieces = [...availablePieces];
    newPieces[pieceIndex] = { ...newPieces[pieceIndex], count: newPieces[pieceIndex].count - 1 };
    setAvailablePieces(newPieces);
  }, [selectedPiece, phase, grid, availablePieces]);

  // Remove track
  const removeTrack = useCallback((x: number, y: number) => {
    if (phase !== "playing") return;
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;
    
    const cell = grid[y][x];
    if (!cell.track) return;
    if (cell.type === "start" || cell.type === "station") return;
    
    // Return piece to inventory
    const trackType = cell.track;
    const newPieces = [...availablePieces];
    const pieceIndex = newPieces.findIndex(p => p.type === trackType);
    if (pieceIndex !== -1) {
      newPieces[pieceIndex] = { ...newPieces[pieceIndex], count: newPieces[pieceIndex].count + 1 };
    }
    setAvailablePieces(newPieces);
    
    // Remove track
    const newGrid = [...grid];
    newGrid[y][x] = { ...newGrid[y][x], track: null };
    setGrid(newGrid);
    setPiecesPlaced(p => Math.max(0, p - 1));
  }, [phase, grid, availablePieces]);

  // Get next position and direction from track
  const getNextMove = useCallback((currentTrain: Train, currentGrid: Cell[][]): { x: number; y: number; direction: "up" | "down" | "left" | "right" } | null => {
    const { x, y, direction } = currentTrain;
    const cell = currentGrid[y]?.[x];
    
    if (!cell || !cell.track) {
      // Check if at station
      if (cell?.type === "station") {
        return { x, y, direction };
      }
      return null;
    }
    
    const track = cell.track;
    const connections = TRACK_CONNECTIONS[track];
    
    // Get entry direction (opposite of where we came from)
    const entryDir = direction;
    
    if (!connections.from.includes(entryDir)) {
      return null; // Track doesn't connect from this direction
    }
    
    // Get exit direction
    const exitDir = connections.to.find(d => d !== entryDir);
    if (!exitDir) return null;
    
    // Calculate next position
    let nx = x, ny = y;
    switch (exitDir) {
      case "up": ny--; break;
      case "down": ny++; break;
      case "left": nx--; break;
      case "right": nx++; break;
    }
    
    // Check if next cell is valid
    const nextCell = currentGrid[ny]?.[nx];
    if (!nextCell) return null;
    if (nextCell.type === "rock") return null;
    if (nextCell.type === "water" && !nextCell.track?.startsWith("bridge")) return null;
    
    return { x: nx, y: ny, direction: exitDir as "up" | "down" | "left" | "right" };
  }, []);

  // Start train
  const startTrain = useCallback(() => {
    if (phase !== "playing") return;
    
    const level = LEVELS[currentLevel];
    const startCell = grid[level.start.y]?.[level.start.x];
    
    // Determine initial direction based on first track
    let initialDir: "up" | "down" | "left" | "right" = "right";
    if (startCell?.track) {
      const connections = TRACK_CONNECTIONS[startCell.track];
      if (connections.to.includes("right")) initialDir = "right";
      else if (connections.to.includes("down")) initialDir = "down";
      else if (connections.to.includes("left")) initialDir = "left";
      else if (connections.to.includes("up")) initialDir = "up";
    }
    
    const newTrain: Train = {
      x: level.start.x,
      y: level.start.y,
      direction: initialDir,
      moving: true,
      progress: 0,
    };
    
    setTrain(newTrain);
    trainRef.current = newTrain;
    
    playTrainSound("whistle");
    
    // Start animation
    const animate = () => {
      const t = trainRef.current;
      if (!t.moving) return;
      
      t.progress += 0.05;
      
      if (t.progress >= 1) {
        t.progress = 0;
        playTrainSound("chug");
        
        // Get next move
        const next = getNextMove(t, grid);
        
        if (!next) {
          // Check if at station
          const currentCell = grid[t.y]?.[t.x];
          if (currentCell?.type === "station") {
            // Success!
            t.moving = false;
            setTrain({ ...t });
            
            // Calculate stars
            const level = LEVELS[currentLevel];
            const efficiency = level.minPieces / piecesPlaced;
            let earnedStars = 1;
            if (efficiency >= 0.9) earnedStars = 3;
            else if (efficiency >= 0.7) earnedStars = 2;
            
            setStars(earnedStars);
            setCompletedLevels(prev => ({
              ...prev,
              [currentLevel]: Math.max(prev[currentLevel] || 0, earnedStars),
            }));
            
            // Unlock next level
            if (currentLevel < LEVELS.length - 1) {
              setUnlockedLevels(prev => {
                if (!prev.includes(currentLevel + 1)) {
                  return [...prev, currentLevel + 1];
                }
                return prev;
              });
            }
            
            playTrainSound("success");
            setPhase("complete");
            return;
          } else {
            // Derailed
            t.moving = false;
            setTrain({ ...t });
            playTrainSound("crash");
            setPhase("derailed");
            return;
          }
        }
        
        t.x = next.x;
        t.y = next.y;
        t.direction = next.direction;
      }
      
      setTrain({ ...t });
      trainRef.current = t;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [phase, grid, currentLevel, getNextMove, piecesPlaced, playTrainSound]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const level = LEVELS[currentLevel];
    canvas.width = level.gridSize.w * cellSize;
    canvas.height = level.gridSize.h * cellSize;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw background
    ctx.fillStyle = "#90EE90";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= level.gridSize.w; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= level.gridSize.h; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvas.width, y * cellSize);
      ctx.stroke();
    }
    
    // Draw cells
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        const cx = x * cellSize + cellSize / 2;
        const cy = y * cellSize + cellSize / 2;
        
        // Draw cell type
        if (cell.type === "rock") {
          ctx.fillStyle = "#666";
          ctx.fillRect(x * cellSize + 5, y * cellSize + 5, cellSize - 10, cellSize - 10);
          ctx.font = "30px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🪨", cx, cy);
        } else if (cell.type === "water") {
          ctx.fillStyle = "#4169E1";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.font = "25px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🌊", cx, cy);
        } else if (cell.type === "start") {
          ctx.fillStyle = "#FFD700";
          ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
          ctx.font = "35px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🚂", cx, cy);
        } else if (cell.type === "station") {
          ctx.fillStyle = "#FF6347";
          ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
          ctx.font = "35px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🏠", cx, cy);
        }
        
        // Draw track
        if (cell.track) {
          drawTrack(ctx, cell.track, x * cellSize, y * cellSize, cellSize);
        }
      }
    }
    
    // Draw train if moving
    if (train.moving || phase === "complete" || phase === "derailed") {
      const tx = train.x * cellSize + cellSize / 2;
      const ty = train.y * cellSize + cellSize / 2;
      
      ctx.save();
      ctx.translate(tx, ty);
      
      // Rotate based on direction
      const rotations: Record<string, number> = {
        right: 0,
        down: Math.PI / 2,
        left: Math.PI,
        up: -Math.PI / 2,
      };
      ctx.rotate(rotations[train.direction]);
      
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🚂", 0, 0);
      
      ctx.restore();
    }
    
  }, [grid, train, currentLevel, phase, cellSize]);

  // Draw track helper
  const drawTrack = (ctx: CanvasRenderingContext2D, track: TrackType, x: number, y: number, size: number) => {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const trackWidth = 8;
    const railOffset = 10;
    
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = trackWidth;
    ctx.lineCap = "round";
    
    switch (track) {
      case "horizontal":
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x + size, cy);
        ctx.stroke();
        // Rails
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, cy - railOffset);
        ctx.lineTo(x + size, cy - railOffset);
        ctx.moveTo(x, cy + railOffset);
        ctx.lineTo(x + size, cy + railOffset);
        ctx.stroke();
        break;
        
      case "vertical":
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx, y + size);
        ctx.stroke();
        // Rails
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - railOffset, y);
        ctx.lineTo(cx - railOffset, y + size);
        ctx.moveTo(cx + railOffset, y);
        ctx.lineTo(cx + railOffset, y + size);
        ctx.stroke();
        break;
        
      case "curve-ne":
        ctx.beginPath();
        ctx.arc(x + size, y, size / 2, Math.PI / 2, Math.PI, false);
        ctx.stroke();
        // Rails
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + size, y, size / 2 - railOffset, Math.PI / 2, Math.PI, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size, y, size / 2 + railOffset, Math.PI / 2, Math.PI, false);
        ctx.stroke();
        break;
        
      case "curve-nw":
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI / 2, false);
        ctx.stroke();
        // Rails
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size / 2 - railOffset, 0, Math.PI / 2, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, size / 2 + railOffset, 0, Math.PI / 2, false);
        ctx.stroke();
        break;
        
      case "curve-se":
        ctx.beginPath();
        ctx.arc(x + size, y + size, size / 2, Math.PI, Math.PI * 1.5, false);
        ctx.stroke();
        // Rails
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + size, y + size, size / 2 - railOffset, Math.PI, Math.PI * 1.5, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size, y + size, size / 2 + railOffset, Math.PI, Math.PI * 1.5, false);
        ctx.stroke();
        break;
        
      case "curve-sw":
        ctx.beginPath();
        ctx.arc(x, y + size, size / 2, Math.PI * 1.5, Math.PI * 2, false);
        ctx.stroke();
        // Rails
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + size, size / 2 - railOffset, Math.PI * 1.5, Math.PI * 2, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y + size, size / 2 + railOffset, Math.PI * 1.5, Math.PI * 2, false);
        ctx.stroke();
        break;
        
      case "bridge-h":
        // Bridge planks
        ctx.fillStyle = "#8B4513";
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(x + 6 + i * 12, y + 10, 8, size - 20);
        }
        // Rails
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + 15);
        ctx.lineTo(x + size, y + 15);
        ctx.moveTo(x, y + size - 15);
        ctx.lineTo(x + size, y + size - 15);
        ctx.stroke();
        break;
        
      case "bridge-v":
        // Bridge planks
        ctx.fillStyle = "#8B4513";
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(x + 10, y + 6 + i * 12, size - 20, 8);
        }
        // Rails
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 15, y);
        ctx.lineTo(x + 15, y + size);
        ctx.moveTo(x + size - 15, y);
        ctx.lineTo(x + size - 15, y + size);
        ctx.stroke();
        break;
    }
  };

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    if (e.shiftKey || e.ctrlKey) {
      removeTrack(x, y);
    } else {
      placeTrack(x, y);
    }
  }, [placeTrack, removeTrack, cellSize]);

  // Handle canvas right-click
  const handleCanvasContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    removeTrack(x, y);
  }, [removeTrack, cellSize]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem("train-tracks-progress");
      if (saved) {
        const data = JSON.parse(saved);
        setUnlockedLevels(data.unlocked || [0]);
        setCompletedLevels(data.completed || {});
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save progress
  useEffect(() => {
    try {
      localStorage.setItem("train-tracks-progress", JSON.stringify({
        unlocked: unlockedLevels,
        completed: completedLevels,
      }));
    } catch {
      // Ignore errors
    }
  }, [unlockedLevels, completedLevels]);

  const getPieceEmoji = (type: TrackType): string => {
    switch (type) {
      case "horizontal": return "➡️";
      case "vertical": return "⬇️";
      case "curve-ne": return "↗️";
      case "curve-nw": return "↖️";
      case "curve-se": return "↘️";
      case "curve-sw": return "↙️";
      case "bridge-h": return "🌉";
      case "bridge-v": return "🌉";
      default: return "❓";
    }
  };

  const getPieceName = (type: TrackType): string => {
    switch (type) {
      case "horizontal": return "Straight H";
      case "vertical": return "Straight V";
      case "curve-ne": return "Curve ┘";
      case "curve-nw": return "Curve └";
      case "curve-se": return "Curve ┐";
      case "curve-sw": return "Curve ┌";
      case "bridge-h": return "Bridge H";
      case "bridge-v": return "Bridge V";
      default: return "?";
    }
  };

  return (
    <main className="min-h-screen bg-green-100 flex flex-col items-center p-4">
      {/* Header */}
      {phase === "playing" && (
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-green-700">
            Level {currentLevel + 1}: {LEVELS[currentLevel].name}
          </h2>
          <p className="text-gray-600">Pieces used: {piecesPlaced} (goal: {LEVELS[currentLevel].minPieces})</p>
        </div>
      )}

      {/* Game canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-xl border-4 border-green-600 cursor-pointer"
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasContextMenu}
        />
      </div>

      {/* Piece selector */}
      {phase === "playing" && !train.moving && (
        <div className="mt-4 bg-white rounded-xl p-4 shadow-lg">
          <p className="text-sm text-gray-600 mb-2 text-center">Select track piece (Right-click to remove)</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {availablePieces.map((piece, i) => (
              <button
                key={i}
                onClick={() => piece.count > 0 && setSelectedPiece(piece.type)}
                disabled={piece.count === 0}
                className={`px-3 py-2 rounded-lg font-bold flex flex-col items-center min-w-[60px] ${
                  selectedPiece === piece.type
                    ? "bg-green-500 text-white ring-4 ring-green-300"
                    : piece.count > 0
                    ? "bg-gray-100 hover:bg-gray-200"
                    : "bg-gray-200 opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="text-xl">{getPieceEmoji(piece.type)}</span>
                <span className="text-xs">{getPieceName(piece.type)}</span>
                <span className="text-sm font-bold">{piece.count}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={startTrain}
              disabled={!selectedPiece && grid.flat().every(c => !c.track)}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl text-lg"
            >
              🚂 Start Train!
            </button>
            <button
              onClick={() => initLevel(currentLevel)}
              className="px-4 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}

      {/* Menu overlay */}
      {phase === "menu" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md">
            <h1 className="text-4xl font-black text-green-600 mb-2">🚂 Train Tracks</h1>
            <p className="text-gray-600 mb-4">Build tracks to guide the train to the station!</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {LEVELS.map((level, i) => (
                <button
                  key={i}
                  onClick={() => unlockedLevels.includes(i) && initLevel(i)}
                  disabled={!unlockedLevels.includes(i)}
                  className={`px-4 py-3 rounded-xl font-bold ${
                    unlockedLevels.includes(i)
                      ? "bg-green-400 hover:bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <div>Level {i + 1}</div>
                  <div className="text-xs">{level.name}</div>
                  {completedLevels[i] && (
                    <div className="text-yellow-300">
                      {"⭐".repeat(completedLevels[i])}
                    </div>
                  )}
                  {!unlockedLevels.includes(i) && <span>🔒</span>}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-gray-500">
              Tip: Place tracks to connect start (🚂) to station (🏠). Use fewer pieces for more stars!
            </p>
          </div>
        </div>
      )}

      {/* Complete overlay */}
      {phase === "complete" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h2 className="text-4xl font-black text-green-500 mb-2">🎉 Station Reached!</h2>
            <div className="text-5xl my-4">{"⭐".repeat(stars)}</div>
            <p className="text-lg text-gray-600 mb-4">
              Used {piecesPlaced} pieces (goal: {LEVELS[currentLevel].minPieces})
            </p>
            <div className="space-y-2">
              {currentLevel < LEVELS.length - 1 && (
                <button
                  onClick={() => initLevel(currentLevel + 1)}
                  className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl"
                >
                  Next Level →
                </button>
              )}
              <button
                onClick={() => initLevel(currentLevel)}
                className="w-full px-6 py-3 bg-yellow-500 text-white font-bold rounded-xl"
              >
                🔄 Try for 3 Stars!
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Derailed overlay */}
      {phase === "derailed" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h2 className="text-4xl font-black text-red-500 mb-2">💥 Derailed!</h2>
            <p className="text-lg text-gray-600 mb-4">
              The train went off the tracks!
            </p>
            <div className="space-y-2">
              <button
                onClick={() => initLevel(currentLevel)}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
