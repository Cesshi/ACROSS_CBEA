<?php
ini_set('display_errors', 0); error_reporting(0);
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

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
    $stmt = $conn->prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?');
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $conn->close();

    // Accept bcrypt OR known dev defaults
    $devPasswords = ['admin' => 'admin123', 'faculty' => 'cbea2026'];
    $valid = $user && (
        password_verify($password, $user['password_hash']) ||
        (isset($devPasswords[$username]) && $password === $devPasswords[$username])
    );

    if ($valid) {
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['username']  = $user['username'];
        $_SESSION['role']      = $user['role'];
        echo json_encode(['success' => true, 'username' => $user['username'], 'role' => $user['role']]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password.']);
    }
    exit();
}

if ($method === 'DELETE') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit();
}

// GET — check session
if ($method === 'GET') {
    if (!empty($_SESSION['user_id'])) {
        echo json_encode(['loggedIn' => true, 'role' => $_SESSION['role'], 'username' => $_SESSION['username']]);
    } else {
        echo json_encode(['loggedIn' => false]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);