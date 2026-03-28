// ==========================================
// 1. ตั้งค่า Firebase (กรอกข้อมูลของคุณที่นี่)
// ==========================================
// ** สังเกตว่าผมเพิ่มคำสั่ง addDoc เข้ามาเพื่อใช้เพิ่มข้อมูล **
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBO40doAV5CKMPdg7rreqtWgXq9hxJgAMk",
  authDomain: "vanvan-90cd0.firebaseapp.com",
  projectId: "vanvan-90cd0",
  storageBucket: "vanvan-90cd0.firebasestorage.app",
  messagingSenderId: "234295405835",
  appId: "1:234295405835:web:b5c3e7842f979af686460e"
};
    

// เริ่มต้นใช้งาน Firebase
const app = initializeApp(firebaseConfig);
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
  if(!nav) return;
  
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

  if(window.lucide) window.lucide.createIcons();
}

function switchTab(tabId) {
  activeTab = tabId;
  const currentTab = menuItems.find(i => i.id === tabId);
  const titleEl = document.getElementById('page-title');
  if(titleEl && currentTab) titleEl.textContent = currentTab.label;
  
  renderSidebar();
  renderContent();
}

function renderContent() {
  const container = document.getElementById('content-area');
  if(!container) return;

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
  
  if(window.lucide) window.lucide.createIcons();
}

// ==========================================
// 3. ฟังก์ชันดึงข้อมูล Dashboard
// ==========================================
async function fetchAndRenderDashboard() {
  try {
    const todayStr = '2026-03-21'; 
    const qTrips = query(collection(db, "trips"), where("date", "==", todayStr));
    const querySnapshotTrips = await getDocs(qTrips);
    
    document.getElementById('stat-today-trips').innerHTML = querySnapshotTrips.size;
    document.getElementById('stat-today-trips-label').innerHTML = `On ${todayStr}`;

    const activeVansSet = new Set();
    querySnapshotTrips.forEach(doc => {
      if(doc.data().vanPlate) activeVansSet.add(doc.data().vanPlate);
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

  const labels = ['Mar 15', 'Mar 16', 'Mar 17', 'Mar 18', 'Mar 19', 'Mar 20', 'Mar 21'];
  const data = [10500, 15000, 9800, 13200, 16800, 14000, 12450]; 

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Daily Revenue (฿)',
        data: data,
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
        y: { beginAtZero: true, grid: { borderDash: [5, 5] }, ticks: { callback: function(value) { return '฿' + value.toLocaleString(); } } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ==========================================
// 4. ฟังก์ชันดึงข้อมูล Routes (เพิ่ม Search & Add)
// ==========================================
let allRoutesData = []; // เก็บข้อมูลเส้นทางทั้งหมดไว้ค้นหาแบบไม่ต้องโหลดใหม่

async function fetchAndRenderRoutes() {
  const tableBody = document.getElementById('routes-table-body');
  if (!tableBody) return;
  try {
    const querySnapshot = await getDocs(collection(db, "routes"));
    allRoutesData = []; // ล้างข้อมูลเก่า
    
    querySnapshot.forEach((doc) => {
      allRoutesData.push({ docId: doc.id, ...doc.data() });
    });

    renderRoutesTable(allRoutesData); // เรียกใช้ฟังก์ชันวาดตาราง
  } catch (error) {
    console.error("Error fetching routes: ", error);
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--color-danger);">เกิดข้อผิดพลาดในการดึงข้อมูล</td></tr>';
  }
}

// ฟังก์ชันสำหรับวาดตาราง (แยกออกมาเพื่อให้ Search เรียกใช้ได้)
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
  if(window.lucide) window.lucide.createIcons();
}

// ฟังก์ชันค้นหาเส้นทางแบบ Real-time
window.handleRouteSearch = function(keyword) {
  const term = keyword.toLowerCase().trim();
  if(!term) {
    renderRoutesTable(allRoutesData); // ถ้าช่องค้นหาว่าง ให้แสดงทั้งหมด
    return;
  }
  
  // กรองข้อมูลที่ตรงกับคำค้นหา (หาจาก ID, ต้นทาง หรือ ปลายทาง)
  const filtered = allRoutesData.filter(r => 
    (r.origin && r.origin.toLowerCase().includes(term)) ||
    (r.destination && r.destination.toLowerCase().includes(term)) ||
    (r.routeId && r.routeId.toLowerCase().includes(term))
  );
  
  renderRoutesTable(filtered);
};

// ฟังก์ชันเปิด/ปิด Popup เพิ่มเส้นทาง
window.openAddRouteModal = function() {
  const modal = document.getElementById('route-modal');
  if(modal) modal.style.display = 'flex';
};

window.closeAddRouteModal = function() {
  const modal = document.getElementById('route-modal');
  if(modal) {
    modal.style.display = 'none';
    document.getElementById('add-route-form').reset(); // ล้างข้อมูลในฟอร์ม
  }
};

// ฟังก์ชันบันทึกเส้นทางใหม่ลง Firebase
window.submitNewRoute = async function(e) {
  e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช
  
  // ดึงค่าจากฟอร์ม
  const routeId = document.getElementById('route-id').value;
  const origin = document.getElementById('route-origin').value;
  const dest = document.getElementById('route-dest').value;
  const fare = Number(document.getElementById('route-fare').value);
  const isActive = document.getElementById('route-status').value === 'true';

  try {
    // บันทึกลง Collection 'routes'
    await addDoc(collection(db, "routes"), {
      routeId: routeId,
      origin: origin,
      destination: dest,
      isActive: isActive,
      stops: [
        { name: dest, price: fare } // สร้างจุดจอดเริ่มต้นเป็นปลายทาง
      ]
    });
    
    alert('บันทึกเส้นทางใหม่สำเร็จ!');
    window.closeAddRouteModal();
    
    // โหลดข้อมูลในตารางใหม่
    const tableBody = document.getElementById('routes-table-body');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">กำลังโหลดข้อมูลล่าสุด...</td></tr>';
    fetchAndRenderRoutes();
    
  } catch (error) {
    console.error("Error adding route: ", error);
    alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้');
  }
};

// ==========================================
// 5. ฟังก์ชันดึงข้อมูล Schedules
// ==========================================
async function fetchAndRenderSchedules() {
  const schedulesList = document.getElementById('schedules-list');
  if(!schedulesList) return;

  try {
    const querySnapshotTrips = await getDocs(collection(db, "trips"));
    const routesSnapshot = await getDocs(collection(db, "routes"));
    const routesMap = {};
    routesSnapshot.forEach(doc => {
      routesMap[doc.data().routeId] = { origin: doc.data().origin, destination: doc.data().destination };
    });

    schedulesList.innerHTML = ''; 

    if (querySnapshotTrips.empty) {
      schedulesList.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-text-soft);">ไม่พบข้อมูลรอบรถ</p>';
      return;
    }

    querySnapshotTrips.forEach(doc => {
      const data = doc.data();
      const routeInfo = routesMap[data.routeId] || { origin: 'Unknown', destination: 'Unknown Route' };
      const tripDate = new Date(data.date);
      const day = tripDate.getDate();
      const monthShort = tripDate.toLocaleString('en-US', { month: 'short' }).toUpperCase(); 

      let statusBadge = '';
      if(data.status === 'waiting') statusBadge = '<span class="badge loading">Waiting</span>';
      else if(data.status === 'on-way') statusBadge = '<span class="badge warning">On-Way</span>';
      else if(data.status === 'completed') statusBadge = '<span class="badge up">Completed</span>';

      const div = document.createElement('div');
      div.className = 'card flex-between';
      div.style.cursor = 'pointer';
      div.innerHTML = `
        <div class="gap-2">
          <div style="background:var(--color-bg-main); padding:0.75rem 1rem; border-radius:8px; text-align:center;">
            <small style="color:var(--color-text-soft);">${monthShort}</small><br><b style="font-size:1.25rem;">${day}</b>
          </div>
          <div>
            ${statusBadge}
            <h4 style="margin: 4px 0 2px 0;">${routeInfo.origin} &rarr; ${routeInfo.destination}</h4>
            <small style="color:var(--color-text-soft);">${data.time || 'HH:MM'} | ${data.vanPlate || 'Unassigned Van'}</small>
            <br><small style="color:var(--color-blue-dark);">จองแล้ว: ${data.totalSeats - data.availableSeats}/${data.totalSeats} ที่นั่ง</small>
          </div>
        </div>
        <i data-lucide="chevron-right" style="color:var(--color-text-soft);"></i>
      `;
      schedulesList.appendChild(div);
    });
    if(window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error loading schedules: ", error);
    schedulesList.innerHTML = '<p style="text-align:center; color:var(--color-danger);">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
}

// ==========================================
// 6. ฟังก์ชันดึงข้อมูล Users 
// ==========================================
window.fetchAndRenderUsers = async function(filterRole = 'all') {
  const container = document.getElementById('users-list');
  if(!container) return;

  try {
    const querySnapshot = await getDocs(collection(db, "user"));
    container.innerHTML = '';
    let count = 0;

    const btns = container.parentElement.querySelectorAll('button[onclick^="window.fetchAndRenderUsers"]');
    btns.forEach(btn => {
       if(btn.getAttribute('onclick').includes(`'${filterRole}'`)) {
           btn.style.background = 'var(--color-blue-mid)';
           btn.style.color = 'white';
       } else {
           btn.style.background = 'none';
           btn.style.color = 'var(--color-text-soft)';
       }
    });

    querySnapshot.forEach((docSnap) => {
      const user = docSnap.data();
      const role = user.role || 'user'; 
      if (filterRole !== 'all' && role !== filterRole) return;
      count++;

      let iconBg = "rgba(34, 197, 94, 0.2)"; 
      let iconColor = "var(--color-success)";
      let iconName = "user";
      let badgeClass = "info";

      if(role === 'admin') {
        iconBg = "rgba(168, 85, 247, 0.2)"; iconColor = "purple"; iconName = "shield"; badgeClass = "warning";
      } else if (role === 'driver') {
        iconBg = "var(--color-bg-main)"; iconColor = "var(--color-blue-mid)"; iconName = "bus"; 
      }

      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem;">
          <div class="icon-box" style="background:${iconBg}; color:${iconColor};"><i data-lucide="${iconName}"></i></div>
          <button class="btn-icon"><i data-lucide="more-vertical"></i></button>
        </div>
        <h4 style="margin-bottom:4px; font-size:18px;">${user.name || 'ไม่ระบุชื่อ'}</h4>
        <span class="badge ${badgeClass}" style="margin-bottom:1rem; font-size:10px; text-transform:uppercase;">${role}</span>
        
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:14px; color:var(--color-text-soft);"><i data-lucide="mail" style="width:16px; height:16px; color:var(--color-blue-mid);"></i><span>${user.email || '-'}</span></div>
          <div style="display:flex; align-items:center; gap:8px; font-size:14px; color:var(--color-text-soft);"><i data-lucide="phone" style="width:16px; height:16px; color:var(--color-blue-mid);"></i><span>${user.phone || '-'}</span></div>
        </div>
      `;
      container.appendChild(div);
    });

    if (count === 0) container.innerHTML = '<p style="grid-column: 1 / -1; text-align:center; padding: 2rem; color:var(--color-text-soft);">ไม่พบข้อมูลผู้ใช้ในหมวดหมู่นี้</p>';
    if(window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error fetching users:", error);
    container.innerHTML = '<p style="grid-column: 1 / -1; text-align:center; padding: 2rem; color:var(--color-danger);">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
};

// ==========================================
// 7. ฟังก์ชันตรวจสอบการชำระเงิน Payments 
// ==========================================
window.fetchAndRenderPayments = async function() {
  const container = document.getElementById('payments-list');
  if(!container) return;

  try {
    const q = query(collection(db, "payments"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    container.innerHTML = '';

    if (querySnapshot.empty) {
      container.innerHTML = `<div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem; text-align:center; border: 1px dashed var(--color-border-light);"><i data-lucide="check-circle" style="width:48px; height:48px; opacity:0.3; margin-bottom:1rem;"></i><p style="color:var(--color-text-soft);">ไม่มีรายการที่ต้องตรวจสอบแล้ว</p></div>`;
      if(window.lucide) window.lucide.createIcons();
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const payment = docSnap.data();
      const div = document.createElement('div');
      div.className = 'card flex-between'; div.style.marginBottom = '1rem';
      div.innerHTML = `
        <div style="display:flex; gap:1rem; align-items:flex-start;">
          <div class="icon-box"><i data-lucide="file-text"></i></div>
          <div>
            <p style="font-weight:bold; margin-bottom:4px;">${payment.userName || 'Customer'}</p>
            <div style="font-size:12px; color:var(--color-text-soft); display:flex; flex-direction:column; gap:4px;"><span style="display:flex; align-items:center; gap:4px;"><i data-lucide="hash" style="width:12px; height:12px;"></i> Booking: ${payment.bookingId || '-'}</span></div>
            <p style="font-size:18px; font-weight:900; color:var(--color-blue-mid); margin-top:8px;">฿${payment.amount ? payment.amount.toFixed(2) : '0.00'}</p>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button onclick="window.previewSlip('${payment.slipUrl}')" class="btn-icon" title="ดูสลิปโอนเงิน"><i data-lucide="eye"></i></button>
          <button onclick="window.updatePaymentStatus('${docSnap.id}', 'approved')" class="btn-icon" style="color:var(--color-success); background:rgba(34,197,94,0.1);" title="อนุมัติ"><i data-lucide="check"></i></button>
          <button onclick="window.updatePaymentStatus('${docSnap.id}', 'rejected')" class="btn-icon" style="color:var(--color-danger); background:rgba(239,68,68,0.1);" title="ปฏิเสธ"><i data-lucide="x"></i></button>
        </div>
      `;
      container.appendChild(div);
    });
    if(window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error fetching payments:", error);
    container.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-danger);">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
};

window.previewSlip = function(url) {
  const previewContainer = document.getElementById('slip-preview');
  if(!previewContainer) return;
  if(url && url !== 'undefined') {
    previewContainer.style.background = 'var(--color-card-white)';
    previewContainer.innerHTML = `<img src="${url}" alt="Transfer Slip" style="max-width:100%; max-height:100%; object-fit:contain; padding:1rem;" onerror="this.src='https://via.placeholder.com/400x600?text=Image+Not+Found'">`;
  } else {
    alert("ไม่พบลิงก์รูปภาพสลิปในฐานข้อมูล");
  }
};

window.updatePaymentStatus = async function(docId, newStatus) {
  const actionText = newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
  if(!confirm(`คุณแน่ใจหรือไม่ที่จะ "${actionText}" การชำระเงินนี้?`)) return;
  try {
    await updateDoc(doc(db, "payments", docId), { status: newStatus });
    window.fetchAndRenderPayments();
    
    const previewContainer = document.getElementById('slip-preview');
    if(previewContainer) {
      previewContainer.style.background = 'var(--color-bg-main)';
      previewContainer.innerHTML = `<i data-lucide="check-circle" style="width:64px; height:64px; color:var(--color-success); margin-bottom:1rem;"></i><p style="text-transform:uppercase; font-weight:bold; font-size:12px; color:var(--color-success);">ทำรายการสำเร็จ</p>`;
      if(window.lucide) window.lucide.createIcons();
    }
  } catch (error) {
    console.error("Error updating payment status: ", error);
    alert("เกิดข้อผิดพลาด ไม่สามารถอัปเดตข้อมูลได้");
  }
};

// ==========================================
// 8. หน้าตา UI แต่ละส่วน (HTML Templates)
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
                <div style="width:40px; height:40px; background:var(--color-blue-light); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; color:var(--color-blue-dark)">${String.fromCharCode(64+i)}</div>
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
                 <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">รหัสเส้นทาง (Route ID) <span style="color:red">*</span></label>
                 <input type="text" id="route-id" required placeholder="เช่น R001" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none;">
              </div>
              <div>
                 <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ต้นทาง (Origin) <span style="color:red">*</span></label>
                 <input type="text" id="route-origin" required placeholder="เช่น กรุงเทพฯ (หมอชิต)" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none;">
              </div>
              <div>
                 <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ปลายทาง (Destination) <span style="color:red">*</span></label>
                 <input type="text" id="route-dest" required placeholder="เช่น พัทยา" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none;">
              </div>
              <div style="display:flex; gap:1rem;">
                 <div style="flex:1;">
                   <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">ราคา (Fare - บาท) <span style="color:red">*</span></label>
                   <input type="number" id="route-fare" required placeholder="150" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none;">
                 </div>
                 <div style="flex:1;">
                   <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:4px;">สถานะ</label>
                   <select id="route-status" style="width:100%; padding:10px; border:1px solid var(--color-border-light); border-radius:8px; outline:none; background:white;">
                     <option value="true">เปิดใช้งาน (Active)</option>
                     <option value="false">ปิดชั่วคราว (Inactive)</option>
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
        <button class="btn-primary"><i data-lucide="plus"></i> Create Schedule</button>
      </div>
      <div class="grid-2">
        <div id="schedules-list" style="display:flex; flex-direction:column; gap:1rem; height: 600px; overflow-y: auto; padding-right: 10px;">
          <p style="text-align:center; padding:2rem; color:var(--color-text-soft);">กำลังโหลดข้อมูลรอบรถ...</p>
        </div>
        <div class="card" style="display:flex; align-items:center; justify-content:center; color:var(--color-text-soft); height: 600px; position: sticky; top: 20px;">
           <p>Select a schedule to view passengers</p>
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
        <button class="btn-primary"><i data-lucide="user-plus"></i> Add User</button>
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
// 9. ระบบ Mobile Menu & Event Listeners
// ==========================================
function closeMobileMenu() {
  const overlay = document.getElementById('mobile-overlay');
  const sidebar = document.getElementById('sidebar');
  if(sidebar) sidebar.classList.remove('show');
  if(overlay) overlay.classList.remove('show');
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
    logoutBtn.addEventListener('click', () => {
      window.location.href = '../login.html';
    });
  }
});