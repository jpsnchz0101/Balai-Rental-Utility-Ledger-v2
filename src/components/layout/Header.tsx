import React from 'react';
import { MonthSelector } from '../common/MonthSelector.tsx';
import { LogOut, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  showMonthSelector?: boolean;
  availableMonths?: string[];
  onOpenAddMonth?: () => void;
  actions?: React.ReactNode;
  onLogout?: () => void;
  userProfile?: { username: string; role: string; name: string };
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  isNavbarHidden?: boolean;
  onToggleNavbar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  selectedMonth = 'Aug 2026',
  onMonthChange,
  showMonthSelector = true,
  availableMonths,
  onOpenAddMonth,
  actions,
  onLogout,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-1">
      {/* Title & Contextual Breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
          <span>Balai</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-blue-600 font-semibold">{title}</span>
        </div>
        <h1 className="page-title text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-xs md:text-[13.5px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Actions and Controls */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {actions}

        {/* Full Screen Toggle */}
        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all shadow-xs ${
              isFullScreen
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Full</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Full Screen</span>
              </>
            )}
          </button>
        )}

        {showMonthSelector && (
          <MonthSelector
            value={selectedMonth}
            onChange={(val) => onMonthChange && onMonthChange(val)}
            availableMonths={availableMonths}
            onOpenAddMonth={onOpenAddMonth}
          />
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 transition-colors shadow-xs"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
};
