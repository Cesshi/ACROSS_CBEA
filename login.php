<?php
// ============================================================
// login.php — Admin Login Page
// ============================================================
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/auth.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: admin.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $result   = adminLogin($username, $password);
    if ($result['ok']) {
        header('Location: admin.php');
        exit;
    }
    $error = $result['message'];
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Admin Login — ACROSS-CBEA</title>
  <link rel="stylesheet" href="css/main.css"/>
  <style>
    body {
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      padding: 24px;
    }
    .login-wrap { width: 100%; max-width: 420px; position: relative; z-index: 1; }
    .login-back {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text2); font-weight: 500;
      margin-bottom: 20px; transition: color var(--dur);
    }
    .login-back:hover { color: var(--green); text-decoration: none; }
    .login-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      padding: 44px 40px;
      box-shadow: var(--shadow-xl);
      animation: modalIn .4s var(--ease-b) both;
    }
    .login-logos {
      display: flex; align-items: center; justify-content: center;
      gap: 14px; margin-bottom: 22px;
    }
    .login-logos img { height: 56px; width: 56px; object-fit: contain; }
    .login-logo-sep { width: 1px; height: 44px; background: var(--border2); opacity: .7; }
    .login-brand { text-align: center; margin-bottom: 32px; }
    .login-brand .name { font-family: var(--font-head); font-size: 28px; color: var(--green); display: block; letter-spacing: -.3px; }
    .login-brand .sub  { font-size: 11.5px; color: var(--text3); letter-spacing: .05em; font-weight: 500; display: block; margin-top: 4px; }
    .login-err {
      background: var(--red-l); border: 1px solid rgba(209,58,58,.25);
      border-radius: var(--r-sm); color: var(--red);
      font-size: 13px; font-weight: 500;
      padding: 11px 15px; margin-bottom: 18px;
      display: flex; align-items: center; gap: 8px;
      animation: cardIn .25s var(--ease);
    }
    .mmsu-footer {
      text-align: center; margin-top: 24px; padding-top: 20px;
      border-top: 1px solid var(--border);
      font-size: 11px; color: var(--text4); font-weight: 500; letter-spacing: .03em;
    }
    .theme-float {
      position: fixed; top: 18px; right: 18px; z-index: 999;
    }
  </style>
</head>
<body>

<div class="bg-ambient">
  <div class="bg-blob bg-blob-1"></div>
  <div class="bg-blob bg-blob-2"></div>
  <div class="bg-blob bg-blob-3"></div>
</div>

<button class="btn btn-ghost btn-sm theme-float" id="theme-toggle" title="Toggle theme">☀ / ☾</button>

<div class="login-wrap">
  <a href="index.php" class="login-back">← Back to Homepage</a>

  <div class="login-card">
    <div class="login-logos">
      <img src="assets/img/mmsu_logo.png" alt="MMSU Seal"/>
      <div class="login-logo-sep"></div>
      <img src="assets/img/cbea_logo.png" alt="CBEA Logo"/>
    </div>

    <div class="login-brand">
      <span class="name">ACROSS-CBEA</span>
      <span class="sub">Academic Classroom Reservation &amp; Scheduling System</span>
    </div>

    <?php if ($error): ?>
    <div class="login-err">
      <span>⚠</span> <?= htmlspecialchars($error) ?>
    </div>
    <?php endif; ?>

    <form method="POST" action="login.php" novalidate>
      <div class="fg">
        <label>Username</label>
        <input type="text" name="username" placeholder="Enter your username"
               value="<?= htmlspecialchars($_POST['username'] ?? '') ?>"
               required autofocus autocomplete="username"/>
      </div>
      <div class="fg" style="margin-bottom:20px">
        <label>Password</label>
        <input type="password" name="password" placeholder="••••••••"
               required autocomplete="current-password"/>
      </div>

      <button type="submit" class="btn btn-primary btn-full" id="login-btn">
        Sign In to Dashboard
      </button>
    </form>

    <div class="mmsu-footer">
      Mariano Marcos State University &mdash; CBEA<br>
      ACROSS-CBEA v2.0 &copy; <?= date('Y') ?>
    </div>
  </div>
</div>

<div class="toast-container"></div>
<script src="js/app.js"></script>
<script>
  document.getElementById('theme-toggle')?.addEventListener('click', () => Theme.toggle());
  // Add loading state to login button
  document.querySelector('form')?.addEventListener('submit', function(e) {
    const btn = document.getElementById('login-btn');
    setBtnLoading(btn, true);
    // Allow form to submit (don't prevent default)
  });
</script>
</body>
</html>
