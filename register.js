import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
        alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
    }

    if (password !== confirmPassword) {
        alert("รหัสผ่านไม่ตรงกัน");
        return;
    }

    if (password.length < 6) {
        alert("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
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

        alert("สมัครสมาชิกสำเร็จ!");
        window.location.href = "login.html"; // สมัครเสร็จแล้วส่งไปหน้า Login

    } catch (error) {
        console.error("Register error:", error.code);
        switch (error.code) {
            case "auth/email-already-in-use":
                alert("Email นี้ถูกใช้งานไปแล้ว");
                break;
            case "auth/invalid-email":
                alert("รูปแบบ Email ไม่ถูกต้อง");
                break;
            case "auth/weak-password":
                alert("รหัสผ่านคาดเดาง่ายเกินไป");
                break;
            default:
                alert("เกิดข้อผิดพลาด: " + error.message);
        }
    }
});