import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { toast } from "./Toast.js";

// Firebase Config (ใช้ชุดเดิมของคุณ)
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

// ฟังก์ชัน Login
document.querySelector(".btn-signin")?.addEventListener("click", async () => {
    const userInput = document.getElementById("username").value.trim(); // รับค่าได้ทั้ง Username หรือ Email
    const password = document.getElementById("password").value;

    if (!userInput || !password) {
        toast("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    try {
        let emailToAuth = userInput;

        // ตรวจสอบว่าสิ่งที่กรอกมาเป็น Username หรือไม่ (ถ้าไม่มี @ ให้สันนิษฐานว่าเป็น Username)
        if (!userInput.includes("@")) {
            // ค้นหา Email จาก Firestore โดยใช้ Username
            const userRef = collection(db, "user");
            const q = query(userRef, where("username", "==", userInput));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast("ไม่พบ Username นี้ในระบบ");
                return;
            }

            // ดึง Email ของ User คนนั้นมาเพื่อใช้ Login
            querySnapshot.forEach((doc) => {
                emailToAuth = doc.data().email;
            });
        }

        // ทำการ Login ด้วย Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, emailToAuth, password);
        const user = userCredential.user;

        console.log("Login Success:", user.uid);
        
        // เก็บข้อมูลเบื้องต้นลง SessionStorage (ถ้าต้องการนำไปใช้หน้าอื่น)
        sessionStorage.setItem("userUID", user.uid);
        
        toast("เข้าสู่ระบบสำเร็จ!");
        window.location.href = "index.html"; // ไปยังหน้าหลัก

    } catch (error) {
        console.error("Login Error:", error.code);
        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                toast("Username/Email หรือ รหัสผ่านไม่ถูกต้อง");
                break;
            case "auth/too-many-requests":
                toast("ระงับการเข้าสู่ระบบชั่วคราวเนื่องจากลองผิดหลายครั้ง");
                break;
            default:
                toast("เกิดข้อผิดพลาด: " + error.message);
        }
    }
});
// เรียกใช้ลูกตาตอนหน้าโหลด
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
// ฟังก์ชันส่งลิงก์รีเซ็ตไปที่ Python API
