import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Firebase Initialization
let db: any;
let firebaseConfig: any = {};

if (fs.existsSync("./firebase-applet-config.json")) {
  firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    console.log(`Firebase Connected: ${firebaseConfig.projectId}`);
  } catch (err) {
    console.error("Firebase connection failed:", err);
  }
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// API Routes
app.post("/api/access", async (req, res) => {
  const { keyCode } = req.body;
  const adminPassword = (process.env.ADMIN_SECRET_PASSWORD || "J4J").trim();

  if (!keyCode) return res.status(400).json({ error: "Usage Key gerekli" });
  const normalizedInput = keyCode.trim().toUpperCase();

  // Admin access check
  if (normalizedInput === adminPassword.toUpperCase()) {
    return res.json({ role: "admin", redirectTo: "/admin" });
  }

  if (!db) return res.status(503).json({ error: "Firebase bağlantısı kurulamadı." });

  try {
    // 1. Check existing user session in Firebase
    const usersRef = collection(db, "users");
    const qUser = query(usersRef, where("activeToken", "==", normalizedInput));
    const userSnapshot = await getDocs(qUser);
    
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const expiresAt = new Date(userData.expiresAt);
      
      if (expiresAt > new Date()) {
        return res.json({ role: "user", status: "active", expiresAt: userData.expiresAt });
      } else {
        // DELETE EXPIRED KEY FROM FIREBASE
        console.log(`Key ${normalizedInput} expired. Purging from Firebase...`);
        await deleteDoc(userDoc.ref);
        // Also delete from tokens collection (MoreSpace/CODELER/codes)
        const tokensRef = collection(db, "MoreSpace", "CODELER", "codes");
        const qToken = query(tokensRef, where("code", "==", normalizedInput));
        const tokenSnap = await getDocs(qToken);
        tokenSnap.forEach(async (d) => await deleteDoc(d.ref));

        return res.status(403).json({ error: "Bu anahtarın süresi dolduğu için Firebase'den silindi." });
      }
    }

    // 2. Check for new token in Firebase (Shared Directory: MoreSpace -> CODELER -> codes)
    const tokensRef = collection(db, "MoreSpace", "CODELER", "codes");
    console.log(`[DEBUG] Searching token: ${normalizedInput} in MoreSpace/CODELER/codes`);
    
    // Sadece kod ile ara, isUsed kontrolünü kodda yapalım (bazı servisler isUsed eklememiş olabilir)
    const qToken = query(tokensRef, where("code", "==", normalizedInput));
    const tokenSnapshot = await getDocs(qToken);

    if (tokenSnapshot.empty) {
      console.log(`[DEBUG] Token NOT FOUND in Firebase at the specified path.`);
      return res.status(404).json({ error: "Geçersiz veya kullanılmış anahtar." });
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();

    // Eğer isUsed alanı varsa ve true ise (kullanılmışsa) hata ver
    if (tokenData.isUsed === true) {
      console.log(`[DEBUG] Token found but ALREADY USED.`);
      return res.status(400).json({ error: "Bu anahtar daha önce kullanılmış." });
    }

    // Determine duration based on "kind" (type)
    let durationDays = tokenData.durationDays;
    
    if (!durationDays) {
      const type = (tokenData.type || "").toUpperCase();
      if (type === 'GOLD') durationDays = 365;
      else if (type === 'LITE') durationDays = 30;
      else if (type === 'TRIAL') durationDays = 7;
      else durationDays = 30; // Varsayılan
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    console.log(`[DEBUG] Key: ${normalizedInput}, Kind: ${tokenData.type}, Calculated Duration: ${durationDays} days`);

    // Register user in Firebase (The Lock)
    const userDocRef = doc(db, "users", `key_${normalizedInput}`);
    await setDoc(userDocRef, {
      email: `user_${normalizedInput}@system.local`,
      activeToken: normalizedInput,
      tokenType: tokenData.type || "paid",
      expiresAt: expiryDate.toISOString(),
      activatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    // Replace/Update the key state in the "lock" (CODELER/codes)
    await updateDoc(tokenDoc.ref, { 
      isUsed: true, 
      usedAt: serverTimestamp(),
      expiryCalculated: expiryDate.toISOString(),
      assignedDuration: durationDays
    });

    res.json({ role: "user", status: "activated", expiresAt: expiryDate.toISOString() });
  } catch (error: any) {
    console.error("Firebase Access error:", error);
    res.status(500).json({ error: "Firebase veritabanı hatası." });
  }
});

// Admin API: Generate Token (Saves to MoreSpace -> CODELER -> codes)
app.post("/api/admin/generate-token", async (req, res) => {
  const { durationDays, type } = req.body;
  const tokenCode = Math.random().toString(36).substring(2, 12).toUpperCase();

  try {
    await addDoc(collection(db, "MoreSpace", "CODELER", "codes"), {
      code: tokenCode,
      durationDays: parseInt(durationDays),
      type: type || "paid",
      isUsed: false,
      createdAt: serverTimestamp()
    });
    res.json({ success: true, token: tokenCode });
  } catch (error) {
    res.status(500).json({ error: "Firebase'e token kaydedilemedi" });
  }
});

// DIŞ SİSTEM API (YENİ SİTE İÇİN - Firebase kullanır)
app.post("/api/external/generate", async (req, res) => {
  const { secret, durationDays, type, prefix } = req.body;
  const systemSecret = process.env.EXTERNAL_SYSTEM_SECRET || "MORESPACE_EXTERNAL_GATE_123";

  if (secret !== systemSecret) return res.status(401).json({ error: "Hatalı secret" });

  const pre = prefix || "EXT";
  const tokenCode = `${pre}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    await addDoc(collection(db, "MoreSpace", "CODELER", "codes"), {
      code: tokenCode,
      durationDays: parseInt(durationDays) || 30,
      type: type || "external",
      isUsed: false,
      createdAt: serverTimestamp()
    });
    res.json({ success: true, token: tokenCode });
  } catch (error) {
    res.status(500).json({ error: "Firebase dış kaynak hatası." });
  }
});

// Admin API: List Stats (From MoreSpace -> CODELER -> codes)
app.get("/api/admin/stats", async (req, res) => {
  try {
    const tokensSnapshot = await getDocs(collection(db, "MoreSpace", "CODELER", "codes"));
    const usersSnapshot = await getDocs(collection(db, "users"));
    
    const lastTokens = tokensSnapshot.docs.slice(-20).map(d => ({ id: d.id, ...d.data() }));

    res.json({ 
      usersCount: usersSnapshot.size, 
      tokensCount: tokensSnapshot.size, 
      lastTokens 
    });
  } catch (error) {
    res.status(500).json({ error: "Firebase istatistik hatası" });
  }
});

// Session Verification Route (With Firebase Deletion)
app.post("/api/verify-session", async (req, res) => {
  const { keyCode } = req.body;
  if (!keyCode || !db) return res.status(401).json({ valid: false });

  try {
    const usersRef = collection(db, "users");
    const qUser = query(usersRef, where("activeToken", "==", keyCode));
    const snapshot = await getDocs(qUser);
    
    if (snapshot.empty) return res.json({ valid: false });

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const expiresAt = new Date(userData.expiresAt);
    const isValid = expiresAt > new Date();

    if (!isValid) {
      console.log(`Purging expired session from Firebase: ${keyCode}`);
      await deleteDoc(userDoc.ref);
      const tokensRef = collection(db, "MoreSpace", "CODELER", "codes");
      const qToken = query(tokensRef, where("code", "==", keyCode));
      const tSnap = await getDocs(qToken);
      tSnap.forEach(async (d) => await deleteDoc(d.ref));
    }

    return res.json({ valid: isValid, expiresAt: userData.expiresAt });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
