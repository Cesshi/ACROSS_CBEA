// ── API ───────────────────────────────────────────────────
const API = {
  base: "/across_cbea/api",
  async get(endpoint, params = "") {
    const r = await fetch(
      `${this.base}/${endpoint}.php${params ? "?" + params : ""}`,
      { credentials: "include" },
    );
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(endpoint, data) {
    const r = await fetch(`${this.base}/${endpoint}.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Request failed");
    return j;
  },
  async put(endpoint, data) {
    const r = await fetch(`${this.base}/${endpoint}.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Request failed");
    return j;
  },
  async del(endpoint, data) {
    const r = await fetch(`${this.base}/${endpoint}.php`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Request failed");
    return j;
  },
  async upload(endpoint, formData) {
    const r = await fetch(`${this.base}/${endpoint}.php`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Upload failed");
    return j;
  },
};

// ── CONSTANTS ─────────────────────────────────────────────
// 30-minute row slots from 7:00 AM to 9:00 PM
const SLOT_START = 7 * 60; // 7:00 AM in minutes
const SLOT_END = 21 * 60; // 9:00 PM in minutes
const SLOT_SIZE = 30; // 30-minute rows

// Generate 30-min slot labels
function genSlots(startMin, endMin, step) {
  const slots = [];
  for (let m = startMin; m < endMin; m += step) {
    const h = Math.floor(m / 60),
      mn = m % 60;
    const label =
      (h > 12 ? h - 12 : h === 0 ? 12 : h) +
      ":" +
      String(mn).padStart(2, "0") +
      (mn === 0 && h < 12 ? " AM" : mn === 0 && h >= 12 ? " PM" : "");
    slots.push({ min: m, label: label.trim() });
  }
  return slots;
}
const ALL_SLOTS = genSlots(SLOT_START, SLOT_END, SLOT_SIZE);

// Section slot ranges (in minutes from midnight)
const SECTION_MWF = { start: 7 * 60, end: 21 * 60, patterns: null };
const SECTION_TTH = { start: 7 * 60, end: 21 * 60, patterns: null };
const SECTION_SAT = { start: 7 * 60, end: 21 * 60, patterns: null };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Day pattern → days mapping
const DAY_MAP = {
  MWF: ["Mon", "Wed", "Fri"],
  TTH: ["Tue", "Thu"],
  SAT: ["Sat"],
  MW: ["Mon", "Wed"],
  MF: ["Mon", "Fri"],
  WF: ["Wed", "Fri"],
  M: ["Mon"],
  T: ["Tue"],
  W: ["Wed"],
  TH: ["Thu"],
  F: ["Fri"],
};

// Which day patterns belong to each section
const MWF_PATTERNS = new Set(["MWF", "MW", "MF", "WF", "M", "W", "F"]);
const TTH_PATTERNS = new Set(["TTH", "TH", "T"]);
const SAT_PATTERNS = new Set(["SAT"]);

const RESTRICTED_ROOMS = new Set([
  "THM Extension Building 3rd Floor",
  "BAR ROOM",
  "KL1",
  "KL2",
  "AVR CBEA",
  "READING CENTER",
]);

const PALETTE_L = [
  { bg: "#FEF0E0", border: "#F47920", text: "#C05010" },
  { bg: "#E6F0EA", border: "#1A5C2A", text: "#1A5C2A" },
  { bg: "#FEF8E0", border: "#C8980A", text: "#8A6408" },
  { bg: "#E8EEF8", border: "#1A3C6C", text: "#1A3C6C" },
  { bg: "#FDE8E8", border: "#C02828", text: "#8A1A1A" },
  { bg: "#E8F4F0", border: "#1A7060", text: "#0E4A3A" },
  { bg: "#F8EAF8", border: "#8C3A8C", text: "#5A205A" },
  { bg: "#FFF0D8", border: "#D4780A", text: "#8A4A08" },
];
const PALETTE_D = [
  { bg: "#3A1E08", border: "#F4922A", text: "#F4B870" },
  { bg: "#0E2818", border: "#4CAF68", text: "#70D890" },
  { bg: "#302008", border: "#F5D048", text: "#F5E080" },
  { bg: "#0E1828", border: "#6B98E8", text: "#90B8F8" },
  { bg: "#300E0E", border: "#E85050", text: "#F07878" },
  { bg: "#0E2820", border: "#40A888", text: "#60C8A8" },
  { bg: "#280E28", border: "#B870B8", text: "#D898D8" },
  { bg: "#281808", border: "#D88828", text: "#F0A848" },
];

let rooms = [];
let bookings = [];
let editRoomId = null,
  editBookingId = null;
let currentRole = null; // 'admin' | 'faculty'

const isDark = () =>
  document.documentElement.getAttribute("data-theme") === "dark";
const palette = () => (isDark() ? PALETTE_D : PALETTE_L);
const getColor = (i) => {
  const p = palette();
  return p[i % p.length];
};
// Stable color based on booking id — same booking always same color
function getStableColor(bk) {
  const p = palette();
  const seed = (bk.id || 0) + (bk.subj || "").charCodeAt(0) || 0;
  return p[seed % p.length];
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
  );
}
function showAlert(id, show) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = show ? "" : "none";
    el.classList.toggle("show", show);
  }
}
function clearErr(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("err");
}
function setErr(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("err");
}
const MAX_VISIBLE = 4;

// ── THEME ─────────────────────────────────────────────────
function toggleTheme() {
  const h = document.documentElement;
  h.setAttribute(
    "data-theme",
    h.getAttribute("data-theme") === "dark" ? "light" : "dark",
  );
  renderPubSched();
  renderVacantGrid();
  if (document.getElementById("screen-admin").classList.contains("active")) {
    const ap = document.querySelector(".pg.active");
    if (ap && ap.id === "apg-schedule") {
      renderAdminSched();
      renderAdminGrid();
    }
  }
  if (document.getElementById("screen-faculty").classList.contains("active")) {
    renderFacSched();
    renderFacGrid();
  }
}

// ── SCREENS ───────────────────────────────────────────────
function goScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("screen-" + id).classList.add("active");
  if (id === "landing") {
    populatePubSelects();
    renderPubSched();
    renderVacantGrid();
  }
  if (id === "admin") {
    initAdmin();
  }
  if (id === "faculty") {
    initFaculty();
  }
}
function smoothScrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function findRoomClick() {
  const s = document.getElementById("vacant-section");
  const wrap = document.getElementById("vacant-wrap");
  const pill = document.getElementById("vacant-pill");
  const toggle = document.querySelector(".vacant-toggle");
  if (s && !s.classList.contains("open")) {
    s.classList.add("open");
    if (toggle) toggle.classList.add("section-open");
    if (pill) pill.innerHTML = `<span class="dot"></span> Hide Vacant Rooms`;
    renderVacantGrid();
  }
  if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function doLogin() {
  const u = document.getElementById("l-user").value.trim();
  const p = document.getElementById("l-pass").value;
  const errEl = document.getElementById("l-err");
  if (!u || !p) {
    errEl.querySelector("span:last-child").textContent =
      "Please enter username and password.";
    showAlert("l-err", true);
    return;
  }
  try {
    const res = await API.post("login", { username: u, password: p });
    currentRole = res.role;
    showAlert("l-err", false);
    await loadData();
    goScreen(res.role === "admin" ? "admin" : "faculty");
  } catch (e) {
    errEl.querySelector("span:last-child").textContent =
      "Incorrect username or password.";
    showAlert("l-err", true);
  }
}

async function doLogout() {
  try {
    await API.del("login", {});
  } catch (e) {}
  currentRole = null;
  goScreen("landing");
}

// ── DATA ──────────────────────────────────────────────────
async function loadData() {
  try {
    const [r, b] = await Promise.all([
      API.get("rooms"),
      API.get("reservations", "status=all"),
    ]);
    rooms = r.filter((rm) => !RESTRICTED_ROOMS.has(rm.name));
    bookings = b;
  } catch (e) {
    console.error("loadData error:", e);
    toast("⚠️ Could not load data from server.");
  }
  populatePubSelects();
  renderPubSched();
  renderVacantGrid();
  renderHeroLiveSchedule();
}

async function loadAdminData() {
  try {
    const [r, b] = await Promise.all([
      API.get("rooms"),
      API.get("reservations", "status=all"),
    ]);
    rooms = r.filter((rm) => !RESTRICTED_ROOMS.has(rm.name));
    bookings = b;
    populateAdminSelects();
    renderDashboard();
    renderAdminSched();
    renderAdminGrid();
    renderRoomsTbl();
    renderBookingsTbl();
    renderReqTbl();
    updateBadge();
    populatePubSelects();
    populateFacSelects();
    renderHeroLiveSchedule();
  } catch (e) {
    console.error("loadAdminData", e);
  }
}

// ── TOOLTIP ───────────────────────────────────────────────
const tip = document.getElementById("tooltip");
function showTip(e, b) {
  document.getElementById("tt-subj").textContent = b.subj;
  document.getElementById("tt-room").textContent = b.room;
  document.getElementById("tt-prof").textContent = b.prof;
  document.getElementById("tt-group").textContent = b.group || "—";
  document.getElementById("tt-day").textContent = b.day;
  document.getElementById("tt-time").textContent = b.time;
  tip.classList.add("show");
  moveTip(e);
}
function moveTip(e) {
  const tw = tip.offsetWidth || 220,
    th = tip.offsetHeight || 150;
  const vw = window.innerWidth,
    vh = window.innerHeight;
  let lx = e.clientX + 14,
    ly = e.clientY + 14;
  if (lx + tw > vw - 10) lx = e.clientX - tw - 10;
  if (ly + th > vh - 10) ly = e.clientY - th - 10;
  tip.style.left = lx + "px";
  tip.style.top = ly + "px";
}
function hideTip() {
  tip.classList.remove("show");
}
document.addEventListener("mousemove", (e) => {
  if (tip.classList.contains("show")) moveTip(e);
});

// ── CHIP BUILDER ──────────────────────────────────────────
function buildChip(b, colorIdx, isConflict = false) {
  const c = getStableColor ? getStableColor(b) : getColor(colorIdx);
  const chip = document.createElement("div");
  chip.className =
    "slot-chip" +
    (b.status === "pending" ? " pending" : "") +
    (isConflict ? " conflict" : "");
  chip.style.cssText = isConflict
    ? "background:#FEE8E8;border-left-color:#D04040;color:#C02020"
    : `background:${c.bg};border-left-color:${c.border};color:${c.text}`;
  chip.innerHTML = `<div class="chip-s">${isConflict ? "⚠️ " : ""}${b.subj}</div><div class="chip-r">${b.group || b.prof}</div>`;
  chip.addEventListener("mouseenter", (e) => showTip(e, b));
  chip.addEventListener("mouseleave", hideTip);
  if (isConflict && currentRole === "admin") {
    chip.style.cursor = "pointer";
    chip.title = "Conflict — click to edit";
    chip.addEventListener("click", () => openBookingModal(b.id));
  }
  return chip;
}

// ── WEEKLY SCHEDULE TABLE ─────────────────────────────────
// matchesDay: checks if a booking's day pattern covers a specific weekday
function matchesDay(pattern, weekday) {
  const days = DAY_MAP[pattern] || [pattern];
  return days.includes(weekday);
}

// ── TIME UTILITIES ───────────────────────────────────────
function timeToMin(tStr) {
  if (!tStr) return -1;
  let s = tStr.toString().trim().toLowerCase();
  const hasPM = s.includes("pm");
  const hasAM = s.includes("am");
  s = s
    .replace(/[ap]m/gi, "")
    .replace(/[\u2013\u2014]/g, "-")
    .trim();
  const parts = s.split(":");
  if (parts.length < 2) return -1;
  let h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  if (hasPM && h < 12) h += 12;
  else if (hasAM && h === 12) h = 0;
  else if (!hasPM && !hasAM) {
    // PH convention: 1-6 without AM/PM = PM
    if (h >= 1 && h <= 6) h += 12;
  }
  return h * 60 + m;
}

function parseRange(t) {
  if (!t) return null;
  let s = t
    .toString()
    .trim()
    .replace(/[\u2013\u2014]/g, "-");
  // Split on the hyphen between times
  // Find hyphen that is NOT inside a time (after a digit, before a digit)
  const m = s.match(
    /^(\d+:\d+(?:\s*[ap]m)?)[\s\-\u2013\u2014]+(\d+:\d+(?:\s*[ap]m)?)$/i,
  );
  if (!m) return null;
  const start = timeToMin(m[1]);
  let end = timeToMin(m[2]);
  if (start < 0 || end < 0) return null;
  // If end <= start, end is next day or needs PM adjustment
  if (end <= start) end += 12 * 60;
  return { start, end };
}

function slotRowIndex(min) {
  return Math.floor((min - SLOT_START) / SLOT_SIZE);
}

function slotRowSpan(startMin, endMin) {
  const rows = Math.ceil((endMin - startMin) / SLOT_SIZE);
  return Math.max(1, rows);
}

function detectConflicts(bkList) {
  const conflicts = new Set();
  for (let i = 0; i < bkList.length; i++) {
    const a = bkList[i];
    const ra = parseRange(a.time);
    if (!ra) continue;
    for (let j = i + 1; j < bkList.length; j++) {
      const b = bkList[j];
      if (a.room !== b.room) continue;
      // Must share at least one day
      const aDays = DAY_MAP[a.day] || [a.day];
      const bDays = DAY_MAP[b.day] || [b.day];
      const sharedDay = aDays.some((d) => bDays.includes(d));
      if (!sharedDay) continue;
      const rb = parseRange(b.time);
      if (!rb) continue;
      if (ra.start < rb.end && rb.start < ra.end) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  }
  return conflicts;
}

// ── WEEKLY SCHEDULE (30-min rowspan) ─────────────────────
function buildSchedTable(headEl, bodyEl, roomFilter) {
  const approved = bookings.filter(
    (b) => b.status !== "rejected" && (!roomFilter || b.room === roomFilter),
  );
  const conflicts = detectConflicts(
    bookings.filter((b) => b.status === "approved"),
  );

  headEl.innerHTML =
    `<th class="time-th" style="width:72px;min-width:72px">Time</th>` +
    DAYS.map((d) => `<th>${d}</th>`).join("");
  bodyEl.innerHTML = "";

  // Skip map: skip[slotIdx_dayIdx] = true means cell is covered by a rowspan above
  // Must be declared ONCE outside the slot loop
  const skip = {};

  ALL_SLOTS.forEach((slot, si) => {
    const tr = document.createElement("tr");
    // Time label cell
    const tc = document.createElement("td");
    tc.className = "time-col";
    tc.style.cssText =
      "font-size:9px;white-space:nowrap;padding:0 6px;text-align:right;vertical-align:top;padding-top:3px";
    tc.textContent = slot.label;
    tr.appendChild(tc);

    DAYS.forEach((d, di) => {
      const key = si + "_" + di;
      if (skip[key]) {
        return;
      } // cell covered by rowspan above

      // Find bookings that START in this slot for this day
      const bks = approved.filter((b) => {
        if (!matchesDay(b.day, d)) return false;
        const r = parseRange(b.time);
        if (!r) return false;
        const startSlot = slotRowIndex(r.start);
        return startSlot === si;
      });

      if (bks.length === 0) {
        const td = document.createElement("td");
        td.className = "day-cell";
        td.style.height = "20px";
        tr.appendChild(td);
        return;
      }

      // Use the first booking for rowspan
      const bk = bks[0];
      const r = parseRange(bk.time);
      const span = r ? slotRowSpan(r.start, r.end) : 1;

      // Mark future slots as skipped
      for (let s2 = si + 1; s2 < si + span; s2++) {
        skip[s2 + "_" + di] = true;
      }

      const td = document.createElement("td");
      td.className = "day-cell";
      td.rowSpan = span;
      td.style.cssText = "padding:2px;vertical-align:top";
      td.style.height = span * 20 + "px";

      const inner = document.createElement("div");
      inner.style.cssText =
        "display:flex;flex-direction:column;gap:2px;height:100%";

      bks.forEach((b, i) => {
        inner.appendChild(buildChip(b, i, conflicts.has(b.id)));
      });
      if (bks.length > MAX_VISIBLE) {
        const more = document.createElement("div");
        more.className = "slot-more";
        more.textContent = "+" + (bks.length - MAX_VISIBLE);
        more.addEventListener("click", (e) => {
          e.stopPropagation();
          openSlotPopup(bks, slot.label, d, e);
        });
        inner.appendChild(more);
      }
      td.appendChild(inner);
      tr.appendChild(td);
    });

    bodyEl.appendChild(tr);
  });

  if (typeof highlightTodayColumn === "function") highlightTodayColumn();
}

// ── GRID VIEW — tabbed by day pattern ────────────────────

// Day pattern hierarchy: a booking with pattern P appears in tab T
// if every day in T is covered by P's days
const ALL_PATTERNS_ORDERED = [
  "MWF",
  "TTH",
  "SAT",
  "MW",
  "MF",
  "WF",
  "M",
  "T",
  "W",
  "TH",
  "F",
];

// Returns true if booking day pattern "covers" the tab pattern
// e.g. booking=TTH covers tab=T and tab=TH
function patternCoversTab(bookingDay, tabPattern) {
  const bDays = DAY_MAP[bookingDay] || [bookingDay];
  const tDays = DAY_MAP[tabPattern] || [tabPattern];
  return tDays.every((d) => bDays.includes(d));
}

// Get all tabs that have at least one booking
function getActiveTabs(bkList) {
  const tabs = [];
  ALL_PATTERNS_ORDERED.forEach((tab) => {
    const hasBk = bkList.some((b) => patternCoversTab(b.day, tab));
    if (hasBk) tabs.push(tab);
  });
  return tabs;
}

// Current active grid tab per grid element (by wrapEl id)
const gridTabState = {};

function buildGridView(wrapEl, roomFilter) {
  if (!wrapEl) return;
  const filteredRooms = roomFilter
    ? rooms.filter((r) => r.name === roomFilter)
    : rooms;
  if (!filteredRooms.length) {
    wrapEl.innerHTML =
      '<p style="color:var(--t3);padding:16px">No rooms to display.</p>';
    return;
  }

  const approved = bookings.filter((b) => b.status === "approved");
  const conflicts = detectConflicts(approved);
  const tabs = getActiveTabs(approved);

  if (!tabs.length) {
    wrapEl.innerHTML =
      '<p style="color:var(--t3);padding:16px">No approved reservations to display.</p>';
    return;
  }

  const wrapId = wrapEl.id || "grid";
  // Default to first tab or remembered tab
  if (!gridTabState[wrapId] || !tabs.includes(gridTabState[wrapId])) {
    gridTabState[wrapId] = tabs[0];
  }
  const activeTab = gridTabState[wrapId];

  // ── TAB BAR ──
  const tabBar = document.createElement("div");
  tabBar.style.cssText =
    "display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px 0;border-bottom:1px solid var(--border);background:var(--s2)";

  tabs.forEach((tab) => {
    const btn = document.createElement("button");
    btn.textContent = tab;
    const tabGroup = MWF_PATTERNS.has(tab)
      ? "forest"
      : TTH_PATTERNS.has(tab)
        ? "teal"
        : "gold";
    const activeColor =
      tabGroup === "forest"
        ? "var(--forest)"
        : tabGroup === "teal"
          ? "var(--teal)"
          : "var(--gold-d)";
    const activeText = tabGroup === "gold" ? "#3a2c00" : "#fff";
    btn.style.cssText = `padding:5px 14px;font-size:11px;font-weight:700;border-radius:6px 6px 0 0;border:1px solid var(--border);border-bottom:none;cursor:pointer;transition:all .15s;${tab === activeTab ? `background:${activeColor};color:${activeText};border-color:${activeColor}` : "background:var(--surface);color:var(--t2)"}`;
    btn.addEventListener("click", () => {
      gridTabState[wrapId] = tab;
      buildGridView(wrapEl, roomFilter);
    });
    tabBar.appendChild(btn);
  });

  // ── TABLE ──
  const tableWrap = document.createElement("div");
  tableWrap.style.cssText = "overflow-x:auto;padding:0";

  const tbl = document.createElement("table");
  tbl.className = "util-grid";

  // Bookings for this tab
  const tabBks = approved.filter((b) => patternCoversTab(b.day, activeTab));

  // Room header row
  const hdrRow = tbl.insertRow();
  const timeTh = document.createElement("th");
  timeTh.className = "time-th";
  timeTh.textContent = "Time";
  hdrRow.appendChild(timeTh);
  filteredRooms.forEach((r) => {
    const th = document.createElement("th");
    th.textContent = r.name;
    th.style.minWidth = "90px";
    hdrRow.appendChild(th);
  });

  // Skip map: roomIdx -> Set of slot indices already covered by rowspan
  const skipMap = {};
  filteredRooms.forEach((_, ri) => (skipMap[ri] = new Set()));

  ALL_SLOTS.forEach((slot, si) => {
    const tr = tbl.insertRow();

    // Time label
    const tc = document.createElement("td");
    tc.className = "time-col";
    tc.style.cssText =
      "font-size:9px;white-space:nowrap;padding:0 6px;text-align:right;vertical-align:top;padding-top:2px;width:60px;min-width:60px";
    tc.textContent = slot.label;
    tr.appendChild(tc);

    filteredRooms.forEach((room, ri) => {
      // If this slot is covered by a previous rowspan, skip — add NO td
      if (skipMap[ri].has(si)) return;

      // Find bookings starting at this slot for this room
      const bks = tabBks.filter((b) => {
        if (b.room !== room.name) return false;
        const r2 = parseRange(b.time);
        if (!r2) return false;
        return slotRowIndex(r2.start) === si;
      });

      const td = document.createElement("td");
      td.style.cssText =
        "padding:1px;vertical-align:top;border:1px solid var(--border)";

      if (bks.length === 0) {
        td.style.height = "20px";
        tr.appendChild(td);
        return;
      }

      // Compute rowspan from the first booking
      const r2 = parseRange(bks[0].time);
      const span = r2 ? Math.max(1, slotRowSpan(r2.start, r2.end)) : 1;

      // Mark all spanned slots in skipMap
      for (let s2 = si + 1; s2 < si + span; s2++) skipMap[ri].add(s2);

      td.rowSpan = span;
      td.style.height = span * 20 + "px";

      // Set td to position:relative so chip can fill it
      td.style.position = "relative";
      td.style.padding = "0";

      // Chips — fill the full td height, stacked if multiple
      const chipWrap = document.createElement("div");
      chipWrap.style.cssText =
        "position:absolute;inset:0;display:flex;flex-direction:column;gap:1px;overflow:hidden";

      bks.forEach((bk) => {
        const c = getStableColor(bk);
        const isConflict = conflicts.has(bk.id);
        const chip = document.createElement("div");
        chip.style.cssText = [
          "flex:1",
          "min-height:0",
          "border-radius:3px",
          "padding:2px 4px",
          "font-size:9px",
          "line-height:1.3",
          "overflow:hidden",
          "cursor:pointer",
          `background:${isConflict ? "#FEE8E8" : c.bg}`,
          `border-left:3px solid ${isConflict ? "#D04040" : c.border}`,
          `color:${isConflict ? "#C02020" : c.text}`,
        ].join(";");
        chip.innerHTML = `<div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${isConflict ? "⚠️ " : ""}${bk.subj}</div><div style="opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:8px">${bk.group || bk.prof}</div>`;
        chip.addEventListener("mouseenter", (e) => showTip(e, bk));
        chip.addEventListener("mouseleave", hideTip);
        if (currentRole === "admin") {
          chip.addEventListener("click", () => openBookingModal(bk.id));
        }
        chipWrap.appendChild(chip);
      });

      td.appendChild(chipWrap);

      tr.appendChild(td);
    });
  });

  tableWrap.appendChild(tbl);
  wrapEl.innerHTML = "";
  wrapEl.appendChild(tabBar);
  wrapEl.appendChild(tableWrap);
}

// ── PUBLIC SCHEDULE ───────────────────────────────────────
function renderPubSched() {
  buildSchedTable(
    document.getElementById("pub-sched-hd"),
    document.getElementById("pub-sched-bd"),
    document.getElementById("pub-room-f").value,
  );
}

// ── VACANT ────────────────────────────────────────────────
let vacantTypeFilter = "",
  vacantAvailFilter = "all";
function setVacantType(type, btn) {
  vacantTypeFilter = type;
  document
    .querySelectorAll("[data-type]")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderVacantGrid();
}
function setVacantAvail(avail, btn) {
  vacantAvailFilter = avail;
  document
    .querySelectorAll("[data-avail]")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderVacantGrid();
}
function renderVacantGrid() {
  const grid = document.getElementById("vacant-grid");
  const searchEl = document.getElementById("vacant-search");
  const countEl = document.getElementById("vacant-count");
  const floorEl = document.getElementById("vacant-floor-filter");
  const search = (searchEl ? searchEl.value : "").toLowerCase().trim();
  const floorFilter = floorEl ? floorEl.value : "";
  if (floorEl) {
    const floors = [...new Set(rooms.map((r) => r.floor))].sort();
    const cur = floorEl.value;
    floorEl.innerHTML =
      '<option value="">All Locations</option>' +
      floors
        .map(
          (f) =>
            `<option value="${f}"${f === cur ? " selected" : ""}>${f}</option>`,
        )
        .join("");
  }
  const approvedRooms = new Set(
    bookings.filter((b) => b.status === "approved").map((b) => b.room),
  );
  let filtered = rooms.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search)) return false;
    if (vacantTypeFilter && r.type !== vacantTypeFilter) return false;
    if (floorFilter && r.floor !== floorFilter) return false;
    if (vacantAvailFilter === "vacant" && approvedRooms.has(r.name))
      return false;
    if (vacantAvailFilter === "reserved" && !approvedRooms.has(r.name))
      return false;
    return true;
  });
  if (countEl)
    countEl.textContent = `Showing ${filtered.length} of ${rooms.length} rooms`;
  grid.innerHTML = filtered.length
    ? filtered
        .map((r) => {
          const hasB = approvedRooms.has(r.name);
          return `<div class="v-room"><div class="v-room-name">${r.name}</div><div class="v-room-type">${r.type} · Cap. ${r.cap || r.cap}</div><div style="font-size:11px;color:var(--t3);margin-bottom:8px">${r.floor}</div><span class="v-badge" style="${hasB ? "background:var(--al);color:var(--amber)" : ""}">${hasB ? "Has Reservations" : "Vacant"}</span></div>`;
        })
        .join("")
    : `<p style="color:var(--t3);font-size:13px;padding:8px 0;grid-column:1/-1">No rooms match your filters.</p>`;
}
function toggleVacant(btn) {
  const s = document.getElementById("vacant-section");
  const open = s.classList.toggle("open");
  const toggle = document.querySelector(".vacant-toggle");
  if (toggle) toggle.classList.toggle("section-open", open);
  btn.innerHTML = `<span class="dot"></span> ${open ? "Hide" : "Show"} Vacant Rooms`;
  if (open) renderVacantGrid();
}

// ── HERO LIVE SCHEDULE (today's vacant rooms by hour) ──────
const HERO_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HERO_HOURS_START = 7 * 60; // 7:00 AM
const HERO_HOURS_END = 20 * 60; // 8:00 PM
let heroScrollTimer = null;

function fmtHourLabel(min) {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ap}`;
}

function renderHeroLiveSchedule() {
  const body = document.getElementById("hero-sched-body");
  if (!body) return;

  const todayName = HERO_DAY_NAMES[new Date().getDay()];
  const activeRooms = rooms; // already excludes RESTRICTED_ROOMS via loadData/loadAdminData
  const approvedToday = bookings.filter((b) => {
    if (b.status !== "approved") return false;
    const days = DAY_MAP[b.day] || [b.day];
    return days.includes(todayName);
  });

  // Update footer stats
  const roomsWithBookingToday = new Set(approvedToday.map((b) => b.room));
  const totalRooms = activeRooms.length;
  const bookedCount = roomsWithBookingToday.size;
  const vacantCount = totalRooms - bookedCount;
  const elRooms = document.getElementById("hero-stat-rooms");
  const elBooked = document.getElementById("hero-stat-booked");
  const elVacant = document.getElementById("hero-stat-vacant");
  if (elRooms) elRooms.textContent = totalRooms;
  if (elBooked) elBooked.textContent = bookedCount;
  if (elVacant) elVacant.textContent = vacantCount;

  if (todayName === "Sun") {
    body.innerHTML = `<div class="hero-sched-row available-row"><div class="hero-sched-info"><div class="hero-sched-subj">No classes today</div><div class="hero-sched-meta">All rooms vacant all day · Sunday</div></div><span class="hero-sched-badge available">Vacant</span></div>`;
    return;
  }

  // For each room, build list of booked ranges today, then find open gaps within business hours
  const rows = [];
  activeRooms.forEach((r) => {
    const roomBookings = approvedToday
      .filter((b) => b.room === r.name)
      .map((b) => parseRange(b.time))
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    let cursor = HERO_HOURS_START;
    const gaps = [];
    roomBookings.forEach((rb) => {
      const start = Math.max(rb.start, HERO_HOURS_START);
      const end = Math.min(rb.end, HERO_HOURS_END);
      if (start > cursor) gaps.push({ start: cursor, end: start });
      cursor = Math.max(cursor, end);
    });
    if (cursor < HERO_HOURS_END)
      gaps.push({ start: cursor, end: HERO_HOURS_END });

    gaps.forEach((g) => {
      if (g.end - g.start >= 30) {
        rows.push({
          room: r.name,
          type: r.type,
          start: g.start,
          end: g.end,
        });
      }
    });
  });

  rows.sort((a, b) => a.start - b.start || a.room.localeCompare(b.room));

  if (!rows.length) {
    body.innerHTML = `<div class="hero-sched-row confirmed-row"><div class="hero-sched-info"><div class="hero-sched-subj">No vacant slots</div><div class="hero-sched-meta">All rooms fully booked today</div></div><span class="hero-sched-badge confirmed">Full</span></div>`;
    return;
  }

  body.innerHTML = rows
    .map(
      (r, i) => `
      ${i > 0 ? '<div class="hero-sched-divider"></div>' : ""}
      <div class="hero-sched-row available-row">
        <span class="hero-sched-time">${fmtHourLabel(r.start)}–${fmtHourLabel(r.end)}</span>
        <div class="hero-sched-info">
          <div class="hero-sched-subj">${r.room}</div>
          <div class="hero-sched-meta">${r.type} · Vacant</div>
        </div>
        <span class="hero-sched-badge available">Vacant</span>
      </div>`,
    )
    .join("");

  startHeroAutoScroll();
}

function startHeroAutoScroll() {
  const body = document.getElementById("hero-sched-body");
  if (!body) return;
  if (heroScrollTimer) clearInterval(heroScrollTimer);
  let direction = 1;
  heroScrollTimer = setInterval(() => {
    if (!body.isConnected) {
      clearInterval(heroScrollTimer);
      return;
    }
    const maxScroll = body.scrollHeight - body.clientHeight;
    if (maxScroll <= 0) return;
    body.scrollTop += direction * 0.6;
    if (body.scrollTop >= maxScroll) direction = -1;
    if (body.scrollTop <= 0) direction = 1;
  }, 40);
}

// ── PUBLIC SELECTS ────────────────────────────────────────
function populatePubSelects() {
  const pf = document.getElementById("pub-room-f");
  if (pf)
    pf.innerHTML =
      '<option value="">All Rooms</option>' +
      rooms.map((r) => `<option>${r.name}</option>`).join("");
}

// ── FACULTY INIT ──────────────────────────────────────────
function initFaculty() {
  populateFacSelects();
  renderFacSched();
  showAlert("fac-room-info", true);
  document.getElementById("fac-new-zone").style.display = "";
  document.getElementById("fac-change-zone").style.display = "none";
}

function populateFacSelects() {
  const rOpts =
    '<option value="">Select a room</option>' +
    rooms.map((r) => `<option>${r.name}</option>`).join("");
  const rF = document.getElementById("fac-room-f");
  if (rF)
    rF.innerHTML =
      '<option value="">All Rooms</option>' +
      rooms.map((r) => `<option>${r.name}</option>`).join("");
  const gRF = document.getElementById("fac-grid-room-f");
  if (gRF)
    gRF.innerHTML =
      '<option value="">All Rooms</option>' +
      rooms.map((r) => `<option>${r.name}</option>`).join("");
  ["fac-room", "fac-from-room", "fac-to-room"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = rOpts.replace("Select a room", "Select a room");
  });
}

function renderFacSched() {
  buildSchedTable(
    document.getElementById("fac-sched-hd"),
    document.getElementById("fac-sched-bd"),
    document.getElementById("fac-room-f")?.value || "",
  );
}

function renderFacGrid() {
  buildGridView(
    document.getElementById("fac-grid-wrap"),
    document.getElementById("fac-grid-room-f")?.value || "",
  );
}

let facViewIsGrid = false;
function toggleFacultyView() {
  facViewIsGrid = !facViewIsGrid;
  document.getElementById("fac-weekly-view").style.display = facViewIsGrid
    ? "none"
    : "";
  document.getElementById("fac-grid-view").style.display = facViewIsGrid
    ? ""
    : "none";
  document.getElementById("fac-view-toggle").textContent = facViewIsGrid
    ? "☰ Weekly View"
    : "⊞ Grid View";
  if (facViewIsGrid) renderFacGrid();
}

// ── FACULTY REQUEST FORM ──────────────────────────────────
let facNewSlot = { day: null, time: null },
  facFromSlot = { day: null, time: null },
  facToSlot = { day: null, time: null };
let facPickerMode = null,
  facPickerRoom = null;

function onFacReqTypeChange() {
  const t = document.getElementById("fac-reqtype").value;
  document.getElementById("fac-new-zone").style.display =
    t === "new" ? "" : "none";
  document.getElementById("fac-change-zone").style.display =
    t === "change" ? "" : "none";
  facNewSlot = { day: null, time: null };
  facFromSlot = { day: null, time: null };
  facToSlot = { day: null, time: null };
}

function onFacNewRoomChange() {
  const room = document.getElementById("fac-room").value;
  facNewSlot = { day: null, time: null };
  hideEl("fac-new-slot-display");
  showAlert("fac-room-info", false);
  if (room) openFacPickerModal(room, "new");
  else showAlert("fac-room-info", true);
}
function onFacFromRoomChange() {
  const room = document.getElementById("fac-from-room").value;
  facFromSlot = { day: null, time: null };
  hideEl("fac-from-display");
  if (room) openFacPickerModal(room, "from");
}
function onFacToRoomChange() {
  const room = document.getElementById("fac-to-room").value;
  facToSlot = { day: null, time: null };
  hideEl("fac-to-display");
  if (room) openFacPickerModal(room, "to");
}
function clearFacNewSlot() {
  facNewSlot = { day: null, time: null };
  hideEl("fac-new-slot-display");
}
function clearFacFromSlot() {
  facFromSlot = { day: null, time: null };
  hideEl("fac-from-display");
  updateFacChangeSummary();
}
function clearFacToSlot() {
  facToSlot = { day: null, time: null };
  hideEl("fac-to-display");
  updateFacChangeSummary();
}

function hideEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}
function showEl(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "flex";
  const sp = el.querySelector("span:nth-child(2)");
  if (sp) sp.textContent = text;
}

function updateFacChangeSummary() {
  const cs = document.getElementById("fac-change-summary");
  if (!cs) return;
  const fr = document.getElementById("fac-from-room")?.value || "";
  const tr = document.getElementById("fac-to-room")?.value || "";
  if ((fr && facFromSlot.day) || (tr && facToSlot.day)) {
    cs.classList.add("show");
    document.getElementById("fac-cs-from").textContent =
      fr && facFromSlot.day
        ? `${fr} · ${facFromSlot.day} · ${facFromSlot.time}`
        : "Not yet selected";
    document.getElementById("fac-cs-to").textContent =
      tr && facToSlot.day
        ? `${tr} · ${facToSlot.day} · ${facToSlot.time}`
        : "Not yet selected";
  } else {
    cs.classList.remove("show");
  }
}

function openFacPickerModal(room, mode) {
  facPickerMode = mode;
  facPickerRoom = room;
  const isFrom = mode === "from";
  document.getElementById("sched-picker-title").textContent =
    `${room} — ${mode === "new" ? "Select a Time Slot" : isFrom ? "Select Your Current Slot" : "Select Your New Slot"}`;
  document.getElementById("sched-picker-sub").textContent = isFrom
    ? "Click your existing reserved slot."
    : "Click a vacant slot to select it.";
  buildPickerTable(room, mode);
  openModal("sched-picker-modal");
}

async function submitFacRequest() {
  const name = document.getElementById("fac-name").value.trim();
  const subj = document.getElementById("fac-subj").value.trim();
  const group = document.getElementById("fac-group").value.trim();
  const email = document.getElementById("fac-email").value.trim();
  const rtype = document.getElementById("fac-reqtype").value;
  const notes = document.getElementById("fac-notes").value.trim();
  showAlert("fac-conflict", false);
  showAlert("fac-warn", false);
  if (!name || !subj || !group) {
    toast("Please fill in Name, Course Code, and Group.");
    return;
  }

  let room,
    day,
    time,
    fromInfo = "";
  if (rtype === "new") {
    room = document.getElementById("fac-room").value;
    day = facNewSlot.day;
    time = facNewSlot.time;
    if (!room || !day || !time) {
      document.getElementById("fac-warn-msg").textContent =
        "Please select a room and time slot.";
      showAlert("fac-warn", true);
      return;
    }
  } else {
    const fr = document.getElementById("fac-from-room").value;
    const tr = document.getElementById("fac-to-room").value;
    if (!fr || !facFromSlot.day) {
      document.getElementById("fac-warn-msg").textContent =
        "Please select your current room and slot.";
      showAlert("fac-warn", true);
      return;
    }
    if (!tr || !facToSlot.day) {
      document.getElementById("fac-warn-msg").textContent =
        "Please select your destination room and new slot.";
      showAlert("fac-warn", true);
      return;
    }
    fromInfo = `\n[Change request — from: ${fr} · ${facFromSlot.day} · ${facFromSlot.time} → to: ${tr} · ${facToSlot.day} · ${facToSlot.time}]`;
    room = tr;
    day = facToSlot.day;
    time = facToSlot.time;
  }

  try {
    await API.post("requests", {
      prof: name,
      subj,
      group,
      email,
      room,
      day,
      time,
      notes: notes + fromInfo,
    });
    // Reset form
    ["fac-name", "fac-subj", "fac-group", "fac-notes"].forEach(
      (id) => (document.getElementById(id).value = ""),
    );
    document.getElementById("fac-email").value = "";
    document.getElementById("fac-room").selectedIndex = 0;
    document.getElementById("fac-reqtype").selectedIndex = 0;
    facNewSlot = { day: null, time: null };
    facFromSlot = { day: null, time: null };
    facToSlot = { day: null, time: null };
    hideEl("fac-new-slot-display");
    hideEl("fac-from-display");
    hideEl("fac-to-display");
    document.getElementById("fac-new-zone").style.display = "";
    document.getElementById("fac-change-zone").style.display = "none";
    document.getElementById("fac-change-summary").classList.remove("show");
    showAlert("fac-room-info", true);
    toast("✅ Request submitted. The scheduling head will review it.");
    // Reload bookings so grid updates
    await loadData();
  } catch (e) {
    document.getElementById("fac-conflict-msg").textContent = e.message;
    showAlert("fac-conflict", true);
  }
}

// ── PICKER MODAL (shared for faculty & admin) ─────────────
function buildPickerTable(room, mode) {
  const hd = document.getElementById("picker-hd");
  const bd = document.getElementById("picker-bd");
  hd.innerHTML =
    `<th class="rmc-time-th" style="width:75px;min-width:75px">Time</th>` +
    DAYS.map((d) => `<th>${d}</th>`).join("");
  bd.innerHTML = "";
  TIMES.forEach((t) => {
    const tr = document.createElement("tr");
    const tc = document.createElement("td");
    tc.className = "rmc-time";
    tc.textContent = t;
    tr.appendChild(tc);
    DAYS.forEach((d) => {
      const roomBks = bookings.filter(
        (b) =>
          b.room === room &&
          matchesDay(b.day, d) &&
          timesOverlap(b.time, t) &&
          b.status === "approved",
      );
      const td = document.createElement("td");
      td.style.cssText = "padding:2px;vertical-align:top;height:44px";
      if (roomBks.length > 0) {
        const inner = document.createElement("div");
        inner.style.cssText =
          "display:flex;flex-direction:column;gap:2px;height:100%";
        roomBks.slice(0, MAX_VISIBLE).forEach((bk, i) => {
          const c = getColor(i);
          const chip = document.createElement("div");
          chip.style.cssText = `background:${c.bg};border-left:2px solid ${c.border};color:${c.text};border-radius:4px;padding:2px 5px;font-size:9px;line-height:1.3;flex:1;min-height:0;overflow:hidden`;
          chip.innerHTML = `<div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${bk.subj}</div><div style="opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${bk.group || bk.prof}</div>`;
          chip.addEventListener("mouseenter", (e) => showTip(e, bk));
          chip.addEventListener("mouseleave", hideTip);
          if (mode === "from") {
            const isSel =
              facFromSlot.day === d &&
              normalizeTime(facFromSlot.time) === normalizeTime(t);
            chip.style.cursor = "pointer";
            chip.style.outline = isSel ? `2px solid ${c.border}` : "none";
            if (isSel) {
              const tick = document.createElement("div");
              tick.style.cssText =
                "font-size:8px;font-weight:700;margin-top:1px";
              tick.textContent = "✓ Selected";
              chip.appendChild(tick);
            }
            chip.addEventListener("click", () => {
              facFromSlot = { day: d, time: t };
              closeModal("sched-picker-modal");
              showEl(
                "fac-from-display",
                `${document.getElementById("fac-from-room").value} · ${d} · ${t}`,
              );
              updateFacChangeSummary();
            });
          }
          inner.appendChild(chip);
        });
        td.appendChild(inner);
      } else {
        if (mode === "new" || mode === "to") {
          const isSel =
            (mode === "new" &&
              facNewSlot.day === d &&
              normalizeTime(facNewSlot.time) === normalizeTime(t)) ||
            (mode === "to" &&
              facToSlot.day === d &&
              normalizeTime(facToSlot.time) === normalizeTime(t));
          td.style.cursor = "pointer";
          td.style.background = isSel ? "var(--green)" : "";
          td.addEventListener("mouseenter", () => {
            if (!isSel) td.style.background = "var(--al)";
          });
          td.addEventListener("mouseleave", () => {
            if (!isSel) td.style.background = "";
          });
          if (isSel) {
            const tick = document.createElement("div");
            tick.style.cssText =
              "color:#fff;font-size:9px;font-weight:700;text-align:center;padding-top:4px";
            tick.textContent = "✓";
            td.appendChild(tick);
          }
          td.addEventListener("click", () => {
            if (mode === "new") {
              facNewSlot = { day: d, time: t };
              closeModal("sched-picker-modal");
              showEl(
                "fac-new-slot-display",
                `${document.getElementById("fac-room").value} · ${d} · ${t}`,
              );
              showAlert("fac-room-info", false);
            } else {
              facToSlot = { day: d, time: t };
              closeModal("sched-picker-modal");
              showEl(
                "fac-to-display",
                `${document.getElementById("fac-to-room").value} · ${d} · ${t}`,
              );
              updateFacChangeSummary();
            }
          });
        }
      }
      tr.appendChild(td);
    });
    bd.appendChild(tr);
  });
}

// ── ADMIN INIT ────────────────────────────────────────────
function initAdmin() {
  populateAdminSelects();
  renderDashboard();
  renderAdminSched();
  renderRoomsTbl();
  renderBookingsTbl();
  renderReqTbl();
  updateBadge();
}

function showAdminPg(id, el) {
  document.querySelectorAll(".pg").forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".a-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("apg-" + id).classList.add("active");
  if (el) el.classList.add("active");
  if (id === "schedule") {
    renderAdminSched();
    renderAdminGrid();
  }
  if (id === "rooms") renderRoomsTbl();
  if (id === "reservations") renderBookingsTbl();
  if (id === "requests") renderReqTbl();
  if (id === "dashboard") renderDashboard();
}

function populateAdminSelects() {
  const rNames = rooms.map((r) => r.name);
  const roomOpts =
    '<option value="">All Rooms</option>' +
    rNames.map((n) => `<option>${n}</option>`).join("");
  ["a-room-f", "a-grid-room-f"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = roomOpts;
  });
  document.getElementById("bk-room").innerHTML =
    '<option value="">Select room</option>' +
    rNames.map((n) => `<option>${n}</option>`).join("");
  const sel = document.getElementById("export-room-select");
  if (sel)
    sel.innerHTML =
      '<option value="">Choose a room...</option>' +
      rNames.map((n) => `<option>${n}</option>`).join("");
}

function updateBadge() {
  const n = bookings.filter((b) => b.status === "pending").length;
  const b = document.getElementById("req-badge");
  if (b) {
    b.textContent = n;
    b.style.display = n > 0 ? "inline" : "none";
  }
}

function renderDashboard() {
  const approved = bookings.filter((b) => b.status === "approved");
  const pending = bookings.filter((b) => b.status === "pending");
  const vacant = rooms.filter(
    (r) => !approved.some((b) => b.room === r.name),
  ).length;
  const conflictIds = detectConflicts(approved);

  document.getElementById("ds-rooms").textContent = rooms.length;
  document.getElementById("ds-approved").textContent = approved.length;
  document.getElementById("ds-pending").textContent = pending.length;
  document.getElementById("ds-vacant").textContent = vacant;

  // Pending requests table
  document.getElementById("dash-pending").innerHTML = pending.length
    ? pending
        .map(
          (b) =>
            `<tr><td>${b.prof}</td><td>${b.subj}</td><td>${b.room}</td><td>${b.day} · ${b.time}</td><td><span class="tag amber">pending</span></td><td><div class="acts"><button class="btn-a ok" onclick="approveB(${b.id})">Approve</button><button class="btn-a rej" onclick="rejectB(${b.id})">Reject</button></div></td></tr>`,
        )
        .join("")
    : `<tr><td colspan="6" class="empty">No pending requests.</td></tr>`;

  // Conflicts section
  const conflictEl = document.getElementById("dash-conflicts");
  if (conflictEl) {
    const conflictBks = approved.filter((b) => conflictIds.has(b.id));
    conflictEl.innerHTML = conflictBks.length
      ? conflictBks
          .map(
            (b) =>
              `<tr style="background:#FEF0F0"><td><strong>${b.room}</strong></td><td>${b.subj}</td><td>${b.group || b.prof}</td><td>${b.day} · ${b.time}</td><td><button class="btn-a ed" onclick="openBookingModal(${b.id})" style="background:#D04040;color:#fff;border:none">Resolve</button></td></tr>`,
          )
          .join("")
      : `<tr><td colspan="5" class="empty" style="color:var(--green)">✅ No scheduling conflicts.</td></tr>`;
  }
}

let adminSchedView = "weekly";
function setAdminSchedView(view, btn) {
  adminSchedView = view;
  document
    .querySelectorAll("#sched-view-weekly,#sched-view-grid")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("admin-weekly-view").style.display =
    view === "weekly" ? "" : "none";
  document.getElementById("admin-grid-view").style.display =
    view === "grid" ? "" : "none";
  if (view === "grid") renderAdminGrid();
  else renderAdminSched();
}

function renderAdminSched() {
  buildSchedTable(
    document.getElementById("a-sched-hd"),
    document.getElementById("a-sched-bd"),
    document.getElementById("a-room-f")?.value || "",
  );
}
function renderAdminGrid() {
  buildGridView(
    document.getElementById("admin-grid-wrap"),
    document.getElementById("a-grid-room-f")?.value || "",
  );
}

function renderRoomsTbl() {
  document.getElementById("rooms-tbl").innerHTML = rooms
    .map((r) => {
      const hasB = bookings.some(
        (b) => b.room === r.name && b.status === "approved",
      );
      return `<tr><td><strong>${r.name}</strong></td><td>${r.type}</td><td>${r.cap}</td><td>${r.floor}</td>
    <td><span class="tag ${hasB ? "amber" : "green"}">${hasB ? "Has reservations" : "Vacant"}</span></td>
    <td><div class="acts">
      <button class="btn-a ed" onclick="openRoomModal(${r.id})">Edit</button>
      <button class="btn-a dl" onclick="deleteRoom(${r.id})">Delete</button>
    </div></td></tr>`;
    })
    .join("");
}

function renderBookingsTbl() {
  const approved = bookings.filter((b) => b.status === "approved");
  document.getElementById("reservations-tbl").innerHTML = approved.length
    ? approved
        .map(
          (
            b,
          ) => `<tr><td>${b.prof}</td><td>${b.subj}</td><td>${b.group || "—"}</td><td>${b.room}</td><td>${b.day}</td><td>${b.time}</td>
    <td><div class="acts">
      <button class="btn-a ed" onclick="openBookingModal(${b.id})">Edit</button>
      <button class="btn-a dl" onclick="deleteBooking(${b.id})">Delete</button>
    </div></td></tr>`,
        )
        .join("")
    : `<tr><td colspan="7" class="empty">No approved reservations.</td></tr>`;
}

// ── SLOT POPUP ────────────────────────────────────────────
let slotPopupOpen = false;
function openSlotPopup(bks, time, day, e) {
  hideTip();
  const popup = document.getElementById("slot-popup");
  document.getElementById("sp-title").textContent = `${day} · ${time}`;
  document.getElementById("sp-count").textContent =
    `${bks.length} reservation${bks.length > 1 ? "s" : ""}`;
  const p = palette();
  document.getElementById("sp-list").innerHTML = bks
    .map((b, i) => {
      const c = p[i % p.length];
      const sc =
        b.status === "approved"
          ? "var(--green)"
          : b.status === "pending"
            ? "var(--amber)"
            : "var(--red)";
      const sb =
        b.status === "approved"
          ? "var(--gl)"
          : b.status === "pending"
            ? "var(--al)"
            : "var(--rl)";
      return `<div class="slot-popup-item"><div class="slot-popup-dot" style="background:${c.border}"></div><div class="slot-popup-info"><div class="pi-subj">${b.subj}</div><div class="pi-meta">${b.prof} · ${b.room}</div><div class="pi-group">${b.group || "—"}</div><span class="slot-popup-badge" style="background:${sb};color:${sc}">${b.status}</span></div></div>`;
    })
    .join("");
  popup.classList.add("open");
  const pw = popup.offsetWidth || 300,
    ph = popup.offsetHeight || 300;
  const vw = window.innerWidth,
    vh = window.innerHeight;
  let lx = e.clientX + 12,
    ly = e.clientY + 12;
  if (lx + pw > vw - 12) lx = e.clientX - pw - 12;
  if (ly + ph > vh - 12) ly = e.clientY - ph - 12;
  if (ly < 12) ly = 12;
  popup.style.left = lx + "px";
  popup.style.top = ly + "px";
  slotPopupOpen = true;
}
function closeSlotPopup() {
  document.getElementById("slot-popup").classList.remove("open");
  slotPopupOpen = false;
}
document.addEventListener("click", (e) => {
  const p = document.getElementById("slot-popup");
  if (slotPopupOpen && !p.contains(e.target)) closeSlotPopup();
});

// ── REQUESTS ──────────────────────────────────────────────
function clearReqSearch() {
  const el = document.getElementById("req-search");
  if (el) el.value = "";
  renderReqTbl();
}
function renderReqTbl() {
  const q = (document.getElementById("req-search")?.value || "")
    .toLowerCase()
    .trim();
  const sorted = [...bookings].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    if (a.actionAt && b.actionAt)
      return new Date(b.actionAt) - new Date(a.actionAt);
    return 0;
  });
  const filtered = q
    ? sorted.filter(
        (b) =>
          b.prof.toLowerCase().includes(q) ||
          b.subj.toLowerCase().includes(q) ||
          (b.group || "").toLowerCase().includes(q) ||
          b.room.toLowerCase().includes(q) ||
          b.day.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q) ||
          (b.notes || "").toLowerCase().includes(q),
      )
    : sorted;
  const countEl = document.getElementById("req-result-count");
  if (countEl)
    countEl.textContent = q
      ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${q}"`
      : filtered.length + ` request${filtered.length !== 1 ? "s" : ""}`;
  function hl(str) {
    if (!q || !str) return str || "—";
    const re = new RegExp(
      `(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    return String(str).replace(
      re,
      '<mark style="background:var(--al);color:var(--amber);border-radius:2px;padding:0 2px">$1</mark>',
    );
  }
  document.getElementById("req-tbl").innerHTML = filtered.length
    ? filtered
        .map(
          (b) => `<tr>
    <td>${hl(b.prof)}</td><td>${hl(b.subj)}</td><td>${hl(b.group || "—")}</td><td>${hl(b.room)}</td>
    <td>${hl(b.day)} · ${b.time}</td>
    <td>${b.notes ? `<button class="btn-a view-notes" onclick="viewNotes(${b.id})" style="font-size:11px">View Notes</button>` : `<span style="font-size:11px;color:var(--t3)">No Notes</span>`}</td>
    <td><span class="tag ${b.status === "approved" ? "green" : b.status === "pending" ? "amber" : "red"}">${b.status}</span></td>
    <td style="font-size:11px;color:var(--t3)">${fmtDate(b.actionAt)}</td>
    <td><div class="acts">${b.status === "pending" ? `<button class="btn-a ok" onclick="approveB(${b.id})">Approve</button><button class="btn-a rej" onclick="rejectB(${b.id})">Reject</button>` : ""}</div></td>
  </tr>`,
        )
        .join("")
    : `<tr><td colspan="9" class="empty">No results${q ? ` for "${q}"` : ""}.</td></tr>`;
}

function viewNotes(id) {
  const b = bookings.find((x) => x.id === id);
  if (!b) return;
  const c = document.getElementById("notes-view-content");
  if (b.notes) {
    c.className = "notes-view";
    c.textContent = b.notes;
  } else {
    c.className = "notes-empty";
    c.innerHTML = "<span>📭</span><span>No notes were added.</span>";
  }
  openModal("notes-modal");
}

function buildEmailBody(b, status) {
  const aw = status === "approved" ? "APPROVED" : "REJECTED";
  return `Dear ${b.prof},\n\nYour room reservation request has been ${aw}.\n\nREQUEST DETAILS\n──────────────────────────\nName: ${b.prof}\nCourse Code: ${b.subj}\nGroup: ${b.group || "—"}\nRoom: ${b.room}\nDay: ${b.day}\nTime Slot: ${b.time}\nDate of Action: ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n──────────────────────────\n${status === "approved" ? "Your reservation has been confirmed. Please use the room only during your assigned time slot." : "Your request was not approved. Please submit a new request or contact the CBEA Scheduling Head."}\n\nRegards,\nAcademic ClassRoom Occupancy Scheduling System (ACROSS)\nCollege of Business Economics and Accountancy`;
}
function sendEmailNotif(b, status) {
  if (!b.email) return;
  const sub = encodeURIComponent(
    `[ACROSS CBEA] Room Reservation ${status === "approved" ? "Approved ✅" : "Rejected ❌"} — ${b.subj}`,
  );
  const bod = encodeURIComponent(buildEmailBody(b, status));
  window.open(`mailto:${b.email}?subject=${sub}&body=${bod}`, "_blank");
}

async function approveB(id) {
  try {
    await API.put("requests", { id, action: "approve" });
    await loadAdminData();
    const b = bookings.find((x) => x.id === id);
    if (b && b.email) {
      sendEmailNotif(b, "approved");
      toast("✅ Approved. Email notification opened.");
    } else toast("✅ Request approved.");
  } catch (e) {
    toast("⚠️ " + e.message);
  }
}
async function rejectB(id) {
  try {
    await API.put("requests", { id, action: "reject" });
    await loadAdminData();
    const b = bookings.find((x) => x.id === id);
    if (b && b.email) {
      sendEmailNotif(b, "rejected");
      toast("Request rejected. Email notification opened.");
    } else toast("Request rejected.");
  } catch (e) {
    toast("⚠️ " + e.message);
  }
}

// ── ROOM CRUD ─────────────────────────────────────────────
function openRoomModal(id = null) {
  editRoomId = id;
  const r = id ? rooms.find((x) => String(x.id) === String(id)) : null;
  document.getElementById("rm-title").textContent = id
    ? "Edit Room"
    : "Add Room";
  document.getElementById("rm-name").value = r ? r.name : "";
  document.getElementById("rm-type").value = r ? r.type : "Lecture Room";
  document.getElementById("rm-cap").value = r ? r.cap : "";
  document.getElementById("rm-floor").value = r ? r.floor : "";
  clearErr("rm-name");
  showAlert("rm-err", false);
  openModal("room-modal");
}
async function saveRoom() {
  const name = document.getElementById("rm-name").value.trim();
  const type = document.getElementById("rm-type").value;
  const cap = parseInt(document.getElementById("rm-cap").value) || 0;
  const floor = document.getElementById("rm-floor").value.trim();
  clearErr("rm-name");
  showAlert("rm-err", false);
  if (!name) {
    setErr("rm-name");
    document.getElementById("rm-err-msg").textContent =
      "Room name is required.";
    showAlert("rm-err", true);
    return;
  }
  try {
    const oldRoom = editRoomId
      ? rooms.find((x) => String(x.id) === String(editRoomId))
      : null;
    if (editRoomId) {
      await API.put("rooms", {
        name,
        type,
        cap,
        floor,
        id: editRoomId,
        oldName: oldRoom?.name || name,
      });
      toast("Room updated.");
    } else {
      await API.post("rooms", { name, type, cap, floor });
      toast("Room added.");
    }
    closeModal("room-modal");
    await loadAdminData();
    populatePubSelects();
    populateFacSelects();
    editRoomId = null;
  } catch (e) {
    document.getElementById("rm-err-msg").textContent = e.message;
    showAlert("rm-err", true);
  }
}
async function deleteRoom(id) {
  const r = rooms.find((x) => x.id === id);
  if (!r) return;
  if (
    !confirm(
      `Delete "${r.name}"? All reservations for this room will also be deleted.`,
    )
  )
    return;
  try {
    await API.del("rooms", { id });
    await loadAdminData();
    populatePubSelects();
    populateFacSelects();
    toast(`"${r.name}" deleted.`);
  } catch (e) {
    toast("⚠️ " + e.message);
  }
}

// ── BOOKING CRUD ──────────────────────────────────────────
function checkBkConflict() {
  const room = document.getElementById("bk-room").value;
  const day = document.getElementById("bk-day").value;
  const time = document.getElementById("bk-time").value;
  const el = document.getElementById("bk-conflict");
  if (room && day && time) {
    const c = bookings.find(
      (b) =>
        b.room === room &&
        b.day === day &&
        normalizeTime(b.time) === normalizeTime(time) &&
        b.status === "approved" &&
        b.id !== editBookingId,
    );
    el.style.display = c ? "flex" : "none";
    if (c)
      document.getElementById("bk-conflict-msg").textContent =
        `${room} is already reserved on ${day} at ${time}.`;
  } else {
    el.style.display = "none";
  }
}
function openBookingModal(id = null) {
  editBookingId = id;
  populateAdminSelects();
  const b = id ? bookings.find((x) => x.id === id) : null;
  document.getElementById("bk-title").textContent = id
    ? "Edit Reservation"
    : "Add Reservation";
  document.getElementById("bk-prof").value = b ? b.prof : "";
  document.getElementById("bk-subj").value = b ? b.subj : "";
  document.getElementById("bk-group").value = b ? b.group || "" : "";
  document.getElementById("bk-room").value = b ? b.room : "";
  document.getElementById("bk-day").value = b ? b.day : "";
  document.getElementById("bk-time").value = b ? b.time : "";
  document.getElementById("bk-conflict").style.display = "none";
  openModal("reservation-modal");
}
async function saveBooking() {
  const prof = document.getElementById("bk-prof").value.trim();
  const subj = document.getElementById("bk-subj").value.trim();
  const group = document.getElementById("bk-group").value.trim();
  const room = document.getElementById("bk-room").value;
  const day = document.getElementById("bk-day").value;
  const time = document.getElementById("bk-time").value;
  if (!prof || !subj || !room || !day || !time) {
    toast("Please fill all required fields.");
    return;
  }
  try {
    const payload = { prof, subj, group, room, day, time, status: "approved" };
    if (editBookingId) {
      await API.put("reservations", { ...payload, id: editBookingId });
      toast("Reservation updated.");
    } else {
      await API.post("reservations", payload);
      toast("Reservation added.");
    }
    closeModal("reservation-modal");
    await loadAdminData();
    editBookingId = null;
  } catch (e) {
    toast("🚫 " + e.message);
  }
}
async function deleteBooking(id) {
  if (!confirm("Delete this reservation?")) return;
  try {
    await API.del("reservations", { id });
    await loadAdminData();
    toast("Reservation deleted.");
  } catch (e) {
    toast("⚠️ " + e.message);
  }
}

// ── CLEAR MODALS ──────────────────────────────────────────
function openClearModal(type) {
  const isRooms = type === "rooms";
  document.getElementById("clear-modal-title").textContent =
    `⚠️ Clear All ${isRooms ? "Rooms" : "Reservations"}?`;
  document.getElementById("clear-modal-msg").textContent = isRooms
    ? "This will permanently delete ALL rooms and ALL reservations."
    : "This will permanently delete ALL reservations.";
  document.getElementById("clear-modal-sub").textContent = isRooms
    ? `${rooms.length} rooms and ${bookings.length} reservations will be deleted.`
    : `${bookings.length} reservations will be deleted.`;
  const btn = document.getElementById("clear-modal-confirm");
  btn.onclick = async () => {
    try {
      if (isRooms) {
        await fetch(`${API.base}/rooms.php?all=1`, {
          method: "DELETE",
          credentials: "include",
        });
      } else {
        await fetch(`${API.base}/reservations.php?all=1`, {
          method: "DELETE",
          credentials: "include",
        });
      }
      closeModal("clear-modal");
      await loadAdminData();
      populatePubSelects();
      populateFacSelects();
      toast(
        isRooms
          ? "All rooms and reservations cleared."
          : "All reservations cleared.",
      );
    } catch (e) {
      toast("⚠️ " + e.message);
    }
  };
  openModal("clear-modal");
}

// ── VACANT MODAL ──────────────────────────────────────────
function showVacantModal() {
  const approved = new Set(
    bookings.filter((b) => b.status === "approved").map((b) => b.room),
  );
  const vacant = rooms.filter((r) => !approved.has(r.name));
  const list = document.getElementById("vacant-modal-list");
  if (!vacant.length) {
    list.innerHTML =
      '<p style="color:var(--t3);padding:12px">No fully vacant rooms.</p>';
    openModal("vacant-modal");
    return;
  }
  list.innerHTML =
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:4px 0">` +
    vacant
      .map(
        (r) =>
          `<div style="background:var(--s2);border:1px solid var(--border);border-radius:var(--rsm);padding:12px"><div style="font-weight:700;font-size:13px;margin-bottom:2px">${r.name}</div><div style="font-size:11px;color:var(--t3);margin-bottom:6px">${r.type} · ${r.floor}</div><span class="tag green" style="font-size:10px">Vacant</span></div>`,
      )
      .join("") +
    `</div>`;
  openModal("vacant-modal");
}

// ── CHANGE PASSWORD ───────────────────────────────────────
async function changePassword() {
  const target = document.getElementById("pw-target").value;
  const newPass = document.getElementById("pw-new").value;
  const confirm = document.getElementById("pw-confirm").value;
  showAlert("pw-err", false);
  showAlert("pw-ok", false);
  if (!newPass || newPass.length < 6) {
    document.getElementById("pw-err-msg").textContent =
      "Password must be at least 6 characters.";
    showAlert("pw-err", true);
    return;
  }
  if (newPass !== confirm) {
    document.getElementById("pw-err-msg").textContent =
      "Passwords do not match.";
    showAlert("pw-err", true);
    return;
  }
  try {
    await API.post("change_password", { target, password: newPass });
    document.getElementById("pw-new").value = "";
    document.getElementById("pw-confirm").value = "";
    showAlert("pw-ok", true);
    toast("✅ Password changed successfully.");
  } catch (e) {
    document.getElementById("pw-err-msg").textContent = e.message;
    showAlert("pw-err", true);
  }
}

// ── IMPORT ────────────────────────────────────────────────
let importRows = [];

function resetImport() {
  document.getElementById("import-step1").style.display = "";
  document.getElementById("import-step2").style.display = "none";
  document.getElementById("import-loading").style.display = "none";
  showAlert("import-err", false);
  showAlert("import-info", true);
  const fi = document.getElementById("import-file-input");
  if (fi) fi.value = "";
  importRows = [];
}

async function handleImportFile(input) {
  const file = input.files[0];
  if (!file) return;
  showAlert("import-err", false);
  document.getElementById("import-step1").style.display = "none";
  document.getElementById("import-loading").style.display = "";
  document.getElementById("import-loading-msg").textContent =
    "Uploading and reading your file...";

  try {
    const fd = new FormData();
    fd.append("file", file);
    document.getElementById("import-loading-msg").textContent =
      "AI is analyzing and mapping your schedule...";
    const res = await API.upload("import", fd);
    importRows = res.rows || [];
    showImportPreview(res.ai);
  } catch (e) {
    document.getElementById("import-loading").style.display = "none";
    document.getElementById("import-step1").style.display = "";
    document.getElementById("import-err-msg").textContent = e.message;
    showAlert("import-err", true);
  }
}

function showImportPreview(aiUsed) {
  document.getElementById("import-loading").style.display = "none";
  document.getElementById("import-step2").style.display = "";

  const valid = importRows.filter((r) => !r.flagged && !r.conflict);
  const flagged = importRows.filter((r) => r.flagged);
  const conflict = importRows.filter((r) => r.conflict);

  document.getElementById("import-preview-title").textContent =
    `Preview — ${importRows.length} entries found${aiUsed ? " (AI-processed)" : ""}`;
  document.getElementById("import-counts").textContent =
    `✅ ${valid.length} ready · ⚠️ ${flagged.length} flagged · 🔴 ${conflict.length} conflicts`;

  // Check conflicts against current bookings
  importRows.forEach((r) => {
    if (r.flagged) return;
    const c = bookings.find(
      (b) =>
        b.room === r.room &&
        b.day === r.day &&
        normalizeTime(b.time) === normalizeTime(r.time) &&
        b.status === "approved",
    );
    r.conflict = !!c;
  });

  const bd = document.getElementById("import-preview-bd");
  const roomOpts = rooms
    .map((r) => `<option value="${r.name}">${r.name}</option>`)
    .join("");
  const dayOpts = [
    "MWF",
    "TTH",
    "SAT",
    "MW",
    "MF",
    "WF",
    "M",
    "T",
    "W",
    "TH",
    "F",
  ]
    .map((d) => `<option value="${d}">${d}</option>`)
    .join("");

  bd.innerHTML = importRows
    .map((r, i) => {
      let cls = "ok",
        statusTxt = "✅ Ready";
      if (r.flagged) {
        cls = "flagged";
        statusTxt = `⚠️ ${r.flag_reason || "Needs review"}`;
      } else if (r.conflict) {
        cls = "conflict";
        statusTxt = "🔴 Conflict — will skip";
      }

      if (r.flagged) {
        const profF = `<input value="${(r.prof || "").replace(/"/g, "&quot;")}" onchange="updateImportRow(${i},'prof',this.value)" style="width:100px;font-size:10px;padding:2px 4px;border:1px solid var(--amber);border-radius:3px;background:var(--s2);color:var(--text)">`;
        const subjF = `<input value="${(r.subj || "").replace(/"/g, "&quot;")}" onchange="updateImportRow(${i},'subj',this.value)" style="width:65px;font-size:10px;padding:2px 4px;border:1px solid var(--amber);border-radius:3px;background:var(--s2);color:var(--text)">`;
        const groupF = `<input value="${(r.group || "").replace(/"/g, "&quot;")}" onchange="updateImportRow(${i},'group',this.value)" style="width:75px;font-size:10px;padding:2px 4px;border:1px solid var(--amber);border-radius:3px;background:var(--s2);color:var(--text)">`;
        const roomF = `<select onchange="updateImportRow(${i},'room',this.value)" style="font-size:10px;padding:2px 3px;border:1px solid var(--amber);border-radius:3px;background:var(--s2);color:var(--text)"><option value="${r.room || ""}">${r.room || "Select..."}</option>${roomOpts}</select>`;
        const dayF = `<select onchange="updateImportRow(${i},'day',this.value)" style="font-size:10px;padding:2px 3px;border:1px solid var(--amber);border-radius:3px;background:var(--s2);color:var(--text)"><option value="${r.day || ""}">${r.day || "Select..."}</option>${dayOpts}</select>`;
        const timeF = `<input value="${(r.time || "").replace(/"/g, "&quot;")}" onchange="updateImportRow(${i},'time',this.value)" placeholder="08:00-09:00" style="width:75px;font-size:10px;padding:2px 4px;border:1px solid var(--amber);border-radius:3px;background:var(--s2);color:var(--text)">`;
        const fixBtn = `<button onclick="validateImportRow(${i})" style="font-size:9px;padding:2px 6px;background:var(--green);color:#fff;border:none;border-radius:3px;cursor:pointer;white-space:nowrap">✓ Fix</button>`;
        return `<tr class="${cls}" id="import-row-${i}">
        <td style="font-size:10px">${i + 1}</td>
        <td>${profF}</td><td>${subjF}</td><td>${groupF}</td>
        <td>${roomF}</td><td>${dayF}</td><td>${timeF}</td>
        <td style="font-size:10px">${statusTxt}<br>${fixBtn}</td>
      </tr>`;
      }
      return `<tr class="${cls}" id="import-row-${i}">
      <td style="font-size:10px">${i + 1}</td>
      <td>${r.prof || "—"}</td><td>${r.subj || "—"}</td><td>${r.group || "—"}</td>
      <td>${r.room || "—"}</td><td>${r.day || "—"}</td><td>${r.time || "—"}</td>
      <td style="font-size:10px">${statusTxt}</td>
    </tr>`;
    })
    .join("");

  const readyCount = importRows.filter((r) => !r.flagged && !r.conflict).length;
  document.getElementById("import-confirm-btn").textContent =
    `✅ Confirm Import (${readyCount} entries)`;
}

async function confirmImport() {
  const toImport = importRows.filter((r) => !r.flagged && !r.conflict);
  if (!toImport.length) {
    toast("No valid entries to import.");
    return;
  }
  try {
    const res = await API.post("import", { rows: toImport });
    closeModal("import-modal");
    // Reload all data and re-render every view
    await loadAdminData();
    await loadData(); // also refresh public/faculty data
    renderAdminSched();
    renderAdminGrid();
    renderPubSched();
    renderVacantGrid();
    if (
      document.getElementById("screen-faculty").classList.contains("active")
    ) {
      renderFacSched();
      renderFacGrid();
    }
    toast(
      `✅ Imported ${res.inserted} entries.${res.skipped > 0 ? ` ${res.skipped} skipped.` : ""}`,
    );
    resetImport();
  } catch (e) {
    toast("⚠️ Import failed: " + e.message);
  }
}

// Quick add room from import preview
async function quickAddRoom(roomName, rowIdx) {
  if (!roomName) return;
  try {
    await API.post("rooms", {
      name: roomName,
      type: "Lecture Room",
      cap: 40,
      floor: "Ground Floor",
    });
    await loadAdminData();
    // Mark row as no longer flagged
    if (importRows[rowIdx]) {
      importRows[rowIdx].flagged = false;
      importRows[rowIdx].flag_reason = "";
    }
    showImportPreview(false);
    toast(`✅ Room "${roomName}" added.`);
  } catch (e) {
    toast(`⚠️ Could not add room: ${e.message}`);
  }
}

// Update import row field inline
function updateImportRow(idx, field, value) {
  if (importRows[idx]) importRows[idx][field] = value.trim();
}

// Validate and unflag a fixed row
function validateImportRow(idx) {
  const r = importRows[idx];
  if (!r) return;
  const missing = [];
  if (!r.prof) missing.push("Faculty");
  if (!r.subj) missing.push("Course Code");
  if (!r.room) missing.push("Room");
  if (!r.day) missing.push("Day");
  if (!r.time) missing.push("Time");
  if (missing.length) {
    toast(`⚠️ Row ${idx + 1} still missing: ${missing.join(", ")}`);
    return;
  }
  // Check conflict
  const c = bookings.find(
    (b) =>
      b.room === r.room &&
      b.day === r.day &&
      b.time === r.time &&
      b.status === "approved",
  );
  if (c) {
    r.flagged = true;
    r.flag_reason = "Conflict with existing booking";
    r.conflict = true;
  } else {
    r.flagged = false;
    r.flag_reason = "";
    r.conflict = false;
  }
  showImportPreview(false);
  toast(
    r.flagged
      ? `⚠️ Row ${idx + 1} has a conflict.`
      : `✅ Row ${idx + 1} is ready to import.`,
  );
}

// Drag and drop for import
const dropZone = document.getElementById("import-drop");
if (dropZone) {
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--green)";
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "";
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file) {
      const fi = document.getElementById("import-file-input");
      fi.files = e.dataTransfer.files;
      handleImportFile(fi);
    }
  });
}

// ── EXPORT ────────────────────────────────────────────────
let exportType = "rooms";
function initExport() {
  setExportType("rooms", document.querySelector('[data-export="rooms"]'));
  const sel = document.getElementById("export-room-select");
  if (sel)
    sel.innerHTML =
      '<option value="">Choose a room...</option>' +
      rooms.map((r) => `<option>${r.name}</option>`).join("");
}
function setExportType(type, btn) {
  exportType = type;
  document
    .querySelectorAll("[data-export]")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("export-room-picker").style.display =
    type === "room-sched" ? "block" : "none";
  if (type !== "room-sched") renderExportPreview();
}
function renderExportPreview() {
  const wrap = document.getElementById("export-preview");
  if (exportType === "rooms") {
    wrap.innerHTML =
      `<table><thead><tr><th>Room Name</th><th>Type</th><th>Capacity</th><th>Location</th><th>Status</th></tr></thead><tbody>` +
      rooms
        .slice(0, 10)
        .map((r) => {
          const hasB = bookings.some(
            (b) => b.room === r.name && b.status === "approved",
          );
          return `<tr><td>${r.name}</td><td>${r.type}</td><td>${r.cap}</td><td>${r.floor}</td><td>${hasB ? "Has Reservations" : "Vacant"}</td></tr>`;
        })
        .join("") +
      `</tbody></table>` +
      (rooms.length > 10
        ? `<p style="color:var(--t3);font-size:11px;padding:8px 0">... and ${rooms.length - 10} more rows</p>`
        : "");
  } else if (exportType === "all") {
    const approved = bookings.filter((b) => b.status === "approved");
    wrap.innerHTML =
      `<table><thead><tr><th>Faculty</th><th>Course</th><th>Group</th><th>Room</th><th>Day</th><th>Time</th></tr></thead><tbody>` +
      approved
        .slice(0, 10)
        .map(
          (b) =>
            `<tr><td>${b.prof}</td><td>${b.subj}</td><td>${b.group || "—"}</td><td>${b.room}</td><td>${b.day}</td><td>${b.time}</td></tr>`,
        )
        .join("") +
      `</tbody></table>` +
      (approved.length > 10
        ? `<p style="color:var(--t3);font-size:11px;padding:8px 0">... and ${approved.length - 10} more rows</p>`
        : "");
  } else if (exportType === "room-sched") {
    const room = document.getElementById("export-room-select").value;
    if (!room) {
      wrap.innerHTML =
        '<p style="color:var(--t3);font-size:12px">Select a room to preview.</p>';
      return;
    }
    const rows = bookings.filter(
      (b) => b.room === room && b.status === "approved",
    );
    if (!rows.length) {
      wrap.innerHTML = `<p style="color:var(--t3);font-size:12px">No approved reservations for ${room}.</p>`;
      return;
    }
    wrap.innerHTML =
      `<table><thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Faculty</th><th>Group</th></tr></thead><tbody>` +
      rows
        .map(
          (b) =>
            `<tr><td>${b.day}</td><td>${b.time}</td><td>${b.subj}</td><td>${b.prof}</td><td>${b.group || "—"}</td></tr>`,
        )
        .join("") +
      `</tbody></table>`;
  }
}
function doExport(fmt) {
  let rows = [],
    headers = [],
    filename = "";
  if (exportType === "rooms") {
    headers = ["Room Name", "Type", "Capacity", "Location", "Status"];
    rows = rooms.map((r) => {
      const hasB = bookings.some(
        (b) => b.room === r.name && b.status === "approved",
      );
      return [
        r.name,
        r.type,
        r.cap,
        r.floor,
        hasB ? "Has Reservations" : "Vacant",
      ];
    });
    filename = "ACROSS_CBEA_Rooms";
  } else if (exportType === "all") {
    headers = [
      "Faculty",
      "Course Code",
      "Group",
      "Room",
      "Day",
      "Time",
      "Status",
      "Action Date",
    ];
    rows = bookings
      .filter((b) => b.status === "approved")
      .map((b) => [
        b.prof,
        b.subj,
        b.group || "",
        b.room,
        b.day,
        b.time,
        b.status,
        fmtDate(b.actionAt),
      ]);
    filename = "ACROSS_CBEA_All_Reservations";
  } else if (exportType === "room-sched") {
    const room = document.getElementById("export-room-select").value;
    if (!room) {
      toast("Please select a room first.");
      return;
    }
    headers = ["Day", "Time", "Course Code", "Faculty", "Group"];
    rows = bookings
      .filter((b) => b.room === room && b.status === "approved")
      .map((b) => [b.day, b.time, b.subj, b.prof, b.group || ""]);
    filename = `ACROSS_CBEA_${room.replace(/\s+/g, "_")}`;
  }
  if (fmt === "csv") {
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename + ".csv";
    a.click();
    toast("CSV exported.");
  } else {
    const table =
      "<table><tr>" +
      headers.map((h) => `<th>${h}</th>`).join("") +
      "</tr>" +
      rows
        .map((r) => "<tr>" + r.map((v) => `<td>${v}</td>`).join("") + "</tr>")
        .join("") +
      "</table>";
    const html = `<html><head><meta charset="UTF-8"><style>th{background:#F47920;color:#fff;padding:6px 10px;font-size:12px}td{padding:5px 10px;font-size:12px;border:1px solid #ccc}tr:nth-child(even)td{background:#f5f5f5}</style></head><body>${table}</body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename + ".xls";
    a.click();
    toast("Excel file exported.");
  }
}

// ── MODAL ─────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}
document.querySelectorAll(".modal-ov").forEach((ov) =>
  ov.addEventListener("click", (e) => {
    if (e.target === ov) ov.classList.remove("open");
  }),
);

// ── TOAST ─────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

// ── BACK TO TOP ───────────────────────────────────────────
function getScrollEl() {
  const a = document.getElementById("screen-admin");
  if (a && a.classList.contains("active"))
    return document.querySelector(".admin-main");
  return null;
}
function backToTop() {
  const el = getScrollEl();
  if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
function checkScrollPos() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;
  const el = getScrollEl();
  const s = el
    ? el.scrollTop
    : window.scrollY || document.documentElement.scrollTop;
  btn.classList.toggle("show", s > 300);
}
window.addEventListener("scroll", checkScrollPos, { passive: true });
setTimeout(() => {
  const am = document.querySelector(".admin-main");
  if (am) am.addEventListener("scroll", checkScrollPos, { passive: true });
}, 500);

// ── INIT ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  showAlert("import-info", true);
});

// Periodically refresh room/reservation data so the hero card
// and vacant rooms stay live without requiring a manual reload.
const HERO_REFRESH_MS = 60000; // 1 minute
setInterval(async () => {
  const landing = document.getElementById("screen-landing");
  if (!landing || !landing.classList.contains("active")) return;
  try {
    const [r, b] = await Promise.all([
      API.get("rooms"),
      API.get("reservations", "status=all"),
    ]);
    rooms = r.filter((rm) => !RESTRICTED_ROOMS.has(rm.name));
    bookings = b;
    renderHeroLiveSchedule();
    if (document.getElementById("vacant-section")?.classList.contains("open")) {
      renderVacantGrid();
    }
  } catch (e) {
    console.error("Background refresh failed:", e);
  }
}, HERO_REFRESH_MS);
