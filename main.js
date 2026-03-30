// main.js — index.html

const API = "http://localhost:3000/api";

const ICONS = {
    home:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    booking: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    promo:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 14l6-6M9.5 9.5h.01M14.5 14.5h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    login:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    logout:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    history: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
};

// ── Auth ──────────────────────────────────────────────────────────
const getUser  = () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } };
const getToken = () => localStorage.getItem("token");

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
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

// ── Navbar ────────────────────────────────────────────────────────
function renderNavbar() {
    const navDesktop = document.getElementById("nav-actions-desktop");
    const navMobile  = document.getElementById("nav-drawer-links");
    const user = getUser();

    if (isLoggedIn() && user) {
        const initials   = user.username?.charAt(0).toUpperCase() || "U";
        const avatarHTML = `<div class="navbar__avatar-initials">${initials}</div>`;

        if (navDesktop) navDesktop.innerHTML = `
            <a class="navbar__a" href="history.html">Booking</a>
            <a class="navbar__a" href="#">Promotion</a>
            <div class="navbar__avatar" title="${user.username}">${avatarHTML}</div>
            <span class="navbar__username">${user.username}</span>
            <button class="navbar__logout-btn" id="btn-logout">ออกจากระบบ</button>
        `;
        if (navMobile) navMobile.innerHTML = `
            <div class="drawer__user-card">
                <div class="drawer__user-avatar">${avatarHTML}</div>
                <div class="drawer__user-info">
                    <span class="drawer__user-name">${user.username}</span>
                    <span class="drawer__user-email">${user.email}</span>
                </div>
            </div>
            <div class="drawer__divider"></div>
            <a class="drawer__link" href="index.html">${ICONS.home}<span>หน้าแรก</span></a>
            <a class="drawer__link" href="history.html">${ICONS.history}<span>การจองของฉัน</span></a>
            <a class="drawer__link" href="#">${ICONS.promo}<span>Promotion</span></a>
            <div class="drawer__divider"></div>
            <button class="drawer__link drawer__link--logout" id="btn-logout-mobile">${ICONS.logout}<span>ออกจากระบบ</span></button>
        `;
        document.getElementById("btn-logout")?.addEventListener("click", logout);
        document.getElementById("btn-logout-mobile")?.addEventListener("click", logout);
    } else {
        if (navDesktop) navDesktop.innerHTML = `
            <a class="navbar__a" href="#">Booking</a>
            <a class="navbar__a" href="#">Promotion</a>
            <a class="navbar__contact-btn" href="login.html">เข้าสู่ระบบ</a>
        `;
        if (navMobile) navMobile.innerHTML = `
            <a class="drawer__link" href="index.html">${ICONS.home}<span>หน้าแรก</span></a>
            <a class="drawer__link" href="#">${ICONS.booking}<span>Booking</span></a>
            <a class="drawer__link" href="#">${ICONS.promo}<span>Promotion</span></a>
            <div class="drawer__divider"></div>
            <a class="drawer__link drawer__link--login" href="login.html">${ICONS.login}<span>เข้าสู่ระบบ / สมัครสมาชิก</span></a>
        `;
    }
}

// ── Data ──────────────────────────────────────────────────────────
let allRoutes    = [];
let allSchedules = [];

async function loadData() {
    try {
        const [routesRes, schedulesRes] = await Promise.all([
            fetch(`${API}/routes`),
            fetch(`${API}/schedules`)
        ]);
        const routesData    = await routesRes.json();
        const schedulesData = await schedulesRes.json();
        allRoutes    = Array.isArray(routesData)    ? routesData    : (routesData.data    || []);
        allSchedules = Array.isArray(schedulesData) ? schedulesData : (schedulesData.data || []);

        populateDropdowns();
        renderTripCards();
        renderUpcomingList();
    } catch (err) {
        console.error("โหลดข้อมูลไม่ได้:", err);
    }
}

// ── Dropdowns ─────────────────────────────────────────────────────
function populateDropdowns() {
    const origins = [...new Set(allRoutes.map(r => r.origin))];
    const dests   = [...new Set(allRoutes.map(r => r.destination))];

    const fromSel = document.getElementById("field-from");
    const toSel   = document.getElementById("field-to");
    if (!fromSel || !toSel) return;

    // ล้าง option เดิม (ยกเว้น placeholder)
    while (fromSel.options.length > 1) fromSel.remove(1);
    while (toSel.options.length > 1)   toSel.remove(1);

    origins.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o; opt.textContent = o;
        fromSel.appendChild(opt);
    });
    dests.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d; opt.textContent = d;
        toSel.appendChild(opt);
    });
}

// ── Trip Cards ────────────────────────────────────────────────────
const DEST_IMAGES = {
    "พัทยา":     "Pattaya",
    "ระยอง":     "Rayong",
    "ชลบุรี":    "Chonburi",
    "เชียงใหม่": "Chiangmai",
    "หัวหิน":    "Huahin",
};

function renderTripCards() {
    const grid = document.getElementById("trip-grid");
    if (!grid) return;

    const featured = allSchedules.filter(s => s.driver_name).slice(0, 3);
    if (featured.length === 0) {
        grid.innerHTML = `<p style="font-family:var(--font-thai);color:var(--color-text-secondary)">ยังไม่มีรอบรถในขณะนี้</p>`;
        return;
    }

    const colors = ["355872", "4A6D8C", "2C4A6E"];
    grid.innerHTML = featured.map((s, i) => {
        const imgText = DEST_IMAGES[s.destination] || `Route${i + 1}`;
        return `
        <div class="trip-card ${i === 0 ? 'trip-card--featured' : ''}">
            <div class="trip-card__img-wrapper">
                <img src="https://placehold.co/277x169/${colors[i % 3]}/white?text=${imgText}"
                     alt="${s.destination}" class="trip-card__img">
            </div>
            <div class="trip-card__body">
                <h3 class="trip-card__name">${s.destination}</h3>
                <p class="trip-card__time">จาก ${s.origin} · ฿${Number(s.price).toLocaleString()}</p>
                <button class="trip-card__btn" onclick="handleBook('${s.id}')">จอง</button>
            </div>
        </div>`;
    }).join("");
}

// ── Upcoming List ─────────────────────────────────────────────────
function renderUpcomingList(schedules) {
    const list = document.getElementById("upcoming-list");
    if (!list) return;

    const data = schedules || allSchedules.filter(s => s.driver_name);

    if (data.length === 0) {
        list.innerHTML = `<p style="font-family:var(--font-thai);color:var(--color-text-secondary);padding:16px">ยังไม่มีรอบที่กำลังจะออก</p>`;
        return;
    }

    list.innerHTML = data.map(s => {
        const depart = new Date(s.depart_time);
        const diff   = depart - Date.now();
        const mins   = Math.floor(diff / 60000);
        let badge = "";
        if (mins < 0)       badge = `<span class="upcoming-row__badge">ออกแล้ว</span>`;
        else if (mins < 30) badge = `<span class="upcoming-row__badge upcoming-row__badge--soon">ใกล้ออก ${mins} นาที</span>`;
        else if (mins < 60) badge = `<span class="upcoming-row__badge">ใกล้ออก ${mins} นาที</span>`;
        else                badge = `<span class="upcoming-row__badge">ออก ${Math.floor(mins/60)} ชม.</span>`;

        const timeStr = depart.toLocaleTimeString("th-TH", {
            hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok"
        });

        return `
        <div class="upcoming-row">
            ${badge}
            <div class="upcoming-row__info">
                <span class="upcoming-row__route">${s.origin} → ${s.destination}</span>
                <span class="upcoming-row__time">${depart.toLocaleDateString("th-TH")} · ${timeStr} น.</span>
            </div>
            <div class="upcoming-row__seats">
                <span class="upcoming-row__seats-count">${s.available_seats}</span>
                <span class="upcoming-row__seats-label">ที่นั่งเหลือ</span>
            </div>
            <button class="upcoming-row__btn" onclick="handleBook('${s.id}')">จอง</button>
        </div>`;
    }).join("");
}

// ── Search ────────────────────────────────────────────────────────
function doSearch() {
    const from = document.getElementById("field-from")?.value;
    const to   = document.getElementById("field-to")?.value;
    const date = document.getElementById("field-date")?.value;

    const resultsDiv = document.getElementById("search-results");
    const searchList = document.getElementById("search-list");
    const countEl    = document.getElementById("search-result-count");

    let filtered = allSchedules.filter(s => s.driver_name);
    if (from) filtered = filtered.filter(s => s.origin === from);
    if (to)   filtered = filtered.filter(s => s.destination === to);
    if (date) {
        filtered = filtered.filter(s => {
            const d = new Date(s.depart_time).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
            return d === date;
        });
    }

    // แสดงผลค้นหาเหนือ Most pickup
    resultsDiv.style.display = "block";
    resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    if (filtered.length === 0) {
        countEl.textContent = "ไม่พบรอบที่ตรงกัน";
        searchList.innerHTML = `<p style="font-family:var(--font-thai);color:var(--color-text-secondary);padding:16px 0">ลองเปลี่ยนเส้นทางหรือวันที่ใหม่</p>`;
        return;
    }

    countEl.textContent = `พบ ${filtered.length} รอบ`;
    // render ลงใน search-list ไม่ใช่ upcoming-list
    searchList.innerHTML = filtered.map(s => {
        const depart = new Date(s.depart_time);
        const diff   = depart - Date.now();
        const mins   = Math.floor(diff / 60000);
        let badge = "";
        if (mins < 0)       badge = `<span class="upcoming-row__badge">ออกแล้ว</span>`;
        else if (mins < 30) badge = `<span class="upcoming-row__badge upcoming-row__badge--soon">ใกล้ออก ${mins} นาที</span>`;
        else if (mins < 60) badge = `<span class="upcoming-row__badge">ใกล้ออก ${mins} นาที</span>`;
        else                badge = `<span class="upcoming-row__badge">ออก ${Math.floor(mins/60)} ชม.</span>`;
        const timeStr = depart.toLocaleTimeString("th-TH", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Bangkok" });
        return `
        <div class="upcoming-row">
            ${badge}
            <div class="upcoming-row__info">
                <span class="upcoming-row__route">${s.origin} → ${s.destination}</span>
                <span class="upcoming-row__time">${depart.toLocaleDateString("th-TH")} · ${timeStr} น.</span>
            </div>
            <div class="upcoming-row__seats">
                <span class="upcoming-row__seats-count">${s.available_seats}</span>
                <span class="upcoming-row__seats-label">ที่นั่งเหลือ</span>
            </div>
            <button class="upcoming-row__btn" onclick="handleBook('${s.id}')">จอง</button>
        </div>`;
    }).join("");
}

// ── handleBook ────────────────────────────────────────────────────
function handleBook(scheduleId) {
    if (!isLoggedIn()) { window.location.href = "login.html"; return; }
    window.location.href = `booking.html?schedule_id=${scheduleId}`;
}
window.handleBook = handleBook;

// ── Drawer ────────────────────────────────────────────────────────
function initDrawer() {
    const hamburger = document.getElementById("hamburger-btn");
    const drawer    = document.getElementById("nav-drawer");
    const overlay   = document.getElementById("drawer-overlay");
    const closeBtn  = document.getElementById("drawer-close");
    const open  = () => { drawer?.classList.add("open"); overlay?.classList.add("active"); document.body.style.overflow = "hidden"; };
    const close = () => { drawer?.classList.remove("open"); overlay?.classList.remove("active"); document.body.style.overflow = ""; };
    hamburger?.addEventListener("click", open);
    closeBtn?.addEventListener("click", close);
    overlay?.addEventListener("click", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

// ── Date ──────────────────────────────────────────────────────────
function initDate() {
    const dateInput = document.getElementById("field-date");
    if (!dateInput) return;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    dateInput.value = today;
    dateInput.min   = today;
}

// ── Swap ──────────────────────────────────────────────────────────
function initSwap() {
    document.getElementById("swap-btn")?.addEventListener("click", () => {
        const from = document.getElementById("field-from");
        const to   = document.getElementById("field-to");
        if (!from || !to) return;
        // ✅ เก็บค่าปัจจุบันก่อนสลับ
        const fromVal = from.value;
        const toVal   = to.value;
        from.value = toVal;
        to.value   = fromVal;
    });
}

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    renderNavbar();
    initDrawer();
    initSwap();
    initDate();
    loadData();
    document.getElementById("search-btn")?.addEventListener("click", doSearch);

    // ปุ่มล้างผลค้นหา
    document.getElementById("btn-clear-search")?.addEventListener("click", () => {
        document.getElementById("search-results").style.display = "none";
        document.getElementById("search-list").innerHTML = "";
        document.getElementById("field-from").value = "";
        document.getElementById("field-to").value   = "";
        initDate();
    });
    // กด Enter ค้นหาได้เลย
    ["field-from","field-to","field-date"].forEach(id => {
        document.getElementById(id)?.addEventListener("keydown", e => {
            if (e.key === "Enter") doSearch();
        });
    });
});