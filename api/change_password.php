<?php
ini_set('display_errors', 0); error_reporting(0);
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed.']); exit();
}

// Must be admin
if (empty($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401); echo json_encode(['error' => 'Unauthorized.']); exit();
}

$body    = json_decode(file_get_contents('php://input'), true) ?? [];
$target  = trim($body['target']   ?? ''); // 'admin' or 'faculty'
$newPass = trim($body['password'] ?? '');

if (!$target || !$newPass) {
    http_response_code(400); echo json_encode(['error' => 'target and password required.']); exit();
}
if (strlen($newPass) < 6) {
    http_response_code(400); echo json_encode(['error' => 'Password must be at least 6 characters.']); exit();
}
if (!in_array($target, ['admin', 'faculty'])) {
    http_response_code(400); echo json_encode(['error' => 'Invalid target.']); exit();
}

$hash = password_hash($newPass, PASSWORD_BCRYPT);
$conn = getConnection();
$stmt = $conn->prepare('UPDATE users SET password_hash = ? WHERE username = ?');
$stmt->bind_param('ss', $hash, $target);
$stmt->execute();
$affected = $stmt->affected_rows;
$stmt->close();
$conn->close();

if ($affected > 0) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(404); echo json_encode(['error' => "User \"$target\" not found."]);
}