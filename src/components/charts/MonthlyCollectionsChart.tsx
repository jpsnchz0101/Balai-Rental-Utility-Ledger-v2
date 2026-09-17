import React, { useState } from 'react';
import { TrendingUp, BarChart3, LineChart } from 'lucide-react';

interface MonthlyCollectionsChartProps {
  data?: { month: string; billed: number; collected: number }[];
}

export const MonthlyCollectionsChart: React.FC<MonthlyCollectionsChartProps> = ({
  data = [],
}) => {
  const chartData = data && data.length > 0 ? data : [
    { month: 'Aug', billed: 0, collected: 0 },
  ];

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [showBilled, setShowBilled] = useState(true);
  const [showCollected, setShowCollected] = useState(true);

  const rawMax = Math.max(
    ...chartData.map((d) => Math.max(d.billed || 0, d.collected || 0)),
    0
  );
  const maxVal = rawMax > 0 ? Math.ceil(rawMax / 10000) * 10000 : 10000;
  const width = 600;
  const height = 220;
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
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  };

  // Total summary for header badges
  const totalBilled = chartData.reduce((acc, curr) => acc + (curr.billed || 0), 0);
  const totalCollected = chartData.reduce((acc, curr) => acc + (curr.collected || 0), 0);
  const overallRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Area path generator for smooth gradients
  const getAreaPath = (key: 'billed' | 'collected') => {
    if (chartData.length === 0) return '';
    const points = chartData.map((d, i) => `${getX(i)},${getY(d[key] || 0)}`);
    const baselineY = paddingTop + chartHeight;
    return `M ${getX(0)},${baselineY} L ${points.join(' L ')} L ${getX(chartData.length - 1)},${baselineY} Z`;
  };

  const billedPoints = chartData.map((d, i) => `${getX(i)},${getY(d.billed || 0)}`).join(' ');
  const collectedPoints = chartData.map((d, i) => `${getX(i)},${getY(d.collected || 0)}`).join(' ');

  const yTicks = [
    { label: `₱${(maxVal / 1000).toFixed(0)}k`, val: maxVal },
    { label: `₱${((maxVal * 0.75) / 1000).toFixed(0)}k`, val: maxVal * 0.75 },
    { label: `₱${((maxVal * 0.5) / 1000).toFixed(0)}k`, val: maxVal * 0.5 },
    { label: `₱${((maxVal * 0.25) / 1000).toFixed(0)}k`, val: maxVal * 0.25 },
    { label: '₱0', val: 0 },
  ];

  const groupWidth = chartWidth / chartData.length;
  const barWidth = Math.min(18, Math.max(6, groupWidth * 0.3));

  return (
    <div className="w-full flex flex-col">
      {/* Top Controls & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            {overallRate}% Collection Rate
          </span>
          <span className="hidden sm:inline text-slate-400">
            ₱{totalCollected.toLocaleString()} of ₱{totalBilled.toLocaleString()}
          </span>
        </div>

        {/* View Toggle */}
        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
              chartType === 'area'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChart className="w-3 h-3" />
            Line
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
              chartType === 'bar'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            Bars
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="billedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="barBilledGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="barCollectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
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

          {/* Vertical Guide when Hovered */}
          {hoveredIdx !== null && chartData[hoveredIdx] && (
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

          {/* AREA CHART MODE */}
          {chartType === 'area' && (
            <>
              {/* Billed Area Fill */}
              {showBilled && (
                <path
                  d={getAreaPath('billed')}
                  fill="url(#billedGradient)"
                  className="transition-all duration-300"
                />
              )}

              {/* Collected Area Fill */}
              {showCollected && (
                <path
                  d={getAreaPath('collected')}
                  fill="url(#collectedGradient)"
                  className="transition-all duration-300"
                />
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

              {/* Data Points */}
              {chartData.map((d, i) => {
                const x = getX(i);
                const yBilled = getY(d.billed || 0);
                const yCollected = getY(d.collected || 0);
                const isHovered = hoveredIdx === i;

                return (
                  <g key={i}>
                    {showBilled && (
                      <circle
                        cx={x}
                        cy={yBilled}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#FFFFFF"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        className="transition-all duration-150 shadow-sm"
                      />
                    )}
                    {showCollected && (
                      <circle
                        cx={x}
                        cy={yCollected}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#FFFFFF"
                        stroke="#059669"
                        strokeWidth="2.5"
                        className="transition-all duration-150 shadow-sm"
                      />
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* BAR CHART MODE */}
          {chartType === 'bar' &&
            chartData.map((d, i) => {
              const center = getX(i);
              const yBilled = getY(d.billed || 0);
              const hBilled = Math.max(0, paddingTop + chartHeight - yBilled);
              const yCollected = getY(d.collected || 0);
              const hCollected = Math.max(0, paddingTop + chartHeight - yCollected);

              const isHovered = hoveredIdx === i;

              return (
                <g key={i} className="transition-opacity">
                  {showBilled && (
                    <rect
                      x={center - barWidth - 1}
                      y={yBilled}
                      width={barWidth}
                      height={hBilled}
                      fill="url(#barBilledGrad)"
                      rx="3"
                      opacity={isHovered ? 1 : 0.85}
                    />
                  )}
                  {showCollected && (
                    <rect
                      x={center + 1}
                      y={yCollected}
                      width={barWidth}
                      height={hCollected}
                      fill="url(#barCollectedGrad)"
                      rx="3"
                      opacity={isHovered ? 1 : 0.85}
                    />
                  )}
                </g>
              );
            })}

          {/* X-Axis Month Labels */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIdx === i;
            return (
              <text
                key={i}
                x={x}
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

          {/* Transparent Hover Hitboxes */}
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

        {/* Rich Interactive Floating Tooltip */}
        {hoveredIdx !== null && chartData[hoveredIdx] && (
          <div
            className="absolute z-20 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-xl text-xs pointer-events-none transition-all min-w-[150px]"
            style={{
              left: `${Math.min(85, Math.max(15, (getX(hoveredIdx) / width) * 100))}%`,
              top: '10%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700/60 pb-1 mb-2 flex items-center justify-between">
              <span>{chartData[hoveredIdx].month} 2026</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {chartData[hoveredIdx].billed > 0
                  ? `${Math.round(
                      (chartData[hoveredIdx].collected / chartData[hoveredIdx].billed) * 100
                    )}% collected`
                  : 'No billing'}
              </span>
            </div>

            <div className="space-y-1 font-mono">
              <div className="flex items-center justify-between text-blue-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Billed:
                </span>
                <span className="font-bold">₱{chartData[hoveredIdx].billed.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Collected:
                </span>
                <span className="font-bold">₱{chartData[hoveredIdx].collected.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-amber-300 pt-1 border-t border-slate-800">
                <span className="text-slate-400">Outstanding:</span>
                <span>
                  ₱
                  {Math.max(
                    0,
                    chartData[hoveredIdx].billed - chartData[hoveredIdx].collected
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend (Click to Toggle Series) */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs font-medium text-slate-600">
        <button
          type="button"
          onClick={() => setShowBilled(!showBilled)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            showBilled
              ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
              : 'text-slate-400 opacity-60 hover:opacity-100'
          }`}
          title="Click to toggle Billed series"
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
          title="Click to toggle Collected series"
        >
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
          <span>Collected</span>
        </button>
      </div>
    </div>
  );
};
