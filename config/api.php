<?php
// Shared setup for every api/*.php endpoint.

header('Content-Type: application/json');

// Any error that slips through still answers in the same JSON shape the
// front end expects, instead of a PHP error page that it cannot read and
// that could expose file paths or query details.
ini_set('display_errors', '0');
set_exception_handler(function (Throwable $e): void {
    error_log((string) $e);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Something went wrong on the server. Please try again.']);
});
