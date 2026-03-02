<?php
/**
 * Contact Form Handler — Elevated Minds
 * Sends form submissions directly to WhatsApp via Twilio API
 * OR via WhatsApp Cloud API (Meta)
 *
 * Choose ONE method below and configure it.
 */

// ─── Configuration ────────────────────────────────────────────────────────────
$adminEmail    = 'your@email.com';
$adminName     = 'Elevated Minds';
$successMsg    = 'Thank you! We will get back to you shortly.';
$errorMsg      = 'Something went wrong. Please try again later.';

// ─── YOUR WhatsApp Business Number (with country code, no + or spaces) ────────
// e.g. for +91 9172965369 → '919172965369'
$whatsappNumber = '919172965369';   // ← Change this to your WhatsApp number

// ══════════════════════════════════════════════════════════════════════════════
//  CHOOSE YOUR METHOD:
//  'callmebot'   → CallMeBot (completely free, no account needed, simplest)
//  'twilio'      → Twilio WhatsApp API  (easiest paid, free sandbox available)
//  'meta'        → Meta WhatsApp Cloud API (free 1000 msgs/month)
// ══════════════════════════════════════════════════════════════════════════════
$whatsappMethod = 'callmebot';   // ← Change to 'twilio' or 'meta' if preferred

// ── CallMeBot Config (free, no account needed) ────────────────────────────────
// Steps to activate:
//  1. Save +34 644 52 74 21 as a contact named "CallMeBot"
//  2. Send this exact message to that number on WhatsApp:
//     "I allow callmebot to send me messages"
//  3. You will receive your API key in reply — paste it below
$callmebotApiKey = 'YOUR_CALLMEBOT_API_KEY';   // ← Paste your key here

// ── Twilio Config ─────────────────────────────────────────────────────────────
// Sign up at: https://www.twilio.com
// Get credentials at: https://console.twilio.com
$twilioAccountSid  = 'YOUR_TWILIO_ACCOUNT_SID';
$twilioAuthToken   = 'YOUR_TWILIO_AUTH_TOKEN';
$twilioFromNumber  = 'whatsapp:+14155238886';  // Twilio sandbox number (change for production)

// ── Meta WhatsApp Cloud API Config ────────────────────────────────────────────
// 1. Go to https://developers.facebook.com/apps
// 2. Create an app → Add WhatsApp product
// 3. Copy your Access Token and Phone Number ID below
$metaAccessToken   = 'YOUR_META_ACCESS_TOKEN';
$metaPhoneNumberId = 'YOUR_PHONE_NUMBER_ID';

// ─── CORS / Headers ───────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ─── Sanitize Helper ──────────────────────────────────────────────────────────
function sanitize(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

// ─── Collect & Sanitize Input ─────────────────────────────────────────────────
$parentName = sanitize($_POST['ParentName'] ?? '');
$childAge   = sanitize($_POST['ChildAge']   ?? '');
$phone      = sanitize($_POST['Number']     ?? '');
$service    = sanitize($_POST['service']    ?? '');
$message    = sanitize($_POST['Message']    ?? '');

// ─── Server-Side Validation ───────────────────────────────────────────────────
$errors = [];

if (!preg_match("/^[A-Za-z\s.'\-]{2,}$/", $parentName)) {
    $errors['ParentName'] = 'Name must contain letters only (no numbers or special characters).';
}
if (!preg_match('/^\d+$/', $childAge) || (int)$childAge < 1 || (int)$childAge > 18) {
    $errors['ChildAge'] = 'Age must be a whole number between 1 and 18.';
}
if (!preg_match('/^[6-9]\d{9}$/', $phone)) {
    $errors['Number'] = 'Please enter a valid 10-digit Indian mobile number.';
}
$allowedServices = ['early-learning', 'adhd-support', 'counseling', 'iq-testing', 'other'];
if (!in_array($service, $allowedServices, true)) {
    $errors['service'] = 'Please select a valid service.';
}
if (mb_strlen($message) < 10) {
    $errors['Message'] = 'Please write a message (at least 10 characters).';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// ─── Service Label Map ────────────────────────────────────────────────────────
$serviceLabels = [
    'early-learning' => 'After School Activities',
    'adhd-support'   => 'ADHD Support',
    'counseling'     => 'Counseling',
    'iq-testing'     => 'IQ / LD Testing',
    'other'          => 'Other',
];
$serviceLabel = $serviceLabels[$service] ?? $service;

// ─── Build WhatsApp Message ────────────────────────────────────────────────────
$waMessage = "🌟 *New Inquiry — Elevated Minds*\n\n"
           . "👤 *Parent Name:* $parentName\n"
           . "🧒 *Child's Age:* $childAge year(s)\n"
           . "📞 *Phone:* $phone\n"
           . "📚 *Service:* $serviceLabel\n\n"
           . "💬 *Message:*\n$message\n\n"
           . "🕐 " . date('d M Y, h:i A');

// ─── Send WhatsApp Message ────────────────────────────────────────────────────
$sent = false;

// ════════════════════════════════
//  METHOD 1: CallMeBot (Simplest — Free)
// ════════════════════════════════
if ($whatsappMethod === 'callmebot') {

    $encodedMsg = urlencode($waMessage);
    $url = "https://api.callmebot.com/whatsapp.php"
         . "?phone={$whatsappNumber}"
         . "&text={$encodedMsg}"
         . "&apikey={$callmebotApiKey}";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response   = curl_exec($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // CallMeBot returns 200 and "Message queued" on success
    $sent = ($httpStatus === 200 && stripos($response, 'Message queued') !== false);
}

// ════════════════════════════════
//  METHOD 2: Twilio
// ════════════════════════════════
elseif ($whatsappMethod === 'twilio') {

    $toNumber = "whatsapp:+{$whatsappNumber}";
    $url      = "https://api.twilio.com/2010-04-01/Accounts/{$twilioAccountSid}/Messages.json";

    $postData = http_build_query([
        'From' => $twilioFromNumber,
        'To'   => $toNumber,
        'Body' => $waMessage,
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postData,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_USERPWD        => "{$twilioAccountSid}:{$twilioAuthToken}",
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response   = curl_exec($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);
    $sent   = ($httpStatus === 201 && isset($result['sid']));
}

// ════════════════════════════════
//  METHOD 3: Meta WhatsApp Cloud API
// ════════════════════════════════
elseif ($whatsappMethod === 'meta') {

    $url     = "https://graph.facebook.com/v19.0/{$metaPhoneNumberId}/messages";
    $payload = json_encode([
        'messaging_product' => 'whatsapp',
        'to'                => $whatsappNumber,
        'type'              => 'text',
        'text'              => ['body' => $waMessage],
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            "Authorization: Bearer {$metaAccessToken}",
            "Content-Type: application/json",
        ],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response   = curl_exec($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);
    $sent   = ($httpStatus === 200 && isset($result['messages'][0]['id']));
}

// ─── Fallback: also send email (optional — remove block if not needed) ────────
$emailBody    = "New Inquiry from $parentName\n\n"
              . "Parent Name  : $parentName\n"
              . "Child's Age  : $childAge year(s)\n"
              . "Phone        : $phone\n"
              . "Service      : $serviceLabel\n\n"
              . "Message:\n$message\n\n"
              . "Submitted on: " . date('d M Y, h:i A');
$emailHeaders = "From: $adminName <$adminEmail>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
mail($adminEmail, "[Elevated Minds] New Inquiry from $parentName", $emailBody, $emailHeaders);

// ─── Respond to browser ───────────────────────────────────────────────────────
// We return success either way since the email backup was also sent.
// To make WhatsApp delivery required, swap the blocks below.
http_response_code(200);
echo json_encode(['success' => true, 'message' => $successMsg]);