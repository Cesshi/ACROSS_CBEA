<?php
// ============================================
// Approve or Reject Request (Admin only)
// api/handle_request.php
// ============================================

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';

$data   = json_decode(file_get_contents('php://input'), true);
$id     = intval($data['id'] ?? 0);
$action = $data['action'] ?? ''; // 'approve' or 'reject'

if (!$id || !in_array($action, ['approve', 'reject'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit();
}

$conn = getConnection();
$status = $action === 'approve' ? 'approved' : 'rejected';

// Update request status
$stmt = $conn->prepare('UPDATE requests SET status = ? WHERE id = ?');
$stmt->bind_param('si', $status, $id);
$stmt->execute();
$stmt->close();

// If approved, create a booking entry
if ($action === 'approve') {
    $req = $conn->query("SELECT * FROM requests WHERE id = $id")->fetch_assoc();

    $check = $conn->prepare('SELECT id FROM bookings WHERE room_id = ? AND day = ? AND time_slot = ? AND status = "approved"');
    $check->bind_param('iss', $req['room_id'], $req['day'], $req['time_slot']);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Conflict detected. Cannot approve.']);
        $check->close();
        $conn->close();
        exit();
    }
    $check->close();

    $ins = $conn->prepare('INSERT INTO bookings (prof_name, subject, section, room_id, day, time_slot, status) VALUES (?, ?, ?, ?, ?, ?, "approved")');
    $ins->bind_param('sssiss', $req['prof_name'], $req['subject'], $req['section'], $req['room_id'], $req['day'], $req['time_slot']);
    $ins->execute();
    $ins->close();
}

echo json_encode(['success' => true, 'message' => ucfirst($action) . 'd successfully.']);
$conn->close();
