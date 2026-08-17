import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (p: P) => {
  const { size = 18, ...rest } = p;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
};

export const IcHome = (p: P) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></svg>
);
export const IcGrid = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></svg>
);
export const IcList = (p: P) => (
  <svg {...base(p)}><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" /></svg>
);
export const IcCalendar = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
);
export const IcTarget = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></svg>
);
export const IcRefresh = (p: P) => (
  <svg {...base(p)}><path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" /><path d="M4 4v4h4M20 20v-4h-4" /></svg>
);
export const IcFlag = (p: P) => (
  <svg {...base(p)}><path d="M5 21V4" /><path d="M5 4c4-2 7 2 14 0v9c-7 2-10-2-14 0" /></svg>
);
export const IcGear = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3.2" /><path d="M19 12a7 7 0 0 0-.15-1.44l2-1.55-2-3.46-2.36.95a7 7 0 0 0-2.49-1.44L13.6 2.5h-3.2L10 5.06a7 7 0 0 0-2.49 1.44l-2.36-.95-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .49.05.97.15 1.44l-2 1.55 2 3.46 2.36-.95a7 7 0 0 0 2.49 1.44l.4 2.56h3.2l.4-2.56a7 7 0 0 0 2.49-1.44l2.36.95 2-3.46-2-1.55c.1-.47.15-.95.15-1.44Z" /></svg>
);
export const IcFlame = (p: P) => (
  <svg {...base(p)}><path d="M12 22c4.4 0 7-2.8 7-6.6 0-3.4-2.1-5.4-3.8-7.2C13.6 6.5 12.6 4.6 12.5 2c-3 1.8-4.2 4.5-4 7-1-.4-1.7-1.2-2-2.4-1.2 1.5-2 3.4-2 5.5C4.5 18 8 22 12 22Z" /><path d="M12 22c2 0 3.4-1.5 3.4-3.5 0-1.9-1.2-2.9-2.2-4-.6-.7-1-1.4-1.2-2.2-1.5 1.2-3.4 3.2-3.4 5.7C8.6 20.5 10 22 12 22Z" /></svg>
);
export const IcClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
);
export const IcBook = (p: P) => (
  <svg {...base(p)}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg>
);
export const IcAlert = (p: P) => (
  <svg {...base(p)}><path d="M12 3 1.8 20.2h20.4L12 3Z" /><path d="M12 10v4.5" /><circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" /></svg>
);
export const IcCheck = (p: P) => (
  <svg {...base(p)}><path d="m4.5 12.5 5 5L19.5 7" /></svg>
);
export const IcChevron = (p: P) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IcPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IcFile = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 2.5h8L19 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4A1.5 1.5 0 0 1 6.5 2.5Z" />
    <path d="M13.5 2.5v5.5H19M9 12h6M9 16h6" />
  </svg>
);
export const IcUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5" />
    <path d="M4 15v2.5A1.5 1.5 0 0 0 5.5 19h13a1.5 1.5 0 0 0 1.5-1.5V15" />
  </svg>
);
export const IcDownload = (p: P) => (
  <svg {...base(p)}><path d="M12 3v12m0 0 4.5-4.5M12 15 7.5 10.5" /><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" /></svg>
);
export const IcLock = (p: P) => (
  <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>
);
export const IcPencil = (p: P) => (
  <svg {...base(p)}><path d="m14.5 5 4.5 4.5L8 20.5 3.5 21 4 16.5 14.5 5Z" /><path d="m12.5 7 4.5 4.5" /></svg>
);
export const IcBolt = (p: P) => (
  <svg {...base(p)}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
);
export const IcTrophy = (p: P) => (
  <svg {...base(p)}><path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" /><path d="M8 5H4.5v1.5A3.5 3.5 0 0 0 8 10M16 5h3.5v1.5A3.5 3.5 0 0 1 16 10" /><path d="M12 14v3m-4 4h8m-6.5 0 .5-4h4l.5 4" /></svg>
);
export const IcArrow = (p: P) => (
  <svg {...base(p)}><path d="M4 12h16m0 0-6-6m6 6-6 6" /></svg>
);
export const IcX = (p: P) => (
  <svg {...base(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const IcInfo = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" /></svg>
);
export const IcChart = (p: P) => (
  <svg {...base(p)}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-5M12 16V7M16 16v-3M20 16V10" /></svg>
);
export const IcPlay = (p: P) => (
  <svg {...base(p)}><path d="M7 4.5v15l12-7.5-12-7.5Z" /></svg>
);
export const IcPause = (p: P) => (
  <svg {...base(p)}><path d="M8 5v14M16 5v14" strokeWidth="2.4" /></svg>
);
export const IcSpark = (p: P) => (
  <svg {...base(p)}><path d="M12 2.5 14 9l6.5 2L14 13.5 12 20l-2-6.5L3.5 11 10 9l2-6.5Z" /><path d="M19 16.5 19.7 19l2.3.7-2.3.8L19 23l-.7-2.5-2.3-.8 2.3-.7.7-2.5Z" /></svg>
);
export const IcCards = (p: P) => (
  <svg {...base(p)}><rect x="7" y="3" width="13" height="13" rx="2" transform="rotate(6 13.5 9.5)" /><rect x="4" y="7" width="13" height="13" rx="2" transform="rotate(-6 10.5 13.5)" /></svg>
);
export const IcExternal = (p: P) => (
  <svg {...base(p)}><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M19 14v5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V6.5A1.5 1.5 0 0 1 5.5 5H10" /></svg>
);
export const IcCopy = (p: P) => (
  <svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" /></svg>
);
export const IcTrash = (p: P) => (
  <svg {...base(p)}><path d="M4 6h16M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" /><path d="M6 6l1 13.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 6" /><path d="M10 10.5v6M14 10.5v6" /></svg>
);
export const IcLayers = (p: P) => (
  <svg {...base(p)}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>
);
export const IcLogOut = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
    <path d="M15 16.5 19.5 12 15 7.5M19.5 12H9" />
  </svg>
);
export const IcCrown = (p: P) => (
  <svg {...base(p)}>
    <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-1.5 11.5h-15L3 7Z" />
    <path d="M6 21.5h12" />
  </svg>
);
export const IcCardIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M2.5 9.5h19M6 15h4" />
  </svg>
);
export const IcUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.2-3.5 4-5 7.5-5s6.3 1.5 7.5 5" />
  </svg>
);
