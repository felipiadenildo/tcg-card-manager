<?php
require_once __DIR__ . '/database.php';

// Starting the session here means anything that requires this file already
// has a session ready to use, without needing to remember session_start()
// separately in every entry point.
session_start();

function currentUserId(): ?int
{
    return $_SESSION['user_id'] ?? null;
}

// Used by public pages, like dashboard.php. Sends the visitor back to the
// login page if there is no active session.
function requireLoginOrRedirect(): void
{
    if (currentUserId() === null) {
        header('Location: /login.html');
        exit;
    }
}

// Used by api/*.php endpoints. Responds with a 401 instead of redirecting,
// since the caller here is JavaScript, not a browser navigating to a page.
function requireLoginOrRespond401(): void
{
    if (currentUserId() === null) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['ok' => false, 'error' => 'Not authenticated.']);
        exit;
    }
}
