<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/auth.php';

header('Content-Type: application/json');
requireLoginOrRespond401();

$pdo = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Checks that name_en is present and that edition_id genuinely exists for
// the given card_game in editions.json, not just that something was sent.
// Returns an error message, or null when the input is valid.
function validateCardInput(array $input): ?string
{
    $nameEn = trim($input['name_en'] ?? '');
    $game = $input['card_game'] ?? '';
    $editionId = $input['edition_id'] ?? '';

    if ($nameEn === '') {
        return 'English name is required.';
    }

    $editions = json_decode(file_get_contents(__DIR__ . '/../../data/editions.json'), true);

    if (!isset($editions[$game])) {
        return 'Unknown card game.';
    }

    $validIds = array_column($editions[$game], 'id');
    if (!in_array($editionId, $validIds, true)) {
        return 'Unknown edition for the selected game.';
    }

    return null;
}

// Looks up the display name for an edition id, so the row stores a
// readable snapshot (edition_name) alongside the short code (edition_id).
function editionName(string $game, string $editionId): string
{
    $editions = json_decode(file_get_contents(__DIR__ . '/../../data/editions.json'), true);

    foreach ($editions[$game] as $edition) {
        if ($edition['id'] === $editionId) {
            return $edition['name'];
        }
    }

    return $editionId;
}

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM cards WHERE deleted_at IS NULL ORDER BY id DESC');
    echo json_encode(['ok' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $error = validateCardInput($input);
    if ($error !== null) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => $error]);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO cards (name_en, name_pt, card_game, edition_id, edition_name) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        trim($input['name_en']),
        trim($input['name_pt'] ?? '') ?: null,
        $input['card_game'],
        $input['edition_id'],
        editionName($input['card_game'], $input['edition_id']),
    ]);

    echo json_encode(['ok' => true, 'data' => ['id' => (int) $pdo->lastInsertId()]]);
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int) ($input['id'] ?? 0);
    $error = validateCardInput($input);

    if ($id === 0 || $error !== null) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => $error ?? 'A valid id is required.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE cards SET name_en = ?, name_pt = ?, card_game = ?, edition_id = ?, edition_name = ?
         WHERE id = ? AND deleted_at IS NULL'
    );
    $stmt->execute([
        trim($input['name_en']),
        trim($input['name_pt'] ?? '') ?: null,
        $input['card_game'],
        $input['edition_id'],
        editionName($input['card_game'], $input['edition_id']),
        $id,
    ]);

    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int) ($input['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'A valid id is required.']);
        exit;
    }

    // Soft delete: the row stays, only deleted_at gets set. See the
    // Architecture Decisions section of the README for why.
    $stmt = $pdo->prepare('UPDATE cards SET deleted_at = NOW() WHERE id = ?');
    $stmt->execute([$id]);

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
