import { toast } from "../toast.js";

const supabaseUrl = 'https://skfibvoeoqnhxmrwjitk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZmlidm9lb3FuaHhtcndqaXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTEyODUsImV4cCI6MjA5MDM2NzI4NX0.Ul8BxGgCtFh29O0c0HgKuJ5d33KMG9gS9AuFCu8GRzM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. ระบบ Navigation และ Layout หลัก
// ==========================================
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'routes', label: 'Manage Routes', icon: 'map-pin' },
  { id: 'vans', label: 'Manage Vans', icon: 'bus' },
  { id: 'schedules', label: 'Manage Schedules', icon: 'calendar' },
  { id: 'drivers', label: 'Manage Drivers', icon: 'users' },
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
      break;
    case 'payments':
      container.innerHTML = getPaymentsHtml();
      window.fetchAndRenderPayments();
      break;
  }

  if (window.lucide) window.lucide.createIcons();
}


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
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels, // ใช้วันที่จริง
      datasets: [{
        label: 'Daily Revenue (฿)',
        data: dataPoints, // ใช้ยอดเงินจริง
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
        y: {
          beginAtZero: true,
          ticks: { callback: v => '฿' + v.toLocaleString() }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// ==========================================
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
  const schedulesList = document.getElementById('schedules-list');
  if (!schedulesList) return;

  try {
    schedulesList.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูลรอบรถ...</p>';

    // ดึงข้อมูลปกติ ไม่ต้องเอา estimated_hours มาคำนวณแล้ว
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
      // 🌟 ดึงสถานะจากฐานข้อมูลมาแสดงตรงๆ เลย ไม่ต้องเดาเวลาแล้ว
      const currentStatus = d.status || 'scheduled';

      const tripDate = new Date(d.depart_time.replace(' ', 'T'));
      const day = tripDate.getDate();
      const monthShort = tripDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const timeStr = tripDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      const bookedSeats = d.total_seats - d.available_seats;
      const origin = d.routes ? d.routes.origin : 'ไม่ระบุ';
      const dest = d.routes ? d.routes.destination : 'ไม่ระบุ';
      const displayPrice = d.price ?? (d.routes ? d.routes.price : 0);

      const driverData = d.drivers;
      const driverName = driverData ? (driverData.full_name || driverData.users?.username) : 'ยังไม่ระบุคนขับ';
      const plateNumber = d.vans?.plate_number || '-';

      // แปลงสถานะเป็นป้ายสี (เปลี่ยนข้อความให้สื่อว่ารอคนขับ/แอดมินกด)
      let statusText = '⏳ รอคนขับเริ่มงาน';
      let statusStyle = 'background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;'; 
      
      if (currentStatus === 'traveling') {
        statusText = '🚐 กำลังเดินทาง';
        statusStyle = 'background: #fef3c7; color: #d97706; border: 1px solid #fde68a;'; 
      } else if (currentStatus === 'completed') {
        statusText = '✅ ถึงที่หมายแล้ว';
        statusStyle = 'background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;'; 
      } else if (currentStatus === 'cancelled') {
        statusText = '❌ ยกเลิก';
        statusStyle = 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;'; 
      }

      const div = document.createElement('div');
      div.className = 'card flex-between';
      div.style.cursor = 'pointer';
      div.style.marginBottom = '1rem';
      div.innerHTML = `
                <div class="gap-2">
                    <div style="background:var(--color-bg-main); padding:0.75rem 1rem; border-radius:8px; text-align:center;">
                        <small style="color:var(--color-text-soft);">${monthShort}</small><br><b style="font-size:1.25rem;">${day}</b>
                    </div>
                    <div>
                        <span class="badge ${d.available_seats > 0 ? 'info' : 'warning'}">${d.available_seats > 0 ? 'Available' : 'Full'}</span>
                        <span class="badge" style="${statusStyle}">${statusText}</span>
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

      div.addEventListener('click', () => {
        document.querySelectorAll('#schedules-list .card').forEach(c => c.style.borderColor = '');
        div.style.borderColor = 'var(--color-blue-mid)';
        window.renderScheduleForm(d);
      });

      schedulesList.appendChild(div);
    });
    
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

  // ดึงค่าสถานะเดิมมาโชว์ (ถ้าไม่มีค่าให้เป็น scheduled)
  const currentStatus = schedule ? (schedule.status || 'scheduled') : 'scheduled';

  panel.innerHTML = `
        <div style="padding: 0.5rem;">
            <div class="flex-between" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border-light); padding-bottom: 1rem;">
                <h3 style="color:var(--color-blue-dark);">${schedule ? '✏️ แก้ไขรอบรถ' : '✨ สร้างรอบเดินทางใหม่'}</h3>
                ${schedule ? `<button type="button" class="btn-icon" onclick="window.deleteSchedule('${schedule.id}')" title="ลบ" style="color:var(--color-danger);"><i data-lucide="trash-2"></i> ลบ</button>` : ''}
            </div>
            
            <div style="display:flex; flex-direction:column; gap:1.2rem;">
                
                ${schedule ? `
                <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px dashed #cbd5e1;">
                    <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">สถานะการเดินทาง</label>
                    <select id="sch-status" style="width: 100%; padding: 8px; border: 1px solid var(--color-border-light); border-radius: 8px; font-weight: bold;">
                        <option value="scheduled" ${currentStatus === 'scheduled' ? 'selected' : ''}>⏳ รอออกเดินทาง</option>
                        <option value="traveling" ${currentStatus === 'traveling' ? 'selected' : ''}>🚐 กำลังเดินทาง</option>
                        <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>✅ ถึงที่หมายแล้ว</option>
                        <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>❌ ยกเลิก</option>
                    </select>
                </div>
                ` : `<input type="hidden" id="sch-status" value="scheduled">`}

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
  // ดึงค่า status
  const statusVal = document.getElementById('sch-status')?.value || 'scheduled';
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
      van_id: vanId,          
      driver_id: driverId,    
      depart_time: timeValStr, 
      price: parseFloat(price) || 0,
      total_seats: seats,
      available_seats: finalAvailableSeats,
      status: statusVal  // 🌟 เพิ่มบรรทัดนี้ ส่ง status ไปบันทึก
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
// ==========================================
// 7. Payments
// ==========================================
window.fetchAndRenderPayments = async function () {
  const container = document.getElementById('payments-list');
  if (!container) return;

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

      div.innerHTML = `
        <div style="display:flex; gap:1rem; align-items:flex-start;">
          <div class="icon-box"><i data-lucide="file-text"></i></div>
          <div>
            <p style="font-weight:bold; margin-bottom:4px;">${customerName}</p>
            <div style="font-size:12px; color:var(--color-text-soft);">Booking ID: ${String(payment.id).substring(0, 8)}...</div>
            <p style="font-size:18px; font-weight:900; color:var(--color-blue-mid); margin-top:8px;">฿${payment.amount}</p>
            ${currentViolations > 0 ? `<p style="font-size:12px; color:var(--color-danger); margin-top:4px;">⚠️ ทำผิดกฎมาแล้ว: ${currentViolations}/2 ครั้ง</p>` : ''}
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-icon btn-preview-slip" title="ดูสลิป"><i data-lucide="eye"></i></button>
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
  }
};

window.previewSlip = function (url) {
  const previewContainer = document.getElementById('slip-preview');
  if (!previewContainer) return;

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
  }
};

// ==========================================
// 8. HTML Templates
// ==========================================
function getDashboardHtml() {
  return `
    <div style="display:flex; flex-direction:column; gap:2rem;">
      <div class="grid-4">
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
            <tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--color-text-soft);">กำลังโหลดข้อมูล...</td></tr>
          </tbody>
        </table>
      </div>

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
        <button class="btn-primary" onclick="window.renderScheduleForm()"><i data-lucide="plus"></i> Create Schedule</button>
      </div>
      <div class="grid-2">
        <div id="schedules-list" style="display:flex; flex-direction:column; gap:1rem; height: 600px; overflow-y: auto; padding-right: 10px;">
          <p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูลรอบรถ...</p>
        </div>
        
        <div class="card" id="schedule-form-panel" style="height: 600px; overflow-y:auto; position: sticky; top: 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--color-text-soft);">
          <i data-lucide="edit-3" style="width:48px; height:48px; opacity:0.2; margin-bottom:1rem;"></i>
          <p style="font-size:13px; opacity:0.5;">เลือกรอบเดินทางเพื่อแก้ไข หรือกดสร้างรอบรถใหม่</p>
        </div>
      </div>
    </div>
  `;
}

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
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = '../login.html';
    });
  }
});