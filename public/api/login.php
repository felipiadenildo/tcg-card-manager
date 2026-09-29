<?php
require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/auth.php';


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

// The front end sends JSON, not a form-encoded body, so this reads the raw
// request body instead of relying on $_POST.
$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email and password are required.']);
    exit;
}

$pdo = getConnection();
$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Same message either way, so a failed attempt never reveals whether that
// email exists in the first place.
if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Invalid email or password.']);
    exit;
}

// A new session id after a successful login, so nothing tied to whatever
// session existed before authenticating carries over.
session_regenerate_id(true);
$_SESSION['user_id'] = $user['id'];

echo json_encode(['ok' => true, 'data' => ['email' => $email]]);
