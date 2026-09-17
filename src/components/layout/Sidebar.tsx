import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CreditCard,
  FileText,
  BarChart2,
  Settings,
  Building2,
  LogOut,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { BalaiLogo } from '../common/BalaiLogo.tsx';

export type PageId =
  | 'dashboard'
  | 'rooms'
  | 'meter-readings'
  | 'payments'
  | 'statements'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  propertyName?: string;
  propertyCity?: string;
  onLogout?: () => void;
  userProfile?: { username: string; role: string; name: string };
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onToggleNavbar?: () => void;
  onHideNavbar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  propertyName = 'Balai Rental Properties',
  propertyCity = 'Metro Manila',
  onLogout,
  userProfile = { username: '24-02511', role: 'Property Admin', name: 'Admin Dela Cruz' },
  isFullScreen = false,
  onToggleFullScreen,
  onToggleNavbar,
  onHideNavbar,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'rooms', label: 'Rooms', icon: <Building2 className="w-4 h-4" /> },
    { id: 'meter-readings', label: 'Meter Readings', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'statements', label: 'Statements', icon: <FileText className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="app-sidebar select-none py-5 flex flex-col justify-between h-full">
      {/* Brand Header & Quick Actions */}
      <div>
        <div className="flex items-center justify-between px-5 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/95 flex items-center justify-center p-1 shadow-md shadow-black/20 shrink-0 border border-white/20">
              <BalaiLogo size="sm" />
            </div>
            <div className="min-w-0">
              <h1 className="brand-title text-base font-bold text-white leading-tight tracking-tight flex items-center gap-1.5">
                Balai
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/40">
                  PRO
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                Rental & Utilities
              </p>
            </div>
          </div>

          {/* Hide/Toggle Navbar Button attached to Sidebar */}
          {(onToggleNavbar || onHideNavbar) && (
            <button
              type="button"
              onClick={onToggleNavbar || onHideNavbar}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Hide navigation bar"
              aria-label="Hide navigation bar"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 px-3" aria-label="Main Navigation">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onSelectPage(item.id)}
                className={`sidebar-nav-item w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                type="button"
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-400'} shrink-0`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer with Property Info & User Account / Sign Out */}
      <div className="px-3 mt-6 space-y-2 border-t border-slate-800/70 pt-4">
        {/* User Account / Sign Out */}
        <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                {userProfile.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {userProfile.username}
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Property Location Note */}
        <div className="px-2 pt-1 text-[11px]">
          <div className="font-semibold text-slate-300 truncate">{propertyName}</div>
          <div className="text-slate-400 text-[10px] truncate">{propertyCity}</div>
        </div>
      </div>
    </aside>
  );
};
