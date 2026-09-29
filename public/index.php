<?php
require_once __DIR__ . '/../config/auth.php';

// The root URL has no page of its own. Logged in visitors go straight to
// the dashboard, everyone else to the login page.
header('Location: ' . (currentUserId() === null ? '/login.html' : '/dashboard.php'));
exit;
