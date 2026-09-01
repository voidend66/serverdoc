import { Patient, SonyFTPConfig, IngestedQueueItem } from '../types';

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_FTP_CONFIG: SonyFTPConfig = {
  localIp: '192.168.100.11',
  publicIp: '93.118.146.249',
  ftpPort: 2121,
  pasvPortRange: '50000 - 50100',
  authType: 'anonymous',
  username: 'anonymous',
  password: '',
  uploadFolder: '/media/mahdi/mm/doctor',
  storageDriveType: 'external_hdd',
  storageFolderName: 'doctor/photos',
  folderStructure: 'patient_file_no',
  storageTotalGb: 1000,
  storageFreeGb: 840,
  tlsEnabled: false, // بدون پروتکل‌های امنیتی SSL/TLS (دوربین سونی پشتیبانی نمی‌کند)
  webDashboardPort: 8045, // پورت اختصاصی داشبورد وب سامانه
  autoAssignToActivePatient: true,
  activePatientId: null,
  cameraStatus: {
    connected: false,
    lastPing: 'در انتظار اتصال دوربین سونی',
    model: 'Sony Alpha (ILCE / FX)',
    batteryPercent: 100,
    transferCountToday: 0
  }
};

export const SAMPLE_INCOMING_QUEUE: IngestedQueueItem[] = [];
