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
  <div class="progress-bar" aria-hidden="true"></div>

  <header class="topbar">
    <p class="logo">TCG<span>Card Manager</span></p>
    <button id="logout-btn" class="btn btn-ghost">Log out</button>
  </header>

  <p id="offline-banner" class="offline-banner" role="alert" hidden>You are offline. Changes cannot be saved until you reconnect.</p>

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
        <button type="button" class="chip" data-filter="all" aria-pressed="true">All <span data-count="all">&middot;&middot;&middot;</span></button>
        <button type="button" class="chip" data-filter="magic" aria-pressed="false">Magic <span data-count="magic">&middot;&middot;&middot;</span></button>
        <button type="button" class="chip" data-filter="pokemon" aria-pressed="false">Pok&eacute;mon <span data-count="pokemon">&middot;&middot;&middot;</span></button>
        <button type="button" class="chip" data-filter="yugioh" aria-pressed="false">Yu-Gi-Oh! <span data-count="yugioh">&middot;&middot;&middot;</span></button>
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

    <div id="collection" data-view="grid" aria-busy="true">
      <ul id="cards-grid" class="card-grid">
        <?php for ($i = 0; $i < 5; $i++): ?>
        <li class="card-item" aria-hidden="true"><div class="tcg-card skeleton-card"></div></li>
        <?php endfor; ?>
      </ul>

      <div class="glass table-wrap">
        <table>
          <thead>
            <tr><th>Name (EN)</th><th>Name (PT)</th><th>Game</th><th>Edition</th><th>Actions</th></tr>
          </thead>
          <tbody id="cards-body"></tbody>
        </table>
      </div>

      <p id="empty-state" class="empty" hidden></p>

      <div id="list-error" class="list-error glass" hidden>
        <p id="list-error-message" role="alert"></p>
        <button type="button" id="retry-list" class="btn btn-primary">Try again</button>
      </div>
    </div>

    <section id="card-form-section" class="drawer glass" hidden aria-labelledby="card-form-title">
      <h2 id="card-form-title">New card</h2>
      <form id="card-form" novalidate>
        <label for="name-en">Name (English)</label>
        <input type="text" id="name-en" maxlength="150" data-error-id="name-en-error" required>
        <p id="name-en-error" class="field-error" hidden></p>

        <label for="name-pt">Name (Portuguese)</label>
        <input type="text" id="name-pt" maxlength="150">

        <label for="card-game">Card Game</label>
        <select id="card-game" data-error-id="card-game-error" required>
          <option value="">Select...</option>
          <option value="magic">Magic: The Gathering</option>
          <option value="pokemon">Pokémon</option>
          <option value="yugioh">Yu-Gi-Oh!</option>
        </select>
        <p id="card-game-error" class="field-error" hidden></p>

        <label for="edition">Edition</label>
        <div class="select-wrap">
          <select id="edition" required disabled data-error-id="edition-error">
            <option value="">Select a Card Game first...</option>
          </select>
          <span id="edition-spinner" class="spinner" aria-hidden="true" hidden></span>
        </div>
        <p id="edition-error" class="field-error" role="alert" hidden></p>
        <button type="button" id="retry-editions" class="btn btn-ghost btn-small" hidden>Try loading editions again</button>

        <p id="card-form-error" class="error" role="alert" hidden></p>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" id="cancel-card-btn" class="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </section>
  </main>

  <div id="toasts" class="toasts"></div>
  <p id="slow-notice" class="toast toast-info slow-notice" role="status" hidden>Still working, the server is slower than usual.</p>

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
  <script src="js/feedback.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
