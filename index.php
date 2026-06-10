<?php
// ============================================================
// index.php — Public Homepage
// ============================================================
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/db.php';
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>ACROSS-CBEA — Classroom Reservation System</title>
  <meta name="description" content="Academic Classroom Reservation & Scheduling System — MMSU College of Business, Economics and Accountancy"/>
  <link rel="stylesheet" href="css/main.css"/>
  <style>
    /* ── HOME-SPECIFIC ── */
    .home-header {
      position: sticky; top: 0; z-index: 200;
      background: var(--glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--glass-border);
      padding: 12px 48px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 20px rgba(0,0,0,.06);
    }
    .header-brand { display: flex; align-items: center; gap: 16px; }
    .header-logos { display: flex; align-items: center; gap: 10px; }
    .header-logos img { height: 52px; width: 52px; object-fit: contain; }
    .header-logo-sep { width: 1px; height: 40px; background: var(--border2); opacity: .7; }
    .brand-texts .appname {
      font-family: var(--font-head); font-size: 28px; color: var(--green);
      letter-spacing: -.4px; line-height: 1.05; display: block;
    }
    .brand-texts .appsub { font-size: 11px; color: var(--text3); font-weight: 500; letter-spacing: .05em; text-transform: uppercase; }
    .brand-texts .apptag { font-size: 11px; color: var(--orange); font-style: italic; display: block; margin-top: 1px; }
    .header-right { display: flex; align-items: center; gap: 12px; }

    /* MAIN LAYOUT */
    .home-main {
      position: relative; z-index: 1;
      max-width: 1440px; width: 100%; margin: 0 auto;
      padding: 36px 48px;
      display: flex; gap: 32px;
    }
    .home-left  { flex: 1; min-width: 0; }
    .home-right { width: 440px; flex-shrink: 0; }

    /* FORM CARD */
    .form-card {
      background: var(--glass);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--glass-border);
      border-radius: var(--r-lg);
      padding: 30px;
      box-shadow: var(--shadow-md);
      position: sticky; top: 92px;
    }
    .form-card-head { padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 22px; }
    .form-card-head h2 { font-size: 22px; margin-bottom: 5px; }
    .form-card-head p  { font-size: 13px; color: var(--text2); }

    /* SUCCESS BANNER */
    .success-banner {
      display: none;
      background: var(--green-l);
      border: 1.5px solid var(--green);
      border-radius: var(--r-sm);
      padding: 14px 18px;
      font-size: 13px; color: var(--green); font-weight: 600;
      margin-top: 16px; line-height: 1.6;
      animation: cardIn .3s var(--ease);
    }

    /* CAL LEGEND */
    .cal-legend { display: flex; align-items: center; gap: 18px; margin-bottom: 14px; flex-wrap: wrap; }
    .leg { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2); font-weight: 500; }
    .leg-dot { width: 10px; height: 10px; border-radius: 50%; }

    @media (max-width: 960px) {
      .home-header { padding: 12px 20px; }
      .home-main   { flex-direction: column; padding: 20px; }
      .home-right  { width: 100%; }
      .form-card   { position: static; }
      .header-logos img { height: 40px; width: 40px; }
      .brand-texts .appname { font-size: 22px; }
    }
  </style>
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

<!-- HEADER -->
<header class="home-header">
  <div class="header-brand">
    <div class="header-logos">
      <img src="assets/img/mmsu_logo.png" alt="Mariano Marcos State University"/>
      <div class="header-logo-sep"></div>
      <img src="assets/img/cbea_logo.png" alt="CBEA Logo"/>
    </div>
    <div class="brand-texts">
      <span class="appname">ACROSS-CBEA</span>
      <span class="appsub">Academic Classroom Reservation &amp; Scheduling System</span>
      <span class="apptag">Reserve. Schedule. Access.</span>
    </div>
  </div>
  <div class="header-right">
    <button class="btn btn-ghost btn-sm" id="theme-toggle" title="Toggle theme">☀ / ☾</button>
    <a href="login.php" class="btn btn-primary">
      <span>🔑</span> Admin Login
    </a>
  </div>
</header>

<!-- MAIN -->
<main class="home-main">

  <!-- LEFT: SCHEDULE -->
  <div class="home-left">
    <div class="section-head">
      <h2>Live Classroom Schedule</h2>
      <span class="live-pill"><span class="live-dot"></span> Live</span>
    </div>

    <div class="cal-legend">
      <div class="leg"><div class="leg-dot" style="background:var(--green)"></div>Confirmed</div>
      <div class="leg"><div class="leg-dot" style="background:var(--orange)"></div>Pending Review</div>
      <div class="leg"><div class="leg-dot" style="background:var(--text4)"></div>Unavailable</div>
    </div>

    <div class="cal-wrap">
      <div class="cal-topbar">
        <h3>Weekly Schedule</h3>
        <select class="btn btn-ghost btn-sm" id="pub-room-filter" style="border-radius:var(--r-xs);padding:6px 28px 6px 10px;font-weight:500;min-width:140px">
          <option value="">Loading rooms…</option>
        </select>
      </div>
      <div class="cal-scroll">
        <table class="cal-table">
          <thead><tr id="pub-cal-head"></tr></thead>
          <tbody id="pub-cal-body">
            <tr><td colspan="7" style="text-align:center;padding:48px;color:var(--text3)">
              <span class="spinner spinner-dark" style="display:inline-block"></span>
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- RIGHT: REQUEST FORM -->
  <aside class="home-right">
    <div class="section-head" style="margin-bottom:14px">
      <h2>Request a Room</h2>
    </div>
    <div class="form-card">
      <div class="form-card-head">
        <h2>Submit Your Request</h2>
        <p>Fill out the form below. You'll receive a Gmail notification once the admin reviews your request.</p>
      </div>

      <form id="pub-req-form" novalidate>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="fg">
            <label>Full Name <span style="color:var(--red)">*</span></label>
            <input type="text" id="pub-name" placeholder="e.g. Prof. Maria Santos" required/>
            <span class="input-error-msg"></span>
          </div>
          <div class="fg">
            <label>Gmail Address <span style="color:var(--red)">*</span></label>
            <input type="email" id="pub-email" placeholder="yourname@gmail.com" required/>
            <span class="input-error-msg"></span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="fg">
            <label>Classroom / Room <span style="color:var(--red)">*</span></label>
            <select id="pub-room" required>
              <option value="">Loading…</option>
            </select>
            <span class="input-error-msg"></span>
          </div>
          <div class="fg">
            <label>Date <span style="color:var(--red)">*</span></label>
            <input type="date" id="pub-date" required/>
            <span class="input-error-msg"></span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="fg">
            <label>Start Time <span style="color:var(--red)">*</span></label>
            <input type="time" id="pub-start" value="07:00" required/>
            <span class="input-error-msg"></span>
          </div>
          <div class="fg">
            <label>End Time <span style="color:var(--red)">*</span></label>
            <input type="time" id="pub-end" value="08:00" required/>
            <span class="input-error-msg"></span>
          </div>
        </div>
        <div class="fg">
          <label>Purpose / Event Name <span style="color:var(--red)">*</span></label>
          <input type="text" id="pub-purpose" placeholder="e.g. Make-up Class, Department Meeting, Seminar" required/>
          <span class="input-error-msg"></span>
        </div>
        <div class="fg">
          <label>Additional Notes <span style="color:var(--text4);font-weight:400">(optional)</span></label>
          <textarea id="pub-notes" placeholder="Equipment needed, special arrangements, number of attendees…"></textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-full" id="pub-submit-btn">
          Submit Reservation Request
        </button>

        <div class="success-banner" id="pub-success">
          ✅ Your reservation request has been submitted successfully!<br>
          Please watch your Gmail inbox for a notification once the admin reviews it.<br>
          <small style="opacity:.75">This may take 1–2 business days.</small>
        </div>
      </form>
    </div>
  </aside>

</main>

<div class="toast-container" id="toast-container"></div>

<script src="js/app.js"></script>
<script src="js/home.js"></script>
</body>
</html>
