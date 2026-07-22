// Server-rendered sparkline for ticket volume. Takes buckets already computed
// from real `tickets.created_at` rows and draws them as an area + line chart.
// Pure presentation — no data access, no client JS.

export type Bucket = { label: string; count: number };

export default function TicketVolumeChart({ buckets }: { buckets: Bucket[] }) {
  const W = 600;
  const H = 200;
  const PAD = 12;

  // Empty state: nothing created in the window.
  const max = Math.max(...buckets.map((b) => b.count), 0);
  if (!buckets.length || max === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-1.5 text-center">
        <p className="text-sm font-medium text-[#a0a0b8]">No tickets in this period</p>
        <p className="text-[13px] text-[#4a4a6a]">
          New tickets will chart here as they come in.
        </p>
      </div>
    );
  }

  // Scale: x spreads buckets edge to edge, y leaves headroom above the peak so
  // the line never touches the top of the box.
  const step = buckets.length > 1 ? (W - PAD * 2) / (buckets.length - 1) : 0;
  const top = max * 1.15;
  const pts = buckets.map((b, i) => ({
    x: PAD + i * step,
    y: H - PAD - (b.count / top) * (H - PAD * 2),
  }));

  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x} ${H} L${pts[0].x} ${H} Z`;

  // Label only the ends and the middle — a tick per day is unreadable at 90d.
  const ticks = [0, Math.floor(buckets.length / 2), buckets.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-[200px] w-full"
        role="img"
        aria-label={`Tickets created per day. Peak ${max}.`}
      >
        <defs>
          <linearGradient id="psd-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="psd-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Horizontal guides */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={H * f}
            y2={H * f}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        ))}

        <path d={area} fill="url(#psd-fill)" />
        <path
          d={line}
          className="psd-spark"
          fill="none"
          stroke="url(#psd-stroke)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-3 flex justify-between text-[11px] text-[#4a4a6a]">
        {ticks.map((i) => (
          <span key={i}>{buckets[i]?.label}</span>
        ))}
      </div>
    </div>
  );
}
