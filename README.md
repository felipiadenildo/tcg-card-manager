# TCG-GBC - Card Management Portal

An administrative portal for managing Magic: The Gathering, Pokémon, and Yu-Gi-Oh! cards, with login
authentication, full CRUD functionality, and an edition selector that depends on the chosen game. It's
built as a technical challenge for a Full Stack hiring process, using plain PHP, MySQL, and vanilla
JavaScript, with no back-end or front-end frameworks.

The visual identity is inspired by the Game Boy Color TCG games (Pokémon Trading Card Game, Pokémon Card
GB2, Yu-Gi-Oh! Dark Duel Stories). This is a study and portfolio project, with no affiliation to the
original brands.

## Status

In progress.

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
- **Editions data: static JSON, not a database table.** `data/edicoes.json` mirrors the exact dataset
  from the challenge, and `api/edicoes.php?jogo=<game>` serves it as a real HTTP request. Cards store
  `edicao_id` and `edicao_nome` as plain columns, a snapshot taken when the card is saved, instead of a
  foreign key, since editions are a fixed external catalog rather than something managed through the
  portal.
- **Environment: Docker Compose.** Running `docker-compose up` starts PHP (Apache) and MySQL together,
  and `sql/schema.sql` and `sql/seed.sql` load automatically on first boot. This was chosen for
  reproducibility, so no one needs PHP or MySQL installed locally to run or evaluate the project.

## How to run

<!-- TODO: setup steps (docker-compose up + anything else required) -->

## Test credentials

<!-- TODO: valid username and password for login -->

## UX Decisions

<!-- TODO: the 2+ required product/UX decisions, with justification -->
