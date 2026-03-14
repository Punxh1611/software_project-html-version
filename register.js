import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { toast } from "./Toast.js";

// ใช้ Config ชุดเดิมของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyBO40doAV5CKMPdg7rreqtWgXq9hxJgAMk",
  authDomain: "vanvan-90cd0.firebaseapp.com",
  projectId: "vanvan-90cd0",
  storageBucket: "vanvan-90cd0.firebasestorage.app",
  messagingSenderId: "234295405835",
  appId: "1:234295405835:web:b5c3e7842f979af686460e",
  measurementId: "G-S3MF2CYXZ2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("btn-register")?.addEventListener("click", async () => {
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password").value;

    // 1. Validation เบื้องต้น
    if (!username || !email || !password) {
        toast("กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
    }

    if (password !== confirmPassword) {
        toast("รหัสผ่านไม่ตรงกัน");
        return;
    }

    if (password.length < 6) {
        toast("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return;
    }

    try {
        // 2. สร้าง User ใน Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. บันทึกข้อมูลเพิ่มเติมลงใน Firestore (คอลเลกชัน user)
        // ใช้ UID จาก Auth เป็น ID ของ Document เพื่อให้ข้อมูลเชื่อมโยงกัน
        await setDoc(doc(db, "user", user.uid), {
            uid: user.uid,
            username: username,
            email: email,
            role: "user", // กำหนด role เริ่มต้น
            createdAt: new Date().toISOString()
        });

        toast("สมัครสมาชิกสำเร็จ!");
        window.location.href = "login.html"; // สมัครเสร็จแล้วส่งไปหน้า Login

    } catch (error) {
        console.error("Register error:", error.code);
        switch (error.code) {
            case "auth/email-already-in-use":
                toast("Email นี้ถูกใช้งานไปแล้ว");
                break;
            case "auth/invalid-email":
                toast("รูปแบบ Email ไม่ถูกต้อง");
                break;
            case "auth/weak-password":
                toast("รหัสผ่านคาดเดาง่ายเกินไป");
                break;
            default:
                toast("เกิดข้อผิดพลาด: " + error.message);
        }
    }
    
});
/**
 * password-toggle.js
 * ใช้งาน: import ไฟล์นี้ใน script ของหน้าที่ต้องการ
 * แล้วใส่ attribute data-toggle-password="id-ของ-input" บนปุ่มหรือ icon
 */

function initPasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach(btn => {
        const targetId = btn.getAttribute("data-toggle-password");
        const input = document.getElementById(targetId);
        if (!input) return;

        btn.innerHTML = eyeIcon();
        btn.setAttribute("aria-label", "แสดง/ซ่อนรหัสผ่าน");
        btn.setAttribute("type", "button");

        btn.addEventListener("click", () => {
            const isHidden = input.type === "password";
            input.type = isHidden ? "text" : "password";
            btn.innerHTML = isHidden ? eyeOffIcon() : eyeIcon();
        });
    });
}

function eyeIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>`;
}

function eyeOffIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>`;
}
initPasswordToggles();