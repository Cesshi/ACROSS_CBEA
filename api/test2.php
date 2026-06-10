<?php
require_once '../config/db.php';
$conn = getConnection();
echo json_encode(['ok' => true]);
?>