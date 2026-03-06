'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Types
interface Star {
  x: number;
  y: number;
  size: number;
  twinkleOffset: number;
  twinkleSpeed: number;
}

interface ConstellationStar {
  x: number;
  y: number;
  index: number;
  name: string;
}

interface Constellation {
  name: string;
  stars: ConstellationStar[];
  connections: [number, number][];
  facts: string[];
}

// Constellation data with relative positions (0-1 range, will be scaled)
const CONSTELLATIONS: Constellation[] = [
  {
    name: "Big Dipper",
    stars: [
      { x: 0.15, y: 0.3, index: 0, name: "Alkaid" },
      { x: 0.25, y: 0.28, index: 1, name: "Mizar" },
      { x: 0.32, y: 0.32, index: 2, name: "Alioth" },
      { x: 0.38, y: 0.38, index: 3, name: "Megrez" },
      { x: 0.48, y: 0.42, index: 4, name: "Phecda" },
      { x: 0.55, y: 0.35, index: 5, name: "Merak" },
      { x: 0.65, y: 0.32, index: 6, name: "Dubhe" },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 3]],
    facts: [
      "The Big Dipper is part of the constellation Ursa Major (the Great Bear)!",
      "It's called a 'asterism' - a pattern of stars within a constellation.",
      "The two stars on the right (Dubhe and Merak) point to the North Star!",
      "Many cultures see it as a wagon, ladle, or plow.",
      "It's visible year-round in the Northern Hemisphere."
    ]
  },
  {
    name: "Orion",
    stars: [
      { x: 0.3, y: 0.15, index: 0, name: "Betelgeuse" },
      { x: 0.5, y: 0.18, index: 1, name: "Bellatrix" },
      { x: 0.35, y: 0.35, index: 2, name: "Alnitak" },
      { x: 0.4, y: 0.38, index: 3, name: "Alnilam" },
      { x: 0.45, y: 0.35, index: 4, name: "Mintaka" },
      { x: 0.28, y: 0.55, index: 5, name: "Saiph" },
      { x: 0.52, y: 0.58, index: 6, name: "Rigel" },
    ],
    connections: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1]],
    facts: [
      "Orion is named after a hunter from Greek mythology!",
      "Betelgeuse (top left) is a red supergiant star - it's HUGE!",
      "The three middle stars form 'Orion's Belt'.",
      "Orion is best seen in winter in the Northern Hemisphere.",
      "Rigel (bottom right) is one of the brightest stars in the night sky!"
    ]
  },
  {
    name: "Cassiopeia",
    stars: [
      { x: 0.2, y: 0.4, index: 0, name: "Segin" },
      { x: 0.32, y: 0.28, index: 1, name: "Ruchbah" },
      { x: 0.45, y: 0.38, index: 2, name: "Gamma" },
      { x: 0.58, y: 0.25, index: 3, name: "Schedar" },
      { x: 0.7, y: 0.35, index: 4, name: "Caph" },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
    facts: [
      "Cassiopeia looks like a big 'W' or 'M' in the sky!",
      "It's named after a vain queen from Greek mythology.",
      "Cassiopeia is circumpolar - it never sets below the horizon!",
      "You can find it by looking for the W shape near the North Star.",
      "It's visible year-round in the Northern Hemisphere."
    ]
  },
  {
    name: "Leo",
    stars: [
      { x: 0.18, y: 0.35, index: 0, name: "Epsilon" },
      { x: 0.25, y: 0.25, index: 1, name: "Mu" },
      { x: 0.35, y: 0.22, index: 2, name: "Zosma" },
      { x: 0.45, y: 0.25, index: 3, name: "Chertan" },
      { x: 0.55, y: 0.2, index: 4, name: "Denebola" },
      { x: 0.28, y: 0.42, index: 5, name: "Regulus" },
      { x: 0.38, y: 0.38, index: 6, name: "Eta" },
    ],
    connections: [[5, 6], [6, 3], [3, 4], [5, 0], [0, 1], [1, 2], [2, 3]],
    facts: [
      "Leo represents the Nemean Lion from Greek mythology!",
      "Regulus, its brightest star, means 'little king' in Latin.",
      "Leo is one of the zodiac constellations!",
      "The 'sickle' shape looks like a backwards question mark.",
      "It's best seen in spring in the Northern Hemisphere."
    ]
  },
  {
    name: "Cygnus the Swan",
    stars: [
      { x: 0.4, y: 0.15, index: 0, name: "Deneb" },
      { x: 0.4, y: 0.28, index: 1, name: "Sadr" },
      { x: 0.28, y: 0.38, index: 2, name: "Gienah" },
      { x: 0.52, y: 0.38, index: 3, name: "Delta" },
      { x: 0.4, y: 0.5, index: 4, name: "Albireo" },
    ],
    connections: [[0, 1], [1, 2], [1, 3], [1, 4]],
    facts: [
      "Cygnus is also called 'The Northern Cross'!",
      "Deneb is one of the brightest stars visible from Earth.",
      "Cygnus flies along the Milky Way galaxy.",
      "Albireo at the beak is actually TWO stars - one gold, one blue!",
      "The myth says Cygnus represents the Greek god Zeus in swan form."
    ]
  },
  {
    name: "Scorpius",
    stars: [
      { x: 0.25, y: 0.25, index: 0, name: "Dschubba" },
      { x: 0.32, y: 0.32, index: 1, name: "Acrab" },
      { x: 0.4, y: 0.35, index: 2, name: "Antares" },
      { x: 0.48, y: 0.42, index: 3, name: "Tau" },
      { x: 0.52, y: 0.5, index: 4, name: "Epsilon" },
      { x: 0.55, y: 0.58, index: 5, name: "Zeta" },
      { x: 0.5, y: 0.65, index: 6, name: "Eta" },
      { x: 0.45, y: 0.62, index: 7, name: "Lambda" },
    ],
    connections: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
    facts: [
      "Scorpius is one of the zodiac constellations!",
      "Antares is a red supergiant star - it looks like the scorpion's heart!",
      "In mythology, Scorpius killed the hunter Orion.",
      "That's why they're on opposite sides of the sky!",
      "Scorpius is best seen in summer in the Northern Hemisphere."
    ]
  }
];

export default function ConstellationConnect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [currentConstellationIndex, setCurrentConstellationIndex] = useState(0);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [completedConnections, setCompletedConnections] = useState<[number, number][]>([]);
  const [backgroundStars, setBackgroundStars] = useState<Star[]>([]);
  const [shootingStar, setShootingStar] = useState<{x: number, y: number, vx: number, vy: number, opacity: number} | null>(null);
  const [showFact, setShowFact] = useState(false);
  const [currentFact, setCurrentFact] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [hintStar, setHintStar] = useState<number | null>(null);
  
  const currentConstellation = CONSTELLATIONS[currentConstellationIndex];
  
  // Initialize background stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }
    setBackgroundStars(stars);
  }, []);

  // Audio setup
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = soundEnabled ? 0.3 : 0;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, [soundEnabled]);

  // Play star click sound
  const playStarClick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(gainNodeRef.current || ctx.destination);
      
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio not available
    }
  }, [soundEnabled, initAudio]);

  // Play completion sound
  const playCompletionSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        
        oscillator.connect(gain);
        gain.connect(gainNodeRef.current || ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.5);
        
        oscillator.start(ctx.currentTime + i * 0.15);
        oscillator.stop(ctx.currentTime + i * 0.15 + 0.5);
      });
    } catch (e) {
      // Audio not available
    }
  }, [soundEnabled, initAudio]);

  // Shooting star effect
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      if (Math.random() < 0.02) {
        const startX = Math.random() * 0.3;
        const startY = Math.random() * 0.3;
        setShootingStar({
          x: startX,
          y: startY,
          vx: 0.008 + Math.random() * 0.005,
          vy: 0.005 + Math.random() * 0.003,
          opacity: 1
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState]);

  // Update shooting star
  useEffect(() => {
    if (!shootingStar) return;
    
    const interval = setInterval(() => {
      setShootingStar(prev => {
        if (!prev) return null;
        const newX = prev.x + prev.vx;
        const newY = prev.y + prev.vy;
        const newOpacity = prev.opacity - 0.02;
        
        if (newOpacity <= 0 || newX > 1 || newY > 1) return null;
        return { ...prev, x: newX, y: newY, opacity: newOpacity };
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [shootingStar !== null]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let time = 0;
    
    const render = () => {
      time += 0.016;
      
      // Clear canvas
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      gradient.addColorStop(0, '#1a1a3a');
      gradient.addColorStop(1, '#050510');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background stars with twinkling
      backgroundStars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset) * 0.5 + 0.5;
        const alpha = 0.3 + twinkle * 0.7;
        
        ctx.beginPath();
        ctx.arc(
          star.x * canvas.width,
          star.y * canvas.height,
          star.size * twinkle,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });
      
      // Draw shooting star
      if (shootingStar) {
        const gradient = ctx.createLinearGradient(
          shootingStar.x * canvas.width,
          shootingStar.y * canvas.height,
          (shootingStar.x - shootingStar.vx * 20) * canvas.width,
          (shootingStar.y - shootingStar.vy * 20) * canvas.height
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.moveTo(shootingStar.x * canvas.width, shootingStar.y * canvas.height);
        ctx.lineTo(
          (shootingStar.x - shootingStar.vx * 20) * canvas.width,
          (shootingStar.y - shootingStar.vy * 20) * canvas.height
        );
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw constellation if playing
      if (gameState === 'playing' && currentConstellation) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = Math.min(canvas.width, canvas.height) * 0.7;
        
        // Calculate star positions on canvas
        const starPositions = currentConstellation.stars.map(star => ({
          x: centerX + (star.x - 0.4) * scale,
          y: centerY + (star.y - 0.4) * scale,
        }));
        
        // Draw completed connections with glow
        completedConnections.forEach(([from, to]) => {
          const fromPos = starPositions[from];
          const toPos = starPositions[to];
          
          // Glow effect
          const glowAmount = 10 + Math.sin(time * 3) * 3 + glowIntensity;
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = glowAmount;
          
          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          ctx.lineTo(toPos.x, toPos.y);
          ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.shadowBlur = 0;
        });
        
        // Draw connection lines in progress
        if (selectedStars.length >= 1) {
          const lastStar = selectedStars[selectedStars.length - 1];
          const lastPos = starPositions[lastStar];
          
          // Find possible next connections
          const possibleConnections = currentConstellation.connections.filter(
            ([from, to]) => 
              (from === lastStar && !completedConnections.some(([a, b]) => 
                (a === from && b === to) || (a === to && b === from))) ||
              (to === lastStar && !completedConnections.some(([a, b]) => 
                (a === from && b === to) || (a === to && b === from)))
          );
          
          // Draw hint lines
          possibleConnections.forEach(([from, to]) => {
            const otherStar = from === lastStar ? to : from;
            const otherPos = starPositions[otherStar];
            
            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(otherPos.x, otherPos.y);
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
          });
        }
        
        // Draw constellation stars
        currentConstellation.stars.forEach((star, index) => {
          const pos = starPositions[index];
          const isSelected = selectedStars.includes(index);
          const isHinted = index === hintStar;
          
          // Twinkling effect
          const twinkle = Math.sin(time * 2 + index) * 0.2 + 0.8;
          const size = (isSelected ? 12 : 8) * twinkle;
          
          // Glow for selected or hinted stars
          if (isSelected || isHinted) {
            ctx.shadowColor = isHinted ? '#ffff00' : '#00ffff';
            ctx.shadowBlur = 20;
          }
          
          // Outer glow
          const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 2);
          gradient.addColorStop(0, isSelected ? 'rgba(100, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.8)');
          gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
          
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, size * 2, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // Inner star
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#00ffff' : '#ffffff';
          ctx.fill();
          
          ctx.shadowBlur = 0;
        });
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [backgroundStars, shootingStar, gameState, currentConstellation, selectedStars, completedConnections, glowIntensity, hintStar]);

  // Handle star click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !currentConstellation) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) * 0.7;
    
    // Find clicked star
    let clickedStar: number | null = null;
    currentConstellation.stars.forEach((star, index) => {
      const starX = centerX + (star.x - 0.4) * scale;
      const starY = centerY + (star.y - 0.4) * scale;
      const distance = Math.sqrt((clickX - starX) ** 2 + (clickY - starY) ** 2);
      
      if (distance < 30) {
        clickedStar = index;
      }
    });
    
    if (clickedStar === null) return;
    
    // First star selection
    if (selectedStars.length === 0) {
      setSelectedStars([clickedStar]);
      playStarClick();
      setHintStar(null);
      return;
    }
    
    const lastSelected = selectedStars[selectedStars.length - 1];
    
    // Check if clicking the same star
    if (clickedStar === lastSelected) return;
    
    // Check if this is a valid connection
    const isValidConnection = currentConstellation.connections.some(
      ([from, to]) => 
        (from === lastSelected && to === clickedStar) ||
        (to === lastSelected && from === clickedStar)
    );
    
    // Check if connection already exists
    const connectionExists = completedConnections.some(([a, b]) =>
      (a === lastSelected && b === clickedStar) ||
      (a === clickedStar && b === lastSelected)
    );
    
    if (isValidConnection && !connectionExists) {
      // Add the connection
      const newConnection: [number, number] = [lastSelected, clickedStar];
      const newConnections = [...completedConnections, newConnection];
      
      setCompletedConnections(newConnections);
      setSelectedStars([...selectedStars, clickedStar]);
      playStarClick();
      setGlowIntensity(10);
      setTimeout(() => setGlowIntensity(0), 200);
      setHintStar(null);
      
      // Check if constellation is complete
      if (newConnections.length === currentConstellation.connections.length) {
        setTimeout(() => {
          setGameState('completed');
          playCompletionSound();
          setShowFact(true);
          setCurrentFact(Math.floor(Math.random() * currentConstellation.facts.length));
        }, 500);
      }
    } else if (!isValidConnection) {
      // Invalid connection - give hint
      const validConnections = currentConstellation.connections.filter(
        ([from, to]) => 
          from === lastSelected || to === lastSelected
      );
      
      if (validConnections.length > 0) {
        const [from, to] = validConnections[0];
        const nextStar = from === lastSelected ? to : from;
        
        // Check if this connection is already made
        const allMade = validConnections.every(([from, to]) =>
          completedConnections.some(([a, b]) =>
            (a === from && b === to) || (a === to && b === from)
          )
        );
        
        if (!allMade) {
          setHintStar(nextStar);
          setTimeout(() => setHintStar(null), 1500);
        }
      }
    }
  }, [gameState, currentConstellation, selectedStars, completedConnections, playStarClick, playCompletionSound]);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setSelectedStars([]);
    setCompletedConnections([]);
    setShowFact(false);
    setHintStar(null);
  }, []);

  // Next constellation
  const nextConstellation = useCallback(() => {
    setCurrentConstellationIndex((prev) => (prev + 1) % CONSTELLATIONS.length);
    setGameState('playing');
    setSelectedStars([]);
    setCompletedConnections([]);
    setShowFact(false);
    setHintStar(null);
  }, []);

  // Back to menu
  const backToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedStars([]);
    setCompletedConnections([]);
    setShowFact(false);
    setHintStar(null);
  }, []);

  // Get progress percentage
  const progress = currentConstellation 
    ? Math.round((completedConnections.length / currentConstellation.connections.length) * 100)
    : 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a1a]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer"
        onClick={handleCanvasClick}
      />
      
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu overlay */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-2 drop-shadow-lg">
              ⭐ Constellation Connect ⭐
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Connect the stars to form famous constellations!
            </p>
            
            <div className="space-y-4 mb-8">
              <p className="text-lg text-white/80">
                🌟 Click on stars to select them
              </p>
              <p className="text-lg text-white/80">
                ✨ Connect stars in the right order to form constellations
              </p>
              <p className="text-lg text-white/80">
                📚 Learn fun facts about each constellation!
              </p>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Playing! 🚀
            </button>
          </div>
        </div>
      )}
      
      {/* Playing UI */}
      {gameState === 'playing' && currentConstellation && (
        <>
          {/* Constellation name */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg text-center">
              {currentConstellation.name}
            </h2>
            <div className="mt-2 bg-white/20 rounded-full h-4 w-64 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/80 text-center mt-1">{progress}% Complete</p>
          </div>
          
          {/* Back button */}
          <button
            onClick={backToMenu}
            className="absolute top-4 left-4 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all"
          >
            ← Menu
          </button>
          
          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-center">
            <p className="text-white/60 text-lg">
              {selectedStars.length === 0 
                ? "Click a star to start connecting!"
                : "Click another star to connect them!"}
            </p>
            {hintStar !== null && (
              <p className="text-yellow-300 text-lg mt-2 animate-pulse">
                ⭐ Try connecting to the glowing star!
              </p>
            )}
          </div>
          
          {/* Constellation selector */}
          <div className="absolute bottom-4 right-4 z-20 flex gap-2">
            {CONSTELLATIONS.map((constellation, index) => (
              <button
                key={constellation.name}
                onClick={() => {
                  setCurrentConstellationIndex(index);
                  setSelectedStars([]);
                  setCompletedConnections([]);
                  setHintStar(null);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentConstellationIndex
                    ? 'bg-cyan-400 scale-125'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                title={constellation.name}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Completion overlay */}
      {gameState === 'completed' && currentConstellation && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center bg-gradient-to-b from-indigo-900/80 to-purple-900/80 p-8 rounded-3xl max-w-lg mx-4">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Amazing!
            </h2>
            <h3 className="text-3xl font-bold text-cyan-300 mb-4">
              You found {currentConstellation.name}!
            </h3>
            
            {showFact && (
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="text-white/80 text-lg italic">
                  "{currentConstellation.facts[currentFact]}"
                </p>
                <button
                  onClick={() => setCurrentFact((prev) => (prev + 1) % currentConstellation.facts.length)}
                  className="mt-3 text-cyan-300 hover:text-cyan-200 text-sm underline"
                >
                  Learn another fact →
                </button>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={nextConstellation}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                Next Constellation →
              </button>
            </div>
            
            <button
              onClick={backToMenu}
              className="mt-4 text-white/60 hover:text-white transition-all"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
