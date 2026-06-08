<?php
// ============================================
// Add Booking (Admin only)
// api/add_booking.php
// ============================================

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$prof   = trim($data['prof_name'] ?? '');
$subj   = trim($data['subject'] ?? '');
$sec    = trim($data['section'] ?? '');
$roomId = intval($data['room_id'] ?? 0);
$day    = trim($data['day'] ?? '');
$time   = trim($data['time_slot'] ?? '');
$status = $data['status'] ?? 'approved';

if (!$prof || !$subj || !$sec || !$roomId || !$day || !$time) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit();
}

$conn = getConnection();

// Conflict check
$check = $conn->prepare('SELECT id FROM bookings WHERE room_id = ? AND day = ? AND time_slot = ? AND status = "approved"');
$check->bind_param('iss', $roomId, $day, $time);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Room is already booked at this time.']);
    $check->close();
    $conn->close();
    exit();
}
$check->close();

$stmt = $conn->prepare('INSERT INTO bookings (prof_name, subject, section, room_id, day, time_slot, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
$stmt->bind_param('sssisss', $prof, $subj, $sec, $roomId, $day, $time, $status);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Booking added.', 'id' => $conn->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to add booking.']);
}

$stmt->close();
$conn->close();
