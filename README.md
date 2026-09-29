# TCG Card Manager (GBC Style)

An administrative portal for managing Magic: The Gathering, Pokémon, and Yu-Gi-Oh! cards, with login
authentication, full CRUD functionality, and an edition selector that depends on the chosen game. Built as
a technical challenge for a Full Stack hiring process, using plain PHP, MySQL, and vanilla JavaScript, with
no back-end or front-end frameworks.

## Branch strategy

This is the `theme/gbc-style` branch. The `main` branch is the minimal, unstyled baseline: exactly what
the challenge asks for, functionally complete, with plain HTML and CSS and no visual theme applied. Theme
branches like this one build different visual
styles on top of this same functional base, as a portfolio exercise. The PHP API and `js/api.js` are the
same in every branch, only the pages, the CSS, and the rendering code in `js/dashboard.js` change.

| Branch | Style |
|---|---|
| `theme/gbc-style` | Inspired by the Game Boy and Game Boy Color TCG games (Pokémon Trading Card Game, Pokémon Card GB2, Yu-Gi-Oh! Dark Duel Stories), with switchable handheld palettes. |
| `theme/backoffice` | A plain, accessible admin panel built around the challenge's note about users with different levels of comfort with technology. |
| `theme/modern-tcg` | Inspired by current digital TCG platforms and collection apps (MTG Arena, Pokémon TCG Live, Yu-Gi-Oh! Master Duel), with a card grid and foil effects. |

This is a study and portfolio project, with no affiliation to the original brands.

## Theme: Game Boy and Game Boy Color

The screens are drawn as if they were running on the handheld itself, borrowing the look of the TCG
games released for it.

- **A console that fits the window.** The handheld fills the browser window, and the LCD screen scrolls
  on its own inside the bezel, with the "Cards" header pinned to its top edge. The console grows up to
  1280px wide on large monitors, and on a phone it becomes a tall handheld. Below 520px of height, where
  it would get too cramped, the page falls back to scrolling normally.
- **Menu windows for the form.** "New card" and "Edit" pop the form up as a menu window in the middle of
  the screen, in front of the list, so it never needs scrolling to find. It closes with Cancel or Esc.
- **Four shades per palette.** Every color on the screen comes from four CSS variables, `--c0` (darkest)
  to `--c3` (lightest), the same limit the original hardware had. The default is the green DMG screen,
  and the buttons under the screen switch to Pocket (gray), Berry (red) and Grape (purple), named after
  the handheld's shell colors. The choice is saved in `localStorage` by `js/palette.js`, which loads in
  `<head>` so the saved palette is applied before the first paint.
- **Pixel font served locally.** Press Start 2P lives in `public/fonts` with its OFL license, so the
  theme works offline inside Docker with no external requests.
- **Menu windows and cursor.** Panels use the double bordered text box from the games, with corners
  trimmed by `clip-path` so they look pixelated. The selected button shows the blinking arrow cursor.
- **In-game confirmation.** Deleting a card opens a native `<dialog>` near the bottom of the screen,
  like the games' dialogue boxes, instead of the browser's `confirm()`. "No" has focus by default, and
  Esc also cancels, so the destructive option is never the one picked by accident.
- **Loading and errors, game style.** The power LED flickers while a request is in flight, busy buttons
  read "Now loading" with counting dots, and the card list shows a block by block loading bar. Errors
  shake the screen and appear in an inverted text box, messages pop up in a dialogue box at the bottom of
  the screen, and a deleted card flickers out like a fainted monster. Behind the theme the behavior is
  plain: a wrong password marks both fields with a dashed outline and selects the password again, a
  Caps Lock warning and a "Show password" box sit under the password, failed loads offer "Try again",
  slow requests show a "Still loading" notice, going offline shows a banner, and an expired session
  returns to the title screen with a message. The shared helpers live in `js/feedback.js`.
- **Readability.** Text stays in the darkest shade on the two lightest ones, the table stacks into
  labeled blocks on small screens, and the blinking stops for users who ask for reduced motion.

## Status

Functionally complete on this branch: login, full card CRUD, and the cascading edition select all work
end to end.

## Architecture Decisions

Key technical decisions made before implementation, and why.

- **Frontend: AJAX-first.** After login, the PHP back-end works as a pure JSON API (`api/*.php`), so
  listing, creating, editing, and deleting cards never reload the page. All rendering happens in vanilla
  JS, through `fetch` and direct DOM manipulation. This lines up with what the challenge actually
  evaluates: DOM manipulation skill, not just a form that posts to PHP and reloads.
- **Authentication: native PHP sessions.** Login uses `session_start()` and `$_SESSION['user_id']`, and
  calls `session_regenerate_id(true)` right after authenticating to prevent session fixation. Since the
  front-end and the API share the same origin, the session cookie is sent automatically with every
  `fetch`, so there's no need for a custom token layer. Both `dashboard.php` (server-side redirect if
  there's no session) and each `api/*.php` endpoint (401 if unauthenticated) check the session on their
  own.
- **User management: seed-only, no self-registration.** Test users come from `sql/seed.sql`. The
  challenge only asks for login, not account creation, and letting anyone sign up as an administrator
  wouldn't make sense for this kind of tool anyway.
- **Card deletion: soft delete.** Deleting a card sets a `deleted_at` timestamp instead of removing the
  row, and every listing query filters on `WHERE deleted_at IS NULL`. There's no trash or restore screen
  in this version, but the schema is ready for one later. The confirmation step before deleting stays
  either way, since from the user's point of view the card disappears the same way.
- **Editions data: static JSON, not a database table.** `data/editions.json` mirrors the exact dataset
  from the challenge, and `api/editions.php?game=<game>` serves it as a real HTTP request. Cards store
  `edition_id` and `edition_name` as plain columns, a snapshot taken when the card is saved, instead of a
  foreign key, since editions are a fixed external catalog rather than something managed through the
  portal.
- **Relative URLs and predictable errors.** Every URL the front end calls, and every redirect PHP sends,
  is relative, so the app also works from a subfolder or behind a proxy that adds a path prefix. The API
  always answers in the same `{ ok, error }` JSON shape, even for unexpected server errors, and
  `js/api.js` turns network failures, timeouts (15 seconds) and non-JSON answers into that same shape.
  The pages only ever check `body.ok`, so no request can leave the screen stuck without a message.
- **Environment: Docker Compose.** Running `docker-compose up` starts PHP (Apache) and MySQL together,
  and `sql/schema.sql` and `sql/seed.sql` load automatically on first boot. This was chosen for
  reproducibility, so no one needs PHP or MySQL installed locally to run or evaluate the project.

## Database Schema

```mermaid
erDiagram
    users {
        int id PK
        varchar email
        varchar password_hash
        timestamp created_at
    }

    cards {
        int id PK
        varchar name_en
        varchar name_pt "nullable"
        enum card_game
        varchar edition_id
        varchar edition_name
        timestamp deleted_at "nullable, soft delete"
        timestamp created_at
        timestamp updated_at
    }
```

No relationship line connects the two tables: cards are not tied to the user who created them in this
version, so `users` and `cards` are independent. Editions are not a table at all, see the "Editions data"
decision above.

## How to run

1. Copy `.env.example` to `.env`. The default values work fine for local development.
2. Run `docker-compose up -d --build`. This starts PHP, MySQL, and Adminer, and loads the schema and seed
   data automatically on first boot.
3. Visit `http://localhost:8080/login.html` and log in with the test credentials below.
4. Adminer, a database GUI, is available at `http://localhost:8081` if you want to inspect the database
   directly (server `db`, credentials from your `.env`).

## Test credentials

| Field | Value |
|---|---|
| Email | admin@admin |
| Password | password |

## UX Decisions

- **The card form opens as a dialog in front of the list.** Clicking "New card" or "Edit" on any row,
  even at the bottom of a long list, shows the form right where the user is looking, with no scrolling to
  find it. A native `<dialog>` opened with `showModal()` also keeps keyboard focus inside the form and
  closes with Esc, without extra code.
- **Confirming before deleting a card.** Deleting shows a confirmation prompt ("Delete '\<name\>'? This
  cannot be undone.") before the request goes out. The challenge asks to design for users with different
  levels of comfort with technology, and a destructive action with no undo screen in this version is
  exactly the kind of thing that benefits from a clear, hard-to-misclick confirmation step.
- **Showing "—" for a missing Portuguese name, instead of leaving the cell blank or repeating the English
  name.** An empty-looking cell can read as a loading glitch or a bug, and repeating the English name
  would misrepresent data that was never actually entered. A plain placeholder character makes it
  immediately clear, at a glance, that the field simply was not filled in for that card.
