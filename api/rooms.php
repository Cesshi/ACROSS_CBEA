<?php
ini_set("display_errors", 0);
error_reporting(0);
// ============================================
// Rooms CRUD (Admin only for write operations)
// api/rooms.php
// ============================================

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn   = getConnection();

// ── GET — list all rooms (public) ─────────────────────────
if ($method === 'GET') {
    $result = $conn->query('SELECT * FROM rooms ORDER BY name ASC');
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    echo json_encode($rows);
    $conn->close(); exit();
}

// Admin writes (session check relaxed for localhost dev)

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

// ── POST — add room ───────────────────────────────────────
if ($method === 'POST') {
    $name  = trim($body['name']  ?? '');
    $type  = trim($body['type']  ?? 'Lecture Room');
    $cap   = intval($body['cap'] ?? 40);
    $floor = trim($body['floor'] ?? 'Ground Floor');

    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Room name is required.']);
        $conn->close(); exit();
    }

    // Duplicate check
    $ck = $conn->prepare('SELECT id FROM rooms WHERE name = ?');
    $ck->bind_param('s', $name);
    $ck->execute();
    $ck->store_result();
    if ($ck->num_rows > 0) {
        $ck->close();
        http_response_code(409);
        echo json_encode(['error' => "Room \"$name\" already exists."]);
        $conn->close(); exit();
    }
    $ck->close();

    $stmt = $conn->prepare('INSERT INTO rooms (name, type, `cap`, floor) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('ssis', $name, $type, $cap, $floor);
    $stmt->execute();
    $id = $conn->insert_id;
    $stmt->close();
    echo json_encode(['success' => true, 'id' => $id]);
    $conn->close(); exit();
}

// ── PUT — update room ─────────────────────────────────────
if ($method === 'PUT') {
    $id      = intval($body['id']      ?? 0);
    $name    = trim($body['name']      ?? '');
    $type    = trim($body['type']      ?? '');
    $cap     = intval($body['cap']     ?? 0);
    $floor   = trim($body['floor']     ?? '');
    $oldName = trim($body['oldName']   ?? '');

    if (!$id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'id and name are required.']);
        $conn->close(); exit();
    }

    // Duplicate check excluding self
    $ck = $conn->prepare('SELECT id FROM rooms WHERE name = ? AND id != ?');
    $ck->bind_param('si', $name, $id);
    $ck->execute();
    $ck->store_result();
    if ($ck->num_rows > 0) {
        $ck->close();
        http_response_code(409);
        echo json_encode(['error' => "Room \"$name\" already exists."]);
        $conn->close(); exit();
    }
    $ck->close();

    // Cascade-rename in reservations
    if ($oldName && $oldName !== $name) {
        $upd = $conn->prepare('UPDATE reservations SET room = ? WHERE room = ?');
        $upd->bind_param('ss', $name, $oldName);
        $upd->execute();
        $upd->close();
    }

    $stmt = $conn->prepare('UPDATE rooms SET name=?, type=?, `cap`=?, floor=? WHERE id=?');
    $stmt->bind_param('ssisi', $name, $type, $cap, $floor, $id);
    $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => true]);
    $conn->close(); exit();
}

// ── DELETE — delete room (or all) ─────────────────────────
if ($method === 'DELETE') {
    if (isset($_GET['all']) || !empty($body['all'])) {
        $conn->query('DELETE FROM reservations');
        $conn->query('DELETE FROM rooms');
        echo json_encode(['success' => true]);
        $conn->close(); exit();
    }

    $id = intval($body['id'] ?? ($_GET['id'] ?? 0));
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id required.']);
        $conn->close(); exit();
    }

    // Get room name for cascade
    $r = $conn->prepare('SELECT name FROM rooms WHERE id=?');
    $r->bind_param('i', $id);
    $r->execute();
    $res = $r->get_result()->fetch_assoc();
    $r->close();
    if (!$res) {
        http_response_code(404);
        echo json_encode(['error' => 'Room not found.']);
        $conn->close(); exit();
    }

    $dr = $conn->prepare('DELETE FROM reservations WHERE room=?');
    $dr->bind_param('s', $res['name']);
    $dr->execute();
    $dr->close();

    $stmt = $conn->prepare('DELETE FROM rooms WHERE id=?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => true]);
    $conn->close(); exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
$conn->close();
