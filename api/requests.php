<?php
ini_set("display_errors", 0);
error_reporting(0);
// ============================================
// Requests — public submit + admin manage
// api/requests.php
// ============================================

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

// ── GET — list requests ───────────────────────────────────
if ($method === 'GET') {
    $status = $_GET['status'] ?? 'pending';

    if ($status === 'all') {
        $result = $conn->query("SELECT * FROM reservations WHERE status IN ('pending','rejected') ORDER BY created_at DESC");
    } else {
        $stmt = $conn->prepare('SELECT * FROM reservations WHERE status = ? ORDER BY created_at DESC');
        $stmt->bind_param('s', $status);
        $stmt->execute();
        $result = $stmt->get_result();
    }

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            'id'        => (int)$row['id'],
            'prof'      => $row['prof'],
            'subj'      => $row['subj'],
            'group'     => $row['group'],
            'email'     => $row['email'] ?? '',
            'room'      => $row['room'],
            'day'       => $row['day'],
            'time'      => $row['time_slot'],
            'notes'     => $row['notes'] ?? '',
            'status'    => $row['status'],
            'actionAt'  => $row['action_at'],
            'createdAt' => $row['created_at'],
        ];
    }
    echo json_encode($rows);
    $conn->close(); exit();
}

// ── POST — public submits a request ───────────────────────
if ($method === 'POST') {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $prof  = trim($body['prof']  ?? '');
    $subj  = trim($body['subj']  ?? '');
    $group = trim($body['group'] ?? '');
    $email = trim($body['email'] ?? '');
    $room  = trim($body['room']  ?? '');
    $day   = trim($body['day']   ?? '');
    $time  = trim($body['time']  ?? '');
    $notes = trim($body['notes'] ?? '');

    if (!$prof || !$subj || !$group || !$room || !$day || !$time) {
        http_response_code(400);
        echo json_encode(['error' => 'Required fields: prof, subj, group, room, day, time.']);
        $conn->close(); exit();
    }

    // Conflict against approved bookings
    $ck = $conn->prepare('SELECT id FROM reservations WHERE room=? AND day=? AND time_slot=? AND status="approved"');
    $ck->bind_param('sss', $room, $day, $time);
    $ck->execute();
    $ck->store_result();
    if ($ck->num_rows > 0) {
        $ck->close();
        http_response_code(409);
        echo json_encode(['error' => "$room is already reserved on $day at $time. Please choose a different slot."]);
        $conn->close(); exit();
    }
    $ck->close();

    $stmt = $conn->prepare(
        'INSERT INTO reservations (prof, subj, `group`, email, room, day, time_slot, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pending")'
    );
    $stmt->bind_param('ssssssss', $prof, $subj, $group, $email, $room, $day, $time, $notes);
    $stmt->execute();
    $newId = $conn->insert_id;
    $stmt->close();
    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $newId]);
    $conn->close(); exit();
}

// ── PUT — admin approves or rejects ──────────────────────
if ($method === 'PUT') {

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $id     = intval($body['id'] ?? 0);
    $action = $body['action'] ?? '';

    if (!$id || !in_array($action, ['approve', 'reject'])) {
        http_response_code(400);
        echo json_encode(['error' => 'id and action (approve|reject) required.']);
        $conn->close(); exit();
    }

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

    // Approve the request
    $stmt = $conn->prepare('UPDATE reservations SET status=?, action_at=NOW() WHERE id=?');
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();
    $stmt->close();

    // If approving a CHANGE request, reject the old slot automatically
    if ($action === 'approve') {
        $nr = $conn->prepare('SELECT notes FROM reservations WHERE id=?');
        $nr->bind_param('i', $id);
        $nr->execute();
        $noteRow = $nr->get_result()->fetch_assoc();
        $nr->close();

        if ($noteRow && strpos($noteRow['notes'], '[Change request') !== false) {
            // Parse: [Change request — from: ROOM · DAY · TIME → to: ...]
            if (preg_match('/from:\s*(.+?)\s*·\s*(.+?)\s*·\s*(.+?)\s*→/', $noteRow['notes'], $m)) {
                $fromRoom = trim($m[1]);
                $fromDay  = trim($m[2]);
                $fromTime = trim($m[3]);
                // Reject the old approved booking for that slot
                $del = $conn->prepare('UPDATE reservations SET status="rejected", action_at=NOW() WHERE room=? AND day=? AND time_slot=? AND status="approved" AND id != ?');
                $del->bind_param('sssi', $fromRoom, $fromDay, $fromTime, $id);
                $del->execute();
                $del->close();
            }
        }
    }

    echo json_encode(['success' => true]);
    $conn->close(); exit();
}

// ── DELETE — admin deletes a request ──────────────────────
if ($method === 'DELETE') {

    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = intval($body['id'] ?? ($_GET['id'] ?? 0));
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
echo json_encode(['error' => 'Method not allowed.']);
$conn->close();
