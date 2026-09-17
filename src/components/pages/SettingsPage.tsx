import React, { useState, useEffect } from 'react';
import { Header } from '../layout/Header.tsx';
import { PropertySettings } from '../../api/types.ts';
import { Save, Check, UserPlus, Users, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService, UserAccount } from '../../api/auth.ts';

interface SettingsPageProps {
  settings: PropertySettings;
  onSaveSettings: (newSettings: Partial<PropertySettings>) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<PropertySettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  // User Accounts State
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Property Administrator');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  useEffect(() => {
    setFormData(settings);
    setUsersList(authService.getUsers());
  }, [settings]);

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword) {
      setUserError('Name, username, and password are required.');
      return;
    }

    if (newUserPassword.length < 6) {
      setUserError('Password must be at least 6 characters.');
      return;
    }

    const res = await authService.registerUser({
      name: newUserName.trim(),
      username: newUserUsername.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      password: newUserPassword,
    });

    if (!res.success || !res.user) {
      setUserError(res.error || 'Failed to create user account.');
      return;
    }

    setUsersList(authService.getUsers());
    setUserSuccess(`Account created for ${res.user.name} (${res.user.username})!`);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setTimeout(() => {
      setIsAddUserOpen(false);
      setUserSuccess('');
    }, 1800);
  };

  const handleGenerateId = () => {
    setNewUserUsername(authService.generateAccountId());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Settings"
        subtitle="Property and billing configuration"
        showMonthSelector={false}
      />

      <form onSubmit={handleSubmit} className="settings-container space-y-6 max-w-2xl">
        {/* Property Details Card */}
        <div className="rl-card settings-card bg-white rounded-xl border border-[#EDF2F7] p-6">
          <div className="settings-card-title text-xs font-bold text-[#718096] uppercase tracking-wider mb-5">
            PROPERTY DETAILS
          </div>

          <div className="space-y-4">
            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Property Name
              </label>
              <input
                type="text"
                value={formData.propertyName}
                onChange={(e) =>
                  setFormData({ ...formData, propertyName: e.target.value })
                }
                className="rl-input font-medium"
                required
              />
            </div>

            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Landlord / Owner
              </label>
              <input
                type="text"
                value={formData.landlordName}
                onChange={(e) =>
                  setFormData({ ...formData, landlordName: e.target.value })
                }
                className="rl-input font-medium"
                required
              />
            </div>

            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="rl-input"
                required
              />
            </div>
          </div>
        </div>

        {/* Utility Rates Card */}
        <div className="rl-card settings-card bg-white rounded-xl border border-[#EDF2F7] p-6">
          <div className="settings-card-title text-xs font-bold text-[#718096] uppercase tracking-wider mb-5">
            UTILITY RATES
          </div>

          <div className="settings-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Electricity (₱ per kWh)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.electricityRate}
                onChange={(e) =>
                  setFormData({ ...formData, electricityRate: Number(e.target.value) })
                }
                className="rl-input font-bold"
                required
              />
            </div>

            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Water (₱ per m³)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.waterRate}
                onChange={(e) =>
                  setFormData({ ...formData, waterRate: Number(e.target.value) })
                }
                className="rl-input font-bold"
                required
              />
            </div>
          </div>

          <div className="settings-hint text-xs text-[#718096] mt-3">
            Rates apply to sub-metered rooms automatically.
          </div>
        </div>

        {/* Fixed Overhead & Operating Expenses Card */}
        <div className="rl-card settings-card bg-white rounded-xl border border-[#EDF2F7] p-6">
          <div className="settings-card-title text-xs font-bold text-[#718096] uppercase tracking-wider mb-5">
            PROPERTY OVERHEAD & SHARED UTILITY EXPENSES
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Property Fixed Overhead / Rent (₱)
              </label>
              <input
                type="number"
                step="250"
                min="0"
                value={formData.fixedPropertyOverhead ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, fixedPropertyOverhead: Number(e.target.value) })
                }
                className="rl-input font-bold text-[#2563EB]"
                required
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Base fixed property rent or facility overhead used in P&L formula.
              </span>
            </div>

            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Common Area Maintenance (₱)
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={formData.commonAreaMaintenance ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, commonAreaMaintenance: Number(e.target.value) })
                }
                className="rl-input font-bold text-[#0F172A]"
                required
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Hallway lighting, garbage disposal, and common area upkeep.
              </span>
            </div>

            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Total Monthly Water Pump Fee (₱)
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={formData.monthlyWaterPumpFee ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyWaterPumpFee: Number(e.target.value) })
                }
                className="rl-input font-bold text-[#7C3AED]"
                required
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Total monthly pump maintenance/power distributed across tenants.
              </span>
            </div>

            <div className="settings-form-group">
              <label className="settings-label text-xs font-bold text-[#4A5568] uppercase tracking-wider block mb-1.5">
                Additional Operating Upkeep (₱)
              </label>
              <input
                type="number"
                step="500"
                min="0"
                value={formData.monthlyOperatingExpense ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyOperatingExpense: Number(e.target.value) })
                }
                className="rl-input font-bold text-[#0F172A]"
                required
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Emergency contingency or major reserve allocations.
              </span>
            </div>
          </div>

          {/* Formula & Live Distribution Preview */}
          <div className="mt-5 space-y-3">
            <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center justify-between text-xs">
              <div className="text-[#166534]">
                <span className="font-bold">Active P&L Formula: </span>
                <span>
                  Net Profit = Revenue − (Fixed Overhead ₱{(formData.fixedPropertyOverhead ?? 4500).toLocaleString()} + Utilities + Pump Fee + CAM ₱{(formData.commonAreaMaintenance ?? 1500).toLocaleString()})
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl flex items-center justify-between text-xs">
              <div className="text-[#6B21A8]">
                <span className="font-bold">Water Pump Share per Tenant: </span>
                <span>
                  ₱{(formData.monthlyWaterPumpFee || 0).toLocaleString()} ÷ {formData.totalTenants || 1} occupied tenants
                </span>
              </div>
              <div className="text-sm font-extrabold text-[#7C3AED]">
                = ₱{Math.round((formData.monthlyWaterPumpFee || 0) / Math.max(1, formData.totalTenants || 1)).toLocaleString()} / tenant
              </div>
            </div>
          </div>
        </div>

        {/* Registered Users & Team Access Card */}
        <div className="rl-card settings-card bg-white rounded-xl border border-[#EDF2F7] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="settings-card-title text-xs font-bold text-[#718096] uppercase tracking-wider">
                REGISTERED USERS & SYSTEM ACCESS
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active administrator and manager accounts configured for this property
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddUserOpen(!isAddUserOpen);
                setUserError('');
                setUserSuccess('');
                if (!newUserUsername) handleGenerateId();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddUserOpen ? 'Cancel' : 'Register New User'}</span>
            </button>
          </div>

          {/* Inline User Registration Form */}
          {isAddUserOpen && (
            <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Register New System User</span>
              </div>

              {userError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userError}</span>
                </div>
              )}

              {userSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{userSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Account ID / Username *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateId}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      <span>Auto ID</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="e.g. 24-03291"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. maria@balai.ph"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white outline-none focus:border-blue-500"
                  >
                    <option value="Property Administrator">Property Administrator</option>
                    <option value="Property Manager">Property Manager</option>
                    <option value="Staff / Meter Reader">Staff / Meter Reader</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Initial Password (min. 6 characters) *
                  </label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewUser}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  Save & Register Account
                </button>
              </div>
            </div>
          )}

          {/* List of Registered Users */}
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {usersList.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-white hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{user.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {user.username}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{user.email || 'No email specified'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About Card */}
        <div className="rl-card settings-card bg-white rounded-xl border border-[#EDF2F7] p-6">
          <div className="settings-card-title text-xs font-bold text-[#718096] uppercase tracking-wider mb-4">
            ABOUT
          </div>

          <div className="divide-y divide-[#F7FAFC] text-xs">
            <div className="settings-about-row flex justify-between py-2.5">
              <span className="settings-about-label text-[#718096]">Application</span>
              <span className="settings-about-value font-bold text-[#1A202C]">
                {formData.propertyName.length ? 'Rental Ledger' : 'Rental Ledger'}
              </span>
            </div>
            <div className="settings-about-row flex justify-between py-2.5">
              <span className="settings-about-label text-[#718096]">Version</span>
              <span className="settings-about-value font-bold text-[#1A202C]">
                {formData.version}
              </span>
            </div>
            <div className="settings-about-row flex justify-between py-2.5">
              <span className="settings-about-label text-[#718096]">Total Rooms</span>
              <span className="settings-about-value font-bold text-[#1A202C]">
                {formData.totalRooms}
              </span>
            </div>
            <div className="settings-about-row flex justify-between py-2.5">
              <span className="settings-about-label text-[#718096]">Tenants</span>
              <span className="settings-about-value font-bold text-[#1A202C]">
                {formData.totalTenants}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="btn-primary"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
          {isSaved && (
            <span className="flex items-center gap-1.5 text-xs text-[#137333] font-semibold animate-fade-in">
              <Check className="w-4 h-4" /> Settings updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
