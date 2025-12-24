// Next, React
// import { FC, useState } from "react";
import React, { FC, useEffect, useState } from "react";

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

const GameSandbox: FC = () => {
  const COLS = 15;
  const ROWS = 15;
  const CELL = 28;

  const [pacman, setPacman] = useState({ x: 1, y: 1 });
  const [ghost, setGhost] = useState({ x: 13, y: 13 });
  const [gameOver, setGameOver] = useState(false);

  const walls = new Set([
    "3,3",
    "3,4",
    "3,5",
    "6,6",
    "7,6",
    "8,6",
    "10,2",
    "10,3",
    "10,4",
  ]);

  const movePacman = (dx: number, dy: number) => {
    if (gameOver) return;

    setPacman((p) => {
      const nx = p.x + dx;
      const ny = p.y + dy;

      if (
        nx < 0 ||
        ny < 0 ||
        nx >= COLS ||
        ny >= ROWS ||
        walls.has(`${nx},${ny}`)
      ) {
        return p;
      }
      return { x: nx, y: ny };
    });
  };

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") movePacman(0, -1);
      if (e.key === "ArrowDown") movePacman(0, 1);
      if (e.key === "ArrowLeft") movePacman(-1, 0);
      if (e.key === "ArrowRight") movePacman(1, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Ghost movement
  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setGhost((g) => {
        const dx = pacman.x > g.x ? 1 : pacman.x < g.x ? -1 : 0;
        const dy = pacman.y > g.y ? 1 : pacman.y < g.y ? -1 : 0;
        return { x: g.x + dx, y: g.y + dy };
      });
    }, 500);

    return () => clearInterval(timer);
  }, [pacman, gameOver]);

  // Collision
  useEffect(() => {
    if (pacman.x === ghost.x && pacman.y === ghost.y) {
      setGameOver(true);
    }
  }, [pacman, ghost]);

  return (
    <div style={{ textAlign: "center", color: "#fff" }}>
      <h2 style={{ color: "#facc15" }}>Pac-Man Sandbox</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          margin: "0 auto",
          background: "#000",
          width: COLS * CELL,
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const x = i % COLS;
          const y = Math.floor(i / COLS);
          const key = `${x},${y}`;

          return (
            <div
              key={i}
              style={{
                width: CELL,
                height: CELL,
                border: "1px solid #111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: walls.has(key) ? "#1e3a8a" : "#000",
              }}
            >
              {pacman.x === x && pacman.y === y && "🟡"}
              {ghost.x === x && ghost.y === y && "👻"}
            </div>
          );
        })}
      </div>

      {/* Mobile Controls */}
      <div style={{ marginTop: 12 }}>
        <button onClick={() => movePacman(0, -1)}>⬆️</button>
        <div>
          <button onClick={() => movePacman(-1, 0)}>⬅️</button>
          <button onClick={() => movePacman(1, 0)}>➡️</button>
        </div>
        <button onClick={() => movePacman(0, 1)}>⬇️</button>
      </div>

      {gameOver && (
        <p style={{ color: "red", fontWeight: "bold" }}>GAME OVER 👻</p>
      )}
    </div>
  );
};

// export default GameSandbox;

export default GameSandbox;
