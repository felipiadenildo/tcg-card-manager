-- TCG Card Manager database schema.
-- Two tables only. Login credentials in users, the actual card catalog
-- in cards. Editions are not stored here on purpose, they come from
-- data/editions.json instead, see the Architecture Decisions section of
-- the README for why.

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(150) NOT NULL,
    name_pt VARCHAR(150) NULL,
    card_game ENUM('magic', 'pokemon', 'yugioh') NOT NULL,
    edition_id VARCHAR(20) NOT NULL,
    edition_name VARCHAR(100) NOT NULL,
    -- Soft delete: a "deleted" card gets a timestamp here instead of being
    -- removed from the table. Every listing query filters on
    -- WHERE deleted_at IS NULL, hence the index below.
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- MySQL keeps this in sync on every UPDATE, no need to set it from PHP.
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_cards_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
