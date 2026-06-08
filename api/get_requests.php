<?php
// ============================================
// Get All Requests
// api/get_requests.php
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

$conn = getConnection();

$sql = '
    SELECT req.*, r.name AS room_name
    FROM requests req
    JOIN rooms r ON req.room_id = r.id
    ORDER BY req.created_at DESC
';

$result = $conn->query($sql);
$requests = [];

while ($row = $result->fetch_assoc()) {
    $requests[] = $row;
}

echo json_encode(['success' => true, 'data' => $requests]);
$conn->close();
