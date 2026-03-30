// booking.js — แค่ดูข้อมูล ไม่แตะ DB เลย

const API = "http://localhost:3000/api";

const getToken = () => localStorage.getItem("token");
const getUser  = () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } }

function isLoggedIn() {
    const token = getToken();
    const user  = getUser();
    if (!token || !user) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return false;
        }
    } catch { return false; }
    return true;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString("th-TH", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Bangkok"
    });
}

function seatsBadge(available) {
    if (available === 0)  return `<span class="seats-badge seats-badge--full">เต็มแล้ว</span>`;
    if (available <= 3)   return `<span class="seats-badge seats-badge--low">เหลือ ${available} ที่นั่ง</span>`;
    return `<span class="seats-badge">เหลือ ${available} ที่นั่ง</span>`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const params     = new URLSearchParams(window.location.search);
    const scheduleId = params.get("schedule_id");
    const loadingEl  = document.getElementById("loading-state");
    const contentEl  = document.getElementById("booking-content");
    const errorEl    = document.getElementById("error-state");

    // ถ้าไม่มี schedule_id
    if (!scheduleId) {
        loadingEl.style.display = "none";
        errorEl.style.display   = "block";
        return;
    }

    // ถ้าไม่ได้ login → ไป login
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res  = await fetch(`${API}/schedules/${scheduleId}`);
        const data = await res.json();

        if (!res.ok || !data.data) {
            loadingEl.style.display = "none";
            errorEl.style.display   = "block";
            return;
        }

        const s = data.data;

        // ที่นั่งเต็ม
        if (s.available_seats <= 0) {
            loadingEl.style.display = "none";
            errorEl.style.display   = "block";
            document.getElementById("error-title").textContent = "ที่นั่งเต็มแล้ว";
            document.getElementById("error-msg").textContent   = "รอบนี้ไม่มีที่นั่งว่าง กรุณาเลือกรอบอื่น";
            return;
        }

        // แสดงข้อมูล
        const user = getUser();
        document.getElementById("info-origin").textContent      = s.origin;
        document.getElementById("info-destination").textContent = s.destination;
        document.getElementById("info-depart").textContent      = formatDate(s.depart_time);
        document.getElementById("info-driver").textContent      = s.driver_name  || "-";
        document.getElementById("info-plate").textContent       = s.plate_number || "-";
        document.getElementById("info-price").textContent       = `฿${Number(s.price).toLocaleString()}`;
        document.getElementById("info-seats").innerHTML         = seatsBadge(s.available_seats);
        document.getElementById("info-passenger").textContent   = user?.username || "-";

        loadingEl.style.display = "none";
        contentEl.style.display = "block";

        // ✅ กดยืนยัน → ส่งข้อมูลผ่าน sessionStorage ไปหน้า payment
        // ไม่แตะ DB เลย
        document.getElementById("btn-confirm").addEventListener("click", () => {
            sessionStorage.setItem("pendingBooking", JSON.stringify({
                schedule_id:  s.id,
                origin:       s.origin,
                destination:  s.destination,
                depart_time:  s.depart_time,
                price:        s.price,
                driver_name:  s.driver_name,
                plate_number: s.plate_number,
            }));
            window.location.href = "payment.html";
        });

    } catch (err) {
        console.error(err);
        loadingEl.style.display = "none";
        errorEl.style.display   = "block";
    }
});
