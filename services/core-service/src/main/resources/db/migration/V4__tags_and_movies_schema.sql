CREATE TABLE IF NOT EXISTS tag (
    id SERIAL PRIMARY KEY,
    genre VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS movie_tags (
    movie_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (movie_id, tag_id),
    FOREIGN KEY (movie_id) REFERENCES movie(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

-- Ensure unique genre values for easy mapping if we need it
-- First extract all distinct split genres
INSERT INTO tag (genre)
SELECT DISTINCT TRIM(g.genre_split)
FROM movie m
CROSS JOIN LATERAL regexp_split_to_table(m.genre, ',') AS g(genre_split)
WHERE m.genre IS NOT NULL AND TRIM(m.genre) != '' AND TRIM(g.genre_split) != '';

-- Add a constraint now to be safe
ALTER TABLE tag ADD CONSTRAINT original_genre_unique UNIQUE (genre);

-- Map original movie genres safely mapping separated fragments
INSERT INTO movie_tags (movie_id, tag_id)
SELECT DISTINCT m.id, t.id
FROM movie m
CROSS JOIN LATERAL regexp_split_to_table(m.genre, ',') AS g(genre_split)
JOIN tag t ON TRIM(g.genre_split) = t.genre
WHERE m.genre IS NOT NULL AND TRIM(m.genre) != '' AND TRIM(g.genre_split) != '';

-- Free up old structure
ALTER TABLE movie DROP COLUMN genre;
