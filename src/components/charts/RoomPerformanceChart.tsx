import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface RoomPerformanceData {
  room: string;
  billed: number;
  collected: number;
}

interface RoomPerformanceChartProps {
  data?: RoomPerformanceData[];
}

export const RoomPerformanceChart: React.FC<RoomPerformanceChartProps> = ({
  data = [],
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawMax = Math.max(
    ...data.map((d) => Math.max(d.billed || 0, d.collected || 0)),
    0
  );
  const maxVal = rawMax > 0 ? Math.ceil(rawMax / 5000) * 5000 : 10000;

  const width = 800;
  const height = 210;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yTicks = [
    { label: `₱${(maxVal / 1000).toFixed(0)}k`, val: maxVal },
    { label: `₱${((maxVal * 0.5) / 1000).toFixed(0)}k`, val: maxVal * 0.5 },
    { label: `₱${((maxVal * 0.25) / 1000).toFixed(0)}k`, val: maxVal * 0.25 },
    { label: '₱0', val: 0 },
  ];

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  };

  const groupCount = Math.max(1, data.length);
  const groupWidth = chartWidth / groupCount;
  const barWidth = Math.min(24, Math.max(8, groupWidth * 0.32));

  if (data.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center p-6 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
          <Building2 className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-700">No Room Billing Data Yet</p>
        <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
          Add rooms and assign tenants to track individual unit performance and collection rates.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full h-[210px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="roomBilledGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="roomCollectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
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
          {data.map((d, i) => {
            const center = paddingLeft + i * groupWidth + groupWidth / 2;
            const yBilled = getY(d.billed || 0);
            const hBilled = Math.max(0, paddingTop + chartHeight - yBilled);

            const yCollected = getY(d.collected || 0);
            const hCollected = Math.max(0, paddingTop + chartHeight - yCollected);

            const isHovered = hoveredIdx === i;

            return (
              <g key={i} className="transition-all">
                {/* Billed Bar */}
                <rect
                  x={center - barWidth - 1.5}
                  y={yBilled}
                  width={barWidth}
                  height={hBilled}
                  fill="url(#roomBilledGrad)"
                  rx="3"
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* Collected Bar */}
                <rect
                  x={center + 1.5}
                  y={yCollected}
                  width={barWidth}
                  height={hCollected}
                  fill="url(#roomCollectedGrad)"
                  rx="3"
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* Room Label */}
                <text
                  x={center}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[11px] select-none transition-colors ${
                    isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-500 font-medium'
                  }`}
                >
                  {d.room}
                </text>

                {/* Transparent Hover Target */}
                <rect
                  x={center - groupWidth / 2}
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

        {/* Hover Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute z-20 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-xl pointer-events-none transition-all min-w-[160px]"
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
            <div className="font-semibold text-slate-200 border-b border-slate-700/60 pb-1 mb-2 flex items-center justify-between text-xs">
              <span>{data[hoveredIdx].room}</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {data[hoveredIdx].billed > 0
                  ? `${Math.round(
                      (data[hoveredIdx].collected / data[hoveredIdx].billed) * 100
                    )}% paid`
                  : 'N/A'}
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-blue-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Billed:
                </span>
                <span className="font-bold">₱{(data[hoveredIdx].billed || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Collected:
                </span>
                <span className="font-bold">₱{(data[hoveredIdx].collected || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-amber-300 pt-1 border-t border-slate-800">
                <span className="text-slate-400">Balance:</span>
                <span className="font-bold">
                  ₱{Math.max(0, (data[hoveredIdx].billed || 0) - (data[hoveredIdx].collected || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm inline-block" />
          <span>Billed Amount</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" />
          <span>Collected Amount</span>
        </div>
      </div>
    </div>
  );
};
