/**
 * ACROSS-CBEA — Admin Dashboard JS
 * admin.js — handles all admin page interactions
 */

'use strict';

/* ── STATE ── */
let _rooms    = [];
let _bookings = [];
let _requests = [];
let _editRoomId    = null;
let _editBookingId = null;

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', async () => {
  // Sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar').classList.toggle('expanded');
  });

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => Theme.toggle());

  // Clock
  Clock.init('clock-face', 'clock-time', 'clock-date');

  // Load first page
  await loadPage('dashboard');
  hideLoader();
});

/* ── NAV ── */
async function loadPage(name) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const page = document.getElementById(`page-${name}`);
  const nav  = document.querySelector(`[data-page="${name}"]`);
  if (page) page.classList.add('active');
  if (nav)  nav.classList.add('active');

  const loaders = {
    dashboard: loadDashboard,
    schedule:  loadSchedule,
    rooms:     loadRooms,
    bookings:  loadBookings,
    requests:  loadRequests,
    settings:  loadSettings,
    log:       loadLog,
  };
  if (loaders[name]) await loaders[name]();
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════ */
async function loadDashboard() {
  const res = await API.getDashboard();
  if (!res.ok) return Toast.error(res.message);
  const d = res.data;

  // Stats
  animateCount(document.getElementById('stat-rooms'),    d.totalRooms);
  animateCount(document.getElementById('stat-approved'), d.totalApproved);
  animateCount(document.getElementById('stat-pending'),  d.totalPending);
  animateCount(document.getElementById('stat-requests'), d.totalRequests);

  // Occupancy bars
  const occEl = document.getElementById('occ-list');
  if (occEl) {
    occEl.innerHTML = d.roomOccupancy.slice(0, 6).map(r => `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <span style="font-size:12.5px;font-weight:600">${escHtml(r.name)}</span>
          <span style="font-size:11px;color:var(--text3)">${r.occupancy_pct}%</span>
        </div>
        <div class="occ-bar">
          <div class="occ-fill${r.occupancy_pct > 70 ? ' high' : ''}${r.occupancy_pct >= 100 ? ' full' : ''}"
               style="width:${r.occupancy_pct}%"></div>
        </div>
        <span style="font-size:11px;color:var(--text4)">${r.bookings_count} bookings · Cap. ${r.capacity}</span>
      </div>
    `).join('');
  }

  // Recent requests table
  const tbody = document.getElementById('dash-req-tbody');
  if (tbody) {
    if (!d.recentRequests.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">No reservation requests yet.</td></tr>`;
    } else {
      tbody.innerHTML = d.recentRequests.map(r => `
        <tr>
          <td>
            <strong>${escHtml(r.requester_name)}</strong><br>
            <span style="font-size:11px;color:var(--text3)">${escHtml(r.requester_email)}</span>
          </td>
          <td>${escHtml(r.room_name)}</td>
          <td>${fmtDate(r.request_date)}</td>
          <td>${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(r.purpose)}</td>
          <td>${badgeHtml(r.status)}</td>
          <td>
            <div class="d-flex gap-2" style="display:flex;gap:6px">
              ${r.status === 'pending' ? `
                <button class="btn btn-primary btn-sm" onclick="quickApprove(${r.id})">✓</button>
                <button class="btn btn-orange btn-sm" onclick="openRejectModal(${r.id})">✕</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');
    }
  }
  updatePendingBadge(d.totalPending);
}

/* ══════════════════════════════════════════════════════════
   SCHEDULE PAGE
══════════════════════════════════════════════════════════ */
async function loadSchedule() {
  const [schedRes, roomsRes] = await Promise.all([API.getBookings(), API.getRooms()]);
  if (!schedRes.ok) return Toast.error(schedRes.message);
  _bookings = schedRes.data;
  _rooms    = roomsRes.data || [];

  // Populate room filter
  const filter = document.getElementById('sched-room-filter');
  if (filter) {
    filter.innerHTML = '<option value="">All Rooms</option>' +
      _rooms.map(r => `<option value="${r.id}">${escHtml(r.name)}</option>`).join('');
    filter.onchange = renderSchedule;
  }
  renderSchedule();
}

function renderSchedule() {
  const filterVal = document.getElementById('sched-room-filter')?.value || '';
  const head = document.getElementById('sched-thead-row');
  const body = document.getElementById('sched-tbody');
  if (!head || !body) return;
  CalRenderer.render(head, body, _bookings, filterVal, (day, time) => {
    openBookingModal(null, day, time);
  });
}

/* ══════════════════════════════════════════════════════════
   ROOMS PAGE
══════════════════════════════════════════════════════════ */
async function loadRooms() {
  const res = await API.getRooms();
  if (!res.ok) return Toast.error(res.message);
  _rooms = res.data;
  renderRoomsGrid();
  renderRoomsTable();
}

function renderRoomsGrid() {
  const el = document.getElementById('rooms-cards');
  if (!el) return;
  el.innerHTML = _rooms.map(r => {
    const pct = Math.min(r.occupancy_pct || 0, 100);
    return `
      <div class="room-card" onclick="openRoomModal(${r.id})">
        <div class="room-card-name">${escHtml(r.name)}</div>
        <div class="room-card-type">${escHtml(r.type)} · Cap. ${r.capacity}</div>
        <div class="occ-bar"><div class="occ-fill${pct>70?' high':''}${pct>=100?' full':''}" style="width:${pct}%"></div></div>
        <span style="font-size:11px;color:var(--text3)">${pct}% occupied · ${escHtml(r.floor)}</span>
      </div>
    `;
  }).join('');
}

function renderRoomsTable() {
  const tbody = document.getElementById('rooms-tbody');
  if (!tbody) return;
  if (!_rooms.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text3)">No rooms added yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = _rooms.map(r => {
    const pct = Math.min(r.occupancy_pct || 0, 100);
    return `
      <tr>
        <td><strong>${escHtml(r.name)}</strong></td>
        <td>${escHtml(r.type)}</td>
        <td>${r.capacity} seats</td>
        <td>${escHtml(r.floor)}</td>
        <td style="min-width:130px">
          <div class="occ-bar"><div class="occ-fill${pct>70?' high':''}${pct>=100?' full':''}" style="width:${pct}%"></div></div>
          <span style="font-size:11px;color:var(--text3)">${pct}% occupied (${r.booking_count} bookings)</span>
        </td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="openRoomModal(${r.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRoom(${r.id}, '${escHtml(r.name)}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openRoomModal(id = null) {
  _editRoomId = id;
  const title = document.getElementById('room-modal-title');
  const form  = document.getElementById('room-form');
  if (!form) return;
  form.reset();
  clearFormErrors(form);

  if (id) {
    const r = _rooms.find(x => x.id === id);
    if (!r) return;
    title.textContent = 'Edit Room';
    document.getElementById('rm-name').value     = r.name;
    document.getElementById('rm-type').value     = r.type;
    document.getElementById('rm-capacity').value = r.capacity;
    document.getElementById('rm-floor').value    = r.floor;
    document.getElementById('rm-building').value = r.building || 'CBEA Building';
  } else {
    title.textContent = 'Add Room';
  }
  Modal.open('modal-room');
}

async function saveRoom() {
  const btn = document.getElementById('room-save-btn');
  const payload = {
    name:     document.getElementById('rm-name').value.trim(),
    type:     document.getElementById('rm-type').value,
    capacity: document.getElementById('rm-capacity').value,
    floor:    document.getElementById('rm-floor').value.trim(),
    building: document.getElementById('rm-building').value.trim(),
  };
  if (_editRoomId) payload.id = _editRoomId;

  setBtnLoading(btn, true);
  const res = await (_editRoomId ? API.updateRoom(payload) : API.addRoom(payload));
  setBtnLoading(btn, false);

  if (!res.ok) return Toast.error(res.message);
  Toast.success(res.message);
  Modal.close('modal-room');
  await loadRooms();
}

async function deleteRoom(id, name) {
  if (!confirmDanger(`Delete room "${name}"? All associated bookings will also be removed.`)) return;
  const res = await API.deleteRoom(id);
  if (!res.ok) return Toast.error(res.message);
  Toast.success(res.message);
  await loadRooms();
}

/* ══════════════════════════════════════════════════════════
   BOOKINGS PAGE
══════════════════════════════════════════════════════════ */
async function loadBookings() {
  const [bkRes, rmRes] = await Promise.all([API.getBookings(), API.getRooms()]);
  if (!bkRes.ok) return Toast.error(bkRes.message);
  _bookings = bkRes.data;
  _rooms    = rmRes.data || [];
  renderBookingsTable();
}

function renderBookingsTable() {
  const tbody = document.getElementById('bookings-tbody');
  if (!tbody) return;
  if (!_bookings.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text3)">No bookings added yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = _bookings.map(b => `
    <tr>
      <td>${escHtml(b.faculty)}</td>
      <td>${escHtml(b.subject)}</td>
      <td>${escHtml(b.room_name || b.room || '')}</td>
      <td>${b.day_of_week}</td>
      <td style="white-space:nowrap">${escHtml(b.time_slot)}</td>
      <td>${escHtml(b.section)}</td>
      <td>${badgeHtml(b.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="openBookingModal(${b.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteBooking(${b.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openBookingModal(id = null, preDay = '', preTime = '') {
  _editBookingId = id;
  const title = document.getElementById('booking-modal-title');
  const form  = document.getElementById('booking-form');
  if (!form) return;
  form.reset();
  clearFormErrors(form);

  // Populate room select
  const rsel = document.getElementById('bk-room');
  rsel.innerHTML = '<option value="">Select a room</option>' +
    (_rooms.length ? _rooms : []).map(r => `<option value="${r.id}">${escHtml(r.name)}</option>`).join('');

  // Populate time select
  const tsel = document.getElementById('bk-time');
  tsel.innerHTML = '<option value="">Select time slot</option>' +
    TIMES.map(t => `<option value="${t}">${t}</option>`).join('');

  if (id) {
    const b = _bookings.find(x => x.id === id);
    if (!b) return;
    title.textContent = 'Edit Booking';
    document.getElementById('bk-faculty').value = b.faculty;
    document.getElementById('bk-subject').value = b.subject;
    document.getElementById('bk-section').value = b.section;
    document.getElementById('bk-room').value    = b.room_id;
    document.getElementById('bk-day').value     = b.day_of_week;
    document.getElementById('bk-time').value    = b.time_slot;
  } else {
    title.textContent = 'Add Booking';
    if (preDay)  document.getElementById('bk-day').value  = preDay;
    if (preTime) document.getElementById('bk-time').value = preTime;
  }
  Modal.open('modal-booking');
}

async function saveBooking() {
  const btn = document.getElementById('booking-save-btn');
  const payload = {
    faculty:     document.getElementById('bk-faculty').value.trim(),
    subject:     document.getElementById('bk-subject').value.trim(),
    section:     document.getElementById('bk-section').value.trim(),
    room_id:     document.getElementById('bk-room').value,
    day_of_week: document.getElementById('bk-day').value,
    time_slot:   document.getElementById('bk-time').value,
  };
  if (_editBookingId) payload.id = _editBookingId;

  setBtnLoading(btn, true);
  const res = await (_editBookingId ? API.updateBooking(payload) : API.addBooking(payload));
  setBtnLoading(btn, false);

  if (!res.ok) return Toast.error(res.message);
  Toast.success(res.message);
  Modal.close('modal-booking');
  await loadBookings();
}

async function deleteBooking(id) {
  if (!confirmDanger('Delete this booking?')) return;
  const res = await API.deleteBooking(id);
  if (!res.ok) return Toast.error(res.message);
  Toast.success(res.message);
  await loadBookings();
}

/* ══════════════════════════════════════════════════════════
   REQUESTS PAGE
══════════════════════════════════════════════════════════ */
async function loadRequests(filter = '') {
  const res = await API.getRequests(filter);
  if (!res.ok) return Toast.error(res.message);
  _requests = res.data;
  renderRequestCards();
  updatePendingBadge(_requests.filter(r => r.status === 'pending').length);
}

function renderRequestCards() {
  const container = document.getElementById('req-cards');
  if (!container) return;

  if (!_requests.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No Requests Found</h3>
        <p>Reservation requests from the public form will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = _requests.map((r, i) => `
    <div class="req-card" id="rcard-${r.id}" style="animation-delay:${i * 0.04}s">
      <div class="req-card-top">
        <div>
          <div class="req-card-name">${escHtml(r.requester_name)}</div>
          <div class="req-card-purpose">${escHtml(r.purpose)}</div>
        </div>
        ${badgeHtml(r.status)}
      </div>
      <div class="req-meta-grid">
        <div class="meta-item">
          <div class="meta-label">Room</div>
          <div class="meta-val">${escHtml(r.room_name)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Date</div>
          <div class="meta-val">${fmtDate(r.request_date)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Time</div>
          <div class="meta-val">${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}</div>
        </div>
      </div>
      ${r.notes ? `<div class="req-notes">💡 ${escHtml(r.notes)}</div>` : ''}
      ${r.reject_reason && r.status === 'rejected' ? `<div class="req-notes" style="background:var(--red-l);color:var(--red)">Reason: ${escHtml(r.reject_reason)}</div>` : ''}
      <div class="req-card-footer">
        <span class="req-email">
          <span>✉</span> ${escHtml(r.requester_email)}
          ${r.notified ? '<span class="badge badge-green badge-sm" style="font-size:10px;padding:2px 7px">Email Sent</span>' : ''}
        </span>
        <div style="display:flex;gap:8px">
          ${r.status === 'pending' ? `
            <button class="btn btn-primary btn-sm" onclick="approveRequest(${r.id})">✓ Approve</button>
            <button class="btn btn-orange btn-sm" onclick="openRejectModal(${r.id})">✕ Reject</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

async function approveRequest(id) {
  const btn = document.querySelector(`#rcard-${id} .btn-primary`);
  if (btn) setBtnLoading(btn, true);

  const res = await API.approveRequest(id);
  if (btn) setBtnLoading(btn, false);

  if (!res.ok) return Toast.error(res.message);

  if (res.emailSent) {
    Toast.success(`✓ Approved & email notification sent!`);
  } else {
    Toast.info(`✓ Approved. Note: ${res.emailMsg}`);
  }
  await loadRequests(document.getElementById('req-filter')?.value || '');
  await updateDashboardStats();
}

async function quickApprove(id) {
  const res = await API.approveRequest(id);
  if (!res.ok) return Toast.error(res.message);
  Toast.success(res.emailSent ? '✓ Approved & email sent!' : '✓ Approved. ' + res.emailMsg);
  await loadDashboard();
}

function openRejectModal(id) {
  document.getElementById('reject-req-id').value   = id;
  document.getElementById('reject-reason-txt').value = '';
  Modal.open('modal-reject');
}

async function submitRejection() {
  const id     = parseInt(document.getElementById('reject-req-id').value);
  const reason = document.getElementById('reject-reason-txt').value.trim();
  const btn    = document.getElementById('reject-submit-btn');

  setBtnLoading(btn, true);
  const res = await API.rejectRequest(id, reason);
  setBtnLoading(btn, false);

  if (!res.ok) return Toast.error(res.message);
  Modal.close('modal-reject');
  Toast.info(res.emailSent ? 'Rejected. Notification email sent.' : 'Rejected. ' + res.emailMsg);
  await loadRequests(document.getElementById('req-filter')?.value || '');
  await updateDashboardStats();
}

/* ══════════════════════════════════════════════════════════
   SETTINGS PAGE
══════════════════════════════════════════════════════════ */
async function loadSettings() {
  const res = await API.getSettings();
  if (!res.ok) return Toast.error(res.message);
  const d = res.data;

  const fields = ['smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from_name','smtp_from_email','system_name','academic_year','semester'];
  fields.forEach(key => {
    const el = document.getElementById(`setting-${key}`);
    if (el) el.value = d[key] || '';
  });

  // Show SMTP status
  const statusEl = document.getElementById('smtp-status');
  if (statusEl) {
    const configured = d.smtp_user && d.smtp_user.length > 0;
    statusEl.className = `smtp-status ${configured ? 'configured' : 'not-configured'}`;
    statusEl.innerHTML = configured
      ? `<span>✓</span> Gmail SMTP configured: <strong>${escHtml(d.smtp_user)}</strong>`
      : `<span>⚠</span> Gmail SMTP not configured. Enter credentials below to enable email notifications.`;
  }
}

async function saveSettings() {
  const btn    = document.getElementById('settings-save-btn');
  const fields = ['smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from_name','smtp_from_email','system_name','academic_year','semester'];
  const payload = {};
  fields.forEach(key => {
    const el = document.getElementById(`setting-${key}`);
    if (el) payload[key] = el.value.trim();
  });

  setBtnLoading(btn, true);
  const res = await API.saveSettings(payload);
  setBtnLoading(btn, false);

  if (!res.ok) return Toast.error(res.message);
  Toast.success(res.message);
  await loadSettings();
}

async function sendTestEmail() {
  const email = document.getElementById('test-email-addr')?.value.trim();
  if (!email) return Toast.error('Enter a recipient email first.');
  const btn = document.getElementById('test-email-btn');
  setBtnLoading(btn, true);
  const res = await API.testEmail(email);
  setBtnLoading(btn, false);
  res.ok ? Toast.success('Test email sent successfully!') : Toast.error(res.message);
}

/* ══════════════════════════════════════════════════════════
   ACTIVITY LOG PAGE
══════════════════════════════════════════════════════════ */
async function loadLog() {
  const res = await API.getLog();
  if (!res.ok) return Toast.error(res.message);

  const container = document.getElementById('log-list');
  if (!container) return;

  const actionIcons = {
    LOGIN: { icon: '🔑', cls: '' },
    LOGOUT: { icon: '👋', cls: '' },
    ADD_ROOM: { icon: '🏫', cls: '' },
    UPDATE_ROOM: { icon: '✏️', cls: 'edit' },
    DELETE_ROOM: { icon: '🗑', cls: 'reject' },
    ADD_BOOKING: { icon: '📅', cls: '' },
    UPDATE_BOOKING: { icon: '✏️', cls: 'edit' },
    DELETE_BOOKING: { icon: '🗑', cls: 'reject' },
    APPROVE_REQUEST: { icon: '✅', cls: '' },
    REJECT_REQUEST: { icon: '❌', cls: 'reject' },
    SAVE_SETTINGS: { icon: '⚙️', cls: 'edit' },
  };

  if (!res.data.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No Activity Yet</h3><p>Admin actions will be recorded here.</p></div>`;
    return;
  }

  container.innerHTML = res.data.map(l => {
    const info = actionIcons[l.action] || { icon: '•', cls: '' };
    const time = new Date(l.created_at).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
    return `
      <div class="log-item">
        <div class="log-icon ${info.cls}">${info.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="log-action">${escHtml(l.action.replace(/_/g,' '))}</div>
          <div class="log-desc">${escHtml(l.description || '')}${l.username ? ` · <strong>${escHtml(l.full_name || l.username)}</strong>` : ''}</div>
        </div>
        <div class="log-time">${time}</div>
      </div>
    `;
  }).join('');
}

/* ── HELPERS ── */
async function updateDashboardStats() {
  const res = await API.getDashboard();
  if (!res.ok) return;
  const d = res.data;
  animateCount(document.getElementById('stat-pending'), d.totalPending);
  updatePendingBadge(d.totalPending);
}

function updatePendingBadge(count) {
  const badge = document.getElementById('nav-badge-requests');
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle('vis', count > 0);
}

function clearFormErrors(form) {
  form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
  form.querySelectorAll('.input-error-msg').forEach(el => el.style.display = 'none');
}
