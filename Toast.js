// toast.js — ใช้แทน alert() ทุกหน้า
// วิธีใช้: import { toast } from "./toast.js";
//          toast("ข้อความ")              → info (default)
//          toast("สำเร็จ!", "success")
//          toast("ผิดพลาด", "error")
//          toast("แจ้งเตือน", "warning")

const ICONS = {
    success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

// สร้าง container ครั้งเดียว
function getContainer() {
    let c = document.getElementById("toast-container");
    if (!c) {
        c = document.createElement("div");
        c.id = "toast-container";
        c.className = "toast-container";
        document.body.appendChild(c);
    }
    return c;
}

export function toast(message, type = "info", duration = 3000) {
    const container = getContainer();

    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `
        <div class="toast__icon">${ICONS[type] ?? ICONS.info}</div>
        <span class="toast__msg">${message}</span>
    `;

    container.appendChild(el);

    // auto-remove
    const remove = () => {
        el.classList.add("toast--hiding");
        el.addEventListener("animationend", () => el.remove(), { once: true });
    };

    const timer = setTimeout(remove, duration);

    // คลิกเพื่อปิดเร็ว
    el.addEventListener("click", () => {
        clearTimeout(timer);
        remove();
    });
}