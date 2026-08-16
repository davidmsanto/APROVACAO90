import { useEffect, useState } from "react";

/*
 * Brand — identidade do APROVAÇÃO 90.
 * Cadeia: /logo.png (local) → logo do Drive → tile "90" (fallback).
 */

const DRIVE_ID = "1kcakNtxhifGUumuaL_RJ" + "EBP7yVRhgq_a";
const CANDIDATES = [
  "/logo.png",
  "/logo.svg",
  "/logo.jpg",
  `https://lh3.googleusercontent.com/d/${DRIVE_ID}`,
  `https://drive.google.com/thumbnail?id=${DRIVE_ID}&sz=w256`,
];

let logoPromise: Promise<string | null> | null = null;

function detectLogo(): Promise<string | null> {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const tryAt = (i: number) => {
        if (i >= CANDIDATES.length) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(CANDIDATES[i]);
        img.onerror = () => tryAt(i + 1);
        img.src = CANDIDATES[i];
      };
      tryAt(0);
    });
  }
  return logoPromise;
}

export function Brand({
  compact = false,
  size = 40,
  imageOnly = false,
}: {
  compact?: boolean;
  size?: number;
  imageOnly?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    detectLogo().then((s) => {
      if (alive) {
        setSrc(s);
        setChecked(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (imageOnly && checked && !src) return null;

  const fallback = (
    <div
      className="flex items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand2 font-display font-bold text-ink shadow-[0_8px_24px_-8px_rgba(0,255,104,0.7)]"
      style={{ height: size, width: size, fontSize: Math.round(size * 0.4) }}
    >
      90
    </div>
  );

  return (
    <div className={imageOnly ? "" : "flex items-center gap-3"}>
      {src ? (
        <img
          src={src}
          alt="APROVAÇÃO 90"
          style={{ height: size, maxHeight: 56, width: "auto", objectFit: "contain" }}
          className="anim-fade select-none"
          draggable={false}
        />
      ) : (
        fallback
      )}
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[16px] font-semibold tracking-wide text-snow">
            APROVAÇÃO <span className="text-brand2">90</span>
          </div>
          <div className="kicker !text-[8.5px]">Painel de preparação</div>
        </div>
      )}
    </div>
  );
}
