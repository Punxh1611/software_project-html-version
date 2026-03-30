import { toast } from "./toast.js";
// booking.js — หน้ายืนยันการจอง
const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
        // ถ้าไม่มี ให้แจ้งเตือนและส่งกลับไปหน้า login.html
        toast("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบก่อน");
        window.location.href = "login.html"; 
    }
const API = "http://localhost:3000/api";

// ── Auth helpers ──────────────────────────────────────
const getToken = () => localStorage.getItem("token");
const getUser  = () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } };

// ── Format วันเวลาภาษาไทย ─────────────────────────────
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString("th-TH", {
        year:    "numeric",
        month:   "long",
        day:     "numeric",
        hour:    "2-digit",
        minute:  "2-digit",
        timeZone: "Asia/Bangkok"
    });
}

// ── แสดง seats badge ──────────────────────────────────
function seatsBadge(available) {
    if (available === 0) {
        return `<span class="seats-badge seats-badge--full">เต็มแล้ว</span>`;
    }
    if (available <= 3) {
        return `<span class="seats-badge seats-badge--low">เหลือ ${available} ที่นั่ง</span>`;
    }
    return `<span class="seats-badge">เหลือ ${available} ที่นั่ง</span>`;
}

// ── Main ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

    // ดึง schedule_id จาก URL
    const params     = new URLSearchParams(window.location.search);
    const scheduleId = params.get("schedule_id");

    const loadingEl = document.getElementById("loading-state");
    const contentEl = document.getElementById("booking-content");
    const errorEl   = document.getElementById("error-state");
    const warningEl = document.getElementById("login-warning");

    // ตรวจสอบ schedule_id
    if (!scheduleId) {
        loadingEl.style.display = "none";
        errorEl.style.display   = "block";
        return;
    }

    // ตรวจสอบว่า Login อยู่ไหม
    const user  = getUser();
    const token = getToken();
    if (!user || !token) {
        warningEl.style.display = "flex";
    }

    try {
        // ดึงข้อมูลรอบรถ
        const res  = await fetch(`${API}/schedules/${scheduleId}`);
        const data = await res.json();

        if (!res.ok || !data.data) {
            loadingEl.style.display = "none";
            errorEl.style.display   = "block";
            return;
        }

        const schedule = data.data;

        // ตรวจสอบที่นั่ง
        if (schedule.available_seats <= 0) {
            loadingEl.style.display = "none";
            errorEl.style.display   = "block";
            document.querySelector(".error-box__title").textContent = "ที่นั่งเต็มแล้ว";
            document.querySelector(".error-box__msg").textContent   = "รอบนี้ไม่มีที่นั่งว่างแล้ว กรุณาเลือกรอบอื่น";
            return;
        }

        // แสดงข้อมูล
        document.getElementById("info-origin").textContent      = schedule.origin;
        document.getElementById("info-destination").textContent = schedule.destination;
        document.getElementById("info-depart").textContent      = formatDate(schedule.depart_time);
        document.getElementById("info-driver").textContent      = schedule.driver_name || "-";
        document.getElementById("info-plate").textContent       = schedule.plate_number || "-";
        document.getElementById("info-price").textContent       = `฿${Number(schedule.price).toLocaleString()}`;
        document.getElementById("info-seats").innerHTML         = seatsBadge(schedule.available_seats);
        document.getElementById("info-passenger").textContent   = user ? user.username : "กรุณาเข้าสู่ระบบ";

        // แสดง content
        loadingEl.style.display = "none";
        contentEl.style.display = "block";

        // ── ปุ่มยืนยันการจอง ──────────────────────────
        const btnConfirm = document.getElementById("btn-confirm");
        btnConfirm.addEventListener("click", async () => {

            // ถ้ายังไม่ login
            if (!user || !token) {
                window.location.href = `login.html?redirect=booking.html?schedule_id=${scheduleId}`;
                return;
            }

            btnConfirm.disabled     = true;
            btnConfirm.textContent  = "⏳ กำลังจอง...";

            try {
                const bookRes  = await fetch(`${API}/bookings`, {
                    method:  "POST",
                    headers: {
                        "Content-Type":  "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ schedule_id: scheduleId })
                });
                const bookData = await bookRes.json();

                if (!bookRes.ok) {
                    alert(bookData.message || "เกิดข้อผิดพลาด");
                    btnConfirm.disabled    = false;
                    btnConfirm.textContent = "✅ ยืนยันการจอง";
                    return;
                }

                // จองสำเร็จ → ไปหน้าชำระเงิน
                window.location.href = `payment.html?booking_id=${bookData.data.id}&expires_at=${bookData.data.expires_at}`;

            } catch (err) {
                console.error(err);
                alert("ไม่สามารถเชื่อมต่อ Server ได้");
                btnConfirm.disabled    = false;
                btnConfirm.textContent = "✅ ยืนยันการจอง";
            }
        });

    } catch (err) {
        console.error(err);
        loadingEl.style.display = "none";
        errorEl.style.display   = "block";
    }
});
