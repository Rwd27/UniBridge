<?php
/*
  UniBridge form handler
  Emails every website form (enquiry, university partner, event sign-up) to info@unibridge.ae.
  Needs PHP with mail() enabled, which is standard on cPanel and Plesk hosting.
  If your host does not send mail, see README.txt ("Forms").
*/
header('Content-Type: application/json; charset=utf-8');

$TO   = 'info@unibridge.ae';
$FROM = 'no-reply@unibridge.ae';   // must be an address on your own domain

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok' => false]); exit; }

// Spam trap: real visitors never fill this hidden field
if (!empty($_POST['bot-field'])) { echo json_encode(['ok' => true]); exit; }

function one_line($v) { return trim(preg_replace('/[\r\n]+/', ' ', strip_tags((string)$v))); }

$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
if (!$email) { http_response_code(422); echo json_encode(['ok' => false, 'error' => 'email']); exit; }

$form = one_line($_POST['form-name'] ?? 'inquiry');
$subjects = [
  'inquiry' => 'New website enquiry',
  'partner' => 'New university partner enquiry',
  'notify'  => 'New sign-up for event updates',
];
$subject = ($subjects[$form] ?? 'New website message') . ' - UniBridge';

$labels = [
  'name' => 'Name', 'email' => 'Email', 'phone' => 'Phone', 'audience' => 'I am', 'institution' => 'Institution',
  'school' => 'School or institution', 'country' => 'Country', 'message' => 'Message', 'consent' => 'Consent given',
  'utm_source' => 'Campaign source', 'utm_medium' => 'Campaign medium', 'utm_campaign' => 'Campaign name',
  'utm_term' => 'Campaign keyword', 'utm_content' => 'Campaign content', 'gclid' => 'Google Ads click ID',
  'fbclid' => 'Meta click ID', 'landing_page' => 'First page visited', 'referrer' => 'Came from', 'page' => 'Sent from page',
];
$lines = [];
foreach ($_POST as $k => $v) {
  if (in_array($k, ['bot-field', 'form-name'], true)) continue;
  if (is_array($v)) $v = implode(', ', $v);
  $val = ($k === 'message') ? trim(strip_tags((string)$v)) : one_line($v);
  if ($val === '') continue;
  $label = $labels[$k] ?? ucfirst(str_replace(['-', '_'], ' ', $k));
  $lines[] = ($k === 'message') ? "\n$label:\n$val\n" : "$label: $val";
}
$body = implode("\n", $lines) . "\n\nReceived " . date('j M Y, H:i') . " (server time)";

$headers  = "From: UniBridge Website <$FROM>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";

$ok = mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $FROM);
http_response_code($ok ? 200 : 500);
echo json_encode(['ok' => (bool)$ok]);
