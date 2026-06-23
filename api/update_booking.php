<?php

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$id     = intval($data['id'] ?? 0);
$prof   = trim($data['prof_name'] ?? '');
$subj   = trim($data['subject'] ?? '');
$sec    = trim($data['section'] ?? '');
$roomId = intval($data['room_id'] ?? 0);
$day    = trim($data['day'] ?? '');
$time   = trim($data['time_slot'] ?? '');
$status = trim($data['status'] ?? 'approved');

if (!$id || !$prof || !$subj || !$roomId || !$day || !$time) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit();
}

$conn = getConnection();

$stmt = $conn->prepare('UPDATE bookings SET prof_name=?, subject=?, section=?, room_id=?, day=?, time_slot=?, status=? WHERE id=?');
$stmt->bind_param('ssssissi', $prof, $subj, $sec, $roomId, $day, $time, $status, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Booking updated.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update booking.']);
}

$stmt->close();
$conn->close();
