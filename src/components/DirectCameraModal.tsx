import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Eye } from 'lucide-react';
import { PhotoAngle, PhotoStage, ANGLE_LABELS, STAGE_LABELS } from '../types';
import { getClinicalPhotoSvg } from '../utils/rhinoImageGenerator';

interface DirectCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  angle: PhotoAngle;
  stage: PhotoStage;
  onCapturePhoto: (dataUrl: string) => void;
}

export const DirectCameraModal: React.FC<DirectCameraModalProps> = ({
  isOpen,
  onClose,
  angle,
  stage,
  onCapturePhoto
}) => {
  const [useWebcam, setUseWebcam] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && useWebcam) {
      navigator.mediaDevices?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Webcam access error, fallback to clinical SVG generator:', err);
          setUseWebcam(false);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, useWebcam]);

  if (!isOpen) return null;

  const handleTakeSnapshot = () => {
    if (useWebcam && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPreview(dataUrl);
      }
    } else {
      // Generate clinical portrait for requested angle and stage
      const sample = getClinicalPhotoSvg(angle, stage, 'female', '#F4D0B5');
      setCapturedPreview(sample);
    }
  };

  const handleConfirm = () => {
    if (capturedPreview) {
      onCapturePhoto(capturedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">
              ثبت عکس مستقیم: {ANGLE_LABELS[angle]?.fa} ({STAGE_LABELS[stage]?.fa})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
            {capturedPreview ? (
              <img src={capturedPreview} alt="Captured" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : useWebcam ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4 text-slate-400 text-xs space-y-2">
                <Camera className="w-10 h-10 text-emerald-500 mx-auto opacity-75" />
                <p className="text-slate-200 font-medium">آماده دریافت فریم زنده یا شات استودیویی</p>
                <p className="text-[11px] text-slate-500">زاویه انتخاب‌شده: {ANGLE_LABELS[angle]?.fa}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => setUseWebcam(!useWebcam)}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              {useWebcam ? 'تغییر به عکاسی شبیه‌ساز استودیو' : 'استفاده از وبکم متصل به سیستم'}
            </button>

            <div className="flex items-center gap-2">
              {capturedPreview ? (
                <>
                  <button
                    onClick={() => setCapturedPreview(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    شات مجدد
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تأیید و ذخیره در پرونده</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleTakeSnapshot}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>ثبت شات</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
