<?php
// ============================================================
// api/index.php — REST-style JSON API for all AJAX calls
// ============================================================
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/mailer.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Public endpoints (no auth required)
$publicActions = ['get_schedule', 'get_rooms_public', 'submit_request'];

if (!in_array($action, $publicActions)) {
    startSecureSession();
    if (!isLoggedIn()) {
        jsonResponse(['ok' => false, 'message' => 'Unauthorized'], 401);
    }
}

// Parse JSON body for PUT/POST if Content-Type is JSON
$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $input = $decoded;
        }
    }
    if (empty($input)) {
        $input = $_POST;
    }
}

// ── ROUTER ───────────────────────────────────────────────────
try {
    match ($action) {
        // ── PUBLIC ──
        'get_schedule'    => apiGetSchedule(),
        'get_rooms_public'=> apiGetRoomsPublic(),
        'submit_request'  => apiSubmitRequest($input),

        // ── AUTH REQUIRED ──
        'get_dashboard'   => apiGetDashboard(),
        'get_rooms'       => apiGetRooms(),
        'add_room'        => apiAddRoom($input),
        'update_room'     => apiUpdateRoom($input),
        'delete_room'     => apiDeleteRoom($input),
        'get_bookings'    => apiGetBookings(),
        'add_booking'     => apiAddBooking($input),
        'update_booking'  => apiUpdateBooking($input),
        'delete_booking'  => apiDeleteBooking($input),
        'get_requests'    => apiGetRequests(),
        'approve_request' => apiApproveRequest($input),
        'reject_request'  => apiRejectRequest($input),
        'get_settings'    => apiGetSettings(),
        'save_settings'   => apiSaveSettings($input),
        'test_email'      => apiTestEmail($input),
        'get_log'         => apiGetLog(),
        default           => jsonResponse(['ok' => false, 'message' => 'Unknown action'], 400),
    };
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
}

// ═══════════════════════════════════════════════════════════
// PUBLIC HANDLERS
// ═══════════════════════════════════════════════════════════

function apiGetSchedule(): never {
    $roomFilter = $_GET['room_id'] ?? '';
    $params = [];
    $sql = "
        SELECT b.id, b.faculty, b.subject, b.section, b.day_of_week, b.time_slot, b.status,
               r.id AS room_id, r.name AS room_name, r.type AS room_type
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status IN ('approved','pending') AND r.is_active = 1
    ";
    if ($roomFilter !== '') {
        $sql .= ' AND r.id = ?';
        $params[] = $roomFilter;
    }
    $sql .= ' ORDER BY b.day_of_week, b.time_slot';
    $rows = DB::fetchAll($sql, $params);
    jsonResponse(['ok' => true, 'data' => $rows]);
}

function apiGetRoomsPublic(): never {
    $rows = DB::fetchAll("SELECT id, name, type, capacity, floor FROM rooms WHERE is_active=1 ORDER BY name");
    jsonResponse(['ok' => true, 'data' => $rows]);
}

function apiSubmitRequest(array $input): never {
    $name    = trim($input['requester_name'] ?? '');
    $email   = trim($input['requester_email'] ?? '');
    $roomId  = (int)($input['room_id'] ?? 0);
    $date    = $input['request_date'] ?? '';
    $start   = $input['start_time'] ?? '';
    $end     = $input['end_time'] ?? '';
    $purpose = trim($input['purpose'] ?? '');
    $notes   = trim($input['notes'] ?? '');

    if (!$name || !$email || !$roomId || !$date || !$start || !$end || !$purpose) {
        jsonResponse(['ok' => false, 'message' => 'All required fields must be filled.'], 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['ok' => false, 'message' => 'Please enter a valid email address.'], 422);
    }
    if (strtotime($date) < strtotime('today')) {
        jsonResponse(['ok' => false, 'message' => 'Reservation date must be today or in the future.'], 422);
    }
    if ($start >= $end) {
        jsonResponse(['ok' => false, 'message' => 'End time must be after start time.'], 422);
    }

    // Check room exists
    $room = DB::fetch("SELECT id, name FROM rooms WHERE id=? AND is_active=1", [$roomId]);
    if (!$room) {
        jsonResponse(['ok' => false, 'message' => 'Selected room not found.'], 422);
    }

    $id = DB::insert(
        "INSERT INTO reservation_requests
         (requester_name, requester_email, room_id, request_date, start_time, end_time, purpose, notes)
         VALUES (?,?,?,?,?,?,?,?)",
        [$name, $email, $roomId, $date, $start, $end, $purpose, $notes]
    );

    jsonResponse(['ok' => true, 'message' => 'Request submitted successfully.', 'id' => $id]);
}

// ═══════════════════════════════════════════════════════════
// AUTH-REQUIRED HANDLERS
// ═══════════════════════════════════════════════════════════

function apiGetDashboard(): never {
    $totalRooms    = DB::fetch("SELECT COUNT(*) AS c FROM rooms WHERE is_active=1")['c'];
    $totalApproved = DB::fetch("SELECT COUNT(*) AS c FROM bookings WHERE status='approved'")['c'];
    $totalPending  = DB::fetch("SELECT COUNT(*) AS c FROM reservation_requests WHERE status='pending'")['c'];
    $totalRequests = DB::fetch("SELECT COUNT(*) AS c FROM reservation_requests")['c'];
    $todayRequests = DB::fetch(
        "SELECT COUNT(*) AS c FROM reservation_requests WHERE DATE(created_at)=CURDATE()"
    )['c'];

    $recentRequests = DB::fetchAll("
        SELECT rr.*, r.name AS room_name, r.type AS room_type
        FROM reservation_requests rr
        JOIN rooms r ON rr.room_id = r.id
        ORDER BY rr.created_at DESC LIMIT 8
    ");

    $roomOccupancy = DB::fetchAll("
        SELECT r.id, r.name, r.type, r.capacity,
               COUNT(b.id) AS bookings_count,
               ROUND(COUNT(b.id) / (12*6) * 100, 0) AS occupancy_pct
        FROM rooms r
        LEFT JOIN bookings b ON b.room_id = r.id AND b.status='approved'
        WHERE r.is_active=1
        GROUP BY r.id ORDER BY r.name
    ");

    jsonResponse(['ok' => true, 'data' => compact(
        'totalRooms','totalApproved','totalPending','totalRequests',
        'todayRequests','recentRequests','roomOccupancy'
    )]);
}

function apiGetRooms(): never {
    $rows = DB::fetchAll("
        SELECT r.*,
               (SELECT COUNT(*) FROM bookings b WHERE b.room_id=r.id AND b.status='approved') AS booking_count
        FROM rooms r ORDER BY r.name
    ");
    jsonResponse(['ok' => true, 'data' => $rows]);
}

function apiAddRoom(array $input): never {
    $name     = trim($input['name'] ?? '');
    $type     = $input['type'] ?? 'Lecture Room';
    $capacity = (int)($input['capacity'] ?? 0);
    $floor    = trim($input['floor'] ?? '');
    $building = trim($input['building'] ?? 'CBEA Building');
    if (!$name || !$capacity || !$floor) {
        jsonResponse(['ok' => false, 'message' => 'Name, capacity and floor are required.'], 422);
    }
    $exists = DB::fetch("SELECT id FROM rooms WHERE name=?", [$name]);
    if ($exists) {
        jsonResponse(['ok' => false, 'message' => "Room '{$name}' already exists."], 422);
    }
    $id = DB::insert(
        "INSERT INTO rooms (name,type,capacity,floor,building) VALUES (?,?,?,?,?)",
        [$name, $type, $capacity, $floor, $building]
    );
    logActivity('ADD_ROOM', 'room', $id, "Added room: {$name}");
    jsonResponse(['ok' => true, 'message' => 'Room added.', 'id' => $id]);
}

function apiUpdateRoom(array $input): never {
    $id       = (int)($input['id'] ?? 0);
    $name     = trim($input['name'] ?? '');
    $type     = $input['type'] ?? '';
    $capacity = (int)($input['capacity'] ?? 0);
    $floor    = trim($input['floor'] ?? '');
    $building = trim($input['building'] ?? 'CBEA Building');
    if (!$id || !$name || !$capacity || !$floor) {
        jsonResponse(['ok' => false, 'message' => 'All fields are required.'], 422);
    }
    $dup = DB::fetch("SELECT id FROM rooms WHERE name=? AND id<>?", [$name, $id]);
    if ($dup) {
        jsonResponse(['ok' => false, 'message' => "Room name '{$name}' is already in use."], 422);
    }
    DB::execute(
        "UPDATE rooms SET name=?,type=?,capacity=?,floor=?,building=? WHERE id=?",
        [$name, $type, $capacity, $floor, $building, $id]
    );
    logActivity('UPDATE_ROOM', 'room', $id, "Updated room: {$name}");
    jsonResponse(['ok' => true, 'message' => 'Room updated.']);
}

function apiDeleteRoom(array $input): never {
    $id = (int)($input['id'] ?? 0);
    if (!$id) jsonResponse(['ok' => false, 'message' => 'Invalid room ID.'], 422);
    $room = DB::fetch("SELECT name FROM rooms WHERE id=?", [$id]);
    DB::execute("DELETE FROM rooms WHERE id=?", [$id]);
    logActivity('DELETE_ROOM', 'room', $id, "Deleted room: " . ($room['name'] ?? ''));
    jsonResponse(['ok' => true, 'message' => 'Room deleted.']);
}

function apiGetBookings(): never {
    $rows = DB::fetchAll("
        SELECT b.*, r.name AS room_name
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        ORDER BY FIELD(b.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat'), b.time_slot
    ");
    jsonResponse(['ok' => true, 'data' => $rows]);
}

function apiAddBooking(array $input): never {
    $faculty  = trim($input['faculty'] ?? '');
    $subject  = trim($input['subject'] ?? '');
    $section  = trim($input['section'] ?? '');
    $roomId   = (int)($input['room_id'] ?? 0);
    $day      = $input['day_of_week'] ?? '';
    $timeSlot = $input['time_slot'] ?? '';
    if (!$faculty || !$subject || !$section || !$roomId || !$day || !$timeSlot) {
        jsonResponse(['ok' => false, 'message' => 'All fields are required.'], 422);
    }
    $conflict = DB::fetch(
        "SELECT id FROM bookings WHERE room_id=? AND day_of_week=? AND time_slot=? AND status='approved'",
        [$roomId, $day, $timeSlot]
    );
    if ($conflict) {
        jsonResponse(['ok' => false, 'message' => 'Room conflict: that slot is already booked.'], 422);
    }
    $id = DB::insert(
        "INSERT INTO bookings (faculty,subject,section,room_id,day_of_week,time_slot,created_by)
         VALUES (?,?,?,?,?,?,?)",
        [$faculty, $subject, $section, $roomId, $day, $timeSlot, $_SESSION['admin_id'] ?? null]
    );
    logActivity('ADD_BOOKING', 'booking', $id, "{$faculty} — {$subject}");
    jsonResponse(['ok' => true, 'message' => 'Booking added.', 'id' => $id]);
}

function apiUpdateBooking(array $input): never {
    $id       = (int)($input['id'] ?? 0);
    $faculty  = trim($input['faculty'] ?? '');
    $subject  = trim($input['subject'] ?? '');
    $section  = trim($input['section'] ?? '');
    $roomId   = (int)($input['room_id'] ?? 0);
    $day      = $input['day_of_week'] ?? '';
    $timeSlot = $input['time_slot'] ?? '';
    if (!$id || !$faculty || !$subject || !$section || !$roomId || !$day || !$timeSlot) {
        jsonResponse(['ok' => false, 'message' => 'All fields are required.'], 422);
    }
    $conflict = DB::fetch(
        "SELECT id FROM bookings WHERE room_id=? AND day_of_week=? AND time_slot=? AND status='approved' AND id<>?",
        [$roomId, $day, $timeSlot, $id]
    );
    if ($conflict) {
        jsonResponse(['ok' => false, 'message' => 'Room conflict: that slot is already booked.'], 422);
    }
    DB::execute(
        "UPDATE bookings SET faculty=?,subject=?,section=?,room_id=?,day_of_week=?,time_slot=? WHERE id=?",
        [$faculty, $subject, $section, $roomId, $day, $timeSlot, $id]
    );
    logActivity('UPDATE_BOOKING', 'booking', $id, "{$faculty} — {$subject}");
    jsonResponse(['ok' => true, 'message' => 'Booking updated.']);
}

function apiDeleteBooking(array $input): never {
    $id = (int)($input['id'] ?? 0);
    if (!$id) jsonResponse(['ok' => false, 'message' => 'Invalid ID.'], 422);
    DB::execute("DELETE FROM bookings WHERE id=?", [$id]);
    logActivity('DELETE_BOOKING', 'booking', $id, "Deleted booking #{$id}");
    jsonResponse(['ok' => true, 'message' => 'Booking deleted.']);
}

function apiGetRequests(): never {
    $status = $_GET['status'] ?? '';
    $params = [];
    $sql = "
        SELECT rr.*, r.name AS room_name, r.type AS room_type, r.floor AS room_floor
        FROM reservation_requests rr
        JOIN rooms r ON rr.room_id = r.id
    ";
    if ($status) {
        $sql .= ' WHERE rr.status = ?';
        $params[] = $status;
    }
    $sql .= ' ORDER BY rr.created_at DESC';
    $rows = DB::fetchAll($sql, $params);
    jsonResponse(['ok' => true, 'data' => $rows]);
}

function apiApproveRequest(array $input): never {
    $id = (int)($input['id'] ?? 0);
    if (!$id) jsonResponse(['ok' => false, 'message' => 'Invalid request ID.'], 422);

    $request = DB::fetch("SELECT * FROM reservation_requests WHERE id=?", [$id]);
    if (!$request) jsonResponse(['ok' => false, 'message' => 'Request not found.'], 404);
    if ($request['status'] !== 'pending') {
        jsonResponse(['ok' => false, 'message' => 'This request has already been reviewed.'], 422);
    }

    $room = DB::fetch("SELECT * FROM rooms WHERE id=?", [$request['room_id']]);
    if (!$room) jsonResponse(['ok' => false, 'message' => 'Room not found.'], 404);

    DB::execute(
        "UPDATE reservation_requests SET status='approved', reviewed_by=?, reviewed_at=NOW() WHERE id=?",
        [$_SESSION['admin_id'] ?? null, $id]
    );

    // Send email
    $mailResult = sendApprovalEmail($request, $room);

    if ($mailResult['ok']) {
        DB::execute("UPDATE reservation_requests SET notified=1 WHERE id=?", [$id]);
    }

    logActivity('APPROVE_REQUEST', 'request', $id, "Approved: {$request['requester_name']} — {$room['name']}");
    jsonResponse([
        'ok'        => true,
        'message'   => 'Request approved.',
        'emailSent' => $mailResult['ok'],
        'emailMsg'  => $mailResult['message'],
    ]);
}

function apiRejectRequest(array $input): never {
    $id     = (int)($input['id'] ?? 0);
    $reason = trim($input['reason'] ?? '');
    if (!$id) jsonResponse(['ok' => false, 'message' => 'Invalid request ID.'], 422);

    $request = DB::fetch("SELECT * FROM reservation_requests WHERE id=?", [$id]);
    if (!$request) jsonResponse(['ok' => false, 'message' => 'Request not found.'], 404);
    if ($request['status'] !== 'pending') {
        jsonResponse(['ok' => false, 'message' => 'This request has already been reviewed.'], 422);
    }

    $room = DB::fetch("SELECT * FROM rooms WHERE id=?", [$request['room_id']]);

    DB::execute(
        "UPDATE reservation_requests SET status='rejected', reject_reason=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?",
        [$reason, $_SESSION['admin_id'] ?? null, $id]
    );

    $mailResult = sendRejectionEmail($request, $room ?? ['name' => 'N/A', 'type' => ''], $reason);

    if ($mailResult['ok']) {
        DB::execute("UPDATE reservation_requests SET notified=1 WHERE id=?", [$id]);
    }

    logActivity('REJECT_REQUEST', 'request', $id, "Rejected: {$request['requester_name']}");
    jsonResponse([
        'ok'        => true,
        'message'   => 'Request rejected.',
        'emailSent' => $mailResult['ok'],
        'emailMsg'  => $mailResult['message'],
    ]);
}

function apiGetSettings(): never {
    $keys = ['smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from_name','smtp_from_email','system_name','academic_year','semester'];
    $result = [];
    foreach ($keys as $k) {
        $v = DB::getSetting($k);
        // Mask password
        $result[$k] = ($k === 'smtp_pass' && $v) ? '••••••••' : $v;
    }
    jsonResponse(['ok' => true, 'data' => $result]);
}

function apiSaveSettings(array $input): never {
    $allowed = ['smtp_host','smtp_port','smtp_user','smtp_from_name','smtp_from_email','system_name','academic_year','semester'];
    foreach ($allowed as $key) {
        if (isset($input[$key])) {
            DB::setSetting($key, trim($input[$key]));
        }
    }
    // Only update password if a real value is provided (not the masked placeholder)
    if (!empty($input['smtp_pass']) && $input['smtp_pass'] !== '••••••••') {
        DB::setSetting('smtp_pass', $input['smtp_pass']);
    }
    logActivity('SAVE_SETTINGS', 'settings', 0, 'Updated system settings');
    jsonResponse(['ok' => true, 'message' => 'Settings saved successfully.']);
}

function apiTestEmail(array $input): never {
    $toEmail = trim($input['email'] ?? '');
    if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['ok' => false, 'message' => 'Please enter a valid email address.'], 422);
    }
    $result = sendMail(
        $toEmail,
        'ACROSS-CBEA Admin',
        '✅ ACROSS-CBEA Email Test',
        '<p>This is a test email from the <strong>ACROSS-CBEA</strong> system.</p>
         <p>If you received this, your Gmail SMTP configuration is working correctly.</p>'
    );
    jsonResponse($result);
}

function apiGetLog(): never {
    $rows = DB::fetchAll("
        SELECT l.*, a.username, a.full_name
        FROM activity_log l
        LEFT JOIN admin_users a ON l.admin_id = a.id
        ORDER BY l.created_at DESC LIMIT 50
    ");
    jsonResponse(['ok' => true, 'data' => $rows]);
}
