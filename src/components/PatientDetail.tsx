import React, { useState } from 'react';
import { 
  ArrowRight, 
  Camera, 
  GitCompare, 
  Download, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  Layers, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Maximize2, 
  Info,
  Edit3,
  Sliders,
  Eye,
  Plus
} from 'lucide-react';
import { 
  Patient, 
  PhotoAngle, 
  PhotoStage, 
  ClinicalPhoto, 
  ANGLE_LABELS, 
  STAGE_LABELS 
} from '../types';
import { getClinicalPhotoSvg } from '../utils/rhinoImageGenerator';

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
  onOpenComparison: (patient: Patient) => void;
  onSetActiveForShooting: (patient: Patient) => void;
  isActiveShooting: boolean;
  onUpdatePatientPhotos: (patientId: string, photos: ClinicalPhoto[]) => void;
  onEditPatient: (patient: Patient) => void;
  onOpenDirectCamera: (angle: PhotoAngle, stage: PhotoStage) => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  onBack,
  onOpenComparison,
  onSetActiveForShooting,
  isActiveShooting,
  onUpdatePatientPhotos,
  onEditPatient,
  onOpenDirectCamera
}) => {
  const [activeStage, setActiveStage] = useState<PhotoStage>('pre_op');
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<ClinicalPhoto | null>(null);

  const angles: PhotoAngle[] = [
    'frontal',
    'profile_left',
    'profile_right',
    'oblique_left',
    'oblique_right',
    'basal',
    'dorsal'
  ];

  const stages: PhotoStage[] = [
    'pre_op',
    'post_op_1m',
    'post_op_3m',
    'post_op_6m',
    'post_op_1y'
  ];

  // Get photo for specific angle and stage
  const getPhoto = (angle: PhotoAngle, stage: PhotoStage) => {
    return patient.photos.find(p => p.angle === angle && p.stage === stage);
  };

  // Handle local image file upload into a specific slot
  const handleFileUpload = (angle: PhotoAngle, stage: PhotoStage, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newPhoto: ClinicalPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientId: patient.id,
        url: dataUrl,
        filename: file.name || `DSC_${Math.floor(1000 + Math.random() * 9000)}.JPG`,
        angle,
        stage,
        timestamp: new Date().toLocaleTimeString('fa-IR'),
        exif: {
          cameraModel: 'Sony ILCE-7M4 (Direct Upload)',
          lensModel: 'FE 90mm F2.8 Macro G OSS',
          focalLength: '90.0 mm',
          aperture: 'f/8.0',
          shutterSpeed: '1/160s',
          iso: 'ISO 100',
          shootingDate: new Date().toISOString()
        }
      };

      // Filter out existing photo for this slot and add new
      const updatedPhotos = patient.photos.filter(p => !(p.angle === angle && p.stage === stage));
      updatedPhotos.push(newPhoto);
      onUpdatePatientPhotos(patient.id, updatedPhotos);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            id="back-to-patients-btn"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
            title="بازگشت به لیست بیماران"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{patient.fullName}</h2>
              <span className="font-mono text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                {patient.fileNo}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              کد ملی: {patient.nationalId} | تلفن: {patient.phone} | سن: {patient.age} سال
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="detail-set-sony-active-btn"
            onClick={() => onSetActiveForShooting(patient)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActiveShooting
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isActiveShooting ? 'بیمار فعال برای دریافت از سونی' : 'فعال‌سازی دریافت سونی'}</span>
          </button>

          <button
            id="detail-compare-btn"
            onClick={() => onOpenComparison(patient)}
            className="flex items-center gap-2 bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <GitCompare className="w-4 h-4" />
            <span>میز مقایسه قبل و بعد</span>
          </button>

          <button
            id="detail-edit-btn"
            onClick={() => onEditPatient(patient)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>ویرایش پرونده</span>
          </button>
        </div>
      </div>

      {/* Patient Medical Dossier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-400 font-medium">نوع رینوپلاستی و هدف</p>
          <p className="text-sm font-bold text-slate-900 mt-1">
            {patient.rhinoplastyType === 'primary' ? 'رینوپلاستی اولیه' :
             patient.rhinoplastyType === 'revision' ? 'رینوپلاستی ترمیمی' :
             patient.rhinoplastyType === 'septorhinoplasty' ? 'سپتورینوپلاستی' : 'تیپ‌پلاستی'}
          </p>
          <span className="inline-block mt-2 text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
            فرم هدف: {patient.aestheticGoal === 'natural' ? 'طبیعی (Natural)' : patient.aestheticGoal === 'semi_fantasy' ? 'نیمه فانتزی' : 'فانتزی'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-400 font-medium">ضخامت و کیفیت پوست بینی</p>
          <p className="text-sm font-bold text-slate-900 mt-1">
            {patient.skinThickness === 'thin' ? 'پوست نازک (Thin Skin)' :
             patient.skinThickness === 'medium' ? 'پوست متوسط (Medium)' : 'پوست ضخیم و سباسه (گوشتی)'}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            راه تنفسی: {patient.airwayStatus === 'normal' ? 'نرمال و بدون انسداد' : 'انحراف تیغه و تنگی دریچه'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-400 font-medium">جراح و تاریخ عمل</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{patient.surgeonName}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-2">
            تاریخ جراحی: {patient.surgeryDate || 'تعیین نشده'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-400 font-medium">دفورمیتی‌ها و تشخیص بالینی</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {patient.nasalDefects?.map((defect, i) => (
              <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                {defect}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stage Selection Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">ماتریس عکاسی زوایای هفت‌گانه رینوپلاستی</h3>
            <p className="text-xs text-slate-500">مشاهده و دسته‌بندی عکس‌های گرفته شده با دوربین سونی برای هر مرحله بالینی</p>
          </div>

          {/* Stages Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {stages.map((stage) => {
              const countForStage = patient.photos.filter(p => p.stage === stage).length;
              const isSelected = activeStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <span>{STAGE_LABELS[stage].fa}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {countForStage}/7
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7-Angle Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {angles.map((angle) => {
            const photo = getPhoto(angle, activeStage);
            const angleInfo = ANGLE_LABELS[angle];

            return (
              <div
                key={angle}
                className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-emerald-400 transition-all group"
              >
                {/* Angle Header */}
                <div className="p-2.5 px-3 bg-white border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{angleInfo.fa}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{angleInfo.en}</p>
                  </div>
                  {photo && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="عکس موجود است"></span>
                  )}
                </div>

                {/* Photo Display Slot */}
                <div className="aspect-[4/5] bg-slate-200 relative overflow-hidden flex items-center justify-center">
                  {photo ? (
                    <>
                      <img
                        src={photo.url}
                        alt={angleInfo.fa}
                        className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-102"
                        onClick={() => setSelectedPhotoForModal(photo)}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedPhotoForModal(photo)}
                          className="bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow cursor-pointer"
                          title="مشاهده بزرگنمایی و اطلاعات EXIF سونی"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <label className="bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(angle, activeStage, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {photo.exif && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                          Sony {photo.exif.focalLength} • {photo.exif.aperture}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                      <p className="text-xs text-slate-500 font-medium">فاقد عکس برای این زاویه</p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <button
                          onClick={() => onOpenDirectCamera(angle, activeStage)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                          title="عکاسی زنده با دوربین"
                        >
                          <Camera className="w-3 h-3" />
                          <span>ثبت سریع</span>
                        </button>
                        <label className="bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 text-[11px] px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>آپلود</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(angle, activeStage, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slot Footer */}
                <div className="p-2 bg-white text-[11px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
                  <span>{photo ? photo.filename : 'در انتظار دریافت از سونی'}</span>
                  {photo && (
                    <button
                      onClick={() => {
                        const updated = patient.photos.filter(p => p.id !== photo.id);
                        onUpdatePatientPhotos(patient.id, updated);
                      }}
                      className="text-red-500 hover:text-red-700 text-[10px] cursor-pointer"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Notes Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>برنامه جراحی و یادداشت‌های بالینی پرونده</span>
        </h3>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
          {patient.clinicalNotes || 'یادداشتی برای این پرونده ثبت نشده است.'}
        </div>
      </div>

      {/* EXIF & Fullscreen Photo Modal */}
      {selectedPhotoForModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">
                  {ANGLE_LABELS[selectedPhotoForModal.angle]?.fa} - {STAGE_LABELS[selectedPhotoForModal.stage]?.fa}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedPhotoForModal.filename}</p>
              </div>
              <button
                onClick={() => setSelectedPhotoForModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 px-2.5 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-auto">
              {/* High-res image display */}
              <div className="md:col-span-2 bg-slate-950 flex items-center justify-center p-4">
                <img
                  src={selectedPhotoForModal.url}
                  alt="High Res"
                  className="max-h-[60vh] object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Sony Camera EXIF Data */}
              <div className="p-5 bg-slate-50 border-r border-slate-200 space-y-4">
                <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>اطلاعات فنی دوربین سونی (EXIF)</span>
                </h5>

                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">مدل دوربین:</span>
                    <span className="font-bold text-slate-800">{selectedPhotoForModal.exif?.cameraModel || 'Sony ILCE-7M4'}</span>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">لنز ماکرو پزشکی:</span>
                    <span className="font-bold text-slate-800">{selectedPhotoForModal.exif?.lensModel || 'FE 90mm F2.8 Macro G OSS'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">دیافراگم (Aperture):</span>
                      <span className="font-bold text-slate-800">{selectedPhotoForModal.exif?.aperture || 'f/8.0'}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">سرعت شاتر:</span>
                      <span className="font-bold text-slate-800">{selectedPhotoForModal.exif?.shutterSpeed || '1/160s'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">ایزو (ISO):</span>
                      <span className="font-bold text-slate-800">{selectedPhotoForModal.exif?.iso || 'ISO 100'}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">فاصله کانونی:</span>
                      <span className="font-bold text-slate-800">{selectedPhotoForModal.exif?.focalLength || '90mm'}</span>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">تاریخ و ساعت ثبت شات:</span>
                    <span className="font-bold text-slate-800 text-[11px]">{selectedPhotoForModal.timestamp}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <p className="text-[11px] text-slate-500">
                    عکس مستقیماً از طریق پروتکل FTP سونی روی سرور رزبری‌پای دریافت و در پرونده کلاسه گردیده است.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
