import React, { useState } from 'react';
import { Patient, RhinoplastyType, SkinThickness, AestheticGoal } from '../types';
import { User, Phone, Calendar, FileText, Check, X, Sparkles } from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: Partial<Patient>) => void;
  initialData?: Patient | null;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [nationalId, setNationalId] = useState(initialData?.nationalId || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '25');
  const [gender, setGender] = useState<'female' | 'male'>(initialData?.gender || 'female');
  const [rhinoplastyType, setRhinoplastyType] = useState<RhinoplastyType>(initialData?.rhinoplastyType || 'primary');
  const [skinThickness, setSkinThickness] = useState<SkinThickness>(initialData?.skinThickness || 'medium');
  const [aestheticGoal, setAestheticGoal] = useState<AestheticGoal>(initialData?.aestheticGoal || 'natural');
  const [surgeonName, setSurgeonName] = useState(initialData?.surgeonName || 'دکتر علیرضا کاظمی');
  const [surgeryDate, setSurgeryDate] = useState(initialData?.surgeryDate || '1403/09/20');
  const [clinicalNotes, setClinicalNotes] = useState(initialData?.clinicalNotes || '');
  const [status, setStatus] = useState<Patient['status']>(initialData?.status || 'pre_op_consult');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    onSave({
      fullName,
      nationalId,
      phone,
      age: parseInt(age) || 25,
      gender,
      rhinoplastyType,
      skinThickness,
      aestheticGoal,
      surgeonName,
      surgeryDate,
      clinicalNotes,
      status,
      nasalDefects: ['قوز استخوانی', 'افتادگی نوک بینی', 'انحراف سپتوم']
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {initialData ? 'ویرایش اطلاعات پرونده بیمار' : 'تشکیل پرونده بیمار جدید رینوپلاستی'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-medium block mb-1">نام و نام خانوادگی بیمار *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: سارا محمدی"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">کد ملی</label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="مثال: 0021458931"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-700 font-medium block mb-1">شماره همراه</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">سن</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">جنسیت</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'female' | 'male')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="female">خانم</option>
                <option value="male">آقا</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="text-slate-700 font-medium block mb-1">نوع عمل رینوپلاستی</label>
              <select
                value={rhinoplastyType}
                onChange={(e) => setRhinoplastyType(e.target.value as RhinoplastyType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="primary">رینوپلاستی اولیه</option>
                <option value="revision">رینوپلاستی ترمیمی</option>
                <option value="septorhinoplasty">سپتورینوپلاستی</option>
                <option value="tip_plasty">تیپ‌پلاستی</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">ضخامت و کیفیت پوست</label>
              <select
                value={skinThickness}
                onChange={(e) => setSkinThickness(e.target.value as SkinThickness)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="thin">پوست نازک</option>
                <option value="medium">پوست متوسط</option>
                <option value="thick_sebaceous">پوست ضخیم (گوشتی)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">هدف و فرم انتخابی</label>
              <select
                value={aestheticGoal}
                onChange={(e) => setAestheticGoal(e.target.value as AestheticGoal)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="natural">طبیعی (Natural)</option>
                <option value="semi_fantasy">نیمه فانتزی</option>
                <option value="fantasy">فانتزی / عروسکی</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-medium block mb-1">پزشک و جراح معالج</label>
              <input
                type="text"
                value={surgeonName}
                onChange={(e) => setSurgeonName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">تاریخ جراحی</label>
              <input
                type="text"
                value={surgeryDate}
                onChange={(e) => setSurgeryDate(e.target.value)}
                placeholder="1403/09/20"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-medium block mb-1">یادداشت‌های بالینی و برنامه جراحی</label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="نکات آناتومی، گرافت‌های مورد نیاز و برنامه اصلاح زوایا..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              ذخیره پرونده بیمار
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
