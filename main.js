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

// ── SVG Icons สำหรับ Drawer ──
const ICONS = {
  home:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  booking: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  promo:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 14l6-6M9.5 9.5h.01M14.5 14.5h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  login:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  logout:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

// ── Auth State ──
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

// ── Logged Out ──
function renderLoggedOut() {
  const navDesktop = document.getElementById("nav-actions-desktop");
  const navMobile  = document.getElementById("nav-drawer-links");

  if (navDesktop) {
    navDesktop.innerHTML = `
      <a class="navbar__a" href="#">Booking</a>
      <a class="navbar__a" href="#">Promotion</a>
      <a class="navbar__contact-btn" href="login.html">เข้าสู่ระบบ</a>
    `;
  }

  if (navMobile) {
    navMobile.innerHTML = `
      <a class="drawer__link" href="index.html">${ICONS.home}<span>หน้าแรก</span></a>
      <a class="drawer__link" href="#">${ICONS.booking}<span>Booking</span></a>
      <a class="drawer__link" href="#">${ICONS.promo}<span>Promotion</span></a>
      <div class="drawer__divider"></div>
      <a class="drawer__link drawer__link--login" href="login.html">${ICONS.login}<span>เข้าสู่ระบบ / สมัครสมาชิก</span></a>
    `;
  }
}

// ── Logged In ──
function renderLoggedIn(user, username, photoURL) {
  const navDesktop = document.getElementById("nav-actions-desktop");
  const navMobile  = document.getElementById("nav-drawer-links");

  if (!navDesktop || !navMobile) {
    console.error("หา Element สำหรับ Navbar ไม่เจอ!");
    return;
  }

  const avatarHTML = photoURL
    ? `<img src="${photoURL}" class="navbar__avatar-img" id="user-photo" alt="avatar" onerror="this.src='default-avatar.png'">`
    : `<div class="navbar__avatar-initials">${username.charAt(0).toUpperCase()}</div>`;

  // Desktop
  navDesktop.innerHTML = `
    <a class="navbar__a" href="#">Booking</a>
    <a class="navbar__a" href="#">Promotion</a>
    <div class="navbar__avatar navbar__avatar--clickable" id="avatar-btn">
      ${avatarHTML}
    </div>
    <span class="navbar__username">${username}</span>
    <button class="navbar__logout-btn" id="btn-logout">ออกจากระบบ</button>
    <input type="file" id="avatar-upload" accept="image/*" style="display:none">
  `;

  // Mobile Drawer
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

  // Events
  document.getElementById("btn-logout")?.addEventListener("click", () => signOut(auth));
  document.getElementById("btn-logout-mobile")?.addEventListener("click", () => signOut(auth));

  const avatarBtn = document.getElementById("avatar-btn");
  const fileInput = document.getElementById("avatar-upload");
  avatarBtn?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "user", user.uid), { photoURL: url });
      const img = document.getElementById("user-photo");
      if (img) img.src = url;
    } catch (err) {
      console.error("อัปโหลดรูปไม่สำเร็จ:", err);
    }
  });
}

// ── Hamburger / Drawer ──
document.addEventListener("DOMContentLoaded", () => {
  const hamburger    = document.getElementById("hamburger-btn");
  const drawer       = document.getElementById("nav-drawer");
  const overlay      = document.getElementById("drawer-overlay");
  const drawerClose  = document.getElementById("drawer-close");

  function openDrawer() {
    drawer?.classList.add("open");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
  }

  hamburger?.addEventListener("click", openDrawer);
  drawerClose?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);
});