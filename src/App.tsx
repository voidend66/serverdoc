/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PatientList } from './components/PatientList';
import { PatientDetail } from './components/PatientDetail';
import { ComparisonSuite } from './components/ComparisonSuite';
import { SonyFTPInbox } from './components/SonyFTPInbox';
import { RaspberryPiSetup } from './components/RaspberryPiSetup';
import { PatientModal } from './components/PatientModal';
import { DirectCameraModal } from './components/DirectCameraModal';
import { 
  Patient, 
  SonyFTPConfig, 
  IngestedQueueItem, 
  PhotoAngle, 
  PhotoStage, 
  ClinicalPhoto 
} from './types';
import { 
  INITIAL_PATIENTS, 
  INITIAL_FTP_CONFIG, 
  SAMPLE_INCOMING_QUEUE 
} from './data/initialData';
import { getClinicalPhotoSvg } from './utils/rhinoImageGenerator';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('rhino_patients_v4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [ftpConfig, setFtpConfig] = useState<SonyFTPConfig>(() => {
    const saved = localStorage.getItem('rhino_ftp_config_v4');
    if (saved) {
      try {
        return { ...INITIAL_FTP_CONFIG, ...JSON.parse(saved) };
      } catch {
        return INITIAL_FTP_CONFIG;
      }
    }
    return INITIAL_FTP_CONFIG;
  });

  const [incomingQueue, setIncomingQueue] = useState<IngestedQueueItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<'patients' | 'patient_detail' | 'comparison' | 'ftp_inbox' | 'pi_setup'>('patients');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeShootingPatientId, setActiveShootingPatientId] = useState<string | null>(null);

  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraAngle, setCameraAngle] = useState<PhotoAngle>('frontal');
  const [cameraStage, setCameraStage] = useState<PhotoStage>('pre_op');

  // Persistence
  useEffect(() => {
    localStorage.setItem('rhino_patients_v4', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('rhino_ftp_config_v4', JSON.stringify(ftpConfig));
  }, [ftpConfig]);

  // Active patient for Sony shooting
  const activeShootingPatient = patients.find(p => p.id === activeShootingPatientId) || null;

  // Handlers
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('patient_detail');
  };

  const handleOpenComparison = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('comparison');
  };

  const handleSetActiveForShooting = (patient: Patient) => {
    setActiveShootingPatientId(patient.id);
    setFtpConfig(prev => ({
      ...prev,
      activePatientId: patient.id
    }));
  };

  const handleUpdatePatientPhotos = (patientId: string, updatedPhotos: ClinicalPhoto[]) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, photos: updatedPhotos, updatedAt: new Date().toLocaleDateString('fa-IR') };
      }
      return p;
    }));
    if (selectedPatient?.id === patientId) {
      setSelectedPatient(prev => prev ? { ...prev, photos: updatedPhotos } : null);
    }
  };

  const handleSavePatient = (patientData: Partial<Patient>) => {
    if (editingPatient) {
      // Edit existing
      setPatients(prev => prev.map(p => {
        if (p.id === editingPatient.id) {
          const updated = { ...p, ...patientData, updatedAt: new Date().toLocaleDateString('fa-IR') };
          if (selectedPatient?.id === p.id) setSelectedPatient(updated);
          return updated;
        }
        return p;
      }));
    } else {
      // Create new
      const newFileNo = `RH-1403-${Math.floor(100 + Math.random() * 900)}`;
      const newPatient: Patient = {
        id: `p-${Date.now()}`,
        fileNo: newFileNo,
        fullName: patientData.fullName || 'بیمار جدید',
        nationalId: patientData.nationalId || '0000000000',
        phone: patientData.phone || '09120000000',
        age: patientData.age || 25,
        gender: patientData.gender || 'female',
        surgeryDate: patientData.surgeryDate,
        surgeonName: patientData.surgeonName || 'دکتر علیرضا کاظمی',
        rhinoplastyType: patientData.rhinoplastyType || 'primary',
        skinThickness: patientData.skinThickness || 'medium',
        aestheticGoal: patientData.aestheticGoal || 'natural',
        nasalDefects: patientData.nasalDefects || ['قوز استخوانی', 'افتادگی نوک بینی'],
        airwayStatus: 'normal',
        status: patientData.status || 'pre_op_consult',
        photos: [],
        clinicalNotes: patientData.clinicalNotes || '',
        createdAt: new Date().toLocaleDateString('fa-IR'),
        updatedAt: new Date().toLocaleDateString('fa-IR')
      };

      setPatients(prev => [newPatient, ...prev]);
      setSelectedPatient(newPatient);
      setActiveShootingPatientId(newPatient.id);
    }
    setEditingPatient(null);
  };

  // Simulate Sony camera shutter shot or incoming FTP file
  const handleSimulateCameraShot = (angle: PhotoAngle = 'frontal') => {
    const isMale = activeShootingPatient?.gender === 'male';
    const photoUrl = getClinicalPhotoSvg(angle, 'pre_op', isMale ? 'male' : 'female');

    const newQueueItem: IngestedQueueItem = {
      id: `inbox-${Date.now()}`,
      filename: `DSC0${Math.floor(4000 + Math.random() * 5000)}.JPG`,
      url: photoUrl,
      cameraModel: 'Sony ILCE-7M4 (A7 IV)',
      lens: 'FE 90mm F2.8 Macro G OSS',
      exif: {
        cameraModel: 'Sony ILCE-7M4 (A7 IV)',
        lensModel: 'FE 90mm F2.8 Macro G OSS',
        focalLength: '90.0 mm',
        aperture: 'f/8.0',
        shutterSpeed: '1/160s',
        iso: 'ISO 100',
        colorSpace: 'sRGB (Studio)',
        resolution: '7008 × 4672 (33MP)',
        flashMode: 'Wireless Studio Flash',
        shootingDate: new Date().toISOString()
      },
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      detectedAngle: angle,
      assignedPatientId: activeShootingPatientId || undefined,
      status: activeShootingPatientId ? 'assigned' : 'pending'
    };

    setIncomingQueue(prev => [newQueueItem, ...prev]);

    // If there is an active patient, automatically assign into their photos matrix
    if (activeShootingPatientId) {
      const activeP = patients.find(p => p.id === activeShootingPatientId);
      if (activeP) {
        const newClinicalPhoto: ClinicalPhoto = {
          id: `photo-${Date.now()}`,
          patientId: activeShootingPatientId,
          url: photoUrl,
          filename: newQueueItem.filename,
          angle,
          stage: 'pre_op',
          timestamp: newQueueItem.timestamp,
          exif: newQueueItem.exif
        };

        const updatedPhotos = activeP.photos.filter(p => !(p.angle === angle && p.stage === 'pre_op'));
        updatedPhotos.push(newClinicalPhoto);
        handleUpdatePatientPhotos(activeShootingPatientId, updatedPhotos);
      }
    }
  };

  const handleUploadFileToQueue = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newQueueItem: IngestedQueueItem = {
        id: `inbox-${Date.now()}`,
        filename: file.name || `DSC0${Math.floor(1000 + Math.random() * 9000)}.JPG`,
        url: dataUrl,
        cameraModel: 'Sony ILCE-7M4 (Direct Upload)',
        lens: 'FE 90mm F2.8 Macro G OSS',
        exif: {
          cameraModel: 'Sony ILCE-7M4',
          lensModel: 'FE 90mm F2.8 Macro G OSS',
          focalLength: '90.0 mm',
          aperture: 'f/8.0',
          shutterSpeed: '1/160s',
          iso: 'ISO 100',
          shootingDate: new Date().toISOString()
        },
        timestamp: new Date().toLocaleTimeString('fa-IR'),
        status: 'pending'
      };
      setIncomingQueue(prev => [newQueueItem, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  const handleAssignPhotoFromQueue = (
    queueItemId: string,
    targetPatientId: string,
    angle: PhotoAngle,
    stage: PhotoStage
  ) => {
    const queueItem = incomingQueue.find(q => q.id === queueItemId);
    const targetPatient = patients.find(p => p.id === targetPatientId);
    if (!queueItem || !targetPatient) return;

    const newPhoto: ClinicalPhoto = {
      id: `photo-${Date.now()}`,
      patientId: targetPatientId,
      url: queueItem.url,
      filename: queueItem.filename,
      angle,
      stage,
      timestamp: queueItem.timestamp,
      exif: queueItem.exif
    };

    const updatedPhotos = targetPatient.photos.filter(p => !(p.angle === angle && p.stage === stage));
    updatedPhotos.push(newPhoto);
    handleUpdatePatientPhotos(targetPatientId, updatedPhotos);

    // Update status in queue
    setIncomingQueue(prev => prev.map(q => {
      if (q.id === queueItemId) {
        return { ...q, status: 'assigned', assignedPatientId: targetPatientId, detectedAngle: angle };
      }
      return q;
    }));
  };

  const pendingInboxCount = incomingQueue.filter(q => q.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Vazirmatn',sans-serif]">
      {/* Top Clinic Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePatient={activeShootingPatient}
        ftpConfig={ftpConfig}
        inboxCount={pendingInboxCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'patients' && (
          <PatientList
            patients={patients}
            onSelectPatient={handleSelectPatient}
            onOpenComparison={handleOpenComparison}
            onSetActiveForShooting={handleSetActiveForShooting}
            activeShootingPatientId={activeShootingPatientId}
            onNewPatient={() => {
              setEditingPatient(null);
              setIsPatientModalOpen(true);
            }}
          />
        )}

        {activeTab === 'patient_detail' && selectedPatient && (
          <PatientDetail
            patient={selectedPatient}
            onBack={() => setActiveTab('patients')}
            onOpenComparison={handleOpenComparison}
            onSetActiveForShooting={handleSetActiveForShooting}
            isActiveShooting={activeShootingPatientId === selectedPatient.id}
            onUpdatePatientPhotos={handleUpdatePatientPhotos}
            onEditPatient={(p) => {
              setEditingPatient(p);
              setIsPatientModalOpen(true);
            }}
            onOpenDirectCamera={(angle, stage) => {
              setCameraAngle(angle);
              setCameraStage(stage);
              setIsCameraModalOpen(true);
            }}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonSuite
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={(p) => setSelectedPatient(p)}
          />
        )}

        {activeTab === 'ftp_inbox' && (
          <SonyFTPInbox
            ftpConfig={ftpConfig}
            patients={patients}
            activePatient={activeShootingPatient}
            incomingQueue={incomingQueue}
            onAssignPhoto={handleAssignPhotoFromQueue}
            onSimulateCameraShot={handleSimulateCameraShot}
            onUploadFileToQueue={handleUploadFileToQueue}
          />
        )}

        {activeTab === 'pi_setup' && (
          <RaspberryPiSetup
            ftpConfig={ftpConfig}
            onUpdateConfig={(newConfig) => setFtpConfig(prev => ({ ...prev, ...newConfig }))}
          />
        )}
      </main>

      {/* High Density Telemetry Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-2.5 px-4 text-[11px] text-slate-400 shrink-0 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>FTP DAEMON & WEB: RUNNING</span>
            </div>
            <div className="h-3.5 w-px bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-slate-500">WEB PORT:</span>
              <span className="text-cyan-400 font-bold">8045 (داشبورد)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-slate-500">FTP PORT:</span>
              <span className="text-emerald-400 font-bold">{ftpConfig.ftpPort} / PASV {ftpConfig.pasvPortRange}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-slate-500">STORAGE:</span>
              <span className="text-amber-300 font-bold">{ftpConfig.uploadFolder} (هارد اکسترنال)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-slate-500">SECURITY:</span>
              <span className="text-slate-300">Plain FTP (بدون رمزنگاری / سازگار با سونی)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[10px]">
            <span>داشبورد وب: <strong className="text-cyan-400">http://{ftpConfig.publicIp}:8045</strong></span>
            <span className="hidden md:inline">•</span>
            <span className="text-slate-400 font-sans">سرور اختصاصی رزبری‌پای ۴ متصل به هارد اکسترنال</span>
          </div>
        </div>
      </footer>

      {/* Patient Create / Edit Modal */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleSavePatient}
        initialData={editingPatient}
      />

      {/* Direct Camera Snapshot Modal */}
      {selectedPatient && (
        <DirectCameraModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          angle={cameraAngle}
          stage={cameraStage}
          onCapturePhoto={(dataUrl) => {
            const newPhoto: ClinicalPhoto = {
              id: `photo-${Date.now()}`,
              patientId: selectedPatient.id,
              url: dataUrl,
              filename: `DIRECT_${cameraAngle.toUpperCase()}.JPG`,
              angle: cameraAngle,
              stage: cameraStage,
              timestamp: new Date().toLocaleTimeString('fa-IR'),
              exif: {
                cameraModel: 'Sony ILCE-7M4 / Studio Direct',
                lensModel: 'FE 90mm F2.8 Macro G OSS',
                focalLength: '90.0 mm',
                aperture: 'f/8.0',
                shutterSpeed: '1/160s',
                iso: 'ISO 100',
                shootingDate: new Date().toISOString()
              }
            };
            const updated = selectedPatient.photos.filter(p => !(p.angle === cameraAngle && p.stage === cameraStage));
            updated.push(newPhoto);
            handleUpdatePatientPhotos(selectedPatient.id, updated);
          }}
        />
      )}
    </div>
  );
}
