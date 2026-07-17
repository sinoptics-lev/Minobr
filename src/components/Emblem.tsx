// Стилизованная эмблема Московской области (щит с всадником) для макета
export function Emblem({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 60 70" aria-label="Эмблема Московской области">
      <path d="M30 3 L55 10.5 V36 C55 52.5 44.5 62.5 30 67 C15.5 62.5 5 52.5 5 36 V10.5 Z"
        fill="#B01E24" stroke="#D9A81C" strokeWidth="2.6" />
      <g stroke="#ffffff" strokeWidth="2.2" fill="none" strokeLinecap="round">
        {/* копьё */}
        <line x1="19" y1="52" x2="43" y2="20" />
        {/* голова всадника */}
        <circle cx="33.5" cy="19" r="2.6" fill="#ffffff" stroke="none" />
        {/* тело всадника */}
        <line x1="33" y1="22.5" x2="29" y2="33" />
        {/* конь: корпус и шея */}
        <path d="M17 40 q6 -7 15 -5 q7 1.4 10 -4" />
        {/* ноги коня */}
        <line x1="21" y1="41" x2="17" y2="50" />
        <line x1="27" y1="42" x2="26" y2="51" />
        <line x1="35" y1="41" x2="39" y2="49" />
        {/* змей */}
        <path d="M18 56 q4 -3 8 0 q4 3 8 0" strokeWidth="1.8" />
      </g>
      <circle cx="43" cy="20" r="1.6" fill="#ffffff" />
    </svg>
  );
}
