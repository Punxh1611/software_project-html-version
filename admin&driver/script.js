
import { toast } from "./Toast.js";


// ฟังก์ชัน Login
document.querySelector(".btn-signin")?.addEventListener("click", async () => {
    const userInput = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (userInput == "admin") {
        if (password == "admin123") {
            window.location.href = "admin.html";
        } else {    
            toast("รหัสผ่านไม่ถูกต้อง", "error"); }
        return;
    }
    if (userInput == "driver") {
        if (password == "driver123") {
            window.location.href = "driver.html";
        } else {    
            toast("รหัสผ่านไม่ถูกต้อง", "error"); }
        return;
    }
    if (!userInput || !password) {
        toast("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }
    try {
        let emailToAuth = userInput;    
        if (!userInput.includes("@")) {
            const userRef = collection(firestore, "user");
            const q = query(userRef, where("username", "==", userInput));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast("ไม่พบ Username นี้ในระบบ");
                return;
            }
            querySnapshot.forEach((doc) => {
                emailToAuth = doc.data().email;
            });
        }
        const userCredential = await signInWithEmailAndPassword(auth, emailToAuth, password);
        const user = userCredential.user;
        console.log("Login Success:", user.uid);
        sessionStorage.setItem("userUID", user.uid);
    } catch (error) {
        console.error("Login Error:", error);
        toast("เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + error.message, "error");
    }
}); 