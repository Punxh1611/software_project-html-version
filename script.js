import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
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
                alert("ไม่พบ Username นี้ในระบบ");
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
        
        alert("เข้าสู่ระบบสำเร็จ!");
        window.location.href = "main.html"; // ไปยังหน้าหลัก

    } catch (error) {
        console.error("Login Error:", error.code);
        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                alert("Username/Email หรือ รหัสผ่านไม่ถูกต้อง");
                break;
            case "auth/too-many-requests":
                alert("ระงับการเข้าสู่ระบบชั่วคราวเนื่องจากลองผิดหลายครั้ง");
                break;
            default:
                alert("เกิดข้อผิดพลาด: " + error.message);
        }
    }
});