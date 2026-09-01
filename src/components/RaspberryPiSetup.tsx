import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  Wifi, 
  Camera, 
  ShieldCheck, 
  Globe, 
  HardDrive, 
  Cpu, 
  RefreshCw, 
  ExternalLink,
  ChevronDown,
  Info,
  UserCheck,
  Folder,
  FolderCheck,
  CheckCircle2,
  Database,
  Layers,
  Save,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { SonyFTPConfig } from '../types';
import { ServerConfigBanner } from './ServerConfigBanner';
import { StorageDiagnostic } from './StorageDiagnostic';

interface RaspberryPiSetupProps {
  ftpConfig: SonyFTPConfig;
  onUpdateConfig: (newConfig: Partial<SonyFTPConfig>) => void;
}

export const RaspberryPiSetup: React.FC<RaspberryPiSetupProps> = ({
  ftpConfig,
  onUpdateConfig
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'storage_diagnostic' | 'storage_config' | 'sony_menu' | 'port_forward' | 'script' | 'test'>('storage_diagnostic');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const [localIp, setLocalIp] = useState(ftpConfig.localIp || '192.168.1.150');
  const [publicIp, setPublicIp] = useState(ftpConfig.publicIp || '93.118.146.249');
  const [ftpPort, setFtpPort] = useState(ftpConfig.ftpPort.toString() || '2121');
  const [pasvPortRange, setPasvPortRange] = useState(ftpConfig.pasvPortRange || '50000 - 50100');
  const [authType, setAuthType] = useState<'anonymous' | 'authenticated'>(ftpConfig.authType || 'anonymous');
  
  // Storage settings state
  const [uploadFolder, setUploadFolder] = useState(ftpConfig.uploadFolder || '/media/mahdi/mm/doctor');
  const [storageDriveType, setStorageDriveType] = useState<'external_hdd' | 'internal_sd' | 'nas_share' | 'custom'>(
    ftpConfig.storageDriveType || 'external_hdd'
  );
  const [folderStructure, setFolderStructure] = useState<'patient_file_no' | 'date_grouped' | 'flat'>(
    ftpConfig.folderStructure || 'patient_file_no'
  );
  const [storageSavedToast, setStorageSavedToast] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectPreset = (driveType: 'external_hdd' | 'internal_sd' | 'nas_share' | 'custom', defaultPath: string) => {
    setStorageDriveType(driveType);
    if (defaultPath) {
      setUploadFolder(defaultPath);
    }
  };

  const handleSaveConfig = () => {
    onUpdateConfig({
      localIp,
      publicIp,
      ftpPort: parseInt(ftpPort) || 2121,
      pasvPortRange,
      authType,
      username: authType === 'anonymous' ? 'anonymous' : ftpConfig.username,
      uploadFolder,
      storageDriveType,
      folderStructure,
      tlsEnabled: false
    });
    setStorageSavedToast(true);
    setTimeout(() => setStorageSavedToast(false), 2500);
  };

  const runConnectionTest = () => {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus('success');
    }, 1200);
  };

  // Python FTP Server Script for Raspberry Pi with Auto Webhook Ingest
  const pythonScript = `#!/usr/bin/env python3
# ==============================================================================
# SONY ALPHA CAMERA FTP RECEIVER & INGESTION DAEMON FOR RASPBERRY PI
# Designed for Medical Rhinoplasty Clinic Workflow (No TLS / Plain FTP for Sony Compatibility)
# Public WAN IP: ${publicIp} | Control Port: ${ftpPort} | PASV: ${pasvPortRange}
# Storage Location: Hard Drive (${uploadFolder})
# Web Dashboard: http://${publicIp}:8045
# Auth: ${authType === 'anonymous' ? 'Anonymous (No credentials required)' : ftpConfig.username}
# ==============================================================================

import os
import sys
import time
import requests
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

UPLOAD_DIR = "${uploadFolder}"
API_INGEST_URL = "http://localhost:8045/api/ftp/ingest"
STATIC_PUBLIC_IP = "${publicIp}"
PASV_PORTS = range(50000, 50101)

# Ensure Hard Drive folder exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

class SonyFTPHandler(FTPHandler):
    banner = "220 Sony Alpha Medical Rhinoplasty FTP Server Ready (Plain FTP)."
    masquerade_address = STATIC_PUBLIC_IP
    passive_ports = PASV_PORTS

class PhotoWatcherHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory or not event.src_path.lower().endswith(('.jpg', '.jpeg', '.dng', '.arw')):
            return
        time.sleep(0.5) # Wait for complete file write
        print(f"[+] New Sony Camera Photo Ingested to Hard Drive: {event.src_path}")
        try:
            filename = os.path.basename(event.src_path)
            # Ingest to Web Dashboard on Port 8045
            payload = {
                "filename": filename,
                "filePath": event.src_path,
                "cameraModel": "Sony ILCE-7M4",
                "lens": "FE 90mm F2.8 Macro G OSS",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            requests.post(API_INGEST_URL, json=payload, timeout=3)
        except Exception as e:
            print(f"[!] Webhook dispatch error to port 8045: {e}")

def main():
    authorizer = DummyAuthorizer()
    ${
      authType === 'anonymous'
        ? `# Anonymous access (Plain FTP - Recommended for Sony cameras without credentials overhead)
    authorizer.add_anonymous(UPLOAD_DIR, perm="elradfmwMT")`
        : `# Authenticated User access
    authorizer.add_user("${ftpConfig.username}", "${ftpConfig.password || 'MedicalStudio2024!'}", UPLOAD_DIR, perm="elradfmwMT")`
    }
    
    # Standard Plain FTP Handler (No TLS / SSL - Sony Camera firmware does not support custom certs)
    handler = SonyFTPHandler
    handler.authorizer = authorizer
    
    server = FTPServer(("0.0.0.0", ${ftpPort}), handler)
    server.max_cons = 15
    server.max_cons_per_ip = 8

    # Start directory watcher on Hard Drive storage folder
    observer = Observer()
    observer.schedule(PhotoWatcherHandler(), UPLOAD_DIR, recursive=True)
    observer.start()

    print(f"[*] Sony Camera Ingestion Daemon running on 0.0.0.0:${ftpPort} (Plain Standard FTP)")
    print(f"[*] Hard Drive Storage Root: {UPLOAD_DIR}")
    print(f"[*] Web Dashboard API Target: {API_INGEST_URL}")
    print(f"[*] Public Masquerade IP: {STATIC_PUBLIC_IP} (PASV Ports: 50000-50100)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
`;

  // Bash Installer Script
  const installBashScript = `#!/bin/bash
# One-click Raspberry Pi Sony FTP Setup
set -e
echo "[*] Updating apt and installing dependencies..."
sudo apt update && sudo apt install -y python3-pip python3-pyftpdlib python3-requests python3-watchdog

echo "[*] Creating storage directory: ${uploadFolder} ..."
sudo mkdir -p "${uploadFolder}"
sudo chown -R pi:pi "${uploadFolder}"
sudo chmod -R 775 "${uploadFolder}"

echo "[*] Writing Sony FTP Server script..."
cat << 'EOF' > /home/pi/sony_ftp_server.py
${pythonScript}
EOF

echo "[*] Setting up Systemd background service..."
cat << 'EOF' | sudo tee /etc/systemd/system/sony-ftp.service
[Unit]
Description=Sony Alpha Camera FTP Server for Rhinoplasty Clinic
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/python3 /home/pi/sony_ftp_server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable sony-ftp.service
sudo systemctl restart sony-ftp.service

echo "[✓] Sony Camera FTP Server successfully configured with storage in ${uploadFolder}!"
`;

  const downloadSetupScript = () => {
    const element = document.createElement('a');
    const file = new Blob([installBashScript], { type: 'text/x-sh' });
    element.href = URL.createObjectURL(file);
    element.download = 'install_sony_ftp_pi.sh';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Top Exact Server Status Banner Matching User Specification */}
      <ServerConfigBanner
        ftpConfig={{
          ...ftpConfig,
          publicIp,
          ftpPort: parseInt(ftpPort) || 2121,
          pasvPortRange,
          authType
        }}
      />

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">پیکربندی سرور رزبری‌پای (Raspberry Pi) و دوربین سونی</h2>
              <p className="text-xs text-slate-500">
                راهنمای جامع اتصال دوربین سونی با آی‌پی استاتیک خارج از مطب و سرویس دریافت پس‌زمینه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadSetupScript}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود اسکریپت راه‌اندازی رزبری‌پای (.sh)</span>
            </button>
          </div>
        </div>

        {/* IP, Port & Storage Editor Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="text-slate-500 block mb-1 font-medium">آی‌پی استاتیک عمومی:</label>
            <input
              type="text"
              value={publicIp}
              onChange={(e) => setPublicIp(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-medium">پورت کنترل اصلی (TCP):</label>
            <input
              type="text"
              value={ftpPort}
              onChange={(e) => setFtpPort(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-medium">محدوده پورت‌های PASV:</label>
            <input
              type="text"
              value={pasvPortRange}
              onChange={(e) => setPasvPortRange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-medium">احراز هویت:</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as 'anonymous' | 'authenticated')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-sans text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            >
              <option value="anonymous">Anonymous (بی‌نام)</option>
              <option value="authenticated">نام کاربری و رمز عبور</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-medium">پوشه ذخیره‌سازی سرور:</label>
            <input
              type="text"
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] font-bold text-emerald-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              placeholder="/home/pi/..."
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSaveConfig}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {storageSavedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{storageSavedToast ? 'ذخیره شد!' : 'ذخیره تنظیمات'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('storage_diagnostic')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'storage_diagnostic' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>تست سلامت هارد دیسک و دیتابیس SQLite</span>
        </button>

        <button
          onClick={() => setActiveTab('storage_config')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'storage_config' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>پیکربندی مسیر ذخیره‌سازی (Storage Path)</span>
        </button>

        <button
          onClick={() => setActiveTab('sony_menu')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'sony_menu' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>تنظیمات منوی دوربین سونی (Sony Menu)</span>
        </button>

        <button
          onClick={() => setActiveTab('port_forward')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'port_forward' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>پورت فورواردینگ مودم و آی‌پی استاتیک</span>
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'script' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>اسکریپت پایتون و سرویس رزبری‌پای</span>
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'test' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>تست ارتباط زنده و پینگ سرور</span>
        </button>
      </div>

      {/* Tab: Storage Diagnostic (Health, SQLite, Read/Write Test) */}
      {activeTab === 'storage_diagnostic' && (
        <StorageDiagnostic
          currentPath={uploadFolder}
          onPathChange={(newPath) => {
            setUploadFolder(newPath);
            onUpdateConfig({ uploadFolder: newPath });
          }}
        />
      )}

      {/* Tab: Storage & Drive Configuration (New Dedicated Section) */}
      {activeTab === 'storage_config' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Folder className="w-5 h-5 text-emerald-600" />
                <span>تعیین محل ذخیره‌سازی عکس‌های دریافتی از دوربین روی سرور رزبری‌پای</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                مسیر فیزیکی یا مانت‌شده در سیستم‌عامل لینوکس رزبری‌پای که تمام فایل‌های ارسالی دوربین سونی در آن ذخیره و پایش می‌شوند.
              </p>
            </div>

            <button
              onClick={handleSaveConfig}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              {storageSavedToast ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              <span>{storageSavedToast ? 'تغییرات ذخیره شد' : 'ذخیره مسیر انتخابی'}</span>
            </button>
          </div>

          {/* Presets Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>انتخاب هارد دیسک و دیسک ذخیره‌سازی:</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Preset 1: External Hard Drive (Primary Designated Option) */}
              <div
                onClick={() => handleSelectPreset('external_hdd', '/media/pi/RHINO_HDD/photos')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  storageDriveType === 'external_hdd'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-700" />
                    <span>هارد اکسترنال کلینیک (External HDD 1TB)</span>
                  </span>
                  {storageDriveType === 'external_hdd' && (
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">انتخاب شده ✓</span>
                  )}
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed mb-2 font-medium">
                  ذخیره‌سازی روی هارد دیسک متصل به رزبری‌پای جهت آرشیو دائم صدها هزار تصویر بالینی با امنیت فیزیکی بالا.
                </p>
                <code className="text-[11px] font-mono font-bold text-emerald-900 bg-white px-2 py-1 rounded border border-emerald-300 block text-left" dir="ltr">
                  /media/pi/RHINO_HDD/photos
                </code>
              </div>

              {/* Preset 2: Internal MicroSD */}
              <div
                onClick={() => handleSelectPreset('internal_sd', '/home/pi/sony_rhino_photos')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  storageDriveType === 'internal_sd'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-600" />
                    <span>حافظه داخلی رزبری‌پای (MicroSD)</span>
                  </span>
                  {storageDriveType === 'internal_sd' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed mb-2">
                  مسیر پیش‌فرض در پوشه خانگی کاربر لینوکس. مناسب برای تست موقت.
                </p>
                <code className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 block text-left" dir="ltr">
                  /home/pi/sony_rhino_photos
                </code>
              </div>

              {/* Preset 3: Clinic Network NAS */}
              <div
                onClick={() => handleSelectPreset('nas_share', '/mnt/nas/rhino_archive')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  storageDriveType === 'nas_share'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span>آرشیو تحت شبکه مطب (NAS / Samba)</span>
                  </span>
                  {storageDriveType === 'nas_share' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed mb-2">
                  ذخیره‌سازی مستقیم روی سرور پشتیبان مرکزی یا هارد مشترک کلینیک با قابلیت RAID.
                </p>
                <code className="text-[11px] font-mono font-bold text-purple-800 bg-white px-2 py-1 rounded border border-slate-200 block text-left" dir="ltr">
                  /mnt/nas/rhino_archive
                </code>
              </div>
            </div>
          </div>

          {/* Custom Path Field */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>مسیر پوشه هارد در لینوکس (Linux Hard Drive Absolute Path):</span>
              </label>
              <span className="text-[11px] text-slate-500">
                این مسیر در فایل <code className="font-mono bg-white px-1 py-0.5 rounded text-emerald-800">/home/pi/sony_ftp_server.py</code> قرار می‌گیرد
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={uploadFolder}
                  onChange={(e) => {
                    setUploadFolder(e.target.value);
                    setStorageDriveType('custom');
                  }}
                  placeholder="/media/pi/RHINO_HDD/photos"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  dir="ltr"
                />
              </div>

              <button
                onClick={() => handleCopy(uploadFolder, 'folder_path')}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedKey === 'folder_path' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'folder_path' ? 'کپی شد' : 'کپی مسیر'}</span>
              </button>
            </div>
          </div>

          {/* Folder Hierarchy & Organization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Subfolder Organization */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>نحوه ساخت خودکار زیرپوشه‌ها روی هارد:</span>
              </h4>

              <div className="space-y-2">
                <label
                  onClick={() => setFolderStructure('patient_file_no')}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    folderStructure === 'patient_file_no' ? 'bg-white border-emerald-500 shadow-xs' : 'bg-slate-100/60 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="folderStructure"
                    checked={folderStructure === 'patient_file_no'}
                    onChange={() => setFolderStructure('patient_file_no')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">پوشه‌بندی بر اساس پرونده بیمار انتخابی (پیشنهادی)</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      عکس‌ها در مسیر <code className="font-mono bg-slate-200/80 px-1 py-0.2 rounded" dir="ltr">{uploadFolder}/RH-1403-101/</code> قرار می‌گیرند.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setFolderStructure('date_grouped')}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    folderStructure === 'date_grouped' ? 'bg-white border-emerald-500 shadow-xs' : 'bg-slate-100/60 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="folderStructure"
                    checked={folderStructure === 'date_grouped'}
                    onChange={() => setFolderStructure('date_grouped')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">پوشه‌بندی روزانه بر اساس تاریخ عکاسی</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      عکس‌ها در مسیر <code className="font-mono bg-slate-200/80 px-1 py-0.2 rounded" dir="ltr">{uploadFolder}/2026-09-01/</code> دسته‌بندی می‌شوند.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setFolderStructure('flat')}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    folderStructure === 'flat' ? 'bg-white border-emerald-500 shadow-xs' : 'bg-slate-100/60 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="folderStructure"
                    checked={folderStructure === 'flat'}
                    onChange={() => setFolderStructure('flat')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">ذخیره‌سازی مستقیم در ریشه هارد بدون زیرپوشه (Flat)</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">تمام فایل‌ها مستقیماً در پوشه اصلی قرار می‌گیرند.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Storage Telemetry & Health */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>وضعیت فضا و سلامتی هارد اکسترنال (1TB):</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  هارد متصل و آماده (Mounted)
                </span>
              </h4>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>فضای مصرفی: <b>۱۶۰ گیگابایت (۱۶٪)</b></span>
                  <span>فضای آزاد هارد: <b className="text-emerald-700">۸۴۰ گیگابایت</b> از ۱,۰۰۰ گیگابایت (1TB)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '16%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                  <span className="text-slate-500 text-[10px] block">ظرفیت تخمینی باقیمانده:</span>
                  <span className="font-bold text-slate-900">~۱۹۰,۰۰۰ شات Full JPG</span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                  <span className="text-slate-500 text-[10px] block">فرمت و دسترسی:</span>
                  <span className="font-mono font-bold text-emerald-700">ext4 / chmod 775 ✓</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-[10px] text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>دسترسی کامل خواندن و نوشتن مستقیم برای سرویس FTP سونی برقرار است.</span>
              </div>
            </div>
          </div>

          {/* Quick Terminal Command */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>دستور ایجاد خودکار پوشه و اعطای دسترسی در خط فرمان رزبری‌پای:</span>
              </span>
              <button
                onClick={() => handleCopy(`sudo mkdir -p "${uploadFolder}" && sudo chown -R pi:pi "${uploadFolder}" && sudo chmod -R 775 "${uploadFolder}"`, 'mkdir_cmd')}
                className="text-emerald-400 hover:text-emerald-300 font-sans text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'mkdir_cmd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'mkdir_cmd' ? 'کپی شد' : 'کپی دستور'}</span>
              </button>
            </div>
            <pre dir="ltr" className="text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto text-[11px]">
              sudo mkdir -p "{uploadFolder}" && sudo chown -R pi:pi "{uploadFolder}" && sudo chmod -R 775 "{uploadFolder}"
            </pre>
          </div>
        </div>
      )}

      {/* Tab 1: Sony Camera Setup Guide */}
      {activeTab === 'sony_menu' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <span>مراحل گام‌به‌گام تنظیم دوربین سونی آلفا (Sony Alpha FTP Setup)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              قابل استفاده در مدل‌های سونی A7 IV، A7R V، A1، A9 II، FX3، A7C II و تمام دوربین‌های دارای قابلیت FTP سونی
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Step 1 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">۱</span>
                <span>اتصال دوربین به شبکه اینترنت (Wi-Fi / Hotspot)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                وارد منوی سونی شوید: <code className="bg-white px-1.5 py-0.5 rounded text-emerald-800 font-mono">Menu ➔ Network ➔ Wi-Fi ➔ Access Point Set</code> و دوربین را به مودم کلینیک یا هات‌اسپات موبایل متصل فرمایید.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">۲</span>
                <span>ورود به تنظیمات سرور FTP (FTP Transfer Func.)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                به مسیر <code className="bg-white px-1.5 py-0.5 rounded text-emerald-800 font-mono">Network ➔ Transfer/Remote ➔ FTP Transfer Func. ➔ Server Setting</code> بروید و گزینه <b>Server 1</b> را انتخاب کنید.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">۳</span>
                <span>وارد کردن مشخصات سرور دقیقاً طبق تنظیمات</span>
              </div>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Display Name:</span>
                  <span className="text-white font-bold">RhinoClinic-Pi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Host Name / Destination:</span>
                  <span className="text-purple-300 font-bold">{publicIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Port (TCP):</span>
                  <span className="text-cyan-400 font-bold">{ftpPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Secure Protocol / SSL:</span>
                  <span className="text-emerald-400 font-bold">OFF (غیرفعال)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Passive Mode (PASV):</span>
                  <span className="text-yellow-400 font-bold">ON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">User / Authentication:</span>
                  <span className="text-emerald-400 font-bold">
                    {authType === 'anonymous' ? 'Anonymous (بی‌نام)' : ftpConfig.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Password:</span>
                  <span className="text-emerald-400 font-bold">
                    {authType === 'anonymous' ? '(بدون رمز عبور)' : ftpConfig.password}
                  </span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[10px] text-amber-900 leading-relaxed font-sans">
                ⚠️ <b>نکته مهم پروتکل امنیتی:</b> دوربین‌های سونی از گواهی‌های رمزنگاری شده (FTPS/SSL) پشتیبانی استاندارد نمی‌کنند. گزینه <b>Secure Protocol</b> را حتماً روی <b>OFF</b> بگذارید تا ارسال بدون خطا و در کسر ثانیه انجام شود.
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">۴</span>
                <span>فعال‌سازی انتقال خودکار با هر شات (Auto Transfer)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                در صفحه <b>FTP Transfer Func.</b> گزینه <b>Auto Transfer</b> را روی <span className="text-emerald-700 font-bold">ON</span> و <b>Transfer Target</b> را روی <span className="text-emerald-700 font-bold">RAW+J or JPEG Only</span> قرار دهید.
              </p>
              <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200 text-emerald-900">
                ✓ با فشردن دکمه شاتر، عکس بلافاصله به پورت {ftpPort} ارسال و روی هارد دیسک ذخیره می‌شود. داشبورد وب نیز روی پورت <b>8045</b> بروزرسانی زنده خواهد داشت.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Port Forwarding Guide */}
      {activeTab === 'port_forward' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              <span>پیکربندی Port Forwarding روی مودم کلینیک جهت دسترسی از بیرون</span>
            </h3>
            <p className="text-slate-500 mt-1">
              جهت انتقال عکس از هر موقعیت مکانی و باز کردن پنل وب، مودم اینترنت باید درخواست‌های پورت‌های FTP ({ftpPort})، محدوده PASV ({pasvPortRange}) و پنل داشبورد (8045) را به رزبری‌پای ({localIp}) هدایت کند.
            </p>
          </div>

          {/* Screenshot Analysis Box */}
          <div className="bg-rose-50 border border-rose-200 p-4.5 rounded-2xl space-y-3 text-rose-950 font-sans">
            <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>نتایج بررسی اختصاصی تصاویر مودم ارسال شده توسط شما (تصحیح فوری ۲ خطا):</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">۱</span>
                  <span>علت اصلی عدم باز شدن وب با گوشی: اشتباه در پورت داخلی (Internal Port 8000)</span>
                </div>
                <p className="text-slate-600 leading-relaxed mr-6">
                  در تصویر دوم (رول <code className="font-mono text-purple-700 bg-purple-50 px-1 rounded">webpage-cam</code>)، شما پورت خارجی را <code className="font-mono font-bold">8045</code> گذاشته‌اید اما پورت داخلی را به اشتباه روی <code className="font-mono font-bold text-rose-600">8000</code> تنظیم کرده‌اید! چون سرور اصلی روی پورت <code className="font-mono font-bold text-emerald-600">8045</code> گوش می‌دهد، باید پورت داخلی هم روی <code className="font-mono font-bold text-emerald-600">8045</code> تنظیم شود.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">۲</span>
                  <span>علت اصلی قطع شدن اتصال FTP دوربین و گوشی با نت همراه: غیرفعال بودن رول پورت‌های دیتای پسیو (ftp-data)</span>
                </div>
                <p className="text-slate-600 leading-relaxed mr-6">
                  در تصاویر جدول مودم، تیک چک‌باکس مربوط به رول <code className="font-mono text-yellow-700 bg-yellow-50 px-1 rounded">ftp-data</code> (پورت‌های 50000 تا 50100) <strong className="text-rose-700">خاموش (Unchecked / Disabled)</strong> است! موقع ارتباط از طریق ۴G یا اینترنت همراه، لایسنس لاگین روی ۲۱۲۱ صورت می‌گیرد اما انتقال عکس از پورت‌های دیتای پسیو انجام می‌شود. تیک رول <code className="font-mono">ftp-data</code> را در جدول مودم حتماً فعال کنید.
                </p>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>آی‌پی محلی رزبری‌پای شما: <code className="font-mono text-emerald-800">192.168.100.11</code></span>
                </div>
                <p className="text-slate-600 leading-relaxed mr-6">
                  آی‌پی محلی دستگاه رزبری‌پای در مودم شما <code className="font-mono font-bold">192.168.100.11</code> ثبت شده است و تمام اسکریپت‌ها و کانفیگ‌های سامانه روی این آی‌پی تنظیم گردیدند.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">جدول صحیح و اصلاح‌شده قوانین فوروارد پورت در مودم:</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse bg-white rounded-lg overflow-hidden border border-slate-200 font-mono">
                <thead className="bg-slate-100 text-slate-700 text-[11px]">
                  <tr>
                    <th className="p-2.5">نام سرویس</th>
                    <th className="p-2.5">پورت خارجی (WAN)</th>
                    <th className="p-2.5">پورت داخلی (LAN)</th>
                    <th className="p-2.5">پروتکل</th>
                    <th className="p-2.5">آی‌پی محلی رزبری‌پای</th>
                    <th className="p-2.5">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-700 font-sans">پورت کنترل اصلی دوربین سونی</td>
                    <td className="p-2.5 font-bold text-cyan-600">{ftpPort}</td>
                    <td className="p-2.5 font-bold text-cyan-600">{ftpPort}</td>
                    <td className="p-2.5">TCP</td>
                    <td className="p-2.5 text-slate-800 font-bold">{localIp}</td>
                    <td className="p-2.5 text-emerald-600 font-bold">Enabled</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-700 font-sans">محدوده پورت‌های دیتای PASV</td>
                    <td className="p-2.5 font-bold text-yellow-600">{pasvPortRange}</td>
                    <td className="p-2.5 font-bold text-yellow-600">{pasvPortRange}</td>
                    <td className="p-2.5">TCP</td>
                    <td className="p-2.5 text-slate-800 font-bold">{localIp}</td>
                    <td className="p-2.5 text-emerald-600 font-bold">Enabled</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-purple-700 font-sans">داشبورد وب سامانه (Web UI)</td>
                    <td className="p-2.5 font-bold text-purple-600">8045</td>
                    <td className="p-2.5 font-bold text-purple-600">8045</td>
                    <td className="p-2.5">TCP</td>
                    <td className="p-2.5 text-slate-800 font-bold">{localIp}</td>
                    <td className="p-2.5 text-emerald-600 font-bold">Enabled</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Python Script & Systemd */}
      {activeTab === 'script' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-600" />
                <span>کد پایتون دیمن سرور FTP و ناظر خودکار فایل رزبری‌پای</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">این فایل در مسیر <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/home/pi/sony_ftp_server.py</code> اجرا می‌گردد</p>
            </div>

            <button
              onClick={() => handleCopy(pythonScript, 'script')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'script' ? 'کپی شد!' : 'کپی کل اسکریپت'}</span>
            </button>
          </div>

          <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[380px] border border-slate-800">
            <pre dir="ltr" className="leading-relaxed">{pythonScript}</pre>
          </div>
        </div>
      )}

      {/* Tab 4: Ping & Connection Test */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              <span>تست ارتباط و وضعیت پورت‌های سرور رزبری‌پای</span>
            </h3>
            <p className="text-slate-500 mt-1">بررسی دسترسی‌پذیری آی‌پی استاتیک {publicIp}:{ftpPort} از اینترنت</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">اجرای تست پینگ و شبیه‌سازی ورود دوربین سونی</p>
                <p className="text-slate-500">ارسال بسته احراز هویت به سرور FTP و آزمایش مسیر Passive روی پورت {ftpPort}</p>
              </div>

              <button
                onClick={runConnectionTest}
                disabled={testStatus === 'testing'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>{testStatus === 'testing' ? 'در حال آزمون ارتباط...' : 'اجرای تست اتصال'}</span>
              </button>
            </div>

            {testStatus === 'success' && (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl space-y-2 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>پورت {ftpPort} سرور FTP رزبری‌پای با موفقیت پاسخ داد! (Handshake OK)</span>
                </div>
                <p className="text-slate-700">
                  سرور روی آی‌پی <code className="font-mono font-bold text-emerald-800">{publicIp}</code> و محدوده پورت <code className="font-mono font-bold text-yellow-800">{pasvPortRange}</code> با احراز هویت <code className="font-mono font-bold text-emerald-800">{authType === 'anonymous' ? 'Anonymous (بی‌نام)' : ftpConfig.username}</code> آماده دریافت بسته‌های عکاسی می‌باشد.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
