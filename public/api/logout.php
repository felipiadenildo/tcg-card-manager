<?php
require_once __DIR__ . '/../../config/auth.php';

header('Content-Type: application/json');

session_unset();
session_destroy();

echo json_encode(['ok' => true]);
