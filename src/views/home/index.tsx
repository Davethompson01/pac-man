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
  const pulsePhase = useRef(0);
  const trailPositions = useRef<Pos[]>([]);

  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

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

  // Swipe detection state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const SWIPE_THRESHOLD = 30; // Minimum distance in pixels for a swipe
  const SWIPE_TIME_THRESHOLD = 300; // Maximum time in ms for a swipe

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
      if (!gameReady || gameOver || won || paused) return;
      setDesiredDir(newDir);
    },
    [gameReady, gameOver, won, paused]
  );

  // Toggle pause function
  const togglePause = useCallback(() => {
    if (gameOver || won) return;
    setPaused((prev) => !prev);
  }, [gameOver, won]);

  // Restart game function
  const restartGame = useCallback(() => {
    setScore(0);
    setPacman({ x: 1, y: 1 });
    setDir({ x: 0, y: 0 });
    setDesiredDir({ x: 0, y: 0 });
    setLives(3);
    setWon(false);
    setGameOver(false);
    setPaused(false);
    setFrightened(false);
    setGhostMode("scatter");
    modeIndex.current = 0;
    ghostEatenCount.current = 0;
    trailPositions.current = [];
    
    // Reset pellets
    setPellets(
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
    
    // Reset ghosts
    setGhosts([
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
        color: "🩷",
        initialPos: GHOST_INITIAL_POSITIONS.pinky,
        initialDir: { x: 0, y: -1 },
        mode: "scatter",
      },
      {
        id: "inky",
        pos: GHOST_INITIAL_POSITIONS.inky,
        color: "💙",
        initialPos: GHOST_INITIAL_POSITIONS.inky,
        initialDir: { x: 1, y: 0 },
        mode: "scatter",
      },
      {
        id: "clyde",
        pos: GHOST_INITIAL_POSITIONS.clyde,
        color: "🟠",
        initialPos: GHOST_INITIAL_POSITIONS.clyde,
        initialDir: { x: 1, y: 0 },
        mode: "scatter",
      },
    ]);
    
    setGameReady(false);
    setTimeout(() => {
      setGameReady(true);
    }, 500);
  }, []);

  // Swipe gesture handlers
  const handleSwipeStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!gameReady || gameOver || won) return;
      touchStartRef.current = {
        x: clientX,
        y: clientY,
        time: Date.now(),
      };
    },
    [gameReady, gameOver, won]
  );

  const handleSwipeEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!touchStartRef.current) return;

      const { x: startX, y: startY, time: startTime } = touchStartRef.current;
      const dx = clientX - startX;
      const dy = clientY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const timeElapsed = Date.now() - startTime;

      // Reset touch start
      touchStartRef.current = null;

      // Check if it's a valid swipe (enough distance and fast enough)
      if (distance < SWIPE_THRESHOLD || timeElapsed > SWIPE_TIME_THRESHOLD) {
        return;
      }

      // Determine swipe direction
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      let direction: Dir = { x: 0, y: 0 };

      if (absX > absY) {
        // Horizontal swipe
        direction = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      } else {
        // Vertical swipe
        direction = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
      }

      // Update Pac-Man direction
      handleDirectionChange(direction);
    },
    [handleDirectionChange]
  );

  // Global touch handlers for swipe gestures
  useEffect(() => {
    if (!isTouchDevice) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!gameReady || gameOver || won) return;
      const touch = e.touches[0];
      if (touch) {
        e.preventDefault();
        handleSwipeStart(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch && touchStartRef.current) {
        e.preventDefault();
        handleSwipeEnd(touch.clientX, touch.clientY);
      }
    };

    const handleTouchCancel = (e: TouchEvent) => {
      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isTouchDevice, gameReady, gameOver, won, handleSwipeStart, handleSwipeEnd]);

  // --- 1. Input Handling: Allows the player to control Pac-Man ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Pause/Resume with Space key
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        togglePause();
        return;
      }
      
      // Only allow input when the game is ready and not paused
      if (!gameReady || gameOver || won || paused) return;

      if (e.key === "ArrowUp") handleDirectionChange({ x: 0, y: -1 });
      if (e.key === "ArrowDown") handleDirectionChange({ x: 0, y: 1 });
      if (e.key === "ArrowLeft") handleDirectionChange({ x: -1, y: 0 });
      if (e.key === "ArrowRight") handleDirectionChange({ x: 1, y: 0 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameReady, gameOver, won, paused, handleDirectionChange, togglePause]); // Dependent on game state

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
    if (!gameReady || gameOver || won || frightened || paused) return;

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
  }, [gameReady, gameOver, won, frightened, paused, ghostMode]);

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
    if (!gameReady || gameOver || won || paused) return;

    const loop = setInterval(() => {
      mouth.current = !mouth.current;
      pulsePhase.current = (pulsePhase.current + 0.2) % (Math.PI * 2);
      
      // Update trail positions (keep last 3 positions)
      trailPositions.current = [
        ...trailPositions.current.slice(-2),
        { ...pacman }
      ];

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
    paused,
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

  // New character component
  const NeonSphere: FC<{ 
    x: number; 
    y: number; 
    dir: Dir; 
    mouthOpen: boolean;
    isMoving: boolean;
  }> = ({ x, y, dir, mouthOpen, isMoving }) => {
    const pulseIntensity = isMoving ? 0.5 + Math.sin(pulsePhase.current) * 0.3 : 0.3;
    
    // Color based on direction: Cyan (right), Purple (left), Orange (down), Blue (up)
    let baseColor = 'hsl(180, 100%, 60%)'; // Default cyan
    if (dir.x > 0) baseColor = 'hsl(180, 100%, 60%)'; // Cyan - Right
    else if (dir.x < 0) baseColor = 'hsl(300, 100%, 60%)'; // Purple - Left
    else if (dir.y > 0) baseColor = 'hsl(30, 100%, 60%)'; // Orange - Down
    else if (dir.y < 0) baseColor = 'hsl(210, 100%, 60%)'; // Blue - Up
    
    // Calculate mouth rotation based on direction
    let mouthRotation = 0;
    if (dir.x > 0) mouthRotation = 0; // Right
    else if (dir.x < 0) mouthRotation = 180; // Left
    else if (dir.y > 0) mouthRotation = 90; // Down
    else if (dir.y < 0) mouthRotation = 270; // Up

    const glowSize = isMoving ? 10 + Math.sin(pulsePhase.current) * 5 : 8;
    const outerGlowSize = isMoving ? 20 + Math.sin(pulsePhase.current) * 10 : 15;

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Main sphere with pulsing glow */}
        <div
          style={{
            position: "relative",
            width: CELL * 0.8,
            height: CELL * 0.8,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${baseColor}${Math.floor(pulseIntensity * 255).toString(16).padStart(2, '0')}, ${baseColor}66)`,
            boxShadow: isMoving
              ? `0 0 ${glowSize}px ${baseColor}, 0 0 ${outerGlowSize}px ${baseColor}80, inset 0 0 ${glowSize}px ${baseColor}40`
              : `0 0 8px ${baseColor}60, inset 0 0 5px ${baseColor}30`,
            border: `2px solid ${baseColor}`,
            opacity: 0.85,
            transform: `rotate(${mouthRotation}deg)`,
            transition: "transform 0.1s ease, box-shadow 0.1s ease",
            filter: isMoving ? "brightness(1.2)" : "brightness(1)",
          }}
        >
          {/* Glowing mouth (energy gap) */}
          {mouthOpen && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "65%",
                height: "65%",
                clipPath: "polygon(50% 0%, 0% 100%, 50% 70%, 100% 100%)",
                background: `radial-gradient(ellipse, ${baseColor}ff, ${baseColor}00)`,
                opacity: 0.95,
                filter: "blur(0.5px) drop-shadow(0 0 3px " + baseColor + ")",
              }}
            />
          )}
          
          {/* Inner glow core */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "40%",
              height: "40%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${baseColor}ff, transparent)`,
              opacity: isMoving ? 0.8 : 0.5,
              filter: "blur(2px)",
            }}
          />
        </div>
      </div>
    );
  };
  
  // Trail component (rendered separately in cells)
  const TrailEffect: FC<{ opacity: number; color: string }> = ({ opacity, color }) => (
    <div
      style={{
        position: "absolute",
        width: CELL * 0.5,
        height: CELL * 0.5,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}40, transparent)`,
        opacity: opacity,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    />
  );


  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 60px rgba(34, 197, 94, 0.7), inset 0 0 30px rgba(34, 197, 94, 0.2);
          }
        }
        @keyframes pulseRed {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.1);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 60px rgba(239, 68, 68, 0.7), inset 0 0 30px rgba(239, 68, 68, 0.2);
          }
        }
      `}</style>
      <div
        style={{ 
          color: "#facc15", 
          textAlign: "center", 
          fontFamily: "monospace",
          touchAction: isTouchDevice ? "none" : "auto",
        }}
      >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 style={{ margin: 0 }}>⚡ NEO-SPHERE</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={togglePause}
            disabled={gameOver || won || !gameReady}
            style={{
              padding: "4px 12px",
              background: paused ? "rgba(250, 204, 21, 0.3)" : "rgba(30, 58, 138, 0.5)",
              border: "1px solid #facc15",
              borderRadius: "4px",
              color: "#facc15",
              cursor: gameOver || won || !gameReady ? "not-allowed" : "pointer",
              fontSize: "12px",
              opacity: gameOver || won || !gameReady ? 0.5 : 1,
            }}
          >
            {paused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
          <button
            onClick={restartGame}
            style={{
              padding: "4px 12px",
              background: "rgba(30, 58, 138, 0.5)",
              border: "1px solid #facc15",
              borderRadius: "4px",
              color: "#facc15",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            🔄 Restart
          </button>
        </div>
      </div>
      {!gameReady && !gameOver && !won && (
        <p style={{ color: "white", fontWeight: "bold" }}>GET READY!</p>
      )}
      {paused && gameReady && (
        <p style={{ color: "#60a5fa", fontWeight: "bold", fontSize: "18px" }}>⏸️ PAUSED</p>
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
          opacity: gameReady && !paused ? 1 : paused ? 0.7 : 0.5,
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
              {/* Light trail effects */}
              {trailPositions.current.map((trailPos, idx) => {
                if (trailPos.x === x && trailPos.y === y && (pacman.x !== x || pacman.y !== y)) {
                  const trailOpacity = (trailPositions.current.length - idx) / trailPositions.current.length * 0.3;
                  const trailColor = dir.x !== 0 || dir.y !== 0 
                    ? (dir.x > 0 ? 'hsl(180, 100%, 60%)' : dir.x < 0 ? 'hsl(300, 100%, 60%)' : dir.y > 0 ? 'hsl(30, 100%, 60%)' : 'hsl(210, 100%, 60%)')
                    : 'hsl(180, 100%, 60%)';
                  return <TrailEffect key={`trail-${idx}`} opacity={trailOpacity} color={trailColor} />;
                }
                return null;
              })}
              
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
              {pacman.x === x && pacman.y === y && (
                <NeonSphere
                  x={x}
                  y={y}
                  dir={dir}
                  mouthOpen={mouth.current}
                  isMoving={dir.x !== 0 || dir.y !== 0}
                />
              )}
              {isGhost && (pacman.x !== x || pacman.y !== y) && (
                <span key={isGhost.id}>
                  {frightened ? "😱" : isGhost.color}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Win Card */}
      {won && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))",
              border: "3px solid #22c55e",
              borderRadius: "20px",
              padding: "40px",
              textAlign: "center",
              boxShadow: "0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)",
              maxWidth: "400px",
              width: "90%",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎉</div>
            <h2
              style={{
                color: "#22c55e",
                fontSize: "32px",
                fontWeight: "bold",
                margin: "0 0 10px 0",
                textShadow: "0 0 20px rgba(34, 197, 94, 0.8)",
              }}
            >
              YOU WIN!
            </h2>
            <p
              style={{
                color: "#d1fae5",
                fontSize: "18px",
                margin: "10px 0 20px 0",
              }}
            >
              Final Score: <span style={{ color: "#22c55e", fontWeight: "bold" }}>{score}</span>
            </p>
            <p
              style={{
                color: "#a7f3d0",
                fontSize: "14px",
                margin: "10px 0",
              }}
            >
              ⚡ You've mastered the maze! ⚡
            </p>
            <button
              onClick={restartGame}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                background: "rgba(34, 197, 94, 0.3)",
                border: "2px solid #22c55e",
                borderRadius: "10px",
                color: "#22c55e",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(34, 197, 94, 0.5)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(34, 197, 94, 0.3)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}

      {/* Game Over Card */}
      {gameOver && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))",
              border: "3px solid #ef4444",
              borderRadius: "20px",
              padding: "40px",
              textAlign: "center",
              boxShadow: "0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.1)",
              maxWidth: "400px",
              width: "90%",
              animation: "pulseRed 2s ease-in-out infinite",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>💀</div>
            <h2
              style={{
                color: "#ef4444",
                fontSize: "32px",
                fontWeight: "bold",
                margin: "0 0 10px 0",
                textShadow: "0 0 20px rgba(239, 68, 68, 0.8)",
              }}
            >
              GAME OVER
            </h2>
            <p
              style={{
                color: "#fee2e2",
                fontSize: "18px",
                margin: "10px 0 20px 0",
              }}
            >
              Final Score: <span style={{ color: "#ef4444", fontWeight: "bold" }}>{score}</span>
            </p>
            <p
              style={{
                color: "#fecaca",
                fontSize: "14px",
                margin: "10px 0",
              }}
            >
              The ghosts got you! Better luck next time.
            </p>
            <button
              onClick={restartGame}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                background: "rgba(239, 68, 68, 0.3)",
                border: "2px solid #ef4444",
                borderRadius: "10px",
                color: "#ef4444",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.5)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default GameSandbox;
