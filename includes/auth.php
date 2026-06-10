<?php
// ============================================================
// includes/auth.php — Session & authentication helpers
// ============================================================
require_once __DIR__ . '/db.php';

function startSecureSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'path'     => '/',
            'secure'   => false,   // Set true on HTTPS
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function isLoggedIn(): bool {
    startSecureSession();
    return isset($_SESSION['admin_id']) &&
           isset($_SESSION['admin_user']) &&
           isset($_SESSION['login_time']) &&
           (time() - $_SESSION['login_time']) < SESSION_LIFETIME;
}

function requireLogin(): void {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
    // Refresh session timer on activity
    $_SESSION['login_time'] = time();
}

function adminLogin(string $username, string $password): array {
    $row = DB::fetch(
        'SELECT id, username, password, full_name, email, role FROM admin_users WHERE username = ?',
        [trim($username)]
    );
    if (!$row || !password_verify($password, $row['password'])) {
        return ['ok' => false, 'message' => 'Invalid username or password.'];
    }
    startSecureSession();
    session_regenerate_id(true);
    $_SESSION['admin_id']        = $row['id'];
    $_SESSION['admin_user']      = $row['username'];
    $_SESSION['admin_full_name'] = $row['full_name'];
    $_SESSION['admin_email']     = $row['email'];
    $_SESSION['admin_role']      = $row['role'];
    $_SESSION['login_time']      = time();
    DB::execute(
        'INSERT INTO activity_log (admin_id, action, description, ip_address)
         VALUES (?, ?, ?, ?)',
        [$row['id'], 'LOGIN', 'Admin logged in', $_SERVER['REMOTE_ADDR'] ?? '']
    );
    return ['ok' => true];
}

function adminLogout(): void {
    startSecureSession();
    if (isset($_SESSION['admin_id'])) {
        DB::execute(
            'INSERT INTO activity_log (admin_id, action, description) VALUES (?,?,?)',
            [$_SESSION['admin_id'], 'LOGOUT', 'Admin logged out']
        );
    }
    session_destroy();
    header('Location: login.php');
    exit;
}

function logActivity(string $action, string $targetType = '', int $targetId = 0, string $desc = ''): void {
    startSecureSession();
    DB::execute(
        'INSERT INTO activity_log (admin_id, action, target_type, target_id, description, ip_address)
         VALUES (?,?,?,?,?,?)',
        [
            $_SESSION['admin_id'] ?? null,
            $action, $targetType, $targetId ?: null,
            $desc, $_SERVER['REMOTE_ADDR'] ?? ''
        ]
    );
}

function csrf(): string {
    startSecureSession();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrf(string $token): bool {
    startSecureSession();
    return isset($_SESSION['csrf_token']) &&
           hash_equals($_SESSION['csrf_token'], $token);
}

function jsonResponse(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
