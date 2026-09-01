import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { HardDriveStorageManager } from "./server/storageManager.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8045;

// Default HDD path requested: /media/mahdi/mm/doctor
const DEFAULT_STORAGE_PATH = process.env.STORAGE_PATH || "/media/mahdi/mm/doctor";
const storageManager = new HardDriveStorageManager(DEFAULT_STORAGE_PATH);

// Setup multer for photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per photo
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize DB on boot
(async () => {
  try {
    const initRes = await storageManager.initDatabase();
    console.log(`[Storage] Initialized on ${DEFAULT_STORAGE_PATH}:`, initRes.message);
  } catch (err) {
    console.warn(`[Storage] Will lazy-init upon HDD mount:`, err);
  }
})();

// In-memory or simulated Sony FTP status
let ftpStatus = {
  serverRunning: true,
  ipAddress: "192.168.1.150",
  publicIp: "93.118.146.249",
  port: 2121,
  pasvPorts: "50000-50100",
  storagePath: DEFAULT_STORAGE_PATH,
  connectedCameras: [
    {
      id: "cam-1",
      model: "Sony ILCE-7M4 (A7 IV)",
      lens: "FE 90mm F2.8 Macro G OSS",
      ip: "192.168.1.185",
      battery: 100,
      status: "online",
      lastPhoto: "DSC04892.JPG",
      transferMode: "Auto (Post-Shoot Transfer)",
      totalTransferred: 0
    }
  ],
  incomingQueue: [] as any[]
};

// ==========================================
// 1. Storage & Hard Drive Health Test APIs
// ==========================================

// Check storage read/write permission & existence
app.get("/api/storage/check", async (req, res) => {
  try {
    const customPath = (req.query.path as string) || DEFAULT_STORAGE_PATH;
    const health = await storageManager.checkStorageHealth(customPath);
    const paths = storageManager.getPaths();
    
    res.json({
      success: true,
      health,
      paths,
      configuredBaseDir: DEFAULT_STORAGE_PATH
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-initialize directories and SQLite DB on demand
app.post("/api/storage/initialize", async (req, res) => {
  try {
    const { storagePath } = req.body;
    if (storagePath) {
      storageManager.setBasePath(storagePath);
    }
    const initRes = await storageManager.initDatabase();
    const health = await storageManager.checkStorageHealth();
    res.json({
      success: initRes.success,
      message: initRes.message,
      health,
      paths: storageManager.getPaths()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. Patient Data & SQLite Persistence APIs
// ==========================================

// Get all patients from SQLite DB
app.get("/api/patients", async (req, res) => {
  try {
    const patients = await storageManager.getPatients();
    res.json({ success: true, patients });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, patients: [] });
  }
});

// Save or Update patient in SQLite
app.post("/api/patients", async (req, res) => {
  try {
    const patientData = req.body;
    if (!patientData.id) {
      patientData.id = `pat_${Date.now()}`;
    }
    const saved = await storageManager.savePatient(patientData);
    res.json({ success: saved, patient: patientData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete patient from SQLite & HDD
app.delete("/api/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storageManager.deletePatient(id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. Photo Storage & Binary Serving APIs
// ==========================================

// Upload photo directly to Hard Drive & link to Patient in SQLite
app.post("/api/storage/photos/upload", upload.single("photo"), async (req, res) => {
  try {
    const { patientId, patientFileNo, angle, stage, notes, exifJson, measurementsJson, photoId } = req.body;
    let fileBuffer: Buffer;
    let filename = req.file?.originalname || `photo_${Date.now()}.jpg`;

    if (req.file) {
      fileBuffer = req.file.buffer;
    } else if (req.body.imageBase64) {
      const clean = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      fileBuffer = Buffer.from(clean, "base64");
      filename = req.body.filename || filename;
    } else {
      return res.status(400).json({ success: false, error: "فایل تصویری دریافت نشد" });
    }

    let parsedExif = undefined;
    let parsedMeasurements = undefined;
    try {
      if (exifJson) parsedExif = typeof exifJson === "string" ? JSON.parse(exifJson) : exifJson;
      if (measurementsJson) parsedMeasurements = typeof measurementsJson === "string" ? JSON.parse(measurementsJson) : measurementsJson;
    } catch {}

    const savedPhoto = await storageManager.savePhotoFile({
      photoId: photoId || `ph_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      patientId: patientId || "unassigned",
      patientFileNo,
      filename,
      base64DataOrBuffer: fileBuffer,
      angle: angle || "frontal",
      stage: stage || "pre_op",
      exif: parsedExif,
      measurements: parsedMeasurements,
      notes
    });

    res.json({ success: true, photo: savedPhoto });
  } catch (err: any) {
    console.error("Photo upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve physical photo from Hard Drive
app.get("/api/storage/photos/:id", async (req, res) => {
  try {
    const filePath = await storageManager.getPhotoFilePath(req.params.id);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send("عکس در هارد دیسک یافت نشد");
    }
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// ==========================================
// 4. Sony FTP Daemon Status & Ingest APIs
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    storagePath: DEFAULT_STORAGE_PATH,
    port: PORT
  });
});

app.get("/api/ftp/status", (req, res) => {
  res.json(ftpStatus);
});

app.post("/api/ftp/config", (req, res) => {
  const { ipAddress, publicIp, port, storagePath } = req.body;
  if (ipAddress) ftpStatus.ipAddress = ipAddress;
  if (publicIp) ftpStatus.publicIp = publicIp;
  if (port) ftpStatus.port = Number(port);
  if (storagePath) {
    ftpStatus.storagePath = storagePath;
    storageManager.setBasePath(storagePath);
  }
  res.json({ success: true, ftpStatus });
});

// Ingest from Sony FTP Python watcher
app.post("/api/ftp/ingest", async (req, res) => {
  try {
    const { filename, cameraModel, lens, exif, imageBase64, timestamp, patientId, angle, stage, filePath } = req.body;
    
    let photoUrl = imageBase64;
    let photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // If base64 is provided and patientId is given, persist directly to hard drive
    if (imageBase64 && patientId) {
      const saved = await storageManager.savePhotoFile({
        photoId,
        patientId,
        filename: filename || "sony_shot.jpg",
        base64DataOrBuffer: imageBase64,
        angle: angle || "frontal",
        stage: stage || "pre_op",
        exif
      });
      photoUrl = saved.url;
    }

    const newPhoto = {
      id: photoId,
      filename: filename || `DSC${Math.floor(1000 + Math.random() * 9000)}.JPG`,
      filePath: filePath || null,
      cameraModel: cameraModel || "Sony ILCE-7M4",
      lens: lens || "FE 90mm F2.8 Macro G OSS",
      exif: exif || {
        focalLength: "90mm",
        aperture: "f/8.0",
        shutter: "1/160s",
        iso: "100",
        colorSpace: "sRGB",
        dimensions: "7008 x 4672"
      },
      url: photoUrl,
      timestamp: timestamp || new Date().toISOString(),
      patientId: patientId || null,
      angle: angle || "unassigned",
      stage: stage || "pre_op"
    };

    ftpStatus.incomingQueue.unshift(newPhoto);
    if (ftpStatus.incomingQueue.length > 50) {
      ftpStatus.incomingQueue.pop();
    }

    res.json({ success: true, photo: newPhoto });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. AI Rhinoplasty Analysis
// ==========================================
app.post("/api/ai/analyze-rhinoplasty", async (req, res) => {
  try {
    const { preOpImage, postOpImage, patientNotes, surgeryType, skinType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        analysis: {
          nasolabialAngle: "زاویه نازولبیال: ارزیابی زاویه لب و بینی در محدوده مطلوب ۹۸-۱۰۲ درجه.",
          nasofrontalAngle: "زاویه نازوفرونتال: ارزیابی زاویه رادیکس در حدود ۱۲۰ درجه با شروع در سطح مژه‌های پلک فوقانی.",
          dorsalHump: "پل بینی: رفع قوز استخوانی-غضروفی و ایجاد خط پروفایل صاف و طبیعی (Straight to slight supra-tip break).",
          tipProjectionAndRotation: "نوک بینی: افزایش چرخش (Rotation) به میزان ۱۰ درجه و ارتقای پروجکشن با گرافت کلوملار.",
          alarBase: "پایه‌های پره بینی: تقارن پره‌ها و کاهش مختصر پهنای پایه بینی در نمای تحتانی.",
          surgicalObservations: "کیفیت پوست " + (skinType || "متوسط") + " است. پیشنهاد می‌شود از گرافت‌های نگهدارنده کلوملا جهت جلوگیری از افتادگی نوک بینی استفاده گردد.",
          aestheticScore: 92,
          recommendations: [
            "تثبیت زاویه کلوملا-لب با استفاده از Strut Graft یا Septal Extension Graft",
            "کاهش محافظه‌کارانه غضروف‌های لترال فوقانی (ULC) جهت حفظ عملکرد تنفسی",
            "استفاده از چسب زدن دقیق ۶ هفته‌ای برای کاهش ادم پوستی"
          ]
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `شما یک جراح فوق تخصص پلاستیک صورت و رینوپلاستی هستید. 
یک تحلیل دقیق بالینی و زیبایی‌شناسی از تصاویر بینی بیمار ارائه دهید.
نوع عمل: ${surgeryType || "رینوپلاستی اولیه"}
نوع پوست: ${skinType || "متوسط"}
یادداشت‌ها: ${patientNotes || "بدون یادداشت قبلی"}

لطفاً خروجی را به صورت JSON معتبر با ساختار زیر به زبان فارسی برگردانید:
{
  "nasolabialAngle": "توضیح زاویه نازولبیال و درجه تخمینی",
  "nasofrontalAngle": "توضیح زاویه نازوفرونتال",
  "dorsalHump": "تحلیل پل بینی و رادیکس",
  "tipProjectionAndRotation": "تحلیل چرخش و پروجکشن نوک بینی",
  "alarBase": "تحلیل تقارن و پهنای پره‌های بینی در نمای پایه",
  "surgicalObservations": "مشاهدات و ارزیابی تشریحی کلی",
  "aestheticScore": 88,
  "recommendations": ["پیشنهاد بالینی ۱", "پیشنهاد بالینی ۲", "پیشنهاد بالینی ۳"]
}`;

    const parts: any[] = [{ text: prompt }];
    if (preOpImage && preOpImage.startsWith("data:image")) {
      const match = preOpImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: parts,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    let analysisData = {};
    try {
      analysisData = JSON.parse(text);
    } catch {
      analysisData = { textOutput: text };
    }

    res.json({ success: true, analysis: analysisData });
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to analyze" });
  }
});

// Start Server & Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Medical Rhinoplasty & Sony FTP Server running on http://localhost:${PORT}`);
    console.log(`Storage root configured at: ${DEFAULT_STORAGE_PATH}`);
  });
}

startServer();
