import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  ArrowLeft, 
  Sliders, 
  Sparkles, 
  Radio, 
  Wifi, 
  UserCheck, 
  FolderPlus, 
  Info,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  Patient, 
  SonyFTPConfig, 
  IngestedQueueItem, 
  PhotoAngle, 
  PhotoStage, 
  ANGLE_LABELS, 
  STAGE_LABELS,
  ClinicalPhoto
} from '../types';
import { getClinicalPhotoSvg } from '../utils/rhinoImageGenerator';
import { ServerConfigBanner } from './ServerConfigBanner';

interface SonyFTPInboxProps {
  ftpConfig: SonyFTPConfig;
  patients: Patient[];
  activePatient: Patient | null;
  incomingQueue: IngestedQueueItem[];
  onAssignPhoto: (queueItemId: string, patientId: string, angle: PhotoAngle, stage: PhotoStage) => void;
  onSimulateCameraShot: (angle?: PhotoAngle) => void;
  onUploadFileToQueue: (file: File) => void;
}

export const SonyFTPInbox: React.FC<SonyFTPInboxProps> = ({
  ftpConfig,
  patients,
  activePatient,
  incomingQueue,
  onAssignPhoto,
  onSimulateCameraShot,
  onUploadFileToQueue
}) => {
  const [selectedQueueItem, setSelectedQueueItem] = useState<IngestedQueueItem | null>(
    incomingQueue[0] || null
  );

  const [targetPatientId, setTargetPatientId] = useState<string>(
    activePatient?.id || patients[0]?.id || ''
  );
  const [targetAngle, setTargetAngle] = useState<PhotoAngle>('profile_left');
  const [targetStage, setTargetStage] = useState<PhotoStage>('pre_op');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleSimulate = (angle: PhotoAngle) => {
    setIsSimulating(true);
    setTimeout(() => {
      onSimulateCameraShot(angle);
      setIsSimulating(false);
    }, 600);
  };

  const handleConfirmAssign = () => {
    if (!selectedQueueItem || !targetPatientId) return;
    onAssignPhoto(selectedQueueItem.id, targetPatientId, targetAngle, targetStage);
  };

  const anglesList: PhotoAngle[] = [
    'frontal',
    'profile_left',
    'profile_right',
    'oblique_left',
    'oblique_right',
    'basal',
    'dorsal'
  ];

  return (
    <div className="space-y-6">
      {/* Top Exact Server Status Banner Matching User Specification */}
      <ServerConfigBanner ftpConfig={ftpConfig} />

      {/* Top Banner & Live Sony Connection Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 border border-slate-700 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-lg font-bold text-white">مرکز دریافت خودکار تصاویر از دوربین سونی (Sony FTP Receiver)</h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              دوربین سونی آلفا (Sony A7 IV / A7R) با شلیک هر شاتر به صورت خودکار عکس با کیفیت کامل را از طریق پروتکل FTP و اینترنت به سرور رزبری‌پای با آی‌پی استاتیک ارسال می‌نماید.
            </p>
          </div>

          {/* Live Camera Connection Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">آی‌پی استاتیک سرور:</span>
              <span className="text-emerald-400 font-bold">{ftpConfig.publicIp}:{ftpConfig.ftpPort}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">پوشه ذخیره سرور:</span>
              <span className="text-cyan-400 font-bold truncate block text-[11px]" title={ftpConfig.uploadFolder}>
                {ftpConfig.uploadFolder || '/home/pi/sony_rhino_photos'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">وضعیت دوربین:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-400" />
                متصل (Online)
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">حالت انتقال:</span>
              <span className="text-white font-bold">Auto Transfer (شاتر)</span>
            </div>
          </div>
        </div>

        {/* Quick Sony Camera Shutter Trigger Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">
              شبیه‌ساز تست دریافت شات از دوربین سونی:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {anglesList.map((ang) => (
              <button
                key={ang}
                id={`simulate-shot-${ang}`}
                disabled={isSimulating}
                onClick={() => handleSimulate(ang)}
                className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>ثبت {ANGLE_LABELS[ang].fa.split(' ')[0]}</span>
              </button>
            ))}

            <label className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>آپلود فایل دوربین از سیستم</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onUploadFileToQueue(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Inbox & Assignment Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Ingested Photos */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>صف عکس‌های دریافتی اخیر از سونی ({incomingQueue.length})</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {incomingQueue.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-xs leading-relaxed">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-600">صف عکس‌ها خالی است</p>
                <p className="text-slate-400 text-[11px] mt-1">در انتظار دریافت فایل از دوربین سونی روی پورت {ftpConfig.ftpPort} یا آپلود عکس.</p>
              </div>
            ) : (
              incomingQueue.map((item) => {
                const isSelected = selectedQueueItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedQueueItem(item);
                      if (item.detectedAngle) setTargetAngle(item.detectedAngle);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300">
                      <img 
                        src={item.url} 
                        alt="Thumb" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 font-mono truncate">{item.filename}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.cameraModel}</p>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.status === 'assigned' ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> دسته‌بندی شده
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                            در انتظار دسته‌بندی
                          </span>
                        )}
                        {item.detectedAngle && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                            {ANGLE_LABELS[item.detectedAngle]?.fa.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Photo Inspector & Patient/Angle Assignment Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          {selectedQueueItem ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">بررسی و الصاق عکس به پرونده بیمار</h3>
                  <p className="text-xs text-slate-500">انتخاب پرونده بیمار، زاویه بالینی رینوپلاستی و مقطع زمانی</p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span>{selectedQueueItem.filename}</span>
                </div>
              </div>

              {/* Photo Display & EXIF Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800">
                  <img
                    src={selectedQueueItem.url}
                    alt="Preview"
                    className="max-h-full object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Sony EXIF Metadata Box */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                  <p className="font-bold text-slate-800 text-[11px] pb-1 border-b border-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>فراداده رسمی دوربین سونی (Sony Camera EXIF)</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Camera:</span>
                      <span className="text-slate-800 font-bold">{selectedQueueItem.exif.cameraModel}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Lens:</span>
                      <span className="text-slate-800 font-bold">{selectedQueueItem.exif.lensModel}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Aperture:</span>
                      <span className="text-slate-800 font-bold">{selectedQueueItem.exif.aperture}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Shutter:</span>
                      <span className="text-slate-800 font-bold">{selectedQueueItem.exif.shutterSpeed}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ISO:</span>
                      <span className="text-slate-800 font-bold">{selectedQueueItem.exif.iso}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Focal Length:</span>
                      <span className="text-slate-800 font-bold">{selectedQueueItem.exif.focalLength}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Form Controls */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-4">
                <h4 className="font-bold text-emerald-950 text-xs">تعیین دسته‌بندی برای پرونده بیمار:</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Select Patient */}
                  <div>
                    <label className="text-xs text-slate-600 block mb-1 font-medium">۱. پرونده بیمار:</label>
                    <select
                      id="assign-patient-select"
                      value={targetPatientId}
                      onChange={(e) => setTargetPatientId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.fileNo})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Angle */}
                  <div>
                    <label className="text-xs text-slate-600 block mb-1 font-medium">۲. زاویه استاندارد عکاسی:</label>
                    <select
                      id="assign-angle-select"
                      value={targetAngle}
                      onChange={(e) => setTargetAngle(e.target.value as PhotoAngle)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    >
                      {anglesList.map(ang => (
                        <option key={ang} value={ang}>
                          {ANGLE_LABELS[ang].fa}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Stage */}
                  <div>
                    <label className="text-xs text-slate-600 block mb-1 font-medium">۳. مقطع زمانی رینوپلاستی:</label>
                    <select
                      id="assign-stage-select"
                      value={targetStage}
                      onChange={(e) => setTargetStage(e.target.value as PhotoStage)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="pre_op">قبل از عمل (Pre-Op)</option>
                      <option value="intra_op">حین عمل (Intra-Op)</option>
                      <option value="post_op_1m">۱ ماه بعد از عمل</option>
                      <option value="post_op_3m">۳ ماه بعد از عمل</option>
                      <option value="post_op_6m">۶ ماه بعد از عمل</option>
                      <option value="post_op_1y">۱ سال بعد از عمل</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    id="confirm-assign-btn"
                    onClick={handleConfirmAssign}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>ثبت در پرونده بیمار و ذخیره سازی</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-2">
              <Camera className="w-12 h-12 text-slate-300 stroke-1" />
              <p className="text-sm font-semibold text-slate-700">عکسی برای بررسی انتخاب نشده است</p>
              <p className="text-xs text-slate-500 max-w-sm">
                {incomingQueue.length === 0 
                  ? 'به محض ثبت شات توسط دوربین سونی یا آپلود فایل عکس، تصاویر جهت دسته‌بندی و الصاق به پرونده در اینجا ظاهر خواهند شد.'
                  : 'برای مشاهده فراداده EXIF و الصاق به پرونده بیمار، یک مورد را از لیست صف انتخاب نمایید.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
