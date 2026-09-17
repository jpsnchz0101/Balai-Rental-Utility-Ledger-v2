import React, { useState } from 'react';
import { PieChart } from 'lucide-react';

interface RevenueBreakdownProps {
  rent?: number;
  electricity?: number;
  water?: number;
  waterPump?: number;
  waterAndPump?: number;
}

export const RevenueBreakdownChart: React.FC<RevenueBreakdownProps> = ({
  rent = 0,
  electricity = 0,
  water = 0,
  waterPump = 0,
  waterAndPump,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const combinedWaterAndPump = waterAndPump !== undefined ? waterAndPump : water + waterPump;
  const actualTotal = (rent || 0) + (electricity || 0) + (combinedWaterAndPump || 0);
  const total = Math.max(1, actualTotal);

  const rentPct = (rent || 0) / total;
  const elecPct = (electricity || 0) / total;
  const waterPumpPct = (combinedWaterAndPump || 0) / total;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const rentStroke = rentPct * circumference;
  const elecStroke = elecPct * circumference;
  const waterPumpStroke = waterPumpPct * circumference;

  const rentOffset = 0;
  const elecOffset = -rentStroke;
  const waterPumpOffset = -(rentStroke + elecStroke);

  const items = [
    {
      key: 'rent',
      label: 'Rental Revenue',
      amount: rent || 0,
      pct: rentPct,
      color: '#2563EB',
      strokeColor: '#3B82F6',
      bgPill: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      key: 'electricity',
      label: 'Electricity',
      amount: electricity || 0,
      pct: elecPct,
      color: '#F59E0B',
      strokeColor: '#FBBF24',
      bgPill: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      key: 'water',
      label: 'Water & Pump Fee',
      amount: combinedWaterAndPump || 0,
      pct: waterPumpPct,
      color: '#06B6D4',
      strokeColor: '#22D3EE',
      bgPill: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center gap-5 py-3 px-2">
      {/* Donut Chart */}
      <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background neutral ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={14}
          />

          {actualTotal > 0 ? (
            <>
              {/* Rent Segment */}
              {rent > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth={hoveredKey === 'rent' ? 17 : 14}
                  strokeDasharray={`${rentStroke} ${circumference}`}
                  strokeDashoffset={rentOffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredKey('rent')}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              )}

              {/* Electricity Segment */}
              {electricity > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth={hoveredKey === 'electricity' ? 17 : 14}
                  strokeDasharray={`${elecStroke} ${circumference}`}
                  strokeDashoffset={elecOffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredKey('electricity')}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              )}

              {/* Water Segment */}
              {combinedWaterAndPump > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#06B6D4"
                  strokeWidth={hoveredKey === 'water' ? 17 : 14}
                  strokeDasharray={`${waterPumpStroke} ${circumference}`}
                  strokeDashoffset={waterPumpOffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredKey('water')}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              )}
            </>
          ) : (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth={14}
              strokeDasharray="4 4"
            />
          )}
        </svg>

        {/* Center Dynamic Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {actualTotal > 0 ? (
            <>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {hoveredKey ? items.find((i) => i.key === hoveredKey)?.label : 'Total Billed'}
              </span>
              <span className="text-sm font-extrabold text-[#0F172A] font-mono leading-tight">
                ₱
                {(hoveredKey
                  ? items.find((i) => i.key === hoveredKey)?.amount || 0
                  : actualTotal
                ).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {hoveredKey
                  ? `${Math.round(
                      (items.find((i) => i.key === hoveredKey)?.pct || 0) * 100
                    )}% of total`
                  : 'All Sources'}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <PieChart className="w-5 h-5 mb-0.5 opacity-60" />
              <span className="text-[11px] font-medium">₱0 Total</span>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Legend with Interactive Rows & Percentages */}
      <div className="w-full max-w-xs flex flex-col gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
        {items.map((item) => {
          const isHovered = hoveredKey === item.key;
          const pctText = actualTotal > 0 ? `${Math.round(item.pct * 100)}%` : '0%';

          return (
            <div
              key={item.key}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-all cursor-pointer ${
                isHovered
                  ? 'bg-white shadow-xs border border-slate-200 scale-[1.02]'
                  : 'hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-700 font-medium truncate">
                  {item.label}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${item.bgPill}`}
                >
                  {pctText}
                </span>
              </div>
              <span className="font-bold text-xs text-[#0F172A] font-mono shrink-0 ml-2">
                ₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
