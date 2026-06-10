<?php
// ============================================================
// admin.php — Admin Dashboard
// ============================================================
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/auth.php';
requireLogin();
$adminName = $_SESSION['admin_full_name'] ?? 'Admin';
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Dashboard — ACROSS-CBEA</title>
  <link rel="stylesheet" href="css/main.css"/>
  <link rel="stylesheet" href="css/admin.css"/>
</head>
<body>

<!-- PAGE LOADER -->
<div id="page-loader">
  <div class="loader-logo">
    <img src="assets/img/mmsu_logo.png" alt="MMSU"/>
    <img src="assets/img/cbea_logo.png" alt="CBEA"/>
    <span class="loader-name">ACROSS-CBEA</span>
  </div>
  <div class="loader-bar"><div class="loader-bar-fill"></div></div>
</div>

<!-- AMBIENT BACKGROUND -->
<div class="bg-ambient">
  <div class="bg-blob bg-blob-1"></div>
  <div class="bg-blob bg-blob-2"></div>
  <div class="bg-blob bg-blob-3"></div>
</div>

<!-- TOP NAV -->
<nav class="admin-topbar">
  <div class="topbar-brand">
    <div class="topbar-logos">
      <img src="assets/img/mmsu_logo.png" alt="MMSU"/>
      <div class="topbar-logo-sep"></div>
      <img src="assets/img/cbea_logo.png" alt="CBEA"/>
    </div>
    <div class="topbar-names">
      <div class="topbar-appname">ACROSS-CBEA</div>
      <div class="topbar-subtitle">CBEA Scheduling Dashboard</div>
    </div>
  </div>
  <div class="topbar-right">
    <div class="user-chip">
      <span class="user-status"></span>
      <?= htmlspecialchars($adminName) ?>
    </div>
    <button class="btn btn-ghost btn-sm" id="theme-toggle" title="Toggle theme">☀ / ☾</button>
    <a href="logout.php" class="btn btn-ghost btn-sm">Logout</a>
  </div>
</nav>

<div class="admin-layout">

  <!-- SIDEBAR -->
  <nav class="admin-sidebar" id="admin-sidebar">
    <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle sidebar">☰</button>

    <div class="sidebar-section-label">Overview</div>
    <button class="nav-btn active" data-page="dashboard" onclick="loadPage('dashboard')">
      <span>📊</span>
      <span class="nav-btn-label">Dashboard</span>
    </button>
    <button class="nav-btn" data-page="schedule" onclick="loadPage('schedule')">
      <span>📅</span>
      <span class="nav-btn-label">Schedule</span>
    </button>

    <div class="sidebar-section-label">Management</div>
    <button class="nav-btn" data-page="rooms" onclick="loadPage('rooms')">
      <span>🏫</span>
      <span class="nav-btn-label">Rooms</span>
    </button>
    <button class="nav-btn" data-page="bookings" onclick="loadPage('bookings')">
      <span>📋</span>
      <span class="nav-btn-label">Bookings</span>
    </button>
    <button class="nav-btn" data-page="requests" onclick="loadPage('requests')">
      <span>📩</span>
      <span class="nav-btn-label">Requests</span>
      <span class="nav-btn-badge" id="nav-badge-requests">0</span>
    </button>

    <div class="sidebar-section-label">System</div>
    <button class="nav-btn" data-page="settings" onclick="loadPage('settings')">
      <span>⚙️</span>
      <span class="nav-btn-label">Settings</span>
    </button>
    <button class="nav-btn" data-page="log" onclick="loadPage('log')">
      <span>📜</span>
      <span class="nav-btn-label">Activity Log</span>
    </button>
  </nav>

  <!-- MAIN CONTENT -->
  <main class="admin-main">

    <!-- ════════════════════════════════════════
         DASHBOARD PAGE
    ════════════════════════════════════════ -->
    <div class="admin-page active" id="page-dashboard">
      <div class="page-top">
        <div class="page-top-title">
          <h1>Dashboard</h1>
          <p>Welcome back, <?= htmlspecialchars($adminName) ?>. Here's your scheduling overview.</p>
        </div>
        <div class="page-top-actions">
          <button class="btn btn-secondary btn-sm" onclick="loadDashboard()">↻ Refresh</button>
        </div>
      </div>

      <!-- STATS -->
      <div class="stats-grid">
        <div class="stat-card accent">
          <div class="stat-icon">🏫</div>
          <div class="stat-value" id="stat-rooms">—</div>
          <div class="stat-label">Total Rooms</div>
          <div class="stat-sub">CBEA classrooms</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value" id="stat-approved">—</div>
          <div class="stat-label">Confirmed</div>
          <div class="stat-sub">active bookings</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">⏳</div>
          <div class="stat-value" id="stat-pending">—</div>
          <div class="stat-label">Pending</div>
          <div class="stat-sub">awaiting review</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📩</div>
          <div class="stat-value" id="stat-requests">—</div>
          <div class="stat-label">Total Requests</div>
          <div class="stat-sub">all time</div>
        </div>
      </div>

      <div class="dash-two-col">
        <!-- LEFT: Recent requests -->
        <div>
          <div class="card">
            <div class="card-header">
              <h3>Recent Reservation Requests</h3>
              <button class="btn btn-ghost btn-sm" onclick="loadPage('requests')">View All</button>
            </div>
            <div class="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Requester</th><th>Room</th><th>Date</th>
                    <th>Time</th><th>Purpose</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody id="dash-req-tbody">
                  <tr><td colspan="7" style="text-align:center;padding:40px">
                    <span class="spinner spinner-dark" style="display:inline-block"></span>
                  </td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <!-- RIGHT: Clock + Occupancy -->
        <div>
          <div class="clock-widget">
            <div class="clock-face" id="clock-face"></div>
            <div class="clock-info">
              <div class="time-display" id="clock-time">—</div>
              <div class="date-display" id="clock-date">—</div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Room Occupancy</h3></div>
            <div id="occ-list">
              <div class="skeleton" style="height:14px;margin-bottom:12px"></div>
              <div class="skeleton" style="height:14px;margin-bottom:12px;width:80%"></div>
              <div class="skeleton" style="height:14px;margin-bottom:12px;width:90%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         SCHEDULE PAGE
    ════════════════════════════════════════ -->
    <div class="admin-page" id="page-schedule">
      <div class="page-top">
        <div class="page-top-title">
          <h1>Weekly Schedule</h1>
          <p>Full room-by-room schedule. Click an empty slot to add a booking.</p>
        </div>
        <div class="page-top-actions">
          <select id="sched-room-filter" class="btn btn-ghost btn-sm" style="padding-right:28px;min-width:150px">
            <option value="">All Rooms</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="openBookingModal()">+ Add Booking</button>
        </div>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <div class="cal-scroll">
          <table class="cal-table" style="min-width:700px">
            <thead><tr id="sched-thead-row"></tr></thead>
            <tbody id="sched-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         ROOMS PAGE
    ════════════════════════════════════════ -->
    <div class="admin-page" id="page-rooms">
      <div class="page-top">
        <div class="page-top-title">
          <h1>Rooms</h1>
          <p>Manage all CBEA classrooms and facilities.</p>
        </div>
        <div class="page-top-actions">
          <button class="btn btn-primary" onclick="openRoomModal()">+ Add Room</button>
        </div>
      </div>
      <div class="room-cards-grid" id="rooms-cards"></div>
      <div class="card" style="margin-top:0">
        <div class="card-header"><h3>All Rooms</h3></div>
        <div class="tbl-wrap">
          <table>
            <thead><tr>
              <th>Room Name</th><th>Type</th><th>Capacity</th><th>Floor</th><th>Occupancy</th><th>Actions</th>
            </tr></thead>
            <tbody id="rooms-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         BOOKINGS PAGE
    ════════════════════════════════════════ -->
    <div class="admin-page" id="page-bookings">
      <div class="page-top">
        <div class="page-top-title">
          <h1>Bookings</h1>
          <p>Manage all regular class schedule bookings.</p>
        </div>
        <div class="page-top-actions">
          <button class="btn btn-primary" onclick="openBookingModal()">+ Add Booking</button>
        </div>
      </div>
      <div class="card">
        <div class="tbl-wrap">
          <table>
            <thead><tr>
              <th>Faculty</th><th>Subject</th><th>Room</th><th>Day</th>
              <th>Time Slot</th><th>Section</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody id="bookings-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         REQUESTS PAGE
    ════════════════════════════════════════ -->
    <div class="admin-page" id="page-requests">
      <div class="page-top">
        <div class="page-top-title">
          <h1>Reservation Requests</h1>
          <p>Review public requests. Approving or rejecting sends an automated Gmail notification.</p>
        </div>
        <div class="page-top-actions">
          <select id="req-filter" class="btn btn-ghost btn-sm" style="padding-right:28px;min-width:140px" onchange="loadRequests(this.value)">
            <option value="">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button class="btn btn-secondary btn-sm" onclick="loadRequests(document.getElementById('req-filter').value)">↻ Refresh</button>
        </div>
      </div>
      <div id="req-cards">
        <div style="text-align:center;padding:60px;color:var(--text3)">
          <span class="spinner spinner-dark" style="display:inline-block"></span>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         SETTINGS PAGE
    ════════════════════════════════════════ -->
    <div class="admin-page" id="page-settings">
      <div class="page-top">
        <div class="page-top-title">
          <h1>Settings</h1>
          <p>Configure Gmail SMTP for automated email notifications and system preferences.</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">

        <!-- SMTP Config -->
        <div class="card">
          <div class="card-header"><h3>📧 Gmail SMTP Configuration</h3></div>
          <div id="smtp-status" class="smtp-status not-configured">
            <span>⚠</span> Loading SMTP status…
          </div>
          <div class="fg">
            <label>Gmail Address (SMTP Username)</label>
            <input type="email" id="setting-smtp_user" placeholder="yourname@gmail.com"/>
            <span class="input-hint">Use your Google Workspace or Gmail address.</span>
          </div>
          <div class="fg">
            <label>App Password</label>
            <input type="password" id="setting-smtp_pass" placeholder="Gmail App Password (16 characters)"/>
            <span class="input-hint">
              <strong>Important:</strong> Use a Gmail <em>App Password</em>, not your regular password.
              <a href="https://support.google.com/accounts/answer/185833" target="_blank">How to generate →</a>
            </span>
          </div>
          <div class="fg">
            <label>From Name</label>
            <input type="text" id="setting-smtp_from_name" placeholder="CBEA Scheduling Office — MMSU"/>
          </div>
          <div class="fg">
            <label>From Email</label>
            <input type="email" id="setting-smtp_from_email" placeholder="cbea.scheduling@mmsu.edu.ph"/>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="fg">
              <label>SMTP Host</label>
              <input type="text" id="setting-smtp_host" placeholder="smtp.gmail.com"/>
            </div>
            <div class="fg">
              <label>SMTP Port</label>
              <input type="number" id="setting-smtp_port" placeholder="587"/>
            </div>
          </div>
        </div>

        <!-- System Settings + Test Email -->
        <div style="display:flex;flex-direction:column;gap:22px">
          <div class="card">
            <div class="card-header"><h3>🏫 System Settings</h3></div>
            <div class="fg">
              <label>System Name</label>
              <input type="text" id="setting-system_name" placeholder="ACROSS-CBEA"/>
            </div>
            <div class="fg">
              <label>Academic Year</label>
              <input type="text" id="setting-academic_year" placeholder="AY 2025-2026"/>
            </div>
            <div class="fg">
              <label>Semester</label>
              <input type="text" id="setting-semester" placeholder="2nd Semester"/>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>🔬 Test Email</h3></div>
            <p style="font-size:13px;color:var(--text2);margin-bottom:14px">Send a test email to verify your SMTP configuration is working.</p>
            <div class="fg">
              <label>Recipient Email</label>
              <input type="email" id="test-email-addr" placeholder="test@gmail.com"/>
            </div>
            <button class="btn btn-secondary" id="test-email-btn" onclick="sendTestEmail()">Send Test Email</button>
          </div>
        </div>

      </div>

      <div style="margin-top:22px;display:flex;gap:12px">
        <button class="btn btn-primary btn-lg" id="settings-save-btn" onclick="saveSettings()">Save All Settings</button>
        <button class="btn btn-ghost btn-lg" onclick="loadSettings()">↻ Reset</button>
      </div>

      <!-- Gmail Setup Guide -->
      <div class="card" style="margin-top:22px;border-left:4px solid var(--green)">
        <div class="card-header"><h3>📖 Gmail SMTP Setup Guide</h3></div>
        <ol style="font-size:13px;color:var(--text2);line-height:2;padding-left:20px">
          <li>Go to your Google Account → <strong>Security</strong></li>
          <li>Enable <strong>2-Step Verification</strong> (required for App Passwords)</li>
          <li>Go to <strong>Security → App Passwords</strong></li>
          <li>Select app: <em>Mail</em>, Select device: <em>Other (custom name)</em> → type <em>ACROSS-CBEA</em></li>
          <li>Click <strong>Generate</strong> — copy the 16-character password</li>
          <li>Paste it in the <em>App Password</em> field above and save settings</li>
          <li>Use <em>Send Test Email</em> to verify everything works</li>
        </ol>
        <div style="margin-top:12px;padding:10px 14px;background:var(--orange-l);border-radius:var(--r-xs);font-size:12.5px;color:var(--orange-d)">
          ⚠ <strong>Note:</strong> Never use your regular Gmail password here. Always use a dedicated App Password for security.
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         ACTIVITY LOG PAGE
    ════════════════════════════════════════ -->
    <div class="admin-page" id="page-log">
      <div class="page-top">
        <div class="page-top-title">
          <h1>Activity Log</h1>
          <p>Recent admin actions and system events.</p>
        </div>
        <div class="page-top-actions">
          <button class="btn btn-secondary btn-sm" onclick="loadLog()">↻ Refresh</button>
        </div>
      </div>
      <div class="card">
        <div id="log-list">
          <div style="text-align:center;padding:40px;color:var(--text3)">
            <span class="spinner spinner-dark" style="display:inline-block"></span>
          </div>
        </div>
      </div>
    </div>

  </main>
</div><!-- /admin-layout -->


<!-- ════════════════════════════════════════════════
     MODALS
════════════════════════════════════════════════ -->

<!-- ROOM MODAL -->
<div class="modal-overlay" id="modal-room">
  <div class="modal-box">
    <div class="modal-header">
      <h2 id="room-modal-title">Add Room</h2>
      <button class="modal-close" onclick="Modal.close('modal-room')">✕</button>
    </div>
    <form id="room-form" novalidate>
      <div class="form-grid">
        <div class="fg">
          <label>Room Name <span style="color:var(--red)">*</span></label>
          <input type="text" id="rm-name" placeholder="e.g. CBEA 101"/>
        </div>
        <div class="fg">
          <label>Type</label>
          <select id="rm-type">
            <option>Lecture Room</option>
            <option>Computer Lab</option>
            <option>Conference Room</option>
            <option>Seminar Room</option>
            <option>Audio-Visual Room</option>
          </select>
        </div>
        <div class="fg">
          <label>Capacity <span style="color:var(--red)">*</span></label>
          <input type="number" id="rm-capacity" placeholder="40" min="1"/>
        </div>
        <div class="fg">
          <label>Floor <span style="color:var(--red)">*</span></label>
          <input type="text" id="rm-floor" placeholder="Ground Floor"/>
        </div>
        <div class="fg full">
          <label>Building</label>
          <input type="text" id="rm-building" placeholder="CBEA Building" value="CBEA Building"/>
        </div>
      </div>
    </form>
    <div class="modal-footer">
      <button class="btn btn-primary" id="room-save-btn" onclick="saveRoom()">Save Room</button>
      <button class="btn btn-ghost" onclick="Modal.close('modal-room')">Cancel</button>
    </div>
  </div>
</div>

<!-- BOOKING MODAL -->
<div class="modal-overlay" id="modal-booking">
  <div class="modal-box modal-lg">
    <div class="modal-header">
      <h2 id="booking-modal-title">Add Booking</h2>
      <button class="modal-close" onclick="Modal.close('modal-booking')">✕</button>
    </div>
    <form id="booking-form" novalidate>
      <div class="form-grid">
        <div class="fg">
          <label>Faculty Name <span style="color:var(--red)">*</span></label>
          <input type="text" id="bk-faculty" placeholder="Prof. Maria Santos"/>
        </div>
        <div class="fg">
          <label>Subject <span style="color:var(--red)">*</span></label>
          <input type="text" id="bk-subject" placeholder="Business Finance"/>
        </div>
        <div class="fg">
          <label>Section <span style="color:var(--red)">*</span></label>
          <input type="text" id="bk-section" placeholder="BSA 2-A"/>
        </div>
        <div class="fg">
          <label>Room <span style="color:var(--red)">*</span></label>
          <select id="bk-room"><option value="">Select room…</option></select>
        </div>
        <div class="fg">
          <label>Day <span style="color:var(--red)">*</span></label>
          <select id="bk-day">
            <option value="">Select day…</option>
            <option>Mon</option><option>Tue</option><option>Wed</option>
            <option>Thu</option><option>Fri</option><option>Sat</option>
          </select>
        </div>
        <div class="fg">
          <label>Time Slot <span style="color:var(--red)">*</span></label>
          <select id="bk-time"><option value="">Select time…</option></select>
        </div>
      </div>
    </form>
    <div class="modal-footer">
      <button class="btn btn-primary" id="booking-save-btn" onclick="saveBooking()">Save Booking</button>
      <button class="btn btn-ghost" onclick="Modal.close('modal-booking')">Cancel</button>
    </div>
  </div>
</div>

<!-- REJECT MODAL -->
<div class="modal-overlay" id="modal-reject">
  <div class="modal-box modal-sm">
    <div class="modal-header">
      <h2>Reject Request</h2>
      <button class="modal-close" onclick="Modal.close('modal-reject')">✕</button>
    </div>
    <p style="font-size:13px;color:var(--text2);margin-bottom:16px">
      Optionally provide a reason. This will be included in the automated email sent to the requester.
    </p>
    <input type="hidden" id="reject-req-id"/>
    <div class="fg">
      <label>Reason (Optional)</label>
      <textarea id="reject-reason-txt" rows="3"
                placeholder="e.g. Room unavailable on that date, conflict with an existing booking…"></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-orange" id="reject-submit-btn" onclick="submitRejection()">Send Rejection</button>
      <button class="btn btn-ghost" onclick="Modal.close('modal-reject')">Cancel</button>
    </div>
  </div>
</div>

<div class="toast-container"></div>

<script src="js/app.js"></script>
<script src="js/admin.js"></script>
<script>
  document.getElementById('theme-toggle')?.addEventListener('click', () => Theme.toggle());
</script>
</body>
</html>
