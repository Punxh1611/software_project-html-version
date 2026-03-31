// auth-guard.js
// วิธีใช้: ใส่ใน <head> บรรทัดแรก ก่อน script อื่นทุกไฟล์
//
//   <script src="auth-guard.js" data-role="public"></script>   ← index.html (ทุกคนเข้าได้ แต่ admin/driver redirect ออก)
//   <script src="auth-guard.js" data-role="user"></script>     ← booking.html, history.html, payment.html
//   <script src="../auth-guard.js" data-role="admin"></script>  ← admin/ ทุกหน้า
//   <script src="../auth-guard.js" data-role="driver"></script> ← driver/ ทุกหน้า
//   <script src="auth-guard.js" data-role="guest"></script>    ← login.html, register.html, forgot_password.html

(function () {
    const script  = document.currentScript;
    const role    = script ? script.getAttribute("data-role") : null;

    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user") || "null");

    // ── ตรวจ token หมดอายุ ──────────────────────────────
    function isTokenValid() {
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    // ── หา root path ────────────────────────────────────
    function rootPath() {
        const depth = window.location.pathname.split('/').filter(Boolean).length - 1;
        return depth > 0 ? '../'.repeat(depth) : './';
    }

    const loggedIn = isTokenValid() && user;
    const userRole = user?.role;

    // ── หน้า public (index.html) ─────────────────────────
    // ทุกคนเข้าได้ แต่ถ้าเป็น admin/driver ให้ redirect ไปหน้าของตัวเอง
    if (role === "public") {
        if (loggedIn) {
            const root = rootPath();
            if (userRole === "admin")       window.location.replace(root + "admin/index.html");
            else if (userRole === "driver") window.location.replace(root + "driver/index.html");
        }
        return; // guest หรือ user → อยู่หน้านี้ได้
    }

    // ── หน้า guest (login / register / forgot_password) ──
    // ถ้า login แล้วให้ออกไปหน้าที่ตัวเองมีสิทธิ์
    if (role === "guest") {
        if (loggedIn) {
            const root = rootPath();
            if (userRole === "admin")       window.location.replace(root + "admin/index.html");
            else if (userRole === "driver") window.location.replace(root + "driver/index.html");
            else                            window.location.replace(root + "index.html");
        }
        return; // ยังไม่ login → อยู่หน้านี้ได้
    }

    // ── หน้าที่ต้อง login ────────────────────────────────
    if (!loggedIn) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const root = rootPath();
        window.location.replace(root + "login.html");
        return;
    }

    // ── เช็ค role ────────────────────────────────────────
    if (role && userRole !== role) {
        const root = rootPath();
        if (userRole === "admin")       window.location.replace(root + "admin/index.html");
        else if (userRole === "driver") window.location.replace(root + "driver/index.html");
        else                            window.location.replace(root + "index.html");
    }

})();