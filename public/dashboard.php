<?php
require_once __DIR__ . '/../config/auth.php';
requireLoginOrRedirect();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TCG Card Manager (GBC Style) - Dashboard</title>
  <script src="js/palette.js"></script>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="console">
    <div class="bezel">
      <p class="bezel-label" aria-hidden="true"><span class="led"></span>TCG CARD MANAGER</p>
      <div class="screen">
        <header class="window window-bar">
          <h1>Cards <span id="card-count" class="card-count"></span></h1>
          <button id="logout-btn">Log out</button>
        </header>

        <p id="offline-banner" class="window window-alert" role="alert" hidden>No connection! Changes cannot be saved until you are back online.</p>
        <p id="slow-notice" class="window slow-notice" role="status" hidden>Still loading... the server is slow today.</p>

        <main>
          <button id="new-card-btn">New card</button>

          <div class="window">
            <table>
              <thead>
                <tr><th>Name (EN)</th><th>Name (PT)</th><th>Game</th><th>Edition</th><th>Actions</th></tr>
              </thead>
              <tbody id="cards-body" aria-busy="true">
                <tr>
                  <td colspan="5" class="list-state">
                    <p class="now-loading">Now loading</p>
                    <span class="pixel-bar" aria-hidden="true"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>

    <nav class="palette-picker" aria-label="Screen palette">
      <button type="button" data-palette-option="dmg" title="Original green screen">DMG</button>
      <button type="button" data-palette-option="pocket" title="Gray screen">Pocket</button>
      <button type="button" data-palette-option="berry" title="Red color palette">Berry</button>
      <button type="button" data-palette-option="grape" title="Purple color palette">Grape</button>
    </nav>
  </div>

  <div id="toasts" class="toasts"></div>

  <dialog id="card-form-section" class="window form-window" aria-labelledby="card-form-title">
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
      <select id="edition" required disabled data-error-id="edition-error">
        <option value="">Select a Card Game first...</option>
      </select>
      <p id="edition-error" class="field-error" role="alert" hidden></p>
      <button type="button" id="retry-editions" class="btn-small" hidden>Try again</button>

      <p id="card-form-error" class="error" role="alert" hidden></p>

      <div class="form-actions">
        <button type="submit">Save</button>
        <button type="button" id="cancel-card-btn">Cancel</button>
      </div>
    </form>
  </dialog>

  <dialog id="confirm-dialog" class="window" aria-labelledby="confirm-message">
    <form method="dialog">
      <p id="confirm-message"></p>
      <div class="form-actions">
        <button value="confirm">Yes</button>
        <button value="cancel" autofocus>No</button>
      </div>
    </form>
  </dialog>

  <script src="js/api.js"></script>
  <script src="js/feedback.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
