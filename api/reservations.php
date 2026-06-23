<?php
ini_set('display_errors', 0);
error_reporting(0);
ob_start(); // buffer output to prevent partial responses

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once '../config/db.php';

$method  = $_SERVER['REQUEST_METHOD'];
$conn    = getConnection();
$isAdmin = !empty($_SESSION['admin_id']);

// ── GET ───────────────────────────────────────────────────
if ($method === 'GET') {
    $status = $_GET["status"] ?? "approved";

    if ($status === 'all') {
        $result = $conn->query('SELECT * FROM reservations ORDER BY created_at DESC');
    } else {
        $stmt = $conn->prepare('SELECT * FROM reservations WHERE status = ? ORDER BY day, time_slot, room');
        $stmt->bind_param('s', $status);
        $stmt->execute();
        $result = $stmt->get_result();
    }

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            'id'       => (int)$row['id'],
            'prof'     => $row['prof'],
            'subj'     => $row['subj'],
            'group'    => $row['group'],
            'email'    => $row['email'] ?? '',
            'room'     => $row['room'],
            'day'      => $row['day'],
            'time'     => $row['time_slot'],
            'notes'    => $row['notes'] ?? '',
            'status'   => $row['status'],
            'actionAt' => $row['action_at'],
        ];
    }
    echo json_encode($rows);
    $conn->close(); exit();
}

// Read raw input once and store it
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

// ── POST — add reservation ────────────────────────────────
if ($method === 'POST') {
    $prof   = trim($body['prof']   ?? '');
    $subj   = trim($body['subj']   ?? '');
    $group  = trim($body['group']  ?? '');
    $email  = trim($body['email']  ?? '');
    $room   = trim($body['room']   ?? '');
    $day    = trim($body['day']    ?? '');
    $time   = trim($body['time']   ?? '');
    $notes  = trim($body['notes']  ?? '');
    $status = $body['status'] ?? 'approved';

    if (!$prof || !$subj || !$group || !$room || !$day || !$time) {
        http_response_code(400);
        echo json_encode(['error' => 'Required fields missing.']);
        $conn->close(); exit();
    }

    // Conflict check
    $ck = $conn->prepare('SELECT id FROM reservations WHERE room=? AND day=? AND time_slot=? AND status="approved"');
    $ck->bind_param('sss', $room, $day, $time);
    $ck->execute();
    $ck->store_result();
    if ($ck->num_rows > 0) {
        $ck->close();
        http_response_code(409);
        echo json_encode(['error' => "Conflict: $room is already reserved on $day at $time."]);
        $conn->close(); exit();
    }
    $ck->close();

    $stmt = $conn->prepare(
        'INSERT INTO reservations (prof, subj, `group`, email, room, day, time_slot, notes, status, action_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
    );
    $stmt->bind_param('sssssssss', $prof, $subj, $group, $email, $room, $day, $time, $notes, $status);
    $stmt->execute();
    $newId = $conn->insert_id;
    $stmt->close();
    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $newId]);
    $conn->close(); exit();
}

// ── PUT — update / approve / reject ──────────────────────
if ($method === 'PUT') {
    $id     = intval($body['id'] ?? 0);
    $action = $body['action'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id required.']);
        $conn->close(); exit();
    }

    if ($action === 'approve' || $action === 'reject') {
        $status = $action === 'approve' ? 'approved' : 'rejected';

        if ($action === 'approve') {
            $r = $conn->prepare('SELECT room, day, time_slot FROM reservations WHERE id=?');
            $r->bind_param('i', $id);
            $r->execute();
            $cur = $r->get_result()->fetch_assoc();
            $r->close();
            if ($cur) {
                $ck = $conn->prepare('SELECT id FROM reservations WHERE room=? AND day=? AND time_slot=? AND status="approved" AND id != ?');
                $ck->bind_param('sssi', $cur['room'], $cur['day'], $cur['time_slot'], $id);
                $ck->execute();
                $ck->store_result();
                if ($ck->num_rows > 0) {
                    $ck->close();
                    http_response_code(409);
                    echo json_encode(['error' => 'Conflict: another booking already approved for that slot.']);
                    $conn->close(); exit();
                }
                $ck->close();
            }
        }

        $stmt = $conn->prepare('UPDATE reservations SET status=?, action_at=NOW() WHERE id=?');
        $stmt->bind_param('si', $status, $id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success' => true]);
        $conn->close(); exit();
    }

    // Full edit
    $prof   = trim($body['prof']   ?? '');
    $subj   = trim($body['subj']   ?? '');
    $group  = trim($body['group']  ?? '');
    $email  = trim($body['email']  ?? '');
    $room   = trim($body['room']   ?? '');
    $day    = trim($body['day']    ?? '');
    $time   = trim($body['time']   ?? '');
    $notes  = trim($body['notes']  ?? '');
    $status = $body['status'] ?? 'approved';

    if (!$prof || !$subj || !$room || !$day || !$time) {
        http_response_code(400);
        echo json_encode(['error' => 'Required fields missing.']);
        $conn->close(); exit();
    }

    if ($status === 'approved') {
        $ck = $conn->prepare('SELECT id FROM reservations WHERE room=? AND day=? AND time_slot=? AND status="approved" AND id != ?');
        $ck->bind_param('sssi', $room, $day, $time, $id);
        $ck->execute();
        $ck->store_result();
        if ($ck->num_rows > 0) {
            $ck->close();
            http_response_code(409);
            echo json_encode(['error' => "Conflict: $room is already reserved on $day at $time."]);
            $conn->close(); exit();
        }
        $ck->close();
    }

    $stmt = $conn->prepare(
        'UPDATE reservations SET prof=?, subj=?, `group`=?, email=?, room=?, day=?, time_slot=?, notes=?, status=?, action_at=NOW() WHERE id=?'
    );
    $stmt->bind_param('sssssssssi', $prof, $subj, $group, $email, $room, $day, $time, $notes, $status, $id);
    $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => true]);
    $conn->close(); exit();
}

// ── DELETE ────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (isset($_GET['all']) || !empty($body['all'])) {
        $conn->query('DELETE FROM reservations');
        echo json_encode(['success' => true]);
        $conn->close(); exit();
    }

    $id = intval($body['id'] ?? ($_GET['id'] ?? 0));
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id required.']);
        $conn->close(); exit();
    }

    $stmt = $conn->prepare('DELETE FROM reservations WHERE id=?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => true]);
    $conn->close(); exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed: ' . $method]);
$conn->close();
