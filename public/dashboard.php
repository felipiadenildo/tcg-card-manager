<?php
require_once __DIR__ . '/../config/auth.php';
requireLoginOrRedirect();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TCG Card Manager (Modern TCG) - Collection</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="topbar">
    <p class="logo">TCG<span>Card Manager</span></p>
    <button id="logout-btn" class="btn btn-ghost">Log out</button>
  </header>

  <main class="container">
    <section class="hero">
      <div>
        <p class="eyebrow">Collection</p>
        <h1>Cards</h1>
      </div>
      <button id="new-card-btn" class="btn btn-primary">+ New card</button>
    </section>

    <div class="toolbar">
      <div class="game-filters" role="group" aria-label="Filter by game">
        <button type="button" class="chip" data-filter="all" aria-pressed="true">All <span data-count="all">0</span></button>
        <button type="button" class="chip" data-filter="magic" aria-pressed="false">Magic <span data-count="magic">0</span></button>
        <button type="button" class="chip" data-filter="pokemon" aria-pressed="false">Pok&eacute;mon <span data-count="pokemon">0</span></button>
        <button type="button" class="chip" data-filter="yugioh" aria-pressed="false">Yu-Gi-Oh! <span data-count="yugioh">0</span></button>
      </div>

      <div class="toolbar-right">
        <label for="search" class="visually-hidden">Search cards</label>
        <input type="search" id="search" placeholder="Search by name or edition">

        <div class="view-toggle" role="group" aria-label="View">
          <button type="button" data-view="grid" aria-pressed="true">Grid</button>
          <button type="button" data-view="list" aria-pressed="false">List</button>
        </div>
      </div>
    </div>

    <div id="collection" data-view="grid">
      <ul id="cards-grid" class="card-grid"></ul>

      <div class="glass table-wrap">
        <table>
          <thead>
            <tr><th>Name (EN)</th><th>Name (PT)</th><th>Game</th><th>Edition</th><th>Actions</th></tr>
          </thead>
          <tbody id="cards-body"></tbody>
        </table>
      </div>

      <p id="empty-state" class="empty" hidden></p>
    </div>

    <section id="card-form-section" class="drawer glass" hidden aria-labelledby="card-form-title">
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

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" id="cancel-card-btn" class="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </section>
  </main>

  <dialog id="confirm-dialog" class="glass" aria-labelledby="confirm-message">
    <form method="dialog">
      <p id="confirm-message"></p>
      <div class="form-actions">
        <button value="cancel" class="btn btn-ghost" autofocus>Cancel</button>
        <button value="confirm" class="btn btn-danger">Delete</button>
      </div>
    </form>
  </dialog>

  <script src="js/api.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
