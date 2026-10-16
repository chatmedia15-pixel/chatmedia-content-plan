interface PieData {
  name: string;
  value: number;
}

interface SimplePieChartProps {
  data: PieData[];
  size?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "#2F5CFF",
  "#7C3AED",
  "#0EA5A4",
  "#D97706",
  "#DC2626",
  "#16A34A",
];

export function SimplePieChart({
  data,
  size = 260,
  colors,
}: SimplePieChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.32;
  const innerR = size * 0.2;
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const palette = colors ?? DEFAULT_COLORS;

  let startAngle = -Math.PI / 2;

  function polar(x: number, y: number, r: number, angle: number) {
    return { x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) };
  }

  function arcPath(sA: number, eA: number, oR: number, iR: number) {
    const s = polar(cx, cy, oR, sA);
    const e = polar(cx, cy, oR, eA);
    const s2 = polar(cx, cy, iR, eA);
    const e2 = polar(cx, cy, iR, sA);
    const large = eA - sA > Math.PI ? 1 : 0;
    return `M${s.x},${s.y} A${oR},${oR} 0 ${large} 1 ${e.x},${e.y} L${s2.x},${s2.y} A${iR},${iR} 0 ${large} 0 ${e2.x},${e2.y} Z`;
  }

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const endA = startAngle + angle;
    const path = arcPath(startAngle, endA, outerR, innerR);
    startAngle = endA;
    return {
      path,
      color: palette[i % palette.length],
      name: d.name,
      value: d.value,
      i,
      pct: (d.value / total) * 100,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ display: "block" }}
      >
        {slices.map((s) => (
          <path
            key={s.i}
            d={s.path}
            fill={s.color}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="grid w-full max-w-xs grid-cols-2 gap-2.5">
        {slices.map((s) => (
          <div
            key={s.i}
            className="flex items-center gap-1.5 text-[11px] text-sub"
          >
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate">{s.name}</span>
            <span className="ml-auto font-semibold text-ink">
              {s.pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
