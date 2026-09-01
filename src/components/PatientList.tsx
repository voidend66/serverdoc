import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  Calendar, 
  Phone, 
  Camera, 
  GitCompare, 
  Eye, 
  SlidersHorizontal,
  FileText,
  Clock,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Patient, RhinoplastyType, SkinThickness, AestheticGoal } from '../types';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onOpenComparison: (patient: Patient) => void;
  onSetActiveForShooting: (patient: Patient) => void;
  activeShootingPatientId: string | null;
  onNewPatient: () => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  onSelectPatient,
  onOpenComparison,
  onSetActiveForShooting,
  activeShootingPatientId,
  onNewPatient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSkin, setSelectedSkin] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.fullName.includes(searchQuery) ||
      patient.fileNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.nationalId.includes(searchQuery) ||
      patient.phone.includes(searchQuery);

    const matchesType = selectedType === 'all' || patient.rhinoplastyType === selectedType;
    const matchesSkin = selectedSkin === 'all' || patient.skinThickness === selectedSkin;
    const matchesStatus = selectedStatus === 'all' || patient.status === selectedStatus;

    return matchesSearch && matchesType && matchesSkin && matchesStatus;
  });

  const totalPhotosCount = patients.reduce((acc, p) => acc + (p.photos?.length || 0), 0);
  const scheduledCount = patients.filter(p => p.status === 'scheduled').length;
  const followUpCount = patients.filter(p => p.status === 'follow_up').length;

  const getTypeLabel = (type: RhinoplastyType) => {
    switch (type) {
      case 'primary': return 'رینوپلاستی اولیه';
      case 'revision': return 'رینوپلاستی ترمیمی';
      case 'septorhinoplasty': return 'سپتورینوپلاستی';
      case 'tip_plasty': return 'تیپ‌پلاستی';
    }
  };

  const getSkinLabel = (skin: SkinThickness) => {
    switch (skin) {
      case 'thin': return 'پوست نازک';
      case 'medium': return 'پوست متوسط';
      case 'thick_sebaceous': return 'پوست ضخیم (گوشتی)';
    }
  };

  const getStatusBadge = (status: Patient['status']) => {
    switch (status) {
      case 'pre_op_consult':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full">مشاوره قبل عمل</span>;
      case 'scheduled':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full">نوبت جراحی ثبت شده</span>;
      case 'operated':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded-full">جراحی شده (بستری)</span>;
      case 'follow_up':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full">ویزیت و فالوآپ</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full">پرونده تکمیل شده</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">کل پرونده‌های ثبت‌شده</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{patients.length} <span className="text-sm font-normal text-slate-500">بیمار</span></p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">نوبت‌های جراحی آینده</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{scheduledCount} <span className="text-sm font-normal text-slate-500">نفر</span></p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">پیگیری و ویزیت دوره‌ای</p>
            <p className="text-2xl font-bold text-teal-600 mt-1">{followUpCount} <span className="text-sm font-normal text-slate-500">بیمار</span></p>
          </div>
          <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">کل عکس‌های دریافتی سونی</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{totalPhotosCount} <span className="text-sm font-normal text-slate-500">شات</span></p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-100">
            <Camera className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header & Search Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام بیمار، شماره پرونده (مثال: RH-1403-104)، کد ملی یا شماره همراه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              id="new-patient-btn"
              onClick={onNewPatient}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تشکیل پرونده بیمار جدید</span>
            </button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>فیلترها:</span>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">همه انواع جراحی</option>
            <option value="primary">رینوپلاستی اولیه</option>
            <option value="revision">رینوپلاستی ترمیمی</option>
            <option value="septorhinoplasty">سپتورینوپلاستی</option>
            <option value="tip_plasty">تیپ‌پلاستی</option>
          </select>

          {/* Skin Filter */}
          <select
            value={selectedSkin}
            onChange={(e) => setSelectedSkin(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">همه نوع پوست</option>
            <option value="thin">پوست نازک</option>
            <option value="medium">پوست متوسط</option>
            <option value="thick_sebaceous">پوست ضخیم و گوشتی</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="pre_op_consult">مشاوره قبل عمل</option>
            <option value="scheduled">نوبت جراحی ثبت شده</option>
            <option value="follow_up">فالوآپ و ویزیت</option>
            <option value="completed">تکمیل شده</option>
          </select>

          {(selectedType !== 'all' || selectedSkin !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedSkin('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-emerald-700 hover:text-emerald-800 underline font-medium mr-auto"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto">
          <FileText className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">
            {patients.length === 0 ? 'هیچ پرونده بیماری ثبت نشده است' : 'پرونده‌ای با این مشخصات یافت نشد'}
          </h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            {patients.length === 0 
              ? 'برای شروع عکاسی و ثبت سوابق، پرونده اولین بیمار را ایجاد نمایید.' 
              : 'می‌توانید فیلترها را تغییر داده یا پرونده جدید ثبت نمایید.'}
          </p>
          {patients.length === 0 && (
            <button
              onClick={onNewPatient}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت اولین پرونده بیمار</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredPatients.map((patient) => {
            const preOpPhoto = patient.photos?.find(p => p.stage === 'pre_op' && p.angle === 'profile_left') || patient.photos?.[0];
            const postOpPhoto = patient.photos?.find(p => p.stage !== 'pre_op' && p.angle === 'profile_left') || patient.photos?.find(p => p.stage !== 'pre_op');
            const isActiveShooting = activeShootingPatientId === patient.id;

            return (
              <div
                key={patient.id}
                id={`patient-card-${patient.id}`}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-md ${
                  isActiveShooting 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/5' 
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200">
                        {patient.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base hover:text-emerald-700 cursor-pointer" onClick={() => onSelectPatient(patient)}>
                            {patient.fullName}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium">({patient.age} ساله - {patient.gender === 'female' ? 'خانم' : 'آقا'})</span>
                        </div>
                        <p className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">
                          {patient.fileNo} | کد ملی: {patient.nationalId}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {getStatusBadge(patient.status)}
                      {isActiveShooting && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                          <Camera className="w-3 h-3" />
                          عکاسی فعال سونی
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Surgery & Anatomy Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 my-3 text-xs">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium">
                      {getTypeLabel(patient.rhinoplastyType)}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium">
                      {getSkinLabel(patient.skinThickness)}
                    </span>
                    <span className="bg-teal-50 text-teal-800 px-2 py-1 rounded-md font-medium border border-teal-200/60">
                      هدف: {patient.aestheticGoal === 'natural' ? 'طبیعی' : patient.aestheticGoal === 'semi_fantasy' ? 'نیمه فانتزی' : 'فانتزی'}
                    </span>
                  </div>

                  {/* Defects / Notes Snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                    {patient.clinicalNotes || 'بدون یادداشت بالینی'}
                  </p>

                  {/* Photo Visual Matrix Preview (Before & After Thumbnails) */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-center">
                      <p className="text-[11px] font-medium text-amber-800 mb-1">قبل از عمل (Pre-Op)</p>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 border border-slate-300/80 relative">
                        {preOpPhoto ? (
                          <img 
                            src={preOpPhoto.url} 
                            alt="Pre-Op" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 text-xs">بدون عکس</div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded">
                          {preOpPhoto?.angle ? 'نیم‌رخ' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] font-medium text-emerald-800 mb-1">بعد از عمل (Post-Op)</p>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 border border-slate-300/80 relative">
                        {postOpPhoto ? (
                          <img 
                            src={postOpPhoto.url} 
                            alt="Post-Op" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 text-[11px]">
                            در انتظار فالوآپ
                          </div>
                        )}
                        {postOpPhoto && (
                          <span className="absolute bottom-1 right-1 bg-emerald-800/80 text-white text-[9px] px-1 py-0.5 rounded">
                            {postOpPhoto.stage === 'post_op_3m' ? '۳ ماهه' : '۱ ماهه'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 px-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    <span>{patient.photos?.length || 0} شات استودیو</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`set-shooting-${patient.id}`}
                      onClick={() => onSetActiveForShooting(patient)}
                      title="اتصال دوربین سونی برای این بیمار"
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        isActiveShooting
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isActiveShooting ? 'فعال برای سونی' : 'عکاسی سونی'}</span>
                    </button>

                    <button
                      id={`compare-btn-${patient.id}`}
                      onClick={() => onOpenComparison(patient)}
                      title="مقایسه زوایا قبل و بعد عمل"
                      className="text-xs bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <GitCompare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>میز مقایسه</span>
                    </button>

                    <button
                      id={`view-patient-${patient.id}`}
                      onClick={() => onSelectPatient(patient)}
                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>مشاهده زوایا</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
