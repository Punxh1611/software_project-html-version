<<<<<<< HEAD
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
=======
// main.js — index.html
>>>>>>> dev/nwd

const API = "http://localhost:3000/api";

<<<<<<< HEAD
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const storage = getStorage(app);

// ════════════════════════════════════════════════════════════
// รูปประจำปลายทาง
// ════════════════════════════════════════════════════════════
const DESTINATION_IMAGES = {
  "พัทยา":    "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80",
  "ระยอง":    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
  "ชลบุรี":  "https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=600&q=80",
  "หัวหิน":  "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80",
  "เชียงใหม่":"https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=600&q=80",
  "ภูเก็ต":  "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&q=80",
  "กรุงเทพ": "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80",
};
const FALLBACK_IMG = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80";

function getDestImg(destination = "") {
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (destination.includes(key)) return url;
  }
  return FALLBACK_IMG;
}

// ════════════════════════════════════════════════════════════
// SVG Icons
// ════════════════════════════════════════════════════════════
=======
// ── SVG Icons ─────────────────────────────────────────────────────
>>>>>>> dev/nwd
const ICONS = {
    home:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    booking: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    promo:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 14l6-6M9.5 9.5h.01M14.5 14.5h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    login:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    logout:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    history: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
};

<<<<<<< HEAD
// ════════════════════════════════════════════════════════════
// Cache ทุก trips วันนี้ (home) + routes
// ════════════════════════════════════════════════════════════
let _allRoutes   = null;   // array of route docs { origin, destination, ... }
let _homeCache   = null;   // { mostPickup, upcoming }
let _homeCacheTs = 0;
const HOME_CACHE_TTL = 5 * 60 * 1000;

// โหลด routes ทั้งหมดครั้งเดียว (สำหรับ dropdown)
async function loadRoutes() {
  if (_allRoutes) return _allRoutes;
  const snap = await getDocs(collection(db, "routes"));
  _allRoutes = [];
  snap.forEach(d => _allRoutes.push({ id: d.id, ...d.data() }));
  return _allRoutes;
}

// โหลด trips ของวันที่กำหนด (ไม่ cache — ใช้ตอน search)
async function fetchTripsByDate(dateStr) {
  const snap = await getDocs(query(collection(db, "trips"), where("date", "==", dateStr)));
  const trips = [];
  snap.forEach(d => trips.push({ id: d.id, ...d.data() }));
  return trips;
}

// home data cache (วันนี้)
async function fetchHomeData() {
  const now = Date.now();
  if (_homeCache && now - _homeCacheTs < HOME_CACHE_TTL) return _homeCache;

  const todayStr = new Date().toISOString().slice(0, 10);
  const trips    = await fetchTripsByDate(todayStr);

  trips.sort((a, b) => {
    const ba = (a.totalSeats || 0) - (a.availableSeats || 0);
    const bb = (b.totalSeats || 0) - (b.availableSeats || 0);
    return bb - ba;
  });

  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const upcoming = trips
    .filter(t => t.status === "waiting" && t.time && t.time >= nowHHMM && (t.availableSeats || 0) > 0)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 5);

  _homeCache   = { mostPickup: trips.slice(0, 3), upcoming };
  _homeCacheTs = now;
  return _homeCache;
}

// ════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════
function minutesUntil(timeStr, dateStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const now    = new Date();
  const target = new Date(dateStr + "T" + timeStr);
  return Math.round((target - now) / 60000);
}

function formatCountdown(mins) {
  if (mins <= 0)  return "กำลังออก";
  if (mins < 60)  return `ใกล้ออก ${mins} น.`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `ใกล้ออก ${h} ชม. ${m} น.` : `ใกล้ออก ${h} ชม.`;
}

function formatDateThai(dateStr) {
  const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ════════════════════════════════════════════════════════════
// Render: Most Pickup Cards
// ════════════════════════════════════════════════════════════
function renderMostPickup(trips) {
  const grid = document.getElementById("most-pickup-grid");
  if (!grid) return;
  if (!trips.length) {
    grid.innerHTML = `<p style="color:#888;padding:1rem;">ยังไม่มีรอบวันนี้</p>`;
    return;
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  grid.innerHTML = trips.map((t, i) => {
    const dest     = t.destination || "ปลายทาง";
    const imgUrl   = getDestImg(dest);
    const booked   = (t.totalSeats || 0) - (t.availableSeats || 0);
    const mins     = t.time ? minutesUntil(t.time, todayStr) : null;
    const featured = i === 0 ? "trip-card--featured" : "";
    const countdown = mins !== null && mins >= 0 && mins < 90
      ? `<span class="trip-card__countdown">${formatCountdown(mins)}</span>` : "";
    return `
      <div class="trip-card ${featured}">
        <div class="trip-card__img-wrapper">
          <img src="${imgUrl}" alt="${dest}" class="trip-card__img" onerror="this.src='${FALLBACK_IMG}'">
          ${countdown}
        </div>
        <div class="trip-card__body">
          <h3 class="trip-card__name">${dest}</h3>
          <p class="trip-card__time">รอบเดินทาง : ${t.time || "--:--"}</p>
          <p class="trip-card__booked">${booked} ที่จองแล้ว · เหลือ ${t.availableSeats ?? "-"} ที่</p>
          <button class="trip-card__btn" data-trip-id="${t.id}">จอง</button>
        </div>
      </div>`;
  }).join("");
}

// ════════════════════════════════════════════════════════════
// Render: Upcoming List
// ════════════════════════════════════════════════════════════
function renderUpcoming(trips) {
  const list = document.getElementById("upcoming-list");
  if (!list) return;
  if (!trips.length) {
    list.innerHTML = `<p style="color:#888;padding:1rem;">ไม่มีรอบที่ใกล้ออกในขณะนี้</p>`;
    return;
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  list.innerHTML = trips.map(t => {
    const mins      = minutesUntil(t.time, todayStr);
    const countdown = formatCountdown(mins);
    const isSoon    = mins >= 0 && mins < 30;
    const route     = `${t.origin || "ต้นทาง"} → ${t.destination || "ปลายทาง"}`;
    return `
      <div class="upcoming-row">
        <span class="upcoming-row__badge ${isSoon ? "upcoming-row__badge--soon" : ""}">${countdown}</span>
        <div class="upcoming-row__info">
          <span class="upcoming-row__route">${route}</span>
          <span class="upcoming-row__time">วันนี้ · ${t.time} น.</span>
        </div>
        <div class="upcoming-row__seats">
          <span class="upcoming-row__seats-count">${t.availableSeats ?? "-"}</span>
          <span class="upcoming-row__seats-label">ที่นั่งเหลือ</span>
        </div>
        <button class="upcoming-row__btn" data-trip-id="${t.id}">จอง</button>
      </div>`;
  }).join("");
}

// ════════════════════════════════════════════════════════════
// Render: Search Results
// ════════════════════════════════════════════════════════════
function renderSearchResults(trips, origin, dest, dateStr) {
  const section   = document.getElementById("search-results");
  const titleEl   = document.getElementById("search-results-title");
  const subtitleEl= document.getElementById("search-results-subtitle");
  const listEl    = document.getElementById("search-results-list");
  if (!section || !listEl) return;

  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth", block: "start" });

  titleEl.textContent    = `${origin || "ต้นทาง"} → ${dest || "ปลายทาง"}`;
  subtitleEl.textContent = `${formatDateThai(dateStr)} · พบ ${trips.length} รอบ`;

  if (!trips.length) {
    listEl.innerHTML = `
      <div class="search-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="opacity:.3;margin-bottom:.75rem">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
          <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <p>ไม่พบรอบเดินทางที่ตรงเงื่อนไข</p>
        <small>ลองเปลี่ยนวันที่หรือเส้นทาง</small>
      </div>`;
    return;
  }

  const sorted = [...trips].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  listEl.innerHTML = sorted.map(t => {
    const imgUrl  = getDestImg(t.destination || "");
    const booked  = (t.totalSeats || 0) - (t.availableSeats || 0);
    const mins    = t.time ? minutesUntil(t.time, dateStr) : null;
    const isToday = dateStr === new Date().toISOString().slice(0, 10);
    const countdownHTML = isToday && mins !== null && mins >= 0 && mins < 120
      ? `<span class="result-card__countdown ${mins < 30 ? "result-card__countdown--soon" : ""}">${formatCountdown(mins)}</span>` : "";
    const available = t.availableSeats ?? 0;
    const statusClass = available === 0 ? "result-card__seats--full" : available <= 3 ? "result-card__seats--low" : "";
    const seatLabel   = available === 0 ? "เต็มแล้ว" : `เหลือ ${available} ที่`;

    return `
      <div class="result-card">
        <div class="result-card__img-wrap">
          <img src="${imgUrl}" alt="${t.destination}" class="result-card__img" onerror="this.src='${FALLBACK_IMG}'">
        </div>
        <div class="result-card__body">
          <div class="result-card__top">
            <div>
              <p class="result-card__route">${t.origin || "-"} → ${t.destination || "-"}</p>
              <p class="result-card__time">${t.time || "--:--"} น. · ${formatDateThai(dateStr)}</p>
            </div>
            ${countdownHTML}
          </div>
          <div class="result-card__bottom">
            <div class="result-card__meta">
              <span class="result-card__price">฿${(t.price || 0).toLocaleString()}</span>
              <span class="result-card__seats ${statusClass}">${seatLabel}</span>
              <span class="result-card__booked">${booked} ที่จองแล้ว</span>
            </div>
            <button class="result-card__btn" ${available === 0 ? "disabled" : ""} data-trip-id="${t.id}">
              ${available === 0 ? "เต็มแล้ว" : "จอง"}
            </button>
          </div>
        </div>
      </div>`;
  }).join("");
}

// ════════════════════════════════════════════════════════════
// Search bar state
// ════════════════════════════════════════════════════════════
let searchState = {
  origin: "กรุงเทพ",
  dest:   "พัทยา",
  date:   new Date().toISOString().slice(0, 10),
};

function updateDateLabel(inputId, labelId, dateStr) {
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  let label = formatDateThai(dateStr);
  if (dateStr === today)    label = `วันนี้ · ${label}`;
  if (dateStr === tomorrow) label = `พรุ่งนี้ · ${label}`;
  const el = document.getElementById(labelId);
  if (el) el.textContent = label;
}

// dropdown สำหรับ origin/dest
function buildDropdown(dropdownId, routes, field) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  // unique cities
  const cities = [...new Set(routes.map(r => field === "origin" ? r.origin : r.destination).filter(Boolean))].sort();

  dropdown.innerHTML = cities.map(city => `
    <div class="hero__dropdown-item" data-value="${city}">${city}</div>
  `).join("");

  dropdown.querySelectorAll(".hero__dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = item.dataset.value;
      if (field === "origin") {
        searchState.origin = val;
        document.getElementById("origin-city").textContent = val;
        document.getElementById("origin-code").textContent = "";
      } else {
        searchState.dest = val;
        document.getElementById("dest-city").textContent = val;
        document.getElementById("dest-code").textContent = "";
      }
      dropdown.classList.remove("open");
    });
  });
}

function initSearchBar(routes) {
  // ── Origin dropdown ──
  const originDisplay  = document.getElementById("origin-display");
  const originDropdown = document.getElementById("origin-dropdown");
  buildDropdown("origin-dropdown", routes, "origin");

  originDisplay?.addEventListener("click", (e) => {
    e.stopPropagation();
    originDropdown?.classList.toggle("open");
    document.getElementById("dest-dropdown")?.classList.remove("open");
  });

  // ── Dest dropdown ──
  const destDisplay  = document.getElementById("dest-display");
  const destDropdown = document.getElementById("dest-dropdown");
  buildDropdown("dest-dropdown", routes, "destination");

  destDisplay?.addEventListener("click", (e) => {
    e.stopPropagation();
    destDropdown?.classList.toggle("open");
    document.getElementById("origin-dropdown")?.classList.remove("open");
  });

  // close dropdown on outside click
  document.addEventListener("click", () => {
    originDropdown?.classList.remove("open");
    destDropdown?.classList.remove("open");
  });

  // ── Swap ──
  document.getElementById("swap-btn")?.addEventListener("click", () => {
    [searchState.origin, searchState.dest] = [searchState.dest, searchState.origin];
    document.getElementById("origin-city").textContent = searchState.origin;
    document.getElementById("dest-city").textContent   = searchState.dest;
  });

  // ── Depart date ──
  const departInput = document.getElementById("depart-date-input");
  const fieldDate   = document.getElementById("field-date");
  if (departInput) {
    departInput.value = searchState.date;
    departInput.min   = new Date().toISOString().slice(0, 10);
    updateDateLabel("depart-date-input", "depart-date-label", searchState.date);

    // กดที่ field div → เปิด date picker
    fieldDate?.addEventListener("click", () => {
      try { departInput.showPicker(); } catch { departInput.click(); }
    });

    departInput.addEventListener("change", () => {
      searchState.date = departInput.value;
      updateDateLabel("depart-date-input", "depart-date-label", searchState.date);
      const returnInput = document.getElementById("return-date-input");
      if (returnInput && returnInput.value && returnInput.value < searchState.date) {
        returnInput.value = "";
        document.getElementById("return-date-label").textContent = "เลือกวัน";
      }
      if (returnInput) returnInput.min = searchState.date;
    });
  }

  // ── Round-trip checkbox ──
  const roundtrip   = document.getElementById("roundtrip");
  const returnInput = document.getElementById("return-date-input");
  const fieldReturn = document.getElementById("field-return");

  roundtrip?.addEventListener("change", () => {
    if (returnInput) returnInput.disabled = !roundtrip.checked;
    const label = document.getElementById("return-date-label");
    if (!roundtrip.checked && label) label.textContent = "เลือกวัน";
  });

  // กดที่ field return div → เปิด date picker (ถ้า checkbox ติ๊กแล้ว)
  fieldReturn?.addEventListener("click", (e) => {
    if (e.target === roundtrip || e.target === document.querySelector("label[for='roundtrip']")) return;
    if (!roundtrip?.checked) return;
    try { returnInput?.showPicker(); } catch { returnInput?.click(); }
  });

  returnInput?.addEventListener("change", () => {
    updateDateLabel("return-date-input", "return-date-label", returnInput.value);
  });

  // ── Search button ──
  document.getElementById("search-btn")?.addEventListener("click", async () => {
    const btn = document.getElementById("search-btn");
    btn.style.opacity = "0.6";
    btn.style.pointerEvents = "none";
    try {
      const trips = await fetchTripsByDate(searchState.date);
      // กรองตาม origin และ dest
      const filtered = trips.filter(t => {
        const matchOrigin = !searchState.origin || (t.origin || "").includes(searchState.origin) || searchState.origin.includes(t.origin || "");
        const matchDest   = !searchState.dest   || (t.destination || "").includes(searchState.dest) || searchState.dest.includes(t.destination || "");
        return matchOrigin && matchDest;
      });
      renderSearchResults(filtered, searchState.origin, searchState.dest, searchState.date);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      btn.style.opacity = "";
      btn.style.pointerEvents = "";
    }
  });
}

// ════════════════════════════════════════════════════════════
// Auth State
// ════════════════════════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc  = await getDoc(doc(db, "user", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const username = userData.username || user.email;
    const photoURL = userData.photoURL || null;
    renderLoggedIn(user, username, photoURL);
  } else {
    renderLoggedOut();
  }
});

function renderLoggedOut() {
  const navDesktop = document.getElementById("nav-actions-desktop");
  const navMobile  = document.getElementById("nav-drawer-links");
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

function renderLoggedIn(user, username, photoURL) {
  const navDesktop = document.getElementById("nav-actions-desktop");
  const navMobile  = document.getElementById("nav-drawer-links");
  if (!navDesktop || !navMobile) return;
=======
// ── Auth ──────────────────────────────────────────────────────────
const getUser    = () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } };
const getToken   = () => localStorage.getItem("token");
const isLoggedIn = () => !!getToken() && !!getUser();

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
>>>>>>> dev/nwd

        if (navDesktop) navDesktop.innerHTML = `
            <a class="navbar__a" href="history.html">Booking</a>
            <a class="navbar__a" href="#">Promotion</a>
            <div class="navbar__avatar" title="${user.username}">${avatarHTML}</div>
            <span class="navbar__username">${user.username}</span>
            <button class="navbar__logout-btn" id="btn-logout">ออกจากระบบ</button>
        `;

<<<<<<< HEAD
  navDesktop.innerHTML = `
    <a class="navbar__a" href="#">Booking</a>
    <a class="navbar__a" href="#">Promotion</a>
    <div class="navbar__avatar navbar__avatar--clickable" id="avatar-btn">${avatarHTML}</div>
    <span class="navbar__username">${username}</span>
    <button class="navbar__logout-btn" id="btn-logout">ออกจากระบบ</button>
    <input type="file" id="avatar-upload" accept="image/*" style="display:none">
  `;
  navMobile.innerHTML = `
    <div class="drawer__user-card">
      <div class="drawer__user-avatar">${avatarHTML}</div>
      <div class="drawer__user-info">
        <span class="drawer__user-name">${username}</span>
        <span class="drawer__user-email">${user.email}</span>
      </div>
    </div>
    <div class="drawer__divider"></div>
    <a class="drawer__link" href="index.html">${ICONS.home}<span>หน้าแรก</span></a>
    <a class="drawer__link" href="#">${ICONS.booking}<span>การจองของฉัน</span></a>
    <a class="drawer__link" href="#">${ICONS.promo}<span>Promotion</span></a>
    <div class="drawer__divider"></div>
    <button class="drawer__link drawer__link--logout" id="btn-logout-mobile">${ICONS.logout}<span>ออกจากระบบ</span></button>
  `;

  document.getElementById("btn-logout")?.addEventListener("click", () => signOut(auth));
  document.getElementById("btn-logout-mobile")?.addEventListener("click", () => signOut(auth));

  const avatarBtn = document.getElementById("avatar-btn");
  const fileInput = document.getElementById("avatar-upload");
  avatarBtn?.addEventListener();
  fileInput?.addEventListener();
}

// ════════════════════════════════════════════════════════════
// Hamburger / Drawer
// ════════════════════════════════════════════════════════════
function initDrawer() {
  const hamburger   = document.getElementById("hamburger-btn");
  const drawer      = document.getElementById("nav-drawer");
  const overlay     = document.getElementById("drawer-overlay");
  const drawerClose = document.getElementById("drawer-close");
  const openDrawer  = () => { drawer?.classList.add("open"); overlay?.classList.add("active"); document.body.style.overflow = "hidden"; };
  const closeDrawer = () => { drawer?.classList.remove("open"); overlay?.classList.remove("active"); document.body.style.overflow = ""; };
  hamburger?.addEventListener("click", openDrawer);
  drawerClose?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);
}

// ════════════════════════════════════════════════════════════
// DOMContentLoaded — init ทุกอย่าง
// ════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", async () => {
  initDrawer();

  // โหลด routes และ home data พร้อมกัน (2 reads ต่อ session)
  try {
    const [routes, homeData] = await Promise.all([loadRoutes(), fetchHomeData()]);
    initSearchBar(routes);
    renderMostPickup(homeData.mostPickup);
    renderUpcoming(homeData.upcoming);
  } catch (err) {
    console.error("โหลดข้อมูลหน้าแรกไม่สำเร็จ:", err);
  }
});
=======
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

// ── โหลด Routes + Schedules ───────────────────────────────────────
let allRoutes    = [];
let allSchedules = [];

async function loadData() {
    try {
        const [routesRes, schedulesRes] = await Promise.all([
            fetch(`${API}/routes`),
            fetch(`${API}/schedules`)
        ]);

        allRoutes    = (await routesRes.json()).data    || [];
        allSchedules = (await schedulesRes.json()).data || [];

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
function renderTripCards() {
    const grid = document.getElementById("trip-grid");
    if (!grid) return;

    // ใช้ schedules ที่มีคนขับ 3 อันแรก
    const featured = allSchedules.filter(s => s.driver_name).slice(0, 3);

    if (featured.length === 0) {
        grid.innerHTML = `<p style="font-family:var(--font-thai);color:var(--color-text-secondary)">ยังไม่มีรอบรถในขณะนี้</p>`;
        return;
    }

    const colors = ["355872", "4A6D8C", "2C4A6E"];
    grid.innerHTML = featured.map((s, i) => `
        <div class="trip-card ${i === 0 ? 'trip-card--featured' : ''}">
            <div class="trip-card__img-wrapper">
                <img src="https://placehold.co/277x169/${colors[i % 3]}/white?text=${s.destination}"
                     alt="${s.destination}" class="trip-card__img"
                     onerror="this.parentElement.innerHTML='<div class=trip-card__img-placeholder></div>'">
            </div>
            <div class="trip-card__body">
                <h3 class="trip-card__name">${s.destination}</h3>
                <p class="trip-card__time">จาก ${s.origin} · ฿${Number(s.price).toLocaleString()}</p>
                <button class="trip-card__btn"
                    onclick="handleBook('${s.id}')">
                    จอง
                </button>
            </div>
        </div>
    `).join("");
}

// ── Upcoming list ─────────────────────────────────────────────────
function renderUpcomingList() {
    const list = document.getElementById("upcoming-list");
    if (!list) return;

    const upcoming = allSchedules.filter(s => s.driver_name).slice(0, 5);

    if (upcoming.length === 0) {
        list.innerHTML = `<p style="font-family:var(--font-thai);color:var(--color-text-secondary);padding:16px">ยังไม่มีรอบที่กำลังจะออก</p>`;
        return;
    }

    list.innerHTML = upcoming.map(s => {
        const depart = new Date(s.depart_time);
        const diff   = depart - Date.now();
        const mins   = Math.floor(diff / 60000);
        let badge = "";
        if (mins < 30)       badge = `<span class="upcoming-row__badge upcoming-row__badge--soon">ใกล้ออก ${mins} นาที</span>`;
        else if (mins < 60)  badge = `<span class="upcoming-row__badge">ใกล้ออก ${mins} นาที</span>`;
        else                 badge = `<span class="upcoming-row__badge">ออก ${Math.floor(mins/60)} ชม.</span>`;

        const timeStr = depart.toLocaleTimeString("th-TH", { hour:"2-digit", minute:"2-digit" });

        return `
            <div class="upcoming-row">
                ${badge}
                <div class="upcoming-row__info">
                    <span class="upcoming-row__route">${s.origin} → ${s.destination}</span>
                    <span class="upcoming-row__time">วันนี้ · ${timeStr} น.</span>
                </div>
                <div class="upcoming-row__seats">
                    <span class="upcoming-row__seats-count">${s.available_seats}</span>
                    <span class="upcoming-row__seats-label">ที่นั่งเหลือ</span>
                </div>
                <button class="upcoming-row__btn" onclick="handleBook('${s.id}')">จอง</button>
            </div>
        `;
    }).join("");
}

// ── Search ────────────────────────────────────────────────────────
function doSearch() {
    const from = document.getElementById("field-from")?.value;
    const to   = document.getElementById("field-to")?.value;
    const date = document.getElementById("field-date")?.value;

    let filtered = allSchedules.filter(s => s.driver_name);
    if (from) filtered = filtered.filter(s => s.origin === from);
    if (to)   filtered = filtered.filter(s => s.destination === to);
    if (date) filtered = filtered.filter(s => {
        const d = new Date(s.depart_time).toISOString().split("T")[0];
        return d === date;
    });

    // แสดงผลใน upcoming list
    const list = document.getElementById("upcoming-list");
    if (!list) return;

    if (filtered.length === 0) {
        list.innerHTML = `<p style="font-family:var(--font-thai);color:var(--color-text-secondary);padding:16px 0">ไม่พบรอบที่ตรงกัน</p>`;
        return;
    }

    allSchedules = filtered;
    renderUpcomingList();
}

// ── handleBook ────────────────────────────────────────────────────
function handleBook(scheduleId) {
    if (!isLoggedIn()) {
        window.location.href = `login.html`;
        return;
    }
    window.location.href = `booking.html?schedule_id=${scheduleId}`;
}
window.handleBook = handleBook;

// ── Drawer ────────────────────────────────────────────────────────
function initDrawer() {
    const hamburger  = document.getElementById("hamburger-btn");
    const drawer     = document.getElementById("nav-drawer");
    const overlay    = document.getElementById("drawer-overlay");
    const closeBtn   = document.getElementById("drawer-close");

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
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    dateInput.min   = today;
}

// ── Swap ──────────────────────────────────────────────────────────
function initSwap() {
    document.getElementById("swap-btn")?.addEventListener("click", () => {
        const from = document.getElementById("field-from");
        const to   = document.getElementById("field-to");
        if (!from || !to) return;
        const tmp  = from.value;
        from.value = to.value;
        to.value   = tmp;
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
});
>>>>>>> dev/nwd
