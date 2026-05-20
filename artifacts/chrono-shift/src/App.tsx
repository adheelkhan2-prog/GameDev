import { useEffect, useRef } from "react";
import { createGame } from "./game/config";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current && containerRef.current) {
      gameRef.current = createGame("game-container");
    }
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000010",
        overflow: "hidden",
      }}
    >
      <div id="game-container" ref={containerRef} />
    </div>
  );
}

export default App;
