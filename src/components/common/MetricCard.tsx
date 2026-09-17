import React from 'react';

export type MetricType =
  | 'billed'
  | 'collected'
  | 'outstanding'
  | 'occupancy'
  | 'rent'
  | 'profit'
  | 'loss'
  | 'warning'
  | 'danger'
  | 'pump';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string;
  subtitle: string;
  type?: MetricType;
  valueColor?: string;
  secondaryValue?: string;
  badgeText?: string;
  badgeType?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  type = 'billed',
  valueColor,
  secondaryValue,
  badgeText,
  badgeType = 'neutral',
}) => {
  const getValueColor = () => {
    if (valueColor) return valueColor;
    switch (type) {
      case 'collected':
      case 'profit':
        return 'text-[#059669]'; // Rich emerald
      case 'outstanding':
      case 'loss':
      case 'danger':
        return 'text-[#E11D48]'; // Bold rose/red
      case 'warning':
        return 'text-[#D97706]'; // Amber / Warning
      case 'rent':
        return 'text-[#2563EB]'; // Royal blue
      case 'pump':
        return 'text-[#7C3AED]'; // Violet/purple
      case 'billed':
      case 'occupancy':
      default:
        return 'text-[#0F172A]'; // Deep slate
    }
  };

  const getBadgeClasses = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
      case 'danger':
        return 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]';
      case 'warning':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      case 'info':
        return 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
      case 'neutral':
      default:
        return 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]';
    }
  };

  return (
    <div
      id={id}
      className="rl-card metric-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_-2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_20px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="metric-title text-[11px] font-bold text-[#475569] uppercase tracking-wider">
            {title}
          </div>
          {badgeText && (
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeClasses()}`}>
              {badgeText}
            </span>
          )}
        </div>
        <div className={`metric-value text-2xl md:text-[26px] font-extrabold tracking-tight tabular-nums ${getValueColor()}`}>
          {value}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#475569]">
        <span className="font-medium truncate">{subtitle}</span>
        {secondaryValue && (
          <span className="font-semibold text-[#1E293B] shrink-0 tabular-nums">{secondaryValue}</span>
        )}
      </div>
    </div>
  );
};

