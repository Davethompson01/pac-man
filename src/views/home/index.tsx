// Next, React
// import { FC, useState } from "react";
import React, { FC, useEffect, useState, useRef, useCallback } from "react";

import pkg from "../../../package.json";
// import React from "react";

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake “feed card” top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.

// import React, { FC, useEffect, useState } from "react";
// import React, { FC, useEffect, useRef, useState } from "react";

// import React, { FC, useEffect, useState } from "react";

// import React, { FC, useState, useEffect, useRef, useCallback } from "react";

// // Define types outside the component for better readability
// type Pos = { x: number; y: number };
// type Dir = Pos;
// type Ghost = { id: string; pos: Pos; color: string; initialPos: Pos };

// import React, { FC, useState, useEffect, useRef, useCallback } from "react";
// import React, { FC, useState, useEffect, useRef, useCallback } from "react";

// --- TYPE DEFINITIONS ---
type Pos = { x: number; y: number };
type Dir = Pos;
type GhostMode = "chase" | "scatter" | "frightened";
type Ghost = {
  id: string;
  pos: Pos;
  color: string;
  initialPos: Pos;
  initialDir: Dir;
  mode: GhostMode;
};

// --- GHOST DEFINITIONS & TIMERS ---
const GHOST_INITIAL_POSITIONS: Record<string, Pos> = {
  blinky: { x: 13, y: 1 },
  pinky: { x: 13, y: 13 },
  inky: { x: 1, y: 13 },
  clyde: { x: 2, y: 1 },
};

const GHOST_SCATTER_POSITIONS: Record<string, Pos> = {
  blinky: { x: 13, y: 1 },
  pinky: { x: 1, y: 1 },
  inky: { x: 1, y: 13 },
  clyde: { x: 13, y: 13 },
};

const MODE_TIMERS = [7000, 20000, 7000, 20000, 5000, 20000, 5000, Infinity];

// --- SOUND UTILITY (Keeping placeholders for sound logic) ---
const audioSources: Record<string, string> = {
  waka: "/sounds/pacman_waka.mp3",
  frightened_start: "/sounds/pacman_power_pellet.mp3",
  ghost_eaten: "/sounds/pacman_eat_ghost.mp3",
  death: "/sounds/pacman_death.mp3",
  game_over: "/sounds/pacman_game_over.mp3",
  siren: "/sounds/pacman_siren.mp3",
};

const loadedAudio: Record<string, HTMLAudioElement> = {};

const loadAudio = () => {
  for (const key in audioSources) {
    const audio = new Audio(audioSources[key]);
    audio.preload = "auto";
    loadedAudio[key] = audio;
  }
};

const playSound = (soundName: string, loop: boolean = false) => {
  const audio = loadedAudio[soundName];
  if (audio) {
    audio.currentTime = 0;
    audio.loop = loop;
    audio
      .play()
      .catch((e) =>
        console.error(`Audio playback failed for ${soundName}:`, e)
      );
  }
};

const stopSound = (soundName: string) => {
  const audio = loadedAudio[soundName];
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};
// -----------------------

const GameSandbox: FC = () => {
  const COLS = 15;
  const ROWS = 15;
  const CELL = 28;
  const TICK = 250;

  const MAZE = [
    "###############",
    "#.............#",
    "#.###.###.###..#",
    "#o###.###.###o.#",
    "#.............#",
    "#.###.#.#.###.#",
    "#.....#.#.....#",
    "#####.#.#.#####",
    "#.....#.#.....#",
    "#.###.#.#.###.#",
    "#.............#",
    "#.###.###.###..#",
    "#o...........o#",
    "#.............#",
    "###############",
  ];

  const isWall = (x: number, y: number) => MAZE[y] && MAZE[y][x] === "#";

  const [score, setScore] = useState(0);
  const [pacman, setPacman] = useState<Pos>({ x: 1, y: 1 });

  // 🐛 FIX 1: Pac-Man starts stationary.
  const [dir, setDir] = useState<Dir>({ x: 0, y: 0 });
  const [desiredDir, setDesiredDir] = useState<Dir>({ x: 0, y: 0 });

  const mouth = useRef(true);

  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [gameReady, setGameReady] = useState(false);

  // Ghost Mode Management
  const [ghostMode, setGhostMode] = useState<"chase" | "scatter">("scatter");
  const modeIndex = useRef(0);
  const ghostEatenCount = useRef(0);

  const [pellets, setPellets] = useState(
    () =>
      new Set(
        MAZE.flatMap((row, y) =>
          row.split("").reduce((acc: string[], char, x) => {
            if (char === "." || char === "o") {
              acc.push(`${x},${y}`);
            }
            return acc;
          }, [])
        )
      )
  );

  const [ghosts, setGhosts] = useState<Ghost[]>([
    {
      id: "blinky",
      pos: GHOST_INITIAL_POSITIONS.blinky,
      color: "🔴",
      initialPos: GHOST_INITIAL_POSITIONS.blinky,
      initialDir: { x: -1, y: 0 },
      mode: "scatter",
    },
    {
      id: "pinky",
      pos: GHOST_INITIAL_POSITIONS.pinky,
      color: "🩷", // Pink
      initialPos: GHOST_INITIAL_POSITIONS.pinky,
      initialDir: { x: 0, y: -1 },
      mode: "scatter",
    },
    {
      id: "inky",
      pos: GHOST_INITIAL_POSITIONS.inky,
      color: "💙", // Cyan/Blue
      initialPos: GHOST_INITIAL_POSITIONS.inky,
      initialDir: { x: 1, y: 0 },
      mode: "scatter",
    },
    {
      id: "clyde",
      pos: GHOST_INITIAL_POSITIONS.clyde,
      color: "🟠", // Orange
      initialPos: GHOST_INITIAL_POSITIONS.clyde,
      initialDir: { x: 1, y: 0 },
      mode: "scatter",
    },
  ]);

  const [frightened, setFrightened] = useState(false);
  const frightenedTimer = useRef<NodeJS.Timeout | null>(null);

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Joystick state
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickStickRef = useRef<HTMLDivElement>(null);
  const joystickCenterRef = useRef<{ x: number; y: number; radius: number } | null>(null);

  useEffect(() => {
    // Detect touch devices
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
      );
    };
    setIsTouchDevice(checkTouchDevice());
  }, []);

  // --- Utility Functions ---

  const distSq = (p1: Pos, p2: Pos) =>
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

  const getNextGhostMove = useCallback(
    (g: Ghost, targetPos: Pos, lastDir: Dir): Pos => {
      const moves: Dir[] = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];

      let bestMove: Dir | null = null;
      let bestDist = g.mode === "frightened" ? -Infinity : Infinity;
      
      // Only prevent reverse if we have a valid last direction (not stationary)
      const preventReverse = lastDir.x !== 0 || lastDir.y !== 0;

      // First pass: find best move avoiding reverse
      for (const move of moves) {
        if (preventReverse && move.x === -lastDir.x && move.y === -lastDir.y) continue;

        const nx = g.pos.x + move.x;
        const ny = g.pos.y + move.y;

        // Bounds checking
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        if (isWall(nx, ny)) continue;

        const newPos: Pos = { x: nx, y: ny };
        const d = distSq(newPos, targetPos);

        if (g.mode === "frightened" ? d > bestDist : d < bestDist) {
          bestDist = d;
          bestMove = move;
        }
      }

      // If no best move found (ghost in dead end), allow reverse as fallback
      if (!bestMove) {
        for (const move of moves) {
          const nx = g.pos.x + move.x;
          const ny = g.pos.y + move.y;
          
          // Bounds checking
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
          if (isWall(nx, ny)) continue;
          
          // Found a valid move (including reverse)
          return move;
        }
      }

      return bestMove || { x: 0, y: 0 };
    },
    [isWall, distSq]
  );

  // Unified direction handler (used by both keyboard and touch)
  const handleDirectionChange = useCallback(
    (newDir: Dir) => {
      if (!gameReady || gameOver || won) return;
      setDesiredDir(newDir);
    },
    [gameReady, gameOver, won]
  );

  // Calculate direction from joystick position
  const calculateJoystickDirection = useCallback(
    (stickX: number, stickY: number, centerX: number, centerY: number, radius: number) => {
      const dx = stickX - centerX;
      const dy = stickY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize to radius
      const normalizedX = distance > 0 ? dx / distance : 0;
      const normalizedY = distance > 0 ? dy / distance : 0;
      
      // Determine primary direction (cardinal directions only)
      const absX = Math.abs(normalizedX);
      const absY = Math.abs(normalizedY);
      
      if (absX > absY) {
        // Horizontal movement
        return normalizedX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      } else if (absY > absX) {
        // Vertical movement
        return normalizedY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
      }
      
      // Default to no movement
      return { x: 0, y: 0 };
    },
    []
  );

  // Joystick touch handlers
  const handleJoystickStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!gameReady || gameOver || won) return;
      
      // Use touch position as center - allows touching anywhere on screen
      const radius = 50; // Joystick radius in pixels
      
      joystickCenterRef.current = { x: clientX, y: clientY, radius };
      setJoystickActive(true);
      
      // Initial touch sets center, no movement yet
      setJoystickPosition({ x: 0, y: 0 });
    },
    [gameReady, gameOver, won]
  );

  const handleJoystickMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickActive || !joystickCenterRef.current) return;
      
      const { x: centerX, y: centerY, radius } = joystickCenterRef.current;
      
      // Calculate direction
      const direction = calculateJoystickDirection(
        clientX,
        clientY,
        centerX,
        centerY,
        radius
      );
      handleDirectionChange(direction);
      
      // Update joystick stick position (clamped to radius)
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
      const angle = Math.atan2(dy, dx);
      
      setJoystickPosition({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      });
    },
    [joystickActive, calculateJoystickDirection, handleDirectionChange]
  );

  const handleJoystickEnd = useCallback(() => {
    setJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    joystickCenterRef.current = null;
    handleDirectionChange({ x: 0, y: 0 }); // Stop movement
  }, [handleDirectionChange]);

  // Global touch handlers for joystick
  useEffect(() => {
    if (!isTouchDevice) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!gameReady || gameOver || won) return;
      const touch = e.touches[0];
      if (touch) {
        handleJoystickStart(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!joystickActive) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        handleJoystickMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      handleJoystickEnd();
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleJoystickEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleJoystickEnd);
    };
  }, [isTouchDevice, gameReady, gameOver, won, joystickActive, handleJoystickStart, handleJoystickMove, handleJoystickEnd]);

  // --- 1. Input Handling: Allows the player to control Pac-Man ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only allow input when the game is ready
      if (!gameReady || gameOver || won) return;

      if (e.key === "ArrowUp") handleDirectionChange({ x: 0, y: -1 });
      if (e.key === "ArrowDown") handleDirectionChange({ x: 0, y: 1 });
      if (e.key === "ArrowLeft") handleDirectionChange({ x: -1, y: 0 });
      if (e.key === "ArrowRight") handleDirectionChange({ x: 1, y: 0 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameReady, gameOver, won, handleDirectionChange]); // Dependent on game state

  // --- AUDIO INITIALIZATION & GAME READY DELAY ---
  useEffect(() => {
    loadAudio();
    const readyTimer = setTimeout(() => {
      setGameReady(true);
    }, 500);

    return () => clearTimeout(readyTimer);
  }, []);

  // --- AUDIO CONTROL: Siren/Music Loop ---
  useEffect(() => {
    if (!gameReady || gameOver || won) {
      stopSound("siren");
      return;
    }

    if (!frightened) {
      playSound("siren", true);
    } else {
      stopSound("siren");
    }

    return () => {
      stopSound("siren");
    };
  }, [gameReady, gameOver, won, frightened]);

  // --- Ghost Mode Timer (Scatter/Chase) ---
  useEffect(() => {
    if (!gameReady || gameOver || won || frightened) return;

    const currentDuration = MODE_TIMERS[modeIndex.current];

    if (currentDuration !== Infinity) {
      const timer = setTimeout(() => {
        setGhostMode((prevMode) =>
          prevMode === "scatter" ? "chase" : "scatter"
        );
        modeIndex.current = (modeIndex.current + 1) % MODE_TIMERS.length;
      }, currentDuration);

      return () => clearTimeout(timer);
    }
  }, [gameReady, gameOver, won, frightened, ghostMode]);

  // 2. Power Pellet Timer
  useEffect(() => {
    if (frightenedTimer.current) clearTimeout(frightenedTimer.current);

    if (frightened) {
      ghostEatenCount.current = 0;
      playSound("frightened_start");

      frightenedTimer.current = setTimeout(() => {
        setFrightened(false);
      }, 6000);

      return () => {
        if (frightenedTimer.current) clearTimeout(frightenedTimer.current);
      };
    }
  }, [frightened]);

  // 3. Main Game Loop
  useEffect(() => {
    if (!gameReady || gameOver || won) return;

    const loop = setInterval(() => {
      mouth.current = !mouth.current;

      // --- PACMAN Movement and Pellet Eating ---
      setPacman((p) => {
        const tryX = p.x + desiredDir.x;
        const tryY = p.y + desiredDir.y;
        let currentDir = dir;

        // Attempt to turn in the desired direction
        if (!isWall(tryX, tryY)) {
          currentDir = desiredDir;
          setDir(desiredDir);
        }

        const nx = p.x + currentDir.x;
        const ny = p.y + currentDir.y;

        // If Pac-Man is stationary, do not move him.
        if (currentDir.x === 0 && currentDir.y === 0) return p;

        if (isWall(nx, ny)) {
          // If hitting a wall, stop movement
          setDir({ x: 0, y: 0 });
          setDesiredDir({ x: 0, y: 0 });
          return p;
        }

        const key = `${nx},${ny}`;
        if (pellets.has(key)) {
          setPellets((prev) => {
            const n = new Set(prev);
            n.delete(key);
            return n;
          });

          if (MAZE[ny][nx] === "o") {
            setScore((s) => s + 50);
            setFrightened(true);
          } else {
            setScore((s) => s + 10);
            playSound("waka");
          }
        }
        return { x: nx, y: ny };
      });

      // --- GHOST Movement (Complex AI) ---
      setGhosts((gs) => {
        // Get Blinky's position for Inky's targeting
        const blinky = gs.find((ghost) => ghost.id === "blinky");
        const blinkyPos = blinky ? blinky.pos : { x: 0, y: 0 };

        return gs.map((g) => {
          let targetPos: Pos;
          let currentMode: GhostMode = frightened ? "frightened" : ghostMode;

          // 1. Determine Target based on Mode and Personality
          if (currentMode === "frightened") {
            targetPos = { x: -1, y: -1 };
          } else if (currentMode === "scatter") {
            targetPos = GHOST_SCATTER_POSITIONS[g.id];
          } else {
            // CHASE MODE - Each ghost has unique behavior
            if (g.id === "blinky") {
              // 👻 Blinky (Red/Shadow): Chases directly to Pac-Man
              targetPos = pacman;
            } else if (g.id === "pinky") {
              // 👻 Pinky (Pink/Speedy): Tries to ambush by targeting 4 tiles ahead
              const targetX = pacman.x + dir.x * 4;
              const targetY = pacman.y + dir.y * 4;
              // If Pac-Man is stationary, target directly ahead
              if (dir.x === 0 && dir.y === 0) {
                targetPos = pacman;
              } else {
                targetPos = { x: targetX, y: targetY };
              }
            } else if (g.id === "inky") {
              // 👻 Inky (Cyan/Bashful): Unpredictable - uses Blinky's position as reference
              // Calculate point 2 tiles ahead of Pac-Man
              const aheadX = pacman.x + dir.x * 2;
              const aheadY = pacman.y + dir.y * 2;
              
              // If Pac-Man is stationary, use current position
              const aheadPos = dir.x === 0 && dir.y === 0 
                ? pacman 
                : { x: aheadX, y: aheadY };
              
              // Double the vector from Blinky to the ahead point
              const vectorX = aheadPos.x - blinkyPos.x;
              const vectorY = aheadPos.y - blinkyPos.y;
              targetPos = {
                x: aheadPos.x + vectorX,
                y: aheadPos.y + vectorY,
              };
            } else if (g.id === "clyde") {
              // 👻 Clyde (Orange/Pokey): Acts random / retreats when close
              const distanceToPacman = Math.sqrt(distSq(g.pos, pacman));
              if (distanceToPacman < 8) {
                // Retreat to scatter position when close
                targetPos = GHOST_SCATTER_POSITIONS[g.id];
              } else {
                // Chase directly when far
                targetPos = pacman;
              }
            } else {
              // Fallback: chase directly
              targetPos = pacman;
            }
          }

          // 2. Determine Move
          const nextMove = getNextGhostMove(
            { ...g, mode: currentMode },
            targetPos,
            g.initialDir
          );

          // If no valid move found, try to find ANY valid move (safety fallback)
          if (nextMove.x === 0 && nextMove.y === 0) {
            const emergencyMoves: Dir[] = [
              { x: 0, y: -1 },
              { x: 0, y: 1 },
              { x: -1, y: 0 },
              { x: 1, y: 0 },
            ];
            
            for (const move of emergencyMoves) {
              const nx = g.pos.x + move.x;
              const ny = g.pos.y + move.y;
              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !isWall(nx, ny)) {
                const newPos = { x: nx, y: ny };
                return { ...g, pos: newPos, initialDir: move };
              }
            }
            // If still no move, ghost stays in place but updates direction to allow future movement
            return { ...g, initialDir: { x: 0, y: 0 } };
          }

          const newPos = { x: g.pos.x + nextMove.x, y: g.pos.y + nextMove.y };
          
          // Safety check: ensure new position is valid
          if (newPos.x < 0 || newPos.x >= COLS || newPos.y < 0 || newPos.y >= ROWS || isWall(newPos.x, newPos.y)) {
            // Invalid position, try emergency moves
            const emergencyMoves: Dir[] = [
              { x: 0, y: -1 },
              { x: 0, y: 1 },
              { x: -1, y: 0 },
              { x: 1, y: 0 },
            ];
            for (const move of emergencyMoves) {
              const nx = g.pos.x + move.x;
              const ny = g.pos.y + move.y;
              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !isWall(nx, ny)) {
                return { ...g, pos: { x: nx, y: ny }, initialDir: move };
              }
            }
            return g; // Stay in place if truly stuck
          }

          return { ...g, pos: newPos, initialDir: nextMove };
        });
      });
    }, TICK);

    return () => clearInterval(loop);
  }, [
    gameReady,
    gameOver,
    won,
    isWall,
    desiredDir,
    dir,
    pellets,
    pacman,
    getNextGhostMove,
    ghostMode,
    frightened,
  ]);

  // 4. Collision Handling
  useEffect(() => {
    if (!gameReady) return;

    ghosts.forEach((g) => {
      if (g.pos.x === pacman.x && g.pos.y === pacman.y) {
        if (frightened) {
          // GHOST EATEN
          ghostEatenCount.current += 1;
          const points = 200 * Math.pow(2, ghostEatenCount.current - 1);
          setScore((s) => s + points);
          playSound("ghost_eaten");

          setGhosts((gs) =>
            gs.map((x) => (x.id === g.id ? { ...x, pos: x.initialPos } : x))
          );
        } else {
          // PAC-MAN HIT
          setGameReady(false);

          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameOver(true);
              playSound("game_over");
              stopSound("siren");
            } else {
              playSound("death");
            }
            return newLives;
          });

          // 🐛 FIX 2: Reset directions to stationary after a hit
          setPacman({ x: 1, y: 1 });
          setDir({ x: 0, y: 0 });
          setDesiredDir({ x: 0, y: 0 });
          setGhosts((gs) =>
            gs.map((x) => ({
              ...x,
              pos: x.initialPos,
              initialDir: x.initialDir,
            }))
          );

          // Clear frightened state and timer
          setFrightened(false);
          if (frightenedTimer.current) clearTimeout(frightenedTimer.current);

          // Resume game after a short delay (2 seconds)
          setTimeout(() => {
            setGameReady(true);
          }, 2000);
        }
      }
    });
  }, [pacman, ghosts, frightened, gameReady]);

  // 5. Win condition
  useEffect(() => {
    if (pellets.size === 0) setWon(true);
  }, [pellets]);

  // --- Rendering ---

  const emojiMap: Record<string, string> = {
    "1,0": "🟡",
    "-1,0": "◀️🟡",
    "0,-1": "🔼🟡",
    "0,1": "🔽🟡",
    "0,0": "🟡", // Still shows Pac-Man when stationary
  };
  const pacEmoji = mouth.current ? emojiMap[`${dir.x},${dir.y}`] || "🟡" : "🌕";

  return (
    <div
      style={{ color: "#facc15", textAlign: "center", fontFamily: "monospace" }}
    >
      <h2>PAC-MAN</h2>
      {!gameReady && !gameOver && !won && (
        <p style={{ color: "white", fontWeight: "bold" }}>GET READY!</p>
      )}
      <p>
        Score: {score} | Lives: {lives} | Mode:{" "}
        {frightened ? "Frightened" : ghostMode.toUpperCase()}
      </p>

      {/* Ghost Mode Information
      <div
        style={{
          margin: "12px auto",
          padding: "12px",
          background: "rgba(30, 58, 138, 0.3)",
          borderRadius: "8px",
          border: "1px solid rgba(250, 204, 21, 0.3)",
          maxWidth: "500px",
          fontSize: "12px",
        }}
      >
        <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#facc15" }}>
          👻 Ghost Modes:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
          <div
            style={{
              opacity: !frightened && ghostMode === "chase" ? 1 : 0.6,
              fontWeight: !frightened && ghostMode === "chase" ? "bold" : "normal",
              padding: !frightened && ghostMode === "chase" ? "4px" : "0",
              background: !frightened && ghostMode === "chase" ? "rgba(250, 204, 21, 0.1)" : "transparent",
              borderRadius: "4px",
            }}
          >
            <span style={{ color: "#facc15" }}>1️⃣ Chase Mode:</span>{" "}
            <span style={{ color: "#fff" }}>
              They hunt Pac-Man using different logic
              {!frightened && ghostMode === "chase" && " ⬅️ ACTIVE"}
            </span>
          </div>
          <div
            style={{
              opacity: !frightened && ghostMode === "scatter" ? 1 : 0.6,
              fontWeight: !frightened && ghostMode === "scatter" ? "bold" : "normal",
              padding: !frightened && ghostMode === "scatter" ? "4px" : "0",
              background: !frightened && ghostMode === "scatter" ? "rgba(250, 204, 21, 0.1)" : "transparent",
              borderRadius: "4px",
            }}
          >
            <span style={{ color: "#facc15" }}>2️⃣ Scatter Mode:</span>{" "}
            <span style={{ color: "#fff" }}>
              They retreat to their corners
              {!frightened && ghostMode === "scatter" && " ⬅️ ACTIVE"}
            </span>
          </div>
          <div
            style={{
              opacity: frightened ? 1 : 0.6,
              fontWeight: frightened ? "bold" : "normal",
              padding: frightened ? "4px" : "0",
              background: frightened ? "rgba(96, 165, 250, 0.1)" : "transparent",
              borderRadius: "4px",
            }}
          >
            <span style={{ color: "#60a5fa" }}>3️⃣ Frightened Mode:</span>{" "}
            <span style={{ color: "#fff" }}>
              They turn blue and run away → Pac-Man can eat them 🟦😋
              {frightened && " ⬅️ ACTIVE"}
            </span>
          </div>
        </div>
      </div> */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          margin: "0 auto",
          background: "black",
          border: "2px solid #1e3a8a",
          opacity: gameReady ? 1 : 0.5,
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const x = i % COLS;
          const y = Math.floor(i / COLS);
          const key = `${x},${y}`;

          const isGhost = ghosts.find((g) => g.pos.x === x && g.pos.y === y);

          return (
            <div
              key={i}
              style={{
                width: CELL,
                height: CELL,
                background: isWall(x, y) ? "#1e3a8a" : "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {pellets.has(key) && (
                <span
                  style={{
                    fontSize: MAZE[y][x] === "o" ? "18px" : "10px",
                    color: "#fde68a",
                  }}
                >
                  •
                </span>
              )}
              {pacman.x === x && pacman.y === y && pacEmoji}
              {isGhost && (pacman.x !== x || pacman.y !== y) && (
                <span key={isGhost.id}>
                  {frightened ? "😱" : isGhost.color}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {won && <p style={{ color: "lime", fontWeight: "bold" }}>YOU WIN 🎉</p>}
      {gameOver && (
        <p style={{ color: "red", fontWeight: "bold" }}>GAME OVER</p>
      )}

      {/* Virtual Joystick for touch devices (tablet and mobile) */}
      {isTouchDevice && (
        <>
          {/* Visual Joystick Display (reference only) */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "24px",
              padding: "16px",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              pointerEvents: "none",
            }}
          >
            <div
              ref={joystickBaseRef}
              style={{
                position: "relative",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "rgba(250, 204, 21, 0.15)",
                border: "3px solid rgba(250, 204, 21, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(250, 204, 21, 0.2)",
                opacity: joystickActive ? 0.8 : 0.5,
                transition: "opacity 0.2s ease",
              }}
            >
              {/* Joystick Stick */}
              <div
                ref={joystickStickRef}
                style={{
                  position: "absolute",
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: joystickActive
                    ? "rgba(250, 204, 21, 0.8)"
                    : "rgba(250, 204, 21, 0.5)",
                  border: "2px solid #facc15",
                  transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
                  transition: joystickActive ? "none" : "all 0.2s ease",
                  boxShadow: joystickActive
                    ? "0 2px 8px rgba(250, 204, 21, 0.4)"
                    : "0 2px 4px rgba(250, 204, 21, 0.2)",
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GameSandbox;
