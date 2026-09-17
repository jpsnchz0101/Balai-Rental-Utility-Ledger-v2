import React, { useState } from 'react';

interface TrendItem {
  month: string;
  billed: number;
  collected: number;
  outstanding: number;
}

interface CollectionTrendChartProps {
  data?: TrendItem[];
}

export const CollectionTrendChart: React.FC<CollectionTrendChartProps> = ({
  data = [],
}) => {
  const chartData = data && data.length > 0 ? data : [
    { month: 'Jan', billed: 0, collected: 0, outstanding: 0 },
  ];

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showBilled, setShowBilled] = useState(true);
  const [showCollected, setShowCollected] = useState(true);
  const [showOutstanding, setShowOutstanding] = useState(true);

  const rawMax = Math.max(
    ...chartData.map((d) => Math.max(d.billed || 0, d.collected || 0, d.outstanding || 0)),
    0
  );
  const roundedMax = rawMax > 0 ? Math.ceil(rawMax / 10000) * 10000 : 10000;

  const width = 650;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (chartData.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (chartData.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / roundedMax) * chartHeight;
  };

  const getAreaPath = (key: 'billed' | 'collected') => {
    if (chartData.length === 0) return '';
    const points = chartData.map((d, i) => `${getX(i)},${getY(d[key] || 0)}`);
    const baselineY = paddingTop + chartHeight;
    return `M ${getX(0)},${baselineY} L ${points.join(' L ')} L ${getX(chartData.length - 1)},${baselineY} Z`;
  };

  const billedPoints = chartData.map((d, i) => `${getX(i)},${getY(d.billed || 0)}`).join(' ');
  const collectedPoints = chartData.map((d, i) => `${getX(i)},${getY(d.collected || 0)}`).join(' ');
  const outstandingPoints = chartData.map((d, i) => `${getX(i)},${getY(d.outstanding || 0)}`).join(' ');

  const yTicks = [
    { label: `₱${(roundedMax / 1000).toFixed(0)}k`, val: roundedMax },
    { label: `₱${((roundedMax * 0.75) / 1000).toFixed(0)}k`, val: roundedMax * 0.75 },
    { label: `₱${((roundedMax * 0.5) / 1000).toFixed(0)}k`, val: roundedMax * 0.5 },
    { label: `₱${((roundedMax * 0.25) / 1000).toFixed(0)}k`, val: roundedMax * 0.25 },
    { label: '₱0', val: 0 },
  ];

  const currentHovered = hoveredIdx !== null && chartData[hoveredIdx] ? chartData[hoveredIdx] : null;

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full h-[240px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trendBilledGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="trendCollectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
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

          {/* Hover guideline */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={paddingTop}
              x2={getX(hoveredIdx)}
              y2={paddingTop + chartHeight}
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="2,2"
            />
          )}

          {/* Area Fills */}
          {showBilled && (
            <path d={getAreaPath('billed')} fill="url(#trendBilledGrad)" />
          )}
          {showCollected && (
            <path d={getAreaPath('collected')} fill="url(#trendCollectedGrad)" />
          )}

          {/* Billed Line (Blue) */}
          {showBilled && (
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={billedPoints}
            />
          )}

          {/* Collected Line (Emerald Green) */}
          {showCollected && (
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={collectedPoints}
            />
          )}

          {/* Outstanding Line (Rose / Red) */}
          {showOutstanding && (
            <polyline
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2"
              strokeDasharray="4,4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={outstandingPoints}
            />
          )}

          {/* Data Points */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIdx === i;

            return (
              <g key={i}>
                {showBilled && (
                  <circle
                    cx={x}
                    cy={getY(d.billed || 0)}
                    r={isHovered ? 5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />
                )}
                {showCollected && (
                  <circle
                    cx={x}
                    cy={getY(d.collected || 0)}
                    r={isHovered ? 5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#059669"
                    strokeWidth="2.5"
                  />
                )}
                {showOutstanding && (
                  <circle
                    cx={x}
                    cy={getY(d.outstanding || 0)}
                    r={isHovered ? 5 : 3}
                    fill="#FFFFFF"
                    stroke="#E11D48"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}

          {/* Month labels */}
          {chartData.map((d, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <text
                key={i}
                x={getX(i)}
                y={height - 10}
                textAnchor="middle"
                className={`text-[11px] select-none transition-colors ${
                  isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-500 font-medium'
                }`}
              >
                {d.month}
              </text>
            );
          })}

          {/* Transparent Hover zones */}
          {chartData.map((_, i) => {
            const x = getX(i);
            return (
              <rect
                key={i}
                x={x - 24}
                y={paddingTop}
                width={48}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {currentHovered && hoveredIdx !== null && (
          <div
            className="absolute z-20 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-xl pointer-events-none transition-all min-w-[170px]"
            style={{
              left: `${Math.min(80, Math.max(20, (getX(hoveredIdx) / width) * 100))}%`,
              top: '12%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700/60 pb-1 mb-2 flex items-center justify-between text-xs">
              <span>{currentHovered.month}</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {currentHovered.billed > 0
                  ? `${Math.round(
                      (currentHovered.collected / currentHovered.billed) * 100
                    )}% collected`
                  : 'No billing'}
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-blue-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Billed:
                </span>
                <span className="font-bold">
                  ₱{(currentHovered.billed || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Collected:
                </span>
                <span className="font-bold">
                  ₱{(currentHovered.collected || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-rose-300 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Outstanding:
                </span>
                <span className="font-bold">
                  ₱{(currentHovered.outstanding || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend (Click to Toggle Series) */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 text-xs font-medium text-slate-600 flex-wrap">
        <button
          type="button"
          onClick={() => setShowBilled(!showBilled)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            showBilled
              ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
              : 'text-slate-400 opacity-60 hover:opacity-100'
          }`}
          title="Click to toggle Billed"
        >
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />
          <span>Billed</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCollected(!showCollected)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            showCollected
              ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60'
              : 'text-slate-400 opacity-60 hover:opacity-100'
          }`}
          title="Click to toggle Collected"
        >
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
          <span>Collected</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOutstanding(!showOutstanding)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            showOutstanding
              ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200/60'
              : 'text-slate-400 opacity-60 hover:opacity-100'
          }`}
          title="Click to toggle Outstanding"
        >
          <span className="w-2.5 h-1 border-b-2 border-dashed border-rose-500 inline-block" />
          <span>Outstanding</span>
        </button>
      </div>
    </div>
  );
};
