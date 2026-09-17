-- Test data. Runs automatically on first boot, right after schema.sql,
-- through the docker-entrypoint-initdb.d mount in docker-compose.yml.

-- Without this, the client connection used for this import does not
-- necessarily match the file's own utf8mb4 encoding, and accented
-- characters get mangled on the way in.
SET NAMES utf8mb4;

-- Password is "trocarSenha123", hashed with bcrypt (cost 10). The plain
-- password lives in the README under "Test credentials", never here.
INSERT INTO users (email, password_hash) VALUES
    ('admin@tcg-gbc.dev', '$2b$10$pC/6Z5FaDQsNj7UqZSPs.u1PB3Q6Qf3brEIFboEJ5FePaoupFdMUS');

INSERT INTO cards (name_en, name_pt, card_game, edition_id, edition_name) VALUES
    ('Charizard', 'Charizard', 'pokemon', 'base1', 'Base Set'),
    ('Teferi, Hero of Dominaria', NULL, 'magic', 'dom', 'Dominaria'),
    ('Blue-Eyes White Dragon', 'Dragão Branco de Olhos Azuis', 'yugioh', 'lob', 'Legend of Blue Eyes White Dragon'),
    ('Gyarados', NULL, 'pokemon', 'base1', 'Base Set'),
    ('The Hobbit: Bilbo Baggins', NULL, 'magic', 'hob', 'The Hobbit'),
    ('Dark Magician', 'Mago Negro', 'yugioh', 'sdy', 'Starter Deck: Yugi');
