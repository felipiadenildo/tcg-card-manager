<?php
require_once __DIR__ . '/../../config/auth.php';

header('Content-Type: application/json');
requireLoginOrRespond401();

$editions = json_decode(file_get_contents(__DIR__ . '/../../data/editions.json'), true);
$game = $_GET['game'] ?? '';

// isset() against the decoded file, instead of a separate hardcoded list of
// games, so there is only one place that knows which games are valid.
if (!isset($editions[$game])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unknown or missing game.']);
    exit;
}

echo json_encode(['ok' => true, 'data' => $editions[$game]]);
