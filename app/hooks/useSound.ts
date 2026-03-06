"use client";

import { useCallback, useRef } from "react";

export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine") => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported or blocked
    }
  }, [getAudioContext]);

  const playDing = useCallback(() => {
    // Play a cheerful "ding" sound
    playTone(880, 0.1, "sine"); // A5
    setTimeout(() => playTone(1100, 0.15, "sine"), 50); // C#6
    setTimeout(() => playTone(1320, 0.2, "sine"), 100); // E6
  }, [playTone]);

  const playVictory = useCallback(() => {
    // Play a victory fanfare
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, "sine"), i * 150);
    });
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(600, 0.05, "square");
  }, [playTone]);

  return {
    playDing,
    playVictory,
    playClick,
  };
}
