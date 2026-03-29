      const MOCK_TRIPS = [
        {
          id: 'T101', route: 'Bangkok - Pattaya', time: '08:30',
          date: '28 Mar 2026', vanNumber: 'VAN-001', status: 'Scheduled',
          passengers: [
            // 🟢 เพิ่ม phone: '08X-XXX-XXXX' เข้าไปในผู้โดยสารทุกคน
            { id: 'P1', name: 'สมชาย ใจดี', phone: '081-234-5678', seat: 'A1', ticketId: 'TIC-001', verified: true },
            { id: 'P2', name: 'Jane Doe', phone: '089-876-5432', seat: 'A2', ticketId: 'TIC-002', verified: false },
            { id: 'P3', name: 'John Smith', phone: '082-333-4444', seat: 'B1', ticketId: 'TIC-003', verified: false },
            { id: 'P4', name: 'สมศรี รักดี', phone: '085-555-6666', seat: 'B2', ticketId: 'TIC-004', verified: false },
          ]
        },
        {
          id: 'T102', route: 'Pattaya - Bangkok', time: '13:00',
          date: '28 Mar 2026', vanNumber: 'VAN-001', status: 'Scheduled',
          passengers: [
            { id: 'P5', name: 'Alice Wong', phone: '087-999-0000', seat: 'A1', ticketId: 'TIC-005', verified: false }
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

      function init() {
        renderHome();
        renderSchedule();

        document.querySelectorAll('.nav-item').forEach(item => {
          item.addEventListener('click', () => switchTab(item.getAttribute('data-tab')));
        });

        backBtn.addEventListener('click', closeDetail);
        document.getElementById('detail-back-btn').addEventListener('click', closeDetail);
        document.getElementById('simulate-scan-btn').addEventListener('click', simulateScan);
        document.getElementById('cancel-scan-btn').addEventListener('click', () => switchTab('home'));

        lucide.createIcons();
      }

      function switchTab(tab) {
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
            Cancelled: { cls: 'yellow', text: 'ยกเลิก' },
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
                    <p style="font-size:11px;color:var(--color-blue-mid);display:flex;align-items:center;gap:2px;">
                        <i data-lucide="phone" style="width:10px;height:10px;"></i> ${p.phone}
                      </p>
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

      function simulateScan() {
        const nextTrip = currentTrips.find(t => t.status !== 'Arrived');
        if (!nextTrip) { alert('ไม่มีเที่ยวที่กำลังดำเนินการ'); return; }
        const unverified = nextTrip.passengers.find(p => !p.verified);
        if (unverified) {
          verifyPassenger(nextTrip.id, unverified.id);
          alert(`✅ สแกนสำเร็จ: ${unverified.name} (ที่นั่ง ${unverified.seat})`);
          switchTab('home');
        } else {
          alert('ไม่พบข้อมูลตั๋ว หรือตั๋วถูกใช้งานแล้ว');
        }
      }

      window.onload = init;
