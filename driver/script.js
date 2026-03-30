import { toast } from ".toast.js";
const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
        // ถ้าไม่มี ให้แจ้งเตือนและส่งกลับไปหน้า login.html
        toast("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบก่อน", "warning");
        window.location.href = "login.html"; 
    }
// ===== CONFIG: แก้ข้อมูลคนขับตรงนี้ =====
      const DRIVER = {
        name: 'คุณวิชัย รักงาน',        // ← ใส่ชื่อจริงจาก DB
        displayName: 'คุณวิชัย (คนขับ)', // ← ชื่อบนหน้าแรก
        initial: 'W',                     // ← ตัวอักษรใน avatar
        id: 'DRV-882',                    // ← รหัสพนักงาน
        rating: '4.9/5.0',
        experience: '2 ปี',
      };
      // ==========================================

      const MOCK_TRIPS = [
        {
          id: 'T101', route: 'Bangkok - Pattaya', time: '08:30',
          date: '28 Mar 2026', vanNumber: 'VAN-001', status: 'Scheduled',
          passengers: [
            { id: 'P1', name: 'สมชาย ใจดี', seat: 'A1', ticketId: 'TIC-001', verified: true },
            { id: 'P2', name: 'Jane Doe', seat: 'A2', ticketId: 'TIC-002', verified: false },
            { id: 'P3', name: 'John Smith', seat: 'B1', ticketId: 'TIC-003', verified: false },
            { id: 'P4', name: 'สมศรี รักดี', seat: 'B2', ticketId: 'TIC-004', verified: false },
          ]
        },
        {
          id: 'T102', route: 'Pattaya - Bangkok', time: '13:00',
          date: '28 Mar 2026', vanNumber: 'VAN-001', status: 'Scheduled',
          passengers: [
            { id: 'P5', name: 'Alice Wong', seat: 'A1', ticketId: 'TIC-005', verified: false }
          ]
        }
      ];

      let currentTrips = JSON.parse(JSON.stringify(MOCK_TRIPS));
      let activeTab = 'home';
      let selectedTripId = null;

      const headerTitle = document.getElementById('header-title');
      const backBtn = document.getElementById('back-btn');
      const detailView = document.getElementById('detail-view');
      const mainHeader = document.getElementById('main-header');
      const bottomNav = document.querySelector('.bottom-nav');

      let cameraStream = null;
      let scanInterval = null;
      let scanLocked = false;

      function init() {
        // Apply driver info from config
        document.querySelector('.welcome-text h2').textContent = DRIVER.displayName;
        document.querySelectorAll('.avatar').forEach(el => { el.textContent = DRIVER.initial; });
        const profileName = document.querySelector('#profile-page .card h2');
        if (profileName) profileName.textContent = DRIVER.name;
        const profileId = document.querySelector('#profile-page .card p');
        if (profileId) profileId.textContent = `พนักงานขับรถ (ID: ${DRIVER.id})`;
        const ratingEl = document.querySelector('#profile-page .card [data-rating]');
        // update stats in profile
        document.querySelectorAll('#profile-page .card p[style*="18px"]').forEach((el, i) => {
          if (i === 0) el.textContent = DRIVER.rating;
          if (i === 1) el.textContent = DRIVER.experience;
        });

        renderHome();
        renderSchedule();

        document.querySelectorAll('.nav-item').forEach(item => {
          item.addEventListener('click', () => switchTab(item.getAttribute('data-tab')));
        });

        backBtn.addEventListener('click', closeDetail);
        document.getElementById('detail-back-btn').addEventListener('click', closeDetail);
        document.getElementById('start-camera-btn').addEventListener('click', startCamera);
        document.getElementById('cancel-scan-btn').addEventListener('click', () => {
          stopCamera();
          switchTab('home');
        });

        lucide.createIcons();
      }

      function switchTab(tab) {
        if (activeTab === 'scan' && tab !== 'scan') stopCamera();
        activeTab = tab;

        document.querySelectorAll('.nav-item').forEach(item => {
          item.classList.toggle('active', item.getAttribute('data-tab') === tab);
        });

        document.querySelectorAll('.page').forEach(page => {
          page.classList.toggle('active', page.id === `${tab}-page`);
        });

        const titles = { home: 'หน้าแรก', schedule: 'ตารางวิ่ง', scan: 'สแกนตั๋ว', profile: 'โปรไฟล์' };
        headerTitle.textContent = titles[tab];

        const isScan = tab === 'scan';
        mainHeader.style.display = isScan ? 'none' : 'flex';
        bottomNav.style.display = isScan ? 'none' : 'flex';

        lucide.createIcons();
      }

      function renderHome() {
        const nextTrip = currentTrips.find(t => t.status !== 'Arrived');
        const container = document.getElementById('next-trip-container');

        if (!nextTrip) {
          container.innerHTML = `
            <div class="card" style="text-align:center;padding:40px 20px;margin-bottom:24px;">
              <i data-lucide="check-circle-2" style="width:48px;height:48px;color:#27ae60;margin-bottom:12px;"></i>
              <p style="font-weight:700;">ไม่มีงานค้างแล้ว</p>
              <p style="color:var(--color-text-soft);font-size:13px;">พักผ่อนให้เต็มที่นะ!</p>
            </div>`;
          lucide.createIcons();
          return;
        }

        container.innerHTML = `
          <div class="card trip-card">
            <div class="trip-card-header">
              <span class="tag">เที่ยวถัดไป</span>
              <span style="font-size:12px;color:var(--color-text-soft);font-weight:500;">${nextTrip.date}</span>
            </div>
            <div class="trip-info">
              <div class="info-item">
                <div class="info-icon"><i data-lucide="map-pin" style="width:18px;height:18px;"></i></div>
                <div class="info-content"><p>เส้นทาง</p><p>${nextTrip.route}</p></div>
              </div>
              <div class="info-item">
                <div class="info-icon"><i data-lucide="clock" style="width:18px;height:18px;"></i></div>
                <div class="info-content"><p>เวลาออกเดินทาง</p><p>${nextTrip.time} น.</p></div>
              </div>
            </div>
            <div class="btn-group">
              <button class="btn-primary" onclick="openDetail('${nextTrip.id}')">ดูรายละเอียด</button>
              <button class="btn-secondary" onclick="switchTab('scan')"><i data-lucide="qr-code" style="width:20px;height:20px;"></i></button>
            </div>
          </div>
          <div style="margin-bottom:24px;">
            <h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">อัปเดตสถานะรถ</h3>
            <div class="status-grid">
              <button class="status-btn ${nextTrip.status === 'Departed' ? 'active-blue' : ''}" onclick="updateStatus('${nextTrip.id}', 'Departed')">
                <i data-lucide="truck" style="width:20px;height:20px;"></i>
                <span>ออกเดินทาง</span>
              </button>
              <button class="status-btn ${nextTrip.status === 'Arrived' ? 'active-green' : ''}" onclick="updateStatus('${nextTrip.id}', 'Arrived')">
                <i data-lucide="check-circle-2" style="width:20px;height:20px;"></i>
                <span>ถึงที่หมาย</span>
              </button>
            </div>
          </div>`;
        lucide.createIcons();
      }

      function renderSchedule() {
        const container = document.getElementById('schedule-list');
        container.innerHTML = '';
        currentTrips.forEach(trip => {
          const statusMap = {
            Scheduled: { cls: 'yellow', text: 'รอออกรถ' },
            Departed:  { cls: 'blue',   text: 'กำลังเดินทาง' },
            Arrived:   { cls: 'green',  text: 'ถึงแล้ว' },
            Cancelled: { cls: 'red', text: 'ยกเลิก' },
          };
          const s = statusMap[trip.status] || statusMap.Scheduled;
          const div = document.createElement('div');
          div.className = 'schedule-item';
          div.onclick = () => openDetail(trip.id);
          div.innerHTML = `
            <div class="schedule-left">
              <div class="time-box"><p>${trip.time}</p><p>${trip.id}</p></div>
              <div class="divider"></div>
              <div class="route-info">
                <h3>${trip.route}</h3>
                <div class="route-meta">
                  <span class="status-tag ${s.cls}">${s.text}</span>
                  <span style="font-size:10px;color:var(--color-text-soft);display:flex;align-items:center;gap:4px;">
                    <i data-lucide="users" style="width:10px;height:10px;"></i> ${trip.passengers.length} คน
                  </span>
                </div>
              </div>
            </div>
            <i data-lucide="chevron-right" style="width:20px;height:20px;color:var(--color-text-soft);"></i>`;
          container.appendChild(div);
        });
        lucide.createIcons();
      }

      function openDetail(tripId) {
        selectedTripId = tripId;
        const trip = currentTrips.find(t => t.id === tripId);
        if (!trip) return;

        const statusMap = {
          Scheduled: { cls: 'yellow', text: 'รอออกรถ' },
          Departed:  { cls: 'blue',   text: 'กำลังเดินทาง' },
          Arrived:   { cls: 'green',  text: 'ถึงแล้ว' },
        };

        document.getElementById('detail-content').innerHTML = `
          <div class="card" style="margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
              <h3 style="font-weight:700;color:var(--color-blue-dark);">${trip.route}</h3>
              <span style="font-size:12px;font-weight:700;color:var(--color-text-soft);">${trip.id}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              <div>
                <p style="font-size:10px;color:var(--color-text-soft);text-transform:uppercase;">เวลาออก</p>
                <p style="font-weight:700;">${trip.time} น.</p>
              </div>
              <div>
                <p style="font-size:10px;color:var(--color-text-soft);text-transform:uppercase;">ทะเบียนรถ</p>
                <p style="font-weight:700;">${trip.vanNumber}</p>
              </div>
            </div>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border-light);display:flex;justify-content:space-between;align-items:center;">
              <p style="font-size:14px;font-weight:700;">สถานะปัจจุบัน</p>
              <select onchange="updateStatus('${trip.id}', this.value)">
                <option value="Scheduled" ${trip.status==='Scheduled'?'selected':''}>รอออกรถ</option>
                <option value="Departed"  ${trip.status==='Departed' ?'selected':''}>กำลังเดินทาง</option>
                <option value="Arrived"   ${trip.status==='Arrived'  ?'selected':''}>ถึงแล้ว</option>
                <option value="Cancelled" ${trip.status==='Cancelled'?'selected':''}>ยกเลิก</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-weight:700;">รายชื่อผู้โดยสาร (${trip.passengers.length})</h3>
            <button onclick="switchTab('scan')" style="color:var(--color-blue-mid);font-size:12px;font-weight:700;background:none;border:none;display:flex;align-items:center;gap:4px;">
              <i data-lucide="qr-code" style="width:14px;height:14px;"></i> สแกนตั๋วเพิ่ม
            </button>
          </div>
          <div id="passenger-list">
            ${trip.passengers.map(p => `
              <div class="passenger-item">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div class="seat-badge ${p.verified?'verified':''}">${p.seat}</div>
                  <div>
                    <p style="font-size:14px;font-weight:700;">${p.name}</p>
                    <p style="font-size:10px;color:var(--color-text-soft);">${p.ticketId}</p>
                  </div>
                </div>
                ${p.verified
                  ? `<div style="display:flex;align-items:center;gap:4px;color:#27ae60;font-size:12px;font-weight:700;">
                       <i data-lucide="check-circle-2" style="width:16px;height:16px;"></i> ตรวจแล้ว
                     </div>`
                  : `<button onclick="verifyPassenger('${trip.id}','${p.id}')"
                       style="background-color:var(--color-blue-mid);color:white;border:none;padding:6px 12px;border-radius:8px;font-size:10px;font-weight:700;">
                       เช็คอิน
                     </button>`
                }
              </div>`).join('')}
          </div>`;

        detailView.classList.add('active');
        lucide.createIcons();
      }

      function closeDetail() {
        detailView.classList.remove('active');
        selectedTripId = null;
      }

      function updateStatus(tripId, newStatus) {
        currentTrips = currentTrips.map(t => t.id === tripId ? { ...t, status: newStatus } : t);
        renderHome();
        renderSchedule();
        if (selectedTripId === tripId) openDetail(tripId);
      }

      function verifyPassenger(tripId, passengerId) {
        currentTrips = currentTrips.map(t => {
          if (t.id !== tripId) return t;
          return { ...t, passengers: t.passengers.map(p => p.id === passengerId ? { ...p, verified: true } : p) };
        });
        renderHome();
        renderSchedule();
        if (selectedTripId === tripId) openDetail(tripId);
      }

      // ===== Camera & QR =====
      async function startCamera() {
        const btn = document.getElementById('start-camera-btn');
        const statusText = document.getElementById('scan-status-text');
        const video = document.getElementById('camera-video');

        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" style="width:18px;height:18px;"></i> กำลังเปิดกล้อง...';
        lucide.createIcons();

        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          video.srcObject = cameraStream;
          await video.play();

          statusText.textContent = 'วางตั๋วผู้โดยสารให้ตรงกับกรอบ';
          btn.style.display = 'none';
          scanLocked = false;

          // hide result card from previous scan
          document.getElementById('scan-result-card').style.display = 'none';

          // Start QR scanning loop
          scanInterval = setInterval(scanQRFromCamera, 200);
        } catch (err) {
          console.error(err);
          statusText.textContent = '❌ ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง';
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="camera" style="width:18px;height:18px;"></i> ลองอีกครั้ง';
          lucide.createIcons();
        }
      }

      function stopCamera() {
        if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
        if (cameraStream) {
          cameraStream.getTracks().forEach(t => t.stop());
          cameraStream = null;
        }
        const video = document.getElementById('camera-video');
        video.srcObject = null;

        // Reset UI
        const btn = document.getElementById('start-camera-btn');
        btn.style.display = 'flex';
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="camera" style="width:18px;height:18px;"></i> เปิดกล้อง';
        document.getElementById('scan-status-text').textContent = 'เปิดกล้องเพื่อสแกนตั๋วผู้โดยสาร';
        lucide.createIcons();
      }

      function scanQRFromCamera() {
        if (scanLocked) return;
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        if (!video.videoWidth) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

        if (code) {
          scanLocked = true;
          handleScannedQR(code.data);
        }
      }

      function handleScannedQR(qrData) {
        stopCamera();

        // QR format expected: ticketId (e.g. "TIC-001")
        // Or JSON: {"ticketId":"TIC-001"} — support both
        let ticketId = qrData.trim();
        try {
          const parsed = JSON.parse(qrData);
          if (parsed.ticketId) ticketId = parsed.ticketId;
        } catch(e) {}

        // Search across all trips
        let foundTrip = null, foundPassenger = null;
        for (const trip of currentTrips) {
          const p = trip.passengers.find(p => p.ticketId === ticketId);
          if (p) { foundTrip = trip; foundPassenger = p; break; }
        }

        const resultCard = document.getElementById('scan-result-card');
        const resultName = document.getElementById('scan-result-name');
        const resultTicket = document.getElementById('scan-result-ticket');
        const resultStatus = document.getElementById('scan-result-status');
        const statusText = document.getElementById('scan-status-text');

        resultCard.style.display = 'block';

        if (!foundPassenger) {
          resultName.textContent = 'ไม่พบข้อมูลตั๋ว';
          resultTicket.textContent = `QR: ${ticketId}`;
          resultStatus.textContent = '❌ ตั๋วไม่ถูกต้อง';
          resultStatus.style.color = '#ff4444';
          statusText.textContent = 'สแกนไม่สำเร็จ';
        } else if (foundPassenger.verified) {
          resultName.textContent = foundPassenger.name;
          resultTicket.textContent = `${foundPassenger.ticketId} · ที่นั่ง ${foundPassenger.seat}`;
          resultStatus.textContent = '⚠️ ตั๋วถูกใช้งานแล้ว';
          resultStatus.style.color = '#f39c12';
          statusText.textContent = 'ตั๋วนี้เช็คอินแล้ว';
        } else {
          verifyPassenger(foundTrip.id, foundPassenger.id);
          resultName.textContent = foundPassenger.name;
          resultTicket.textContent = `${foundPassenger.ticketId} · ที่นั่ง ${foundPassenger.seat}`;
          resultStatus.textContent = '✅ เช็คอินสำเร็จ!';
          resultStatus.style.color = '#27ae60';
          statusText.textContent = `เส้นทาง: ${foundTrip.route}`;
        }

        // Show re-scan button
        const btn = document.getElementById('start-camera-btn');
        btn.style.display = 'flex';
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="refresh-cw" style="width:18px;height:18px;"></i> สแกนอีกครั้ง';
        lucide.createIcons();
      }

      window.onload = init;