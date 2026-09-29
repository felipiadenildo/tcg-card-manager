<?php
require_once __DIR__ . '/../config/auth.php';
requireLoginOrRedirect();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TCG Card Manager - Dashboard</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header>
    <h1>Cards</h1>
    <button id="logout-btn">Log out</button>
  </header>

  <main>
    <button id="new-card-btn">New card</button>

    <p id="list-error" class="error" role="alert" hidden></p>

    <table>
      <thead>
        <tr><th>Name (EN)</th><th>Name (PT)</th><th>Game</th><th>Edition</th><th>Actions</th></tr>
      </thead>
      <tbody id="cards-body"></tbody>
    </table>

    <dialog id="card-form-section" aria-labelledby="card-form-title">
      <h2 id="card-form-title">New card</h2>
      <form id="card-form">
        <label for="name-en">Name (English)</label>
        <input type="text" id="name-en" required>

        <label for="name-pt">Name (Portuguese)</label>
        <input type="text" id="name-pt">

        <label for="card-game">Card Game</label>
        <select id="card-game" required>
          <option value="">Select...</option>
          <option value="magic">Magic: The Gathering</option>
          <option value="pokemon">Pokémon</option>
          <option value="yugioh">Yu-Gi-Oh!</option>
        </select>

        <label for="edition">Edition</label>
        <select id="edition" required disabled>
          <option value="">Select a Card Game first...</option>
        </select>

        <p id="card-form-error" class="error" role="alert" hidden></p>

        <button type="submit">Save</button>
        <button type="button" id="cancel-card-btn">Cancel</button>
      </form>
    </dialog>
  </main>

  <script src="js/api.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
