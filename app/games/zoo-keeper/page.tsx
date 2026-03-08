"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Animal {
  id: number;
  name: string;
  emoji: string;
  habitat: HabitatType;
  fact: string;
  x: number;
  y: number;
  isDragging: boolean;
  originX: number;
  originY: number;
  bounce: number;
}

type HabitatType = "savanna" | "jungle" | "arctic" | "ocean" | "farm";
type GamePhase = "menu" | "playing" | "levelComplete" | "factTime" | "gameOver";

interface HabitatInfo {
  name: string;
  emoji: string;
  gradient: string;
  borderColor: string;
}

const HABITATS: Record<HabitatType, HabitatInfo> = {
  savanna: { name: "Savanna", emoji: "🌍", gradient: "from-amber-300 to-orange-400", borderColor: "border-amber-500" },
  jungle: { name: "Jungle", emoji: "🌴", gradient: "from-green-400 to-emerald-600", borderColor: "border-green-600" },
  arctic: { name: "Arctic", emoji: "❄️", gradient: "from-cyan-200 to-blue-300", borderColor: "border-cyan-400" },
  ocean: { name: "Ocean", emoji: "🌊", gradient: "from-blue-400 to-indigo-600", borderColor: "border-blue-500" },
  farm: { name: "Farm", emoji: "🏡", gradient: "from-yellow-300 to-amber-400", borderColor: "border-yellow-500" },
};

const ANIMALS: { name: string; emoji: string; habitat: HabitatType; fact: string }[] = [
  // Savanna Animals
  { name: "Lion", emoji: "🦁", habitat: "savanna", fact: "Lions are the only cats that live in groups called prides!" },
  { name: "Elephant", emoji: "🐘", habitat: "savanna", fact: "Elephants are the largest land animals on Earth!" },
  { name: "Giraffe", emoji: "🦒", habitat: "savanna", fact: "A giraffe's tongue is about 20 inches long and purple!" },
  { name: "Zebra", emoji: "🦓", habitat: "savanna", fact: "Every zebra has a unique pattern of stripes, like a fingerprint!" },
  { name: "Cheetah", emoji: "🐆", habitat: "savanna", fact: "Cheetahs are the fastest land animals, running up to 70 mph!" },
  
  // Jungle Animals
  { name: "Monkey", emoji: "🐒", habitat: "jungle", fact: "Monkeys can use tools and even play video games!" },
  { name: "Parrot", emoji: "🦜", habitat: "jungle", fact: "Some parrots can live for over 80 years!" },
  { name: "Snake", emoji: "🐍", habitat: "jungle", fact: "Snakes smell with their tongues!" },
  { name: "Frog", emoji: "🐸", habitat: "jungle", fact: "Frogs drink water through their skin!" },
  { name: "Butterfly", emoji: "🦋", habitat: "jungle", fact: "Butterflies taste with their feet!" },
  
  // Arctic Animals
  { name: "Polar Bear", emoji: "🐻‍❄️", habitat: "arctic", fact: "Polar bear fur is actually clear, not white!" },
  { name: "Penguin", emoji: "🐧", habitat: "arctic", fact: "Penguins can't fly but they're excellent swimmers!" },
  { name: "Seal", emoji: "🦭", habitat: "arctic", fact: "Seals can sleep underwater and come up for air automatically!" },
  { name: "Owl", emoji: "🦉", habitat: "arctic", fact: "Owls can turn their heads almost all the way around!" },
  { name: "Whale", emoji: "🐋", habitat: "arctic", fact: "Blue whales are the largest animals that ever lived!" },
  
  // Ocean Animals
  { name: "Dolphin", emoji: "🐬", habitat: "ocean", fact: "Dolphins sleep with one eye open!" },
  { name: "Octopus", emoji: "🐙", habitat: "ocean", fact: "Octopuses have three hearts and blue blood!" },
  { name: "Fish", emoji: "🐠", habitat: "ocean", fact: "Fish don't have eyelids - they sleep with their eyes open!" },
  { name: "Crab", emoji: "🦀", habitat: "ocean", fact: "Crabs walk sideways because of how their legs bend!" },
  { name: "Turtle", emoji: "🐢", habitat: "ocean", fact: "Sea turtles can hold their breath for up to 7 hours!" },
  
  // Farm Animals
  { name: "Cow", emoji: "🐄", habitat: "farm", fact: "Cows have best friends and get stressed when separated!" },
  { name: "Pig", emoji: "🐷", habitat: "farm", fact: "Pigs are smarter than dogs and can learn tricks!" },
  { name: "Chicken", emoji: "🐔", habitat: "farm", fact: "Chickens can recognize over 100 different faces!" },
  { name: "Horse", emoji: "🐴", habitat: "farm", fact: "Horses can sleep standing up!" },
  { name: "Sheep", emoji: "🐑", habitat: "farm", fact: "Sheep have rectangular pupils that help them see all around!" },
];

const LEVEL_CONFIG = [
  { animals: 5, time: 60, habitats: ["savanna", "jungle", "farm"] as HabitatType[] },
  { animals: 6, time: 55, habitats: ["savanna", "jungle", "arctic", "farm"] as HabitatType[] },
  { animals: 7, time: 50, habitats: ["savanna", "jungle", "arctic", "ocean", "farm"] as HabitatType[] },
  { animals: 8, time: 45, habitats: ["savanna", "jungle", "arctic", "ocean", "farm"] as HabitatType[] },
  { animals: 10, time: 40, habitats: ["savanna", "jungle", "arctic", "ocean", "farm"] as HabitatType[] },
];

export default function ZooKeeperPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [activeHabitats, setActiveHabitats] = useState<HabitatType[]>([]);
  const [draggedAnimal, setDraggedAnimal] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [currentFact, setCurrentFact] = useState<{ name: string; emoji: string; fact: string } | null>(null);
  const [matchedAnimals, setMatchedAnimals] = useState<{ name: string; emoji: string; habitat: HabitatType }[]>([]);
  const [animalFactQueue, setAnimalFactQueue] = useState<{ name: string; emoji: string; fact: string }[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("zoo-keeper-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Generate animals for current level
  const generateAnimals = useCallback((levelNum: number) => {
    const config = LEVEL_CONFIG[Math.min(levelNum - 1, LEVEL_CONFIG.length - 1)];
    setActiveHabitats(config.habitats);
    
    // Filter animals for active habitats
    const availableAnimals = ANIMALS.filter(a => config.habitats.includes(a.habitat));
    const shuffled = [...availableAnimals].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, config.animals);
    
    // Position animals randomly at top
    const newAnimals: Animal[] = selected.map((animal, index) => {
      const cols = Math.ceil(Math.sqrt(config.animals));
      const row = Math.floor(index / cols);
      const col = index % cols;
      const cellWidth = 300;
      const cellHeight = 100;
      
      return {
        id: index,
        name: animal.name,
        emoji: animal.emoji,
        habitat: animal.habitat,
        fact: animal.fact,
        x: 50 + col * cellWidth + Math.random() * 50,
        y: 120 + row * cellHeight,
        isDragging: false,
        originX: 50 + col * cellWidth + Math.random() * 50,
        originY: 120 + row * cellHeight,
        bounce: 0,
      };
    });
    
    setAnimals(newAnimals);
    setTimeLeft(config.time);
    setCorrectCount(0);
    setWrongCount(0);
    setMatchedAnimals([]);
    setAnimalFactQueue(selected.map(a => ({ name: a.name, emoji: a.emoji, fact: a.fact })));
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    generateAnimals(1);
    setPhase("playing");
  }, [generateAnimals]);

  // Next level
  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    generateAnimals(newLevel);
    setPhase("playing");
  }, [level, generateAnimals]);

  // Timer
  useEffect(() => {
    if (phase === "playing" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (phase === "playing" && timeLeft === 0) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("zoo-keeper-high-score", String(score));
      }
      setPhase("gameOver");
    }
  }, [phase, timeLeft, score, highScore]);

  // Bounce animation for animals
  useEffect(() => {
    if (phase !== "playing") return;
    
    bounceRef.current = setInterval(() => {
      setAnimals(prev => prev.map(a => ({
        ...a,
        bounce: a.isDragging ? 0 : (a.bounce + 0.15) % (Math.PI * 2),
      })));
    }, 50);
    
    return () => {
      if (bounceRef.current) clearInterval(bounceRef.current);
    };
  }, [phase]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, animal: Animal) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    setDraggedAnimal(animal.id);
    setDragPosition({ x: clientX, y: clientY });
    setAnimals(prev => prev.map(a => 
      a.id === animal.id ? { ...a, isDragging: true } : a
    ));
  }, []);

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (draggedAnimal === null) return;
    setDragPosition({ x: clientX, y: clientY });
  }, [draggedAnimal]);

  // Handle drag end
  const handleDragEnd = useCallback((clientX: number, clientY: number) => {
    if (draggedAnimal === null) return;
    
    const animal = animals.find(a => a.id === draggedAnimal);
    if (!animal) {
      setDraggedAnimal(null);
      return;
    }

    // Check if dropped on correct habitat
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const habitatHeight = 120;
      const habitatWidth = rect.width / activeHabitats.length;
      const habitatY = rect.height - habitatHeight - 20;
      
      // Check each habitat
      for (let i = 0; i < activeHabitats.length; i++) {
        const habitatX = i * habitatWidth;
        const habitatType = activeHabitats[i];
        
        if (
          clientX >= habitatX &&
          clientX <= habitatX + habitatWidth &&
          clientY >= habitatY &&
          clientY <= habitatY + habitatHeight
        ) {
          if (animal.habitat === habitatType) {
            // Correct match!
            setScore(prev => prev + 10 + Math.floor(timeLeft / 5));
            setCorrectCount(prev => prev + 1);
            setMatchedAnimals(prev => [...prev, { 
              name: animal.name, 
              emoji: animal.emoji, 
              habitat: animal.habitat 
            }]);
            setAnimals(prev => prev.filter(a => a.id !== animal.id));
            
            // Check for level complete
            if (animals.length === 1) {
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem("zoo-keeper-high-score", String(score));
              }
              // Show facts then level complete
              if (animalFactQueue.length > 0) {
                setCurrentFact(animalFactQueue[0]);
                setPhase("factTime");
              } else {
                setPhase("levelComplete");
              }
            }
          } else {
            // Wrong habitat - send back with bounce effect
            setScore(prev => Math.max(0, prev - 3));
            setWrongCount(prev => prev + 1);
            setAnimals(prev => prev.map(a =>
              a.id === animal.id
                ? { ...a, isDragging: false, x: a.originX, y: a.originY }
                : a
            ));
          }
          setDraggedAnimal(null);
          return;
        }
      }
    }
    
    // Dropped outside habitats - return to origin
    setAnimals(prev => prev.map(a =>
      a.id === animal.id
        ? { ...a, isDragging: false, x: a.originX, y: a.originY }
        : a
    ));
    setDraggedAnimal(null);
  }, [draggedAnimal, animals, activeHabitats, timeLeft, score, highScore, animalFactQueue]);

  // Global mouse/touch events
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      handleDragMove(x, y);
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      const x = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
      const y = "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;
      handleDragEnd(x, y);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // Handle fact display
  const handleNextFact = useCallback(() => {
    const newQueue = animalFactQueue.slice(1);
    setAnimalFactQueue(newQueue);
    
    if (newQueue.length > 0) {
      setCurrentFact(newQueue[0]);
    } else {
      setCurrentFact(null);
      setPhase("levelComplete");
    }
  }, [animalFactQueue]);

  // Play habitat sound (visual feedback for now)
  const playHabitatSound = useCallback((habitat: HabitatType) => {
    // In a real implementation, you would play actual sounds
    // For now, we'll use visual feedback
    console.log(`Playing ${habitat} ambient sound`);
  }, []);

  return (
    <main
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-green-200 overflow-hidden overscroll-none touch-none select-none"
    >
      {/* Prevent body scroll on mobile */}
      <style jsx global>{`
        body { overflow: hidden; overscroll-behavior: none; }
      `}</style>
      
      {/* Clouds decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl opacity-60 animate-pulse">☁️</div>
        <div className="absolute top-20 right-20 text-5xl opacity-50 animate-pulse" style={{ animationDelay: "1s" }}>☁️</div>
        <div className="absolute top-5 left-1/3 text-4xl opacity-40 animate-pulse" style={{ animationDelay: "2s" }}>☁️</div>
        <div className="absolute top-16 right-1/3 text-5xl opacity-50 animate-pulse" style={{ animationDelay: "0.5s" }}>☁️</div>
      </div>

      {/* Header */}
      {phase === "playing" && (
        <header className="absolute top-0 left-0 right-0 p-4 z-20">
          <div className="max-w-4xl mx-auto flex justify-between items-center bg-white/80 rounded-2xl px-4 py-2 shadow-lg">
            <div className="text-lg font-bold text-amber-600">
              🏆 {score}
            </div>
            <div className="text-xl font-black text-emerald-600">
              🦁 Zoo Keeper 🌍
            </div>
            <div className={`text-lg font-bold ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-600"}`}>
              ⏱️ {timeLeft}s
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-2 flex justify-center">
            <div className="bg-white/70 rounded-full px-4 py-1 text-sm font-bold text-gray-600">
              Level {level} • Matched: {correctCount}/{animals.length + correctCount}
            </div>
          </div>
        </header>
      )}

      {/* Animals */}
      {phase === "playing" && animals.map((animal) => (
        <div
          key={animal.id}
          className={`absolute cursor-grab active:cursor-grabbing transition-transform z-10 ${
            animal.isDragging ? "scale-125 z-30" : ""
          }`}
          style={{
            left: animal.isDragging ? dragPosition.x - 40 : animal.x,
            top: animal.isDragging ? dragPosition.y - 40 : animal.y + Math.sin(animal.bounce) * 5,
            transform: animal.isDragging ? "none" : `scale(${1 + Math.sin(animal.bounce) * 0.05})`,
          }}
          onMouseDown={(e) => handleDragStart(e, animal)}
          onTouchStart={(e) => handleDragStart(e, animal)}
        >
          <div className="relative">
            <div className="text-5xl md:text-6xl drop-shadow-lg">
              {animal.emoji}
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-2 py-0.5 text-xs font-bold text-gray-700 whitespace-nowrap shadow">
              {animal.name}
            </div>
          </div>
        </div>
      ))}

      {/* Habitats at bottom */}
      {phase === "playing" && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex gap-2 justify-center">
            {activeHabitats.map((habitat) => (
              <div
                key={habitat}
                className={`
                  flex-1 max-w-40 bg-gradient-to-b ${HABITATS[habitat].gradient}
                  rounded-2xl p-3 border-4 ${HABITATS[habitat].borderColor}
                  shadow-lg text-center
                  transition-all hover:scale-105
                `}
                onMouseEnter={() => playHabitatSound(habitat)}
              >
                <div className="text-3xl mb-1">{HABITATS[habitat].emoji}</div>
                <div className="text-sm font-bold text-white drop-shadow">
                  {HABITATS[habitat].name}
                </div>
                {/* Show matched animals in this habitat */}
                <div className="flex flex-wrap justify-center gap-0.5 mt-2 min-h-6">
                  {matchedAnimals
                    .filter(a => a.habitat === habitat)
                    .map((a, i) => (
                      <span key={i} className="text-lg" title={a.name}>
                        {a.emoji}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dragged animal overlay */}
      {draggedAnimal !== null && phase === "playing" && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPosition.x - 40,
            top: dragPosition.y - 40,
          }}
        >
          <div className="text-6xl drop-shadow-xl scale-125">
            {animals.find(a => a.id === draggedAnimal)?.emoji}
          </div>
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-30">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-6xl mb-4">🦁🌍🐧</div>
            <h1 className="text-4xl font-black text-emerald-600 mb-2">Zoo Keeper</h1>
            <p className="text-gray-600 mb-6">Drag animals to their correct habitats!</p>
            
            {highScore > 0 && (
              <p className="text-xl font-bold text-amber-500 mb-4">
                🏆 High Score: {highScore}
              </p>
            )}

            <button
              onClick={startGame}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl text-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              ▶️ Play
            </button>

            <div className="mt-6 p-4 bg-gray-100 rounded-xl text-left">
              <h3 className="font-bold text-gray-700 mb-2">🎯 How to Play:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Drag each animal to its home</li>
                <li>• Wrong habitat? Animal bounces back!</li>
                <li>• Learn fun animal facts!</li>
                <li>• Beat the timer for bonus points!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Fact Time */}
      {phase === "factTime" && currentFact && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-30">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-7xl mb-4 animate-bounce">{currentFact.emoji}</div>
            <h2 className="text-2xl font-black text-emerald-600 mb-2">{currentFact.name}</h2>
            <div className="bg-amber-100 rounded-xl p-4 mb-6">
              <p className="text-lg text-gray-700">
                <span className="text-2xl mr-2">💡</span>
                {currentFact.fact}
              </p>
            </div>
            <button
              onClick={handleNextFact}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              {animalFactQueue.length > 1 ? "Next Fact →" : "Continue →"}
            </button>
          </div>
        </div>
      )}

      {/* Level Complete */}
      {phase === "levelComplete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-30">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-emerald-600 mb-2">Level {level} Complete!</h2>
            
            <div className="my-6 space-y-3">
              <div className="bg-emerald-100 rounded-xl p-3">
                <p className="text-2xl font-bold text-emerald-600">🏆 Score: {score}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-100 rounded-xl p-3">
                  <p className="text-sm text-gray-600">Correct</p>
                  <p className="text-xl font-bold text-green-600">✅ {correctCount}</p>
                </div>
                <div className="bg-red-100 rounded-xl p-3">
                  <p className="text-sm text-gray-600">Wrong</p>
                  <p className="text-xl font-bold text-red-500">❌ {wrongCount}</p>
                </div>
              </div>
              
              {/* Show matched animals */}
              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-sm font-bold text-gray-600 mb-2">Animals Matched:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {matchedAnimals.map((a, i) => (
                    <span key={i} className="text-2xl" title={a.name}>{a.emoji}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={nextLevel}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl text-xl shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                Next Level ▶
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-30">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-3xl font-black text-red-500 mb-2">Time&apos;s Up!</h2>
            
            <div className="my-6 space-y-3">
              <p className="text-3xl font-bold text-gray-700">Score: {score}</p>
              <p className="text-lg text-gray-600">Level Reached: {level}</p>
              <p className="text-lg text-gray-600">Animals Matched: {correctCount}</p>
              
              {score >= highScore && score > 0 && (
                <div className="bg-amber-100 rounded-xl p-3">
                  <p className="text-xl font-bold text-amber-600">🏆 New High Score! 🏆</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl text-xl shadow-lg transition-all hover:scale-105 active:scale-95"
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
        </div>
      )}
    </main>
  );
}
