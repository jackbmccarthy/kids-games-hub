"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "playing" | "feedback" | "gameover";

type AnimalCategory = "farm" | "jungle" | "pet";

interface Animal {
  id: string;
  name: string;
  emoji: string;
  category: AnimalCategory;
  sound: {
    frequency: number;
    type: OscillatorType;
    pattern: "bark" | "meow" | "moo" | "oink" | "cluck" | "quack" | "baa" | "neigh" | "ribbit" | "chirp" | "trumpet" | "roar" | "hiss" | "hoot" | "howl" | "squeak" | "purr" | "tweet";
  };
  color: string;
  bgColor: string;
}

const ANIMALS: Animal[] = [
  // Farm Animals
  { 
    id: "cow", 
    name: "Cow", 
    emoji: "🐄", 
    category: "farm",
    sound: { frequency: 120, type: "sawtooth", pattern: "moo" },
    color: "text-amber-800",
    bgColor: "bg-amber-100"
  },
  { 
    id: "pig", 
    name: "Pig", 
    emoji: "🐷", 
    category: "farm",
    sound: { frequency: 280, type: "square", pattern: "oink" },
    color: "text-pink-600",
    bgColor: "bg-pink-100"
  },
  { 
    id: "chicken", 
    name: "Chicken", 
    emoji: "🐔", 
    category: "farm",
    sound: { frequency: 600, type: "square", pattern: "cluck" },
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
  { 
    id: "duck", 
    name: "Duck", 
    emoji: "🦆", 
    category: "farm",
    sound: { frequency: 350, type: "triangle", pattern: "quack" },
    color: "text-yellow-600",
    bgColor: "bg-yellow-100"
  },
  { 
    id: "sheep", 
    name: "Sheep", 
    emoji: "🐑", 
    category: "farm",
    sound: { frequency: 300, type: "sine", pattern: "baa" },
    color: "text-gray-600",
    bgColor: "bg-gray-100"
  },
  { 
    id: "horse", 
    name: "Horse", 
    emoji: "🐴", 
    category: "farm",
    sound: { frequency: 200, type: "sawtooth", pattern: "neigh" },
    color: "text-amber-700",
    bgColor: "bg-amber-50"
  },
  { 
    id: "rooster", 
    name: "Rooster", 
    emoji: "🐓", 
    category: "farm",
    sound: { frequency: 500, type: "square", pattern: "chirp" },
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  { 
    id: "goat", 
    name: "Goat", 
    emoji: "🐐", 
    category: "farm",
    sound: { frequency: 320, type: "sawtooth", pattern: "baa" },
    color: "text-amber-600",
    bgColor: "bg-amber-100"
  },

  // Jungle Animals
  { 
    id: "lion", 
    name: "Lion", 
    emoji: "🦁", 
    category: "jungle",
    sound: { frequency: 150, type: "sawtooth", pattern: "roar" },
    color: "text-amber-600",
    bgColor: "bg-amber-200"
  },
  { 
    id: "elephant", 
    name: "Elephant", 
    emoji: "🐘", 
    category: "jungle",
    sound: { frequency: 100, type: "sawtooth", pattern: "trumpet" },
    color: "text-gray-700",
    bgColor: "bg-gray-200"
  },
  { 
    id: "monkey", 
    name: "Monkey", 
    emoji: "🐵", 
    category: "jungle",
    sound: { frequency: 450, type: "square", pattern: "squeak" },
    color: "text-amber-700",
    bgColor: "bg-amber-100"
  },
  { 
    id: "snake", 
    name: "Snake", 
    emoji: "🐍", 
    category: "jungle",
    sound: { frequency: 250, type: "sine", pattern: "hiss" },
    color: "text-green-700",
    bgColor: "bg-green-100"
  },
  { 
    id: "parrot", 
    name: "Parrot", 
    emoji: "🦜", 
    category: "jungle",
    sound: { frequency: 700, type: "square", pattern: "tweet" },
    color: "text-red-500",
    bgColor: "bg-red-100"
  },
  { 
    id: "frog", 
    name: "Frog", 
    emoji: "🐸", 
    category: "jungle",
    sound: { frequency: 220, type: "sine", pattern: "ribbit" },
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  { 
    id: "tiger", 
    name: "Tiger", 
    emoji: "🐯", 
    category: "jungle",
    sound: { frequency: 140, type: "sawtooth", pattern: "roar" },
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
  { 
    id: "gorilla", 
    name: "Gorilla", 
    emoji: "🦍", 
    category: "jungle",
    sound: { frequency: 120, type: "sawtooth", pattern: "roar" },
    color: "text-gray-800",
    bgColor: "bg-gray-200"
  },

  // Pet Animals
  { 
    id: "dog", 
    name: "Dog", 
    emoji: "🐕", 
    category: "pet",
    sound: { frequency: 380, type: "sawtooth", pattern: "bark" },
    color: "text-amber-700",
    bgColor: "bg-amber-100"
  },
  { 
    id: "cat", 
    name: "Cat", 
    emoji: "🐱", 
    category: "pet",
    sound: { frequency: 500, type: "sine", pattern: "meow" },
    color: "text-orange-500",
    bgColor: "bg-orange-100"
  },
  { 
    id: "rabbit", 
    name: "Rabbit", 
    emoji: "🐰", 
    category: "pet",
    sound: { frequency: 550, type: "sine", pattern: "squeak" },
    color: "text-pink-500",
    bgColor: "bg-pink-100"
  },
  { 
    id: "hamster", 
    name: "Hamster", 
    emoji: "🐹", 
    category: "pet",
    sound: { frequency: 600, type: "square", pattern: "squeak" },
    color: "text-amber-500",
    bgColor: "bg-amber-100"
  },
  { 
    id: "bird", 
    name: "Bird", 
    emoji: "🐦", 
    category: "pet",
    sound: { frequency: 800, type: "sine", pattern: "tweet" },
    color: "text-blue-500",
    bgColor: "bg-blue-100"
  },
  { 
    id: "fish", 
    name: "Fish", 
    emoji: "🐠", 
    category: "pet",
    sound: { frequency: 200, type: "sine", pattern: "chirp" },
    color: "text-cyan-500",
    bgColor: "bg-cyan-100"
  },
  { 
    id: "turtle", 
    name: "Turtle", 
    emoji: "🐢", 
    category: "pet",
    sound: { frequency: 180, type: "triangle", pattern: "hiss" },
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  { 
    id: "guinea-pig", 
    name: "Guinea Pig", 
    emoji: "🐹", 
    category: "pet",
    sound: { frequency: 520, type: "square", pattern: "squeak" },
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
];

const CATEGORY_CONFIG = {
  farm: { name: "Farm", emoji: "🌾", gradient: "from-amber-300 to-orange-300" },
  jungle: { name: "Jungle", emoji: "🌴", gradient: "from-green-400 to-emerald-400" },
  pet: { name: "Pets", emoji: "🏠", gradient: "from-pink-300 to-purple-300" },
};

export default function AnimalSoundsPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | "all">("all");
  const [currentAnimal, setCurrentAnimal] = useState<Animal | null>(null);
  const [options, setOptions] = useState<Animal[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentOscillatorRef = useRef<OscillatorNode | null>(null);
  const currentGainRef = useRef<GainNode | null>(null);

  // Get or create audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Stop current sound
  const stopSound = useCallback(() => {
    if (currentOscillatorRef.current) {
      try {
        currentOscillatorRef.current.stop();
      } catch {
        // Already stopped
      }
      currentOscillatorRef.current = null;
    }
    setIsPlayingSound(false);
  }, []);

  // Play animal sound
  const playAnimalSound = useCallback((animal: Animal) => {
    stopSound();
    
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    currentOscillatorRef.current = oscillator;
    currentGainRef.current = gainNode;

    oscillator.type = animal.sound.type;
    filter.type = "lowpass";
    filter.frequency.value = 1500;

    const now = ctx.currentTime;
    const freq = animal.sound.frequency;
    const vol = volume * 0.4;

    // Different sound patterns for different animals
    switch (animal.sound.pattern) {
      case "moo":
        oscillator.frequency.setValueAtTime(freq * 0.7, now);
        oscillator.frequency.linearRampToValueAtTime(freq, now + 0.3);
        oscillator.frequency.linearRampToValueAtTime(freq * 0.8, now + 0.8);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(vol * 0.7, now + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
        break;

      case "oink":
        for (let i = 0; i < 2; i++) {
          const t = now + i * 0.4;
          oscillator.frequency.setValueAtTime(freq * 1.2, t);
          oscillator.frequency.linearRampToValueAtTime(freq * 0.8, t + 0.15);
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol, t + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.25);
        }
        break;

      case "cluck":
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.15;
          oscillator.frequency.setValueAtTime(freq, t);
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol * 0.8, t + 0.02);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.08);
        }
        break;

      case "quack":
        for (let i = 0; i < 2; i++) {
          const t = now + i * 0.35;
          oscillator.frequency.setValueAtTime(freq * 1.3, t);
          oscillator.frequency.linearRampToValueAtTime(freq * 0.7, t + 0.2);
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol, t + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.3);
        }
        break;

      case "baa":
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.frequency.linearRampToValueAtTime(freq * 1.2, now + 0.15);
        oscillator.frequency.linearRampToValueAtTime(freq * 0.9, now + 0.4);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        break;

      case "neigh":
        oscillator.frequency.setValueAtTime(freq * 0.8, now);
        oscillator.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.2);
        oscillator.frequency.linearRampToValueAtTime(freq * 0.7, now + 0.6);
        oscillator.frequency.linearRampToValueAtTime(freq * 1.2, now + 0.9);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(vol * 0.5, now + 0.6);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
        break;

      case "roar":
        oscillator.frequency.setValueAtTime(freq * 0.5, now);
        oscillator.frequency.linearRampToValueAtTime(freq, now + 0.4);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol * 1.2, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(vol * 0.8, now + 0.7);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.2);
        break;

      case "trumpet":
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.frequency.linearRampToValueAtTime(freq * 0.7, now + 0.3);
        oscillator.frequency.linearRampToValueAtTime(freq * 1.1, now + 0.6);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(vol * 0.7, now + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.9);
        break;

      case "squeak":
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.2;
          oscillator.frequency.setValueAtTime(freq * 1.2, t);
          oscillator.frequency.linearRampToValueAtTime(freq * 0.9, t + 0.1);
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol * 0.7, t + 0.02);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.12);
        }
        break;

      case "hiss":
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(freq * 2, now);
        filter.type = "highpass";
        filter.frequency.value = 2000;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol * 0.3, now + 0.1);
        gainNode.gain.setValueAtTime(vol * 0.3, now + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.8);
        break;

      case "ribbit":
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.25;
          oscillator.frequency.setValueAtTime(freq * 0.8, t);
          oscillator.frequency.linearRampToValueAtTime(freq * 1.2, t + 0.05);
          oscillator.frequency.linearRampToValueAtTime(freq * 0.7, t + 0.15);
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol * 0.6, t + 0.02);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.18);
        }
        break;

      case "tweet":
      case "chirp":
        for (let i = 0; i < 4; i++) {
          const t = now + i * 0.18;
          oscillator.frequency.setValueAtTime(freq, t);
          oscillator.frequency.linearRampToValueAtTime(freq * 1.3, t + 0.05);
          oscillator.frequency.linearRampToValueAtTime(freq * 0.9, t + 0.1);
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol * 0.6, t + 0.02);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.12);
        }
        break;

      case "bark":
        for (let i = 0; i < 2; i++) {
          const t = now + i * 0.3;
          oscillator.frequency.setValueAtTime(freq * 1.1, t);
          oscillator.frequency.linearRampToValueAtTime(freq * 0.7, t + 0.1);
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol, t + 0.02);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.15);
        }
        break;

      case "meow":
        oscillator.frequency.setValueAtTime(freq * 0.9, now);
        oscillator.frequency.linearRampToValueAtTime(freq * 1.3, now + 0.2);
        oscillator.frequency.linearRampToValueAtTime(freq * 0.8, now + 0.5);
        oscillator.frequency.linearRampToValueAtTime(freq * 1.1, now + 0.7);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol * 0.7, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.8);
        break;

      case "purr":
        oscillator.type = "sawtooth";
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfo.frequency.value = 25;
        lfoGain.gain.value = vol * 0.3;
        oscillator.frequency.setValueAtTime(freq * 0.5, now);
        gainNode.gain.setValueAtTime(vol * 0.4, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
        lfo.start(now);
        lfo.stop(now + 1.0);
        break;

      case "howl":
        oscillator.frequency.setValueAtTime(freq * 0.6, now);
        oscillator.frequency.linearRampToValueAtTime(freq, now + 0.3);
        oscillator.frequency.linearRampToValueAtTime(freq * 1.1, now + 0.7);
        oscillator.frequency.linearRampToValueAtTime(freq * 0.8, now + 1.2);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(vol * 0.6, now + 0.8);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.4);
        break;

      case "hoot":
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.4;
          oscillator.frequency.setValueAtTime(freq * 0.9, t);
          oscillator.frequency.linearRampToValueAtTime(freq * 1.1, t + 0.1);
          oscillator.frequency.setValueAtTime(freq * 0.9, t + 0.2);
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol * 0.6, t + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.3);
        }
        break;
    }

    const duration = 1.5;
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    setIsPlayingSound(true);
    oscillator.onended = () => setIsPlayingSound(false);
  }, [volume, stopSound, getAudioContext]);

  // Speak animal name
  const speakAnimalName = useCallback((animal: Animal) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(animal.name);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Play sound and speak name
  const playSoundAndSpeak = useCallback((animal: Animal) => {
    playAnimalSound(animal);
    setTimeout(() => speakAnimalName(animal), 1000);
  }, [playAnimalSound, speakAnimalName]);

  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Get animals for current category
  const getAvailableAnimals = useCallback(() => {
    if (selectedCategory === "all") {
      return ANIMALS;
    }
    return ANIMALS.filter(a => a.category === selectedCategory);
  }, [selectedCategory]);

  // Start new round
  const startRound = useCallback(() => {
    const available = getAvailableAnimals();
    const shuffled = shuffleArray(available);
    const correctAnimal = shuffled[0];
    
    // Get 3 wrong options
    const wrongOptions = shuffled
      .filter(a => a.id !== correctAnimal.id)
      .slice(0, 3);
    
    const allOptions = shuffleArray([correctAnimal, ...wrongOptions]);
    
    setCurrentAnimal(correctAnimal);
    setOptions(allOptions);
    setFeedbackType(null);
    setPhase("playing");
    
    // Play the sound and speak the name after a short delay
    setTimeout(() => {
      playSoundAndSpeak(correctAnimal);
    }, 500);
  }, [getAvailableAnimals, playSoundAndSpeak]);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setRound(1);
    setStreak(0);
    startRound();
  }, [startRound]);

  // Handle answer
  const handleAnswer = useCallback((selected: Animal) => {
    if (!currentAnimal || feedbackType) return;

    if (selected.id === currentAnimal.id) {
      // Correct!
      const points = 10 + streak * 5;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setFeedbackType("correct");
      setPhase("feedback");
      
      // Speak the animal name again with praise
      speakAnimalName(currentAnimal);
      
      // Check if game over (10 rounds)
      if (round >= 10) {
        setTimeout(() => {
          setPhase("gameover");
        }, 1500);
      } else {
        // Auto advance after delay
        setTimeout(() => {
          setRound(prev => prev + 1);
          startRound();
        }, 2000);
      }
    } else {
      // Wrong
      setStreak(0);
      setFeedbackType("wrong");
      
      // Allow retry after delay
      setTimeout(() => {
        setFeedbackType(null);
        playSoundAndSpeak(currentAnimal);
      }, 1200);
    }
  }, [currentAnimal, feedbackType, streak, round, startRound, playSoundAndSpeak, speakAnimalName]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("animal-sounds-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("animal-sounds-high-score", String(score));
    }
  }, [score, highScore]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopSound();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopSound]);

  const totalAnimals = ANIMALS.length;
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-200 via-purple-100 to-pink-200 p-4">
      {/* Header */}
      <header className="max-w-2xl mx-auto text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
          🎵 Animal Sounds 🎵
        </h1>
        {phase === "playing" && (
          <div className="flex justify-center gap-4 flex-wrap text-lg font-bold">
            <span className="bg-white/80 px-3 py-1 rounded-full text-green-600">⭐ {score}</span>
            <span className="bg-white/80 px-3 py-1 rounded-full text-blue-600">🎮 Round {round}/10</span>
            {streak > 1 && (
              <span className="bg-orange-100 px-3 py-1 rounded-full text-orange-600">🔥 x{streak}</span>
            )}
          </div>
        )}
      </header>

      {/* Volume Control - Always visible */}
      <div className="max-w-md mx-auto mb-4">
        <div className="flex items-center justify-center gap-3 bg-white/90 rounded-2xl p-3 shadow-md">
          <span className="text-xl">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-32 h-3 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-xl">🔊</span>
          <span className="text-sm font-bold text-gray-600 w-12">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Menu */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-6 shadow-xl text-center mb-4">
            <p className="text-gray-600 mb-4 text-lg">
              Listen to the animal sound and tap the matching animal! 🐾
            </p>

            {/* Category Selection */}
            <div className="mb-4">
              <p className="font-bold text-gray-700 mb-2">Choose Animals:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`p-3 rounded-xl font-bold transition-all ${
                    selectedCategory === "all"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  🌍 All
                  <span className="block text-xs opacity-80">{totalAnimals} animals</span>
                </button>
                {(["farm", "jungle", "pet"] as const).map(cat => {
                  const config = CATEGORY_CONFIG[cat];
                  const count = ANIMALS.filter(a => a.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-3 rounded-xl font-bold transition-all ${
                        selectedCategory === cat
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg scale-105`
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {config.emoji} {config.name}
                      <span className="block text-xs opacity-80">{count} animals</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {highScore > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">
                🏆 Best Score: {highScore}
              </p>
            )}

            <button
              onClick={startGame}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-2xl text-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              ▶️ Play!
            </button>
          </div>

          {/* Animal Preview */}
          <div className="bg-white/60 rounded-2xl p-4">
            <p className="text-center text-gray-500 font-bold mb-2">Animals you'll meet:</p>
            <div className="flex flex-wrap justify-center gap-2 text-2xl">
              {ANIMALS.slice(0, 12).map(animal => (
                <span key={animal.id} title={animal.name} className="hover:scale-125 transition-transform cursor-pointer">
                  {animal.emoji}
                </span>
              ))}
              <span className="text-gray-400">+{ANIMALS.length - 12} more</span>
            </div>
          </div>
        </div>
      )}

      {/* Playing Phase */}
      {(phase === "playing" || phase === "feedback") && currentAnimal && (
        <div className="max-w-lg mx-auto">
          {/* Sound Button */}
          <div className="text-center mb-6">
            <button
              onClick={() => playSoundAndSpeak(currentAnimal)}
              disabled={isPlayingSound}
              className={`w-28 h-28 md:w-32 md:h-32 rounded-full text-5xl shadow-xl transition-all ${
                isPlayingSound
                  ? "bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"
                  : "bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 border-4 border-purple-200"
              }`}
            >
              {isPlayingSound ? "🔊" : isSpeaking ? "💬" : "👂"}
            </button>
            <p className="mt-2 text-lg font-bold text-gray-600">
              {isPlayingSound ? "🎵 Playing sound..." : isSpeaking ? "Speaking..." : "Tap to hear again!"}
            </p>
          </div>

          {/* Feedback Overlay */}
          {feedbackType && (
            <div className={`fixed inset-0 flex items-center justify-center z-40 pointer-events-none ${
              feedbackType === "correct" ? "bg-green-400/20" : "bg-red-400/20"
            }`}>
              <div className={`text-8xl md:text-9xl animate-bounce ${
                feedbackType === "correct" ? "text-green-500" : "text-red-500"
              }`}>
                {feedbackType === "correct" ? "✅" : "❌"}
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {options.map((option) => {
              const isCorrectOption = option.id === currentAnimal.id;
              const showCorrect = feedbackType === "correct" && isCorrectOption;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option)}
                  disabled={feedbackType === "correct"}
                  className={`${option.bgColor} rounded-3xl p-4 md:p-6 transition-all shadow-lg border-4 border-white/50 ${
                    feedbackType === "correct"
                      ? "opacity-50 cursor-not-allowed"
                      : feedbackType === "wrong"
                        ? "hover:scale-105 active:scale-95 cursor-pointer"
                        : "hover:scale-105 active:scale-95 cursor-pointer"
                  } ${showCorrect ? "ring-4 ring-green-400 scale-110 opacity-100" : ""}`}
                >
                  <span className="text-5xl md:text-6xl block mb-2">{option.emoji}</span>
                  <span className={`text-lg md:text-xl font-bold ${option.color}`}>
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wrong answer hint */}
          {feedbackType === "wrong" && (
            <div className="text-center mt-4 animate-bounce">
              <p className="text-red-500 font-bold text-xl bg-white/80 px-4 py-2 rounded-full inline-block">
                🤔 Try again! Listen carefully!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Game Over */}
      {phase === "gameover" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-purple-600 mb-2">Amazing Job!</h2>
            <p className="text-4xl font-bold text-gray-700 my-4">
              ⭐ {score} Points!
            </p>
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4 animate-pulse">
                🏆 New High Score!
              </p>
            )}
            <div className="text-lg text-gray-500 mb-6">
              You completed {round} rounds!
            </div>
            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => {
                  stopSound();
                  setPhase("menu");
                }}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Menu Button */}
      {phase !== "menu" && phase !== "gameover" && (
        <div className="max-w-lg mx-auto mt-6 text-center">
          <button
            onClick={() => {
              stopSound();
              if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              setPhase("menu");
            }}
            className="px-6 py-3 bg-white/80 hover:bg-white text-gray-700 font-bold rounded-xl transition-all shadow"
          >
            🏠 Menu
          </button>
        </div>
      )}
    </main>
  );
}
