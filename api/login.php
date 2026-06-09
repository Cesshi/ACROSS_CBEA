<?php
ini_set("display_errors", 0);
error_reporting(0);
// ============================================
// Admin Login / Logout
// api/login.php
// ============================================

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── POST — login ──────────────────────────────────────────
if ($method === 'POST') {
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password required.']);
        exit();
    }

    $conn = getConnection();
    $stmt = $conn->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ?');
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $conn->close();

    // Accept bcrypt hash OR the default dev password
    $valid = $user && (
        password_verify($password, $user['password_hash']) ||
        ($password === 'admin123' && $user['username'] === 'admin')
    );

    if ($valid) {
        $_SESSION['admin_id']   = $user['id'];
        $_SESSION['admin_user'] = $user['username'];
        echo json_encode(['success' => true, 'username' => $user['username']]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password.']);
    }
    exit();
}

// ── DELETE — logout ───────────────────────────────────────
if ($method === 'DELETE') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
