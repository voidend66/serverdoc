import fs from "fs";
import path from "path";
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";

export interface StorageCheckResult {
  path: string;
  exists: boolean;
  canRead: boolean;
  canWrite: boolean;
  freeSpaceBytes?: number;
  totalSpaceBytes?: number;
  error?: string;
}

export class HardDriveStorageManager {
  private baseDir: string;
  private dbDir: string;
  private photosDir: string;
  private dbPath: string;
  private db: SqlJsDatabase | null = null;
  private initialized: boolean = false;

  constructor(customBasePath?: string) {
    this.baseDir = customBasePath || process.env.STORAGE_PATH || "/media/mahdi/mm/doctor";
    this.dbDir = path.join(this.baseDir, "database");
    this.photosDir = path.join(this.baseDir, "photos");
    this.dbPath = path.join(this.dbDir, "rhino_medical.sqlite");
  }

  public getPaths() {
    return {
      baseDir: this.baseDir,
      dbDir: this.dbDir,
      photosDir: this.photosDir,
      dbPath: this.dbPath
    };
  }

  public setBasePath(newBasePath: string) {
    this.baseDir = newBasePath;
    this.dbDir = path.join(this.baseDir, "database");
    this.photosDir = path.join(this.baseDir, "photos");
    this.dbPath = path.join(this.dbDir, "rhino_medical.sqlite");
    this.initialized = false;
    this.db = null;
  }

  /**
   * Check read & write permissions on storage directory
   */
  public async checkStorageHealth(targetPath?: string): Promise<StorageCheckResult> {
    const dir = targetPath || this.baseDir;
    const result: StorageCheckResult = {
      path: dir,
      exists: false,
      canRead: false,
      canWrite: false
    };

    try {
      if (!fs.existsSync(dir)) {
        // Try creating it if allowed
        try {
          fs.mkdirSync(dir, { recursive: true });
          result.exists = true;
        } catch (mkdirErr: any) {
          result.exists = false;
          result.error = `پوشه هارد اکسترنال وجود ندارد یا مانت نشده است: ${mkdirErr.message}`;
          return result;
        }
      } else {
        result.exists = true;
      }

      // Check Read Permission
      try {
        fs.accessSync(dir, fs.constants.R_OK);
        fs.readdirSync(dir);
        result.canRead = true;
      } catch (readErr: any) {
        result.canRead = false;
        result.error = `عدم دسترسی خواندن از هارد: ${readErr.message}`;
      }

      // Check Write Permission by creating and deleting a temporary test file
      const testFilePath = path.join(dir, `.test_write_${Date.now()}.tmp`);
      try {
        fs.writeFileSync(testFilePath, `WRITE_TEST_${new Date().toISOString()}`, "utf-8");
        const readBack = fs.readFileSync(testFilePath, "utf-8");
        if (readBack.startsWith("WRITE_TEST_")) {
          result.canWrite = true;
        }
        // Cleanup test file
        fs.unlinkSync(testFilePath);
      } catch (writeErr: any) {
        result.canWrite = false;
        result.error = `دسترسی نوشتن (Write Permission) روی مسیر هارد وجود ندارد: ${writeErr.message}`;
      }

      return result;
    } catch (e: any) {
      result.error = e.message;
      return result;
    }
  }

  /**
   * Initialize SQLite database & auto-create tables and photo directories
   */
  public async initDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      // Ensure base, database, and photos folders exist
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      if (!fs.existsSync(this.dbDir)) {
        fs.mkdirSync(this.dbDir, { recursive: true });
      }
      if (!fs.existsSync(this.photosDir)) {
        fs.mkdirSync(this.photosDir, { recursive: true });
      }

      const SQL = await initSqlJs();

      // Read existing DB file if present
      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } else {
        this.db = new SQL.Database();
      }

      // Initialize DB Tables
      this.db.run(`
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          fileNo TEXT UNIQUE NOT NULL,
          fullName TEXT NOT NULL,
          nationalId TEXT,
          phone TEXT,
          age INTEGER,
          gender TEXT,
          surgeryDate TEXT,
          surgeonName TEXT,
          rhinoplastyType TEXT,
          skinThickness TEXT,
          aestheticGoal TEXT,
          nasalDefects TEXT,
          airwayStatus TEXT,
          status TEXT,
          clinicalNotes TEXT,
          createdAt TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY,
          patientId TEXT,
          filename TEXT NOT NULL,
          filePath TEXT NOT NULL,
          angle TEXT,
          stage TEXT,
          timestamp TEXT,
          exifJson TEXT,
          notes TEXT,
          measurementsJson TEXT,
          FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      this.saveDbToDisk();
      this.initialized = true;
      return { success: true, message: `پایگاه داده SQLite و پوشه‌های ذخیره‌سازی با موفقیت در ${this.baseDir} آماده‌سازی شدند.` };
    } catch (error: any) {
      console.error("Database initialization error:", error);
      return { success: false, message: error.message || "خطا در ایجاد پایگاه داده روی هارد" };
    }
  }

  private saveDbToDisk() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      if (!fs.existsSync(this.dbDir)) {
        fs.mkdirSync(this.dbDir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error("Failed to save sqlite file to disk:", err);
    }
  }

  // --- Patients CRUD ---
  public async getPatients(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    if (!this.db) return [];

    const stmt = this.db.prepare("SELECT * FROM patients ORDER BY createdAt DESC");
    const patients: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      // parse nasalDefects json array
      let nasalDefects: string[] = [];
      try {
        nasalDefects = row.nasalDefects ? JSON.parse(row.nasalDefects as string) : [];
      } catch {
        nasalDefects = [];
      }

      // get photos for patient
      const photoStmt = this.db.prepare("SELECT * FROM photos WHERE patientId = :pId ORDER BY timestamp ASC");
      photoStmt.bind({ ":pId": row.id });
      const photos: any[] = [];
      while (photoStmt.step()) {
        const pRow = photoStmt.getAsObject();
        let exif: any = undefined;
        let measurements: any = undefined;
        try {
          if (pRow.exifJson) exif = JSON.parse(pRow.exifJson as string);
          if (pRow.measurementsJson) measurements = JSON.parse(pRow.measurementsJson as string);
        } catch {}

        photos.push({
          id: pRow.id,
          patientId: pRow.patientId,
          filename: pRow.filename,
          url: `/api/storage/photos/${pRow.id}`,
          angle: pRow.angle,
          stage: pRow.stage,
          timestamp: pRow.timestamp,
          exif,
          notes: pRow.notes,
          measurements
        });
      }
      photoStmt.free();

      patients.push({
        ...row,
        nasalDefects,
        photos
      });
    }
    stmt.free();
    return patients;
  }

  public async savePatient(patient: any): Promise<boolean> {
    if (!this.db) await this.initDatabase();
    if (!this.db) return false;

    const existsStmt = this.db.prepare("SELECT id FROM patients WHERE id = :id");
    existsStmt.bind({ ":id": patient.id });
    const exists = existsStmt.step();
    existsStmt.free();

    const nasalDefectsStr = JSON.stringify(patient.nasalDefects || []);
    const now = new Date().toISOString();

    if (exists) {
      this.db.run(`
        UPDATE patients SET
          fileNo = :fileNo,
          fullName = :fullName,
          nationalId = :nationalId,
          phone = :phone,
          age = :age,
          gender = :gender,
          surgeryDate = :surgeryDate,
          surgeonName = :surgeonName,
          rhinoplastyType = :rhinoplastyType,
          skinThickness = :skinThickness,
          aestheticGoal = :aestheticGoal,
          nasalDefects = :nasalDefects,
          airwayStatus = :airwayStatus,
          status = :status,
          clinicalNotes = :clinicalNotes,
          updatedAt = :updatedAt
        WHERE id = :id
      `, {
        ":id": patient.id,
        ":fileNo": patient.fileNo || "",
        ":fullName": patient.fullName || "",
        ":nationalId": patient.nationalId || "",
        ":phone": patient.phone || "",
        ":age": patient.age || 0,
        ":gender": patient.gender || "female",
        ":surgeryDate": patient.surgeryDate || "",
        ":surgeonName": patient.surgeonName || "",
        ":rhinoplastyType": patient.rhinoplastyType || "primary",
        ":skinThickness": patient.skinThickness || "medium",
        ":aestheticGoal": patient.aestheticGoal || "natural",
        ":nasalDefects": nasalDefectsStr,
        ":airwayStatus": patient.airwayStatus || "normal",
        ":status": patient.status || "pre_op_consult",
        ":clinicalNotes": patient.clinicalNotes || "",
        ":updatedAt": now
      });
    } else {
      this.db.run(`
        INSERT INTO patients (
          id, fileNo, fullName, nationalId, phone, age, gender,
          surgeryDate, surgeonName, rhinoplastyType, skinThickness,
          aestheticGoal, nasalDefects, airwayStatus, status, clinicalNotes,
          createdAt, updatedAt
        ) VALUES (
          :id, :fileNo, :fullName, :nationalId, :phone, :age, :gender,
          :surgeryDate, :surgeonName, :rhinoplastyType, :skinThickness,
          :aestheticGoal, :nasalDefects, :airwayStatus, :status, :clinicalNotes,
          :createdAt, :updatedAt
        )
      `, {
        ":id": patient.id,
        ":fileNo": patient.fileNo || "",
        ":fullName": patient.fullName || "",
        ":nationalId": patient.nationalId || "",
        ":phone": patient.phone || "",
        ":age": patient.age || 0,
        ":gender": patient.gender || "female",
        ":surgeryDate": patient.surgeryDate || "",
        ":surgeonName": patient.surgeonName || "",
        ":rhinoplastyType": patient.rhinoplastyType || "primary",
        ":skinThickness": patient.skinThickness || "medium",
        ":aestheticGoal": patient.aestheticGoal || "natural",
        ":nasalDefects": nasalDefectsStr,
        ":airwayStatus": patient.airwayStatus || "normal",
        ":status": patient.status || "pre_op_consult",
        ":clinicalNotes": patient.clinicalNotes || "",
        ":createdAt": patient.createdAt || now,
        ":updatedAt": now
      });
    }

    this.saveDbToDisk();
    return true;
  }

  public async deletePatient(id: string): Promise<boolean> {
    if (!this.db) await this.initDatabase();
    if (!this.db) return false;

    // Delete photos files from hard drive
    const photoStmt = this.db.prepare("SELECT filePath FROM photos WHERE patientId = :id");
    photoStmt.bind({ ":id": id });
    while (photoStmt.step()) {
      const p = photoStmt.getAsObject();
      if (p.filePath && fs.existsSync(p.filePath as string)) {
        try {
          fs.unlinkSync(p.filePath as string);
        } catch {}
      }
    }
    photoStmt.free();

    this.db.run("DELETE FROM photos WHERE patientId = :id", { ":id": id });
    this.db.run("DELETE FROM patients WHERE id = :id", { ":id": id });
    this.saveDbToDisk();
    return true;
  }

  /**
   * Save photo image file directly onto the HDD photos folder (organized by patient fileNo)
   */
  public async savePhotoFile(params: {
    photoId: string;
    patientId: string;
    patientFileNo?: string;
    filename: string;
    base64DataOrBuffer: string | Buffer;
    angle: string;
    stage: string;
    exif?: any;
    measurements?: any;
    notes?: string;
  }): Promise<{ photoId: string; filePath: string; url: string }> {
    if (!this.db) await this.initDatabase();

    const folderName = params.patientFileNo ? `patient_${params.patientFileNo}` : `patient_${params.patientId}`;
    const targetFolder = path.join(this.photosDir, folderName);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const cleanFilename = `${params.stage}_${params.angle}_${Date.now()}_${params.filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const fullPath = path.join(targetFolder, cleanFilename);

    let buffer: Buffer;
    if (typeof params.base64DataOrBuffer === "string") {
      const base64Clean = params.base64DataOrBuffer.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Clean, "base64");
    } else {
      buffer = params.base64DataOrBuffer;
    }

    fs.writeFileSync(fullPath, buffer);

    if (this.db) {
      this.db.run(`
        INSERT OR REPLACE INTO photos (
          id, patientId, filename, filePath, angle, stage, timestamp, exifJson, notes, measurementsJson
        ) VALUES (
          :id, :patientId, :filename, :filePath, :angle, :stage, :timestamp, :exifJson, :notes, :measurementsJson
        )
      `, {
        ":id": params.photoId,
        ":patientId": params.patientId,
        ":filename": cleanFilename,
        ":filePath": fullPath,
        ":angle": params.angle || "frontal",
        ":stage": params.stage || "pre_op",
        ":timestamp": new Date().toISOString(),
        ":exifJson": params.exif ? JSON.stringify(params.exif) : null,
        ":notes": params.notes || "",
        ":measurementsJson": params.measurements ? JSON.stringify(params.measurements) : null
      });
      this.saveDbToDisk();
    }

    return {
      photoId: params.photoId,
      filePath: fullPath,
      url: `/api/storage/photos/${params.photoId}`
    };
  }

  public async getPhotoFilePath(photoId: string): Promise<string | null> {
    if (!this.db) await this.initDatabase();
    if (!this.db) return null;

    const stmt = this.db.prepare("SELECT filePath FROM photos WHERE id = :id");
    stmt.bind({ ":id": photoId });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return (row.filePath as string) || null;
    }
    stmt.free();
    return null;
  }
}
