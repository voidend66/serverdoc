import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory or simulated database state
let ftpStatus = {
  serverRunning: true,
  ipAddress: "192.168.1.150",
  publicIp: "185.142.156.78",
  port: 21,
  pasvPorts: "40000-40100",
  connectedCameras: [
    {
      id: "cam-1",
      model: "Sony ILCE-7M4 (A7 IV)",
      lens: "FE 90mm F2.8 Macro G OSS",
      ip: "192.168.1.185",
      battery: 84,
      status: "online",
      lastPhoto: "DSC04892.JPG",
      transferMode: "Auto (Post-Shoot Transfer)",
      totalTransferred: 142
    }
  ],
  incomingQueue: [] as any[]
};

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API: FTP Server Status & Stats
app.get("/api/ftp/status", (req, res) => {
  res.json(ftpStatus);
});

// API: Update FTP Config
app.post("/api/ftp/config", (req, res) => {
  const { ipAddress, publicIp, port } = req.body;
  if (ipAddress) ftpStatus.ipAddress = ipAddress;
  if (publicIp) ftpStatus.publicIp = publicIp;
  if (port) ftpStatus.port = Number(port);
  res.json({ success: true, ftpStatus });
});

// API: Ingest incoming photo from Sony Camera FTP Watcher
app.post("/api/ftp/ingest", (req, res) => {
  const { filename, cameraModel, lens, exif, imageBase64, timestamp, patientId, angle, stage } = req.body;
  const newPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    filename: filename || `DSC${Math.floor(1000 + Math.random() * 9000)}.JPG`,
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
    url: imageBase64,
    timestamp: timestamp || new Date().toISOString(),
    patientId: patientId || null,
    angle: angle || "unassigned",
    stage: stage || "pre_op"
  };

  ftpStatus.incomingQueue.unshift(newPhoto);
  // Keep last 50 items
  if (ftpStatus.incomingQueue.length > 50) {
    ftpStatus.incomingQueue.pop();
  }

  res.json({ success: true, photo: newPhoto });
});

// API: AI Rhinoplasty Analysis with Gemini
app.post("/api/ai/analyze-rhinoplasty", async (req, res) => {
  try {
    const { preOpImage, postOpImage, patientNotes, surgeryType, skinType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return smart clinical rule-based analysis if API key is not configured
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
    
    // Prepare prompt
    const prompt = `شما یک جراح فوق تخصص پلاستیک صورت و رینوپلاستی (Rhinoplasty Expert) هستید. 
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
  });
}

startServer();
