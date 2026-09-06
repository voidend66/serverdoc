import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FileImage, 
  FileText, 
  Database, 
  ArrowUp, 
  RefreshCw, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Grid, 
  List as ListIcon, 
  Plus, 
  Trash2, 
  Calendar, 
  HardDrive, 
  Camera, 
  UserPlus, 
  X, 
  ChevronRight,
  Maximize2,
  Sliders,
  FolderPlus,
  Info
} from 'lucide-react';
import { 
  Patient, 
  PhotoAngle, 
  PhotoStage, 
  DiskItem, 
  DiskInspectionData, 
  BrowseDirectoryResult,
  ANGLE_LABELS, 
  STAGE_LABELS 
} from '../types';

interface FileViewerProps {
  patients: Patient[];
  onUpdatePatientPhotos?: (patientId: string, updatedPhotos: any[]) => void;
  onSelectPatient?: (patient: Patient) => void;
  defaultPath?: string;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  patients,
  onUpdatePatientPhotos,
  onSelectPatient,
  defaultPath = '/media/mahdi/mm/doctor'
}) => {
  const [currentPath, setCurrentPath] = useState<string>(defaultPath);
  const [browseResult, setBrowseResult] = useState<BrowseDirectoryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & display
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'images' | 'folders' | 'database'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date_desc' | 'name_asc' | 'size_desc'>('date_desc');

  // Input for manual path editing
  const [pathInput, setPathInput] = useState<string>(defaultPath);

  // Inspector & Modal
  const [selectedFile, setSelectedFile] = useState<DiskItem | null>(null);
  const [inspectionData, setInspectionData] = useState<DiskInspectionData | null>(null);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Patient Assignment in Inspector
  const [assignPatientId, setAssignPatientId] = useState<string>(patients[0]?.id || '');
  const [assignAngle, setAssignAngle] = useState<PhotoAngle>('frontal');
  const [assignStage, setAssignStage] = useState<PhotoStage>('pre_op');
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Create folder dialog
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  // Fetch directory contents
  const fetchDirectory = async (targetDir: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const url = `/api/files/browse?path=${encodeURIComponent(targetDir)}${typeFilter !== 'all' ? `&filter=${typeFilter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBrowseResult(data);
        setCurrentPath(data.currentPath);
        setPathInput(data.currentPath);
      } else {
        setErrorMessage(data.error || 'خطا در بارگذاری پوشه');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'عدم دسترسی به سرویس فایل');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath, typeFilter]);

  // Inspect specific file
  const handleInspect = async (item: DiskItem) => {
    setSelectedFile(item);
    setIsInspecting(true);
    setInspectionData(null);
    setZoomLevel(1);
    setRotation(0);
    setAssignSuccess(null);

    try {
      const res = await fetch(`/api/files/inspect?path=${encodeURIComponent(item.path)}`);
      const data = await res.json();
      if (data.success && data.inspection) {
        setInspectionData(data.inspection);
      }
    } catch (e) {
      console.warn('Failed to inspect file:', e);
    }
  };

  // Close inspector
  const handleCloseInspector = () => {
    setSelectedFile(null);
    setInspectionData(null);
    setIsInspecting(false);
    setAssignSuccess(null);
  };

  // Assign image to patient
  const handleAssignToPatient = async () => {
    if (!selectedFile || !assignPatientId) return;
    setIsAssigning(true);
    setAssignSuccess(null);
    try {
      const res = await fetch('/api/files/assign-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedFile.path,
          patientId: assignPatientId,
          angle: assignAngle,
          stage: assignStage,
          notes: `ثبت شده از فایل ویور هارد (${selectedFile.name})`
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssignSuccess('تصویر با موفقیت در پرونده بیمار ثبت و لینک شد!');
        
        // Refresh patient list in memory if callback exists
        if (onUpdatePatientPhotos) {
          const pRes = await fetch('/api/patients');
          const pData = await pRes.json();
          if (pData.success && Array.isArray(pData.patients)) {
            const updatedP = pData.patients.find((p: any) => p.id === assignPatientId);
            if (updatedP) {
              onUpdatePatientPhotos(assignPatientId, updatedP.photos);
            }
          }
        }
      } else {
        alert(data.error || 'خطا در تخصیص عکس');
      }
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال درخواست');
    } finally {
      setIsAssigning(false);
    }
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/files/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPath: currentPath,
          folderName: newFolderName.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsNewFolderOpen(false);
        setNewFolderName('');
        fetchDirectory(currentPath);
      } else {
        alert(data.error || 'خطا در ساخت پوشه');
      }
    } catch (e: any) {
      alert(e.message || 'خطا در ارتباط با سرور');
    }
  };

  // Delete file
  const handleDeleteFile = async (filePath: string) => {
    if (!confirm('آیا از حذف این فایل از هارد مطمئن هستید؟ این عملیات غیرقابل بازگشت است.')) {
      return;
    }
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      const data = await res.json();
      if (data.success) {
        if (selectedFile?.path === filePath) {
          handleCloseInspector();
        }
        fetchDirectory(currentPath);
      } else {
        alert(data.error || 'خطا در حذف فایل');
      }
    } catch (e: any) {
      alert(e.message || 'خطا در عملیات');
    }
  };

  // Filter & sort items
  const filteredItems = (browseResult?.items || []).filter(item => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    if (sortBy === 'date_desc') {
      return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
    } else if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'size_desc') {
      return b.sizeBytes - a.sizeBytes;
    }
    return 0;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner: File Viewer Mode Confirmation */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-cyan-400" />
                <span>فایل ویور و کاوشگر هارد دیسک (HDD File Viewer & Inspector)</span>
              </h2>
              <span className="bg-slate-800 text-slate-300 text-[11px] font-mono px-2.5 py-0.5 rounded border border-slate-700">
                حالت فایل ویور فعال
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              سرور FTP شما به صورت مجزا در لینوکس راه‌اندازی شده و تصاویر دوربین سونی را مستقیم روی هارد ذخیره می‌کند. 
              این بخش به عنوان <strong>فایل ویور اختصاصی</strong>، امکان بازبینی پوشه‌ها، پیش‌نمایش عکس‌های حجیم، استخراج مشخصات لنز و دوربین (EXIF) و ثبت مستقیم عکس‌ها در پرونده بیمار را فراهم می‌کند.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-left font-mono text-xs">
              <div className="text-[10px] text-slate-400">سرویس FTP خارجی:</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>مستقل / فعال روی هارد</span>
              </div>
            </div>
            <button
              onClick={() => fetchDirectory(currentPath)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی دیسک</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explorer Controls & Breadcrumbs Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        {/* Navigation Breadcrumbs & Jump Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
            {browseResult?.parentPath && (
              <button
                onClick={() => fetchDirectory(browseResult.parentPath!)}
                title="یک پوشه به عقب"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}

            <span className="text-slate-400 shrink-0">مسیر:</span>
            {browseResult?.breadcrumbs && browseResult.breadcrumbs.length > 0 ? (
              browseResult.breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.path}>
                  <button
                    onClick={() => fetchDirectory(crumb.path)}
                    className={`font-mono px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                      idx === browseResult.breadcrumbs.length - 1
                        ? 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {crumb.name}
                  </button>
                  {idx < browseResult.breadcrumbs.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 rotate-180" />
                  )}
                </React.Fragment>
              ))
            ) : (
              <span className="font-mono text-slate-700">{currentPath}</span>
            )}
          </div>

          {/* Quick Preset Folders */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap text-xs">
            <span className="text-[11px] text-slate-400 hidden lg:inline">پوشه‌های سریع:</span>
            <button
              onClick={() => fetchDirectory('/media/mahdi/mm/doctor')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
            >
              پوشه ریشه (doctor)
            </button>
            <button
              onClick={() => fetchDirectory('/media/mahdi/mm/doctor/photos')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
            >
              عکس‌ها (photos)
            </button>
            <button
              onClick={() => fetchDirectory('/media/mahdi/mm/doctor/database')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
            >
              دیتابیس (database)
            </button>
            <button
              onClick={() => setIsNewFolderOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>پوشه جدید</span>
            </button>
          </div>
        </div>

        {/* Path Input Form for manual navigation */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (pathInput.trim()) fetchDirectory(pathInput.trim());
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="مسیر پوشه روی هارد دیسک را وارد کنید..."
              className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-slate-50/60"
            />
            <HardDrive className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            برو به مسیر
          </button>
        </form>

        {/* Filters, Search & View Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              همه ({browseResult?.stats.totalItems ?? 0})
            </button>
            <button
              onClick={() => setTypeFilter('images')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'images'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>تصاویر ({browseResult?.stats.totalImages ?? 0})</span>
            </button>
            <button
              onClick={() => setTypeFilter('folders')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'folders'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>پوشه‌ها ({browseResult?.stats.totalFolders ?? 0})</span>
            </button>
            <button
              onClick={() => setTypeFilter('database')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'database'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>دیتابیس SQLite</span>
            </button>
          </div>

          {/* Search, Sort & Grid/Table Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در این پوشه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-48 pl-3 pr-7 py-1 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2" />
            </div>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
            >
              <option value="date_desc">جدیدترین</option>
              <option value="name_asc">نام (الف-ی)</option>
              <option value="size_desc">حجم فایل</option>
            </select>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-cyan-700' : 'text-slate-500'}`}
                title="نمایش شبکه‌ای (تصاویر بزرگ)"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-cyan-700' : 'text-slate-500'}`}
                title="نمایش لیستی"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error display if any */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchDirectory('/media/mahdi/mm/doctor')}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
          >
            بازگشت به ریشه هارد
          </button>
        </div>
      )}

      {/* Main Explorer Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
          <p className="text-sm font-medium">در حال خواندن محتویات هارد دیسک...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">هیچ فایلی در این پوشه یافت نشد</h3>
          <p className="text-xs text-slate-500">
            تصاویر ارسال شده توسط دوربین سونی یا نرم‌افزار FTP در این مسیر نمایش داده می‌شوند.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.path}
              onClick={() => {
                if (item.isDirectory) {
                  fetchDirectory(item.path);
                } else {
                  handleInspect(item);
                }
              }}
              className={`group bg-white rounded-xl border transition-all duration-150 p-2.5 flex flex-col justify-between cursor-pointer hover:shadow-md ${
                selectedFile?.path === item.path
                  ? 'border-cyan-500 ring-2 ring-cyan-200 bg-cyan-50/20'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Thumbnail / Icon area */}
              <div className="aspect-square w-full rounded-lg bg-slate-100 overflow-hidden relative flex items-center justify-center mb-2">
                {item.isDirectory ? (
                  <Folder className="w-14 h-14 text-amber-400 group-hover:scale-105 transition-transform" />
                ) : item.isImage ? (
                  <img
                    src={item.viewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : item.isDatabase ? (
                  <Database className="w-12 h-12 text-indigo-500" />
                ) : item.isText ? (
                  <FileText className="w-12 h-12 text-slate-500" />
                ) : (
                  <File className="w-12 h-12 text-slate-400" />
                )}

                {/* Badge for extension */}
                {!item.isDirectory && (
                  <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                    {item.extension}
                  </span>
                )}

                {/* Quick inspect button hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <span className="bg-white text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{item.isDirectory ? 'ورود به پوشه' : 'بررسی فایل'}</span>
                  </span>
                </div>
              </div>

              {/* File Info */}
              <div className="space-y-1">
                <div 
                  className="font-medium text-slate-800 text-xs truncate dir-ltr text-right" 
                  title={item.name}
                >
                  {item.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{item.sizeFormatted}</span>
                  <span>{new Date(item.modifiedAt).toLocaleDateString('fa-IR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-2.5 px-4">نام</th>
                  <th className="py-2.5 px-4">نوع</th>
                  <th className="py-2.5 px-4">حجم</th>
                  <th className="py-2.5 px-4">آخرین تغییرات</th>
                  <th className="py-2.5 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.path}
                    onClick={() => {
                      if (item.isDirectory) {
                        fetchDirectory(item.path);
                      } else {
                        handleInspect(item);
                      }
                    }}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {item.isDirectory ? (
                          <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : item.isImage ? (
                          <FileImage className="w-4 h-4 text-cyan-600 shrink-0" />
                        ) : item.isDatabase ? (
                          <Database className="w-4 h-4 text-indigo-500 shrink-0" />
                        ) : (
                          <File className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="font-mono text-slate-800 font-medium truncate max-w-xs sm:max-w-md">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {item.isDirectory ? 'پوشه' : item.extension || 'فایل'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {item.sizeFormatted}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {new Date(item.modifiedAt).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-2.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {!item.isDirectory && (
                          <>
                            <button
                              onClick={() => handleInspect(item)}
                              className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              بررسی
                            </button>
                            <button
                              onClick={() => handleDeleteFile(item.path)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {item.isDirectory && (
                          <button
                            onClick={() => fetchDirectory(item.path)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
                          >
                            باز کردن
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION DRAWER / MODAL */}
      {isInspecting && selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5 truncate">
                <FileImage className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <h3 className="font-bold text-sm text-white truncate dir-ltr text-right">
                    {selectedFile.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {selectedFile.path}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteFile(selectedFile.path)}
                  className="p-1.5 rounded-lg hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                  title="حذف فایل از هارد"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCloseInspector}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split view (Preview on Left/Center, Info & Patient Assign on Right) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200">
              {/* Media Preview Column (7 cols) */}
              <div className="lg:col-span-7 bg-slate-950 flex flex-col items-center justify-center relative p-4 min-h-[320px]">
                {selectedFile.isImage ? (
                  <div className="relative max-w-full max-h-[55vh] flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedFile.viewUrl}
                      alt={selectedFile.name}
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-lg select-none"
                    />
                  </div>
                ) : selectedFile.isText && inspectionData?.textPreview ? (
                  <div className="w-full h-full max-h-[50vh] overflow-y-auto bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs text-left dir-ltr">
                    <pre>{inspectionData.textPreview}</pre>
                  </div>
                ) : selectedFile.isDatabase ? (
                  <div className="text-center space-y-2 text-slate-300 p-6">
                    <Database className="w-16 h-16 text-indigo-400 mx-auto" />
                    <h4 className="font-bold text-white text-base">پایگاه داده SQLite کلینیک</h4>
                    <p className="text-xs text-slate-400">
                      جداول: {inspectionData?.databaseDetails?.tables?.join('، ') || 'patients, photos, settings'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-slate-400">
                    <File className="w-16 h-16 mx-auto text-slate-500" />
                    <p className="text-xs">پیش‌نمایش برای این فرمت در دسترس نیست</p>
                  </div>
                )}

                {/* Image Zoom & Rotate Controls */}
                {selectedFile.isImage && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2 text-white text-xs">
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                      className="p-1 hover:bg-slate-800 rounded-full"
                      title="بزرگنمایی کمتر"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-[11px] w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                      className="p-1 hover:bg-slate-800 rounded-full"
                      title="بزرگنمایی بیشتر"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-700"></div>
                    <button
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1 hover:bg-slate-800 rounded-full"
                      title="چرخش ۹۰ درجه"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setZoomLevel(1); setRotation(0); }}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                    >
                      تنظیم مجدد
                    </button>
                  </div>
                )}
              </div>

              {/* Technical Inspection & Patient Assignment Column (5 cols) */}
              <div className="lg:col-span-5 p-5 space-y-5 bg-white overflow-y-auto">
                {/* File Technical Metadata Box */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-600" />
                    <span>مشخصات فنی و فایل دیسک</span>
                  </h4>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">حجم دقیق:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedFile.sizeFormatted} ({selectedFile.sizeBytes.toLocaleString()} بایت)</span>
                    </div>
                    {inspectionData?.imageDetails?.width && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">ابعاد تصویر:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {inspectionData.imageDetails.width} × {inspectionData.imageDetails.height} پیکسل
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">تاریخ ایجاد:</span>
                      <span className="font-mono text-slate-700">{new Date(selectedFile.createdAt).toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">آخرین ویرایش:</span>
                      <span className="font-mono text-slate-700">{new Date(selectedFile.modifiedAt).toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">فرمت فایل:</span>
                      <span className="font-mono uppercase font-bold text-slate-700">{selectedFile.extension}</span>
                    </div>

                    {/* Sony Camera EXIF info if available */}
                    {inspectionData?.imageDetails?.exif?.cameraModel && (
                      <div className="pt-2 border-t border-slate-200 mt-2 space-y-1">
                        <div className="flex items-center justify-between text-cyan-800 font-medium">
                          <span>دوربین:</span>
                          <span className="font-mono">{inspectionData.imageDetails.exif.cameraModel}</span>
                        </div>
                        {inspectionData.imageDetails.exif.lensModel && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>لنز:</span>
                            <span className="font-mono text-[11px]">{inspectionData.imageDetails.exif.lensModel}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Assignment Action Box (Only for images) */}
                {selectedFile.isImage && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-600" />
                      <span>ثبت مستقیم در پرونده و آلبوم بالینی بیمار</span>
                    </h4>

                    {assignSuccess ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{assignSuccess}</span>
                        </div>
                        <button
                          onClick={() => setAssignSuccess(null)}
                          className="text-[11px] text-emerald-700 underline font-medium cursor-pointer"
                        >
                          ثبت مجدد با زاویه یا بیماری دیگر
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Select Patient */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            انتخاب بیمار:
                          </label>
                          <select
                            value={assignPatientId}
                            onChange={(e) => setAssignPatientId(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                          >
                            {patients.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.fullName} ({p.fileNo})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Select Angle */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            زاویه عکاسی استاندارد:
                          </label>
                          <select
                            value={assignAngle}
                            onChange={(e: any) => setAssignAngle(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                          >
                            {Object.entries(ANGLE_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label.fa} ({label.en})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Select Stage */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            مرحله زمانی عمل:
                          </label>
                          <select
                            value={assignStage}
                            onChange={(e: any) => setAssignStage(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                          >
                            {Object.entries(STAGE_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label.fa}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={handleAssignToPatient}
                          disabled={isAssigning || !assignPatientId}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isAssigning ? 'در حال ثبت...' : 'ثبت در پرونده بیمار'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-600" />
              <span>ایجاد پوشه جدید در هارد</span>
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">نام پوشه:</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="مثلاً: patient_photos یا archive"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl font-bold"
                >
                  ایجاد پوشه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
