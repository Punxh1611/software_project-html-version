<<<<<<< HEAD
import { toast } from "../toast.js";

const supabaseUrl = 'https://skfibvoeoqnhxmrwjitk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZmlidm9lb3FuaHhtcndqaXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTEyODUsImV4cCI6MjA5MDM2NzI4NX0.Ul8BxGgCtFh29O0c0HgKuJ5d33KMG9gS9AuFCu8GRzM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. ระบบ Navigation และ Layout หลัก
=======
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
>>>>>>> origin/dev/nwd
// ==========================================
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'routes', label: 'Manage Routes', icon: 'map-pin' },
<<<<<<< HEAD
  { id: 'vans', label: 'Manage Vans', icon: 'bus' },
  { id: 'schedules', label: 'Manage Schedules', icon: 'calendar' },
  { id: 'drivers', label: 'Manage Drivers', icon: 'users' },
=======
  { id: 'schedules', label: 'Manage Schedules', icon: 'calendar' },
  { id: 'users', label: 'Manage Users', icon: 'users' },
>>>>>>> origin/dev/nwd
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
<<<<<<< HEAD
    case 'vans':
      container.innerHTML = getVansHtml();
      window.fetchAndRenderVans();
      break;
    case 'schedules':
      container.innerHTML = getSchedulesHtml();
      window.fetchAndRenderSchedules();
      break;
    case 'drivers':
      container.innerHTML = getDriversHtml();
      window.fetchAndRenderDrivers();
=======
    case 'schedules':
      container.innerHTML = getSchedulesHtml();
      fetchAndRenderSchedules();
      document.getElementById('btn-create-schedule')?.addEventListener('click', openCreateScheduleModal);
      break;
    case 'users':
      container.innerHTML = getUsersHtml();
      window.fetchAndRenderUsers('all');
>>>>>>> origin/dev/nwd
      break;
    case 'payments':
      container.innerHTML = getPaymentsHtml();
      window.fetchAndRenderPayments();
      break;
  }

  if (window.lucide) window.lucide.createIcons();
}

<<<<<<< HEAD

// ==========================================
// 2. Dashboard (เวอร์ชันดูกราฟจาก "วันที่รถออกเดินทาง" depart_time)
// ==========================================
async function fetchAndRenderDashboard() {
  try {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    // ดึงข้อมูลการจองที่รอตรวจ (ใช้ id ในการเรียงลำดับแทน created_at)
    const resPending = await supabase.from('bookings').select('*, users!user_id(username)').in('status', ['pending', 'slip_uploaded']).order('id', { ascending: false });
    
    // 🛑 ดึงข้อมูลการจองที่ Confirm แล้ว พร้อมดึง "วันที่รถออกเดินทาง (depart_time)" มาใช้แทน
    const resConfirmedBookings = await supabase.from('bookings').select('amount, van_schedules(depart_time, routes(destination))').eq('status', 'confirmed');

    if (resPending.error) throw resPending.error;
    if (resConfirmedBookings.error) throw resConfirmedBookings.error;

    const pendingBookings = resPending.data || [];
    const confirmedBookings = resConfirmedBookings.data || [];

    // --- ส่วนที่ 1: คำนวณจังหวัดปลายทางยอดฮิตและน้อยสุด ---
    const destCount = {};
    confirmedBookings.forEach(b => {
      const dest = b.van_schedules?.routes?.destination;
      if (dest) destCount[dest] = (destCount[dest] || 0) + 1;
    });

    let topDest = '-'; let leastDest = '-';
    let maxVal = -1; let minVal = Infinity;

    const destKeys = Object.keys(destCount);
    if (destKeys.length > 0) {
      destKeys.forEach(dest => {
        if (destCount[dest] > maxVal) { maxVal = destCount[dest]; topDest = dest; }
        if (destCount[dest] < minVal) { minVal = destCount[dest]; leastDest = dest; }
      });
      document.getElementById('stat-top-dest').innerHTML = `${topDest} <br><small style="font-size:14px; color:var(--color-text-soft);">(${maxVal} การจอง)</small>`;
      document.getElementById('stat-least-dest').innerHTML = `${leastDest} <br><small style="font-size:14px; color:var(--color-text-soft);">(${minVal} การจอง)</small>`;
    } else {
      document.getElementById('stat-top-dest').innerHTML = 'ไม่มีข้อมูล';
      document.getElementById('stat-least-dest').innerHTML = 'ไม่มีข้อมูล';
    }

    // --- ส่วนที่ 2: Pending Payments (ยอดรอตรวจ) ---
    document.getElementById('stat-pending-payments').innerHTML = pendingBookings.length;
    const pendingListContainer = document.getElementById('dashboard-pending-list');
    
    if (pendingBookings.length === 0) {
      pendingListContainer.innerHTML = '<div style="text-align:center; padding:2rem; background:var(--color-bg-main); border-radius:8px;"><p style="color:var(--color-text-soft);">ไม่มีรายการรอตรวจสอบสลิป 🎉</p></div>';
    } else {
      pendingListContainer.innerHTML = pendingBookings.slice(0, 4).map(b => {
        const name = b.users?.username || 'Unknown Customer';
        return `
          <div style="display:flex; align-items:center; gap:1rem; padding:1rem; background:var(--color-bg-main); border-radius:8px; border-left: 4px solid var(--color-warning);">
            <div style="flex:1;">
              <p style="font-weight:bold; font-size:14px;">${name}</p>
              <p style="font-size:12px; color:var(--color-text-soft);">Booking ID: ${String(b.id).substring(0, 8)}</p>
            </div>
            <div style="text-align:right;">
              <p style="font-weight:bold; color:var(--color-blue-dark);">฿${b.amount}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    // --- ส่วนที่ 3: คำนวณรายได้ย้อนหลัง 7 วัน (อิงจากวันที่รถออกเดินทาง) ---
    const chartLabels = [];
    const chartData = [0, 0, 0, 0, 0, 0, 0]; // เตรียม Array ว่างไว้ 7 วัน
    const dateIndexMap = {}; // ตัวช่วยจับคู่วันที่กับ Index ของกราฟ
    let todayTotalRevenue = 0;

    // สร้าง Label กราฟย้อนหลัง 7 วัน
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      const checkDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const displayLabel = d.toLocaleString('en-US', { month: 'short', day: 'numeric' }); 
      
      chartLabels.push(displayLabel);
      dateIndexMap[checkDateStr] = 6 - i; // เก็บ Index ไว้เติมเงินใส่กราฟให้ถูกช่อง
    }

    // จัดกรุ๊ปรายได้ตามวันที่รถออกเดินทาง
    confirmedBookings.forEach(b => {
        const dTime = b.van_schedules?.depart_time;
        if(dTime) {
            const dt = new Date(dTime.replace(' ', 'T'));
            // แปลง depart_time ให้เป็นฟอร์แมต YYYY-MM-DD
            const dtStr = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
            
            // ถ้ารอบรถนั้นอยู่ในช่วง 7 วันที่เราวาดกราฟ ให้บวกเงินเข้าไป
            if(dateIndexMap[dtStr] !== undefined) {
                const amount = Number(b.amount) || 0;
                chartData[dateIndexMap[dtStr]] += amount;
                
                // ถ้ารถออกวันนี้ ให้บวกเข้ายอดรวมของวันนี้ด้วย
                if(dtStr === todayStr) {
                    todayTotalRevenue += amount;
                }
            }
        }
    });

    // อัปเดตยอดเงินของวันนี้ (รอบรถที่ออกวันนี้)
    document.getElementById('stat-daily-revenue').innerHTML = `฿${todayTotalRevenue.toLocaleString()}`;
    const revLabel = document.getElementById('stat-daily-revenue-label');
    if(revLabel) revLabel.innerText = "รายได้จากรอบรถวันนี้ (Departing Today)";

    // เปลี่ยนชื่อกราฟให้เข้าใจง่ายขึ้น
    const chartTitle = document.querySelector('#content-area h3');
    if(chartTitle && chartTitle.innerText.includes('Revenue Overview')) {
        chartTitle.innerText = 'Revenue by Trip Departure (Last 7 Days)';
    }

    // ส่งข้อมูลไปวาดกราฟ
    renderRevenueChart(chartLabels, chartData);

    if (window.lucide) window.lucide.createIcons();

  } catch (error) {
    console.error("Error loading dashboard data: ", error.message);
  }
}

function renderRevenueChart(labels = [], dataPoints = []) {
=======
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
>>>>>>> origin/dev/nwd
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
<<<<<<< HEAD
      labels: labels, // ใช้วันที่จริง
      datasets: [{
        label: 'Daily Revenue (฿)',
        data: dataPoints, // ใช้ยอดเงินจริง
=======
      labels: ['Mar 15', 'Mar 16', 'Mar 17', 'Mar 18', 'Mar 19', 'Mar 20', 'Mar 21'],
      datasets: [{
        label: 'Daily Revenue (฿)',
        data: [10500, 15000, 9800, 13200, 16800, 14000, 12450],
>>>>>>> origin/dev/nwd
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
<<<<<<< HEAD
        y: {
          beginAtZero: true,
          ticks: { callback: v => '฿' + v.toLocaleString() }
        },
=======
        y: { beginAtZero: true, ticks: { callback: v => '฿' + v.toLocaleString() } },
>>>>>>> origin/dev/nwd
        x: { grid: { display: false } }
      }
    }
  });
}

// ==========================================
<<<<<<< HEAD
// 3. จัดการเส้นทางเดินรถ (Manage Routes)
// ==========================================
let currentEditRouteId = null;

// --- อัปเดต 1: โชว์เวลาเดินทางในตาราง ---
window.fetchAndRenderRoutes = async function () {
  const tableBody = document.getElementById('routes-table-body');
  if (!tableBody) return;
  try {
    const { data: routes, error } = await supabase.from('routes').select('*').order('id', { ascending: true });
    if (error) throw error;
    tableBody.innerHTML = '';
    if (!routes || routes.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">ยังไม่มีข้อมูลเส้นทาง</td></tr>';
      return;
    }
    routes.forEach(r => {
      const hoursStr = r.estimated_hours ? `${r.estimated_hours} ชม.` : '<span style="color:red">ไม่ได้ระบุ</span>';
      const tr = document.createElement('tr');
      tr.innerHTML = `
                <td><strong>${r.origin}</strong></td>
                <td><strong>${r.destination}</strong></td>
                <td><small style="color:var(--color-text-soft); background:var(--color-bg-main); padding:2px 6px; border-radius:4px;">⏱️ ${hoursStr}</small></td>
                <td style="color:var(--color-blue-dark); font-weight:bold;">฿${r.price}</td>
                <td style="text-align:right;">
                    <button class="btn-icon" onclick='window.openRouteModal(${JSON.stringify(r)})' title="แก้ไข"><i data-lucide="edit-2"></i></button>
                    <button class="btn-icon" onclick="window.deleteRoute('${r.id}')" title="ลบ" style="color:var(--color-danger);"><i data-lucide="trash-2"></i></button>
                </td>
            `;
      tableBody.appendChild(tr);
    });
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">โหลดข้อมูลล้มเหลว</td></tr>';
  }
};

// --- อัปเดต 2: ดึงค่าเวลามาใส่ใน Modal ---
window.openRouteModal = function (route = null) {
  currentEditRouteId = route ? route.id : null;
  document.getElementById('route-modal').style.display = 'flex';
  document.getElementById('route-modal-title').textContent = route ? 'แก้ไขเส้นทาง' : 'เพิ่มเส้นทางใหม่';

  if (route) {
    document.getElementById('route-origin').value = route.origin || '';
    document.getElementById('route-destination').value = route.destination || '';
    document.getElementById('route-price').value = route.price || '';
    document.getElementById('route-hours').value = route.estimated_hours || ''; // เพิ่มบรรทัดนี้
  } else {
    document.getElementById('route-form').reset();
  }
};
window.closeRouteModal = function () {
  currentEditRouteId = null; // Reset State
  document.getElementById('route-modal').style.display = 'none';
};
// --- อัปเดต 3: บันทึกค่าเวลาลงฐานข้อมูล ---
window.saveRoute = async function (e) {
  e.preventDefault();
  const origin = document.getElementById('route-origin').value.trim();
  const destination = document.getElementById('route-destination').value.trim();
  const price = parseFloat(document.getElementById('route-price').value);
  const estimated_hours = parseFloat(document.getElementById('route-hours').value); // เพิ่มบรรทัดนี้

  if (!origin || !destination || isNaN(price) || isNaN(estimated_hours)) {
    alert("กรุณากรอกข้อมูลให้ครบและถูกต้อง"); return;
  }

  try {
    const payload = { origin, destination, price, estimated_hours }; // ส่งค่า estimated_hours ไปด้วย

    if (currentEditRouteId) {
      await supabase.from('routes').update(payload).eq('id', currentEditRouteId);
      toast ? toast('อัปเดตเส้นทางสำเร็จ!', 'success') : alert('อัปเดตเส้นทางสำเร็จ!');
    } else {
      await supabase.from('routes').insert([payload]);
      toast ? toast('เพิ่มเส้นทางใหม่สำเร็จ!', 'success') : alert('เพิ่มเส้นทางใหม่สำเร็จ!');
    }
    window.closeRouteModal();
    window.fetchAndRenderRoutes();
  } catch (error) { alert('บันทึกไม่สำเร็จ: ' + error.message); }
};

window.deleteRoute = async function (id) {
  if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเส้นทางนี้? (หากมีรถตู้หรือรอบรถผูกอยู่จะไม่สามารถลบได้)')) return;
  try {
    const { error } = await supabase.from('routes').delete().eq('id', id);
    if (error) throw error;
    alert('ลบเส้นทางสำเร็จ');
    window.fetchAndRenderRoutes();
  } catch (error) {
    alert('ไม่สามารถลบได้ (อาจมีข้อมูลรถตู้หรือรอบเดินรถกำลังใช้งานเส้นทางนี้อยู่): ' + error.message);
  }
};

// ==========================================
// 4. จัดการรถตู้ (Manage Vans)
// ==========================================
let currentEditVanId = null;

window.fetchAndRenderVans = async function () {
  const tableBody = document.getElementById('vans-table-body');
  if (!tableBody) return;

  try {
    // ดึงข้อมูลรถตู้ และดึงชื่อปลายทางจากตาราง routes มาด้วย
    const { data: vans, error } = await supabase
      .from('vans')
      .select('*, routes(destination)')
      .order('id', { ascending: false });

    if (error) throw error;
    tableBody.innerHTML = '';

    if (!vans || vans.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem;">ยังไม่มีข้อมูลรถตู้</td></tr>';
      return;
    }

    vans.forEach(van => {
      // เช็คว่ารถคันนี้มี default_route_id ไหม ถ้ามีโชว์ชื่อสาย ถ้าไม่มีโชว์ว่าวิ่งอิสระ
      const routeName = van.routes ? `สาย ${van.routes.destination}` : '<span style="color:gray;">รถสำรอง/วิ่งอิสระ</span>';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
                <td><strong style="color:var(--color-blue-dark);">${van.plate_number}</strong></td>
                <td>${van.capacity} ที่นั่ง</td>
                <td>${routeName}</td>
                <td style="text-align:right;">
                    <button class="btn-icon" onclick='window.openVanModal(${JSON.stringify(van)})' title="แก้ไข"><i data-lucide="edit-2"></i></button>
                    <button class="btn-icon" onclick="window.deleteVan('${van.id}')" title="ลบ" style="color:var(--color-danger);"><i data-lucide="trash-2"></i></button>
                </td>
            `;
      tableBody.appendChild(tr);
    });
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error fetching vans:", error);
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">โหลดข้อมูลล้มเหลว</td></tr>';
  }
};

window.openVanModal = async function (van = null) {
  currentEditVanId = van ? van.id : null;
  document.getElementById('van-modal').style.display = 'flex';
  document.getElementById('van-modal-title').textContent = van ? 'แก้ไขข้อมูลรถตู้' : 'เพิ่มรถตู้ใหม่';

  const routeSelect = document.getElementById('van-default-route');
  try {
    const { data: routes } = await supabase.from('routes').select('id, origin, destination');
    routeSelect.innerHTML = '<option value="">-- ไม่ระบุ (รถวิ่งอิสระ) --</option>';
    if (routes) {
      routes.forEach(r => {
        const isSelected = (van && van.default_route_id === r.id) ? 'selected' : '';
        routeSelect.innerHTML += `<option value="${r.id}" ${isSelected}>${r.origin} ➔ ${r.destination}</option>`;
      });
    }
  } catch (e) { console.error(e); }

  if (van) {
    document.getElementById('van-plate').value = van.plate_number;
    document.getElementById('van-capacity').value = van.capacity;
  } else {
    document.getElementById('van-form').reset();
    document.getElementById('van-capacity').value = 14;
  }
};

window.closeVanModal = function () {
  currentEditVanId = null; // Reset State
  document.getElementById('van-modal').style.display = 'none';
};

window.saveVan = async function (e) {
  e.preventDefault();
  const plate = document.getElementById('van-plate').value.trim();
  const capacity = parseInt(document.getElementById('van-capacity').value);
  
  // ดึงค่าจาก Dropdown ว่าเลือกสายไหนไว้
  const routeId = document.getElementById('van-default-route').value;

  if (!plate || isNaN(capacity)) return;

  try {
    // เอา default_route_id ใส่กลับเข้าไปใน Payload เพื่อส่งไปฐานข้อมูล
    const payload = {
      plate_number: plate,
      capacity: capacity,
      default_route_id: routeId ? parseInt(routeId) : null // ถ้าไม่เลือกสาย จะส่งค่า null (วิ่งอิสระ)
    };

    if (currentEditVanId) {
      const { error } = await supabase.from('vans').update(payload).eq('id', currentEditVanId);
      if (error) throw error;
      alert('อัปเดตข้อมูลสำเร็จ!');
    } else {
      const { error } = await supabase.from('vans').insert([payload]);
      if (error) throw error;
      alert('เพิ่มรถตู้ใหม่สำเร็จ!');
    }

    window.closeVanModal();
    window.fetchAndRenderVans();
  } catch (error) {
    console.error("Error saving van:", error);
    alert('บันทึกไม่สำเร็จ: ' + error.message);
  }
};
window.deleteVan = async function (id) {
  if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรถตู้คันนี้?')) return;
  try {
    const { error } = await supabase.from('vans').delete().eq('id', id);
    if (error) throw error;
    alert('ลบข้อมูลสำเร็จ');
    window.fetchAndRenderVans();
  } catch (error) {
    alert('ไม่สามารถลบได้ (อาจมีรอบรถผูกอยู่): ' + error.message);
  }
};

// ==========================================
// 5. Schedules (จัดการรอบรถ)
// ==========================================
let currentEditScheduleId = null;
let currentEditScheduleData = null;

let formRoutesData = [];
let formVansData = [];
let formDriversData = [];
let formSchedulesData = [];

window.fetchAndRenderSchedules = async function () {
=======
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
      fetchAndRenderSchedules();
    } catch (error) {
      console.error(error);
      toast('เกิดข้อผิดพลาด ไม่สามารถบันทึกได้', 'error');
    }
  });
}

async function fetchAndRenderSchedules() {
>>>>>>> origin/dev/nwd
  const schedulesList = document.getElementById('schedules-list');
  if (!schedulesList) return;

  try {
<<<<<<< HEAD
    schedulesList.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูลรอบรถ...</p>';

    // 🛑 แก้ไข Query: ดึง full_name จากตาราง drivers โดยตรง
    const { data: schedules, error } = await supabase
      .from('van_schedules')
      .select(`
                *, 
                routes (origin, destination, price), 
                vans (plate_number), 
                drivers (full_name, users(username)) 
            `)
      .order('depart_time', { ascending: true });

    if (error) throw error;
    schedulesList.innerHTML = '';

    if (!schedules || schedules.length === 0) {
      schedulesList.innerHTML = '<p style="text-align:center; padding:2rem;">ยังไม่มีข้อมูลรอบรถ</p>';
      return;
    }

    schedules.forEach(d => {
      const tripDate = new Date(d.depart_time);
      const day = tripDate.getDate();
      const monthShort = tripDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const timeStr = tripDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      const bookedSeats = d.total_seats - d.available_seats;
      const origin = d.routes ? d.routes.origin : 'ไม่ระบุ';
      const dest = d.routes ? d.routes.destination : 'ไม่ระบุ';
      const displayPrice = d.price ?? (d.routes ? d.routes.price : 0);

      // 🛑 แก้ไขการแสดงผลชื่อ: ดึงจาก driverData.full_name เป็นหลัก ถ้าไม่มีให้ใช้ username
      const driverData = d.drivers;
      const driverName = driverData ? (driverData.full_name || driverData.users?.username) : 'ยังไม่ระบุคนขับ';
      
      const plateNumber = d.vans?.plate_number || '-';
=======
    const querySnapshotTrips = await getDocs(collection(db, "trips"));
    const routesSnapshot = await getDocs(collection(db, "routes"));
    const routesMap = {};
    routesSnapshot.forEach(d => {
      routesMap[d.data().routeId] = { origin: d.data().origin, destination: d.data().destination };
    });

    schedulesList.innerHTML = '';

    if (querySnapshotTrips.empty) {
      schedulesList.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-text-soft);">ไม่พบข้อมูลรอบรถ</p>';
      return;
    }

    querySnapshotTrips.forEach(d => {
      const data = d.data();
      const routeInfo = routesMap[data.routeId] || { origin: 'Unknown', destination: 'Unknown Route' };
      const tripDate = new Date(data.date);
      const day = tripDate.getDate();
      const monthShort = tripDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();

      let statusBadge = '';
      if (data.status === 'waiting') statusBadge = '<span class="badge loading">Waiting</span>';
      else if (data.status === 'on-way') statusBadge = '<span class="badge warning">On-Way</span>';
      else if (data.status === 'completed') statusBadge = '<span class="badge up">Completed</span>';

      const bookedSeats = (data.totalSeats || 0) - (data.availableSeats || 0);
>>>>>>> origin/dev/nwd

      const div = document.createElement('div');
      div.className = 'card flex-between';
      div.style.cursor = 'pointer';
<<<<<<< HEAD
      div.style.marginBottom = '1rem';
      div.innerHTML = `
                <div class="gap-2">
                    <div style="background:var(--color-bg-main); padding:0.75rem 1rem; border-radius:8px; text-align:center;">
                        <small style="color:var(--color-text-soft);">${monthShort}</small><br><b style="font-size:1.25rem;">${day}</b>
                    </div>
                    <div>
                        <span class="badge ${d.available_seats > 0 ? 'info' : 'warning'}">${d.available_seats > 0 ? 'Available' : 'Full'}</span>
                        <h4 style="margin: 4px 0 2px 0;">${origin} &rarr; ${dest}</h4>
                        <small style="color:var(--color-text-soft);">${timeStr} น. | 🧑‍✈️ ${driverName} (${plateNumber})</small>
                        <br><small style="color:var(--color-blue-dark);">จองแล้ว: ${bookedSeats}/${d.total_seats} ที่นั่ง</small>
                    </div>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 1rem;">
                    <p style="font-weight: bold; color: var(--color-blue-mid); font-size: 1.1rem;">฿${displayPrice}</p>
                    <i data-lucide="chevron-right" style="color:var(--color-text-soft);"></i>
                </div>
            `;
=======
      div.innerHTML = `
        <div class="gap-2">
          <div style="background:var(--color-bg-main); padding:0.75rem 1rem; border-radius:8px; text-align:center;">
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
>>>>>>> origin/dev/nwd

      div.addEventListener('click', () => {
        document.querySelectorAll('#schedules-list .card').forEach(c => c.style.borderColor = '');
        div.style.borderColor = 'var(--color-blue-mid)';
<<<<<<< HEAD
        window.renderScheduleForm(d);
=======
        renderSeatMap(data.totalSeats || 0, bookedSeats);
>>>>>>> origin/dev/nwd
      });

      schedulesList.appendChild(div);
    });
<<<<<<< HEAD
    
    if (window.lucide) window.lucide.createIcons();
    
  } catch (error) {
    console.error("Error loading schedules: ", error.message);
    schedulesList.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">โหลดล้มเหลว: ${error.message}</p>`;
  }
};

window.renderScheduleForm = async function (schedule = null) {
  currentEditScheduleId = schedule ? schedule.id : null;
  currentEditScheduleData = schedule;
  const panel = document.getElementById('schedule-form-panel');
  if (!panel) return;

  panel.style.display = 'block';
  panel.innerHTML = '<p style="text-align:center; margin-top: 3rem;">กำลังโหลดข้อมูล...</p>';

  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() - 3);
  const pastDateStr = checkDate.toISOString().split('T')[0];

  const [resRoutes, resVans, resDrivers, resSchedules] = await Promise.all([
    supabase.from('routes').select('*'),
    supabase.from('vans').select('*').eq('is_active', true),
    supabase.from('drivers').select('*'),
    supabase.from('van_schedules').select('id, driver_id, van_id, depart_time, route_id, routes(estimated_hours)').gte('depart_time', `${pastDateStr}T00:00:00`)
  ]);

  formRoutesData = resRoutes.data || [];
  formVansData = resVans.data || [];
  formDriversData = resDrivers.data || [];
  formSchedulesData = resSchedules.data || [];

  let routesOptions = '<option value="" data-price="">-- เลือกเส้นทาง --</option>';
  formRoutesData.forEach(r => {
    const isSelected = (schedule && schedule.route_id === r.id) ? 'selected' : '';
    routesOptions += `<option value="${r.id}" data-price="${r.price}" ${isSelected}>${r.origin} ➔ ${r.destination}</option>`;
  });

  let driversOptions = '<option value="">-- เลือกคนขับ --</option>';
  formDriversData.forEach(d => {
    const isSelected = (schedule && schedule.driver_id === d.id) ? 'selected' : '';
    driversOptions += `<option value="${d.id}" ${isSelected}>🧑‍✈️ ${d.full_name || 'ไม่ระบุชื่อ'}</option>`;
  });

  const now = new Date();
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  let defaultDate = todayStr;
  let defaultHour = String(now.getHours()).padStart(2, '0'); 
  let defaultMinute = '00';

  if (schedule && schedule.depart_time) {
    const dt = new Date(schedule.depart_time);
    defaultDate = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    defaultHour = String(dt.getHours()).padStart(2, '0');
    defaultMinute = String(dt.getMinutes()).padStart(2, '0');
  }

  const defaultTime = `${defaultHour}:${defaultMinute}`;

  // 🌟 กำหนดสถานะเริ่มต้นเป็น available
  const currentStatus = schedule ? (schedule.status || 'available') : 'available';

  panel.innerHTML = `
        <div style="padding: 0.5rem;">
            <div class="flex-between" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border-light); padding-bottom: 1rem;">
                <h3 style="color:var(--color-blue-dark);">${schedule ? '✏️ แก้ไขรอบรถ' : '✨ สร้างรอบเดินทางใหม่'}</h3>
                ${schedule ? `<button type="button" class="btn-icon" onclick="window.deleteSchedule('${schedule.id}')" title="ลบ" style="color:var(--color-danger);"><i data-lucide="trash-2"></i> ลบ</button>` : ''}
            </div>
            
            <div style="display:flex; flex-direction:column; gap:1.2rem;">
                
                ${schedule ? `
                <div style="background: #f0fdf4; padding: 10px; border-radius: 8px; border: 1px dashed #bbf7d0;">
                    <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">สถานะการเดินทาง</label>
                    <select id="sch-status" style="width: 100%; padding: 8px; border: 1px solid var(--color-border-light); border-radius: 8px; font-weight: bold; background: white;">
                        <option value="available" ${currentStatus === 'available' ? 'selected' : ''}>✅ พร้อมเดินทาง (Available)</option>
                        <option value="traveling" ${currentStatus === 'traveling' ? 'selected' : ''}>🚐 กำลังเดินทาง</option>
                        <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>🏁 ถึงที่หมายแล้ว</option>
                        <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>❌ ยกเลิก</option>
                    </select>
                </div>
                ` : `<input type="hidden" id="sch-status" value="available">`}

                <div>
                    <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เส้นทาง <span style="color:red">*</span></label>
                    <select id="sch-route" onchange="document.getElementById('sch-price').value = this.options[this.selectedIndex].getAttribute('data-price') || ''; window.updateSmartDropdowns();" style="width: 100%; padding: 10px; border: 1px solid var(--color-border-light); border-radius: 8px;">
                        ${routesOptions}
                    </select>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1;">
                        <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">วันที่เดินทาง <span style="color:red">*</span></label>
                        <input type="date" id="sch-date" value="${defaultDate}" min="${todayStr}" onchange="window.updateSmartDropdowns()" style="width: 100%; padding: 10px; border: 1px solid var(--color-border-light); border-radius: 8px;">
                    </div>
                    
                    <div style="flex: 1;">
                        <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เวลา <span style="color:red">*</span></label>
                        <input type="text" id="sch-time" value="${defaultTime}" style="width: 100%; padding: 10px; border: 1px solid var(--color-border-light); border-radius: 8px; font-family: inherit; cursor: pointer; background: #fff;" readonly placeholder="คลิกเลือกเวลา">
                    </div>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1;">
                        <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">รถตู้ (ทะเบียน) <span style="color:red">*</span></label>
                        <select id="sch-van" onchange="document.getElementById('sch-seats').value = this.options[this.selectedIndex].getAttribute('data-seats') || ''" style="width: 100%; padding: 10px; border: 1px solid var(--color-border-light); border-radius: 8px;">
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">คนขับรถ <span style="color:red">*</span></label>
                        <select id="sch-driver" style="width: 100%; padding: 10px; border: 1px solid var(--color-border-light); border-radius: 8px;">
                            ${driversOptions}
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1;">
                        <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ที่นั่งทั้งหมด <span style="color:red">*</span></label>
                        <input type="number" id="sch-seats" value="${schedule ? schedule.total_seats : ''}" style="width: 100%; padding: 10px; border: 1px solid var(--color-border-light); border-radius: 8px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ราคา <span style="color:red">*</span></label>
                        <input type="number" id="sch-price" value="${schedule ? schedule.price : ''}" style="width: 100%; padding: 10px; border: 1px solid var(--color-border-light); border-radius: 8px;">
                    </div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--color-border-light);">
                    <button type="button" onclick="window.clearScheduleForm()" style="padding:10px 20px; border-radius:8px; border:1px solid var(--color-border-light); background:white; cursor:pointer; font-weight:bold;">ยกเลิก</button>
                    <button type="button" id="btn-save-schedule" onclick="window.saveSchedule()" class="btn-primary" style="padding:10px 20px;">บันทึกข้อมูล</button>
                </div>
            </div>
        </div>
    `;
  
  if (window.lucide) window.lucide.createIcons();

  if (window.flatpickr) {
    window.flatpickr("#sch-time", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        defaultDate: defaultTime,
        onChange: function(selectedDates, dateStr, instance) {
            window.updateSmartDropdowns();
        }
    });
  }

  window.updateSmartDropdowns(schedule ? schedule.van_id : null, schedule ? schedule.driver_id : null);
};

window.updateSmartDropdowns = function (preSelectVanId = null, preSelectDriverId = null) {
  const routeId = document.getElementById('sch-route')?.value;
  const dateInput = document.getElementById('sch-date');
  const timeInput = document.getElementById('sch-time');

  // 🛑 ถ้าหาช่องวันที่หรือเวลาไม่เจอ ให้หยุดทำงาน (ป้องกัน Error)
  if (!dateInput || !timeInput) return;

  const dateVal = dateInput.value;
  const timeVal = timeInput.value; 

  // แยกชั่วโมงกับนาทีจากช่องเดียว
  let hourVal = '00';
  let minuteVal = '00';
  if (timeVal && timeVal.includes(':')) {
    const timeParts = timeVal.split(':');
    hourVal = timeParts[0];
    minuteVal = timeParts[1];
  }

  const currentVanId = preSelectVanId || document.getElementById('sch-van')?.value;
  const currentDriverId = preSelectDriverId || document.getElementById('sch-driver')?.value;

  const selectedRoute = formRoutesData.find(r => r.id == routeId);
  const outboundHours = selectedRoute ? (selectedRoute.estimated_hours || 4) : 4;

  const totalBusyHours = (outboundHours * 2) + 2;
  const totalBusyMs = totalBusyHours * 60 * 60 * 1000;

  let targetStart = null;
  let targetEnd = null;

  if (dateVal && timeVal) {
    const timeValStr = `${dateVal}T${hourVal}:${minuteVal}:00`;
    targetStart = new Date(timeValStr).getTime();
    targetEnd = targetStart + totalBusyMs;
  }

  // ฟังก์ชันเช็คว่ารถหรือคนขับติดคิวงานอื่นอยู่ไหม
  const checkIsBusy = (vehicleOrDriverId, type) => {
    if (!targetStart) return false;
    return formSchedulesData.some(sch => {
      const isMatch = type === 'van' ? sch.van_id === vehicleOrDriverId : sch.driver_id === vehicleOrDriverId;
      if (!isMatch || sch.id === currentEditScheduleId) return false;

      const safeTimeStr = sch.depart_time.replace(' ', 'T');
      const schDateStr = safeTimeStr.split('T')[0];
      if (dateVal === schDateStr) return true; // กฎ 1 วัน 1 คิว

      const schStart = new Date(safeTimeStr).getTime();
      const schOutboundHours = (sch.routes && sch.routes.estimated_hours) ? sch.routes.estimated_hours : 4;
      const schTotalBusyMs = ((schOutboundHours * 2) + 2) * 60 * 60 * 1000;
      const schEnd = schStart + schTotalBusyMs;

      return (targetStart < schEnd) && (schStart < targetEnd);
    });
  };

  // --- จัดการตัวเลือกรถตู้ ---
  let vansHtml = '<option value="">-- เลือกรถตู้ (ทะเบียน) --</option>';
  let matchedVans = [];
  let spareVans = [];

  formVansData.forEach(v => {
    const isBusy = checkIsBusy(v.id, 'van');
    const disabledAttr = isBusy ? 'disabled style="color: #ccc;"' : '';
    const busyText = isBusy ? ' ❌ (ติดคิว)' : '';
    const isSelected = (!isBusy && currentVanId == v.id) ? 'selected' : '';

    const optionStr = `<option value="${v.id}" data-seats="${v.capacity}" ${isSelected} ${disabledAttr}>🚌 ${v.plate_number} (${v.capacity} ที่นั่ง)${busyText}</option>`;

    if (routeId && v.default_route_id == routeId) {
      matchedVans.push(optionStr);
    } else if (!v.default_route_id || v.default_route_id === "") {
      spareVans.push(optionStr);
    }
  });

  if (matchedVans.length > 0) vansHtml += `<optgroup label="✅ รถประจำสายนี้">` + matchedVans.join('') + `</optgroup>`;
  if (spareVans.length > 0) vansHtml += `<optgroup label="⚪️ รถสำรอง (วิ่งอิสระ)">` + spareVans.join('') + `</optgroup>`;

  const vanSelect = document.getElementById('sch-van');
  if (vanSelect) {
    vanSelect.innerHTML = vansHtml;
    const selectedOption = vanSelect.options[vanSelect.selectedIndex];
    if (selectedOption && selectedOption.disabled) {
      vanSelect.value = "";
      document.getElementById('sch-seats').value = "";
    } else if (vanSelect.selectedIndex > 0 && !document.getElementById('sch-seats').value) {
      document.getElementById('sch-seats').value = selectedOption.getAttribute('data-seats');
    }
  }

  // --- จัดการตัวเลือกคนขับ ---
  let driversOptions = '<option value="">-- เลือกคนขับ --</option>';
  let availableDrivers = 0;

  formDriversData.forEach(d => {
    const driverProfileId = d.id;
    const driverFullName = d.full_name || 'ไม่ระบุชื่อ';

    if (driverProfileId) {
      const isBusy = checkIsBusy(driverProfileId, 'driver');
      const disabledAttr = isBusy ? 'disabled style="color: #ccc;"' : '';
      const busyText = isBusy ? ' ❌ (ติดคิว)' : '';
      const isSelected = (!isBusy && currentDriverId == driverProfileId) ? 'selected' : '';

      if (!isBusy) availableDrivers++;
      driversOptions += `<option value="${driverProfileId}" ${isSelected} ${disabledAttr}>🧑‍✈️ ${driverFullName}${busyText}</option>`;
    }
  });
  
  if (availableDrivers === 0 && targetStart) {
    driversOptions = '<option value="">❌ ไม่มีคนขับว่าง (ติดคิว/ยังตีรถกลับมาไม่ถึง)</option>' + driversOptions;
  }

  const driverDropdown = document.getElementById('sch-driver');
  if (driverDropdown) {
    driverDropdown.innerHTML = driversOptions;
    const selectedOption = driverDropdown.options[driverDropdown.selectedIndex];
    if (selectedOption && selectedOption.disabled) {
      driverDropdown.value = "";
    }
  }

  // --- ระบบควบคุมปุ่มบันทึกข้อมูล ---
  const btnSave = document.getElementById('btn-save-schedule');
  if (btnSave) {
    const availableVansCount = matchedVans.length + spareVans.length;
    const now = new Date().getTime();
    const isPast = targetStart ? (targetStart < now) : false;

    if (!timeVal) {
      btnSave.disabled = true;
      btnSave.style.background = '#e2e8f0';
      btnSave.style.color = '#94a3b8';
      btnSave.style.cursor = 'not-allowed';
      btnSave.innerHTML = 'รอระบุเวลา';
    } else if (isPast) {
      btnSave.disabled = true;
      btnSave.style.background = '#e2e8f0';
      btnSave.style.color = '#94a3b8';
      btnSave.style.cursor = 'not-allowed';
      btnSave.innerHTML = '❌ เวลาผ่านไปแล้ว';
    } else if (targetStart && availableDrivers === 0) {
      btnSave.disabled = true;
      btnSave.style.background = '#e2e8f0';
      btnSave.style.color = '#94a3b8';
      btnSave.style.cursor = 'not-allowed';
      btnSave.innerHTML = '❌ ไม่มีคนขับว่าง';
    } else if (targetStart && availableVansCount === 0) {
      btnSave.disabled = true;
      btnSave.style.background = '#e2e8f0';
      btnSave.style.color = '#94a3b8';
      btnSave.style.cursor = 'not-allowed';
      btnSave.innerHTML = '❌ ไม่มีรถตู้ว่าง';
    } else {
      btnSave.disabled = false;
      btnSave.style.background = 'var(--color-blue-dark)';
      btnSave.style.color = 'white';
      btnSave.style.cursor = 'pointer';
      btnSave.innerHTML = 'บันทึกข้อมูล';
    }
  }
};
window.saveSchedule = async function () {
  console.log("👉 ปุ่มบันทึกถูกกด กำลังตรวจสอบข้อมูล...");

  const routeId = document.getElementById('sch-route')?.value;
  const vanId = document.getElementById('sch-van')?.value; 
  const driverId = document.getElementById('sch-driver')?.value;
  const price = document.getElementById('sch-price')?.value;
  const seatsVal = document.getElementById('sch-seats')?.value;
  const seats = parseInt(seatsVal);

  const dateVal = document.getElementById('sch-date')?.value;
  const timeVal = document.getElementById('sch-time')?.value; 

  let missingFields = [];
  if (!routeId || routeId === "undefined" || routeId === "null" || routeId === "") missingFields.push("เส้นทาง");
  if (!dateVal) missingFields.push("วันที่เดินทาง");
  if (!timeVal) missingFields.push("เวลา");
  if (!vanId || vanId === "undefined" || vanId === "null" || vanId === "") missingFields.push("รถตู้");
  if (!driverId || driverId === "undefined" || driverId === "null" || driverId === "") missingFields.push("คนขับรถ");
  if (isNaN(seats) || seats <= 0) missingFields.push("ที่นั่งทั้งหมด");
  if (!price || price === "") missingFields.push("ราคา");

  if (missingFields.length > 0) {
    alert("⚠️ ระบบมองไม่เห็นข้อมูลในช่อง:\n👉 " + missingFields.join(", ") + "\n\nกรุณากดเลือก/พิมพ์ในช่องเหล่านี้ใหม่อีกครั้งครับ"); 
    return;
  }

  // 🌟 แปลงแค่ routeId เป็นตัวเลข (เพราะมันเป็น ID แบบตัวเลข) 
  // ส่วน vanId เป็น UUID ห้ามแปลงเด็ดขาด ให้ใช้ตรงๆ ไปเลย
  const finalRouteId = parseInt(routeId);

  if (isNaN(finalRouteId)) {
     alert("⚠️ เกิดข้อผิดพลาด: ข้อมูลเส้นทางไม่ถูกต้อง");
     return;
  }

  const [hourVal, minuteVal] = timeVal.split(':');
  const timeValStr = `${dateVal}T${hourVal}:${minuteVal}:00+07:00`; 
  
  const targetStart = new Date(`${dateVal}T${hourVal}:${minuteVal}:00`).getTime();
  const now = new Date().getTime();

  if (targetStart < now) {
    alert("🚨 ระบบปฏิเสธการบันทึก! ไม่สามารถเพิ่มหรือแก้ไขรอบรถในเวลาที่ผ่านไปแล้วได้");
    return;
  }

  const selectedRoute = formRoutesData.find(r => r.id == finalRouteId);
  const outboundHours = selectedRoute ? (selectedRoute.estimated_hours || 4) : 4;
  const totalBusyMs = ((outboundHours * 2) + 2) * 60 * 60 * 1000;
  const targetEnd = targetStart + totalBusyMs;

  const isOverlap = formSchedulesData.some(sch => {
    if (sch.id === currentEditScheduleId) return false;

    // 🌟 เปลี่ยนตรงนี้ให้เช็คกับ vanId ตรงๆ เลย ไม่ต้องมีคำว่า finalVanId แล้ว
    const isMatchVan = (sch.van_id == vanId);
    const isMatchDriver = (sch.driver_id == driverId);
    if (!isMatchVan && !isMatchDriver) return false;

    const safeTimeStr = sch.depart_time.replace(' ', 'T');
    const schDateStr = safeTimeStr.split('T')[0];
    if (dateVal === schDateStr) return true; 
    
    const schStart = new Date(safeTimeStr).getTime();
    const schHours = (sch.routes && sch.routes.estimated_hours) ? sch.routes.estimated_hours : 4;
    const schTotalBusyMs = ((schHours * 2) + 2) * 60 * 60 * 1000;
    const schEnd = schStart + schTotalBusyMs;

    return (targetStart < schEnd) && (schStart < targetEnd);
  });

  if (isOverlap) {
    alert("🚨 ระบบปฏิเสธการบันทึก! ตรวจพบว่ารถตู้ หรือ คนขับคันนี้ ติดงานอื่นอยู่ (รวมเวลาตีรถกลับแล้ว)");
    window.updateSmartDropdowns();
    return;
  }

  try {
    let finalAvailableSeats;
    if (currentEditScheduleId && currentEditScheduleData) {
      const seatDiff = seats - currentEditScheduleData.total_seats;
      finalAvailableSeats = currentEditScheduleData.available_seats + seatDiff;
      if (finalAvailableSeats < 0) {
        const bookedCount = currentEditScheduleData.total_seats - currentEditScheduleData.available_seats;
        alert(`❌ ไม่สามารถลดที่นั่งได้! เนื่องจากมีลูกค้าจองไปแล้ว ${bookedCount} ที่นั่ง`);
        return;
      }
    } else {
      finalAvailableSeats = seats;
    }

    const payload = {
      route_id: finalRouteId, 
      van_id: vanId,          // 🌟 ส่ง vanId แบบ UUID ไปตรงๆ เลย
      driver_id: driverId,    // 🌟 ส่ง driverId แบบ UUID ไปตรงๆ 
      depart_time: timeValStr, 
      price: parseFloat(price) || 0,
      total_seats: seats,
      available_seats: finalAvailableSeats
    };

    if (currentEditScheduleId) {
      const { error } = await supabase.from('van_schedules').update(payload).eq('id', currentEditScheduleId);
      if (error) throw error;
      alert("✅ อัปเดตข้อมูลรอบรถสำเร็จ!");
    } else {
      const { error } = await supabase.from('van_schedules').insert([payload]);
      if (error) throw error;
      alert("✅ สร้างรอบรถใหม่สำเร็จ!");
    }

    window.clearScheduleForm();
    window.fetchAndRenderSchedules();

  } catch (error) {
    console.error("Error saving schedule:", error);
    alert("❌ เกิดข้อผิดพลาด ไม่สามารถบันทึกได้: " + error.message);
  }
};
window.clearScheduleForm = function () {
  currentEditScheduleId = null;
  currentEditScheduleData = null;

  const panel = document.getElementById('schedule-form-panel');
  if (panel) {
    panel.style.display = 'flex';
    panel.innerHTML = `
          <i data-lucide="edit-3" style="width:48px; height:48px; opacity:0.2; margin-bottom:1rem;"></i>
          <p style="font-size:13px; opacity:0.5;">เลือกรอบเดินทางเพื่อแก้ไข หรือกดสร้างรอบรถใหม่</p>
        `;
    if (window.lucide) window.lucide.createIcons();
  }

  document.querySelectorAll('#schedules-list .card').forEach(c => c.style.borderColor = '');
};

window.deleteSchedule = async function (id) {
  if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรอบรถนี้?")) return;
  try {
    const { error } = await supabase.from('van_schedules').delete().eq('id', id);
    if (error) throw error;
    alert("ลบรอบรถเรียบร้อยแล้ว");
    window.clearScheduleForm();
    window.fetchAndRenderSchedules();
  } catch (error) {
    console.error("Error:", error);
    alert("ไม่สามารถลบได้: " + error.message);
  }
};

// ==========================================
// 6. จัดการข้อมูลคนขับ (Manage Drivers)
// ==========================================
let currentEditDriverUserId = null; 
let currentEditDriverProfileId = null; 

window.fetchAndRenderDrivers = async function () {
  const tableBody = document.getElementById('drivers-table-body');
  if (!tableBody) return;

  try {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*, users(username, email)')
      .order('id', { ascending: false });

    if (error) throw error;
    tableBody.innerHTML = '';

    if (!drivers || drivers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">ยังไม่มีข้อมูลคนขับรถ</td></tr>';
      return;
    }

    drivers.forEach(d => {
      // ป้องกัน Error กรณีรูปแบบข้อมูล users มาเป็น Array
      const userData = Array.isArray(d.users) ? d.users[0] : d.users;
      const email = userData ? userData.email : '<span style="color:red">ไม่มีบัญชีล็อกอิน</span>';
      
      const tr = document.createElement('tr');
      // ป้องกัน Error จาก Single Quote ในชื่อคนขับ
      const driverJson = JSON.stringify(d).replace(/'/g, "\\'");
      
      tr.innerHTML = `
        <td><strong>${d.full_name || '-'}</strong></td>
        <td>${d.phone || '-'}</td>
        <td>${d.license_no || '-'}</td>
        <td>${email}</td>
        <td style="text-align:right;">
            <button class="btn-icon" onclick='window.openDriverModal(${driverJson})' title="แก้ไข"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon" onclick="window.deleteDriver('${d.id}', '${d.user_id || ''}')" title="ลบ" style="color:var(--color-danger);"><i data-lucide="trash-2"></i></button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error in fetchAndRenderDrivers:", error);
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">โหลดข้อมูลล้มเหลว: ${error.message}</td></tr>`;
  }
};

window.openDriverModal = function (driver = null) {
  currentEditDriverProfileId = driver ? driver.id : null;
  currentEditDriverUserId = driver ? driver.user_id : null;

  document.getElementById('driver-modal').style.display = 'flex';
  document.getElementById('driver-modal-title').textContent = driver ? 'แก้ไขข้อมูลคนขับ' : 'เพิ่มคนขับและบัญชีใหม่';

  const pwdInput = document.getElementById('drv-password');
  const pwdStar = document.getElementById('pwd-star');
  const pwdHint = document.getElementById('pwd-hint');

  if (driver) {
    document.getElementById('drv-fullname').value = driver.full_name || '';
    document.getElementById('drv-phone').value = driver.phone || '';
    document.getElementById('drv-license').value = driver.license_no || '';
    
    const userData = Array.isArray(driver.users) ? driver.users[0] : driver.users;
    document.getElementById('drv-username').value = userData?.username || '';
    document.getElementById('drv-email').value = userData?.email || '';

    if (pwdInput) pwdInput.required = false;
    if (pwdStar) pwdStar.style.display = 'none';
    if (pwdHint) pwdHint.style.display = 'block';
  } else {
    document.getElementById('driver-form').reset();
    if (pwdInput) pwdInput.required = true;
    if (pwdStar) pwdStar.style.display = 'inline';
    if (pwdHint) pwdHint.style.display = 'none';
  }
};

window.closeDriverModal = function () {
  currentEditDriverProfileId = null;
  currentEditDriverUserId = null;
  document.getElementById('driver-modal').style.display = 'none';
};

window.saveDriver = async function (e) {
  e.preventDefault();
  
  const fullName = document.getElementById('drv-fullname').value.trim();
  const phone = document.getElementById('drv-phone').value.trim();
  const licenseNo = document.getElementById('drv-license').value.trim();
  const username = document.getElementById('drv-username').value.trim();
  const email = document.getElementById('drv-email').value.trim();
  const password = document.getElementById('drv-password').value.trim();

  try {
    const userPayload = { 
        username: username, 
        email: email, 
        role: 'driver' 
    };
    if (password) userPayload.password = password; 

    let finalUserId = currentEditDriverUserId;

    if (currentEditDriverUserId) {
      const { error } = await supabase.from('users').update(userPayload).eq('id', currentEditDriverUserId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('users').insert([userPayload]).select();
      if (error) throw error;
      if (data && data.length > 0) finalUserId = data[0].id; 
    }

    const driverPayload = { 
        user_id: finalUserId, 
        full_name: fullName, 
        phone: phone,
        license_no: licenseNo
    };

    if (currentEditDriverProfileId) {
      const { error } = await supabase.from('drivers').update(driverPayload).eq('id', currentEditDriverProfileId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('drivers').insert([driverPayload]);
      if (error) throw error;
    }

    alert('บันทึกข้อมูลสำเร็จ!');
    window.closeDriverModal();
    window.fetchAndRenderDrivers();
  } catch (error) {
    console.error("Error saving driver:", error);
    alert('บันทึกไม่สำเร็จ: ' + error.message);
  }
};

window.deleteDriver = async function (driverId, userId) {
  if (!confirm('คุณแน่ใจหรือไม่ที่จะลบคนขับคนนี้ รวมถึงบัญชีผู้ใช้ด้วย?')) return;
  try {
    const { error: driverError } = await supabase.from('drivers').delete().eq('id', driverId);
    if (driverError) throw driverError;

    if (userId && userId !== 'null' && userId !== 'undefined' && userId !== '') {
      const { error: userError } = await supabase.from('users').delete().eq('id', userId);
      if (userError) throw userError;
    }

    alert('ลบข้อมูลเรียบร้อย');
    window.fetchAndRenderDrivers();
  } catch (error) {
    alert('ไม่สามารถลบได้ (อาจมีประวัติผูกอยู่): ' + error.message);
  }
};
=======
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error loading schedules: ", error);
    schedulesList.innerHTML = '<p style="text-align:center; color:var(--color-danger);">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
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

>>>>>>> origin/dev/nwd
// ==========================================
// 7. Payments
// ==========================================
window.fetchAndRenderPayments = async function () {
  const container = document.getElementById('payments-list');
  if (!container) return;

<<<<<<< HEAD
  container.innerHTML = '<p style="text-align:center; padding: 2rem;">กำลังโหลดข้อมูลจากฐานข้อมูล...</p>';

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, users!user_id(username, violation_count)')
      .in('status', ['pending', 'slip_uploaded']);

    if (error) throw error;
    container.innerHTML = '';

    if (!bookings || bookings.length === 0) {
      container.innerHTML = `<div class="card" style="text-align:center; padding:3rem; border: 1px dashed var(--color-border-light);"><p style="color:var(--color-text-soft);">ไม่มีรายการที่ต้องตรวจสอบ</p></div>`;
      return;
    }

    bookings.forEach((payment) => {
      const customerName = payment.users ? payment.users.username : 'Unknown Customer';
      const currentViolations = payment.users?.violation_count || 0;

      const div = document.createElement('div');
      div.className = 'card flex-between';
      div.style.marginBottom = '1rem';

=======
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
>>>>>>> origin/dev/nwd
      div.innerHTML = `
        <div style="display:flex; gap:1rem; align-items:flex-start;">
          <div class="icon-box"><i data-lucide="file-text"></i></div>
          <div>
<<<<<<< HEAD
            <p style="font-weight:bold; margin-bottom:4px;">${customerName}</p>
            <div style="font-size:12px; color:var(--color-text-soft);">Booking ID: ${String(payment.id).substring(0, 8)}...</div>
            <p style="font-size:18px; font-weight:900; color:var(--color-blue-mid); margin-top:8px;">฿${payment.amount}</p>
            ${currentViolations > 0 ? `<p style="font-size:12px; color:var(--color-danger); margin-top:4px;">⚠️ ทำผิดกฎมาแล้ว: ${currentViolations}/2 ครั้ง</p>` : ''}
=======
            <p style="font-weight:bold; margin-bottom:4px;">${payment.userName || 'Customer'}</p>
            <div style="font-size:12px; color:var(--color-text-soft);"><span><i data-lucide="hash" style="width:12px; height:12px;"></i> Booking: ${payment.bookingId || '-'}</span></div>
            <p style="font-size:18px; font-weight:900; color:var(--color-blue-mid); margin-top:8px;">฿${payment.amount ? payment.amount.toFixed(2) : '0.00'}</p>
>>>>>>> origin/dev/nwd
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-icon btn-preview-slip" title="ดูสลิป"><i data-lucide="eye"></i></button>
<<<<<<< HEAD
          <button class="btn-icon btn-approve" style="color:var(--color-success);" title="อนุมัติ"><i data-lucide="check"></i></button>
          <button class="btn-icon btn-reject" style="color:var(--color-warning);" title="ปฏิเสธรูปไม่ชัด"><i data-lucide="x"></i></button>
          <button class="btn-icon btn-violation" style="color:var(--color-danger);" title="สลิปปลอม (เพิ่ม Violation)"><i data-lucide="alert-triangle"></i></button>
        </div>
      `;

      div.querySelector('.btn-preview-slip').addEventListener('click', () => window.previewSlip(payment.slip_image));
      div.querySelector('.btn-approve').addEventListener('click', () => window.updatePaymentStatus(payment.id, 'confirmed', payment.schedule_id));
      div.querySelector('.btn-reject').addEventListener('click', () => window.updatePaymentStatus(payment.id, 'rejected', payment.schedule_id));
      div.querySelector('.btn-violation').addEventListener('click', () => window.rejectAndMarkViolation(payment.id, payment.user_id, currentViolations, payment.schedule_id));
      container.appendChild(div);
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error fetching payments:", error.message);
    container.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:red;"><b>เกิดข้อผิดพลาดในการดึงข้อมูล:</b><br>${error.message}</div>`;
  }
};

window.updatePaymentStatus = async function (id, newStatus, scheduleId) {
  const actionText = newStatus === 'confirmed' ? 'อนุมัติ' : 'ปฏิเสธ';
  const isConfirmed = confirm(`คุณแน่ใจหรือไม่ที่จะ "${actionText}" รายการชำระเงินนี้?`);
  if (!isConfirmed) return;

  try {
    const { error: updateError } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    if (updateError) throw updateError;

    if (newStatus === 'rejected') {
      const { data: scheduleData, error: selectError } = await supabase.from('van_schedules').select('available_seats').eq('id', scheduleId).single(); // แก้เป็น van_schedules
      if (selectError) throw new Error("ดึงข้อมูลรอบรถไม่สำเร็จ: " + selectError.message);

      if (scheduleData) {
        const { error: scheduleUpdateError } = await supabase.from('van_schedules').update({ available_seats: scheduleData.available_seats + 1 }).eq('id', scheduleId);
        if (scheduleUpdateError) throw new Error("คืนที่นั่งไม่สำเร็จ: " + scheduleUpdateError.message);
      }
    }

    alert(`อัปเดตสถานะเป็น "${actionText}" และจัดการที่นั่งสำเร็จ!`);
    window.fetchAndRenderPayments();

  } catch (error) {
    console.error("Error updating status: ", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
};

window.rejectAndMarkViolation = async function (bookingId, userId, currentViolations, scheduleId) {
  const safeViolations = parseInt(currentViolations) || 0;
  const confirmed = confirm(`ยืนยันการปฏิเสธและเพิ่มประวัติการทำผิด? (ครั้งที่ ${safeViolations + 1})`);
  if (!confirmed) return;

  try {
    const newViolationCount = safeViolations + 1;
    const shouldBan = newViolationCount >= 2;

    // เปลี่ยนบรรทัดนี้:
    const { error: userError } = await supabase.from('users').update({ violation_count: newViolationCount, is_banned: shouldBan }).eq('id', userId);
    if (userError) throw userError;

    const { error: bookingError } = await supabase.from('bookings').update({ status: 'rejected' }).eq('id', bookingId);
    if (bookingError) throw bookingError;

    const { data: scheduleData, error: selectError } = await supabase.from('van_schedules').select('available_seats').eq('id', scheduleId).single(); // แก้เป็น van_schedules
    if (selectError) throw new Error("ดึงข้อมูลรอบรถไม่สำเร็จ: " + selectError.message);

    if (scheduleData) {
      const { error: scheduleUpdateError } = await supabase.from('van_schedules').update({ available_seats: scheduleData.available_seats + 1 }).eq('id', scheduleId);
      if (scheduleUpdateError) throw new Error("คืนที่นั่งไม่สำเร็จ: " + scheduleUpdateError.message);
    }

    alert(shouldBan ? '🚨 ผู้ใช้ถูกแบนถาวรแล้ว' : 'บันทึกการทำผิดและคืนที่นั่งเรียบร้อย');
    window.fetchAndRenderPayments();

  } catch (error) {
    console.error("Error in Violation:", error);
    alert("อัปเดตไม่สำเร็จ: " + error.message);
=======
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
>>>>>>> origin/dev/nwd
  }
};

window.previewSlip = function (url) {
  const previewContainer = document.getElementById('slip-preview');
  if (!previewContainer) return;
<<<<<<< HEAD

  if (url && url !== 'undefined' && url !== 'null' && url !== '') {
    previewContainer.style.background = 'var(--color-card-white)';
    previewContainer.innerHTML = '';

    const baseUrl = 'https://skfibvoeoqnhxmrwjitk.supabase.co/storage/v1/object/public/slips/';
    const finalImageUrl = url.startsWith('http') ? url : baseUrl + url;

    const imgElement = document.createElement('img');
    imgElement.src = finalImageUrl;
    imgElement.alt = "Transfer Slip";
    imgElement.style.cssText = "max-width:100%; max-height:100%; object-fit:contain; padding:1rem;";

    imgElement.onerror = function () {
      previewContainer.innerHTML = `
        <div style="display:flex; height:100%; min-height:200px; align-items:center; justify-content:center; color:var(--color-danger);">
          <div style="text-align:center;">
            <i data-lucide="image-off" style="width:48px; height:48px; opacity:0.3; margin-bottom:1rem;"></i>
            <p>รูปภาพสลิปเสียหาย หรือลิงก์ไม่ถูกต้อง</p>
            <p style="font-size:12px; margin-top:8px;">(ค้นหาที่: ${finalImageUrl})</p>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    };
    previewContainer.appendChild(imgElement);
  } else {
    previewContainer.style.background = 'transparent';
    previewContainer.innerHTML = `
      <div style="display:flex; height:100%; min-height:200px; align-items:center; justify-content:center; color:var(--color-text-soft);">
        <p>ไม่มีการอัปสลิป</p>
      </div>
    `;
=======
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
>>>>>>> origin/dev/nwd
  }
};

// ==========================================
// 8. HTML Templates
// ==========================================
function getDashboardHtml() {
  return `
    <div style="display:flex; flex-direction:column; gap:2rem;">
      <div class="grid-4">
<<<<<<< HEAD
        ${renderStatCard('ปลายทางยอดฮิต (Top Dest)', '<span class="badge loading">Loading...</span>', 'map-pin', 'up', 'Popular', 'stat-top-dest', 'stat-top-dest-label')}
        ${renderStatCard('ปลายทางคนน้อยสุด (Least Dest)', '<span class="badge loading">Loading...</span>', 'trending-down', 'warning', 'Least', 'stat-least-dest', 'stat-least-dest-label')}
        ${renderStatCard('Daily Revenue Today', '<span class="badge loading">฿...</span>', 'dollar-sign', 'up', 'Today', 'stat-daily-revenue', 'stat-daily-revenue-label')}
        ${renderStatCard('Pending Payments', '<span class="badge loading">...</span>', 'clock', 'warning', 'Wait', 'stat-pending-payments', 'stat-pending-payments-label')}
      </div>
      <div class="grid-2">
        <div class="card">
          <h3 style="margin-bottom: 1.5rem;">Revenue Overview (Last 7 Days)</h3>
          <div class="chart-container"><canvas id="revenueChart"></canvas></div>
        </div>
        <div class="card">
          <div class="flex-between" style="margin-bottom: 1.5rem;">
            <h3>Pending Verification</h3>
            <button class="btn-icon" onclick="switchTab('payments')" title="ดูทั้งหมด" style="color:var(--color-blue-dark); font-size:12px;">ดูทั้งหมด &rarr;</button>
          </div>
          <div id="dashboard-pending-list" style="display:flex; flex-direction:column; gap:1rem;">
            <p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูล...</p>
=======
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
>>>>>>> origin/dev/nwd
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
<<<<<<< HEAD
        <h3>Manage Routes (จัดการเส้นทางเดินรถ)</h3>
        <button class="btn-primary" onclick="window.openRouteModal()"><i data-lucide="plus"></i> เพิ่มเส้นทางใหม่</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>จุดเริ่มต้น (Origin)</th>
              <th>ปลายทาง (Destination)</th>
              <th>เวลา (ชั่วโมง)</th>
              <th>ราคา</th>
              <th style="text-align:right;">จัดการ</th>
            </tr>
          </thead>
          <tbody id="routes-table-body">
            <tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--color-text-soft);">กำลังโหลดข้อมูล...</td></tr>
          </tbody>
        </table>
      </div>

      <div id="route-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center; padding: 1rem;">
        <div class="card" style="width:100%; max-width:500px;">
          <div class="flex-between" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border-light); padding-bottom: 1rem;">
            <h3 id="route-modal-title">เพิ่มเส้นทางใหม่</h3>
            <button type="button" class="btn-icon" onclick="window.closeRouteModal()"><i data-lucide="x"></i></button>
          </div>
          <form id="route-form" onsubmit="window.saveRoute(event)" style="display:flex; flex-direction:column; gap:1.2rem;">
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">จุดเริ่มต้น <span style="color:red">*</span></label>
              <input type="text" id="route-origin" required placeholder="เช่น กรุงเทพฯ (หมอชิต)" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
            </div>
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ปลายทาง <span style="color:red">*</span></label>
              <input type="text" id="route-destination" required placeholder="เช่น ชลบุรี (พัทยา)" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
            </div>
            
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เวลาเดินทางโดยประมาณ (ชม.) <span style="color:red">*</span></label>
              <input type="number" id="route-hours" required placeholder="เช่น 10.5" step="0.5" min="0.5" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
            </div>

            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ราคา (บาท) <span style="color:red">*</span></label>
              <input type="number" id="route-price" required placeholder="เช่น 150" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
              <button type="button" onclick="window.closeRouteModal()" style="padding:10px 20px; border-radius:8px; border:1px solid var(--color-border-light); background:white; cursor:pointer; font-weight:bold;">ยกเลิก</button>
              <button type="submit" class="btn-primary" style="padding:10px 20px;">บันทึกข้อมูล</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}
function getVansHtml() {
  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      <div class="flex-between">
        <h3>Manage Vans (จัดการรถตู้)</h3>
        <button class="btn-primary" onclick="window.openVanModal()"><i data-lucide="plus"></i> เพิ่มรถตู้ใหม่</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ทะเบียนรถ</th>
              <th>จำนวนที่นั่ง</th>
              <th>สายประจำ (Default)</th>
              <th style="text-align:right;">จัดการ</th>
            </tr>
          </thead>
          <tbody id="vans-table-body">
=======
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
>>>>>>> origin/dev/nwd
            <tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--color-text-soft);">กำลังโหลดข้อมูล...</td></tr>
          </tbody>
        </table>
      </div>
<<<<<<< HEAD

      <div id="van-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center; padding: 1rem;">
        <div class="card" style="width:100%; max-width:500px;">
          <div class="flex-between" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border-light); padding-bottom: 1rem;">
            <h3 id="van-modal-title">เพิ่มรถตู้ใหม่</h3>
            <button class="btn-icon" onclick="window.closeVanModal()"><i data-lucide="x"></i></button>
          </div>
          <form id="van-form" onsubmit="window.saveVan(event)" style="display:flex; flex-direction:column; gap:1.2rem;">
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ทะเบียนรถ <span style="color:red">*</span></label>
              <input type="text" id="van-plate" required placeholder="เช่น กข-1234 ชลบุรี" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
            </div>
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">จำนวนที่นั่ง <span style="color:red">*</span></label>
              <input type="number" id="van-capacity" required value="14" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
            </div>
            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เส้นทางประจำ (ถ้ามี)</label>
              <select id="van-default-route" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
                <option value="">-- ไม่ระบุ (รถวิ่งอิสระ) --</option>
              </select>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
              <button type="button" onclick="window.closeVanModal()" style="padding:10px 20px; border-radius:8px; border:1px solid var(--color-border-light); background:white; cursor:pointer; font-weight:bold;">ยกเลิก</button>
              <button type="submit" class="btn-primary" style="padding:10px 20px;">บันทึกข้อมูล</button>
=======
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
>>>>>>> origin/dev/nwd
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
<<<<<<< HEAD
        <button class="btn-primary" onclick="window.renderScheduleForm()"><i data-lucide="plus"></i> Create Schedule</button>
=======
        <button class="btn-primary" id="btn-create-schedule"><i data-lucide="plus"></i> Create Schedule</button>
>>>>>>> origin/dev/nwd
      </div>
      <div class="grid-2">
        <div id="schedules-list" style="display:flex; flex-direction:column; gap:1rem; height: 600px; overflow-y: auto; padding-right: 10px;">
          <p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูลรอบรถ...</p>
        </div>
<<<<<<< HEAD
        
        <div class="card" id="schedule-form-panel" style="height: 600px; overflow-y:auto; position: sticky; top: 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--color-text-soft);">
          <i data-lucide="edit-3" style="width:48px; height:48px; opacity:0.2; margin-bottom:1rem;"></i>
          <p style="font-size:13px; opacity:0.5;">เลือกรอบเดินทางเพื่อแก้ไข หรือกดสร้างรอบรถใหม่</p>
=======
        <div class="card" id="seat-panel" style="height: 600px; overflow-y:auto; position: sticky; top: 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--color-text-soft);">
          <i data-lucide="armchair" style="width:48px; height:48px; opacity:0.2; margin-bottom:1rem;"></i>
          <p style="font-size:13px; opacity:0.5;">เลือกรอบเดินทางเพื่อดูแผนผังที่นั่ง</p>
>>>>>>> origin/dev/nwd
        </div>
      </div>
    </div>
  `;
}

<<<<<<< HEAD
function getDriversHtml() {
  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      <div class="flex-between">
        <h3>Manage Drivers (จัดการข้อมูลคนขับรถและบัญชี)</h3>
        <button class="btn-primary" onclick="window.openDriverModal()"><i data-lucide="user-plus"></i> เพิ่มคนขับใหม่</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th>เบอร์โทรศัพท์</th>
              <th>เลขที่ใบอนุญาตขับขี่</th>
              <th>อีเมลล็อกอิน</th>
              <th style="text-align:right;">จัดการ</th>
            </tr>
          </thead>
          <tbody id="drivers-table-body">
            <tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--color-text-soft);">กำลังโหลดข้อมูล...</td></tr>
          </tbody>
        </table>
      </div>

      <div id="driver-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center; padding: 1rem;">
        <div class="card" style="width:100%; max-width:600px; max-height: 90vh; overflow-y: auto;">
          <div class="flex-between" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border-light); padding-bottom: 1rem;">
            <h3 id="driver-modal-title">เพิ่มคนขับและบัญชีใหม่</h3>
            <button type="button" class="btn-icon" onclick="window.closeDriverModal()"><i data-lucide="x"></i></button>
          </div>
          <form id="driver-form" onsubmit="window.saveDriver(event)" style="display:flex; flex-direction:column; gap:1.2rem;">
            
            <h4 style="color:var(--color-blue-dark); margin-bottom:-0.5rem; border-bottom:1px dashed #ccc; padding-bottom:0.5rem;">ส่วนที่ 1: ข้อมูลบัญชีสำหรับล็อกอิน</h4>
            
            <div style="display:flex; gap:1rem;">
              <div style="flex:1;">
                <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Username <span style="color:red">*</span></label>
                <input type="text" id="drv-username" required placeholder="เช่น somchai_d" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
              </div>
              <div style="flex:1;">
                <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Email <span style="color:red">*</span></label>
                <input type="email" id="drv-email" required placeholder="เช่น somchai@gmail.com" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
              </div>
            </div>

            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">Password <span id="pwd-star" style="color:red">*</span></label>
              <input type="password" id="drv-password" placeholder="ตั้งรหัสผ่าน" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
              <small id="pwd-hint" style="color:var(--color-text-soft); display:none; margin-top:4px;">* กรณีแก้ไขข้อมูล หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นช่องนี้ไว้</small>
            </div>

            <h4 style="color:var(--color-blue-dark); margin-bottom:-0.5rem; border-bottom:1px dashed #ccc; padding-bottom:0.5rem; margin-top:0.5rem;">ส่วนที่ 2: ประวัติคนขับ</h4>

            <div style="display:flex; gap:1rem;">
                <div style="flex:1;">
                <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ชื่อ-นามสกุลจริง <span style="color:red">*</span></label>
                <input type="text" id="drv-fullname" required placeholder="เช่น สมชาย ใจดี" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
                </div>
                <div style="flex:1;">
                <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เบอร์โทรศัพท์ <span style="color:red">*</span></label>
                <input type="tel" id="drv-phone" required placeholder="เช่น 0812345678" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
                </div>
            </div>

            <div>
              <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">เลขที่ใบอนุญาตขับขี่ <span style="color:red">*</span></label>
              <input type="text" id="drv-license" required placeholder="ระบุเลขที่ใบขับขี่" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px;">
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
              <button type="button" onclick="window.closeDriverModal()" style="padding:10px 20px; border-radius:8px; border:1px solid var(--color-border-light); background:white; cursor:pointer; font-weight:bold;">ยกเลิก</button>
              <button type="submit" class="btn-primary" style="padding:10px 20px;">บันทึกข้อมูล</button>
            </div>
          </form>
        </div>
=======
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
>>>>>>> origin/dev/nwd
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

<<<<<<< HEAD
=======
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

>>>>>>> origin/dev/nwd
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
<<<<<<< HEAD
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
=======
    logoutBtn.addEventListener('click', () => {
>>>>>>> origin/dev/nwd
      window.location.href = '../login.html';
    });
  }
});