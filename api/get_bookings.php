<?php
// ============================================
// Get All Bookings
// api/get_bookings.php
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

$conn = getConnection();

$sql = '
    SELECT b.id, b.prof_name, b.subject, b.section,
           b.day, b.time_slot, b.status,
           r.name AS room_name, r.type AS room_type
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    ORDER BY FIELD(b.day,"Mon","Tue","Wed","Thu","Fri","Sat"), b.time_slot
';

$result = $conn->query($sql);
$bookings = [];

while ($row = $result->fetch_assoc()) {
    $bookings[] = $row;
}

echo json_encode(['success' => true, 'data' => $bookings]);
$conn->close();
