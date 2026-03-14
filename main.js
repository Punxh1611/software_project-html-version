// 1. รวม Import ไว้ที่ด้านบนสุดที่เดียว (ห้ามมี Import ซ้ำข้างล่าง)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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

// 2. Auth State (จัดการเรื่องการแสดงผลเมื่อ Login/Logout)
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
    <a class="navbar__a" href="#">Booking</a>
    <a class="navbar__a" href="#">Promotion</a>
    <a class="navbar__contact-btn" href="login.html">Login</a>
  `;

  if (navDesktop) navDesktop.innerHTML = loggedOutHTML;
  if (navMobile) navMobile.innerHTML = loggedOutHTML;
}

function renderLoggedIn(user, username, photoURL) {
  // ตรวจสอบว่ามี Element ครบไหมก่อนทำอย่างอื่น
  const navDesktop = document.getElementById("nav-actions-desktop");
  const navMobile = document.getElementById("nav-drawer-links");

  if (!navDesktop || !navMobile) {
    console.error("หา Element สำหรับ Navbar ไม่เจอ!");
    return;
  }

  const avatarHTML = photoURL
    ? `<img src="${photoURL}" class="navbar__avatar-img" id="user-photo" alt="avatar" onerror="this.src='default-avatar.png'">`
    : `<div class="navbar__avatar-initials">${username.charAt(0).toUpperCase()}</div>`;

  // อัปเดต Desktop Navbar ให้มีครบทุกปุ่ม
  navDesktop.innerHTML = `
    <a class="navbar__a" href="#">Booking</a>
    <a class="navbar__a" href="#">Promotion</a>
    <span class="navbar__username" style="margin-left: 10px;">${username}</span>
    <div class="navbar__avatar navbar__avatar--clickable" id="avatar-btn" style="margin: 0 10px;">
      ${avatarHTML}
      <div class="navbar__avatar-overlay"></div>
    </div>
    <button class="navbar__logout-btn" id="btn-logout">Logout</button>
    <input type="file" id="avatar-upload" accept="image/*" style="display:none">
  `;

  // อัปเดต Mobile Drawer
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

  // ผูก Event ให้ปุ่ม (ใส่ ?. เผื่อกรณีหา id ไม่เจอจะได้รับไม่พัง)
  document.getElementById("btn-logout")?.addEventListener("click", () => signOut(auth));
  document.getElementById("btn-logout-mobile")?.addEventListener("click", () => signOut(auth));
  
  const avatarBtn = document.getElementById("avatar-btn");
  const fileInput = document.getElementById("avatar-upload");
  avatarBtn?.addEventListener("click", () => fileInput.click());
  
  // โค้ดส่วนอัปโหลดรูป (คงเดิม)
  fileInput?.addEventListener("change", async (e) => { /* ... โค้ดเดิมที่คุณมี ... */ });
}

// 3. Hamburger Menu (ส่วนที่เหลือคงเดิม)
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger-btn");
  const drawer = document.getElementById("nav-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");

  hamburger?.addEventListener("click", () => {
    drawer.classList.add("drawer--open");
    drawerOverlay.classList.add("drawer-overlay--visible");
  });
  // ... ส่วนปิด drawer ...
});