<?php
require_once __DIR__ . '/database.php';

// Starting the session here means anything that requires this file already
// has a session ready to use, without needing to remember session_start()
// separately in every entry point.
//
// The cookie name comes from SESSION_NAME so two copies of the app on the
// same host (browsers share cookies across ports) do not overwrite each
// other's login. HttpOnly keeps the cookie out of reach of JavaScript, and
// SameSite=Lax stops other sites from sending it along with their requests.
session_start([
    'name' => getenv('SESSION_NAME') ?: 'tcg_session',
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
]);

function currentUserId(): ?int
{
    return $_SESSION['user_id'] ?? null;
}

// Used by public pages, like dashboard.php. Sends the visitor back to the
// login page if there is no active session.
function requireLoginOrRedirect(): void
{
    if (currentUserId() === null) {
        // Relative, so it still points to the right place when the app is
        // served from a subfolder or behind a proxy with a path prefix.
        header('Location: login.html');
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
