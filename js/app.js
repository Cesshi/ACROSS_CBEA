/**
 * ACROSS-CBEA — Core JS utilities
 * app.js
 */

'use strict';

/* ── THEME ── */
const Theme = {
  get() { return localStorage.getItem('acbea_theme') || 'light'; },
  set(t) {
    localStorage.setItem('acbea_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  },
  toggle() { Theme.set(Theme.get() === 'dark' ? 'light' : 'dark'); },
  init()    { document.documentElement.setAttribute('data-theme', Theme.get()); },
};
Theme.init();

/* ── API ── */
const API = {
  base: 'api/index.php',

  async _req(action, method = 'GET', body = null, params = {}) {
    const url = new URL(this.base, location.href);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const opts = { method, headers: {} };
    if (body !== null) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res  = await fetch(url.toString(), opts);
    const data = await res.json();
    return data;
  },

  get:    (action, params = {})        => API._req(action, 'GET',  null,  params),
  post:   (action, body = {})          => API._req(action, 'POST', body),
  delete: (action, body = {})          => API._req(action, 'POST', body),   // PHP doesn't parse DELETE body easily

  // Convenience wrappers
  getSchedule:   (roomId = '')         => API.get('get_schedule', roomId ? { room_id: roomId } : {}),
  getRoomsPublic:()                    => API.get('get_rooms_public'),
  submitRequest: (data)                => API.post('submit_request', data),
  getDashboard:  ()                    => API.get('get_dashboard'),
  getRooms:      ()                    => API.get('get_rooms'),
  addRoom:       (d)                   => API.post('add_room', d),
  updateRoom:    (d)                   => API.post('update_room', d),
  deleteRoom:    (id)                  => API.post('delete_room', { id }),
  getBookings:   ()                    => API.get('get_bookings'),
  addBooking:    (d)                   => API.post('add_booking', d),
  updateBooking: (d)                   => API.post('update_booking', d),
  deleteBooking: (id)                  => API.post('delete_booking', { id }),
  getRequests:   (status = '')         => API.get('get_requests', status ? { status } : {}),
  approveRequest:(id)                  => API.post('approve_request', { id }),
  rejectRequest: (id, reason)          => API.post('reject_request', { id, reason }),
  getSettings:   ()                    => API.get('get_settings'),
  saveSettings:  (d)                   => API.post('save_settings', d),
  testEmail:     (email)               => API.post('test_email', { email }),
  getLog:        ()                    => API.get('get_log'),
};

/* ── TOAST ── */
const Toast = {
  container: null,
  _ensure() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    this._ensure();
    const icons = { success: '✓', error: '✕', info: '●' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    el.onclick = () => this._remove(el);
    this.container.appendChild(el);
    setTimeout(() => this._remove(el), duration);
  },
  _remove(el) {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  },
  success: (msg, d) => Toast.show(msg, 'success', d),
  error:   (msg, d) => Toast.show(msg, 'error',   d || 5000),
  info:    (msg, d) => Toast.show(msg, 'info',    d),
};

/* ── MODAL ── */
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    el.addEventListener('click', (e) => { if (e.target === el) Modal.close(id); }, { once: true });
    // Focus first input
    setTimeout(() => { const f = el.querySelector('input:not([type=hidden]),select,textarea'); if (f) f.focus(); }, 80);
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  },
};
// Close on Escape
document.addEventListener('keydown', e => { if (e.key === 'Escape') Modal.closeAll(); });

/* ── LOADING BUTTON STATE ── */
function setBtnLoading(btn, loading, originalText) {
  if (loading) {
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Processing...`;
    btn.disabled = true;
  } else {
    btn.innerHTML = originalText || btn.dataset.origText || 'Submit';
    btn.disabled = false;
  }
}

/* ── CALENDAR RENDERER ── */
const TIMES = [
  "7:00–8:00 AM","8:00–9:00 AM","9:00–10:00 AM","10:00–11:00 AM",
  "11:00 AM–12:00 PM","12:00–1:00 PM","1:00–2:00 PM","2:00–3:00 PM",
  "3:00–4:00 PM","4:00–5:00 PM","5:00–6:00 PM","6:00–7:00 PM"
];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat"];

const CalRenderer = {
  render(headEl, bodyEl, bookings, filter = '', onClickEmpty = null) {
    headEl.innerHTML = '<th>Time</th>' + DAYS.map(d => `<th>${d}</th>`).join('');
    bodyEl.innerHTML = '';

    TIMES.forEach(t => {
      const tr  = document.createElement('tr');
      const tc  = document.createElement('td');
      const tlb = document.createElement('div');
      tlb.className = 'cal-time';
      tlb.textContent = t;
      tc.appendChild(tlb);
      tr.appendChild(tc);

      DAYS.forEach(d => {
        const bks = bookings.filter(b =>
          b.time_slot === t && b.day_of_week === d &&
          (!filter || String(b.room_id) === String(filter)) &&
          b.status !== 'rejected'
        );
        const td = document.createElement('td');

        if (!bks.length) {
          const empty = document.createElement('div');
          empty.className = 'cal-empty';
          if (onClickEmpty) empty.onclick = () => onClickEmpty(d, t);
          td.appendChild(empty);
        } else {
          bks.forEach(b => {
            const ev = document.createElement('div');
            ev.className = 'cal-event' + (b.status === 'pending' ? ' pending' : '');
            ev.innerHTML = `
              <div class="cal-event-title">${escHtml(b.subject || b.subj || '')}</div>
              <div class="cal-event-sub">${escHtml(b.room_name || b.room || '')} · ${escHtml(b.faculty || b.prof || '')}</div>
            `;
            td.appendChild(ev);
          });
        }
        tr.appendChild(td);
      });
      bodyEl.appendChild(tr);
    });
  },
};

/* ── CLOCK ── */
const Clock = {
  faceEl: null, hourEl: null, minEl: null, secEl: null,
  bigEl: null, dateEl: null, intervalId: null,

  init(faceId, bigId, dateId) {
    this.faceEl = document.getElementById(faceId);
    this.bigEl  = document.getElementById(bigId);
    this.dateEl = document.getElementById(dateId);
    if (!this.faceEl) return;

    // Draw tick marks
    for (let i = 0; i < 12; i++) {
      const t = document.createElement('div');
      t.className = 'clock-tick';
      t.style.transform = `translateX(-50%) rotate(${i * 30}deg)`;
      this.faceEl.appendChild(t);
    }

    // Create center dot
    const center = document.createElement('div');
    center.className = 'clock-center';
    this.faceEl.appendChild(center);

    // Create hands
    ['hand-hour', 'hand-min', 'hand-sec'].forEach(cls => {
      const h = document.createElement('div');
      h.className = `hand ${cls}`;
      this.faceEl.appendChild(h);
    });
    this.hourEl = this.faceEl.querySelector('.hand-hour');
    this.minEl  = this.faceEl.querySelector('.hand-min');
    this.secEl  = this.faceEl.querySelector('.hand-sec');

    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const hDeg = (h % 12) * 30 + m * 0.5;
    const mDeg = m * 6 + s * 0.1;
    const sDeg = s * 6;

    if (this.hourEl) this.hourEl.style.transform = `translateX(-50%) rotate(${hDeg}deg)`;
    if (this.minEl)  this.minEl.style.transform  = `translateX(-50%) rotate(${mDeg}deg)`;
    if (this.secEl)  this.secEl.style.transform  = `translateX(-50%) rotate(${sDeg}deg)`;

    if (this.bigEl) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12  = h % 12 || 12;
      this.bigEl.textContent = `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
    }
    if (this.dateEl) {
      const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      this.dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }
  },
};

/* ── HELPERS ── */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function badgeHtml(status) {
  const map = {
    approved: '<span class="badge badge-green"><span class="badge-dot"></span>Approved</span>',
    pending:  '<span class="badge badge-orange"><span class="badge-dot"></span>Pending</span>',
    rejected: '<span class="badge badge-red"><span class="badge-dot"></span>Rejected</span>',
    cancelled:'<span class="badge badge-gray"><span class="badge-dot"></span>Cancelled</span>',
  };
  return map[status] || `<span class="badge badge-gray">${status}</span>`;
}

function confirmDanger(message) {
  return confirm(message);
}

// Animate number counting up
function animateCount(el, targetVal, duration = 600) {
  const start    = parseInt(el.textContent) || 0;
  const target   = parseInt(targetVal) || 0;
  const startTime = performance.now();
  const update = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// Page loader
function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 500);
  }
}

// Debounce
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
