<?php
ini_set('display_errors', 0); error_reporting(0);
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed.']); exit();
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

// ── CONFIRM IMPORT ────────────────────────────
if (strpos($contentType, 'application/json') !== false) {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $rows = $body['rows'] ?? [];
    if (empty($rows)) { http_response_code(400); echo json_encode(['error' => 'No rows to import.']); exit(); }

    $conn = getConnection();
    $inserted = 0; $skipped = 0; $errors = [];

    // Preload valid room names once, to avoid a foreign key crash per row
    $validRooms = [];
    $rr = $conn->query('SELECT name FROM rooms');
    while ($rrow = $rr->fetch_assoc()) { $validRooms[$rrow['name']] = true; }

    foreach ($rows as $i => $row) {
        $prof  = trim($row['prof']  ?? '');
        $subj  = trim($row['subj']  ?? '');
        $group = trim($row['group'] ?? '');
        $room  = trim($row['room']  ?? '');
        $day   = trim($row['day']   ?? '');
        $time  = trim($row['time']  ?? '');
        $notes = trim($row['notes'] ?? '');
        $email = '';

        if (!$prof || !$subj || !$room || !$day || !$time) {
            $skipped++; $errors[] = "Row $i skipped: missing fields."; continue;
        }

        if (!isset($validRooms[$room])) {
            $skipped++; $errors[] = "Row $i skipped: room \"$room\" is not registered in the system. Add it via Rooms first."; continue;
        }

        $ck = $conn->prepare('SELECT id FROM reservations WHERE room=? AND day=? AND time_slot=? AND status="approved"');
        $ck->bind_param('sss', $room, $day, $time);
        $ck->execute(); $ck->store_result();
        if ($ck->num_rows > 0) {
            $ck->close(); $skipped++; $errors[] = "Row $i skipped: conflict at $room $day $time."; continue;
        }
        $ck->close();

        try {
            $stmt = $conn->prepare('INSERT INTO reservations (prof, subj, `group`, email, room, day, time_slot, notes, status, action_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "approved", NOW())');
            $stmt->bind_param('ssssssss', $prof, $subj, $group, $email, $room, $day, $time, $notes);
            $stmt->execute();
            $stmt->close();
            $inserted++;
        } catch (mysqli_sql_exception $e) {
            $skipped++; $errors[] = "Row $i skipped: " . $e->getMessage();
        }
    }
    $conn->close();
    echo json_encode(['success' => true, 'inserted' => $inserted, 'skipped' => $skipped, 'errors' => $errors]);
    exit();
}

// ── FILE UPLOAD ───────────────────────────────
if (empty($_FILES['file'])) {
    http_response_code(400); echo json_encode(['error' => 'No file uploaded.']); exit();
}

$file    = $_FILES['file'];
$ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$tmpPath = $file['tmp_name'];

if (!in_array($ext, ['xlsx', 'csv'])) {
    http_response_code(400); echo json_encode(['error' => 'Only .xlsx or .csv files supported. Please save your Excel file as .xlsx first.']); exit();
}

// ── PARSE XLSX USING PHP ZIP + XML (no Python needed) ──
function parseXlsx($path) {
    $rows = [];
    $zip  = new ZipArchive();
    if ($zip->open($path) !== true) return ['error' => 'Cannot open file.'];

    // Read shared strings
    $strings = [];
    $ssXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($ssXml) {
        $ss = simplexml_load_string($ssXml);
        foreach ($ss->si as $si) {
            // Get all text nodes concatenated
            $t = '';
            foreach ($si->r as $r) { $t .= (string)($r->t ?? ''); }
            if (!$t) $t = (string)($si->t ?? '');
            $strings[] = $t;
        }
    }

    // Read sheet1
    $shXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    if (!$shXml) return ['error' => 'Cannot read sheet1.'];

    $sh = simplexml_load_string($shXml);
    $ns = $sh->getNamespaces(true);
    $sh->registerXPathNamespace('x', reset($ns) ?: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

    // Parse rows
    foreach ($sh->sheetData->row as $row) {
        $rowData = [];
        $lastCol = 0;
        foreach ($row->c as $cell) {
            // Get column index from reference like "A1" -> 0, "B1" -> 1
            $ref = (string)$cell['r'];
            preg_match('/([A-Z]+)/', $ref, $m);
            $colLetters = $m[1] ?? 'A';
            $colIdx = 0;
            $len = strlen($colLetters);
            for ($i = 0; $i < $len; $i++) {
                $colIdx = $colIdx * 26 + (ord($colLetters[$i]) - ord('A') + 1);
            }
            $colIdx--; // 0-based

            // Fill gaps with empty strings
            while ($lastCol < $colIdx) { $rowData[] = ''; $lastCol++; }

            $type  = (string)$cell['t'];
            $value = (string)$cell->v;

            if ($type === 's') {
                $value = $strings[(int)$value] ?? '';
            } elseif ($type === 'str' || $type === 'inlineStr') {
                $value = (string)($cell->is->t ?? $cell->v ?? '');
            }

            $rowData[] = trim($value);
            $lastCol++;
        }
        $rows[] = $rowData;
    }

    return $rows;
}

function parseCsv($path) {
    $rows = [];
    if (($h = fopen($path, 'r')) !== false) {
        while (($row = fgetcsv($h)) !== false) {
            $rows[] = array_map('trim', $row);
        }
        fclose($h);
    }
    return $rows;
}

// Parse the file
$parsed = $ext === 'csv' ? parseCsv($tmpPath) : parseXlsx($tmpPath);

if (!is_array($parsed) || isset($parsed['error'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not parse file: ' . ($parsed['error'] ?? 'Unknown error')]);
    exit();
}

if (empty($parsed)) {
    http_response_code(422);
    echo json_encode(['error' => 'File appears to be empty.']);
    exit();
}

// ── GET ROOMS FROM DB ─────────────────────────
$conn      = getConnection();
$roomNames = [];
$res       = $conn->query('SELECT name FROM rooms ORDER BY name');
while ($r = $res->fetch_assoc()) $roomNames[] = $r['name'];
$conn->close();

$restricted = ['THM Extension Building 3rd Floor','BAR ROOM','KL1','KL2','AVR CBEA','READING CENTER'];

$dayMap = [
    'MWF'=>'MWF','TTH'=>'TTH','SAT'=>'SAT','TH'=>'TH',
    'MW'=>'MW','MF'=>'MF','WF'=>'WF',
    'M'=>'M','T'=>'T','W'=>'W','F'=>'F',
    'MTWTHF'=>'MWF','TTHS'=>'TTH',
    'MON'=>'M','TUE'=>'T','WED'=>'W','THU'=>'TH','FRI'=>'F',
    'MONDAY'=>'M','TUESDAY'=>'T','WEDNESDAY'=>'W','THURSDAY'=>'TH','FRIDAY'=>'F','SATURDAY'=>'SAT',
];

function fuzzyRoom($input, $roomNames) {
    $input = trim($input);
    if (!$input) return ['room' => '', 'found' => false];
    foreach ($roomNames as $r) {
        if (strcasecmp($r, $input) === 0) return ['room' => $r, 'found' => true];
    }
    foreach ($roomNames as $r) {
        if (stripos($r, $input) !== false || stripos($input, $r) !== false)
            return ['room' => $r, 'found' => true];
    }
    $inputNorm = preg_replace('/\s+/', ' ', strtoupper(trim($input)));
    foreach ($roomNames as $r) {
        $rNorm = preg_replace('/\s+/', ' ', strtoupper(trim($r)));
        if ($inputNorm === $rNorm) return ['room' => $r, 'found' => true];
    }
    return ['room' => $input, 'found' => false];
}

function normalizeDay($input, $dayMap) {
    $clean = strtoupper(trim(preg_replace('/\s+/','',$input)));
    if (isset($dayMap[$clean])) return ['day' => $dayMap[$clean], 'found' => true];
    return ['day' => $clean ?: '?', 'found' => false];
}

// ── DETECT HEADER ROW ─────────────────────────
$headerIdx = -1;
$colMap    = [];

foreach ($parsed as $i => $row) {
    $rowLower = array_map('strtolower', $row);
    $hits = 0;
    foreach (['time','day','faculty','course'] as $kw) {
        foreach ($rowLower as $cell) {
            if (strpos($cell, $kw) !== false) { $hits++; break; }
        }
    }
    if ($hits >= 3) {
        $headerIdx = $i;
        foreach ($rowLower as $ci => $cell) {
            if (strpos($cell,'faculty') !== false)                                       $colMap['faculty']      = $ci;
            elseif (strpos($cell,'course code') !== false)                               $colMap['course_code']  = $ci;
            elseif (strpos($cell,'course title') !== false)                              $colMap['course_title'] = $ci;
            elseif (strpos($cell,'course') !== false && !isset($colMap['course']))       $colMap['course']       = $ci;
            elseif (strpos($cell,'year') !== false)                                      $colMap['year']         = $ci;
            elseif (strpos($cell,'section') !== false)                                   $colMap['section']      = $ci;
            elseif (strpos($cell,'bldg') !== false || strpos($cell,'room') !== false)    $colMap['room']         = $ci;
            elseif (strpos($cell,'time') !== false)                                      $colMap['time']         = $ci;
            elseif (strpos($cell,'day') !== false)                                       $colMap['day']          = $ci;
        }
        break;
    }
}

if ($headerIdx === -1) {
    http_response_code(422);
    echo json_encode(['error' => 'Could not detect header row. Expected columns: Course, Year, Section, Course Code, Time, Day, Bldg & Room, Faculty.', 'debug_first_rows' => array_slice($parsed, 0, 3)]);
    exit();
}

// ── PARSE DATA ROWS ───────────────────────────
$rows = [];
$lastCourse = ''; $lastYear = ''; $lastSection = '';

for ($i = $headerIdx + 1; $i < count($parsed); $i++) {
    $row = $parsed[$i];
    if (!array_filter($row)) continue;

    $course  = isset($colMap['course'])      ? ($row[$colMap['course']] ?? '')      : '';
    $year    = isset($colMap['year'])        ? ($row[$colMap['year']] ?? '')         : '';
    $section = isset($colMap['section'])     ? ($row[$colMap['section']] ?? '')      : '';
    $ccode   = isset($colMap['course_code']) ? ($row[$colMap['course_code']] ?? '')  : '';
    $time    = isset($colMap['time'])        ? ($row[$colMap['time']] ?? '')         : '';
    $day     = isset($colMap['day'])         ? ($row[$colMap['day']] ?? '')          : '';
    $roomRaw = isset($colMap['room'])        ? ($row[$colMap['room']] ?? '')         : '';
    $faculty = isset($colMap['faculty'])     ? ($row[$colMap['faculty']] ?? '')      : '';

    $course = trim($course); $year = trim($year); $section = trim($section);
    $ccode  = trim($ccode);  $time = trim($time); $day     = trim($day);
    $roomRaw= trim($roomRaw);$faculty = trim($faculty);

    if ($course)  $lastCourse  = $course;  else $course  = $lastCourse;
    if ($year)    $lastYear    = $year;    else $year    = $lastYear;
    if ($section) $lastSection = $section; else $section = $lastSection;

    // Skip sub-header or empty data rows
    if (!$ccode && !$time && !$faculty) continue;
    if (strtolower($ccode) === 'lec' || strtolower($ccode) === 'lab') continue;

    // Skip restricted rooms
    $skipRoom = false;
    foreach ($restricted as $rr) {
        if (stripos($roomRaw, $rr) !== false) { $skipRoom = true; break; }
    }

    $roomResult = fuzzyRoom($roomRaw, $roomNames);
    $dayResult  = normalizeDay($day, $dayMap);
    $group      = trim("$course $year" . ($section ? "-$section" : ''));

    $missingFields = [];
    if (!$faculty) $missingFields[] = 'Faculty name';
    if (!$ccode)   $missingFields[] = 'Course code';
    if (!$time)    $missingFields[] = 'Time';
    if (!$day)     $missingFields[] = 'Day';

    $flagged = false; $flagReason = '';
    if (!empty($missingFields)) {
        $flagged = true;
        $flagReason = 'Missing: ' . implode(', ', $missingFields);
    } elseif ($skipRoom) {
        $flagged = true; $flagReason = 'Restricted room excluded';
    } elseif (!$roomResult['found']) {
        $flagged = true; $flagReason = "Room not in system: $roomRaw";
    } elseif (!$dayResult['found']) {
        $flagged = true; $flagReason = "Unknown day pattern: $day";
    }

    $rows[] = [
        'prof'        => $faculty,
        'subj'        => $ccode,
        'group'       => $group,
        'room'        => $roomResult['room'],
        'day'         => $dayResult['day'],
        'time'        => $time,
        'notes'       => '',
        'flagged'     => $flagged,
        'flag_reason' => $flagReason,
        'conflict'    => false,
    ];
}

if (empty($rows)) {
    http_response_code(422);
    echo json_encode(['error' => 'No data rows could be extracted. Make sure the file has data below the header row.', 'header_found_at_row' => $headerIdx, 'col_map' => $colMap]);
    exit();
}

echo json_encode(['success' => true, 'rows' => $rows, 'ai' => false]);