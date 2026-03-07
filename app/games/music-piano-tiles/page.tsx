'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type GamePhase = 'menu' | 'playing' | 'freePlay' | 'songComplete';

interface Note {
  key: number;
  time: number;
}

const SONGS: Record<string, { name: string; notes: Note[] }> = {
  twinkle: {
    name: "Twinkle Twinkle Little Star",
    notes: [
      { key: 0, time: 0 }, { key: 0, time: 500 },
      { key: 2, time: 1000 }, { key: 2, time: 1500 },
      { key: 4, time: 2000 }, { key: 4, time: 2500 },
      { key: 2, time: 3000 },
    ]
  },
  mary: {
    name: "Mary Had a Little Lamb",
    notes: [
      { key: 4, time: 0 }, { key: 2, time: 500 },
      { key: 0, time: 1000 }, { key: 2, time: 1500 },
      { key: 4, time: 2000 }, { key: 4, time: 2500 },
      { key: 4, time: 3000 },
    ]
  }
};

const KEY_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
const KEY_FREQUENCIES = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
const KEY_COLORS = ['#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#E056FD', '#F8B739'];

export default function MusicPianoTiles() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [currentSong, setCurrentSong] = useState<string>('twinkle');
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [freePlayMode, setFreePlayMode] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<Note[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const startTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Audio
  const playNote = useCallback((keyIndex: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(KEY_FREQUENCIES[keyIndex], ctx.currentTime);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      
      setActiveKeys(prev => new Set(prev).add(keyIndex));
      setTimeout(() => {
        setActiveKeys(prev => {
          const next = new Set(prev);
          next.delete(keyIndex);
          return next;
        });
      }, 200);
    } catch {}
  }, [soundEnabled]);
  
  const handleKeyPress = useCallback((keyIndex: number) => {
    playNote(keyIndex);
    
    if (freePlayMode && isRecording) {
      const elapsed = Date.now() - startTimeRef.current;
      setRecordedNotes(prev => [...prev, { key: keyIndex, time: elapsed }]);
    }
    
    if (!freePlayMode && gamePhase === 'playing') {
      const song = SONGS[currentSong];
      if (keyIndex === song.notes[currentNoteIndex]?.key) {
        setScore(prev => prev + 10);
        const nextIndex = currentNoteIndex + 1;
        setCurrentNoteIndex(nextIndex);
        
        if (nextIndex >= song.notes.length) {
          setGamePhase('songComplete');
        }
      }
    }
  }, [playNote, freePlayMode, isRecording, gamePhase, currentSong, currentNoteIndex]);
  
  const startSong = useCallback((songId: string) => {
    setCurrentSong(songId);
    setCurrentNoteIndex(0);
    setScore(0);
    setGamePhase('playing');
  }, []);
  
  const startFreePlay = useCallback(() => {
    setFreePlayMode(true);
    setRecordedNotes([]);
    setIsRecording(false);
    setGamePhase('freePlay');
  }, []);
  
  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      setRecordedNotes([]);
      startTimeRef.current = Date.now();
    }
    setIsRecording(!isRecording);
  }, [isRecording]);
  
  const playRecorded = useCallback(() => {
    if (recordedNotes.length === 0) return;
    
    recordedNotes.forEach(note => {
      setTimeout(() => {
        playNote(note.key);
      }, note.time);
    });
  }, [recordedNotes, playNote]);
  
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-black">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      {/* Sound and options */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-8xl mb-4 animate-bounce">🎹</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Music Piano
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Play songs or create your own music!
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => startSong('twinkle')}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xl font-bold py-3 px-6 rounded-full shadow-lg"
              >
                🌟 Twinkle Twinkle
              </button>
              <button
                onClick={() => startSong('mary')}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-xl font-bold py-3 px-6 rounded-full shadow-lg"
              >
                🐑 Mary's Lamb
              </button>
              <button
                onClick={startFreePlay}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-6 rounded-full shadow-lg"
              >
                🎵 Free Play
              </button>
            </div>
            
            <label className="flex items-center justify-center gap-2 text-white/80">
              <input
                type="checkbox"
                checked={showNoteNames}
                onChange={(e) => setShowNoteNames(e.target.checked)}
                className="w-5 h-5"
              />
              Show note names
            </label>
          </div>
        </div>
      )}
      
      {/* Playing/Free Play */}
      {(gamePhase === 'playing' || gamePhase === 'freePlay') && (
        <>
          {/* HUD */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            {!freePlayMode ? (
              <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
                <span className="text-2xl font-bold text-purple-600">
                  ⭐ {score}
                </span>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={toggleRecording}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white/90 text-purple-600'
                  } shadow-xl`}
                >
                  {isRecording ? '⏺️ Recording' : '⏺️ Record'}
                </button>
                {recordedNotes.length > 0 && (
                  <button
                    onClick={playRecorded}
                    className="bg-white/90 text-purple-600 px-4 py-2 rounded-xl font-bold shadow-xl"
                  >
                    ▶️ Play
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Current note indicator (song mode) */}
          {!freePlayMode && currentNoteIndex < SONGS[currentSong].notes.length && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-white/90 rounded-xl px-4 py-2 shadow">
                <span className="text-lg font-semibold text-purple-600">
                  Next: {KEY_NAMES[SONGS[currentSong].notes[currentNoteIndex].key]}
                </span>
              </div>
            </div>
          )}
          
          {/* Piano keys */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-8 px-4">
            <div className="flex gap-2">
              {KEY_NAMES.map((name, index) => (
                <button
                  key={index}
                  onMouseDown={() => handleKeyPress(index)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleKeyPress(index);
                  }}
                  className={`relative w-12 h-48 rounded-t-xl shadow-lg transform transition-all ${
                    activeKeys.has(index)
                      ? 'translate-y-2'
                      : 'hover:translate-y-1'
                  }`}
                  style={{
                    backgroundColor: activeKeys.has(index)
                      ? KEY_COLORS[index]
                      : 'white',
                  }}
                >
                  <div
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: KEY_COLORS[index] }}
                  />
                  {showNoteNames && (
                    <span
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 font-bold text-sm"
                      style={{ color: KEY_COLORS[index] }}
                    >
                      {name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Song complete */}
      {gamePhase === 'songComplete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">Great Job!</h2>
            <p className="text-3xl text-yellow-400 mb-6">Score: {score}</p>
            <div className="space-y-3">
              <button
                onClick={() => startSong(currentSong)}
                className="block w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
              >
                Play Again
              </button>
              <button
                onClick={() => setGamePhase('menu')}
                className="block w-full bg-gray-500 hover:bg-gray-600 text-white text-xl font-bold py-3 px-8 rounded-full"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Back button */}
      {gamePhase !== 'menu' && (
        <button
          onClick={() => {
            setGamePhase('menu');
            setFreePlayMode(false);
          }}
          className="absolute top-4 left-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
        >
          ←
        </button>
      )}
    </main>
  );
}
