<?php

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Invalid booking ID.']);
    exit();
}

$conn = getConnection();
$stmt = $conn->prepare('DELETE FROM bookings WHERE id = ?');
$stmt->bind_param('i', $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Booking deleted.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete booking.']);
}

$stmt->close();
$conn->close();
