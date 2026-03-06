"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Splat {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  splatterPoints: { x: number; y: number; size: number }[];
  dripStart: number;
  dripLength: number;
  dripDelay: number;
  rotation: number;
}

interface Drip {
  id: number;
  x: number;
  y: number;
  color: string;
  length: number;
  speed: number;
  width: number;
}

const PAINT_COLORS = [
  { name: "Red", hex: "#FF4757" },
  { name: "Orange", hex: "#FF7F50" },
  { name: "Yellow", hex: "#FFD93D" },
  { name: "Green", hex: "#6BCB77" },
  { name: "Blue", hex: "#4D96FF" },
  { name: "Purple", hex: "#9B59B6" },
  { name: "Pink", hex: "#FF6B9D" },
  { name: "Brown", hex: "#A0522D" },
];

export default function SplatPaintPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState(PAINT_COLORS[0].hex);
  const [splats, setSplats] = useState<Splat[]>([]);
  const [drips, setDrips] = useState<Drip[]>([]);
  const [splatCount, setSplatCount] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);

  // Get audio context for sounds
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play splat sound
  const playSplatSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Create a satisfying splat sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Random pitch variation
      const baseFreq = 100 + Math.random() * 100;
      oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
      oscillator.type = "sawtooth";

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(800, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);

      // Add a wet "squelch" sound
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.frequency.setValueAtTime(200 + Math.random() * 150, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
      osc2.type = "sine";
      
      gain2.gain.setValueAtTime(0.15, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Generate random splatter shape
  const generateSplatter = useCallback((x: number, y: number, baseSize: number) => {
    const points: { x: number; y: number; size: number }[] = [];
    const numPoints = 5 + Math.floor(Math.random() * 8);
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 * i) / numPoints + (Math.random() - 0.5) * 0.5;
      const distance = baseSize * (0.3 + Math.random() * 0.7);
      const subSize = baseSize * (0.15 + Math.random() * 0.35);
      
      points.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: subSize,
      });

      // Add tiny droplets around main splat
      if (Math.random() > 0.5) {
        const tinyAngle = angle + (Math.random() - 0.5) * 0.5;
        const tinyDist = distance + baseSize * 0.3 * Math.random();
        points.push({
          x: Math.cos(tinyAngle) * tinyDist,
          y: Math.sin(tinyAngle) * tinyDist,
          size: baseSize * (0.05 + Math.random() * 0.1),
        });
      }
    }
    
    return points;
  }, []);

  // Create a splat at position
  const createSplat = useCallback((x: number, y: number) => {
    playSplatSound();
    
    const baseSize = 30 + Math.random() * 40;
    const splatterPoints = generateSplatter(x, y, baseSize);
    
    const newSplat: Splat = {
      id: Date.now() + Math.random(),
      x,
      y,
      color: selectedColor,
      size: baseSize,
      splatterPoints,
      dripStart: Date.now(),
      dripLength: 50 + Math.random() * 100,
      dripDelay: 100 + Math.random() * 300,
      rotation: Math.random() * Math.PI * 2,
    };
    
    setSplats(prev => [...prev, newSplat]);
    setSplatCount(prev => prev + 1);
    
    // Create drips
    const numDrips = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numDrips; i++) {
      setTimeout(() => {
        const drip: Drip = {
          id: Date.now() + Math.random(),
          x: x + (Math.random() - 0.5) * baseSize * 0.5,
          y: y + baseSize * 0.3,
          color: selectedColor,
          length: 0,
          speed: 1 + Math.random() * 2,
          width: 3 + Math.random() * 4,
        };
        setDrips(prev => [...prev, drip]);
      }, newSplat.dripDelay + i * 100);
    }
  }, [selectedColor, playSplatSound, generateSplatter]);

  // Handle click/tap on canvas
  const handleCanvasClick = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    createSplat(x, y);
  }, [createSplat]);

  // Draw all splats on canvas
  const drawSplats = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear and draw background
    ctx.fillStyle = "#F5F5DC"; // Canvas beige
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw canvas texture (subtle)
    ctx.strokeStyle = "rgba(200, 180, 150, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw each splat with color mixing (multiply blend mode)
    splats.forEach(splat => {
      ctx.save();
      ctx.translate(splat.x, splat.y);
      
      // Main blob with soft edges
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, splat.size);
      gradient.addColorStop(0, splat.color);
      gradient.addColorStop(0.7, splat.color);
      gradient.addColorStop(1, splat.color + "00"); // Transparent edge
      
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = gradient;
      
      // Draw main blob with irregular shape
      ctx.beginPath();
      const points = 12;
      for (let i = 0; i <= points; i++) {
        const angle = (Math.PI * 2 * i) / points;
        const wobble = splat.size * (0.8 + Math.sin(angle * 3 + splat.rotation) * 0.2);
        const px = Math.cos(angle) * wobble;
        const py = Math.sin(angle) * wobble;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      
      // Draw splatter points
      splat.splatterPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = splat.color;
        ctx.fill();
      });
      
      // Add highlight
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.ellipse(-splat.size * 0.3, -splat.size * 0.3, splat.size * 0.2, splat.size * 0.15, -0.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw drips on overlay canvas
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas?.getContext("2d");
    if (overlayCanvas && overlayCtx) {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      drips.forEach(drip => {
        const gradient = overlayCtx.createLinearGradient(drip.x, drip.y - drip.length, drip.x, drip.y);
        gradient.addColorStop(0, drip.color + "00");
        gradient.addColorStop(0.3, drip.color);
        gradient.addColorStop(1, drip.color);
        
        overlayCtx.strokeStyle = gradient;
        overlayCtx.lineWidth = drip.width;
        overlayCtx.lineCap = "round";
        overlayCtx.beginPath();
        overlayCtx.moveTo(drip.x, drip.y - drip.length);
        overlayCtx.lineTo(drip.x, drip.y);
        overlayCtx.stroke();
        
        // Drip blob at end
        overlayCtx.fillStyle = drip.color;
        overlayCtx.beginPath();
        overlayCtx.arc(drip.x, drip.y, drip.width * 0.8, 0, Math.PI * 2);
        overlayCtx.fill();
      });
    }
  }, [splats, drips]);

  // Animate drips
  useEffect(() => {
    const animate = () => {
      setDrips(prev => 
        prev
          .map(drip => ({
            ...drip,
            length: drip.length + drip.speed,
            y: drip.y + drip.speed * 0.5,
          }))
          .filter(drip => drip.length < drip.width * 20)
      );
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Draw when splats change
  useEffect(() => {
    drawSplats();
  }, [splats, drips, drawSplats]);

  // Setup canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      overlayCanvas.width = window.innerWidth;
      overlayCanvas.height = window.innerHeight;
      drawSplats();
    };
    
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [drawSplats]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setSplats([]);
    setDrips([]);
    setSplatCount(0);
  }, []);

  // Save as image
  const saveImage = useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;
    
    // Create combined canvas
    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = canvas.width;
    combinedCanvas.height = canvas.height;
    const ctx = combinedCanvas.getContext("2d");
    if (!ctx) return;
    
    // Draw main canvas
    ctx.drawImage(canvas, 0, 0);
    // Draw drips overlay
    ctx.drawImage(overlayCanvas, 0, 0);
    
    // Download
    const link = document.createElement("a");
    link.download = `splat-paint-${Date.now()}.png`;
    link.href = combinedCanvas.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#F5F5DC]">
      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={(e) => handleCanvasClick(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleCanvasClick(touch.clientX, touch.clientY);
        }}
      />
      
      {/* Drip overlay canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/90 rounded-xl px-4 py-2 shadow-lg">
          <h1 className="text-2xl font-black text-[#FF6B9D]">🎨 Splat Paint!</h1>
        </div>
        
        <div className="pointer-events-auto bg-white/90 rounded-xl px-4 py-2 shadow-lg">
          <span className="font-bold text-gray-700">Splats: {splatCount}</span>
        </div>
      </header>

      {/* Color palette - big buttons for kids */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-2xl mx-auto">
          {/* Color buttons */}
          <div className="flex justify-center gap-3 mb-4 flex-wrap pointer-events-auto">
            {PAINT_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setSelectedColor(color.hex)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-lg transition-all hover:scale-110 active:scale-95 ${
                  selectedColor === color.hex 
                    ? "ring-4 ring-white ring-offset-2 ring-offset-gray-400 scale-110" 
                    : ""
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {selectedColor === color.hex && (
                  <span className="text-white text-2xl drop-shadow-lg">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-3 pointer-events-auto">
            <button
              onClick={clearCanvas}
              className="px-6 py-3 bg-red-400 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 text-lg"
            >
              🗑️ Clear
            </button>
            <button
              onClick={saveImage}
              disabled={splatCount === 0}
              className={`px-6 py-3 font-bold rounded-xl shadow-lg transition-all text-lg ${
                splatCount === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white hover:scale-105 active:scale-95"
              }`}
            >
              💾 Save Art
            </button>
          </div>
        </div>
      </div>

      {/* Instructions (shows when canvas is empty) */}
      {splatCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-xl max-w-md mx-4">
            <p className="text-3xl mb-4">🎨</p>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Tap to Splatter!</h2>
            <p className="text-gray-600">
              Pick a color and tap anywhere to throw paint! 
              Watch the colors mix as you layer them.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
