import { Bot } from "lucide-react";
import { useEffect, useState } from "react";

export const VoiceVisualizer: React.FC<{ isAgentSpeaking: boolean }> = ({
  isAgentSpeaking,
}) => {
  const orbCount = 12;
  const [orbPositions, setOrbPositions] = useState<
    Array<{ x: number; y: number; scale: number }>
  >(
    Array(orbCount)
      .fill(null)
      .map(() => ({ x: 0, y: 0, scale: 0.5 }))
  );

  useEffect(() => {
    if (!isAgentSpeaking) {
      setOrbPositions(
        Array(orbCount)
          .fill(null)
          .map((_, i) => {
            const angle = (i / orbCount) * Math.PI * 2;
            return {
              x: Math.cos(angle) * 40,
              y: Math.sin(angle) * 40,
              scale: 0.4 + Math.random() * 0.2,
            };
          })
      );
      return;
    }

    const interval = setInterval(() => {
      setOrbPositions((prev) =>
        prev.map((_, i) => {
          const baseAngle = (i / orbCount) * Math.PI * 2;
          const angleVariation = (Math.random() - 0.5) * 0.5;
          const angle = baseAngle + angleVariation;
          const distance = 60 + Math.random() * 40;

          return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            scale: 0.6 + Math.random() * 0.8,
          };
        })
      );
    }, 150);

    return () => clearInterval(interval);
  }, [isAgentSpeaking, orbCount]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full">
      <div className="relative w-full max-w-md h-80 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={`ring-${i}`}
              className={`absolute rounded-full transition-all duration-700 ${
                isAgentSpeaking ? "animate-spin-slow" : ""
              }`}
              style={{
                width: `${140 + i * 50}px`,
                height: `${140 + i * 50}px`,
                background: `conic-gradient(from ${
                  i * 120
                }deg, transparent, hsl(var(--primary) / ${
                  isAgentSpeaking ? 0.15 : 0.05
                }), transparent)`,
                animationDuration: `${8 + i * 2}s`,
                animationDirection: i % 2 === 0 ? "normal" : "reverse",
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          {orbPositions.map((pos, i) => (
            <div
              key={`orb-${i}`}
              className="absolute transition-all duration-200 ease-out"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.scale})`,
              }}
            >
              <div
                className={`w-3 h-3 rounded-full bg-primary ${
                  isAgentSpeaking ? "shadow-lg shadow-primary/50" : ""
                }`}
                style={{
                  opacity: isAgentSpeaking ? 0.8 : 0.3,
                }}
              />
            </div>
          ))}
        </div>

        {isAgentSpeaking && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={`wave-${i}`}
                className="absolute rounded-full border border-primary animate-wave"
                style={{
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </>
        )}

        <div className="absolute z-10 flex items-center justify-center">
          <div
            className={`rounded-full bg-primary flex items-center justify-center transition-all duration-500 ${
              isAgentSpeaking
                ? "shadow-2xl shadow-primary/60"
                : "shadow-lg shadow-primary/30"
            }`}
            style={{
              width: "100px",
              height: "100px",
              transform: isAgentSpeaking ? "scale(1.15)" : "scale(1)",
            }}
          >
            <div
              className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
                isAgentSpeaking ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
                animation: isAgentSpeaking
                  ? "pulse-glow 1.5s ease-in-out infinite"
                  : "none",
              }}
            />
            <Bot className="w-12 h-12 text-primary-foreground relative z-10" />
          </div>
        </div>

        {isAgentSpeaking && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: "visible" }}
          >
            <g transform="translate(50%, 50%)">
              {orbPositions.map((pos, i) => {
                const nextPos = orbPositions[(i + 1) % orbCount];
                return (
                  <line
                    key={`line-${i}`}
                    x1={pos.x}
                    y1={pos.y}
                    x2={nextPos.x}
                    y2={nextPos.y}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    opacity="0.2"
                    className="transition-all duration-200"
                  />
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};
