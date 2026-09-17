import React from 'react';

interface PaidVsOutstandingChartProps {
  collected?: number;
  outstanding?: number;
}

export const PaidVsOutstandingChart: React.FC<PaidVsOutstandingChartProps> = ({
  collected = 0,
  outstanding = 0,
}) => {
  const total = (collected || 0) + (outstanding || 0);
  const collectedPct = total > 0 ? (collected || 0) / total : 0;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const collectedStroke = collectedPct * circumference;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="relative w-44 h-44 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="paidDonutGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Background circle (Outstanding / Remaining track) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={outstanding > 0 ? '#FECDD3' : '#F1F5F9'}
            strokeWidth="16"
          />

          {/* Foreground segment (Collected - Emerald) */}
          {collected > 0 && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="url(#paidDonutGrad)"
              strokeWidth="16"
              strokeDasharray={`${collectedStroke} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          )}
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-[#0F172A] font-mono">
            {total > 0 ? `${Math.round(collectedPct * 100)}%` : '0%'}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {total > 0 ? 'Collected' : 'No Data'}
          </span>
          {total > 0 && (
            <span className="text-[11px] text-emerald-600 font-medium font-mono mt-0.5">
              ₱{(collected || 0).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Legend with Values */}
      <div className="flex items-center justify-center gap-5 mt-2 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
          <span className="text-slate-700 font-semibold">
            Collected: ₱{(collected || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] shrink-0" />
          <span className="text-slate-600">
            Outstanding: ₱{(outstanding || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
