import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'NURSE_DOCTOR',
    department: 'Intensive Care Unit (Ventilators & Critical Care)',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const departmentOptions = [
    { label: 'Intensive Care Unit (Ventilators & Critical Care)', value: 'Intensive Care Unit (Ventilators & Critical Care)' },
    { label: 'Emergency Department (Defibrillators & Resuscitation)', value: 'Emergency Department (Defibrillators & Resuscitation)' },
    { label: 'Cardiology Center (Patient Monitors & Telemetry)', value: 'Cardiology Center (Patient Monitors & Telemetry)' },
    { label: 'Radiology & Imaging (MRI, CT, X-Ray, C-Arm, Ultrasound)', value: 'Radiology & Imaging (MRI, CT, X-Ray, C-Arm, Ultrasound)' },
    { label: 'Surgical Suite (Smart Infusion Pumps & Anesthesia)', value: 'Surgical Suite (Smart Infusion Pumps & Anesthesia)' },
    { label: 'Nephrology & Renal Care (Dialysis Systems)', value: 'Nephrology & Renal Care (Dialysis Systems)' },
    { label: 'General Medical Wards (Fleet Operations)', value: 'General Medical Wards (Fleet Operations)' },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(formData);
      navigate('/login', { state: { message: 'Staff account registered successfully! Please sign in below.' } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check the information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
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
                <span className="material-symbols-outlined text-sm">how_to_reg</span>
                Staff Registration
              </div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white leading-tight tracking-tight">
                Create Clinical Account
              </h2>
              <p className="text-sm text-sky-100/80 leading-relaxed font-medium">
                Join the hospital operations network to monitor machine health, initiate maintenance requests, and track service history.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 space-y-2.5 pt-6 border-t border-white/15 text-xs">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/15">
              <span className="material-symbols-outlined text-emerald-300 text-lg">medical_information</span>
              <span className="font-medium text-white/90">Role-Based Clinical Access</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/15">
              <span className="material-symbols-outlined text-amber-300 text-lg">category</span>
              <span className="font-medium text-white/90">Unit & Equipment Mapping</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/15">
              <span className="material-symbols-outlined text-sky-300 text-lg">security</span>
              <span className="font-medium text-white/90">Protected Hospital Data Isolation</span>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                Staff Enrollment
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-2 m-0 tracking-tight">
                Staff Account Setup
              </h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Fill in your details and select your assigned equipment department.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-800 p-3.5 rounded-xl mb-5 flex items-center gap-2.5 text-xs font-medium">
                <span className="material-symbols-outlined text-red-500 text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="full_name">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="email">
                  Hospital Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@medequip.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="password">
                  Security Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="role">
                  Assigned Staff Role * (2 Roles)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">badge</span>
                  </div>
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="NURSE_DOCTOR">Nurse / Doctor (Clinical Portal)</option>
                    <option value="HOSPITAL_ADMIN">Hospital Administrator (Executive Portal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="department">
                  Clinical Unit / Machine Department * (Dropdown)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">domain</span>
                  </div>
                  <select
                    id="department"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all cursor-pointer appearance-none"
                  >
                    {departmentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 rounded-xl font-medium text-[15px] text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                      <span>Enrolling Account...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      <span>Create Staff Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[13px] text-slate-500 m-0 font-medium">
              Already have an authorized staff account?{' '}
              <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors">
                Sign in to Clinical Portal →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
