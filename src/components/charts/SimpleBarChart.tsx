interface BarData {
  name: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarData[];
  colors?: string[];
  formatY?: (v: number) => string;
  height?: number;
}

function niceTicks(max: number, count = 4): number[] {
  const step = Math.pow(10, Math.floor(Math.log10(max / count)));
  const err = max / count / step;
  let s = step;
  if (err >= 7.5) s *= 10;
  else if (err >= 3.5) s *= 5;
  else if (err >= 1.5) s *= 2;

  const ticks: number[] = [];
  for (let v = 0; v <= max + s; v += s) {
    ticks.push(v);
    if (ticks.length > 20) break;
  }
  return ticks;
}

export function SimpleBarChart({
  data,
  colors,
  formatY,
  height = 260,
}: SimpleBarChartProps) {
  const width = 600;
  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 44;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxV = Math.max(...data.map((d) => d.value), 1);
  const ticks = niceTicks(maxV, 4);
  const yMax = ticks[ticks.length - 1];

  const step = data.length > 0 ? innerW / data.length : innerW;
  const barW = data.length > 0 ? step * 0.6 : 20;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      {ticks.map((t, i) => {
        const y = padT + innerH - (t / yMax) * innerH;
        return (
          <g key={`y${i}`}>
            <line
              x1={padL}
              y1={y}
              x2={padL + innerW}
              y2={y}
              stroke="#E7E9F0"
              strokeDasharray="3 3"
            />
            <text
              x={padL - 6}
              y={y + 3}
              fontSize={10}
              fill="#5B6478"
              textAnchor="end"
            >
              {formatY ? formatY(t) : String(t)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const x = padL + i * step + (step - barW) / 2;
        const bh = (d.value / yMax) * innerH;
        const y = padT + innerH - bh;
        const fill = colors?.[i] ?? "#2F5CFF";
        return (
          <g key={`b${i}`}>
            <rect x={x} y={y} width={barW} height={bh} fill={fill} rx={6} />
            <text
              x={padL + i * step + step / 2}
              y={y - 5}
              fontSize={10}
              fill="#0F1729"
              textAnchor="middle"
              fontWeight="600"
            >
              {formatY ? formatY(d.value) : String(d.value)}
            </text>
            <text
              x={padL + i * step + step / 2}
              y={height - 12}
              fontSize={10}
              fill="#5B6478"
              textAnchor="middle"
            >
              {d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
