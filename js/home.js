/**
 * ACROSS-CBEA — Public Homepage JS
 * home.js
 */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();
  document.getElementById('theme-toggle')?.addEventListener('click', () => Theme.toggle());

  await Promise.all([loadPublicRooms(), loadPublicSchedule()]);
  hideLoader();
});

/* ── LOAD ROOMS INTO FORM ── */
async function loadPublicRooms() {
  const res = await API.getRoomsPublic();
  if (!res.ok) return;

  const roomSel   = document.getElementById('pub-room');
  const filterSel = document.getElementById('pub-room-filter');

  const opts = '<option value="">Select a room…</option>' +
    res.data.map(r => `<option value="${r.id}">${escHtml(r.name)} (${escHtml(r.type)}, Cap.${r.capacity})</option>`).join('');

  if (roomSel)   roomSel.innerHTML   = opts;
  if (filterSel) filterSel.innerHTML = '<option value="">All Rooms</option>' +
    res.data.map(r => `<option value="${r.id}">${escHtml(r.name)}</option>`).join('');

  if (filterSel) filterSel.addEventListener('change', loadPublicSchedule);

  // Set today as min date
  const dateEl = document.getElementById('pub-date');
  if (dateEl) {
    const today = new Date().toISOString().split('T')[0];
    dateEl.min   = today;
    dateEl.value = today;
  }
}

/* ── LOAD SCHEDULE CALENDAR ── */
async function loadPublicSchedule() {
  const filter = document.getElementById('pub-room-filter')?.value || '';
  const res = await API.getSchedule(filter);
  if (!res.ok) return;

  const head = document.getElementById('pub-cal-head');
  const body = document.getElementById('pub-cal-body');
  if (head && body) {
    CalRenderer.render(head, body, res.data, filter);
  }
}

/* ── SUBMIT RESERVATION REQUEST ── */
const pubForm = document.getElementById('pub-req-form');
pubForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('pub-submit-btn');

  const name    = document.getElementById('pub-name').value.trim();
  const email   = document.getElementById('pub-email').value.trim();
  const roomId  = document.getElementById('pub-room').value;
  const date    = document.getElementById('pub-date').value;
  const start   = document.getElementById('pub-start').value;
  const end     = document.getElementById('pub-end').value;
  const purpose = document.getElementById('pub-purpose').value.trim();
  const notes   = document.getElementById('pub-notes').value.trim();

  // Client-side validation
  let valid = true;
  const setErr = (fieldId, msg) => {
    const fg = document.getElementById(fieldId)?.closest('.fg');
    if (!fg) return;
    fg.classList.add('has-error');
    const errEl = fg.querySelector('.input-error-msg');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    valid = false;
  };
  const clearErrs = () => {
    pubForm.querySelectorAll('.fg.has-error').forEach(f => f.classList.remove('has-error'));
    pubForm.querySelectorAll('.input-error-msg').forEach(f => f.style.display = 'none');
  };

  clearErrs();
  if (!name)    setErr('pub-name',    'Full name is required.');
  if (!email)   setErr('pub-email',   'Gmail address is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setErr('pub-email', 'Enter a valid email address.');
  if (!roomId)  setErr('pub-room',    'Please select a room.');
  if (!date)    setErr('pub-date',    'Please select a date.');
  if (!start)   setErr('pub-start',   'Start time is required.');
  if (!end)     setErr('pub-end',     'End time is required.');
  else if (start >= end) setErr('pub-end', 'End time must be after start time.');
  if (!purpose) setErr('pub-purpose', 'Purpose or event name is required.');
  if (!valid)   return;

  setBtnLoading(btn, true);
  const res = await API.submitRequest({ requester_name: name, requester_email: email, room_id: roomId, request_date: date, start_time: start, end_time: end, purpose, notes });
  setBtnLoading(btn, false);

  if (!res.ok) return Toast.error(res.message);

  // Show success
  const successEl = document.getElementById('pub-success');
  if (successEl) {
    successEl.style.display = 'block';
    successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { successEl.style.display = 'none'; }, 8000);
  }
  pubForm.reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('pub-date').value = today;
  document.getElementById('pub-date').min   = today;
  Toast.success('Request submitted! Watch your email for a notification.');
});
