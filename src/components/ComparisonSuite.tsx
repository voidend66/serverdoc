import React, { useState, useRef, useEffect } from 'react';
import { 
  GitCompare, 
  Layers, 
  Sliders, 
  Maximize2, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal
} from 'lucide-react';
import { Patient, PhotoAngle, PhotoStage, ANGLE_LABELS, STAGE_LABELS } from '../types';

interface ComparisonSuiteProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
}

export const ComparisonSuite: React.FC<ComparisonSuiteProps> = ({
  patients,
  selectedPatient: initialSelectedPatient,
  onSelectPatient
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialSelectedPatient?.id || patients[0]?.id || ''
  );
  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle>('profile_left');
  const [stageBefore, setStageBefore] = useState<PhotoStage>('pre_op');
  const [stageAfter, setStageAfter] = useState<PhotoStage>('post_op_3m');

  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side_by_side' | 'overlay'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50);

  // Measurement Guides Overlays
  const [showThirdsGrid, setShowThirdsGrid] = useState<boolean>(false);
  const [showSymmetryLine, setShowSymmetryLine] = useState<boolean>(false);
  const [showNasolabialAngle, setShowNasolabialAngle] = useState<boolean>(true);
  const [showNasofrontalAngle, setShowNasofrontalAngle] = useState<boolean>(false);

  // Interactive Protractor State
  const [protractorActive, setProtractorActive] = useState<boolean>(false);
  const [p1, setP1] = useState<{ x: number; y: number }>({ x: 300, y: 360 }); // Tip/Subnasale
  const [p2, setP2] = useState<{ x: number; y: number }>({ x: 280, y: 400 }); // Vertex
  const [p3, setP3] = useState<{ x: number; y: number }>({ x: 320, y: 440 }); // Lip

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef<boolean>(false);

  // Get matching photos
  const photoBefore = currentPatient?.photos.find(p => p.angle === selectedAngle && p.stage === stageBefore);
  const photoAfter = currentPatient?.photos.find(p => p.angle === selectedAngle && p.stage === stageAfter);

  // Calculate angle between p1-p2 and p3-p2
  const calculateProtractorAngle = () => {
    const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let deg = Math.abs((angle1 - angle2) * (180 / Math.PI));
    if (deg > 180) deg = 360 - deg;
    return Math.round(deg);
  };

  // Slider Mouse/Touch dragging handlers
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    isDraggingSlider.current = true;
  };

  const handleMouseUp = () => {
    isDraggingSlider.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider.current) {
      handleSliderMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const anglesList: PhotoAngle[] = [
    'profile_left',
    'profile_right',
    'frontal',
    'oblique_left',
    'oblique_right',
    'basal',
    'dorsal'
  ];

  if (patients.length === 0 || !currentPatient) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto my-8">
        <GitCompare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-base">پرونده‌ای برای مقایسه تصاویر وجود ندارد</h3>
        <p className="text-slate-500 text-sm mt-1">
          برای استفاده از ابزار مقایسه قبل و بعد (پرده‌ای، دوگانه و شفاف)، ابتدا از بخش بیماران، پرونده ایجاد کرده و عکس‌های قبل و بعد را ثبت نمایید.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Patient & Angle Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Patient Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block">انتخاب پرونده بیمار جهت مقایسه:</label>
              <select
                id="comparison-patient-select"
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  const p = patients.find(pat => pat.id === e.target.value);
                  if (p) onSelectPatient(p);
                }}
                className="font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.fileNo}) - {p.rhinoplastyType === 'primary' ? 'اولیه' : p.rhinoplastyType === 'revision' ? 'ترمیمی' : 'سپتو'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stage 1 vs Stage 2 Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-amber-800 px-2">قبل:</span>
              <select
                value={stageBefore}
                onChange={(e) => setStageBefore(e.target.value as PhotoStage)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none"
              >
                <option value="pre_op">قبل از عمل (Pre-Op)</option>
                <option value="intra_op">حین عمل (Intra-Op)</option>
              </select>
            </div>

            <span className="text-slate-400 font-bold text-xs">در برابر</span>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-emerald-800 px-2">بعد:</span>
              <select
                value={stageAfter}
                onChange={(e) => setStageAfter(e.target.value as PhotoStage)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none"
              >
                <option value="post_op_1m">۱ ماه بعد عمل</option>
                <option value="post_op_3m">۳ ماه بعد عمل</option>
                <option value="post_op_6m">۶ ماه بعد عمل</option>
                <option value="post_op_1y">۱ سال بعد عمل</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setComparisonMode('slider')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  comparisonMode === 'slider' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                اسلایدر پرده‌ای
              </button>
              <button
                onClick={() => setComparisonMode('side_by_side')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  comparisonMode === 'side_by_side' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                کنار هم (دوگانه)
              </button>
              <button
                onClick={() => setComparisonMode('overlay')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  comparisonMode === 'overlay' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                انطباق شفاف
              </button>
            </div>
          </div>
        </div>

        {/* 7-Angle Selector Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-2">زاویه عکس:</span>
          {anglesList.map((ang) => (
            <button
              key={ang}
              onClick={() => setSelectedAngle(ang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedAngle === ang
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {ANGLE_LABELS[ang].fa}
            </button>
          ))}
        </div>
      </div>

      {/* Measurement Tools Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>خطوط راهنما و اندازه‌گیری پزشکی:</span>
          </span>

          <button
            onClick={() => setShowNasolabialAngle(!showNasolabialAngle)}
            className={`px-2.5 py-1 rounded-md border font-medium cursor-pointer transition-all ${
              showNasolabialAngle 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            زاویه نازولبیال (Nasolabial: ۹۵°-۱۰۵°)
          </button>

          <button
            onClick={() => setShowThirdsGrid(!showThirdsGrid)}
            className={`px-2.5 py-1 rounded-md border font-medium cursor-pointer transition-all ${
              showThirdsGrid 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            شبکه یک‌سوم‌های صورت (Facial Thirds)
          </button>

          <button
            onClick={() => setShowSymmetryLine(!showSymmetryLine)}
            className={`px-2.5 py-1 rounded-md border font-medium cursor-pointer transition-all ${
              showSymmetryLine 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            محور تقارن صورت (Symmetry Line)
          </button>

          <button
            onClick={() => setProtractorActive(!protractorActive)}
            className={`px-2.5 py-1 rounded-md border font-medium cursor-pointer transition-all ${
              protractorActive 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            📐 نقاله اندازه‌گیری دستی
          </button>
        </div>

        {comparisonMode === 'overlay' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">شفافیت لایه بعد:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="w-24 accent-emerald-600"
            />
            <span className="font-mono text-slate-700">{overlayOpacity}%</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>چاپ پرونده مقایسه</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Canvas Stage */}
      <div className="bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-800 shadow-xl overflow-hidden">
        {/* Stage Comparison Header */}
        <div className="flex items-center justify-between text-slate-200 text-xs mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="font-semibold">{STAGE_LABELS[stageBefore].fa}</span>
            <span className="text-slate-400 font-mono text-[11px]">{photoBefore?.filename || 'شات استودیو'}</span>
          </div>

          <div className="bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-medium">
            {ANGLE_LABELS[selectedAngle].fa} ({ANGLE_LABELS[selectedAngle].en})
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">{photoAfter?.filename || 'شات استودیو'}</span>
            <span className="font-semibold text-emerald-400">{STAGE_LABELS[stageAfter].fa}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        {/* Viewer Container */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          className="relative w-full max-w-4xl mx-auto aspect-[4/3] sm:aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none shadow-2xl flex items-center justify-center"
        >
          {comparisonMode === 'slider' && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* After Photo (Base / Right side) */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                {photoAfter ? (
                  <img
                    src={photoAfter.url}
                    alt="Post-Op"
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-500 text-sm">عکس مرحله بعد یافت نشد</div>
                )}
              </div>

              {/* Before Photo (Clipped / Left side) */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-slate-900 overflow-hidden"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                {photoBefore ? (
                  <img
                    src={photoBefore.url}
                    alt="Pre-Op"
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-500 text-sm">عکس مرحله قبل یافت نشد</div>
                )}
              </div>

              {/* Split Drag Line & Handle */}
              <div
                onMouseDown={handleMouseDown}
                className="absolute top-0 bottom-0 z-20 cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0.5 h-full bg-white shadow-md"></div>
                <div className="w-9 h-9 rounded-full bg-white text-slate-800 shadow-xl border-2 border-emerald-500 flex items-center justify-center cursor-ew-resize">
                  <MoveHorizontal className="w-5 h-5 text-emerald-700" />
                </div>
              </div>
            </div>
          )}

          {comparisonMode === 'side_by_side' && (
            <div className="grid grid-cols-2 w-full h-full divide-x divide-slate-800">
              <div className="relative flex items-center justify-center p-2">
                {photoBefore ? (
                  <img
                    src={photoBefore.url}
                    alt="Pre-Op"
                    className="max-h-full object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-500 text-sm">بدون تصویر</div>
                )}
                <span className="absolute top-3 right-3 bg-amber-500/90 text-slate-950 font-bold text-xs px-2 py-0.5 rounded">
                  قبل از عمل
                </span>
              </div>

              <div className="relative flex items-center justify-center p-2">
                {photoAfter ? (
                  <img
                    src={photoAfter.url}
                    alt="Post-Op"
                    className="max-h-full object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-500 text-sm">بدون تصویر</div>
                )}
                <span className="absolute top-3 left-3 bg-emerald-500/90 text-slate-950 font-bold text-xs px-2 py-0.5 rounded">
                  بعد از عمل
                </span>
              </div>
            </div>
          )}

          {comparisonMode === 'overlay' && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Base Before */}
              {photoBefore && (
                <img
                  src={photoBefore.url}
                  alt="Pre-Op Base"
                  className="absolute inset-0 w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
              {/* Semi-transparent After on top */}
              {photoAfter && (
                <img
                  src={photoAfter.url}
                  alt="Post-Op Overlay"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ opacity: overlayOpacity / 100 }}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          )}

          {/* Overlays SVG (Thirds grid, symmetry lines, protractor) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Facial Thirds Grid */}
            {showThirdsGrid && (
              <g stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.75">
                <line x1="0" y1="28%" x2="100%" y2="28%" />
                <line x1="0" y1="52%" x2="100%" y2="52%" />
                <line x1="0" y1="74%" x2="100%" y2="74%" />
                <text x="20" y="26%" fill="#38BDF8" fontSize="11" fontFamily="sans-serif">Trichion (خط رویش)</text>
                <text x="20" y="50%" fill="#38BDF8" fontSize="11" fontFamily="sans-serif">Subnasale (پایه بینی)</text>
                <text x="20" y="72%" fill="#38BDF8" fontSize="11" fontFamily="sans-serif">Menton (چانه)</text>
              </g>
            )}

            {/* Symmetry Midline */}
            {showSymmetryLine && (
              <g stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8">
                <line x1="50%" y1="0" x2="50%" y2="100%" />
                <text x="52%" y="30" fill="#10B981" fontSize="11" fontFamily="sans-serif">محور تقارن صورت</text>
              </g>
            )}
          </svg>

          {/* Interactive Protractor Overlay */}
          {protractorActive && (
            <div className="absolute inset-0 pointer-events-auto">
              <svg className="w-full h-full">
                {/* Lines */}
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#F59E0B" strokeWidth="2.5" />
                <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} stroke="#F59E0B" strokeWidth="2.5" />
                
                {/* Angle Value Display */}
                <g transform={`translate(${p2.x + 15}, ${p2.y - 15})`}>
                  <rect width="70" height="26" rx="6" fill="#0F172A" fillOpacity="0.9" stroke="#F59E0B" />
                  <text x="35" y="18" textAnchor="middle" fill="#F59E0B" fontSize="13" fontWeight="bold">
                    {calculateProtractorAngle()}°
                  </text>
                </g>
              </svg>

              {/* Draggable Handles */}
              <div
                style={{ left: p1.x - 10, top: p1.y - 10 }}
                className="absolute w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-900 cursor-move shadow-md"
                onMouseDown={(e) => {
                  const move = (ev: MouseEvent) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) setP1({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
                  };
                  const up = () => {
                    window.removeEventListener('mousemove', move);
                    window.removeEventListener('mouseup', up);
                  };
                  window.addEventListener('mousemove', move);
                  window.addEventListener('mouseup', up);
                }}
              />

              <div
                style={{ left: p2.x - 12, top: p2.y - 12 }}
                className="absolute w-6 h-6 rounded-full bg-red-500 border-2 border-white cursor-move shadow-md flex items-center justify-center text-[9px] text-white font-bold"
                onMouseDown={(e) => {
                  const move = (ev: MouseEvent) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) setP2({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
                  };
                  const up = () => {
                    window.removeEventListener('mousemove', move);
                    window.removeEventListener('mouseup', up);
                  };
                  window.addEventListener('mousemove', move);
                  window.addEventListener('mouseup', up);
                }}
              >
                V
              </div>

              <div
                style={{ left: p3.x - 10, top: p3.y - 10 }}
                className="absolute w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-900 cursor-move shadow-md"
                onMouseDown={(e) => {
                  const move = (ev: MouseEvent) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) setP3({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
                  };
                  const up = () => {
                    window.removeEventListener('mousemove', move);
                    window.removeEventListener('mouseup', up);
                  };
                  window.addEventListener('mousemove', move);
                  window.addEventListener('mouseup', up);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Clinical Rhinoplasty Assessment Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/70 space-y-1">
          <h4 className="font-bold text-emerald-900 text-sm">زاویه نازولبیال (Nasolabial Angle)</h4>
          <p className="text-slate-600">
            زاویه بین خط کلوملا و لب فوقانی. در خانم‌ها ۹۵ تا ۱۰۵ درجه و در آقایان ۹۰ تا ۹۵ درجه مطلوب است.
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>قبل: ۸۴° (افتاده)</span>
            <span>←</span>
            <span>بعد: ۱۰۲° (ایده‌آل)</span>
          </div>
        </div>

        <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/70 space-y-1">
          <h4 className="font-bold text-teal-900 text-sm">پروجکشن و چرخش نوک بینی (Tip Rotation)</h4>
          <p className="text-slate-600">
            نسبت Goode برای پروجکشن بینی ۰.۵۵ تا ۰.۶۰ طول بینی است که پایداری گرافت‌ها را نشان می‌دهد.
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold text-teal-800">
            <span>قوس پل: صاف و یکنواخت</span>
            <span>گرافت: Columellar Strut</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
          <h4 className="font-bold text-slate-800 text-sm">اطلاعات پرونده و جراح</h4>
          <p className="text-slate-600">
            بیمار: {currentPatient?.fullName} ({currentPatient?.fileNo})
          </p>
          <p className="text-slate-600">
            جراح: {currentPatient?.surgeonName} | کیفیت پوست: {currentPatient?.skinThickness === 'thin' ? 'نازک' : 'متوسط/گوشتی'}
          </p>
        </div>
      </div>
    </div>
  );
};
