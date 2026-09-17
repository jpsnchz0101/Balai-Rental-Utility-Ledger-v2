import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface MonthlyBalance {
  month: string;
  outstanding: number;
}

interface OutstandingBalanceChartProps {
  data?: MonthlyBalance[];
}

export const OutstandingBalanceChart: React.FC<OutstandingBalanceChartProps> = ({
  data = [],
}) => {
  const chartData = data && data.length > 0 ? data : [
    { month: 'Aug', outstanding: 0 },
  ];

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawMax = Math.max(...chartData.map((d) => d.outstanding || 0), 0);
  const roundedMax = rawMax > 0 ? Math.ceil(rawMax / 10000) * 10000 : 10000;

  const width = 800;
  const height = 190;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yTicks = [
    { label: `₱${(roundedMax / 1000).toFixed(0)}k`, val: roundedMax },
    { label: `₱${((roundedMax * 0.5) / 1000).toFixed(0)}k`, val: roundedMax * 0.5 },
    { label: `₱${((roundedMax * 0.25) / 1000).toFixed(0)}k`, val: roundedMax * 0.25 },
    { label: '₱0', val: 0 },
  ];

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / roundedMax) * chartHeight;
  };

  const groupWidth = chartWidth / chartData.length;
  const barWidth = Math.min(36, Math.max(12, groupWidth * 0.5));

  const totalOutstanding = chartData.reduce((acc, curr) => acc + (curr.outstanding || 0), 0);

  return (
    <div className="w-full flex flex-col">
      {/* Top Banner if clean slate or fully paid */}
      {totalOutstanding === 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>No outstanding balances across recorded periods.</span>
        </div>
      )}

      <div className="relative w-full h-[190px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="outstandingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
          </defs>

          {/* Y-Axis Gridlines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick.val);
            return (
              <g key={i}>
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-mono select-none"
                >
                  {tick.label}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={tick.val === 0 ? undefined : '3,3'}
                  strokeOpacity={0.7}
                />
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map((d, i) => {
            const groupCenterX = paddingLeft + i * groupWidth + groupWidth / 2;
            const barX = groupCenterX - barWidth / 2;
            const barY = getY(d.outstanding || 0);
            const barH = Math.max(0, chartHeight - (barY - paddingTop));
            const isHovered = hoveredIdx === i;

            return (
              <g key={i}>
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  fill={d.outstanding > 0 ? 'url(#outstandingGrad)' : '#E2E8F0'}
                  rx="4"
                  className="transition-all"
                  opacity={isHovered ? 1 : 0.85}
                />

                <text
                  x={groupCenterX}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[11px] select-none transition-colors ${
                    isHovered ? 'fill-rose-600 font-bold' : 'fill-slate-500 font-medium'
                  }`}
                >
                  {d.month}
                </text>

                {/* Hitbox */}
                <rect
                  x={groupCenterX - groupWidth / 2}
                  y={paddingTop}
                  width={groupWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && chartData[hoveredIdx] && (
          <div
            className="absolute z-20 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/60 rounded-xl p-2.5 shadow-xl pointer-events-none transition-all text-xs min-w-[140px]"
            style={{
              left: `${Math.min(
                85,
                Math.max(
                  15,
                  ((paddingLeft +
                    hoveredIdx * groupWidth +
                    groupWidth / 2) /
                    width) *
                    100
                )
              )}%`,
              top: '12%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-slate-200 mb-1">
              {chartData[hoveredIdx].month} Balance
            </div>
            <div className="font-mono text-rose-400 font-bold text-sm">
              ₱{(chartData[hoveredIdx].outstanding || 0).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
