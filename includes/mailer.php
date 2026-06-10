<?php
// ============================================================
// includes/mailer.php — Gmail SMTP mailer via PHPMailer
// ============================================================
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/db.php';
require_once PHPMAILER_PATH . 'Exception.php';
require_once PHPMAILER_PATH . 'PHPMailer.php';
require_once PHPMAILER_PATH . 'SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Send an email using settings from the DB settings table.
 *
 * @param string $toEmail    Recipient email
 * @param string $toName     Recipient display name
 * @param string $subject    Email subject
 * @param string $htmlBody   HTML email body
 * @return array{ok:bool, message:string}
 */
function sendMail(string $toEmail, string $toName, string $subject, string $htmlBody): array {
    $host      = DB::getSetting('smtp_host')      ?: 'smtp.gmail.com';
    $port      = (int)(DB::getSetting('smtp_port') ?: 587);
    $user      = DB::getSetting('smtp_user');
    $pass      = DB::getSetting('smtp_pass');
    $fromEmail = DB::getSetting('smtp_from_email') ?: $user;
    $fromName  = DB::getSetting('smtp_from_name')  ?: 'CBEA Scheduling Office';

    if (empty($user) || empty($pass)) {
        return ['ok' => false, 'message' => 'SMTP credentials not configured. Go to Admin → Settings to set your Gmail credentials.'];
    }

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = $host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $user;
        $mail->Password   = $pass;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $port;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($toEmail, $toName);
        $mail->addReplyTo($fromEmail, $fromName);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = wrapEmailTemplate($htmlBody, $subject);
        $mail->AltBody = strip_tags($htmlBody);

        $mail->send();
        return ['ok' => true, 'message' => 'Email sent successfully.'];
    } catch (Exception $e) {
        return ['ok' => false, 'message' => 'Mailer error: ' . $mail->ErrorInfo];
    }
}

/**
 * Send approval notification email.
 */
function sendApprovalEmail(array $request, array $room): array {
    $subject = "✅ Classroom Reservation Approved — {$room['name']}";
    $date    = date('F j, Y', strtotime($request['request_date']));
    $start   = date('g:i A', strtotime($request['start_time']));
    $end     = date('g:i A', strtotime($request['end_time']));

    $body = "
    <h2 style='color:#1a6b3f;margin-bottom:4px'>Reservation Approved</h2>
    <p style='color:#4a5568;margin-bottom:24px'>Dear <strong>{$request['requester_name']}</strong>,</p>
    <p>We are pleased to inform you that your classroom reservation request has been <strong style='color:#1a6b3f'>approved</strong>.</p>

    <table style='width:100%;border-collapse:collapse;margin:20px 0;border-radius:10px;overflow:hidden'>
      <tr style='background:#1a6b3f'>
        <th style='color:#fff;padding:12px 16px;text-align:left;font-size:12px;letter-spacing:.05em;text-transform:uppercase' colspan='2'>Reservation Details</th>
      </tr>
      <tr style='background:#f8fffe'>
        <td style='padding:12px 16px;font-weight:600;color:#4a5568;width:140px'>Room</td>
        <td style='padding:12px 16px;color:#1a2030'>{$room['name']} — {$room['type']}</td>
      </tr>
      <tr style='background:#fff'>
        <td style='padding:12px 16px;font-weight:600;color:#4a5568'>Date</td>
        <td style='padding:12px 16px;color:#1a2030'>{$date}</td>
      </tr>
      <tr style='background:#f8fffe'>
        <td style='padding:12px 16px;font-weight:600;color:#4a5568'>Time</td>
        <td style='padding:12px 16px;color:#1a2030'>{$start} – {$end}</td>
      </tr>
      <tr style='background:#fff'>
        <td style='padding:12px 16px;font-weight:600;color:#4a5568'>Purpose</td>
        <td style='padding:12px 16px;color:#1a2030'>{$request['purpose']}</td>
      </tr>
    </table>

    <p style='color:#4a5568'>Please be reminded to observe proper use of the facility and to vacate the room promptly after the scheduled time. Kindly coordinate with the CBEA office for any concerns.</p>
    <p style='margin-top:20px;color:#4a5568'>Thank you for using the ACROSS-CBEA Reservation System.</p>
    ";

    return sendMail($request['requester_email'], $request['requester_name'], $subject, $body);
}

/**
 * Send rejection notification email.
 */
function sendRejectionEmail(array $request, array $room, string $reason = ''): array {
    $subject = "❌ Classroom Reservation — Request Not Approved";
    $date    = date('F j, Y', strtotime($request['request_date']));
    $start   = date('g:i A', strtotime($request['start_time']));
    $end     = date('g:i A', strtotime($request['end_time']));
    $reasonHtml = $reason
        ? "<tr style='background:#fff8f8'><td style='padding:12px 16px;font-weight:600;color:#4a5568'>Reason</td><td style='padding:12px 16px;color:#c53030'>{$reason}</td></tr>"
        : '';

    $body = "
    <h2 style='color:#c53030;margin-bottom:4px'>Reservation Not Approved</h2>
    <p style='color:#4a5568;margin-bottom:24px'>Dear <strong>{$request['requester_name']}</strong>,</p>
    <p>We regret to inform you that your classroom reservation request has not been approved at this time.</p>

    <table style='width:100%;border-collapse:collapse;margin:20px 0;border-radius:10px;overflow:hidden'>
      <tr style='background:#c53030'>
        <th style='color:#fff;padding:12px 16px;text-align:left;font-size:12px;letter-spacing:.05em;text-transform:uppercase' colspan='2'>Request Details</th>
      </tr>
      <tr style='background:#f8fffe'>
        <td style='padding:12px 16px;font-weight:600;color:#4a5568;width:140px'>Room</td>
        <td style='padding:12px 16px;color:#1a2030'>{$room['name']}</td>
      </tr>
      <tr style='background:#fff'>
        <td style='padding:12px 16px;font-weight:600;color:#4a5568'>Date</td>
        <td style='padding:12px 16px;color:#1a2030'>{$date}</td>
      </tr>
      <tr style='background:#f8fffe'>
        <td style='padding:12px 16px;font-weight:600;color:#4a5568'>Time</td>
        <td style='padding:12px 16px;color:#1a2030'>{$start} – {$end}</td>
      </tr>
      {$reasonHtml}
    </table>

    <p style='color:#4a5568'>You are welcome to submit a new request for a different date or time. If you have questions, please contact the CBEA Scheduling Office directly.</p>
    <p style='margin-top:20px;color:#4a5568'>We apologize for any inconvenience this may have caused.</p>
    ";

    return sendMail($request['requester_email'], $request['requester_name'], $subject, $body);
}

/**
 * Wrap email content in a branded HTML template.
 */
function wrapEmailTemplate(string $content, string $title): string {
    $year = date('Y');
    return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>{$title}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b3f 0%,#2d8a55 100%);padding:28px 40px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-.3px">ACROSS-CBEA</div>
            <div style="font-size:11px;color:rgba(255,255,255,.75);letter-spacing:.06em;text-transform:uppercase;margin-top:4px">
              Academic Classroom Reservation &amp; Scheduling System
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,.55);margin-top:2px">
              College of Business, Economics &amp; Accountancy — MMSU
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;color:#1a2030;font-size:14px;line-height:1.7">
            {$content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e2e6ea">
            <p style="font-size:11px;color:#8a97a8;margin:0">
              This is an automated message from the CBEA Scheduling System.<br>
              Mariano Marcos State University — College of Business, Economics &amp; Accountancy<br>
              &copy; {$year} MMSU-CBEA. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
}
