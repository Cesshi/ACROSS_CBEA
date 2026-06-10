<?php
// ============================================================
// config/config.php — Central configuration
// ACROSS-CBEA | MMSU College of Business, Economics & Accountancy
// ============================================================

define('DB_HOST',     'localhost');
define('DB_USER',     'root');
define('DB_PASS',     '');           // Change for production
define('DB_NAME',     'across_cbea');
define('DB_CHARSET',  'utf8mb4');

define('APP_NAME',    'ACROSS-CBEA');
define('APP_URL',     'http://localhost/across_cbea');  // Change for production
define('APP_VERSION', '2.0.0');

// Session config
define('SESSION_LIFETIME', 3600);   // 1 hour

// PHPMailer paths
define('PHPMAILER_PATH', __DIR__ . '/../vendor/phpmailer/src/');

// Timezone
date_default_timezone_set('Asia/Manila');

// Error display — set to false in production
ini_set('display_errors', 1);
error_reporting(E_ALL);
