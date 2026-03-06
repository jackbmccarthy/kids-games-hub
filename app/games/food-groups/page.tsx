"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Food {
  id: number;
  name: string;
  emoji: string;
  group: FoodGroup;
  x: number;
  y: number;
  rotation: number;
  isDragging: boolean;
  bounceVelocity: number;
  isBouncing: boolean;
  fact: string;
}

type FoodGroup = "fruits" | "vegetables" | "grains" | "protein" | "dairy";
type GamePhase = "menu" | "playing" | "paused" | "gameOver";
type Difficulty = "easy" | "medium" | "hard";

interface FoodData {
  name: string;
  emoji: string;
  group: FoodGroup;
  fact: string;
}

// Food database with facts
const FOODS: FoodData[] = [
  // Fruits
  { name: "Apple", emoji: "🍎", group: "fruits", fact: "Apples give you energy to play!" },
  { name: "Banana", emoji: "🍌", group: "fruits", fact: "Bananas help your muscles stay strong!" },
  { name: "Orange", emoji: "🍊", group: "fruits", fact: "Oranges have Vitamin C to help fight germs!" },
  { name: "Grapes", emoji: "🍇", group: "fruits", fact: "Grapes are great for a quick snack!" },
  { name: "Watermelon", emoji: "🍉", group: "fruits", fact: "Watermelon keeps you hydrated!" },
  { name: "Strawberry", emoji: "🍓", group: "fruits", fact: "Strawberries help heal cuts and scrapes!" },
  { name: "Peach", emoji: "🍑", group: "fruits", fact: "Peaches are good for your skin!" },
  { name: "Cherry", emoji: "🍒", group: "fruits", fact: "Cherries help you sleep better!" },
  { name: "Lemon", emoji: "🍋", group: "fruits", fact: "Lemons have lots of Vitamin C!" },
  { name: "Pear", emoji: "🍐", group: "fruits", fact: "Pears help your tummy feel good!" },
  
  // Vegetables
  { name: "Carrot", emoji: "🥕", group: "vegetables", fact: "Carrots help you see better in the dark!" },
  { name: "Broccoli", emoji: "🥦", group: "vegetables", fact: "Broccoli makes your bones strong!" },
  { name: "Corn", emoji: "🌽", group: "vegetables", fact: "Corn gives you energy to run and play!" },
  { name: "Lettuce", emoji: "🥬", group: "vegetables", fact: "Lettuce helps you stay hydrated!" },
  { name: "Tomato", emoji: "🍅", group: "vegetables", fact: "Tomatoes make your heart healthy!" },
  { name: "Potato", emoji: "🥔", group: "vegetables", fact: "Potatoes give you energy for sports!" },
  { name: "Cucumber", emoji: "🥒", group: "vegetables", fact: "Cucumbers are super refreshing!" },
  { name: "Pepper", emoji: "🌶️", group: "vegetables", fact: "Peppers help fight colds!" },
  { name: "Eggplant", emoji: "🍆", group: "vegetables", fact: "Eggplant helps your brain work better!" },
  { name: "Garlic", emoji: "🧄", group: "vegetables", fact: "Garlic helps keep you from getting sick!" },
  
  // Grains
  { name: "Bread", emoji: "🍞", group: "grains", fact: "Bread gives you energy for the whole day!" },
  { name: "Rice", emoji: "🍚", group: "grains", fact: "Rice helps you feel full and satisfied!" },
  { name: "Pasta", emoji: "🍝", group: "grains", fact: "Pasta is great fuel for active kids!" },
  { name: "Cereal", emoji: "🥣", group: "grains", fact: "Cereal with milk is a perfect breakfast!" },
  { name: "Croissant", emoji: "🥐", group: "grains", fact: "Croissants give you quick energy!" },
  { name: "Pretzel", emoji: "🥨", group: "grains", fact: "Pretzels are a fun crunchy snack!" },
  { name: "Bagel", emoji: "🥯", group: "grains", fact: "Bagels give you long-lasting energy!" },
  { name: "Popcorn", emoji: "🍿", group: "grains", fact: "Popcorn is a whole grain treat!" },
  { name: "Oatmeal", emoji: "🥣", group: "grains", fact: "Oatmeal keeps you full all morning!" },
  { name: "Crackers", emoji: "🍪", group: "grains", fact: "Crackers are perfect for snacking!" },
  
  // Protein
  { name: "Chicken", emoji: "🍗", group: "protein", fact: "Chicken builds strong muscles!" },
  { name: "Fish", emoji: "🐟", group: "protein", fact: "Fish makes your brain super smart!" },
  { name: "Egg", emoji: "🥚", group: "protein", fact: "Eggs help you grow tall and strong!" },
  { name: "Steak", emoji: "🥩", group: "protein", fact: "Beef has iron for strong blood!" },
  { name: "Shrimp", emoji: "🦐", group: "protein", fact: "Shrimp helps build healthy bones!" },
  { name: "Beans", emoji: "🫘", group: "protein", fact: "Beans are great plant protein!" },
  { name: "Nuts", emoji: "🥜", group: "protein", fact: "Nuts keep your heart healthy!" },
  { name: "Bacon", emoji: "🥓", group: "protein", fact: "Bacon gives you energy (in moderation)!" },
  { name: "Turkey", emoji: "🦃", group: "protein", fact: "Turkey helps you feel happy!" },
  { name: "Tofu", emoji: "🧈", group: "protein", fact: "Tofu is awesome plant protein!" },
  
  // Dairy
  { name: "Milk", emoji: "🥛", group: "dairy", fact: "Milk makes your bones super strong!" },
  { name: "Cheese", emoji: "🧀", group: "dairy", fact: "Cheese helps build strong teeth!" },
  { name: "Yogurt", emoji: "🥛", group: "dairy", fact: "Yogurt helps your tummy stay healthy!" },
  { name: "Ice Cream", emoji: "🍦", group: "dairy", fact: "Ice cream has calcium for bones!" },
  { name: "Butter", emoji: "🧈", group: "dairy", fact: "Butter gives foods yummy flavor!" },
  { name: "Pudding", emoji: "🍮", group: "dairy", fact: "Pudding is a sweet calcium treat!" },
  { name: "Milkshake", emoji: "🥤", group: "dairy", fact: "Milkshakes are calcium in a cup!" },
  { name: "Cream Cheese", emoji: "🧀", group: "dairy", fact: "Cream cheese makes bagels yummy!" },
];

const GROUP_CONFIG: Record<FoodGroup, { color: string; bgColor: string; icon: string }> = {
  fruits: { color: "#FF6B6B", bgColor: "#FFE5E5", icon: "🍎" },
  vegetables: { color: "#4CAF50", bgColor: "#E8F5E9", icon: "🥦" },
  grains: { color: "#FF9800", bgColor: "#FFF3E0", icon: "🍞" },
  protein: { color: "#9C27B0", bgColor: "#F3E5F5", icon: "🍗" },
  dairy: { color: "#2196F3", bgColor: "#E3F2FD", icon: "🥛" },
};

const DIFFICULTY_SETTINGS: Record<Difficulty, { spawnRate: number; maxFoods: number; timeLimit: number }> = {
  easy: { spawnRate: 3000, maxFoods: 4, timeLimit: 120 },
  medium: { spawnRate: 2200, maxFoods: 6, timeLimit: 90 },
  hard: { spawnRate: 1500, maxFoods: 8, timeLimit: 60 },
};

export default function FoodGroupsPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [foods, setFoods] = useState<Food[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showFact, setShowFact] = useState<string | null>(null);
  const [factTimeout, setFactTimeout] = useState<NodeJS.Timeout | null>(null);
  const [binPositions, setBinPositions] = useState<Record<FoodGroup, { x: number; y: number }>>({
    fruits: { x: 0, y: 0 },
    vegetables: { x: 0, y: 0 },
    grains: { x: 0, y: 0 },
    protein: { x: 0, y: 0 },
    dairy: { x: 0, y: 0 },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<Food | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Create new food item
  const createFood = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    if (foods.length >= settings.maxFoods) return;

    // Select random food
    const foodData = FOODS[Math.floor(Math.random() * FOODS.length)];

    const food: Food = {
      id: Date.now() + Math.random(),
      ...foodData,
      x: 80 + Math.random() * (typeof window !== "undefined" ? window.innerWidth - 160 : 400),
      y: -80,
      rotation: Math.random() * 30 - 15,
      isDragging: false,
      bounceVelocity: 0,
      isBouncing: false,
    };

    setFoods(prev => [...prev, food]);
  }, [difficulty, foods.length]);

  // Display food fact
  const displayFact = useCallback((fact: string) => {
    if (factTimeout) clearTimeout(factTimeout);
    setShowFact(fact);
    const timeout = setTimeout(() => setShowFact(null), 3000);
    setFactTimeout(timeout);
  }, [factTimeout]);

  // Check if food matches bin
  const checkBinMatch = useCallback((food: Food, binGroup: FoodGroup, binX: number, binY: number) => {
    const dist = Math.sqrt((food.x - binX) ** 2 + (food.y - binY) ** 2);
    return dist < 80;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, food: Food) => {
    e.preventDefault();
    e.stopPropagation();

    setFoods(prev => prev.map(f =>
      f.id === food.id ? { ...f, isDragging: true, isBouncing: false } : f
    ));
    draggingRef.current = food;
  }, []);

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return;

    setFoods(prev => prev.map(f =>
      f.id === draggingRef.current!.id
        ? { ...f, x: clientX, y: clientY }
        : f
    ));
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!draggingRef.current) return;

    const food = draggingRef.current;
    let matched = false;

    // Check each bin
    for (const [binGroup, pos] of Object.entries(binPositions)) {
      if (checkBinMatch(food, binGroup as FoodGroup, pos.x, pos.y)) {
        if (food.group === binGroup) {
          // Correct match!
          matched = true;
          setFoods(prev => prev.filter(f => f.id !== food.id));

          const basePoints = difficulty === "easy" ? 10 : difficulty === "medium" ? 15 : 20;
          const points = basePoints * (1 + combo * 0.25);
          setScore(s => s + Math.round(points));
          setCombo(c => c + 1);
          setCorrectCount(c => c + 1);

          // Show food fact
          displayFact(food.fact);

          // Level up every 100 points
          if ((score + Math.round(points)) >= level * 100) {
            setLevel(l => l + 1);
          }
        } else {
          // Wrong bin - bounce back
          setFoods(prev => prev.map(f =>
            f.id === food.id
              ? { ...f, isDragging: false, isBouncing: true, bounceVelocity: -20 }
              : f
          ));
          setCombo(0);
          setWrongCount(w => w + 1);
        }
        break;
      }
    }

    if (!matched && !foods.find(f => f.id === food.id)?.isBouncing) {
      // Released not on a bin - just stop dragging
      setFoods(prev => prev.map(f =>
        f.id === food.id ? { ...f, isDragging: false } : f
      ));
    }

    draggingRef.current = null;
  }, [binPositions, checkBinMatch, combo, foods, score, level, difficulty, displayFact]);

  // Game loop - spawn foods
  useEffect(() => {
    if (phase !== "playing") {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      return;
    }

    setFoods([]);
    setScore(0);
    setCombo(0);
    setLevel(1);
    setCorrectCount(0);
    setWrongCount(0);
    setShowFact(null);

    const settings = DIFFICULTY_SETTINGS[difficulty];
    setTimeLeft(settings.timeLimit);

    // Spawn foods periodically
    spawnIntervalRef.current = setInterval(() => {
      createFood();
    }, settings.spawnRate);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [phase, difficulty, createFood]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "playing") {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase("gameOver");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase]);

  // Animation loop - make foods fall
  useEffect(() => {
    if (phase !== "playing") return;

    const animate = () => {
      setFoods(prev => {
        const updated = prev.map(food => {
          if (food.isDragging) return food;

          // Handle bouncing (wrong bin)
          if (food.isBouncing) {
            const newY = food.y + food.bounceVelocity;
            const newVelocity = food.bounceVelocity + 0.8;

            const floorY = typeof window !== "undefined" ? window.innerHeight - 280 : 500;
            if (newVelocity > 0 && newY > floorY) {
              return { ...food, y: floorY, isBouncing: false, bounceVelocity: 0 };
            }
            return { ...food, y: newY, bounceVelocity: newVelocity, rotation: food.rotation + 3 };
          }

          // Normal falling - slower for easier difficulties
          const fallSpeed = difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2;
          return {
            ...food,
            y: food.y + fallSpeed,
            rotation: food.rotation + 0.2,
          };
        }).filter(food => food.y < (typeof window !== "undefined" ? window.innerHeight + 100 : 800));

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, difficulty]);

  // Global mouse/touch handlers
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      handleDragMove(x, y);
    };

    const handleUp = () => {
      handleDragEnd();
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [handleDragMove, handleDragEnd]);

  // Calculate bin positions on mount and resize
  useEffect(() => {
    const updateBinPositions = () => {
      if (typeof window !== "undefined") {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const groups: FoodGroup[] = ["fruits", "vegetables", "grains", "protein", "dairy"];
        const spacing = w / 5;
        
        const newPositions: Record<FoodGroup, { x: number; y: number }> = {} as any;
        groups.forEach((group, i) => {
          newPositions[group] = { 
            x: spacing * i + spacing / 2, 
            y: h - 140 
          };
        });
        setBinPositions(newPositions);
      }
    };

    updateBinPositions();
    window.addEventListener("resize", updateBinPositions);
    return () => window.removeEventListener("resize", updateBinPositions);
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render bin
  const renderBin = (group: FoodGroup) => {
    const config = GROUP_CONFIG[group];
    const pos = binPositions[group];

    return (
      <div
        key={group}
        className="absolute flex flex-col items-center"
        style={{ left: pos.x - 55, top: pos.y - 100 }}
      >
        {/* Bin */}
        <div
          className="relative rounded-b-3xl border-4 border-b-8 flex items-center justify-center"
          style={{
            width: 110,
            height: 100,
            backgroundColor: config.bgColor,
            borderColor: config.color,
            boxShadow: `inset 0 -20px 40px ${config.color}22, 0 8px 20px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Bin opening */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center"
            style={{
              width: 90,
              height: 24,
              backgroundColor: config.color,
              boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.3)",
            }}
          >
            <span className="text-2xl">{config.icon}</span>
          </div>
          {/* Food emoji inside */}
          <div className="mt-4 opacity-30 text-4xl">
            {config.icon}
          </div>
        </div>
        {/* Label */}
        <p
          className="mt-2 font-black text-sm capitalize text-center"
          style={{ color: config.color, textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
        >
          {group}
        </p>
      </div>
    );
  };

  // Render food
  const renderFood = (food: Food) => {
    return (
      <div
        key={food.id}
        className={`absolute cursor-grab active:cursor-grabbing select-none ${food.isBouncing ? "animate-pulse" : ""}`}
        style={{
          left: food.x - 40,
          top: food.y - 40,
          transform: `rotate(${food.rotation}deg)`,
          zIndex: food.isDragging ? 100 : 10,
          opacity: food.isBouncing ? 0.7 : 1,
        }}
        onMouseDown={(e) => handleDragStart(e, food)}
        onTouchStart={(e) => handleDragStart(e, food)}
      >
        <div
          className="rounded-2xl p-3 flex flex-col items-center justify-center"
          style={{
            backgroundColor: "white",
            boxShadow: food.isDragging 
              ? "0 12px 32px rgba(0,0,0,0.3)" 
              : "0 4px 12px rgba(0,0,0,0.2)",
            minWidth: 80,
            transition: food.isDragging ? "none" : "box-shadow 0.2s",
          }}
        >
          <span className="text-4xl">{food.emoji}</span>
          <span className="text-xs font-bold text-gray-600 mt-1">{food.name}</span>
        </div>
      </div>
    );
  };

  return (
    <main
      ref={containerRef}
      className="min-h-screen relative overflow-hidden touch-none"
      style={{
        background: `
          linear-gradient(180deg, 
            #87CEEB 0%, 
            #98D8E8 30%,
            #B0E0E6 60%,
            #C5E8DC 100%
          )
        `,
      }}
    >
      {/* Kitchen background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Clouds */}
        <div className="absolute top-10 left-10 w-24 h-12 bg-white/60 rounded-full" />
        <div className="absolute top-8 left-24 w-16 h-10 bg-white/60 rounded-full" />
        <div className="absolute top-16 right-20 w-20 h-10 bg-white/60 rounded-full" />
        <div className="absolute top-12 right-40 w-14 h-8 bg-white/60 rounded-full" />
        
        {/* Counter top */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 220,
            background: "linear-gradient(0deg, #8B7355 0%, #A0896C 50%, #B8A080 100%)",
            borderTop: "8px solid #6B5344",
          }}
        >
          {/* Counter pattern */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-amber-900/10"
              style={{ top: `${i * 5}%` }}
            />
          ))}
        </div>
      </div>

      {/* Bins */}
      {(Object.keys(binPositions) as FoodGroup[]).map(group => renderBin(group))}

      {/* Falling foods */}
      {phase === "playing" && foods.map(food => renderFood(food))}

      {/* Fact popup */}
      {showFact && (
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-6 py-4 shadow-2xl max-w-sm text-center animate-bounce z-50"
          style={{ animation: "bounce 0.5s ease-out" }}
        >
          <p className="text-lg font-bold text-purple-600">💡 Did you know?</p>
          <p className="text-base text-gray-700 mt-1">{showFact}</p>
        </div>
      )}

      {/* UI */}
      {phase === "playing" && (
        <>
          {/* Score and Timer */}
          <div className="absolute top-4 left-4 bg-white/95 rounded-2xl px-5 py-3 shadow-xl">
            <p className="font-black text-2xl text-gray-800">⭐ {score}</p>
            <p className="text-sm font-bold text-gray-500">Level {level}</p>
          </div>
          
          {/* Timer */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 rounded-2xl px-5 py-3 shadow-xl">
            <p className={`font-black text-2xl ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-800"}`}>
              ⏱️ {formatTime(timeLeft)}
            </p>
          </div>
          
          {/* Combo */}
          <div className="absolute top-4 right-4 bg-white/95 rounded-2xl px-5 py-3 shadow-xl">
            {combo > 1 && (
              <p className="text-xl font-black text-orange-500 animate-bounce">
                🔥 {combo}x Combo!
              </p>
            )}
            {combo <= 1 && (
              <p className="text-sm text-gray-500 font-medium">Drag foods to groups!</p>
            )}
          </div>
        </>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-6xl mb-4">🍎🥦🍞🍗🥛</div>
            <h1 className="text-4xl font-black mb-2">
              <span className="text-red-500">Food</span>{" "}
              <span className="text-green-500">Groups</span>
            </h1>
            <p className="text-gray-600 mb-6 text-lg">
              Sort foods into their nutrition groups!
            </p>
            
            {/* Difficulty selector */}
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-500 mb-2">Difficulty</p>
              <div className="flex gap-2 justify-center">
                {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-xl font-bold capitalize transition-all ${
                      difficulty === d
                        ? d === "easy" 
                          ? "bg-green-500 text-white" 
                          : d === "medium"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {d === "easy" && "😊 "}
                    {d === "medium" && "😐 "}
                    {d === "hard" && "😰 "}
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Food groups preview */}
            <div className="flex justify-center gap-3 mb-6">
              {(Object.keys(GROUP_CONFIG) as FoodGroup[]).map(group => (
                <div
                  key={group}
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: GROUP_CONFIG[group].bgColor }}
                >
                  <span className="text-2xl">{GROUP_CONFIG[group].icon}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase("playing")}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-black rounded-2xl text-2xl transition-all shadow-lg hover:shadow-xl"
            >
              🎮 Play!
            </button>
            <p className="text-sm text-gray-400 mt-4">
              🧠 Learn fun food facts as you play!
            </p>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-4xl font-black text-purple-600 mb-4">Time's Up!</h2>
            
            {/* Stats */}
            <div className="bg-purple-50 rounded-2xl p-4 mb-6">
              <p className="text-4xl font-black text-gray-800 my-2">⭐ {score}</p>
              <div className="flex justify-center gap-6 mt-4">
                <div>
                  <p className="text-2xl font-bold text-green-500">✅ {correctCount}</p>
                  <p className="text-xs text-gray-500">Correct</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">❌ {wrongCount}</p>
                  <p className="text-xs text-gray-500">Wrong</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">📊 {level}</p>
                  <p className="text-xs text-gray-500">Level</p>
                </div>
              </div>
            </div>

            {/* Accuracy */}
            {correctCount + wrongCount > 0 && (
              <p className="text-lg text-gray-600 mb-4">
                Accuracy: {Math.round((correctCount / (correctCount + wrongCount)) * 100)}%
              </p>
            )}

            <div className="space-y-3">
              <button
                onClick={() => { setLevel(1); setPhase("playing"); }}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-xl shadow-lg"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl"
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
