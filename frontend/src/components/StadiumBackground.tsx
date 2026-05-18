import type { CSSProperties } from "react";

const BALLS = [
  { top: "10%",  size: "2rem",   duration: "8s",  delay: "0s",   opacity: 0.8,  anim: "ballPath1" },
  { top: "38%",  size: "1.6rem", duration: "11s", delay: "-4s",  opacity: 0.7,  anim: "ballPath2" },
  { top: "68%",  size: "2.4rem", duration: "9s",  delay: "-7s",  opacity: 0.75, anim: "ballPath3" },
  { top: "22%",  size: "1.8rem", duration: "13s", delay: "-2s",  opacity: 0.65, anim: "ballPath4" },
  { top: "55%",  size: "2.8rem", duration: "7s",  delay: "-5s",  opacity: 0.75, anim: "ballPath5" },
  { top: "80%",  size: "1.5rem", duration: "10s", delay: "-8s",  opacity: 0.7,  anim: "ballPath6" },
  { top: "48%",  size: "2rem",   duration: "14s", delay: "-11s", opacity: 0.6,  anim: "ballPath1" },
];

function PitchSVG() {
  return (
    <svg
      viewBox="0 0 1000 640"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <pattern id="stripes" x="0" y="0" width="100" height="640" patternUnits="userSpaceOnUse">
          <rect x="0"  y="0" width="50" height="640" fill="rgba(0,0,0,0.06)" />
          <rect x="50" y="0" width="50" height="640" fill="rgba(255,255,255,0.04)" />
        </pattern>
      </defs>

      {/* Grass base */}
      <rect x="0" y="0" width="1000" height="640" fill="#1cb54a" />
      {/* Mow stripes */}
      <rect x="0" y="0" width="1000" height="640" fill="url(#stripes)" />

      {/* ── White pitch markings ── */}
      {/* Boundary */}
      <rect x="20" y="20" width="960" height="600" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="4" />
      {/* Center line */}
      <line x1="500" y1="20" x2="500" y2="620" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      {/* Center circle */}
      <circle cx="500" cy="320" r="85" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      {/* Center spot */}
      <circle cx="500" cy="320" r="5" fill="rgba(255,255,255,0.9)" />

      {/* Left penalty area */}
      <rect x="20" y="155" width="150" height="330" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      {/* Left goal area */}
      <rect x="20" y="245" width="55" height="150" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      {/* Left goal */}
      <rect x="0" y="283" width="20" height="74" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
      {/* Left penalty spot */}
      <circle cx="115" cy="320" r="4" fill="rgba(255,255,255,0.9)" />
      {/* Left penalty arc */}
      <path d="M170 240 A85 85 0 0 1 170 400" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />

      {/* Right penalty area */}
      <rect x="830" y="155" width="150" height="330" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      {/* Right goal area */}
      <rect x="925" y="245" width="55" height="150" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      {/* Right goal */}
      <rect x="980" y="283" width="20" height="74" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
      {/* Right penalty spot */}
      <circle cx="885" cy="320" r="4" fill="rgba(255,255,255,0.9)" />
      {/* Right penalty arc */}
      <path d="M830 240 A85 85 0 0 0 830 400" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />

      {/* Corner arcs */}
      <path d="M38 20 A18 18 0 0 0 20 38"   fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
      <path d="M962 20 A18 18 0 0 1 980 38" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
      <path d="M20 602 A18 18 0 0 1 38 620"  fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
      <path d="M980 602 A18 18 0 0 0 962 620" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
    </svg>
  );
}

export default function StadiumBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "#1cb54a",
      }}
    >
      {/* Full-screen pitch */}
      <div style={{ position: "absolute", inset: 0 }}>
        <PitchSVG />
      </div>

      {/* Subtle sun glow from above center */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "-10%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "60vh",
          background: "radial-gradient(ellipse, rgba(255,230,100,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Corner floodlights — bright white */}
      {([
        { top: "-10%", left: "-10%" },
        { top: "-10%", right: "-10%" },
        { bottom: "-10%", left: "-10%" },
        { bottom: "-10%", right: "-10%" },
      ] as CSSProperties[]).map((style, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 60%)",
            pointerEvents: "none",
            ...style,
          }}
        />
      ))}

      {/* Bouncing balls */}
      {BALLS.map((ball, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: ball.top,
            left: 0,
            fontSize: ball.size,
            opacity: ball.opacity,
            animation: `${ball.anim} ${ball.duration} ${ball.delay} infinite linear`,
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
            userSelect: "none",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          ⚽
        </div>
      ))}
    </div>
  );
}
