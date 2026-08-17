import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left Side: Clinical Portal Branding & Hero Banner */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#003858] via-[#0c4063] to-[#026b9c] p-8 lg:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner">
                <span className="material-symbols-outlined text-white text-3xl">medical_services</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-wide text-white m-0">MedEquip</h1>
                <span className="text-[10px] text-sky-200 font-medium uppercase tracking-widest block">
                  Clinical Portal
                </span>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-medium text-sky-100 border border-white/20">
                <span className="material-symbols-outlined text-sm">verified</span>
                Operations & AI Diagnostics
              </div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white leading-tight tracking-tight">
                Hospital Equipment & Maintenance System
              </h2>
              <p className="text-sm text-sky-100/80 leading-relaxed font-medium">
                Real-time equipment telemetry, ML failure predictions, service station workflows, and hospital fleet management.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 space-y-2.5 pt-6 border-t border-white/15 text-xs">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/15">
              <span className="material-symbols-outlined text-emerald-300 text-lg">check_circle</span>
              <span className="font-medium text-white/90">Live Inventory & Health Scores</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/15">
              <span className="material-symbols-outlined text-amber-300 text-lg">build_circle</span>
              <span className="font-medium text-white/90">Service Station & Recall Remediation</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/15">
              <span className="material-symbols-outlined text-sky-300 text-lg">psychology</span>
              <span className="font-medium text-white/90">XGBoost ML Risk Prediction Engine</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Area */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="border-b border-slate-100 pb-5 mb-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px]">login</span>
                Authorized Staff Access
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-2 m-0 tracking-tight">
                Sign in to Clinical Portal
              </h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Enter your hospital credentials to access live dashboards and equipment.
              </p>
            </div>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl mb-5 flex items-center gap-2.5 text-xs font-medium">
                <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-800 p-3.5 rounded-xl mb-5 flex items-center gap-2.5 text-xs font-medium">
                <span className="material-symbols-outlined text-red-500 text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="email">
                  Hospital Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@medequip.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="password">
                  Security Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 rounded-xl font-medium text-[15px] text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      <span>Sign in to Portal</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>1-Click Test Credentials:</span>
                <span className="text-[10px] text-sky-600 font-medium">Auto-fills form</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('nurse@medequip.com', 'NursePass123!')}
                  className="p-3 rounded-xl bg-sky-50/50 hover:bg-sky-50 border border-sky-100 text-left transition-all group flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">medical_services</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">Nurse / Doctor</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">nurse@medequip.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@medequip.com', 'AdminPass123!')}
                  className="p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 text-left transition-all group flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">Hospital Admin</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">admin@medequip.com</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <p className="text-[13px] text-slate-500 m-0 font-medium">
              Need a staff account?{' '}
              <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors">
                Create new staff registration →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
