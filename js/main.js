/* ACROSS CBEA – main.js */
/* Academic ClassRoom Occupancy Scheduling System, CBEA MMSU */
/* ── API Integration Layer ── */
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
};

async function loadData() {
  try {
    const [r, b] = await Promise.all([
      API.get("rooms"),
      API.get("reservations", "status=all"),
    ]);
    rooms = r;
    bookings = b.map((x) => ({ ...x, time: x.time })); // time_slot aliased as time in API
  } catch (e) {
    console.error("loadData error:", e);
    toast("⚠️ Could not load data from server. Using demo mode.");
  }
  populatePubSelects();
  renderPubSched();
  renderVacantGrid();
}

const TIMES = [
  "7:00–8:00 AM",
  "8:00–9:00 AM",
  "9:00–10:00 AM",
  "10:00–11:00 AM",
  "11:00 AM–12:00 PM",
  "12:00–1:00 PM",
  "1:00–2:00 PM",
  "2:00–3:00 PM",
  "3:00–4:00 PM",
  "4:00–5:00 PM",
  "5:00–6:00 PM",
  "6:00–7:00 PM",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
let selectedSlot = { day: null, time: null };
let destSelectedSlot = { day: null, time: null };

// ── UTILS ──
const isDark = () =>
  document.documentElement.getAttribute("data-theme") === "dark";
const palette = () => (isDark() ? PALETTE_D : PALETTE_L);
const getColor = (i) => {
  const p = palette();
  return p[i % p.length];
};
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

// ── THEME ──
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
    if (ap && ap.id === "apg-schedule") renderAdminSched();
  }
  if (document.getElementById("pub-room").value) renderRoomMiniCal();
}

// ── SCREENS ──
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
}
function smoothScrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function scrollTo(id) {
  smoothScrollTo(id);
}

// ── TOOLTIP ──
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

// ── SCHEDULE BUILDER ──
const MAX_VISIBLE = 4;

function buildChip(b, colorIdx) {
  const c = getColor(colorIdx);
  const chip = document.createElement("div");
  chip.className = "slot-chip" + (b.status === "pending" ? " pending" : "");
  chip.style.cssText = `background:${c.bg};border-left-color:${c.border};color:${c.text}`;
  chip.innerHTML = `<div class="chip-s">${b.subj}</div><div class="chip-r">${b.room}</div>`;
  chip.addEventListener("mouseenter", (e) => showTip(e, b));
  chip.addEventListener("mouseleave", hideTip);
  return chip;
}
function buildSchedTable(headEl, bodyEl, roomFilter) {
  headEl.innerHTML =
    `<th class="time-th">Time</th>` + DAYS.map((d) => `<th>${d}</th>`).join("");
  bodyEl.innerHTML = "";
  TIMES.forEach((t) => {
    const tr = document.createElement("tr");
    const tc = document.createElement("td");
    tc.className = "time-col";
    tc.textContent = t;
    tr.appendChild(tc);
    DAYS.forEach((d) => {
      const bks = bookings.filter(
        (b) =>
          b.time === t &&
          b.day === d &&
          (!roomFilter || b.room === roomFilter) &&
          b.status !== "rejected",
      );
      const td = document.createElement("td");
      td.className = "day-cell";
      const inner = document.createElement("div");
      inner.className = "cell-inner";
      const visible = bks.slice(0, MAX_VISIBLE);
      const overflow = bks.slice(MAX_VISIBLE);
      visible.forEach((b, i) => inner.appendChild(buildChip(b, i)));
      if (overflow.length > 0) {
        const more = document.createElement("div");
        more.className = "slot-more";
        more.textContent = `+${overflow.length}`;
        more.title = `${overflow.length} more — click to view all`;
        more.addEventListener("click", (e) => {
          e.stopPropagation();
          openSlotPopup(bks, t, d, e);
        });
        inner.appendChild(more);
      }
      td.appendChild(inner);
      tr.appendChild(td);
    });
    bodyEl.appendChild(tr);
  });
}

// ── PUBLIC SCHEDULE ──
function renderPubSched() {
  buildSchedTable(
    document.getElementById("pub-sched-hd"),
    document.getElementById("pub-sched-bd"),
    document.getElementById("pub-room-f").value,
  );
}

// ── VACANT ──
let vacantTypeFilter = "";
let vacantAvailFilter = "all";
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
  // Populate floor dropdown
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
          const clickable = !hasB;
          return `<div class="v-room" style="${clickable ? "cursor:pointer" : ""}"
      ${clickable ? `onclick="_doSelectVacantRoom('${r.name.replace(/'/g, "\\'")}')"` : ""}
      ${clickable ? `onmouseover="this.style.borderColor='var(--green)';this.style.background='var(--gl)'" onmouseout="this.style.borderColor='';this.style.background=''"` : ""}
      title="${clickable ? "Click to request this room" : ""}">
      <div class="v-room-name">${r.name}</div>
      <div class="v-room-type">${r.type} · Cap. ${r.cap}</div>
      <div style="font-size:11px;color:var(--t3);margin-bottom:8px">${r.floor}</div>
      <span class="v-badge" style="${hasB ? "background:var(--al);color:var(--amber)" : ""}">
        ${hasB ? "Has Reservations" : clickable ? "Vacant — click to request" : "Vacant"}
      </span>
    </div>`;
        })
        .join("")
    : `<p style="color:var(--t3);font-size:13px;padding:8px 0;grid-column:1/-1">No rooms match your filters.</p>`;
}
function toggleVacant(btn) {
  const s = document.getElementById("vacant-section");
  const open = s.classList.toggle("open");
  btn.innerHTML = `<span class="dot"></span> ${open ? "Hide" : "Show"} Vacant Rooms`;
  if (open) renderVacantGrid();
}

// ── PUBLIC SELECTS ──
function populatePubSelects() {
  const rOpts =
    '<option value="">Select a room</option>' +
    rooms.map((r) => `<option>${r.name}</option>`).join("");
  const rOptsFrom =
    '<option value="">Select current room</option>' +
    rooms.map((r) => `<option>${r.name}</option>`).join("");
  const rOptsTo =
    '<option value="">Select destination room</option>' +
    rooms.map((r) => `<option>${r.name}</option>`).join("");
  const pr = document.getElementById("pub-room");
  if (pr) pr.innerHTML = rOpts;
  const pf = document.getElementById("pub-room-f");
  if (pf)
    pf.innerHTML =
      '<option value="">All Rooms</option>' +
      rooms.map((r) => `<option>${r.name}</option>`).join("");
  const fr = document.getElementById("pub-from-room");
  if (fr) fr.innerHTML = rOptsFrom;
  const tr = document.getElementById("pub-to-room");
  if (tr) tr.innerHTML = rOptsTo;
}

// ── REQUEST FORM STATE ──
let newSlot = { day: null, time: null }; // new schedule mode
let fromSlot = { day: null, time: null }; // change: from slot
let toSlot = { day: null, time: null }; // change: to slot
let pickerMode = null; // 'new'|'from'|'to'
let pickerRoom = null;

function onReqTypeChange() {
  const reqtype = document.getElementById("pub-reqtype").value;
  document.getElementById("new-sched-zone").style.display =
    reqtype === "new" ? "" : "none";
  document.getElementById("change-sched-zone").style.display =
    reqtype === "change" ? "" : "none";
  document.getElementById("spacer-fg").style.display = "none";
  resetRequestState();
}

function resetRequestState() {
  newSlot = { day: null, time: null };
  fromSlot = { day: null, time: null };
  toSlot = { day: null, time: null };
  document.getElementById("pub-day").value = "";
  document.getElementById("pub-time").value = "";
  hideSlotDisplay("new-slot-display");
  hideSlotDisplay("from-slot-display");
  hideSlotDisplay("to-slot-display");
  const cs = document.getElementById("change-summary");
  if (cs) cs.classList.remove("show");
  showAlert("pub-conflict", false);
  showAlert("pub-warn", false);
  showAlert("pub-room-info", true);
}

function hideSlotDisplay(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function showSlotDisplay(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = "flex";
    el.querySelector("span:nth-child(2)").textContent = text;
  }
}

// ── NEW SCHEDULE ROOM CHANGE ──
function onNewRoomChange() {
  const room = document.getElementById("pub-room").value;
  newSlot = { day: null, time: null };
  document.getElementById("pub-day").value = "";
  document.getElementById("pub-time").value = "";
  hideSlotDisplay("new-slot-display");
  showAlert("pub-room-info", false);
  showAlert("pub-conflict", false);
  showAlert("pub-warn", false);
  if (room) {
    openPickerModal(room, "new");
  } else {
    showAlert("pub-room-info", true);
  }
}

function clearNewSlot() {
  newSlot = { day: null, time: null };
  document.getElementById("pub-day").value = "";
  document.getElementById("pub-time").value = "";
  hideSlotDisplay("new-slot-display");
}

// ── CHANGE SCHEDULE FROM/TO ──
function onFromRoomChange() {
  const room = document.getElementById("pub-from-room").value;
  fromSlot = { day: null, time: null };
  hideSlotDisplay("from-slot-display");
  document.getElementById("from-room-hint").textContent = room
    ? "Loading schedule..."
    : "Select a room to view its schedule";
  showAlert("pub-conflict", false);
  showAlert("pub-warn", false);
  if (room) {
    openPickerModal(room, "from");
  }
  updateChangeSummaryNew();
}
function onToRoomChange() {
  const room = document.getElementById("pub-to-room").value;
  toSlot = { day: null, time: null };
  hideSlotDisplay("to-slot-display");
  document.getElementById("to-room-hint").textContent = room
    ? "Loading schedule..."
    : "Select a room to view its schedule";
  showAlert("pub-conflict", false);
  showAlert("pub-warn", false);
  if (room) {
    openPickerModal(room, "to");
  }
  updateChangeSummaryNew();
}
function clearFromSlot() {
  fromSlot = { day: null, time: null };
  hideSlotDisplay("from-slot-display");
  document.getElementById("from-room-hint").textContent =
    "Click the room dropdown to reopen the schedule";
  updateChangeSummaryNew();
}
function clearToSlot() {
  toSlot = { day: null, time: null };
  document.getElementById("pub-day").value = "";
  document.getElementById("pub-time").value = "";
  hideSlotDisplay("to-slot-display");
  document.getElementById("to-room-hint").textContent =
    "Click the room dropdown to reopen the schedule";
  updateChangeSummaryNew();
}

function updateChangeSummaryNew() {
  const cs = document.getElementById("change-summary");
  if (!cs) return;
  const fromRoom = document.getElementById("pub-from-room")?.value || "";
  const toRoom = document.getElementById("pub-to-room")?.value || "";
  if ((fromRoom && fromSlot.day) || (toRoom && toSlot.day)) {
    cs.classList.add("show");
    document.getElementById("cs-from").textContent =
      fromRoom && fromSlot.day
        ? `${fromRoom} · ${fromSlot.day} · ${fromSlot.time}`
        : "Not yet selected";
    document.getElementById("cs-to").textContent =
      toRoom && toSlot.day
        ? `${toRoom} · ${toSlot.day} · ${toSlot.time}`
        : "Not yet selected";
  } else {
    cs.classList.remove("show");
  }
}

// ── PICKER MODAL ──
function openPickerModal(room, mode) {
  pickerMode = mode;
  pickerRoom = room;
  const isChange = mode === "from" || mode === "to";
  const isFrom = mode === "from";
  document.getElementById("sched-picker-title").textContent =
    `${room} — ${mode === "new" ? "Select a Time Slot" : isFrom ? "Select Your Current Slot" : "Select Your New Slot"}`;
  document.getElementById("sched-picker-sub").textContent =
    mode === "new"
      ? "Click any vacant slot to book it."
      : isFrom
        ? "Click your existing reserved slot (amber = your bookings)."
        : "Click a vacant slot as your new time.";
  buildPickerTable(room, mode);
  openModal("sched-picker-modal");
}

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
      // All approved bookings for this room/day/time
      const roomBks = bookings.filter(
        (b) =>
          b.room === room &&
          b.day === d &&
          b.time === t &&
          b.status === "approved",
      );
      const td = document.createElement("td");
      td.style.cssText = "padding:2px;vertical-align:top;height:44px";
      if (roomBks.length > 0) {
        // Show chip(s) like the weekly schedule
        const inner = document.createElement("div");
        inner.style.cssText =
          "display:flex;flex-direction:column;gap:2px;height:100%";
        const visible = roomBks.slice(0, MAX_VISIBLE);
        visible.forEach((bk, i) => {
          const c = getColor(i);
          const chip = document.createElement("div");
          chip.style.cssText = `background:${c.bg};border-left:2px solid ${c.border};color:${c.text};border-radius:4px;padding:2px 5px;font-size:9px;line-height:1.3;flex:1;min-height:0;overflow:hidden`;
          chip.innerHTML = `<div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${bk.subj}</div><div style="opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${bk.group || bk.prof}</div>`;
          chip.addEventListener("mouseenter", (e) => showTip(e, bk));
          chip.addEventListener("mouseleave", hideTip);
          if (mode === "from") {
            // Clickable — user picks which booking to change
            const isSel = fromSlot.day === d && fromSlot.time === t;
            chip.style.cursor = "pointer";
            chip.style.outline = isSel ? `2px solid ${c.border}` : "none";
            chip.style.boxShadow = isSel ? `0 0 0 2px ${c.border}` : "";
            if (isSel) {
              const tick = document.createElement("div");
              tick.style.cssText =
                "font-size:8px;font-weight:700;margin-top:1px";
              tick.textContent = "✓ Selected";
              chip.appendChild(tick);
            }
            chip.addEventListener("click", () => {
              fromSlot = { day: d, time: t };
              closeModal("sched-picker-modal");
              const fromRoom = document.getElementById("pub-from-room").value;
              showSlotDisplay("from-slot-display", `${fromRoom} · ${d} · ${t}`);
              document.getElementById("from-room-hint").textContent =
                "Slot selected. Reselect room dropdown to change.";
              updateChangeSummaryNew();
            });
          }
          // mode==='to' or 'new': chips are read-only (slot is taken)
          inner.appendChild(chip);
        });
        if (roomBks.length > MAX_VISIBLE) {
          const more = document.createElement("div");
          more.style.cssText =
            "font-size:8px;color:var(--t3);text-align:center;padding-top:1px";
          more.textContent = `+${roomBks.length - MAX_VISIBLE}`;
          inner.appendChild(more);
        }
        td.appendChild(inner);
      } else {
        // Vacant slot — empty cell, clickable only for 'new' and 'to' modes
        if (mode === "new" || mode === "to") {
          const isSel =
            (mode === "new" && newSlot.day === d && newSlot.time === t) ||
            (mode === "to" && toSlot.day === d && toSlot.time === t);
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
              newSlot = { day: d, time: t };
              document.getElementById("pub-day").value = d;
              document.getElementById("pub-time").value = t;
              closeModal("sched-picker-modal");
              showSlotDisplay(
                "new-slot-display",
                `${document.getElementById("pub-room").value} · ${d} · ${t}`,
              );
              showAlert("pub-room-info", false);
            } else {
              toSlot = { day: d, time: t };
              document.getElementById("pub-day").value = d;
              document.getElementById("pub-time").value = t;
              closeModal("sched-picker-modal");
              showSlotDisplay(
                "to-slot-display",
                `${document.getElementById("pub-to-room").value} · ${d} · ${t}`,
              );
              document.getElementById("to-room-hint").textContent =
                "Slot selected. Reselect room dropdown to change.";
              updateChangeSummaryNew();
            }
            showAlert("pub-conflict", false);
            showAlert("pub-warn", false);
            // Rebuild table to update selected highlight
            buildPickerTable(room, mode);
          });
        }
        // 'from' mode + vacant: just empty, no interaction
      }
      tr.appendChild(td);
    });
    bd.appendChild(tr);
  });
}

// ── PUBLIC SUBMIT ──
async function submitPubRequest() {
  const name = document.getElementById("pub-name").value.trim();
  const subj = document.getElementById("pub-subj").value.trim();
  const group = document.getElementById("pub-group").value.trim();
  const email = document.getElementById("pub-email").value.trim();
  const reqtype = document.getElementById("pub-reqtype").value;
  const notes = document.getElementById("pub-notes").value.trim();
  let hasErr = false;
  ["pub-name", "pub-subj", "pub-group"].forEach(clearErr);
  showAlert("pub-conflict", false);
  showAlert("pub-warn", false);
  if (!name) {
    setErr("pub-name");
    hasErr = true;
  }
  if (!subj) {
    setErr("pub-subj");
    hasErr = true;
  }
  if (!group) {
    setErr("pub-group");
    hasErr = true;
  }

  let targetRoom,
    day,
    time,
    fromInfo = "";
  if (reqtype === "new") {
    targetRoom = document.getElementById("pub-room").value;
    day = newSlot.day;
    time = newSlot.time;
    if (!targetRoom) {
      document.getElementById("pub-warn-msg").textContent =
        "Please select a room.";
      showAlert("pub-warn", true);
      hasErr = true;
    }
    if (!day || !time) {
      document.getElementById("pub-warn-msg").textContent =
        "Please select a time slot by opening the room schedule.";
      showAlert("pub-warn", true);
      hasErr = true;
    }
  } else {
    const fromRoom = document.getElementById("pub-from-room").value;
    const toRoom = document.getElementById("pub-to-room").value;
    targetRoom = toRoom || fromRoom;
    day = toSlot.day || fromSlot.day;
    time = toSlot.time || fromSlot.time;
    if (!fromRoom || !fromSlot.day) {
      document.getElementById("pub-warn-msg").textContent =
        "Please select your current room and slot (From).";
      showAlert("pub-warn", true);
      hasErr = true;
    }
    if (!toRoom || !toSlot.day) {
      document.getElementById("pub-warn-msg").textContent =
        "Please select your destination room and new slot (To).";
      showAlert("pub-warn", true);
      hasErr = true;
    }
    if (fromRoom && fromSlot.day && toRoom && toSlot.day) {
      fromInfo = `
[Change request — from: ${fromRoom} · ${fromSlot.day} · ${fromSlot.time} → to: ${toRoom} · ${toSlot.day} · ${toSlot.time}]`;
      targetRoom = toRoom;
      day = toSlot.day;
      time = toSlot.time;
    }
  }
  if (hasErr) return;

  const conflict = bookings.find(
    (b) =>
      b.room === targetRoom &&
      b.day === day &&
      b.time === time &&
      b.status === "approved",
  );
  if (conflict) {
    document.getElementById("pub-conflict-msg").textContent =
      `${targetRoom} is already reserved on ${day} at ${time}. Please choose a different slot.`;
    showAlert("pub-conflict", true);
    return;
  }
  try {
    await API.post("requests", {
      prof: name,
      subj,
      group,
      email,
      room: targetRoom,
      day,
      time,
      notes: notes + fromInfo,
    });
  } catch (e) {
    if (!e.message.includes("Conflict")) {
      /* silent — still show locally */
    } else {
      document.getElementById("pub-conflict-msg").textContent = e.message;
      showAlert("pub-conflict", true);
      return;
    }
  }
  bookings.push({
    id: Date.now(),
    prof: name,
    subj,
    group,
    email,
    room: targetRoom,
    day,
    time,
    notes: notes + fromInfo,
    status: "pending",
    actionAt: null,
  });
  ["pub-name", "pub-subj", "pub-group", "pub-notes"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("pub-email").value = "";
  document.getElementById("pub-room").selectedIndex = 0;
  document.getElementById("pub-reqtype").selectedIndex = 0;
  const fr = document.getElementById("pub-from-room");
  if (fr) fr.selectedIndex = 0;
  const tr = document.getElementById("pub-to-room");
  if (tr) tr.selectedIndex = 0;
  document.getElementById("pub-day").value = "";
  document.getElementById("pub-time").value = "";
  newSlot = { day: null, time: null };
  fromSlot = { day: null, time: null };
  toSlot = { day: null, time: null };
  hideSlotDisplay("new-slot-display");
  hideSlotDisplay("from-slot-display");
  hideSlotDisplay("to-slot-display");
  document.getElementById("new-sched-zone").style.display = "";
  document.getElementById("change-sched-zone").style.display = "none";
  document.getElementById("change-summary").classList.remove("show");
  showAlert("pub-room-info", true);
  updateBadge();
  toast("✅ Request submitted. The scheduling head will review it.");
}

// ── LOGIN ──
async function doLogin() {
  const u = document.getElementById("l-user").value.trim();
  const p = document.getElementById("l-pass").value;
  try {
    await API.post("login", { username: u, password: p });
    showAlert("l-err", false);
    await loadAdminData();
    goScreen("admin");
  } catch (e) {
    showAlert("l-err", true);
  }
}
async function loadAdminData() {
  try {
    const [r, b] = await Promise.all([
      API.get("rooms"),
      API.get("reservations", "status=all"),
    ]);
    rooms = r;
    bookings = b;
    populateAdminSelects();
    renderDashboard();
    renderAdminSched();
    renderRoomsTbl();
    renderBookingsTbl();
    renderReqTbl();
    updateBadge();
  } catch (e) {
    console.error("loadAdminData", e);
  }
}

// ── ADMIN INIT ──
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
  if (id === "schedule") renderAdminSched();
  if (id === "rooms") renderRoomsTbl();
  if (id === "reservations") renderBookingsTbl();
  if (id === "requests") renderReqTbl();
  if (id === "dashboard") renderDashboard();
}
function populateAdminSelects() {
  const rNames = rooms.map((r) => r.name);
  document.getElementById("a-room-f").innerHTML =
    '<option value="">All Rooms</option>' +
    rNames.map((n) => `<option>${n}</option>`).join("");
  document.getElementById("bk-room").innerHTML =
    '<option value="">Select room</option>' +
    rNames.map((n) => `<option>${n}</option>`).join("");
  document.getElementById("bk-time").innerHTML =
    '<option value="">Select time</option>' +
    TIMES.map((t) => `<option>${t}</option>`).join("");
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
  document.getElementById("ds-rooms").textContent = rooms.length;
  document.getElementById("ds-approved").textContent = approved.length;
  document.getElementById("ds-pending").textContent = pending.length;
  document.getElementById("ds-vacant").textContent = vacant;
  document.getElementById("dash-pending").innerHTML = pending.length
    ? pending
        .map(
          (b) =>
            `<tr><td>${b.prof}</td><td>${b.subj}</td><td>${b.room}</td><td>${b.day} · ${b.time}</td><td><span class="tag amber">pending</span></td><td><div class="acts"><button class="btn-a ok" onclick="approveB(${b.id})">Approve</button><button class="btn-a rej" onclick="rejectB(${b.id})">Reject</button></div></td></tr>`,
        )
        .join("")
    : `<tr><td colspan="6" class="empty">No pending requests.</td></tr>`;
}
function renderAdminSched() {
  buildSchedTable(
    document.getElementById("a-sched-hd"),
    document.getElementById("a-sched-bd"),
    document.getElementById("a-room-f").value,
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
// ── SLOT OVERFLOW POPUP ──
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
      const statusColor =
        b.status === "approved"
          ? "var(--green)"
          : b.status === "pending"
            ? "var(--amber)"
            : "var(--red)";
      const statusBg =
        b.status === "approved"
          ? "var(--gl)"
          : b.status === "pending"
            ? "var(--al)"
            : "var(--rl)";
      return `<div class="slot-popup-item">
      <div class="slot-popup-dot" style="background:${c.border}"></div>
      <div class="slot-popup-info">
        <div class="pi-subj">${b.subj}</div>
        <div class="pi-meta">${b.prof} · ${b.room}</div>
        <div class="pi-group">${b.group || "—"}</div>
        <span class="slot-popup-badge" style="background:${statusBg};color:${statusColor}">${b.status}</span>
      </div>
    </div>`;
    })
    .join("");
  // Position popup near the click
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
  const popup = document.getElementById("slot-popup");
  if (slotPopupOpen && !popup.contains(e.target)) closeSlotPopup();
});

// ── REQUESTS SEARCH ──
function clearReqSearch() {
  const el = document.getElementById("req-search");
  if (el) el.value = "";
  renderReqTbl();
}
function renderReqTbl() {
  const searchEl = document.getElementById("req-search");
  const q = (searchEl ? searchEl.value : "").toLowerCase().trim();
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
  // Highlight match
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
    <td>${
      b.notes
        ? `<button class="btn-a view-notes" onclick="viewNotes(${b.id})" style="font-size:11px">View Notes</button>`
        : `<span title="No notes were added for this request." style="font-size:11px;color:var(--t3);cursor:default;padding:5px 0;display:inline-block">No Notes</span>`
    }</td>
    <td><span class="tag ${b.status === "approved" ? "green" : b.status === "pending" ? "amber" : "red"}">${b.status}</span></td>
    <td style="font-size:11px;color:var(--t3)">${fmtDate(b.actionAt)}</td>
    <td><div class="acts">${
      b.status === "pending"
        ? `<button class="btn-a ok" onclick="approveB(${b.id})">Approve</button><button class="btn-a rej" onclick="rejectB(${b.id})">Reject</button>`
        : ""
    }</div></td>
  </tr>`,
        )
        .join("")
    : `<tr><td colspan="9" class="empty">No results${q ? ` for "${q}"` : ""}.</td></tr>`;
}
function viewNotes(id) {
  const b = bookings.find((x) => x.id === id);
  if (!b) return;
  const content = document.getElementById("notes-view-content");
  if (b.notes) {
    content.className = "notes-view";
    content.textContent = b.notes;
  } else {
    content.className = "notes-empty";
    content.innerHTML =
      "<span>📭</span><span>No notes were added for this request.</span>";
  }
  openModal("notes-modal");
}
function buildEmailBody(b, status) {
  const actionWord = status === "approved" ? "APPROVED" : "REJECTED";
  const body = `Dear ${b.prof},\n\nWe would like to inform you that your room reservation request has been ${actionWord}.\n\nREQUEST DETAILS\n───────────────────────────\nName: ${b.prof}\nSubject / Purpose: ${b.subj}\nGroup / Section / Org: ${b.group || "—"}\nRoom: ${b.room}\nDay: ${b.day}\nTime Slot: ${b.time}\nRequest Type: ${b.notes && b.notes.includes("Change request") ? "Change Existing Schedule" : "New Schedule"}\nDate of Action: ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n───────────────────────────\n${status === "approved" ? "Your reservation has been confirmed and is now reflected on the CBEA schedule. Please make sure to use the room only during your assigned time slot." : "Your request has not been approved at this time. If you have questions or would like to submit a new request, please visit the ACROSS CBEA scheduling portal."}\n\nFor concerns, please contact the CBEA Scheduling Head.\n\nRegards,\nAcademic ClassRoom Occupancy Scheduling System (ACROSS)\nCollege of Business Economics and Accountancy`;
  return body;
}
function sendEmailNotif(b, status) {
  if (!b.email) return;
  const subject = encodeURIComponent(
    `[ACROSS CBEA] Room Reservation ${status === "approved" ? "Approved ✅" : "Rejected ❌"} — ${b.subj}`,
  );
  const body = encodeURIComponent(buildEmailBody(b, status));
  window.open(`mailto:${b.email}?subject=${subject}&body=${body}`, "_blank");
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

// ── ROOM CRUD ──
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
    const payload = { name, type, cap, floor };
    if (editRoomId) {
      await API.put("rooms", {
        ...payload,
        id: editRoomId,
        oldName: oldRoom?.name || name,
      });
      toast("Room updated. All reservations updated.");
    } else {
      await API.post("rooms", payload);
      toast("Room added.");
    }
    closeModal("room-modal");
    await loadAdminData();
    populatePubSelects();
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
    toast(`"${r.name}" and its reservations deleted.`);
  } catch (e) {
    toast("⚠️ " + e.message);
  }
}

// ── BOOKING CRUD ──
function checkBkConflict() {
  const room = document.getElementById("bk-room").value;
  const day = document.getElementById("bk-day").value;
  const time = document.getElementById("bk-time").value;
  const conflictEl = document.getElementById("bk-conflict");
  if (room && day && time) {
    const c = bookings.find(
      (b) =>
        b.room === room &&
        b.day === day &&
        b.time === time &&
        b.status === "approved" &&
        b.id !== editBookingId,
    );
    conflictEl.style.display = c ? "" : "none";
    conflictEl.style.display = c ? "flex" : "none";
  } else {
    conflictEl.style.display = "none";
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

// ── MODAL ──
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

// ── TOAST ──
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

// ── BACK TO TOP ──
function getScrollEl() {
  // On admin screen, the scrollable container is .admin-main; elsewhere it's window/body
  const adminScreen = document.getElementById("screen-admin");
  if (adminScreen && adminScreen.classList.contains("active")) {
    return document.querySelector(".admin-main");
  }
  return null;
}
function backToTop() {
  const el = getScrollEl();
  if (el) {
    el.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
  }
}
function checkScrollPos() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;
  const el = getScrollEl();
  const scrolled = el
    ? el.scrollTop
    : window.scrollY || document.documentElement.scrollTop;
  btn.classList.toggle("show", scrolled > 300);
}
window.addEventListener("scroll", checkScrollPos, { passive: true });
// Also listen on admin-main scroll
setTimeout(() => {
  const am = document.querySelector(".admin-main");
  if (am) am.addEventListener("scroll", checkScrollPos, { passive: true });
}, 500);

// ── VACANT MODAL (dashboard) ──
function showVacantModal() {
  const approved = new Set(
    bookings.filter((b) => b.status === "approved").map((b) => b.room),
  );
  const vacant = rooms.filter((r) => !approved.has(r.name));
  const list = document.getElementById("vacant-modal-list");
  if (!vacant.length) {
    list.innerHTML =
      '<p style="color:var(--t3);padding:12px">No fully vacant rooms at this time.</p>';
    openModal("vacant-modal");
    return;
  }
  list.innerHTML =
    `
    <p style="font-size:12px;color:var(--t2);margin-bottom:12px">Click a room to open its schedule in the request form.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:4px 0">` +
    vacant
      .map(
        (r) => `
    <div onclick="selectVacantRoom('${r.name.replace(/'/g, "\\'")}');closeModal('vacant-modal')"
      style="background:var(--s2);border:1px solid var(--border);border-radius:var(--rsm);padding:12px;cursor:pointer;transition:all .15s"
      onmouseover="this.style.borderColor='var(--green)';this.style.background='var(--gl)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--s2)'">
      <div style="font-weight:700;font-size:13px;margin-bottom:2px">${r.name}</div>
      <div style="font-size:11px;color:var(--t3);margin-bottom:6px">${r.type} · ${r.floor}</div>
      <span class="tag green" style="font-size:10px">Vacant — click to use</span>
    </div>`,
      )
      .join("") +
    `</div>`;
  openModal("vacant-modal");
}
function selectVacantRoom(roomName) {
  // Switch to landing screen if on admin
  const onAdmin = document
    .getElementById("screen-admin")
    .classList.contains("active");
  if (onAdmin) {
    goScreen("landing");
    // Wait for screen transition then set room
    setTimeout(() => _doSelectVacantRoom(roomName), 100);
  } else {
    _doSelectVacantRoom(roomName);
  }
}
function _doSelectVacantRoom(roomName) {
  smoothScrollTo("req-anchor");
  populatePubSelects();
  // Ensure new schedule mode
  const reqtype = document.getElementById("pub-reqtype");
  if (reqtype) reqtype.value = "new";
  document.getElementById("new-sched-zone").style.display = "";
  document.getElementById("change-sched-zone").style.display = "none";
  const sel = document.getElementById("pub-room");
  if (!sel) return;
  sel.value = roomName;
  // Auto-open picker
  newSlot = { day: null, time: null };
  hideSlotDisplay("new-slot-display");
  showAlert("pub-room-info", false);
  openPickerModal(roomName, "new");
  // Highlight dropdown
  sel.style.borderColor = "var(--green)";
  sel.style.boxShadow = "0 0 0 3px rgba(244,121,32,.2)";
  setTimeout(() => {
    sel.style.borderColor = "";
    sel.style.boxShadow = "";
  }, 2000);
}

// ── CLEAR MODALS ──
function openClearModal(type) {
  const isRooms = type === "rooms";
  document.getElementById("clear-modal-title").textContent =
    `⚠️ Clear All ${isRooms ? "Rooms" : "Reservations"}?`;
  document.getElementById("clear-modal-msg").textContent = isRooms
    ? "This will permanently delete ALL rooms and ALL reservations from the system. This cannot be undone."
    : "This will permanently delete ALL reservations (approved, pending, and rejected). Rooms will remain intact.";
  document.getElementById("clear-modal-sub").textContent = isRooms
    ? `You are about to delete ${rooms.length} rooms and ${bookings.length} reservations.`
    : `You are about to delete ${bookings.length} reservations.`;
  const btn = document.getElementById("clear-modal-confirm");
  btn.onclick = () => {
    if (isRooms) {
      rooms = [];
      bookings = [];
    } else {
      bookings = [];
    }
    closeModal("clear-modal");
    populateAdminSelects();
    populatePubSelects();
    renderDashboard();
    renderRoomsTbl();
    renderBookingsTbl();
    renderAdminSched();
    renderReqTbl();
    updateBadge();
    toast(
      isRooms
        ? "All rooms and reservations cleared."
        : "All reservations cleared.",
    );
  };
  openModal("clear-modal");
}

// ── EXPORT ──
let exportType = "rooms";
function initExport() {
  setExportType("rooms", document.querySelector('[data-export="rooms"]'));
  const sel = document.getElementById("export-room-select");
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
    const rows = rooms.slice(0, 10);
    wrap.innerHTML =
      `<table><thead><tr><th>Room Name</th><th>Type</th><th>Capacity</th><th>Location</th><th>Status</th></tr></thead><tbody>` +
      rows
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
    const approved = bookings
      .filter((b) => b.status === "approved")
      .slice(0, 10);
    wrap.innerHTML =
      `<table><thead><tr><th>Name</th><th>Subject</th><th>Group</th><th>Room</th><th>Day</th><th>Time</th><th>Status</th></tr></thead><tbody>` +
      approved
        .map(
          (b) =>
            `<tr><td>${b.prof}</td><td>${b.subj}</td><td>${b.group || "—"}</td><td>${b.room}</td><td>${b.day}</td><td>${b.time}</td><td>${b.status}</td></tr>`,
        )
        .join("") +
      `</tbody></table>` +
      (bookings.filter((b) => b.status === "approved").length > 10
        ? `<p style="color:var(--t3);font-size:11px;padding:8px 0">... and ${bookings.filter((b) => b.status === "approved").length - 10} more rows</p>`
        : "");
  } else if (exportType === "room-sched") {
    const room = document.getElementById("export-room-select").value;
    if (!room) {
      wrap.innerHTML =
        '<p style="color:var(--t3);font-size:12px">Select a room to preview its schedule.</p>';
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
      `<p style="font-size:11px;font-weight:700;margin-bottom:6px;color:var(--t2)">${room} — ${rows.length} reservation${rows.length !== 1 ? "s" : ""}</p><table><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Name</th><th>Group</th></tr></thead><tbody>` +
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
      "Name",
      "Subject",
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
    headers = ["Day", "Time", "Subject", "Name", "Group"];
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
    // Simple HTML table download as .xls (opens in Excel)
    const table =
      "<table><tr>" +
      headers.map((h) => `<th>${h}</th>`).join("") +
      "</tr>" +
      rows
        .map((r) => "<tr>" + r.map((v) => `<td>${v}</td>`).join("") + "</tr>")
        .join("") +
      "</table>";
    const html = `<html><head><meta charset="UTF-8"><style>th{background:#1C5C38;color:#fff;padding:6px 10px;font-size:12px}td{padding:5px 10px;font-size:12px;border:1px solid #ccc}tr:nth-child(even)td{background:#f5f5f5}</style></head><body>${table}</body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename + ".xls";
    a.click();
    toast("Excel file exported.");
  }
}

// ── INIT ──
populatePubSelects();
renderPubSched();
renderVacantGrid();
showAlert("pub-room-info", true);
// Init zone visibility
document.getElementById("new-sched-zone").style.display = "";
document.getElementById("change-sched-zone").style.display = "none";
// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});
