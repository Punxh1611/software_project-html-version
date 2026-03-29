document.addEventListener("DOMContentLoaded", () => {
    // 1. ดึงข้อมูลรถที่ลูกค้าเลือกมาจาก LocalStorage
    const bookingDataStr = localStorage.getItem("currentBooking");
    
    if (!bookingDataStr) {
        alert("ไม่พบข้อมูลการจอง กรุณาทำรายการใหม่ครับ");
        window.location.href = "index.html";
        return;
    }

    const tripData = JSON.parse(bookingDataStr);

    // 2. เอาข้อมูลไปแปะในหน้าจอ (ส่วนสรุปการเดินทาง)
    document.getElementById("sum-route").innerText = `${tripData.origin} ➔ ${tripData.destination}`;
    
    // แปลงวันที่ให้สวยขึ้น
    const [y, m, d] = tripData.date.split('-');
    document.getElementById("sum-date").innerText = `${d}/${m}/${y}`;
    document.getElementById("sum-time").innerText = `${tripData.time} น.`;
    document.getElementById("sum-price").innerText = parseFloat(tripData.price).toFixed(2);

    // 3. จำลองจุดจอดรถ (Mock Stops)
    const stopSelect = document.getElementById("pass-stop");
    stopSelect.innerHTML = `
        <option value="${tripData.price}">ลงที่: ปลายทาง ${tripData.destination} (฿${tripData.price})</option>
        <option value="${tripData.price - 20}">ลงที่: จุดจอดระหว่างทาง (฿${tripData.price - 20})</option>
    `;

    // 4. เมื่อเปลี่ยนจุดจอด ให้อัปเดตราคา
    stopSelect.addEventListener("change", (e) => {
        document.getElementById("sum-price").innerText = parseFloat(e.target.value).toFixed(2);
    });

    // 5. โลจิกสลับหน้าจอไปสู่การชำระเงิน
    const btnSubmit = document.getElementById("btn-submit-booking");
    const step1Form = document.getElementById("step-1-form");
    const step2Payment = document.getElementById("step-2-payment");
    const promptpayNumber = "1104000104010"; // 🟢 ใส่เบอร์พร้อมเพย์จำลองของคุณตรงนี้ได้เลย

    btnSubmit.addEventListener("click", () => {
        // ถ้าระบบอยู่ในหน้าชำระเงินแล้ว แปลว่าลูกค้ากดปุ่ม "ยืนยันการชำระเงิน"
        if (btnSubmit.innerText === "ยืนยันการชำระเงิน") {
            const slipFile = document.getElementById("slip-upload").files[0];
            if (!slipFile) {
                alert("⚠️ กรุณาแนบสลิปชำระเงินก่อนกดยืนยันครับ");
                return;
            }
            
            // 🟢 1. สร้างรหัสการจองจำลอง (Booking Ref)
            const randomRef = "VAN-" + Math.floor(100000 + Math.random() * 900000);
            
            // 🟢 2. เอาข้อมูลจากหน้าเว็บไปแปะลงในตั๋ว
            document.getElementById("ticket-name").innerText = document.getElementById("pass-name").value;
            document.getElementById("ticket-ref").innerText = randomRef;
            
            const stopSelect = document.getElementById("pass-stop");
            const selectedStopText = stopSelect.options[stopSelect.selectedIndex].text.split(" (")[0]; // ตัดเอาราคาออก
            document.getElementById("ticket-stop").innerText = selectedStopText;
            
            // ดึงข้อมูลจากส่วนสรุปการเดินทาง (ที่โหลดมาจาก LocalStorage)
            document.getElementById("ticket-origin").innerText = tripData.origin;
            document.getElementById("ticket-dest").innerText = tripData.destination;
            
            const [y, m, d] = tripData.date.split('-');
            document.getElementById("ticket-date").innerText = `${d}/${m}/${y}`;
            document.getElementById("ticket-time").innerText = tripData.time;

            // 🟢 3. สลับ UI (ซ่อนหน้าจอง โชว์หน้าตั๋ว)
            document.querySelector(".booking-layout").style.display = "none";
            document.querySelector(".booking-title").style.display = "none";
            document.getElementById("step-3-ticket").style.display = "block";
            
            return;
        }

        // ถ้าระบบยังอยู่หน้ากรอกข้อมูล ให้เช็คชื่อและเบอร์
        const name = document.getElementById("pass-name").value.trim();
        const phone = document.getElementById("pass-phone").value.trim();

        if (!name || !phone || phone.length < 9) {
            alert("⚠️ กรุณากรอก ชื่อ-นามสกุล และเบอร์โทรศัพท์ ให้ครบถ้วนครับ");
            return;
        }

        // ดึงราคาปัจจุบัน
        const currentPrice = document.getElementById("sum-price").innerText;
        
        // สลับ UI ปิดฟอร์ม โชว์ QR Code
        step1Form.style.display = "none";
        step2Payment.style.display = "block";
        
        // สร้าง QR Code พร้อมเพย์แบบกำหนดตัวเลข (ใช้ promptpay.io)
        document.getElementById("qr-image").src = `https://promptpay.io/${promptpayNumber}/${currentPrice}.png`;
        document.getElementById("pay-amount").innerText = currentPrice;

        // เปลี่ยนหน้าตาปุ่มยืนยัน
        btnSubmit.innerText = "ยืนยันการชำระเงิน";
        btnSubmit.style.backgroundColor = "#2E7D32"; // เปลี่ยนปุ่มเป็นสีเขียว
        
        // ล็อกข้อมูลฝั่งขวาไม่ให้แก้ไข
        document.getElementById("pass-name").disabled = true;
        document.getElementById("pass-phone").disabled = true;
        document.getElementById("pass-stop").disabled = true;
    });
});