import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Lock, Calendar, Phone, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OnboardingModal = ({ isOpen, onClose }) => {
  const { completeOnboarding, authError, setAuthError } = useAuth();

  const [step, setStep] = useState('phone'); // phone, otp, dob, guidelines
  const [formData, setFormData] = useState({
    name: 'Alex Vance',
    phone: '+1 (555) 382-9910',
    otp: '123456',
    dob: '1998-05-14',
    gender: 'female',
    country: 'United States',
    acceptedGuidelines: false
  });

  if (!isOpen) return null;

  const handleNext = (e) => {
    e?.preventDefault();
    if (step === 'phone') setStep('otp');
    else if (step === 'otp') setStep('dob');
    else if (step === 'dob') {
      if (!formData.dob) {
        setAuthError('Please enter your date of birth.');
        return;
      }
      setStep('guidelines');
    } else if (step === 'guidelines') {
      const success = completeOnboarding(formData);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-5 sm:p-8 border border-violet-500/20 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
        
        {/* Decorative background ambient light */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/60 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-violet-500/30 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Age Verification & Auth</h2>
          <p className="text-xs text-slate-400 mt-1">Strict 18+ Safety & Identity Verification</p>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-between mb-6 px-4">
          {['phone', 'otp', 'dob', 'guidelines'].map((s, idx) => {
            const stepOrder = ['phone', 'otp', 'dob', 'guidelines'];
            const isCurrent = step === s;
            const isDone = stepOrder.indexOf(step) > idx;

            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950'
                      : isCurrent
                      ? 'bg-violet-600 text-white ring-4 ring-violet-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                {idx < 3 && <div className={`w-10 h-0.5 ${isDone ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
              </div>
            );
          })}
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Verification Error</span>
              {authError}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleNext} className="space-y-4">
          
          {/* STEP 1: PHONE */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300">
                We sent a 6-digit verification code to <span className="font-semibold text-cyan-400">{formData.phone}</span>
              </p>
              <input
                type="text"
                maxLength={6}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full text-center tracking-[0.5em] text-2xl font-bold bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 text-cyan-400 focus:outline-none focus:border-cyan-400 transition-all"
                required
              />
              <p className="text-[11px] text-slate-500">Test OTP: 123456 (Simulated)</p>
            </div>
          )}

          {/* STEP 3: DOB & AGE GATE */}
          {step === 'dob' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Mandatory Age Gate: You must be 18+ to enter stranger video chat.</span>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Date of Birth (DOB)</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-Binary / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Singapore">Singapore</option>
                    <option value="India">India</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Spain">Spain</option>
                    <option value="Italy">Italy</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMMUNITY GUIDELINES & TERMS */}
          {step === 'guidelines' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 max-h-40 overflow-y-auto space-y-2 text-[11px] leading-relaxed">
                <p className="font-semibold text-white">Community Safety Agreement:</p>
                <p>• Zero tolerance for harassment, nudity, illegal acts, or abusive language.</p>
                <p>• In-call safety controls (Report & Block) are monitored 24/7 by human and AI moderation.</p>
                <p>• CSAM or illegal content will result in immediate account termination and law enforcement report.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition-all">
                <input
                  type="checkbox"
                  checked={formData.acceptedGuidelines}
                  onChange={(e) => setFormData({ ...formData, acceptedGuidelines: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-700 bg-slate-950"
                  required
                />
                <span className="text-[11px] text-slate-300">
                  I certify that I am at least 18 years old and agree to the <span className="text-violet-400 font-semibold underline">Terms of Service</span> & <span className="text-violet-400 font-semibold underline">Community Guidelines</span>.
                </span>
              </label>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl btn-glow-purple text-white text-sm font-semibold shadow-lg flex items-center justify-center gap-2 mt-4"
          >
            <span>{step === 'guidelines' ? 'Verify & Enter App' : 'Continue'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
