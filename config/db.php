<?php

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'across_cbea');

function getConnection() {
    static $conn = null;
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'DB connection failed: ' . $conn->connect_error]);
            exit();
        }
        $conn->set_charset('utf8mb4');
    }
    return $conn;
}

// Optional: Define the path to the Python executable if needed for any Python scripts
define('PYTHON_PATH', 'C:\\msys64\\ucrt64\\bin\\python.exe');