import { MapPin } from 'lucide-react';

// Стилизованная карта-заглушка с маркером по координатам объекта
export function MapStub({ coords, address }: { coords: [number, number]; address: string }) {
  // псевдопозиция маркера из координат (детерминированно)
  const x = 22 + ((coords[1] * 100) % 55);
  const y = 20 + ((coords[0] * 100) % 50);
  return (
    <div className="relative w-full h-56 rounded-lg overflow-hidden border bg-[#e9eef2]">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 60">
        <rect width="100" height="60" fill="#e9eef2" />
        {/* кварталы */}
        <g stroke="#ffffff" strokeWidth="1.6">
          <line x1="0" y1="12" x2="100" y2="9" /><line x1="0" y1="26" x2="100" y2="24" />
          <line x1="0" y1="40" x2="100" y2="42" /><line x1="0" y1="52" x2="100" y2="50" />
          <line x1="15" y1="0" x2="18" y2="60" /><line x1="38" y1="0" x2="35" y2="60" />
          <line x1="60" y1="0" x2="63" y2="60" /><line x1="82" y1="0" x2="80" y2="60" />
        </g>
        {/* магистраль */}
        <path d="M0 47 Q 40 30 100 18" stroke="#f5c96b" strokeWidth="2.6" fill="none" />
        <path d="M0 33 Q 50 20 100 6" stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.9" />
        {/* река */}
        <path d="M0 58 Q 30 48 55 52 T 100 44" stroke="#bcd6ea" strokeWidth="4" fill="none" />
        {/* зелень */}
        <ellipse cx="12" cy="8" rx="9" ry="5" fill="#cfe3cf" />
        <ellipse cx="88" cy="52" rx="10" ry="5" fill="#cfe3cf" />
      </svg>
      {/* маркер */}
      <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-100%)' }}>
        <div className="relative flex flex-col items-center">
          <MapPin className="w-8 h-8 text-[#B01E24] drop-shadow" fill="#B01E24" stroke="#fff" strokeWidth={1.2} />
          <span className="absolute -bottom-1 w-3 h-1.5 bg-black/20 rounded-full" />
        </div>
      </div>
      <div className="absolute left-2 bottom-2 bg-white/95 rounded px-2 py-1 text-[11px] leading-tight shadow-sm max-w-[75%]">
        <div className="font-medium truncate">{address}</div>
        <div className="text-muted-foreground">{coords[0].toFixed(4)}° с.ш., {coords[1].toFixed(4)}° в.д.</div>
      </div>
      <div className="absolute right-2 top-2 bg-white/90 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground shadow-sm">
        Геоподоснова · прототип
      </div>
    </div>
  );
}
