// ==========================================
// 🚀 ZONE 1: Import & Firebase Setup
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, getDocs, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBO40doAV5CKMPdg7rreqtWgXq9hxJgAMk",
    authDomain: "vanvan-90cd0.firebaseapp.com",
    projectId: "vanvan-90cd0",
    storageBucket: "vanvan-90cd0.firebasestorage.app",
    messagingSenderId: "234295405835",
    appId: "1:234295405835:web:b5c3e7842f979af686460e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ==========================================
// 👤 ZONE 2: Authentication (Login/Logout)
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "user", user.uid));
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
    const navMobile = document.getElementById("nav-drawer-links");
    const loggedOutHTML = `
        <a href="#" class="navbar__a">Home</a>
        <a href="#" class="navbar__a">My Bookings</a>
        <a href="#" class="navbar__a">Modify Ticket</a>
        <a href="#" class="navbar__a">Cancel Ticket</a>
      
        <a href="#" class="navbar__a">Help Center</a>
        <a class="navbar__contact-btn" href="login.html">Login</a>
    `;
    if (navDesktop) navDesktop.innerHTML = loggedOutHTML;
    if (navMobile) navMobile.innerHTML = loggedOutHTML;
}

function renderLoggedIn(user, username, photoURL) {
    const navDesktop = document.getElementById("nav-actions-desktop");
    const navMobile = document.getElementById("nav-drawer-links");
    if (!navDesktop || !navMobile) return;

    const avatarHTML = photoURL
        ? `<img src="${photoURL}" class="navbar__avatar-img" id="user-photo" alt="avatar" onerror="this.src='default-avatar.png'">`
        : `<div class="navbar__avatar-initials">${username.charAt(0).toUpperCase()}</div>`;

    navDesktop.innerHTML = `
        <a href="#" class="navbar__a">Home</a>
        <a href="#" class="navbar__a">My Bookings</a>
        <a href="#" class="navbar__a">Modify Ticket</a>
        <a href="#" class="navbar__a">Cancel Ticket</a>
    
        <a href="#" class="navbar__a">Help Center</a>
        <span class="navbar__username" style="margin-left: 10px;">${username}</span>
        <div class="navbar__avatar navbar__avatar--clickable" id="avatar-btn" style="margin: 0 10px;">
            ${avatarHTML}
            <div class="navbar__avatar-overlay"></div>
        </div>
        <button class="navbar__logout-btn" id="btn-logout">Logout</button>
        <input type="file" id="avatar-upload" accept="image/*" style="display:none">
    `;

    navMobile.innerHTML = `
        <div class="drawer__user" style="padding: 15px; border-bottom: 1px solid #eee;">
            <div class="drawer__avatar" style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden;">
                ${avatarHTML}
            </div>
            <span class="drawer__username" style="display: block; margin-top: 5px; font-weight: bold;">${username}</span>
        </div>
        <a class="drawer__link" href="#">Booking</a>
        <a class="drawer__link" href="#">Promotion</a>
        <button class="drawer__link drawer__link--logout" id="btn-logout-mobile" style="color: red; width: 100%; text-align: left;">Logout</button>
    `;

    document.getElementById("btn-logout")?.addEventListener("click", () => signOut(auth));
    document.getElementById("btn-logout-mobile")?.addEventListener("click", () => signOut(auth));
}

// ==========================================
// 🔍 ZONE 3: UI & Search Bar (Flatpickr & Dropdown)
// ==========================================
let currentFilter = null;

// 3.0 ข้อมูลเส้นทางจำแนกตามอาคาร
const destinationsByTerminal = {
    "A": ["นครสวรรค์", "พิษณุโลก", "กำแพงเพชร", "เพชรบูรณ์", "อุทัยธานี", "นครราชสีมา", "สระบุรี", "ลพบุรี", "ชัยภูมิ", "บุรีรัมย์"],
    "B": ["อยุธยา", "สุพรรณบุรี", "นครปฐม", "สิงห์บุรี", "ชัยนาท"],
    "C": ["พัทยา", "สัตหีบ", "ระยอง", "จันทบุรี", "ตราด", "ฉะเชิงเทรา", "ปราจีนบุรี", "สระแก้ว"],
    "D": ["กาญจนบุรี", "ราชบุรี", "หัวหิน", "อัมพวา", "มหาชัย"]
};

document.addEventListener("DOMContentLoaded", () => {
    // 3.1 เปิดใช้งาน Flatpickr
    const dateInput = document.getElementById("search-date");
    if (dateInput) {
        flatpickr(dateInput, {
            locale: "th",
            minDate: "today",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "j F Y",
            disableMobile: true,
            defaultDate: "today"
        });
    }

    // 3.2 Custom Dropdown: อาคาร (สายรถ)
    const terminalInput = document.getElementById("search-terminal");
    const terminalDropdown = document.getElementById("terminal-dropdown");
    const terminalWrapper = document.getElementById("terminal-dropdown-wrapper");

    const destInput = document.getElementById("search-dest");
    const destDropdown = document.getElementById("dest-dropdown");
    const destWrapper = document.getElementById("dest-dropdown-wrapper");

    // เปิด/ปิด dropdown อาคาร — ทั้ง input และ wrapper
    function openTerminalDropdown(e) {
        // ถ้าคลิกที่ dropdown option ให้ข้าม (ไม่ toggle)
        if (e.target.closest('.custom-dropdown')) return;
        e.stopPropagation();
        closeAllDropdowns();
        terminalDropdown.classList.toggle("active");
        terminalWrapper.classList.toggle("dropdown-open");
    }
    terminalInput?.addEventListener("click", openTerminalDropdown);
    terminalWrapper?.addEventListener("click", openTerminalDropdown);

    // เลือก option อาคาร
    terminalDropdown?.querySelectorAll(".custom-dropdown__option").forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            const value = opt.dataset.value;
            const label = opt.querySelector(".custom-dropdown__label").textContent;
            const desc = opt.querySelector(".custom-dropdown__desc").textContent;

            // ลบ selected จากอื่น
            terminalDropdown.querySelectorAll(".custom-dropdown__option").forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");

            terminalInput.value = `${label} (${desc})`;
            terminalInput.dataset.value = value;
            terminalDropdown.classList.remove("active");
            terminalWrapper.classList.remove("dropdown-open");

            // อัพเดต destination dropdown
            populateDestDropdown(value);
        });
    });

    function populateDestDropdown(terminal) {
        const destinations = destinationsByTerminal[terminal] || [];
        destDropdown.innerHTML = "";
        destinations.forEach(dest => {
            const opt = document.createElement("div");
            opt.className = "custom-dropdown__option";
            opt.dataset.value = dest;
            opt.innerHTML = `
                <span class="custom-dropdown__icon">📍</span>
                <div class="custom-dropdown__text">
                    <span class="custom-dropdown__label">${dest}</span>
                </div>
            `;
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                destDropdown.querySelectorAll(".custom-dropdown__option").forEach(o => o.classList.remove("selected"));
                opt.classList.add("selected");
                destInput.value = dest;
                destInput.dataset.value = dest;
                destDropdown.classList.remove("active");
                destWrapper.classList.remove("dropdown-open");
            });
            destDropdown.appendChild(opt);
        });

        destInput.disabled = false;
        destInput.value = "";
        destInput.placeholder = "เลือกจุดลงรถ...";
        destInput.style.color = "var(--color-black)";
        destInput.style.fontWeight = "600";
    }

    // เปิด/ปิด dropdown ปลายทาง — ทั้ง input และ wrapper
    function openDestDropdown(e) {
        if (destInput.disabled) return;
        if (e.target.closest('.custom-dropdown')) return;
        e.stopPropagation();
        closeAllDropdowns();
        destDropdown.classList.toggle("active");
        destWrapper.classList.toggle("dropdown-open");
    }
    destInput?.addEventListener("click", openDestDropdown);
    destWrapper?.addEventListener("click", openDestDropdown);

    // ปิด dropdown เมื่อกดที่อื่น
    document.addEventListener("click", () => {
        closeAllDropdowns();
    });

    function closeAllDropdowns() {
        document.querySelectorAll(".custom-dropdown.active").forEach(d => d.classList.remove("active"));
        document.querySelectorAll(".dropdown-open").forEach(d => d.classList.remove("dropdown-open"));
    }

    // 3.3 ระบบปุ่มค้นหา (Search Logic)
    const btnSearch = document.getElementById("btn-search");
    const originInput = document.getElementById("search-origin");

    btnSearch?.addEventListener("click", () => {
        const origin = originInput ? originInput.value.trim() : "หมอชิต 2";
        const dest = destInput?.dataset?.value || destInput?.value?.trim();

        if (!origin || !dest || !dateInput.value) {
            alert("กรุณาเลือกอาคาร จุดลงรถ และวันที่เดินทางให้ครบถ้วนก่อนค้นหาครับ");
            return;
        }

        let dateStr = "";
        if (dateInput._flatpickr && dateInput._flatpickr.selectedDates.length > 0) {
            const dateObj = dateInput._flatpickr.selectedDates[0];
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
        } else {
            dateStr = dateInput.value;
        }

        currentFilter = { origin, destination: dest, date: dateStr };

        const upcomingSec = document.querySelector(".upcoming-section");
        if (upcomingSec) upcomingSec.style.display = "block";

        renderTrips();
    });

    // 3.5 ฟังก์ชันเคลียร์การค้นหา (global)
    window.clearSearch = function () {
        currentFilter = null;
        showAllTrips = false;

        // รีเซ็ต input fields
        if (terminalInput) {
            terminalInput.value = "";
            terminalInput.dataset.value = "";
        }
        if (destInput) {
            destInput.value = "";
            destInput.dataset.value = "";
            destInput.disabled = true;
            destInput.placeholder = "รอเลือกอาคาร...";
        }
        // รีเซ็ตวันที่เป็นวันนี้
        if (dateInput._flatpickr) {
            dateInput._flatpickr.setDate(new Date(), true);
        }
        // ลบ selected จาก dropdowns
        terminalDropdown?.querySelectorAll(".custom-dropdown__option").forEach(o => o.classList.remove("selected"));
        destDropdown?.querySelectorAll(".custom-dropdown__option").forEach(o => o.classList.remove("selected"));

        // รีเซ็ตปุ่ม toggle
        const toggleBtn = document.getElementById("btn-view-all-upcoming");
        if (toggleBtn) toggleBtn.textContent = "ดูรอบรถทั้งหมด";

        renderTrips();

        // Scroll กลับขึ้นด้านบน
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 3.4 Hamburger Drawer
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navDrawer = document.getElementById("nav-drawer");
    const drawerOverlay = document.getElementById("drawer-overlay");
    const drawerClose = document.getElementById("drawer-close");

    hamburgerBtn?.addEventListener("click", () => {
        navDrawer?.classList.add("open");
        drawerOverlay?.classList.add("open");
    });

    drawerClose?.addEventListener("click", () => {
        navDrawer?.classList.remove("open");
        drawerOverlay?.classList.remove("open");
    });

    drawerOverlay?.addEventListener("click", () => {
        navDrawer?.classList.remove("open");
        drawerOverlay?.classList.remove("open");
    });

}); // END DOMContentLoaded

// ==========================================
// 🚐 ZONE 4: Database Listener & Rendering
// ==========================================
let allTrips = [];
let showAllTrips = false;

onSnapshot(collection(db, "trips"), (querySnapshot) => {
    allTrips = [];
    querySnapshot.forEach((docSnap) => {
        allTrips.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderTrips();
    renderPopularRoutes();
});

function calculateArrivalTime(startTime, price) {
    const durationMinutes = Math.floor(price * 1.2);
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + durationMinutes, 0);
    const endHours = String(date.getHours()).padStart(2, '0');
    const endMins = String(date.getMinutes()).padStart(2, '0');
    return `${endHours}:${endMins}`;
}

// ปุ่ม "ดูรอบรถทั้งหมด / แสดงน้อยลง"
window.toggleAllTrips = function () {
    showAllTrips = !showAllTrips; // สลับค่าไปมา (True/False)
    renderTrips(); // สั่งให้ระบบคำนวณและวาดปุ่มใหม่เอง
};

function renderTrips() {
    const tripGrid = document.querySelector(".trip-grid");
    if (!tripGrid) return;

    tripGrid.innerHTML = "";

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHourMin = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    let displayData = [];
    let filteredTrips = []; // 🟢 เพิ่มตัวแปรนี้เพื่อเก็บรถที่ผ่านเงื่อนไขทั้งหมดก่อนตัด 6 คัน

    const promoBanner = document.querySelector(".promo-banner");
    const quickRoutes = document.querySelector(".quick-routes");
    const howItWorks = document.querySelector(".how-it-works");
    const serviceHighlights = document.querySelector(".service-highlights");

    if (currentFilter) {
        document.getElementById("main-list-title").innerHTML = `🔍 ผลการค้นหา`;
        document.getElementById("main-list-subtitle").innerHTML = `
            <div class="search-title-flex">
                <span class="search-title-text">
                    📍 ${currentFilter.origin} ➔ ${currentFilter.destination} | 📅 วันที่ ${currentFilter.date}
                </span>
                <button class="btn-clear-filter-themed" onclick="window.clearSearch()">
                    ✕ ล้างผลค้นหา
                </button>
            </div>
        `;
        if (promoBanner) promoBanner.style.display = "none";
        if (quickRoutes) quickRoutes.style.display = "none";
        if (howItWorks) howItWorks.style.display = "none";
        if (serviceHighlights) serviceHighlights.style.display = "none";

        // 🟢 โหมดค้นหา: ดึงรถตามวันที่และเส้นทางที่เลือก
        filteredTrips = allTrips.filter(trip => {
            const isMatch = (trip.origin?.trim() === currentFilter.origin) &&
                            (trip.destination?.trim() === currentFilter.destination) &&
                            (trip.date === currentFilter.date);
            if (!isMatch) return false;
            // ถ้ารถเป็นของวันนี้ เช็คว่าเวลายังไม่ผ่านไป
            if (trip.date === todayStr) return trip.time >= currentHourMin; 
            if (trip.date < todayStr) return false; 
            return true;
        }).sort((a, b) => a.time.localeCompare(b.time));
        
    } else {
        document.getElementById("main-list-title").innerText = "🚐 รอบที่ใกล้ออก";
        document.getElementById("main-list-subtitle").innerText = "รอบเดินทางภายใน 1 ชั่วโมงนี้";

        if (promoBanner) promoBanner.style.display = "";
        if (quickRoutes) quickRoutes.style.display = "";
        if (howItWorks) howItWorks.style.display = "";
        if (serviceHighlights) serviceHighlights.style.display = "";

        // 🟢 โหมดหน้าแรก: ดึงเฉพาะรถที่กำลังจะออกภายใน 1 ชั่วโมง
        const nowMs = now.getTime(); // เวลาปัจจุบัน (มิลลิวินาที)
        const oneHourLaterMs = nowMs + (60 * 60 * 1000); // เวลาบวกไปอีก 1 ชั่วโมง (60 นาที * 60 วินาที * 1000 มิลลิวินาที)

        filteredTrips = allTrips.filter(trip => {
            // แปลงวันที่และเวลาของรอบรถแต่ละคันให้เป็น Timestamp
            const tripDateTime = new Date(`${trip.date}T${trip.time}:00`);
            const tripMs = tripDateTime.getTime();
            
            // เช็คว่า: รถต้องยังไม่ออก (>= เวลาปัจจุบัน) และ ต้องออกภายใน 1 ชั่วโมง (<= เวลาอีก 1 ชม.ข้างหน้า)
            return tripMs >= nowMs && tripMs <= oneHourLaterMs;
            
        }).sort((a, b) => {
            if (a.date === b.date) return a.time.localeCompare(b.time);
            return a.date.localeCompare(b.date);
        });
    }
    // ==========================================
    // 🟢 โลจิกปุ่ม "ดูรอบรถทั้งหมด" (ใช้ร่วมกันทั้งหน้าแรกและตอนค้นหา)
    // ==========================================
    
    // ถ้ากดดูทั้งหมด ให้โชว์เต็มๆ แต่ถ้าไม่ได้กด ให้ตัดมาแค่ 6 รอบ
    displayData = showAllTrips ? filteredTrips : filteredTrips.slice(0, 6);

    const actionsWrapper = document.getElementById("upcoming-actions-wrapper");
    const btnViewAll = document.getElementById("btn-view-all-upcoming");
    
    if (actionsWrapper && btnViewAll) {
        // ถ้ารอบรถรวมทั้งหมดมีมากกว่า 6 คัน
        if (filteredTrips.length > 6) {
            actionsWrapper.style.display = "block"; 
            btnViewAll.innerText = showAllTrips ? "✕ แสดงน้อยลง" : "ดูรอบรถทั้งหมด";
        } else {
            // ถ้ารอบรถมี 6 คัน หรือน้อยกว่า
            actionsWrapper.style.display = "none";
        }
    }

    // 🟢 (โค้ดหา lastTripsMap ของเดิม ปล่อยไว้เหมือนเดิมครับ)
    
    const lastTripsMap = {};
    allTrips.forEach(trip => {
        if (trip.date === todayStr) {
            if (!lastTripsMap[trip.routeId] || trip.time > lastTripsMap[trip.routeId].time) {
                lastTripsMap[trip.routeId] = trip;
            }
        }
    });

    if (displayData.length === 0) {
        tripGrid.innerHTML = "<p style='text-align:center; padding: 40px; color:#757575;'>ไม่มีรอบรถในขณะนี้</p>";
    } else {
        displayData.forEach(trip => {
            const isFull = trip.availableSeats <= 0;
            const arrivalTime = calculateArrivalTime(trip.time, trip.price);

            const isLastTrip = (lastTripsMap[trip.routeId] && lastTripsMap[trip.routeId].id === trip.id);
            const lastTripBadge = isLastTrip ? `<span style="background:#E8520A; color:white; font-size:11px; padding:2px 8px; border-radius:12px; margin-left:8px; animation: blink 2s infinite;">🔥 รถเที่ยวสุดท้าย</span>` : '';

            let dateBadge = "";
            if (trip.date === todayStr) {
                dateBadge = `<div style="font-size: 12px; color: #E67E22; font-weight: normal;">วันนี้</div>`;
            } else {
                const tomorrow = new Date(now);
                tomorrow.setDate(now.getDate() + 1);
                const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                if (trip.date === tomorrowStr) {
                    dateBadge = `<div style="font-size: 12px; color: #2E86C1; font-weight: normal;">พรุ่งนี้</div>`;
                } else {
                    const [y, m, d] = trip.date.split('-');
                    dateBadge = `<div style="font-size: 12px; color: #757575; font-weight: normal;">${d}/${m}/${y.substring(2)}</div>`;
                }
            }

            const cardHTML = `
                <div class="ticket-card" style="opacity: ${isFull ? '0.6' : '1'};">
                    <div class="ticket-header">
                        <div class="ticket-company">
                            <span class="ticket-company-name">VANVAN Express ${lastTripBadge}</span>
                            
                        </div>
                        <div class="ticket-price-box">
                            <div class="ticket-price-val">฿${parseFloat(trip.price).toFixed(2)}</div>
                            <div class="ticket-seats" style="color: ${isFull ? '#e53935' : (trip.availableSeats <= 3 ? '#E67E22' : '#2E7D32')}">
                                ${isFull ? 'เต็มแล้ว' : `ว่าง: ${trip.availableSeats} ที่`}
                            </div>
                        </div>
                    </div>
                    <div class="ticket-timeline">
                        <div class="timeline-point start">
                            <div style="display: flex; flex-direction: column; align-items: flex-start; min-width: 50px;">
                                <span class="time-val" style="min-width: unset;">${trip.time}</span>
                                ${dateBadge}
                            </div>
                            <span class="place-val">จุดจอด ${trip.origin}</span>
                        </div>
                        <div class="timeline-point end">
                            <div style="display: flex; flex-direction: column; align-items: flex-start; min-width: 50px;">
                                <span class="time-val" style="min-width: unset;">${arrivalTime}</span>
                            </div>
                            <span class="place-val">จุดลงรถ ${trip.destination}</span>
                        </div>
                    </div>
                    <div class="ticket-footer">
                        <button class="btn-book-ticket" 
                                ${isFull ? 'disabled' : ''} 
                                onclick="window.bookTicket('${trip.id}', '${trip.routeId}', ${trip.availableSeats})">
                            ${isFull ? 'ที่นั่งเต็ม' : 'จองตั๋ว'}
                        </button>
                    </div>
                </div>
            `;
            tripGrid.innerHTML += cardHTML;
        });
    }
}

// ==========================================
// 📍 ZONE 4.5: Popular Routes (ปลายทางยอดฮิต)
// ==========================================
// ==========================================
// 📍 ZONE 4.5: Popular Routes (ปลายทางยอดฮิต) - อัปเกรดภาพ & ราคา
// ==========================================
function renderPopularRoutes() {
    const container = document.getElementById("quick-routes-chips");
    if (!container) return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const currentHourMin = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    // 🟢 คลังรูปภาพสถานที่ (ถ้าไม่มีชื่อในนี้ จะใช้รูป default แทน)
    const destImages = {
        "พัทยา": "https://images.unsplash.com/photo-1550850839-8dc894ed385a?w=500&q=80",
        "หัวหิน": "https://images.unsplash.com/photo-1596524454151-518f87a8cb40?w=500&q=80",
        "ระยอง": "https://images.unsplash.com/photo-1588693892095-2bd0e14cb751?w=500&q=80",
        "อยุธยา": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B9%84%E0%B8%8A%E0%B8%A2%E0%B8%A7%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%A1_%E0%B8%97%E0%B8%B4%E0%B8%A8%E0%B8%95%E0%B8%B0%E0%B8%A7%E0%B8%B1%E0%B8%99%E0%B8%AD%E0%B8%AD%E0%B8%81.jpg/1920px-%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B9%84%E0%B8%8A%E0%B8%A2%E0%B8%A7%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%A1_%E0%B8%97%E0%B8%B4%E0%B8%A8%E0%B8%95%E0%B8%B0%E0%B8%A7%E0%B8%B1%E0%B8%99%E0%B8%AD%E0%B8%AD%E0%B8%81.jpg?w=500&q=80",
        "นครราชสีมา": "https://images.unsplash.com/photo-1622308644420-b20152b19211?w=500&q=80",
        "กาญจนบุรี": "https://images.unsplash.com/photo-1599839619722-39751411ea63?w=500&q=80",
        "อัมพวา" : "https://img.kapook.com/u/2016/suppaporn/amphawa/pic02.jpg",
        "ฉะเชิงเทรา": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMusRQ_dHe5-TWiK0mcvvAiauv-jtrzvkEUQ&s?w=500&q=80",
        "นครปฐม": "https://img.kapook.com/u/2020/pattra/pattravel202008/shutterstock_517972276.jpg?w=500&q=80",
        "นครสวรรค์" : "https://www.checkinchill.com/storage/content/c825325c-4c6b-46ae-958c-c6cbe8079e74.webp?w=500&q=80",
        "พิษณุโลก" : "https://cms.kapook.com/uploads/tag/4/ID_3614_64b7590b4a92c.jpg?w=500&q=80",
        "กำแพงเพชร" : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0X9JLyqqAM-_bKT-rueNwiGcF5uAJTtDNTw&s?w=500&q=80",
        "เพชรบูรณ์" : "https://www.ananda.co.th/blog/thegenc/wp-content/uploads/2024/09/shutterstock_2274666959-823x550.jpg?w=500&q=80",
        "อุทัยธานี" :"https://cdn.spsmartvan.com/wp-content/uploads/2025/03/1.-%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%88%E0%B8%B1%E0%B8%99%E0%B8%97%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%A1-%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%97%E0%B9%88%E0%B8%B2%E0%B8%8B%E0%B8%B8%E0%B8%87.webp?w=500&q=80",
        "สระบุรี": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2mWYS2INb4e56NU_9MhlX2NU_hKysFpLT0g&s?w=500&q=80", 
        "ลพบุรี" : "https://upload.wikimedia.org/wikipedia/commons/6/60/%E0%B8%9B%E0%B8%A3%E0%B8%B2%E0%B8%AA%E0%B8%B2%E0%B8%97%E0%B8%9B%E0%B8%A3%E0%B8%B2%E0%B8%87%E0%B8%84%E0%B9%8C%E0%B8%AA%E0%B8%B2%E0%B8%A1%E0%B8%A2%E0%B8%AD%E0%B8%942.jpg?w=500&q=80", 
        "ชัยภูมิ" : "https://cdn.spsmartvan.com/wp-content/uploads/2025/03/2.-%E0%B8%9C%E0%B8%B2%E0%B8%AA%E0%B8%B8%E0%B8%94%E0%B9%81%E0%B8%9C%E0%B9%88%E0%B8%99%E0%B8%94%E0%B8%B4%E0%B8%99-%E0%B8%AD%E0%B8%B8%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%99%E0%B9%81%E0%B8%AB%E0%B9%88%E0%B8%87%E0%B8%8A%E0%B8%B2%E0%B8%95%E0%B8%B4%E0%B8%9B%E0%B9%88%E0%B8%B2%E0%B8%AB%E0%B8%B4%E0%B8%99%E0%B8%87%E0%B8%B2%E0%B8%A1.jpeg?w=500&q=80", 
        "บุรีรัมย์" : "https://s.isanook.com/tr/0/ui/283/1419929/1f33d8b6ca79cdeeb610726556513679_1583919972.jpg?w=500&q=80",
        "สุพรรณบุรี" : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR089kTlpq3LdrkaWxMdy8swmfnPTLJNzEgAQ&s?w=500&q=80", 
        "สิงห์บุรี" : "https://s.isanook.com/tr/0/ud/282/1413113/istock-537985975.jpg?ip/resize/w728/q80/jpg?w=500&q=80", 
        "ชัยนาท" : "https://travel.mthai.com/app/uploads/2014/12/unnamed2-1.jpg?w=500&q=80",
        "สัตหีบ" : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWGyStRiDRbivGLTmlis96-VC7zH89A08rXA&s?w=500&q=80",  
        "จันทบุรี" : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaJMgr4U3UujvWHWoC6L67YF66Z4G2I9Mm0w&s?w=500&q=80", 
        "ตราด": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIwJ6_4P7LmvZim-gUVo6CbQHrO3fdsbsUZQ&s?w=500&q=80", 
        "ปราจีนบุรี" : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa0xDSpb3XMLZN81bQa1vDYflyLkHMP38s-A&s?w=500&q=80", 
        "สระแก้ว" : "https://s359.kapook.com/pagebuilder/55ec8246-ee24-4923-b55c-1f99642990d6.jpg?w=500&q=80",
        "ราชบุรี" : "https://www.rentconnected.com/blogs/wp-content/webpc-passthru.php?src=https://www.rentconnected.com/blogs/wp-content/uploads/2023/03/%E0%B9%80%E0%B8%82%E0%B8%B2%E0%B8%AB%E0%B8%B4%E0%B8%99%E0%B8%87%E0%B8%B9_1500px-1024x768.jpg&nocache=1&w=500&q=80   ", 
        "มหาชัย" : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSE_RIU5Ex1rgnzDJ3Ri95HuxzzI0yc1MelNg&s?w=500&q=80",
        "default": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&q=80" // รูปถนนสวยๆ ในไทย
    };

 

    const destStats = {};
    allTrips.forEach(trip => {
        if (trip.date !== todayStr) return;
        
        const dest = trip.destination;
        if (!dest) return;
        
        if (!destStats[dest]) {
            destStats[dest] = { 
                destination: dest, 
                totalTrips: 0,       
                upcomingTrips: 0,    
                totalSeats: 0,
                minPrice: Infinity, // 🟢 เพิ่มตัวแปรเก็บราคาถูกที่สุด      
                origin: trip.origin || "หมอชิต 2" 
            };
        }
        
        destStats[dest].totalTrips++;
        
        // หาราคาเริ่มต้นที่ถูกที่สุดของสายนี้
        const tripPrice = parseFloat(trip.price) || 150;
        if (tripPrice < destStats[dest].minPrice) {
            destStats[dest].minPrice = tripPrice;
        }
        
        if (trip.time >= currentHourMin) {
            destStats[dest].upcomingTrips++;
            destStats[dest].totalSeats += (trip.availableSeats || 0);
        }
    });

    const topRoutes = Object.values(destStats)
        .sort((a, b) => b.totalTrips - a.totalTrips)
        .slice(0, 4);

    if (topRoutes.length === 0) {
        container.innerHTML = `<p style="color:#757575; font-size:14px;">ไม่มีรอบรถวันนี้ในขณะนี้</p>`;
        return;
    }

    container.innerHTML = "";
    topRoutes.forEach(route => {
        let btnText = "จอง";
        let isDisabled = false;

        if (route.upcomingTrips === 0) {
            btnText = "หมดรอบ"; 
            isDisabled = true;
        } else if (route.totalSeats <= 0) {
            btnText = "เต็ม";    
            isDisabled = true;
        }

        const displayPrice = route.minPrice === Infinity ? "150" : route.minPrice;
        const imgUrl = destImages[route.destination] || destImages["default"];

        const card = document.createElement("div");
        card.className = "popular-route-card";
        
        // 🟢 เปลี่ยนโครงสร้าง HTML ให้มีรูปภาพและป้ายราคา
        card.innerHTML = `
            <div class="popular-route-card__img-box">
                <img src="${imgUrl}" alt="${route.destination}" class="popular-route-card__img">
                <div class="popular-route-card__price-badge">เริ่มต้น ฿${displayPrice}</div>
            </div>
            <div class="popular-route-card__content">
                <div class="popular-route-card__info">
                    <span class="popular-route-card__dest">${route.destination}</span>
                    <span class="popular-route-card__stats">รถเหลือ ${route.upcomingTrips} เที่ยว</span>
                </div>
                <button class="popular-route-card__btn" ${isDisabled ? 'disabled' : ''}>
                    ${btnText}
                </button>
            </div>
        `;

        const bookBtn = card.querySelector(".popular-route-card__btn");
        if (bookBtn && !isDisabled) {
            bookBtn.addEventListener("click", () => {
                let foundTerminal = null;
                for (const [terminal, dests] of Object.entries(destinationsByTerminal)) {
                    if (dests.includes(route.destination)) {
                        foundTerminal = terminal;
                        break;
                    }
                }

                const terminalInput = document.getElementById("search-terminal");
                const destInput = document.getElementById("search-dest");
                const dateInput = document.getElementById("search-date");

                if (foundTerminal && terminalInput) {
                    const terminalLabels = { A: "อาคาร A (เหนือ / อีสาน)", B: "อาคาร B (กลาง)", C: "อาคาร C (ตะวันออก)", D: "อาคาร D (ใต้ / ตะวันตก)" };
                    terminalInput.value = terminalLabels[foundTerminal] || `อาคาร ${foundTerminal}`;
                    terminalInput.dataset.value = foundTerminal;

                    const destDropdown = document.getElementById("dest-dropdown");
                    const destinations = destinationsByTerminal[foundTerminal] || [];
                    if (destDropdown) {
                        destDropdown.innerHTML = "";
                        destinations.forEach(dest => {
                            const opt = document.createElement("div");
                            opt.className = "custom-dropdown__option";
                            opt.dataset.value = dest;
                            opt.innerHTML = `<span class="custom-dropdown__icon">📍</span><div class="custom-dropdown__text"><span class="custom-dropdown__label">${dest}</span></div>`;
                            if (dest === route.destination) opt.classList.add("selected");
                            destDropdown.appendChild(opt);
                        });
                    }
                }

                if (destInput) {
                    destInput.value = route.destination;
                    destInput.dataset.value = route.destination;
                    destInput.disabled = false;
                }

                if (dateInput?._flatpickr) {
                    dateInput._flatpickr.setDate(new Date(), true);
                }

                currentFilter = { origin: route.origin, destination: route.destination, date: todayStr };
                showAllTrips = false;
                const toggleBtn = document.getElementById("btn-view-all-upcoming");
                if (toggleBtn) toggleBtn.textContent = "ดูรอบรถทั้งหมด";

                renderTrips();
                document.querySelector(".upcoming-section")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
        container.appendChild(card);
    });
}

// ==========================================
// 🎟️ ZONE 5: Booking Modal Logic
// ==========================================
let currentBookingTripId = null;
let currentBookingSeats = null;

window.bookTicket = async function (tripId, routeId, currentSeats) {
    if (currentSeats <= 0) {
        alert("ขออภัยครับ รถรอบนี้ที่นั่งเต็มแล้ว 😭");
        return;
    }

    currentBookingTripId = tripId;
    currentBookingSeats = currentSeats;

    const stopSelect = document.getElementById("modal-stop-select");
    const priceShow = document.getElementById("modal-price-show");

    stopSelect.innerHTML = `<option value="">กำลังโหลดจุดจอด...</option>`;
    document.getElementById("booking-modal").classList.add("active");

    try {
        const routeDoc = await getDoc(doc(db, "routes", routeId));
        stopSelect.innerHTML = "";

        if (routeDoc.exists() && routeDoc.data().stops) {
            const routeInfo = routeDoc.data();
            routeInfo.stops.forEach((stop, index) => {
                const isSelected = index === routeInfo.stops.length - 1 ? "selected" : "";
                stopSelect.innerHTML += `<option value="${stop.price}" ${isSelected}>ลงที่: ${stop.name}</option>`;
            });
            priceShow.innerText = routeInfo.stops[routeInfo.stops.length - 1].price;
        } else {
            stopSelect.innerHTML = `<option value="150">ปลายทาง</option>`;
            priceShow.innerText = "150";
        }
    } catch (error) {
        console.error("โหลดจุดจอดไม่สำเร็จ:", error);
        stopSelect.innerHTML = `<option value="150">เกิดข้อผิดพลาดในการโหลดจุดจอด</option>`;
    }
};

document.getElementById("modal-stop-select")?.addEventListener("change", (e) => {
    document.getElementById("modal-price-show").innerText = e.target.value;
});

window.closeBookingModal = function () {
    document.getElementById("booking-modal").classList.remove("active");
    currentBookingTripId = null;
};

document.getElementById("btn-confirm-booking")?.addEventListener("click", async () => {
    if (!currentBookingTripId) return;

    const stopSelect = document.getElementById("modal-stop-select");
    const selectedStopName = stopSelect.options[stopSelect.selectedIndex].text;
    const finalPrice = stopSelect.value;

    try {
        const tripRef = doc(db, "trips", currentBookingTripId);
        await updateDoc(tripRef, {
            availableSeats: currentBookingSeats - 1
        });

        alert(`🎉 จองตั๋วสำเร็จ!\n${selectedStopName}\nยอดชำระเงิน: ฿${finalPrice}`);
        window.closeBookingModal();

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการจอง:", error);
        alert("❌ ระบบขัดข้อง: " + error.message);
    }
});

// ==========================================
// 🛠️ ZONE 6: System Utilities (Live Sync & Mock Data)
// ==========================================
setInterval(() => {
    if (!currentFilter) {
        renderTrips();
        console.log("⏱️ Live Sync: อัปเดตตารางรถตามเวลาปัจจุบันเรียบร้อย");
    }
}, 60000);

// // ปุ่มเสกข้อมูล (ซ่อนไว้ใช้ทดสอบ)
// setTimeout(() => {
//     const btnMock = document.createElement("button");
//     btnMock.innerText = "📅 ล้างไพ่ & อัปเดตตารางรถใหม่";
//     btnMock.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:9999; background:#8E44AD; color:white; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; border:none; box-shadow:0 4px 10px rgba(0,0,0,0.3);";
//     document.body.appendChild(btnMock);

//     btnMock.addEventListener("click", async () => {
//         const confirmClear = confirm("🚨 คำเตือน: ระบบจะทำการ 'ลบข้อมูลรอบรถ (Trips) เก่าทั้งหมด' และสร้างตารางเวลาใหม่แบบสมจริง คุณแน่ใจหรือไม่?");
//         if (!confirmClear) return;

//         btnMock.innerText = "🗑️ กำลังล้างข้อมูลเก่า...";
//         btnMock.disabled = true;

//         try {
//             const tripsRef = collection(db, "trips");
//             const oldTripsSnap = await getDocs(tripsRef);
//             for (const tripDoc of oldTripsSnap.docs) {
//                 await deleteDoc(doc(db, "trips", tripDoc.id));
//             }

//             btnMock.innerText = "⏳ กำลังสร้างตารางใหม่...";
//             const routesSnap = await getDocs(collection(db, "routes"));
//             const allRoutes = [];
//             routesSnap.forEach(d => allRoutes.push(d.data()));

//             const now = new Date();
//             let count = 0;

//             for (let i = 0; i <= 7; i++) {
//                 const targetDate = new Date(now);
//                 targetDate.setDate(now.getDate() + i);
//                 const dateStr = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

//                 for (const route of allRoutes) {
//                     let routePrice = 150;
//                     if(route.stops && route.stops.length > 0) {
//                         routePrice = route.stops[route.stops.length - 1].price;
//                     }

//                     let baseHours = [];
//                     if (routePrice <= 100) baseHours = ["06", "08", "10", "12", "14", "16", "18"];
//                     else if (routePrice <= 200) baseHours = ["07", "10", "13", "16", "19"];
//                     else baseHours = ["06", "12", "18"];

//                     const times = baseHours.map(hour => {
//                         const mins = ["00", "15", "30"][Math.floor(Math.random() * 3)];
//                         return `${hour}:${mins}`;
//                     });

//                     for (const t of times) {
//                         await addDoc(tripsRef, {
//                             routeId: route.routeId,
//                             origin: route.origin,
//                             destination: route.destination,
//                             date: dateStr,
//                             time: t,
//                             totalSeats: 14,
//                             availableSeats: Math.floor(Math.random() * 14) + 1,
//                             status: "waiting",
//                             price: routePrice
//                         });
//                         count++;
//                     }
//                 }
//             }
//             alert(`✅ ล้างข้อมูลเก่า และสร้างตารางใหม่สำเร็จ! (${count} รอบ)\nหน้าเว็บจะอัปเดตอัตโนมัติครับ`);
//             btnMock.remove();

//         } catch (error) {
//             console.error(error);
//             alert("❌ เกิดข้อผิดพลาด: " + error.message);
//             btnMock.innerText = "📅 ลองใหม่";
//             btnMock.disabled = false;
//         }
//     });
// }, 1000);