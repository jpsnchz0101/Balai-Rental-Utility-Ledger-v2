import React, { useState, useEffect } from 'react';
import { BalaiLogo } from '../common/BalaiLogo.tsx';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Mail,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { authService } from '../../api/auth.ts';

interface LoginPageProps {
  onLoginSuccess: (userProfile: { username: string; role: string; name: string }) => void;
  propertyName?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  propertyName = 'Balai Rental Properties',
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<string>('Property Administrator');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [autoLoginOnRegister, setAutoLoginOnRegister] = useState(true);

  // Forgot Password Modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Quick Account ID generator for registration
  const handleGenerateId = () => {
    const generated = authService.generateAccountId();
    setRegUsername(generated);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your Account ID or username.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const result = authService.validateLogin(identifier, password);

      if (result.success && result.user) {
        onLoginSuccess({
          username: result.user.username,
          role: result.user.role,
          name: result.user.name,
        });
      } else {
        setErrorMsg(result.error || 'Invalid credentials.');
      }
    }, 450);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Please enter the full name for the new account.');
      return;
    }

    if (!regUsername.trim()) {
      setErrorMsg('Please specify an Account ID or Username.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both password entries.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.registerUser({
        username: regUsername.trim(),
        name: regName.trim(),
        email: regEmail.trim(),
        role: regRole,
        password: regPassword,
      });

      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Failed to create account.');
        return;
      }

      if (autoLoginOnRegister) {
        onLoginSuccess({
          username: res.user.username,
          role: res.user.role,
          name: res.user.name,
        });
      } else {
        // Switch to login tab and prefill
        setIdentifier(res.user.username);
        setPassword(regPassword);
        setSuccessMsg(`Account created for ${res.user.name}! You can now sign in.`);
        setAuthMode('login');
        // Reset register fields
        setRegName('');
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('An unexpected error occurred during registration.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Soft Ambient Background Orbs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Top Floating Logo - Background container completely removed per user request */}
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="flex items-center justify-center mb-1.5 transition-transform duration-300 hover:scale-105">
            <BalaiLogo size="xl" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            {propertyName}
          </p>
        </div>

        {/* Authentication Card */}
        <div className="w-full bg-white rounded-2xl shadow-[0_10px_35px_-5px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(15,23,42,0.04)] border border-slate-100/80 p-6 sm:p-8 transition-all">
          {/* Segmented Auth Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              id="tab-sign-in"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs sm:text-[13px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              id="tab-register"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
                setSuccessMsg('');
                if (!regUsername) handleGenerateId();
              }}
              className={`flex-1 py-2 text-xs sm:text-[13px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New User</span>
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {authMode === 'login' && (
            <div>
              {/* Card Header */}
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  Welcome!
                </h2>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
                  Sign in to manage rooms, meters, and collections
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Account ID / Username Input */}
                <div>
                  <label htmlFor="login-identifier" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account ID / Username
                  </label>
                  <div className="relative">
                    <input
                      id="login-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isLoading}
                      placeholder="e.g. 24-02511 or manager"
                      className="w-full bg-[#EFF6FF]/70 hover:bg-[#EFF6FF] focus:bg-white text-center font-medium text-slate-800 border border-blue-200/90 rounded-xl px-4 py-3 text-sm sm:text-[15px] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 tracking-wide disabled:opacity-75 disabled:cursor-not-allowed"
                      autoComplete="username"
                      required
                    />
                    <User className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                  </div>
                </div>

                {/* Password Input with Show/Hide Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      placeholder="Enter your password"
                      className="w-full bg-[#EFF6FF]/70 hover:bg-[#EFF6FF] focus:bg-white text-center font-medium text-slate-800 border border-blue-200/90 rounded-xl px-10 py-3 text-sm sm:text-[15px] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 disabled:opacity-75 disabled:cursor-not-allowed"
                      autoComplete="current-password"
                      required
                    />
                    <Lock className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSubmitted(false);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs sm:text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Submit Button */}
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="w-full mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold py-3 px-4 rounded-xl text-sm sm:text-[15px] transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_0_rgba(37,99,235,0.4)] disabled:opacity-65 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center justify-center gap-2 select-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4 opacity-80" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle to Register */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                    if (!regUsername) handleGenerateId();
                  }}
                  className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Need a new user account? <span className="font-semibold text-blue-600 underline">Register here</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: REGISTRATION FORM */}
          {authMode === 'register' && (
            <div>
              {/* Card Header */}
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  Register User
                </h2>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
                  Create a new administrator, manager, or staff account
                </p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Maria Clara Santos"
                      className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm outline-none transition-all focus:border-[#2563EB] focus:ring-3 focus:ring-blue-500/10"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Account ID / Username */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="reg-username" className="block text-xs font-semibold text-slate-700">
                      Account ID / Username <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateId}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      title="Auto-generate an ID with property system formatting"
                    >
                      <span>Auto-generate ID</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="reg-username"
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. 24-03188 or maria.santos"
                      className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 font-mono border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm outline-none transition-all focus:border-[#2563EB] focus:ring-3 focus:ring-blue-500/10"
                      required
                    />
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {regUsername && (
                      <button
                        type="button"
                        onClick={handleGenerateId}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-1"
                        title="Generate a new random ID"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. maria@balai.ph"
                      className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm outline-none transition-all focus:border-[#2563EB] focus:ring-3 focus:ring-blue-500/10"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label htmlFor="reg-role" className="block text-xs font-semibold text-slate-700 mb-1">
                    Role & Permissions
                  </label>
                  <select
                    id="reg-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2563EB] transition-all"
                  >
                    <option value="Property Administrator">Property Administrator (Full System Access)</option>
                    <option value="Property Manager">Property Manager (Billing, Rent & Operations)</option>
                    <option value="Staff / Meter Reader">Staff / Meter Reader (Meters & Statements)</option>
                  </select>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 chars"
                        className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none transition-all focus:border-[#2563EB]"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-confirm-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className={`w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 border rounded-xl px-3 py-2 text-xs sm:text-sm outline-none transition-all ${
                          regConfirmPassword && regConfirmPassword !== regPassword
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-slate-200 focus:border-[#2563EB]'
                        }`}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                {/* Show password toggle checkbox */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRegPassword}
                      onChange={(e) => setShowRegPassword(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    <span>Show passwords</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoLoginOnRegister}
                      onChange={(e) => setAutoLoginOnRegister(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    <span>Sign in immediately</span>
                  </label>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  id="btn-register-submit"
                  disabled={isLoading}
                  className="w-full mt-3 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold py-3 px-4 rounded-xl text-sm sm:text-[15px] transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_0_rgba(37,99,235,0.4)] disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 opacity-80" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch back to login link */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Already have an account? <span className="font-semibold text-blue-600 underline">Sign in</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-400 text-center mt-6">
          Balai Property & Utilities Management System &bull; Secure Portal
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered email address or staff ID to receive recovery instructions.
            </p>

            {forgotSubmitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">Recovery Instructions Sent</h4>
                <p className="text-xs text-slate-500">
                  If an account matches <span className="font-semibold text-slate-700">{forgotEmail || identifier}</span>, an instruction link has been dispatched.
                </p>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full mt-2 bg-[#2563EB] text-white py-2 rounded-xl text-xs font-semibold hover:bg-[#1D4ED8]"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSubmitted(true);
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@balai.ph or Account ID"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-colors"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
