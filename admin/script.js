import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { toast } from "../toast.js";

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

// ==========================================
// 2. ระบบ Navigation และ Layout หลัก
// ==========================================
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'routes', label: 'Manage Routes', icon: 'map-pin' },
  { id: 'schedules', label: 'Manage Schedules', icon: 'calendar' },
  { id: 'users', label: 'Manage Users', icon: 'users' },
  { id: 'payments', label: 'Verify Payments', icon: 'check-circle' },
];

let activeTab = 'dashboard';
let myChart = null;

function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  nav.innerHTML = menuItems.map(item => `
    <button data-tab="${item.id}" class="nav-item ${activeTab === item.id ? 'active' : ''}">
      <i data-lucide="${item.icon}" style="width:20px; height:20px;"></i>
      <span>${item.label}</span>
      ${activeTab === item.id ? '<i data-lucide="chevron-right" style="width:16px; height:16px;"></i>' : ''}
    </button>
  `).join('');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
      closeMobileMenu();
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function switchTab(tabId) {
  activeTab = tabId;
  const currentTab = menuItems.find(i => i.id === tabId);
  const titleEl = document.getElementById('page-title');
  if (titleEl && currentTab) titleEl.textContent = currentTab.label;

  renderSidebar();
  renderContent();
}

function renderContent() {
  const container = document.getElementById('content-area');
  if (!container) return;

  switch (activeTab) {
    case 'dashboard':
      container.innerHTML = getDashboardHtml();
      fetchAndRenderDashboard();
      break;
    case 'routes':
      container.innerHTML = getRoutesHtml();
      fetchAndRenderRoutes();
      break;
    case 'schedules':
      container.innerHTML = getSchedulesHtml();
      fetchAndRenderSchedules();
      document.getElementById('btn-create-schedule')?.addEventListener('click', openCreateScheduleModal);
      break;
    case 'users':
      container.innerHTML = getUsersHtml();
      window.fetchAndRenderUsers('all');
      break;
    case 'payments':
      container.innerHTML = getPaymentsHtml();
      window.fetchAndRenderPayments();
      break;
  }

  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// 3. Dashboard
// ==========================================
async function fetchAndRenderDashboard() {
  try {
    const todayStr = '2026-03-21';
    const qTrips = query(collection(db, "trips"), where("date", "==", todayStr));
    const querySnapshotTrips = await getDocs(qTrips);

    document.getElementById('stat-today-trips').innerHTML = querySnapshotTrips.size;
    document.getElementById('stat-today-trips-label').innerHTML = `On ${todayStr}`;

    const activeVansSet = new Set();
    querySnapshotTrips.forEach(d => {
      if (d.data().vanPlate) activeVansSet.add(d.data().vanPlate);
    });
    document.getElementById('stat-active-vans').innerHTML = activeVansSet.size;

    const mockDailyRevenue = 12450;
    document.getElementById('stat-daily-revenue').innerHTML = `฿${mockDailyRevenue.toLocaleString()}`;

    renderRevenueChart();
  } catch (error) {
    console.error("Error loading dashboard data: ", error);
  }
}

function renderRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mar 15', 'Mar 16', 'Mar 17', 'Mar 18', 'Mar 19', 'Mar 20', 'Mar 21'],
      datasets: [{
        label: 'Daily Revenue (฿)',
        data: [10500, 15000, 9800, 13200, 16800, 14000, 12450],
        borderColor: '#2E86C1',
        backgroundColor: 'rgba(174, 214, 241, 0.4)',
        borderWidth: 3,
        fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#1B4F72'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '฿' + v.toLocaleString() } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ==========================================
// 4. Routes
// ==========================================
let allRoutesData = [];

async function fetchAndRenderRoutes() {
  const tableBody = document.getElementById('routes-table-body');
  if (!tableBody) return;
  try {
    const querySnapshot = await getDocs(collection(db, "routes"));
    allRoutesData = [];
    querySnapshot.forEach((d) => {
      allRoutesData.push({ docId: d.id, ...d.data() });
    });
    renderRoutesTable(allRoutesData);
  } catch (error) {
    console.error("Error fetching routes: ", error);
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--color-danger);">เกิดข้อผิดพลาดในการดึงข้อมูล</td></tr>';
  }
}

function renderRoutesTable(routesArray) {
  const tableBody = document.getElementById('routes-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (routesArray.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">ไม่พบข้อมูลเส้นทาง</td></tr>';
    return;
  }

  routesArray.forEach((data) => {
    let stopsHtml = '';
    let finalPrice = 0;

    if (data.stops && Array.isArray(data.stops) && data.stops.length > 0) {
      data.stops.forEach(stop => {
        stopsHtml += `<span class="badge info" style="margin-right:4px; margin-bottom:4px;">${stop.name} ฿${stop.price}</span>`;
      });
      finalPrice = data.stops[data.stops.length - 1].price;
    } else {
      stopsHtml = '<span style="color:var(--color-text-soft)">ไม่มีจุดจอด</span>';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${data.origin || '-'} &rarr; ${data.destination || '-'}</strong><br>
        <small style="color:var(--color-text-soft)">ID: ${data.routeId || data.docId}</small>
        ${data.isActive !== false ? '<span class="badge up" style="margin-left:8px; font-size:10px;">เปิดใช้งาน</span>' : '<span class="badge down" style="margin-left:8px; font-size:10px;">ปิดใช้งาน</span>'}
      </td>
      <td style="max-width: 300px; display: flex; flex-wrap: wrap; border-bottom: none; padding-top: 1.5rem;">${stopsHtml}</td>
      <td style="color:var(--color-blue-mid); font-weight:bold; font-size:1.1rem;">฿${finalPrice}</td>
      <td style="text-align:right;">
        <button class="btn-icon" title="แก้ไข"><i data-lucide="edit-2"></i></button>
        <button class="btn-icon" title="ลบ" style="color: var(--color-danger);"><i data-lucide="trash-2"></i></button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
  if (window.lucide) window.lucide.createIcons();
}

window.handleRouteSearch = function (keyword) {
  const term = keyword.toLowerCase().trim();
  if (!term) { renderRoutesTable(allRoutesData); return; }
  const filtered = allRoutesData.filter(r =>
    (r.origin && r.origin.toLowerCase().includes(term)) ||
    (r.destination && r.destination.toLowerCase().includes(term)) ||
    (r.routeId && r.routeId.toLowerCase().includes(term))
  );
  renderRoutesTable(filtered);
};

window.openAddRouteModal = function () {
  const modal = document.getElementById('route-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeAddRouteModal = function () {
  const modal = document.getElementById('route-modal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('add-route-form').reset();
  }
};

window.submitNewRoute = async function (e) {
  e.preventDefault();
  const routeId = document.getElementById('route-id').value;
  const origin = document.getElementById('route-origin').value;
  const dest = document.getElementById('route-dest').value;
  const fare = Number(document.getElementById('route-fare').value);
  const isActive = document.getElementById('route-status').value === 'true';

  try {
    await addDoc(collection(db, "routes"), {
      routeId, origin, destination: dest, isActive,
      stops: [{ name: dest, price: fare }]
    });
    toast('บันทึกเส้นทางใหม่สำเร็จ!', 'success');
    window.closeAddRouteModal();
    const tableBody = document.getElementById('routes-table-body');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">กำลังโหลดข้อมูลล่าสุด...</td></tr>';
    fetchAndRenderRoutes();
  } catch (error) {
    console.error("Error adding route: ", error);
    toast('เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้', 'error');
  }
};

// ==========================================
// 5. Schedules + Seat Map
// ==========================================
function openCreateScheduleModal() {
  document.getElementById('schedule-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'schedule-modal';
  modal.style.cssText = 'display:flex; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center; padding:1rem;';
  modal.innerHTML = `
    <div class="card" style="width:100%; max-width:500px; max-height:90vh; overflow-y:auto;">
      <div class="flex-between" style="margin-bottom:1.5rem; border-bottom:1px solid var(--color-border-light); padding-bottom:1rem;">
        <h3>สร้างรอบเดินทางใหม่</h3>
        <button class="btn-icon" id="close-schedule-modal"><i data-lucide="x"></i></button>
      </div>
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Route ID <span style="color:red">*</span></label>
          <input id="sch-routeId" type="text" placeholder="เช่น R001" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
        </div>
        <div style="display:flex; gap:1rem;">
          <div style="flex:1;">
            <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ต้นทาง <span style="color:red">*</span></label>
            <input id="sch-origin" type="text" placeholder="เช่น หมอชิต 2" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ปลายทาง <span style="color:red">*</span></label>
            <input id="sch-destination" type="text" placeholder="เช่น มหาชัย" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
          </div>
        </div>
        <div style="display:flex; gap:1rem;">
          <div style="flex:1;">
            <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">วันที่ <span style="color:red">*</span></label>
            <input id="sch-date" type="date" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เวลา <span style="color:red">*</span></label>
            <input id="sch-time" type="time" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
          </div>
        </div>
        <div style="display:flex; gap:1rem;">
          <div style="flex:1;">
            <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ที่นั่งทั้งหมด <span style="color:red">*</span></label>
            <input id="sch-totalSeats" type="number" placeholder="15" min="1" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ราคา (บาท) <span style="color:red">*</span></label>
            <input id="sch-price" type="number" placeholder="150" min="0" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
          </div>
        </div>
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">สถานะ</label>
          <select id="sch-status" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; background:white;">
            <option value="waiting">Waiting</option>
            <option value="on-way">On-Way</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--color-border-light);">
          <button id="cancel-schedule-modal" style="padding:10px 20px; border-radius:8px; border:1px solid var(--color-border-light); background:white; cursor:pointer; font-weight:bold;">ยกเลิก</button>
          <button id="submit-schedule-modal" class="btn-primary" style="padding:10px 20px;">บันทึก</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  modal.querySelector('#close-schedule-modal').addEventListener('click', () => modal.remove());
  modal.querySelector('#cancel-schedule-modal').addEventListener('click', () => modal.remove());
  modal.querySelector('#submit-schedule-modal').addEventListener('click', async () => {
    const routeId     = document.getElementById('sch-routeId').value.trim();
    const origin      = document.getElementById('sch-origin').value.trim();
    const destination = document.getElementById('sch-destination').value.trim();
    const date        = document.getElementById('sch-date').value;
    const time        = document.getElementById('sch-time').value;
    const totalSeats  = parseInt(document.getElementById('sch-totalSeats').value);
    const price       = parseInt(document.getElementById('sch-price').value);
    const status      = document.getElementById('sch-status').value;

    if (!routeId || !origin || !destination || !date || !time || !totalSeats || isNaN(price)) {
      toast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      return;
    }

    try {
      await addDoc(collection(db, "trips"), {
        routeId, origin, destination, date, time,
        totalSeats, availableSeats: totalSeats, price, status,
      });
      toast('สร้างรอบเดินทางสำเร็จ!', 'success');
      modal.remove();
      invalidateSchedulesCache(); // ล้าง cache เพื่อให้โหลดข้อมูลใหม่
      fetchAndRenderSchedules();
    } catch (error) {
      console.error(error);
      toast('เกิดข้อผิดพลาด ไม่สามารถบันทึกได้', 'error');
    }
  });
}

// เก็บข้อมูล trips ทั้งหมดและ routesMap ไว้ใน module-level
let allTripsData = [];
let allRoutesMap = {};
let selectedScheduleDate = null;

// ─── Cache layer ───────────────────────────────────────────
let _tripsCache  = null;           // array ของ trip objects
let _routesCache = null;           // object ของ routesMap
let _cacheTime   = 0;              // timestamp ที่โหลดล่าสุด
const CACHE_TTL  = 5 * 60 * 1000; // 5 นาที (ms)

function invalidateSchedulesCache() {
  _tripsCache  = null;
  _routesCache = null;
  _cacheTime   = 0;
}
// ───────────────────────────────────────────────────────────

async function fetchAndRenderSchedules() {
  const schedulesList = document.getElementById('schedules-list');
  if (!schedulesList) return;

  try {
    const now     = Date.now();
    const isFresh = _tripsCache && _routesCache && (now - _cacheTime < CACHE_TTL);

    if (isFresh) {
      // ✅ ใช้ cache — ไม่อ่าน Firestore เลย
      console.log('[Schedules] using cache, skipping Firestore reads');
      allTripsData = _tripsCache;
      allRoutesMap = _routesCache;
    } else {
      // 🔄 cache หมดอายุหรือยังไม่มี — อ่าน Firestore
      console.log('[Schedules] cache miss — fetching from Firestore');
      schedulesList.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูลรอบรถ...</p>';

      const [tripsSnapshot, routesSnapshot] = await Promise.all([
        getDocs(collection(db, "trips")),
        getDocs(collection(db, "routes")),
      ]);

      const routesMap = {};
      routesSnapshot.forEach(d => {
        routesMap[d.data().routeId] = { origin: d.data().origin, destination: d.data().destination };
      });

      const tripsArr = [];
      tripsSnapshot.forEach(d => tripsArr.push({ docId: d.id, ...d.data() }));

      // บันทึกลง cache
      _tripsCache  = tripsArr;
      _routesCache = routesMap;
      _cacheTime   = now;

      allTripsData = _tripsCache;
      allRoutesMap = _routesCache;
    }

    if (allTripsData.length === 0) {
      schedulesList.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-text-soft);">ไม่พบข้อมูลรอบรถ</p>';
      renderDayFilterButtons([]);
      return;
    }

    // รวบรวมวันที่ unique แล้วเรียงจากน้อยไปมาก
    const uniqueDates = [...new Set(allTripsData.map(t => t.date))].sort();

    // ตั้งค่าวันที่เริ่มต้น = วันแรกที่มีข้อมูล
    if (!selectedScheduleDate || !uniqueDates.includes(selectedScheduleDate)) {
      selectedScheduleDate = uniqueDates[0];
    }

    renderDayFilterButtons(uniqueDates);
    renderSchedulesByDate(selectedScheduleDate);

  } catch (error) {
    console.error("Error loading schedules: ", error);
    schedulesList.innerHTML = '<p style="text-align:center; color:var(--color-danger);">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
}

function renderDayFilterButtons(uniqueDates) {
  const bar = document.getElementById('day-filter-bar');
  if (!bar) return;

  if (uniqueDates.length === 0) {
    bar.innerHTML = '<span style="font-size:13px; color:var(--color-text-soft);">ไม่มีข้อมูลวันที่</span>';
    return;
  }

  const label = `<span style="font-size:13px; color:var(--color-text-soft); margin-right:4px; white-space:nowrap;"><i data-lucide="calendar" style="width:14px; height:14px; vertical-align:middle;"></i> เลือกวัน:</span>`;

  const buttons = uniqueDates.map(dateStr => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDate();
    const monthShort = d.toLocaleString('th-TH', { month: 'short' });
    const isActive = dateStr === selectedScheduleDate;
    const tripCount = allTripsData.filter(t => t.date === dateStr).length;

    return `
      <button
        data-date="${dateStr}"
        onclick="window.selectScheduleDate('${dateStr}')"
        style="
          display:flex; flex-direction:column; align-items:center;
          padding:6px 14px; border-radius:10px; cursor:pointer; border:1.5px solid ${isActive ? 'var(--color-blue-mid)' : 'var(--color-border-light)'};
          background:${isActive ? 'var(--color-blue-mid)' : 'white'};
          color:${isActive ? 'white' : 'var(--color-text-main)'};
          font-weight:${isActive ? 'bold' : 'normal'};
          transition: all 0.15s;
          min-width:52px;
        "
      >
        <span style="font-size:10px; opacity:0.8;">${monthShort}</span>
        <span style="font-size:18px; font-weight:bold; line-height:1.2;">${day}</span>
        <span style="font-size:10px; opacity:0.75;">${tripCount} รอบ</span>
      </button>
    `;
  }).join('');

  bar.innerHTML = label + buttons;
  if (window.lucide) window.lucide.createIcons();
}

window.selectScheduleDate = function(dateStr) {
  selectedScheduleDate = dateStr;
  renderDayFilterButtons([...new Set(allTripsData.map(t => t.date))].sort());
  renderSchedulesByDate(dateStr);
};

function renderSchedulesByDate(dateStr) {
  const schedulesList = document.getElementById('schedules-list');
  if (!schedulesList) return;

  // reset seat panel
  const seatPanel = document.getElementById('seat-panel');
  if (seatPanel) {
    seatPanel.innerHTML = `
      <i data-lucide="armchair" style="width:48px; height:48px; opacity:0.2; margin-bottom:1rem;"></i>
      <p style="font-size:13px; opacity:0.5;">เลือกรอบเดินทางเพื่อดูแผนผังที่นั่ง</p>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  const filtered = allTripsData.filter(t => t.date === dateStr);
  // เรียงตามเวลา
  filtered.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  schedulesList.innerHTML = '';

  if (filtered.length === 0) {
    schedulesList.innerHTML = `<p style="text-align:center; padding:2rem; color:var(--color-text-soft);">ไม่มีรอบเดินทางในวันนี้</p>`;
    return;
  }

  const d = new Date(dateStr + 'T00:00:00');
  const dateLabel = d.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const headerDiv = document.createElement('div');
  headerDiv.innerHTML = `<p style="font-size:13px; color:var(--color-text-soft); padding:0 0.25rem;">${dateLabel} — ${filtered.length} รอบ</p>`;
  schedulesList.appendChild(headerDiv);

  filtered.forEach(data => {
    const routeInfo = allRoutesMap[data.routeId] || { origin: data.origin || 'Unknown', destination: data.destination || 'Unknown' };
    const tripDate = new Date(data.date + 'T00:00:00');
    const day = tripDate.getDate();
    const monthShort = tripDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();

    let statusBadge = '';
    if (data.status === 'waiting') statusBadge = '<span class="badge loading">Waiting</span>';
    else if (data.status === 'on-way') statusBadge = '<span class="badge warning">On-Way</span>';
    else if (data.status === 'completed') statusBadge = '<span class="badge up">Completed</span>';

    const bookedSeats = (data.totalSeats || 0) - (data.availableSeats || 0);

    const div = document.createElement('div');
    div.className = 'card flex-between';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div class="gap-2">
        <div style="background:var(--color-bg-main); padding:0.75rem 1rem; border-radius:8px; text-align:center; min-width:52px;">
          <small style="color:var(--color-text-soft);">${monthShort}</small><br><b style="font-size:1.25rem;">${day}</b>
        </div>
        <div>
          ${statusBadge}
          <h4 style="margin: 4px 0 2px 0;">${routeInfo.origin} &rarr; ${routeInfo.destination}</h4>
          <small style="color:var(--color-text-soft);">${data.time || 'HH:MM'} | ${data.vanPlate || 'Unassigned Van'}</small>
          <br><small style="color:var(--color-blue-dark);">จองแล้ว: ${bookedSeats}/${data.totalSeats || 0} ที่นั่ง</small>
        </div>
      </div>
      <i data-lucide="chevron-right" style="color:var(--color-text-soft);"></i>
    `;

    div.addEventListener('click', () => {
      document.querySelectorAll('#schedules-list .card').forEach(c => c.style.borderColor = '');
      div.style.borderColor = 'var(--color-blue-mid)';
      renderSeatMap(data.totalSeats || 0, bookedSeats);
    });

    schedulesList.appendChild(div);
  });
  if (window.lucide) window.lucide.createIcons();
}

function renderSeatMap(totalSeats, bookedSeats) {
  const panel = document.getElementById('seat-panel');
  if (!panel) return;

  const passengerPositions = [
    { left: 44,  top: 72  }, { left: 100, top: 72  },
    { left: 44,  top: 163 }, { left: 100, top: 163 }, { left: 151, top: 163 },
    { left: 44,  top: 243 }, { left: 151, top: 243 }, { left: 196, top: 243 },
    { left: 44,  top: 311 }, { left: 151, top: 311 }, { left: 196, top: 311 },
    { left: 44,  top: 379 }, { left: 151, top: 379 }, { left: 196, top: 379 },
  ];

  const usedPositions = passengerPositions.slice(0, Math.min(totalSeats, passengerPositions.length));
  const indices = Array.from({ length: usedPositions.length }, (_, i) => i);
  const shuffled = [...indices].sort(() => Math.random() - 0.5);
  const bookedSet = new Set(shuffled.slice(0, Math.min(bookedSeats, usedPositions.length)));

  const seatDivs = usedPositions.map((pos, i) => {
    const color = bookedSet.has(i) ? '#1B4F72' : '#2E86C1';
    return `<div style="width:40px; height:40px; left:${pos.left}px; top:${pos.top}px; position:absolute; background:${color}; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold;">${i + 1}</div>`;
  }).join('');

  panel.innerHTML = `
    <div style="padding:1.5rem; display:flex; flex-direction:column; align-items:center;">
      <div style="width:100%; margin-bottom:1rem;">
        <h4 style="margin-bottom:4px;">แผนผังที่นั่ง</h4>
        <p style="font-size:13px; color:var(--color-text-soft); margin-bottom:1rem;">จองแล้ว ${bookedSeats} / ${totalSeats} ที่นั่ง</p>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:6px; font-size:13px;"><div style="width:14px; height:14px; background:#723E1B; border-radius:3px;"></div> คนขับ</div>
          <div style="display:flex; align-items:center; gap:6px; font-size:13px;"><div style="width:14px; height:14px; background:#2E86C1; border-radius:3px;"></div> ว่าง</div>
          <div style="display:flex; align-items:center; gap:6px; font-size:13px;"><div style="width:14px; height:14px; background:#1B4F72; border-radius:3px;"></div> เต็ม</div>
        </div>
      </div>
      <div style="width:280px; height:530px; position:relative; flex-shrink:0;">
        <div style="width:280px; height:530px; left:0; top:0; position:absolute; background:#D9D9D9; border-top-left-radius:50px; border-top-right-radius:50px;"></div>
        <div style="width:40px; height:40px; left:196px; top:72px; position:absolute; background:#723E1B; border-radius:8px; display:flex; align-items:center; justify-content:center;">
          <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
        </div>
        <div style="position:absolute; left:20px; top:130px; width:240px; height:2px; background:#bbb;"></div>
        ${seatDivs}
      </div>
    </div>
  `;
}

// ==========================================
// 6. Users
// ==========================================
window.fetchAndRenderUsers = async function (filterRole = 'all') {
  const container = document.getElementById('users-list');
  if (!container) return;

  try {
    const querySnapshot = await getDocs(collection(db, "user"));
    container.innerHTML = '';
    let count = 0;

    querySnapshot.forEach((docSnap) => {
      const user = docSnap.data();
      const role = user.role || 'user';
      if (filterRole !== 'all' && role !== filterRole) return;
      count++;

      let iconBg = "rgba(34, 197, 94, 0.2)";
      let iconColor = "var(--color-success)";
      let iconName = "user";
      let badgeClass = "info";

      if (role === 'admin') {
        iconBg = "rgba(168, 85, 247, 0.2)"; iconColor = "purple"; iconName = "shield"; badgeClass = "warning";
      } else if (role === 'driver') {
        iconBg = "var(--color-bg-main)"; iconColor = "var(--color-blue-mid)"; iconName = "bus";
      }

      const div = document.createElement('div');
      div.className = 'card';
      div.dataset.docId = docSnap.id;
      div.dataset.username = user.username || '';
      div.dataset.email = user.email || '';
      div.dataset.phone = user.phone || '';
      div.dataset.role = role;

      div.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem;">
          <div class="icon-box" style="background:${iconBg}; color:${iconColor};"><i data-lucide="${iconName}"></i></div>
          <button class="btn-icon btn-edit-user" title="แก้ไข"><i data-lucide="edit-2"></i></button>
        </div>
        <h4 style="margin-bottom:4px; font-size:18px;">${user.username || 'ไม่ระบุชื่อ'}</h4>
        <span class="badge ${badgeClass}" style="margin-bottom:1rem; font-size:10px; text-transform:uppercase;">${role}</span>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:14px; color:var(--color-text-soft);">
            <i data-lucide="mail" style="width:16px; height:16px; color:var(--color-blue-mid);"></i>
            <span>${user.email || '-'}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:14px; color:var(--color-text-soft);">
            <i data-lucide="phone" style="width:16px; height:16px; color:var(--color-blue-mid);"></i>
            <span>${user.phone || '-'}</span>
          </div>
        </div>
      `;

      div.querySelector('.btn-edit-user').addEventListener('click', () => {
        window.openEditUserModal(div.dataset.docId, div.dataset.username, div.dataset.email, div.dataset.phone, div.dataset.role);
      });

      container.appendChild(div);
    });

    if (count === 0) container.innerHTML = '<p style="grid-column: 1 / -1; text-align:center; padding: 2rem; color:var(--color-text-soft);">ไม่พบข้อมูลผู้ใช้ในหมวดหมู่นี้</p>';
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error fetching users:", error);
    container.innerHTML = '<p style="grid-column: 1 / -1; text-align:center; padding: 2rem; color:var(--color-danger);">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
};

window.openAddUserModal = function () {
  document.getElementById('user-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'user-modal';
  modal.style.cssText = 'display:flex; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center; padding:1rem;';
  modal.innerHTML = `
    <div class="card" style="width:100%; max-width:480px; max-height:90vh; overflow-y:auto;">
      <div class="flex-between" style="margin-bottom:1.5rem; border-bottom:1px solid var(--color-border-light); padding-bottom:1rem;">
        <h3>เพิ่มผู้ใช้ใหม่</h3>
        <button class="btn-icon" id="close-user-modal"><i data-lucide="x"></i></button>
      </div>
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Username <span style="color:red">*</span></label>
          <input id="new-username" type="text" placeholder="กรอก Username" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Email <span style="color:red">*</span></label>
          <input id="new-email" type="email" placeholder="กรอก Email" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เบอร์โทร</label>
          <input id="new-phone" type="text" placeholder="กรอกเบอร์โทร" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Role</label>
          <select id="new-role" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; background:white;">
            <option value="user">User</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--color-border-light);">
          <button id="cancel-add-user" style="padding:10px 20px; border-radius:8px; border:1px solid var(--color-border-light); background:white; cursor:pointer; font-weight:bold;">ยกเลิก</button>
          <button id="submit-add-user" class="btn-primary" style="padding:10px 20px;">บันทึก</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  modal.querySelector('#close-user-modal').addEventListener('click', () => modal.remove());
  modal.querySelector('#cancel-add-user').addEventListener('click', () => modal.remove());
  modal.querySelector('#submit-add-user').addEventListener('click', async () => {
    const username = document.getElementById('new-username').value.trim();
    const email = document.getElementById('new-email').value.trim();
    const phone = document.getElementById('new-phone').value.trim();
    const role = document.getElementById('new-role').value;

    if (!username || !email) {
      toast('กรุณากรอก Username และ Email', 'warning');
      return;
    }

    try {
      await addDoc(collection(db, "user"), { username, email, phone, role });
      toast('เพิ่มผู้ใช้สำเร็จ!', 'success');
      modal.remove();
      window.fetchAndRenderUsers('all');
    } catch (error) {
      console.error(error);
      toast('เกิดข้อผิดพลาด ไม่สามารถบันทึกได้', 'error');
    }
  });
};

window.openEditUserModal = function (docId, username, email, phone, role) {
  document.getElementById('user-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'user-modal';
  modal.style.cssText = 'display:flex; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center; padding:1rem;';
  modal.innerHTML = `
    <div class="card" style="width:100%; max-width:480px; max-height:90vh; overflow-y:auto;">
      <div class="flex-between" style="margin-bottom:1.5rem; border-bottom:1px solid var(--color-border-light); padding-bottom:1rem;">
        <h3>แก้ไขข้อมูลผู้ใช้</h3>
        <button class="btn-icon" id="close-user-modal"><i data-lucide="x"></i></button>
      </div>
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Username</label>
          <input id="edit-username" type="text" value="${username}" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Email</label>
          <input id="edit-email" type="email" value="${email}" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เบอร์โทร</label>
          <input id="edit-phone" type="text" value="${phone}" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Role</label>
          <select id="edit-role" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; background:white;">
            <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
            <option value="driver" ${role === 'driver' ? 'selected' : ''}>Driver</option>
            <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--color-border-light);">
          <button id="cancel-edit-user" style="padding:10px 20px; border-radius:8px; border:1px solid var(--color-border-light); background:white; cursor:pointer; font-weight:bold;">ยกเลิก</button>
          <button id="submit-edit-user" class="btn-primary" style="padding:10px 20px;">บันทึก</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  modal.querySelector('#close-user-modal').addEventListener('click', () => modal.remove());
  modal.querySelector('#cancel-edit-user').addEventListener('click', () => modal.remove());
  modal.querySelector('#submit-edit-user').addEventListener('click', async () => {
    const newUsername = document.getElementById('edit-username').value.trim();
    const newEmail = document.getElementById('edit-email').value.trim();
    const newPhone = document.getElementById('edit-phone').value.trim();
    const newRole = document.getElementById('edit-role').value;

    try {
      await updateDoc(doc(db, "user", docId), { username: newUsername, email: newEmail, phone: newPhone, role: newRole });
      toast('แก้ไขข้อมูลสำเร็จ!', 'success');
      modal.remove();
      window.fetchAndRenderUsers('all');
    } catch (error) {
      console.error(error);
      toast('เกิดข้อผิดพลาด ไม่สามารถบันทึกได้', 'error');
    }
  });
};

// ==========================================
// 7. Payments
// ==========================================
window.fetchAndRenderPayments = async function () {
  const container = document.getElementById('payments-list');
  if (!container) return;

  try {
    const q = query(collection(db, "payments"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    container.innerHTML = '';

    if (querySnapshot.empty) {
      container.innerHTML = `<div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem; text-align:center; border: 1px dashed var(--color-border-light);"><i data-lucide="check-circle" style="width:48px; height:48px; opacity:0.3; margin-bottom:1rem;"></i><p style="color:var(--color-text-soft);">ไม่มีรายการที่ต้องตรวจสอบแล้ว</p></div>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const payment = docSnap.data();
      const div = document.createElement('div');
      div.className = 'card flex-between';
      div.style.marginBottom = '1rem';
      div.innerHTML = `
        <div style="display:flex; gap:1rem; align-items:flex-start;">
          <div class="icon-box"><i data-lucide="file-text"></i></div>
          <div>
            <p style="font-weight:bold; margin-bottom:4px;">${payment.userName || 'Customer'}</p>
            <div style="font-size:12px; color:var(--color-text-soft);"><span><i data-lucide="hash" style="width:12px; height:12px;"></i> Booking: ${payment.bookingId || '-'}</span></div>
            <p style="font-size:18px; font-weight:900; color:var(--color-blue-mid); margin-top:8px;">฿${payment.amount ? payment.amount.toFixed(2) : '0.00'}</p>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-icon btn-preview-slip" title="ดูสลิป"><i data-lucide="eye"></i></button>
          <button class="btn-icon btn-approve" style="color:var(--color-success); background:rgba(34,197,94,0.1);" title="อนุมัติ"><i data-lucide="check"></i></button>
          <button class="btn-icon btn-reject" style="color:var(--color-danger); background:rgba(239,68,68,0.1);" title="ปฏิเสธ"><i data-lucide="x"></i></button>
        </div>
      `;

      div.querySelector('.btn-preview-slip').addEventListener('click', () => window.previewSlip(payment.slipUrl));
      div.querySelector('.btn-approve').addEventListener('click', () => window.updatePaymentStatus(docSnap.id, 'approved'));
      div.querySelector('.btn-reject').addEventListener('click', () => window.updatePaymentStatus(docSnap.id, 'rejected'));

      container.appendChild(div);
    });
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error fetching payments:", error);
    container.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-danger);">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
};

window.previewSlip = function (url) {
  const previewContainer = document.getElementById('slip-preview');
  if (!previewContainer) return;
  if (url && url !== 'undefined') {
    previewContainer.style.background = 'var(--color-card-white)';
    previewContainer.innerHTML = `<img src="${url}" alt="Transfer Slip" style="max-width:100%; max-height:100%; object-fit:contain; padding:1rem;" onerror="this.src='https://via.placeholder.com/400x600?text=Image+Not+Found'">`;
  } else {
    toast('ไม่พบลิงก์รูปภาพสลิปในฐานข้อมูล', 'warning');
  }
};

// แทน confirm() ด้วย dialog แบบ Promise
function toastConfirm(message) {
  return new Promise((resolve) => {
    document.getElementById('toast-confirm')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'toast-confirm';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:99999; display:flex; align-items:center; justify-content:center; padding:1rem;';
    overlay.innerHTML = `
      <div style="background:white; border-radius:16px; padding:1.5rem 2rem; max-width:360px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <p style="font-size:15px; font-weight:600; margin-bottom:1.5rem; color:#1a1a2e; line-height:1.5;">${message}</p>
        <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
          <button id="tc-cancel" style="padding:8px 20px; border-radius:8px; border:1px solid #d0e4f5; background:white; cursor:pointer; font-weight:600; color:#6b7a99; font-size:14px;">ยกเลิก</button>
          <button id="tc-ok" style="padding:8px 20px; border-radius:8px; border:none; background:#2E86C1; color:white; cursor:pointer; font-weight:600; font-size:14px;">ยืนยัน</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#tc-ok').addEventListener('click', () => { overlay.remove(); resolve(true); });
    overlay.querySelector('#tc-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
  });
}

window.updatePaymentStatus = async function (docId, newStatus) {
  const actionText = newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
  const confirmed = await toastConfirm(`คุณแน่ใจหรือไม่ที่จะ "${actionText}" การชำระเงินนี้?`);
  if (!confirmed) return;

  try {
    await updateDoc(doc(db, "payments", docId), { status: newStatus });
    toast(`${actionText}การชำระเงินสำเร็จ`, 'success');
    window.fetchAndRenderPayments();
    const previewContainer = document.getElementById('slip-preview');
    if (previewContainer) {
      previewContainer.style.background = 'var(--color-bg-main)';
      previewContainer.innerHTML = `<i data-lucide="check-circle" style="width:64px; height:64px; color:var(--color-success); margin-bottom:1rem;"></i><p style="text-transform:uppercase; font-weight:bold; font-size:12px; color:var(--color-success);">ทำรายการสำเร็จ</p>`;
      if (window.lucide) window.lucide.createIcons();
    }
  } catch (error) {
    console.error("Error updating payment status: ", error);
    toast('เกิดข้อผิดพลาด ไม่สามารถอัปเดตข้อมูลได้', 'error');
  }
};

// ==========================================
// 8. HTML Templates
// ==========================================
function getDashboardHtml() {
  return `
    <div style="display:flex; flex-direction:column; gap:2rem;">
      <div class="grid-4">
        ${renderStatCard('Active Vans Today', '<span class="badge loading">Loading...</span>', 'bus', 'up', '+2', 'stat-active-vans', 'stat-active-vans-label')}
        ${renderStatCard("Today's Trips", '<span class="badge loading">Loading...</span>', 'calendar-days', 'up', '+3', 'stat-today-trips', 'stat-today-trips-label')}
        ${renderStatCard('Daily Revenue Today', '<span class="badge loading">฿...</span>', 'dollar-sign', 'down', '-5%', 'stat-daily-revenue', 'stat-daily-revenue-label')}
        ${renderStatCard('Pending Payments', '7', 'clock', 'up', '+3')}
      </div>
      <div class="grid-2">
        <div class="card"><h3 style="margin-bottom: 1.5rem;">Revenue Overview (Last 7 Days)</h3><div class="chart-container"><canvas id="revenueChart"></canvas></div></div>
        <div class="card">
          <h3 style="margin-bottom: 1.5rem;">Pending Verification</h3>
          <div style="display:flex; flex-direction:column; gap:1rem;">
            ${[1, 2].map(i => `
              <div style="display:flex; align-items:center; gap:1rem; padding:1rem; background:var(--color-bg-main); border-radius:8px;">
                <div style="width:40px; height:40px; background:var(--color-blue-light); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; color:var(--color-blue-dark)">${String.fromCharCode(64 + i)}</div>
                <div style="flex:1;"><p style="font-weight:bold; font-size:14px;">Customer Name ${i}</p><p style="font-size:12px; color:var(--color-text-soft);">Route: Bangkok - Pattaya</p></div>
                <div style="text-align:right;"><p style="font-weight:bold; color:var(--color-blue-dark);">฿450.00</p><p style="font-size:10px; color:var(--color-text-soft);">2 mins ago</p></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStatCard(title, valueHtml, icon, trend, trendValue, valueId = '', labelId = '') {
  return `
    <div class="card">
      <div class="flex-start" style="margin-bottom:1rem;">
        <div class="icon-box"><i data-lucide="${icon}"></i></div>
        <div class="badge ${trend}"><i data-lucide="${trend === 'up' ? 'arrow-up-right' : 'arrow-down-right'}"></i> ${trendValue}</div>
      </div>
      <p id="${labelId}" style="font-size:14px; color:var(--color-text-soft); margin-bottom:4px;">${title}</p>
      <h2 id="${valueId}" style="font-size:24px;">${valueHtml}</h2>
    </div>
  `;
}

function getRoutesHtml() {
  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      <div class="flex-between">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" placeholder="ค้นหาเส้นทาง (ชื่อ, รหัส)..." oninput="window.handleRouteSearch(this.value)">
        </div>
        <button class="btn-primary" onclick="window.openAddRouteModal()"><i data-lucide="plus"></i> Add New Route</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Route Info</th><th>Stops & Prices</th><th>Final Fare</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody id="routes-table-body">
            <tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--color-text-soft);">กำลังโหลดข้อมูล...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="route-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center; padding: 1rem;">
        <div class="card" style="width:100%; max-width:500px; max-height: 90vh; overflow-y: auto;">
          <div class="flex-between" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border-light); padding-bottom: 1rem;">
            <h3>เพิ่มเส้นทางใหม่ (Add Route)</h3>
            <button class="btn-icon" onclick="window.closeAddRouteModal()"><i data-lucide="x"></i></button>
          </div>
          <form id="add-route-form" onsubmit="window.submitNewRoute(event)" style="display:flex; flex-direction:column; gap:1rem;">
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">รหัสเส้นทาง <span style="color:red">*</span></label>
              <input type="text" id="route-id" required placeholder="เช่น R001" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none;">
            </div>
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ต้นทาง <span style="color:red">*</span></label>
              <input type="text" id="route-origin" required placeholder="เช่น กรุงเทพฯ (หมอชิต)" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none;">
            </div>
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ปลายทาง <span style="color:red">*</span></label>
              <input type="text" id="route-dest" required placeholder="เช่น พัทยา" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none;">
            </div>
            <div style="display:flex; gap:1rem;">
              <div style="flex:1;">
                <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ราคา (บาท) <span style="color:red">*</span></label>
                <input type="number" id="route-fare" required placeholder="150" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none;">
              </div>
              <div style="flex:1;">
                <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">สถานะ</label>
                <select id="route-status" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; background:white;">
                  <option value="true">เปิดใช้งาน</option>
                  <option value="false">ปิดชั่วคราว</option>
                </select>
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border-light);">
              <button type="button" onclick="window.closeAddRouteModal()" style="padding:10px 20px; border-radius:8px; border:1px solid var(--color-border-light); background:white; cursor:pointer; font-weight:bold;">ยกเลิก</button>
              <button type="submit" class="btn-primary" style="padding:10px 20px;">บันทึกเส้นทาง</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function getSchedulesHtml() {
  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      <div class="flex-between">
        <h3>Trip Schedules</h3>
        <button class="btn-primary" id="btn-create-schedule"><i data-lucide="plus"></i> Create Schedule</button>
      </div>
      <div id="day-filter-bar" style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; padding: 0.75rem 1rem; background:var(--color-bg-main); border-radius:12px; border:1px solid var(--color-border-light);">
        <span style="font-size:13px; color:var(--color-text-soft); margin-right:4px;"><i data-lucide="calendar" style="width:14px; height:14px; vertical-align:middle;"></i> เลือกวัน:</span>
        <p style="font-size:13px; color:var(--color-text-soft);">กำลังโหลด...</p>
      </div>
      <div class="grid-2">
        <div id="schedules-list" style="display:flex; flex-direction:column; gap:1rem; height: 600px; overflow-y: auto; padding-right: 10px;">
          <p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูลรอบรถ...</p>
        </div>
        <div class="card" id="seat-panel" style="height: 600px; overflow-y:auto; position: sticky; top: 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--color-text-soft);">
          <i data-lucide="armchair" style="width:48px; height:48px; opacity:0.2; margin-bottom:1rem;"></i>
          <p style="font-size:13px; opacity:0.5;">เลือกรอบเดินทางเพื่อดูแผนผังที่นั่ง</p>
        </div>
      </div>
    </div>
  `;
}

function getUsersHtml() {
  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      <div class="flex-between" style="flex-wrap: wrap; gap: 1rem;">
        <div style="display:flex; gap:0.5rem; background:var(--color-bg-main); padding:4px; border-radius:8px;">
          <button onclick="window.fetchAndRenderUsers('all')" style="padding:6px 16px; border:none; background:var(--color-blue-mid); color:white; border-radius:6px; font-weight:bold; cursor:pointer;">All</button>
          <button onclick="window.fetchAndRenderUsers('driver')" style="padding:6px 16px; border:none; background:none; color:var(--color-text-soft); font-weight:bold; cursor:pointer;">Drivers</button>
          <button onclick="window.fetchAndRenderUsers('user')" style="padding:6px 16px; border:none; background:none; color:var(--color-text-soft); font-weight:bold; cursor:pointer;">Customers</button>
        </div>
        <button class="btn-primary" onclick="window.openAddUserModal()"><i data-lucide="user-plus"></i> Add User</button>
      </div>
      <div id="users-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
        <p style="grid-column: 1 / -1; text-align:center; padding: 2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
      </div>
    </div>
  `;
}

function getPaymentsHtml() {
  return `
    <div class="grid-2">
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <h3 style="margin-bottom:0.5rem;">Pending Verifications</h3>
        <div id="payments-list" style="display:flex; flex-direction:column; gap:1rem; height: 600px; overflow-y: auto; padding-right: 10px;">
          <p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดรายการโอนเงิน...</p>
        </div>
      </div>
      <div class="card" style="display:flex; flex-direction:column; height: 600px; padding:0; overflow:hidden; position: sticky; top: 20px;">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--color-border-light); background: var(--color-bg-main);">
          <h4>Slip Preview</h4>
        </div>
        <div id="slip-preview" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--color-bg-main); color:var(--color-text-soft);">
          <i data-lucide="eye" style="width:64px; height:64px; opacity:0.3; margin-bottom:1rem;"></i>
          <p style="text-transform:uppercase; font-weight:bold; font-size:12px; opacity:0.5;">Select a slip to preview</p>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 9. Mobile Menu & Init
// ==========================================
function closeMobileMenu() {
  const overlay = document.getElementById('mobile-overlay');
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('show');
  if (overlay) overlay.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  renderContent();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "user", user.uid));
      if (userDoc.exists()) {
        const username = userDoc.data().username || "Admin";
        const initials = username.substring(0, 2).toUpperCase();
        document.querySelector(".user-name").textContent = username;
        document.querySelector(".user-avatar").textContent = initials;
      }
    } else {
      window.location.href = "../login.html";
    }
  });

  const mobileToggle = document.getElementById('mobile-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('show');
      document.getElementById('mobile-overlay').classList.add('show');
    });
  }

  const mobileOverlay = document.getElementById('mobile-overlay');
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

  const logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = '../login.html';
    });
  }
});