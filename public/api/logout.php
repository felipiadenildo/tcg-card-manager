<?php
require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../config/auth.php';


session_unset();
session_destroy();

echo json_encode(['ok' => true]);
