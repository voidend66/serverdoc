import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Database, 
  FolderCheck, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  FolderPlus,
  Server
} from 'lucide-react';

interface StorageHealthData {
  path: string;
  exists: boolean;
  canRead: boolean;
  canWrite: boolean;
  error?: string;
}

interface StorageDiagnosticProps {
  currentPath: string;
  onPathChange?: (newPath: string) => void;
}

export const StorageDiagnostic: React.FC<StorageDiagnosticProps> = ({
  currentPath,
  onPathChange
}) => {
  const [targetPath, setTargetPath] = useState(currentPath || '/media/mahdi/mm/doctor');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [healthData, setHealthData] = useState<StorageHealthData | null>(null);
  const [serverPaths, setServerPaths] = useState<{
    baseDir: string;
    dbDir: string;
    photosDir: string;
    dbPath: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checkStorageHealth = async (pathToCheck?: string) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const pathToUse = pathToCheck || targetPath;
      const res = await fetch(`/api/storage/check?path=${encodeURIComponent(pathToUse)}`);
      const data = await res.json();
      if (data.success) {
        setHealthData(data.health);
        setServerPaths(data.paths);
      } else {
        setHealthData({
          path: pathToUse,
          exists: false,
          canRead: false,
          canWrite: false,
          error: data.error || 'خطا در ارتباط با سرور'
        });
      }
    } catch (e: any) {
      setHealthData({
        path: targetPath,
        exists: false,
        canRead: false,
        canWrite: false,
        error: e.message || 'خطا در فراخوانی ای‌پی‌آی سلامت هارد'
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeAndRepair = async () => {
    setInitializing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/storage/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: targetPath })
      });
      const data = await res.json();
      setStatusMessage(data.message);
      if (data.health) {
        setHealthData(data.health);
        setServerPaths(data.paths);
      }
      if (onPathChange) {
        onPathChange(targetPath);
      }
    } catch (e: any) {
      setStatusMessage(`خطا در ایجاد خودکار پایگاه داده و پوشه‌ها: ${e.message}`);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    checkStorageHealth(currentPath);
  }, [currentPath]);

  const isHealthy = healthData?.exists && healthData?.canRead && healthData?.canWrite;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <span>مدیریت و عیب‌یابی هارد دیسک و دیتابیس SQLite</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            آزمون سلامت اتصال هارد، دسترسی خواندن (Read) و نوشتن (Write) و اعتبارسنجی خودکار پایگاه داده محلی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => checkStorageHealth()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تست مجدد سلامت هارد</span>
          </button>

          <button
            onClick={initializeAndRepair}
            disabled={initializing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
          >
            <FolderPlus className={`w-3.5 h-3.5 ${initializing ? 'animate-spin' : ''}`} />
            <span>{initializing ? 'در حال ساخت پوشه‌ها...' : 'راه‌اندازی و ساخت خودکار ساختار'}</span>
          </button>
        </div>
      </div>

      {/* Path Input Box */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700">
          مسیر ذخیره‌سازی روی هارد اکسترنال / سیستم فایل (Storage Path):
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              dir="ltr"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="/media/mahdi/mm/doctor"
            />
          </div>
          <button
            onClick={() => checkStorageHealth(targetPath)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            بررسی این مسیر
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Check 1: Existence & Mount */}
        <div className={`p-4 rounded-xl border ${healthData?.exists ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-slate-600" />
              <span>اتصال و مانت هارد</span>
            </span>
            {healthData?.exists ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>متصل است (Mounted)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                <XCircle className="w-3.5 h-3.5" />
                <span>یافت نشد</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {healthData?.exists 
              ? 'دایرکتوری مقصد در سیستم فایل لینوکس رزبری‌پای شناسایی شد.'
              : 'مسیر در هارد پیدا نشد. دکمه «راه‌اندازی و ساخت خودکار ساختار» را بزنید یا هارد را متصل کنید.'}
          </p>
        </div>

        {/* Check 2: Read Permission */}
        <div className={`p-4 rounded-xl border ${healthData?.canRead ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FolderCheck className="w-4 h-4 text-slate-600" />
              <span>دسترسی خواندن (Read)</span>
            </span>
            {healthData?.canRead ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مجاز (OK)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                <XCircle className="w-3.5 h-3.5" />
                <span>خطای خواندن</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            امکان اسکن فایل‌ها و فراخوانی داده‌های پایگاه داده و تصاویر برای داشبورد پزشک.
          </p>
        </div>

        {/* Check 3: Write Permission */}
        <div className={`p-4 rounded-xl border ${healthData?.canWrite ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>دسترسی نوشتن (Write)</span>
            </span>
            {healthData?.canWrite ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مجاز (OK)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                <XCircle className="w-3.5 h-3.5" />
                <span>فاقد دسترسی نوشتن</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            امکان ذخیره فوری عکس‌های شات سونی، تغییرات بالینی پرونده‌ها و کش عکس‌ها روی هارد.
          </p>
        </div>
      </div>

      {healthData?.error && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">پیام گزارش شده از هارد سیستم:</p>
            <p className="font-mono text-[11px] text-amber-800">{healthData.error}</p>
          </div>
        </div>
      )}

      {/* Auto Managed Folder Architecture Layout */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 font-bold text-emerald-400 font-sans">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>ساختار سازماندهی خودکار فایل‌ها و دیتابیس SQLite روی هارد:</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">SQLite Engine + Auto-Folder Structure</span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400">📂 ریشه هارد:</span>
            <span className="text-slate-200">{serverPaths?.baseDir || targetPath}</span>
          </div>
          <div className="flex items-start gap-2 mr-4">
            <span className="text-cyan-400">🗄️ پوشه پایگاه داده:</span>
            <span className="text-cyan-200">{serverPaths?.dbDir || `${targetPath}/database`}</span>
          </div>
          <div className="flex items-start gap-2 mr-8">
            <span className="text-amber-300">📄 فایل دیتابیس:</span>
            <span className="text-amber-100">{serverPaths?.dbPath || `${targetPath}/database/rhino_medical.sqlite`} (ذخیره اطلاعات بیماران، زوایای رینوپلاستی و متادیتا)</span>
          </div>
          <div className="flex items-start gap-2 mr-4">
            <span className="text-purple-400">📸 پوشه تصاویر:</span>
            <span className="text-purple-200">{serverPaths?.photosDir || `${targetPath}/photos`} (تفکیک خودکار به ازای هر پرونده بیمار /patient_FILE_NO/)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
