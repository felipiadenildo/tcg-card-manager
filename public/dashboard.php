<?php
require_once __DIR__ . '/../config/auth.php';
requireLoginOrRedirect();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TCG Card Manager (Backoffice) - Cards</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to the card list</a>
  <div class="progress-bar" aria-hidden="true"></div>

  <header class="topbar">
    <p class="app-name">TCG Card Manager</p>
    <button id="logout-btn" class="btn btn-quiet">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg>
      Sign out
    </button>
  </header>

  <p id="offline-banner" class="banner banner-warning banner-page" role="alert" hidden>
    You are offline. Changes cannot be saved until the connection comes back.
  </p>

  <main id="main" class="container" tabindex="-1">
    <div class="page-header">
      <div>
        <h1>Cards</h1>
        <p id="card-count" class="muted">Loading cards...</p>
      </div>
      <button id="new-card-btn" class="btn btn-primary">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        Add a card
      </button>
    </div>

    <p id="slow-notice" class="banner banner-info" role="status" hidden>
      Still working. The server is taking longer than usual, please wait.
    </p>
    <div id="toasts" class="toasts"></div>

    <section id="card-form-section" class="panel" hidden aria-labelledby="card-form-title">
      <h2 id="card-form-title">New card</h2>
      <form id="card-form" novalidate>
        <div id="error-summary" class="error-summary" role="alert" tabindex="-1" hidden>
          <h3>Please check the form</h3>
          <ul></ul>
        </div>

        <div class="field">
          <label for="name-en">Name in English <span class="tag-required">required</span></label>
          <p id="name-en-error" class="field-error" hidden></p>
          <input type="text" id="name-en" maxlength="150" data-error-id="name-en-error" required>
        </div>

        <div class="field">
          <label for="name-pt">Name in Portuguese <span class="tag-optional">optional</span></label>
          <p id="name-pt-hint" class="hint">Leave it blank if the card has no Portuguese name.</p>
          <p id="name-pt-error" class="field-error" hidden></p>
          <input type="text" id="name-pt" maxlength="150" aria-describedby="name-pt-hint" data-error-id="name-pt-error">
        </div>

        <div class="field">
          <label for="card-game">Card game <span class="tag-required">required</span></label>
          <p id="card-game-error" class="field-error" hidden></p>
          <select id="card-game" data-error-id="card-game-error" required>
            <option value="">Choose a card game</option>
            <option value="magic">Magic: The Gathering</option>
            <option value="pokemon">Pokémon</option>
            <option value="yugioh">Yu-Gi-Oh!</option>
          </select>
        </div>

        <div class="field">
          <label for="edition">Edition <span class="tag-required">required</span></label>
          <p id="edition-hint" class="hint">The list of editions fills in after you choose the card game.</p>
          <p id="edition-error" class="field-error" role="alert" hidden></p>
          <div class="select-row">
            <select id="edition" required disabled aria-describedby="edition-hint" data-error-id="edition-error">
              <option value="">Select a Card Game first...</option>
            </select>
            <span id="edition-spinner" class="spinner spinner-dark" aria-hidden="true" hidden></span>
          </div>
          <button type="button" id="retry-editions" class="btn btn-secondary btn-small" hidden>Try loading the editions again</button>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save card</button>
          <button type="button" id="cancel-card-btn" class="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </section>

    <div class="table-wrap">
      <table>
        <caption class="visually-hidden">All cards, newest first</caption>
        <thead>
          <tr><th scope="col">Name (EN)</th><th scope="col">Name (PT)</th><th scope="col">Game</th><th scope="col">Edition</th><th scope="col">Actions</th></tr>
        </thead>
        <tbody id="cards-body" aria-busy="true">
          <?php for ($i = 0; $i < 4; $i++): ?>
          <tr class="skeleton-row" aria-hidden="true">
            <td><span class="skeleton"></span></td><td><span class="skeleton"></span></td>
            <td><span class="skeleton"></span></td><td><span class="skeleton"></span></td>
            <td><span class="skeleton skeleton-short"></span></td>
          </tr>
          <?php endfor; ?>
        </tbody>
      </table>
    </div>
  </main>

  <dialog id="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-message">
    <form method="dialog">
      <h2 id="confirm-title">Delete this card?</h2>
      <p id="confirm-message"></p>
      <div class="form-actions">
        <button value="cancel" class="btn btn-secondary" autofocus>Keep card</button>
        <button value="confirm" class="btn btn-danger">Delete card</button>
      </div>
    </form>
  </dialog>

  <script src="js/api.js"></script>
  <script src="js/feedback.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
