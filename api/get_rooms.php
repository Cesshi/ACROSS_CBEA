<?php
// ============================================
// Get All Rooms
// api/get_rooms.php
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

$conn = getConnection();
$result = $conn->query('SELECT * FROM rooms ORDER BY name');
$rooms = [];

while ($row = $result->fetch_assoc()) {
    $rooms[] = $row;
}

echo json_encode(['success' => true, 'data' => $rooms]);
$conn->close();
