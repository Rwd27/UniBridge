<?php
/*
  UniBridge career fair booking form handler (career-fair-booking.html)
  1. Saves every request to the UniBridge Google Form, so it lands in the form's Google Sheet.
  2. Emails the same request to info@unibridge.ae, with Reply-To set to the school's email.
  The request counts as received if either step works.
*/
header('Content-Type: application/json; charset=utf-8');

$TO        = 'info@unibridge.ae';
$FROM      = 'no-reply@unibridge.ae';
$FORM_POST = 'https://docs.google.com/forms/d/e/1FAIpQLScwdfw-QoyGu3mMZ7LI7uhAjn40d1e2Dix3QyNVHi0dkqBQ5w/formResponse';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok' => false]); exit; }
if (!empty($_POST['bot-field'])) { echo json_encode(['ok' => true]); exit; }

function txt($k, $max = 300) { return mb_substr(trim(preg_replace('/\s+/u', ' ', strip_tags((string)($_POST[$k] ?? '')))), 0, $max); }
function para($k, $max = 3000) { return mb_substr(trim(strip_tags((string)($_POST[$k] ?? ''))), 0, $max); }
function pick($k, $allowed) { $v = trim((string)($_POST[$k] ?? '')); return in_array($v, $allowed, true) ? $v : ''; }
function picks($k, $allowed) { $v = $_POST[$k] ?? []; if (!is_array($v)) $v = [$v]; return array_values(array_intersect($allowed, array_map('trim', $v))); }
function day($k) { $v = trim((string)($_POST[$k] ?? '')); return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) && checkdate((int)$m[2], (int)$m[3], (int)$m[1]) ? $m : null; }

// Options must match the Google Form exactly
$O = [
  'country'      => ['UAE', 'NON-UAE'],
  'curriculum'   => ['CBSE / ICSE', 'British (IGCSE / A-Levels)', 'IB (International Baccalaureate)', 'American', 'Ministry of Education (MOE)', 'Other'],
  'format'       => ['Morning Session (During School Hours — Students Only)', 'Afternoon / Evening Session (Students & Parents)', 'Full-Day Exhibition', 'Saturday / Weekend Fair (Students & Parents)'],
  'grades'       => ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'All of the above'],
  'students'     => ['100 – 250 students', '250 – 500 students', '500+ students'],
  'venue'        => ['Multipurpose Hall / Auditorium', 'Indoor Sports Complex / Gymnasium', 'Shaded Courtyard / Outdoor Area', 'Other'],
  'destinations' => ['UAE (Local & International Branch Campuses)', 'India', 'United Kingdom & Europe (Universities in UAE)', 'USA & Canada (Universities in UAE)', 'Australia, Malaysia & Singapore (Universities in UAE)', 'Other'],
  'streams'      => ['Business, Finance, Commerce & ACCA', 'Engineering, Computer Science & AI', 'Medicine, Healthcare & Life Sciences', 'Design, Media, Visual Communication & Arts', 'Law, Humanities & Psychology', 'All of the above'],
];

$d = [
  'school'       => txt('school'),
  'country'      => pick('country', $O['country']),
  'curriculum'   => picks('curriculum', $O['curriculum']),
  'name'         => txt('name'),
  'designation'  => txt('designation'),
  'email'        => filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL) ?: '',
  'phone'        => txt('phone', 60),
  'format'       => pick('format', $O['format']),
  'date1'        => day('date1'),
  'date2'        => day('date2'),
  'grades'       => picks('grades', $O['grades']),
  'students'     => pick('students', $O['students']),
  'venue'        => pick('venue', $O['venue']),
  'destinations' => picks('destinations', $O['destinations']),
  'universities' => para('universities'),
  'streams'      => picks('streams', $O['streams']),
  'notes'        => para('notes'),
];

$missing = [];
foreach (['school', 'country', 'name', 'designation', 'email', 'phone', 'format', 'date1', 'students', 'venue'] as $k) if (empty($d[$k])) $missing[] = $k;
foreach (['curriculum', 'grades'] as $k) if (!count($d[$k])) $missing[] = $k;
if ($missing) { http_response_code(422); echo json_encode(['ok' => false, 'missing' => $missing]); exit; }

/* 1. Google Form (goes to the linked Google Sheet) */
$q = [
  'entry.1002349644' => $d['school'],
  'entry.929435747'  => $d['country'],
  'entry.295791328'  => $d['name'],
  'entry.1487617758' => $d['designation'],
  'entry.456866728'  => $d['email'],
  'entry.1015124986' => $d['phone'],
  'entry.305746901'  => $d['format'],
  'entry.297407892_year' => $d['date1'][1], 'entry.297407892_month' => $d['date1'][2], 'entry.297407892_day' => $d['date1'][3],
  'entry.1158562185' => $d['students'],
  'entry.601409790'  => $d['venue'],
  'entry.1358625761' => $d['universities'],
  'entry.1687951245' => $d['notes'],
  'pageHistory'      => '0,1,2',
];
if ($d['date2']) { $q['entry.925663193_year'] = $d['date2'][1]; $q['entry.925663193_month'] = $d['date2'][2]; $q['entry.925663193_day'] = $d['date2'][3]; }
$body = http_build_query($q);
foreach (['1614048705' => 'curriculum', '1733491144' => 'grades', '1501605283' => 'destinations', '1834716043' => 'streams'] as $id => $k)
  foreach ($d[$k] as $v) $body .= '&' . rawurlencode("entry.$id") . '=' . rawurlencode($v);

$sheet_ok = false;
if (function_exists('curl_init')) {
  $ch = curl_init($FORM_POST);
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded; charset=utf-8']]);
  $resp = (string)curl_exec($ch);
  // Google answers 200 even when it rejects an answer, so look for its confirmation page
  $sheet_ok = curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200 && preg_match('/form_confirm|Submit another response|response has been recorded/i', $resp);
  curl_close($ch);
}

/* 2. Email to info@unibridge.ae */
$fmt = function ($m) { return $m ? date('j M Y', mktime(0, 0, 0, (int)$m[2], (int)$m[3], (int)$m[1])) : ''; };
$rows = [
  'SCHOOL AND COORDINATOR' => null,
  'School' => $d['school'], 'Country' => $d['country'], 'Curriculum' => implode(', ', $d['curriculum']),
  'Contact person' => $d['name'], 'Designation' => $d['designation'], 'Email' => $d['email'], 'Phone / WhatsApp' => $d['phone'],
  'EVENT PREFERENCES' => null,
  'Fair format' => $d['format'], 'First preferred date' => $fmt($d['date1']), 'Backup date' => $fmt($d['date2']),
  'Grades attending' => implode(', ', $d['grades']), 'Estimated students' => $d['students'], 'Venue on campus' => $d['venue'],
  'UNIVERSITY LINEUP AND REQUESTS' => null,
  'Priority study destinations' => implode(', ', $d['destinations']), 'Academic streams' => implode(', ', $d['streams']),
  'Specific university requests' => $d['universities'], 'Additional notes' => $d['notes'],
];
$lines = [];
foreach ($rows as $label => $val) {
  if ($val === null) { $lines[] = "\n$label"; continue; }
  if ($val !== '') $lines[] = "$label: $val";
}
$extra = [];
foreach (['utm_source' => 'Campaign source', 'utm_medium' => 'Campaign medium', 'utm_campaign' => 'Campaign name', 'gclid' => 'Google Ads click ID', 'fbclid' => 'Meta click ID', 'landing_page' => 'First page visited', 'referrer' => 'Came from'] as $k => $label)
  if (txt($k) !== '') $extra[] = "$label: " . txt($k);
if ($extra) $lines[] = "\nWHERE THEY CAME FROM\n" . implode("\n", $extra);
$lines[] = "\nSaved to Google Sheet: " . ($sheet_ok ? 'yes' : 'NO, please add this request to the sheet by hand');
$lines[] = 'Received ' . date('j M Y, H:i') . ' (server time)';

$subject = 'Career fair booking request: ' . $d['school'];
$headers  = "From: UniBridge Website <$FROM>\r\nReply-To: {$d['email']}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
$mail_ok = mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', ltrim(implode("\n", $lines)), $headers, '-f' . $FROM);

$ok = $sheet_ok || $mail_ok;
http_response_code($ok ? 200 : 500);
echo json_encode(['ok' => $ok, 'sheet' => (bool)$sheet_ok, 'mail' => (bool)$mail_ok]);
