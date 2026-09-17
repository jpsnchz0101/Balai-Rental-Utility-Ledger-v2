import { useState, useEffect, useCallback } from 'react';
import { Sidebar, PageId } from './components/layout/Sidebar.tsx';
import { DashboardPage } from './components/pages/DashboardPage.tsx';
import { RoomsPage } from './components/pages/RoomsPage.tsx';
import { MeterReadingsPage } from './components/pages/MeterReadingsPage.tsx';
import { PaymentsPage } from './components/pages/PaymentsPage.tsx';
import { StatementsPage } from './components/pages/StatementsPage.tsx';
import { ReportsPage } from './components/pages/ReportsPage.tsx';
import { SettingsPage } from './components/pages/SettingsPage.tsx';
import { LoginPage } from './components/pages/LoginPage.tsx';
import { BalaiLogo } from './components/common/BalaiLogo.tsx';

import { AddPaymentModal } from './components/modals/AddPaymentModal.tsx';
import { AddRoomModal } from './components/modals/AddRoomModal.tsx';
import { AddTenantModal } from './components/modals/AddTenantModal.tsx';
import { ViewStatementModal } from './components/modals/ViewStatementModal.tsx';
import { AddMonthModal } from './components/modals/AddMonthModal.tsx';

import { api } from './api/client.ts';
import {
  Room,
  Payment,
  StatementItem,
  PropertySettings,
  DashboardMetrics,
  RevenueBreakdownData,
  PaymentType,
  PaymentMethod,
  RoomStatus,
  YearlyReportData,
  MonthlyTrendData,
} from './api/types.ts';
import { Menu, X, LogOut, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('Aug 2026');
  const [availableMonths, setAvailableMonths] = useState<string[]>([
    'Aug 2026',
    'Jul 2026',
    'Jun 2026',
    'May 2026',
    'Apr 2026',
    'Mar 2026',
    'Feb 2026',
    'Jan 2026',
  ]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('balai_auth_session') === 'true';
  });

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('balai_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      username: '24-02511',
      role: 'Property Administrator',
      name: 'Admin Dela Cruz',
    };
  });

  const handleLoginSuccess = (profile: { username: string; role: string; name: string }) => {
    setUserProfile(profile);
    setIsAuthenticated(true);
    localStorage.setItem('balai_auth_session', 'true');
    localStorage.setItem('balai_user_profile', JSON.stringify(profile));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('balai_auth_session');
  };

  // Application Data States
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalBilled: 0,
    totalCollected: 0,
    totalRentBilled: 0,
    totalRentPaid: 0,
    totalUtilitiesBilled: 0,
    totalUtilitiesPaid: 0,
    totalWaterPumpBilled: 0,
    totalWaterPumpPaid: 0,
    waterPumpFeeTotal: 0,
    waterPumpFeePerTenant: 0,
    operatingExpenses: 0,
    netProfit: 0,
    netLoss: 0,
    isNetProfit: true,
    collectionRate: 100,
    outstanding: 0,
    roomsWithBalance: 0,
    occupancyPercentage: 0,
    occupiedRoomsCount: 0,
    totalRoomsCount: 0,
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statements, setStatements] = useState<StatementItem[]>([]);
  const [settings, setSettings] = useState<PropertySettings>({
    propertyName: '',
    landlordName: '',
    address: '',
    electricityRate: 0,
    waterRate: 0,
    monthlyWaterPumpFee: 0,
    monthlyOperatingExpense: 0,
    version: '1.0.0',
    totalRooms: 0,
    totalTenants: 0,
  });
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdownData>({
    rent: 0,
    electricity: 0,
    water: 0,
    waterPump: 0,
  });
  const [yearlyData, setYearlyData] = useState<YearlyReportData | undefined>(undefined);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendData[]>([]);

  // Modal States
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);
  const [activeStatement, setActiveStatement] = useState<StatementItem | null>(null);

  // Layout View States (Full Screen & Navbar toggle)
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullScreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullScreen(false);
      }
    } catch {
      // In sandbox/iframes where requestFullscreen may be restricted, toggle simulated fullscreen
      setIsFullScreen((prev) => !prev);
    }
  };

  const handleToggleNavbar = () => {
    setIsNavbarHidden((prev) => !prev);
  };

  // Refresh data from API service
  const refreshData = useCallback(async () => {
    try {
      const year = Number(selectedMonth.split(' ')[1]) || 2026;
      const [
        fetchedRooms,
        fetchedPayments,
        fetchedStatements,
        fetchedSettings,
        fetchedMetrics,
        fetchedRevenue,
        fetchedMonths,
        fetchedYearly,
        fetchedTrends,
      ] = await Promise.all([
        api.getRooms(),
        api.getPayments(),
        api.getStatements(),
        api.getSettings(),
        api.getDashboardMetrics(),
        api.getRevenueBreakdown(),
        api.getAvailableMonths(),
        api.getYearlyReport(year),
        api.getMonthlyTrends(),
      ]);

      setRooms(fetchedRooms);
      setPayments(fetchedPayments);
      setStatements(fetchedStatements);
      setSettings(fetchedSettings);
      setMetrics(fetchedMetrics);
      setRevenueBreakdown(fetchedRevenue);
      setAvailableMonths(fetchedMonths);
      setYearlyData(fetchedYearly);
      setMonthlyTrends(fetchedTrends);
    } catch (err) {
      console.error('Failed to fetch data from API:', err);
    }
  }, [selectedMonth]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle Month Switch
  const handleMonthChange = async (newMonth: string) => {
    setSelectedMonth(newMonth);
    api.setActiveMonth(newMonth);
  };

  // Handle New Month Creation
  const handleMonthAdded = async (newMonthKey: string, sourceMonthKey: string, importData: boolean) => {
    await api.addMonth(newMonthKey, sourceMonthKey, importData);
    setSelectedMonth(newMonthKey);
    await refreshData();
  };

  // Handlers for User Interactions
  const handlePaymentAdded = async (paymentData: {
    roomId: string;
    roomNumber: string;
    tenantName: string;
    date: string;
    type: PaymentType;
    amount: number;
    method: PaymentMethod;
    reference: string;
  }) => {
    await api.addPayment(paymentData);
    await refreshData();
  };

  const handleRoomAdded = async (roomData: {
    roomNumber: string;
    floor: number;
    monthlyRent: number;
    status: RoomStatus;
    electricityPrev: number;
    waterPrev: number;
  }) => {
    await api.addRoom({
      roomNumber: roomData.roomNumber,
      floor: roomData.floor,
      monthlyRent: roomData.monthlyRent,
      status: roomData.status,
      meterReading: {
        previousElectricity: roomData.electricityPrev,
        currentElectricity: roomData.electricityPrev,
        previousWater: roomData.waterPrev,
        currentWater: roomData.waterPrev,
      },
    });
    await refreshData();
  };

  const handleDeleteTenant = async (roomId: string) => {
    await api.deleteTenant(roomId);
    await refreshData();
  };

  const handleEditRoom = async (
    roomId: string,
    updates: { roomNumber: string; floor: number; monthlyRent: number; status?: RoomStatus }
  ) => {
    await api.updateRoom(roomId, updates);
    try {
      await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // client-side fallback is handled
    }
    await refreshData();
  };

  const handleDeleteRoom = async (roomId: string) => {
    await api.deleteRoom(roomId);
    try {
      await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });
    } catch {
      // client-side fallback is handled
    }
    await refreshData();
  };

  const handleClearTestData = async () => {
    await api.clearTestData();
    try {
      await fetch('/api/clear-test-data', {
        method: 'POST',
      });
    } catch {
      // client-side fallback is handled
    }
    await refreshData();
  };

  const handleTenantAdded = async (
    roomId: string,
    tenantData: { name: string; phone: string; email: string; moveInDate?: string; depositAmount?: number }
  ) => {
    await api.addTenant(roomId, tenantData);
    await refreshData();
  };

  const handleUpdateMeterReading = async (
    roomId: string,
    currentElec: number,
    currentWater: number
  ) => {
    await api.updateMeterReading(roomId, currentElec, currentWater);
    await refreshData();
  };

  const handleSaveSettings = async (newSettings: Partial<PropertySettings>) => {
    await api.updateSettings(newSettings);
    await refreshData();
  };

  const handleViewRoomDetails = (room: Room) => {
    const matchedStmt = statements.find((s) => s.roomId === room.id);
    if (matchedStmt) {
      setActiveStatement(matchedStmt);
    } else {
      // Create a temporary statement preview for available room
      setActiveStatement({
        id: `temp-${room.id}`,
        roomId: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: undefined,
        tenantName: room.tenant?.name || 'Vacant Unit',
        tenantEmail: room.tenant?.email || '—',
        tenantPhone: room.tenant?.phone || '—',
        monthlyRent: room.monthlyRent,
        electricityUsageKwh: 0,
        electricityCost: 0,
        waterUsageM3: 0,
        waterCost: 0,
        totalBilled: 0,
        totalPaid: 0,
        balance: 0,
        status: 'Paid',
        meterReadings: {
          prevElec: room.meterReading.previousElectricity,
          currElec: room.meterReading.currentElectricity,
          prevWater: room.meterReading.previousWater,
          currWater: room.meterReading.currentWater,
        },
        payments: [],
      });
    }
  };

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        propertyName={settings.propertyName}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Top Header with Hamburger & Balai Logo */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F172A] text-white px-4 py-2.5 flex items-center justify-between shadow-md border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/95 flex items-center justify-center p-0.5 border border-white/20 shrink-0">
            <BalaiLogo size="xs" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm text-white leading-none flex items-center gap-1">
              Balai
              <span className="text-[9px] bg-blue-600 text-white px-1 py-0.2 rounded">PRO</span>
            </span>
            <span className="text-[10px] text-slate-400 block truncate mt-0.5">
              {settings.propertyName}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Reopen Navbar Hamburger Button for Desktop when Navbar is Hidden */}
      {isNavbarHidden && (
        <button
          type="button"
          onClick={handleToggleNavbar}
          className="hidden lg:flex fixed top-4 left-4 z-40 items-center justify-center p-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700/80 transition-all hover:scale-105 cursor-pointer"
          title="Show Navigation Bar"
          aria-label="Show Navigation Bar"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Sidebar for Desktop - Smooth collapse towards the left */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out overflow-hidden ${
          isNavbarHidden ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'
        }`}
      >
        <div className="w-64 h-full">
          <Sidebar
            currentPage={currentPage}
            onSelectPage={handleNavigate}
            propertyName={settings.propertyName}
            propertyCity={settings.address}
            onLogout={handleLogout}
            userProfile={userProfile}
            onToggleNavbar={handleToggleNavbar}
          />
        </div>
      </aside>

      {/* Sidebar Drawer for Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 bg-[#0F172A] h-full shadow-2xl flex flex-col">
            <Sidebar
              currentPage={currentPage}
              onSelectPage={handleNavigate}
              propertyName={settings.propertyName}
              propertyCity={settings.address}
              onLogout={handleLogout}
              userProfile={userProfile}
              onHideNavbar={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 w-full max-w-7xl mx-auto transition-all duration-300 ease-in-out">
        {currentPage === 'dashboard' && (
          <DashboardPage
            metrics={metrics}
            rooms={rooms}
            settings={settings}
            revenueBreakdown={revenueBreakdown}
            monthlyTrends={monthlyTrends}
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onMonthChange={handleMonthChange}
            onOpenAddMonth={() => setIsAddMonthOpen(true)}
            onNavigate={handleNavigate}
            onOpenAddPayment={() => setIsAddPaymentOpen(true)}
            onOpenAddTenant={() => setIsAddTenantOpen(true)}
            onSaveOverhead={(overhead) => handleSaveSettings({ fixedPropertyOverhead: overhead })}
            onSaveUtilities={(utilities) => handleSaveSettings({ customUtilitiesExpense: utilities })}
            isFullScreen={isFullScreen}
            onToggleFullScreen={handleToggleFullScreen}
            isNavbarHidden={isNavbarHidden}
            onToggleNavbar={handleToggleNavbar}
          />
        )}

        {currentPage === 'rooms' && (
          <RoomsPage
            rooms={rooms}
            selectedMonth={selectedMonth}
            onOpenAddRoom={() => setIsAddRoomOpen(true)}
            onOpenAddTenant={() => setIsAddTenantOpen(true)}
            onViewRoomDetails={handleViewRoomDetails}
            onDeleteTenant={handleDeleteTenant}
            onEditRoom={handleEditRoom}
            onDeleteRoom={handleDeleteRoom}
            onClearTestData={handleClearTestData}
            isNavbarHidden={isNavbarHidden}
            onToggleNavbar={handleToggleNavbar}
          />
        )}

        {currentPage === 'meter-readings' && (
          <MeterReadingsPage
            rooms={rooms}
            settings={settings}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            onUpdateReading={handleUpdateMeterReading}
          />
        )}

        {currentPage === 'payments' && (
          <PaymentsPage
            payments={payments}
            totalBilled={metrics.totalBilled}
            totalCollected={metrics.totalCollected}
            outstanding={metrics.outstanding}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            onOpenAddPayment={() => setIsAddPaymentOpen(true)}
          />
        )}

        {currentPage === 'statements' && (
          <StatementsPage
            statements={statements}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            onViewStatement={(stmt) => setActiveStatement(stmt)}
          />
        )}

        {currentPage === 'reports' && (
          <ReportsPage
            metrics={metrics}
            revenueBreakdown={revenueBreakdown}
            yearlyData={yearlyData}
            monthlyTrends={monthlyTrends}
            settings={settings}
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onMonthChange={handleMonthChange}
            onOpenAddMonth={() => setIsAddMonthOpen(true)}
            onSaveOverhead={(overhead) => handleSaveSettings({ fixedPropertyOverhead: overhead })}
            onSaveUtilities={(utilities) => handleSaveSettings({ customUtilitiesExpense: utilities })}
            isFullScreen={isFullScreen}
            onToggleFullScreen={handleToggleFullScreen}
            isNavbarHidden={isNavbarHidden}
            onToggleNavbar={handleToggleNavbar}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>

      {/* Modals */}
      <AddPaymentModal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        rooms={rooms}
        onPaymentAdded={handlePaymentAdded}
      />

      <AddRoomModal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        defaultRoomNumber={`Rm ${rooms.length + 1}`}
        onRoomAdded={handleRoomAdded}
      />

      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        rooms={rooms}
        onTenantAdded={handleTenantAdded}
      />

      <AddMonthModal
        isOpen={isAddMonthOpen}
        onClose={() => setIsAddMonthOpen(false)}
        currentMonth={selectedMonth}
        availableMonths={availableMonths}
        onMonthAdded={handleMonthAdded}
      />

      <ViewStatementModal
        isOpen={activeStatement !== null}
        onClose={() => setActiveStatement(null)}
        statement={activeStatement}
        settings={settings}
        month={selectedMonth}
      />
    </div>
  );
}
