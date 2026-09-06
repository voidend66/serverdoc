import React from 'react';
import { 
  Camera, 
  Users, 
  GitCompare, 
  Server, 
  Sparkles, 
  Activity, 
  Wifi, 
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { Patient, SonyFTPConfig } from '../types';

interface NavbarProps {
  activeTab: 'patients' | 'patient_detail' | 'comparison' | 'file_viewer' | 'pi_setup' | 'ftp_inbox';
  setActiveTab: (tab: 'patients' | 'patient_detail' | 'comparison' | 'file_viewer' | 'pi_setup' | 'ftp_inbox') => void;
  activePatient: Patient | null;
  ftpConfig: SonyFTPConfig;
  inboxCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activePatient,
  ftpConfig,
  inboxCount
}) => {
  return (
    <header className="bg-white border-b border-emerald-100/80 sticky top-0 z-40 shadow-xs">
      {/* Top Clinic & Network Status Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-slate-300">داشبورد و فایل ویور:</span>
              <span className="font-mono text-cyan-400 bg-slate-800/80 px-2 py-0.5 rounded text-[11px] border border-slate-700 font-bold">
                {ftpConfig.publicIp}:8045
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>هارد اکسترنال:</span>
              <span className="text-white font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                /media/mahdi/mm/doctor
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>سرور FTP: مجزا در سیستم فعال است</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activePatient ? (
              <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded text-emerald-200">
                <span className="text-[11px]">بیمار عکاسی جاری:</span>
                <span className="font-semibold text-white">{activePatient.fullName}</span>
                <span className="font-mono text-[11px] text-emerald-300">({activePatient.fileNo})</span>
              </div>
            ) : (
              <span className="text-slate-400 text-[11px]">بیماری انتخاب نشده</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-2.5 min-h-[64px]">
          {/* Right Area (Brand + Navigation Buttons in RTL) */}
          <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
            {/* Logo & Clinic Branding */}
            <div className="flex items-center gap-2.5 shrink-0 pl-3 border-l border-slate-200/80">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-slate-900 text-base leading-tight tracking-tight">
                    سامانه رینوپلاستی
                  </h1>
                  <span className="bg-cyan-100/90 text-cyan-900 border border-cyan-300/80 text-[10px] font-bold px-2 py-0.5 rounded-md leading-none">
                    File Viewer
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">فایل ویور و بازرس عکس‌های هارد دیسک (پورت 8045)</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                id="nav-file-viewer-btn"
                onClick={() => setActiveTab('file_viewer')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  activeTab === 'file_viewer'
                    ? 'bg-cyan-700 text-white shadow-xs ring-1 ring-cyan-800'
                    : 'bg-cyan-50/70 text-cyan-900 hover:bg-cyan-100 hover:text-cyan-950 border border-cyan-200'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-600" />
                <span>فایل ویور و کاوشگر هارد</span>
              </button>

              <button
                id="nav-patients-btn"
                onClick={() => setActiveTab('patients')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  activeTab === 'patients' || activeTab === 'patient_detail'
                    ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-800'
                    : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/90'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>پرونده بیماران</span>
              </button>

              <button
                id="nav-comparison-btn"
                onClick={() => setActiveTab('comparison')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  activeTab === 'comparison'
                    ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-800'
                    : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/90'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>میز کار مقایسه قبل و بعد</span>
              </button>

              <button
                id="nav-pi-setup-btn"
                onClick={() => setActiveTab('pi_setup')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  activeTab === 'pi_setup'
                    ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-800'
                    : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/90'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>تنظیمات هارد و شبکه</span>
              </button>
            </nav>
          </div>

          {/* Left Area (Live Active Status pill in RTL) */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            {activePatient && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-slate-600 text-[11px]">بیمار عکاسی:</span>
                <span className="font-bold text-emerald-950">{activePatient.fullName}</span>
                <span className="font-mono text-[10px] text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                  {activePatient.fileNo}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};
