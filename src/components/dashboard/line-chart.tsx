"use client"

import { useId, useMemo } from "react"

export interface DailyPoint {
  /** ISO date string like 2026-09-29 */
  date: string
  /** Count on that day */
  value: number
}

interface LineChartProps {
  data: DailyPoint[]
  /** Optional label shown in the aria-label */
  ariaLabel?: string
  height?: number
  className?: string
  color?: string
}

/**
 * Lightweight SVG line chart with hover tooltip and axis labels.
 * No external chart dependency — keeps the bundle small.
 */
export function LineChart({
  data,
  ariaLabel = "Requests per day",
  height = 200,
  className,
  color = "hsl(var(--primary))",
}: LineChartProps) {
  const clipId = useId()
  const gridId = useId()

  const { points, maxV, width, padding } = useMemo(() => {
    const w = 640
    const pad = { top: 16, right: 16, bottom: 28, left: 32 }
    const n = Math.max(data.length, 2)
    const max = Math.max(1, ...data.map((d) => d.value))
    const innerW = w - pad.left - pad.right
    const innerH = height - pad.top - pad.bottom
    const pts = data.map((d, i) => {
      const x = pad.left + (i / (n - 1)) * innerW
      const y = pad.top + innerH - (d.value / max) * innerH
      return { ...d, x, y }
    })
    return { points: pts, maxV: max, width: w, padding: pad }
  }, [data, height])

  const innerH = height - padding.top - padding.bottom
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ")
  const areaD = `${pathD} L${points[points.length - 1]?.x ?? 0},${padding.top + innerH} L${points[0]?.x ?? 0},${padding.top + innerH} Z`

  // Y-axis ticks (0, half, max)
  const yTicks = [0, Math.round(maxV / 2), maxV]

  // X-axis ticks: first, middle, last dates
  const xIdxs: number[] = []
  if (points.length > 0) xIdxs.push(0)
  if (points.length > 2) xIdxs.push(Math.floor(points.length / 2))
  if (points.length > 1) xIdxs.push(points.length - 1)

  return (
    <div className={className} aria-label={ariaLabel} role="img">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gridId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect
              x={padding.left}
              y={padding.top}
              width={width - padding.left - padding.right}
              height={innerH}
            />
          </clipPath>
        </defs>

        {/* Y gridlines + labels */}
        {yTicks.map((t) => {
          const y = padding.top + innerH - (t / maxV) * innerH
          return (
            <g key={t}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: 10 }}
              >
                {t}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gridId})`} clipPath={`url(#${clipId})`} />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath={`url(#${clipId})`}
        />
        {/* Dots */}
        {points.map((p) => (
          <circle
            key={p.date}
            cx={p.x}
            cy={p.y}
            r={p.value > 0 ? 2.5 : 0}
            fill={color}
          >
            <title>{`${p.date}: ${p.value}`}</title>
          </circle>
        ))}

        {/* X labels */}
        {xIdxs.map((i) => {
          const p = points[i]
          if (!p) return null
          const anchor =
            i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
          return (
            <text
              key={p.date}
              x={p.x}
              y={height - 8}
              textAnchor={anchor}
              className="fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {formatShortDate(p.date)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

function formatShortDate(iso: string): string {
  // iso is YYYY-MM-DD in local day-key
  const [, m, d] = iso.split("-")
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`
}
