export type PhotoAngle =
  | 'frontal'
  | 'profile_left'
  | 'profile_right'
  | 'oblique_left'
  | 'oblique_right'
  | 'basal'
  | 'dorsal';

export type PhotoStage =
  | 'pre_op'
  | 'intra_op'
  | 'post_op_1m'
  | 'post_op_3m'
  | 'post_op_6m'
  | 'post_op_1y';

export type RhinoplastyType =
  | 'primary' // اولیه
  | 'revision' // ترمیمی
  | 'septorhinoplasty' // سپتورینوپلاستی
  | 'tip_plasty'; // تیپ‌پلاستی

export type SkinThickness =
  | 'thin' // پوست نازک
  | 'medium' // پوست متوسط
  | 'thick_sebaceous'; // پوست ضخیم و چرب (گوشتی)

export type AestheticGoal =
  | 'natural' // طبیعی
  | 'semi_fantasy' // نیمه فانتزی
  | 'fantasy'; // فانتزی / باربی

export interface SonyExifData {
  cameraModel: string; // e.g. "Sony ILCE-7M4" (A7 IV)
  lensModel: string; // e.g. "FE 90mm F2.8 Macro G OSS"
  focalLength: string; // "90mm"
  aperture: string; // "f/8.0"
  shutterSpeed: string; // "1/160s"
  iso: string; // "ISO 100"
  colorSpace?: string; // "sRGB"
  resolution?: string; // "7008 x 4672 (33MP)"
  flashMode?: string; // "Studio Flash / Triggered"
  shootingDate: string;
}

export interface NasalMeasurement {
  nasolabialAngle?: number; // deg (90-105)
  nasofrontalAngle?: number; // deg (115-130)
  tipProjectionRatio?: number; // Goode ratio 0.55-0.60
  alarWidthRatio?: number;
  rotationAngle?: number;
}

export interface ClinicalPhoto {
  id: string;
  url: string;
  filename: string;
  angle: PhotoAngle;
  stage: PhotoStage;
  timestamp: string;
  patientId: string;
  exif?: SonyExifData;
  notes?: string;
  measurements?: NasalMeasurement;
}

export interface Patient {
  id: string;
  fileNo: string; // شماره پرونده
  fullName: string;
  nationalId: string;
  phone: string;
  age: number;
  gender: 'female' | 'male';
  surgeryDate?: string;
  surgeonName: string;
  rhinoplastyType: RhinoplastyType;
  skinThickness: SkinThickness;
  aestheticGoal: AestheticGoal;
  nasalDefects: string[]; // e.g. "قوز استخوانی", "انحراف تیغه سپتوم", "افتادگی نوک بینی"
  airwayStatus?: 'normal' | 'deviated_left' | 'deviated_right' | 'severe_obstruction';
  status: 'pre_op_consult' | 'scheduled' | 'operated' | 'follow_up' | 'completed';
  photos: ClinicalPhoto[];
  clinicalNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SonyFTPConfig {
  localIp: string;
  publicIp: string;
  ftpPort: number;
  pasvPortRange: string;
  authType: 'anonymous' | 'authenticated';
  username: string;
  password?: string;
  uploadFolder: string;
  storageDriveType?: 'external_hdd' | 'internal_sd' | 'nas_share' | 'custom';
  storageFolderName?: string;
  folderStructure?: 'patient_file_no' | 'date_grouped' | 'flat';
  storageTotalGb?: number;
  storageFreeGb?: number;
  tlsEnabled: boolean; // false: Standard Plain FTP (Sony Camera does not support TLS/SSL certificates)
  webDashboardPort?: number; // 8045
  autoAssignToActivePatient: boolean;
  activePatientId?: string | null;
  cameraStatus: {
    connected: boolean;
    lastPing: string;
    model: string;
    batteryPercent: number;
    transferCountToday: number;
  };
}

export interface IngestedQueueItem {
  id: string;
  filename: string;
  url: string;
  cameraModel: string;
  lens: string;
  exif: SonyExifData;
  timestamp: string;
  detectedAngle?: PhotoAngle;
  assignedPatientId?: string;
  status: 'pending' | 'assigned' | 'ignored';
}

export const ANGLE_LABELS: Record<PhotoAngle, { fa: string; en: string; iconDesc: string }> = {
  frontal: { fa: 'تمام رخ (روبرو)', en: 'Frontal (AP)', iconDesc: 'دید مستقیم روبرو' },
  profile_left: { fa: 'نیم رخ چپ', en: 'Left Lateral Profile', iconDesc: 'زاویه ۹۰ درجه چپ' },
  profile_right: { fa: 'نیم رخ راست', en: 'Right Lateral Profile', iconDesc: 'زاویه ۹۰ درجه راست' },
  oblique_left: { fa: 'سه رخ چپ (۴۵°)', en: 'Left Oblique (45°)', iconDesc: 'زاویه ۴۵ درجه چپ' },
  oblique_right: { fa: 'سه رخ راست (۴۵°)', en: 'Right Oblique (45°)', iconDesc: 'زاویه ۴۵ درجه راست' },
  basal: { fa: 'نمای پایه‌ای (تحتانی / کرم‌دید)', en: 'Basal / Worm’s Eye', iconDesc: 'مشاهده سوراخ‌ها و کلوملا' },
  dorsal: { fa: 'نمای پشتی (از بالا / پرنده‌دید)', en: 'Dorsal / Bird’s Eye', iconDesc: 'مشاهده پل و انحراف بینی' },
};

export const STAGE_LABELS: Record<PhotoStage, { fa: string; en: string; color: string }> = {
  pre_op: { fa: 'قبل از عمل', en: 'Pre-Operative', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  intra_op: { fa: 'حین عمل (اتاق عمل)', en: 'Intra-Operative', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  post_op_1m: { fa: '۱ ماه بعد از عمل', en: '1 Month Post-Op', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  post_op_3m: { fa: '۳ ماه بعد از عمل', en: '3 Months Post-Op', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  post_op_6m: { fa: '۶ ماه بعد از عمل', en: '6 Months Post-Op', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  post_op_1y: { fa: '۱ سال بعد از عمل (نهایی)', en: '1 Year Post-Op', color: 'bg-purple-100 text-purple-800 border-purple-300' },
};
