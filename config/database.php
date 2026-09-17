<?php
// Returns a single shared PDO connection, created once per request.

function getConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=utf8mb4',
            getenv('DB_HOST'),
            getenv('DB_NAME')
        );

        $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASSWORD'), [
            // Without this, a failed query just returns false instead of
            // throwing, which hides bugs instead of surfacing them.
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            // Rows come back as ['column' => value], not duplicated by a
            // numeric index too.
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    return $pdo;
}
