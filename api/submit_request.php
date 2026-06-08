<?php
// ============================================
// Submit Room Request (Faculty)
// api/submit_request.php
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$prof      = trim($data['prof_name'] ?? '');
$subj      = trim($data['subject'] ?? '');
$sec       = trim($data['section'] ?? '');
$roomId    = intval($data['room_id'] ?? 0);
$day       = trim($data['day'] ?? '');
$time      = trim($data['time_slot'] ?? '');
$reqType   = $data['request_type'] ?? 'new';
$reason    = trim($data['reason'] ?? '');
$notes     = trim($data['notes'] ?? '');
$bookingId = intval($data['booking_id'] ?? 0) ?: null;

if (!$prof || !$subj || !$sec || !$roomId || !$day || !$time) {
    echo json_encode(['success' => false, 'message' => 'All required fields must be filled.']);
    exit();
}

$conn = getConnection();

$stmt = $conn->prepare('INSERT INTO requests (booking_id, prof_name, subject, section, room_id, day, time_slot, request_type, reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->bind_param('isssississs', $bookingId, $prof, $subj, $sec, $roomId, $day, $time, $reqType, $reason, $notes);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Request submitted.', 'id' => $conn->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to submit request.']);
}

$stmt->close();
$conn->close();
