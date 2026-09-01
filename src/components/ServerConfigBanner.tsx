import React from 'react';
import { SonyFTPConfig } from '../types';

interface ServerConfigBannerProps {
  ftpConfig: SonyFTPConfig;
  className?: string;
  onEditClick?: () => void;
}

export const ServerConfigBanner: React.FC<ServerConfigBannerProps> = ({
  ftpConfig,
  className = '',
  onEditClick
}) => {
  return (
    <div
      className={`w-full bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-3 sm:p-4 text-slate-100 shadow-xl select-none ${className}`}
      dir="rtl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* 1. Main Port (پورت اصلی) - Far Right in RTL */}
        <div className="bg-[#101726] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between items-start transition-all hover:border-slate-700">
          <span className="text-[11px] text-slate-400 font-sans font-medium mb-1">
            پورت اصلی
          </span>
          <div className="w-full flex items-center justify-between">
            <span className="text-base sm:text-lg font-black text-cyan-400 tracking-wider">
              (TCP) {ftpConfig.ftpPort}
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          </div>
        </div>

        {/* 2. Public PASV IP (آی‌پی عمومی PASV) */}
        <div className="bg-[#101726] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between items-start transition-all hover:border-slate-700">
          <span className="text-[11px] text-slate-400 font-sans font-medium mb-1">
            آی‌پی عمومی PASV
          </span>
          <div className="w-full flex items-center justify-between">
            <span className="text-base sm:text-lg font-black text-purple-300 tracking-wider">
              {ftpConfig.publicIp}
            </span>
            <span className="text-[10px] text-purple-400/80 font-sans">WAN Static</span>
          </div>
        </div>

        {/* 3. PASV Port Range (محدوده پورت‌های PASV) */}
        <div className="bg-[#101726] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between items-start transition-all hover:border-slate-700">
          <span className="text-[11px] text-slate-400 font-sans font-medium mb-1">
            محدوده پورت‌های PASV
          </span>
          <div className="w-full flex items-center justify-between">
            <span className="text-base sm:text-lg font-black text-yellow-400 tracking-wider">
              {ftpConfig.pasvPortRange || '50100 - 50000'}
            </span>
            <span className="text-[10px] text-yellow-400/80 font-sans">100 Ports</span>
          </div>
        </div>

        {/* 4. Authentication (احراز هویت) - Far Left in RTL */}
        <div className="bg-[#101726] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between items-start transition-all hover:border-slate-700">
          <span className="text-[11px] text-slate-400 font-sans font-medium mb-1">
            احراز هویت
          </span>
          <div className="w-full flex items-center justify-between">
            <span className="text-base sm:text-lg font-black text-emerald-400 tracking-tight">
              {ftpConfig.authType === 'anonymous' || ftpConfig.username === 'anonymous'
                ? 'Anonymous (بی‌نام)'
                : `${ftpConfig.username} (احراز شده)`}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1 font-sans">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>دیمن FTP و وب سرور فعال روی رزبری‌پای</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1 text-slate-300 font-mono text-[10px]">
            <span className="text-cyan-400">داشبورد وب:</span>
            <span className="text-white bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700 font-bold">
              پورت 8045
            </span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1 text-slate-300 font-mono text-[10px]">
            <span className="text-amber-400">هارد ذخیره‌سازی:</span>
            <span className="text-emerald-300 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/80 font-bold">
              {ftpConfig.uploadFolder || '/media/pi/RHINO_HDD/photos'}
            </span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[10px] text-slate-400">
            پروتکل: <strong className="text-slate-300">Plain FTP (بدون رمزنگاری / سازگار با سونی)</strong>
          </span>
        </div>

        {onEditClick && (
          <button
            onClick={onEditClick}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer text-[11px]"
          >
            تغییر مشخصات شبکه و هارد دیسک
          </button>
        )}
      </div>
    </div>
  );
};
