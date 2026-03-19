-- ============================================
-- INITIAL DATABASE SCHEMA FOR CORE SERVICE
-- ============================================

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS core;

-- Set search path
SET search_path TO core, public;

-- ============================================
-- 1. BRANCH TABLE (Cinema locations)
-- ============================================
CREATE TABLE core.branch (
                             id BIGSERIAL PRIMARY KEY,
                             name VARCHAR(255) NOT NULL,
                             address TEXT NOT NULL,
                             city VARCHAR(100) NOT NULL,
                             country VARCHAR(50) NOT NULL,
                             total_screens INT DEFAULT 0,
                             is_active BOOLEAN DEFAULT TRUE,
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. SCREEN TABLE (Individual screens in branches)
-- ============================================
CREATE TABLE core.screen (
                             id BIGSERIAL PRIMARY KEY,
                             branch_id BIGINT NOT NULL REFERENCES core.branch(id) ON DELETE CASCADE,
                             name VARCHAR(100) NOT NULL,
                             screen_number INT NOT NULL,
                             capacity INT NOT NULL,
                             rows_count INT NOT NULL,
                             seats_per_row INT NOT NULL,
                             is_active BOOLEAN DEFAULT TRUE,
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             CONSTRAINT unique_screen_per_branch UNIQUE (branch_id, screen_number)
);

-- ============================================
-- 3. MOVIE TABLE
-- ============================================
CREATE TABLE core.movie (
                            id BIGSERIAL PRIMARY KEY,
                            title VARCHAR(255) NOT NULL,
                            genre VARCHAR(100) NOT NULL,
                            duration INT NOT NULL, -- in minutes
                            description TEXT,
                            director VARCHAR(255),
                            release_date DATE,
                            rating DECIMAL(3,1), -- e.g., 8.5
                            poster_url VARCHAR(500),
                            base_price DECIMAL(10,2) DEFAULT 12.99,
                            is_active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. SEAT TABLE (Physical seats in screens)
-- ============================================
CREATE TABLE core.seat (
                           id BIGSERIAL PRIMARY KEY,
                           screen_id BIGINT NOT NULL REFERENCES core.screen(id) ON DELETE CASCADE,
                           seat_number VARCHAR(10) NOT NULL, -- e.g., "A1", "B12"
                           row_label VARCHAR(5) NOT NULL, -- e.g., "A", "B"
                           is_available BOOLEAN DEFAULT TRUE,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                           CONSTRAINT unique_seat_per_screen UNIQUE (screen_id, seat_number)
);

-- ============================================
-- 5. SCREENING TABLE (Movie showtimes)
-- ============================================
CREATE TABLE core.screening (
                                id BIGSERIAL PRIMARY KEY,
                                movie_id BIGINT NOT NULL REFERENCES core.movie(id) ON DELETE CASCADE,
                                screen_id BIGINT NOT NULL REFERENCES core.screen(id) ON DELETE CASCADE,
                                start_time TIMESTAMP NOT NULL,
                                end_time TIMESTAMP NOT NULL,
                                price DECIMAL(10,2) NOT NULL DEFAULT 12.99,
                                available_seats INT,
                                total_seats INT,
                                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT chk_screening_time CHECK (end_time > start_time)
);

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

-- Movie indexes
CREATE INDEX idx_movie_title ON core.movie(title);
CREATE INDEX idx_movie_genre ON core.movie(genre);
CREATE INDEX idx_movie_release_date ON core.movie(release_date);
CREATE INDEX idx_movie_rating ON core.movie(rating);
CREATE INDEX idx_movie_is_active ON core.movie(is_active);

-- Branch indexes
CREATE INDEX idx_branch_city ON core.branch(city);
CREATE INDEX idx_branch_is_active ON core.branch(is_active);

-- Screen indexes
CREATE INDEX idx_screen_branch ON core.screen(branch_id);
CREATE INDEX idx_screen_is_active ON core.screen(is_active);

-- Screening indexes
CREATE INDEX idx_screening_movie ON core.screening(movie_id);
CREATE INDEX idx_screening_screen ON core.screening(screen_id);
CREATE INDEX idx_screening_start_time ON core.screening(start_time);
CREATE INDEX idx_screening_date ON core.screening(DATE(start_time));

-- Seat indexes
CREATE INDEX idx_seat_screen ON core.seat(screen_id);
CREATE INDEX idx_seat_available ON core.seat(is_available) WHERE is_available = TRUE;

-- ============================================
-- 7. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_movie_updated_at
    BEFORE UPDATE ON core.movie
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_branch_updated_at
    BEFORE UPDATE ON core.branch
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_screen_updated_at
    BEFORE UPDATE ON core.screen
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_screening_updated_at
    BEFORE UPDATE ON core.screening
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_seat_updated_at
    BEFORE UPDATE ON core.seat
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

-- Function to automatically calculate available_seats in screening
CREATE OR REPLACE FUNCTION core.update_screening_available_seats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- When screening is created, set total_seats from screen capacity
        NEW.total_seats := (
            SELECT capacity FROM core.screen WHERE id = NEW.screen_id
        );
        NEW.available_seats := NEW.total_seats;
END IF;
RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for screening creation
CREATE TRIGGER trg_screening_before_insert
    BEFORE INSERT ON core.screening
    FOR EACH ROW
    EXECUTE FUNCTION core.update_screening_available_seats();

-- ============================================
-- 8. INITIAL DATA INSERTION
-- ============================================

-- Insert branches
INSERT INTO core.branch (name, address, city, country, total_screens) VALUES
                                                                          ('Cinema City Mall', '123 Main Street', 'New York', 'USA', 3),
                                                                          ('Downtown Cinema', '456 Oak Avenue', 'Los Angeles', 'USA', 2),
                                                                          ('Westfield Shopping Center', '789 Pine Road', 'Chicago', 'USA', 4);

-- Insert screens for each branch
-- Branch 1: Cinema City Mall (3 screens)
INSERT INTO core.screen (branch_id, name, screen_number, capacity, rows_count, seats_per_row) VALUES
                                                                                                  (1, 'Screen 1', 1, 120, 8, 15),
                                                                                                  (1, 'Screen 2', 2, 80, 8, 10),
                                                                                                  (1, 'Screen 3', 3, 60, 6, 10);

-- Branch 2: Downtown Cinema (2 screens)
INSERT INTO core.screen (branch_id, name, screen_number, capacity, rows_count, seats_per_row) VALUES
                                                                                                  (2, 'Main Hall', 1, 150, 10, 15),
                                                                                                  (2, 'Small Hall', 2, 50, 5, 10);

-- Branch 3: Westfield Shopping Center (4 screens)
INSERT INTO core.screen (branch_id, name, screen_number, capacity, rows_count, seats_per_row) VALUES
                                                                                                  (3, 'IMAX Theatre', 1, 200, 10, 20),
                                                                                                  (3, 'Screen A', 2, 100, 8, 13),
                                                                                                  (3, 'Screen B', 3, 100, 8, 13),
                                                                                                  (3, 'VIP Lounge', 4, 40, 5, 8);

-- Insert movies
INSERT INTO core.movie (title, genre, duration, description, director, release_date, rating, poster_url, base_price) VALUES
                                                                                                                         ('Inception', 'Sci-Fi', 148, 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 'Christopher Nolan', '2010-07-16', 8.8, 'https://image.tmdb.org/t/p/w500/inception.jpg', 14.99),
                                                                                                                         ('The Dark Knight', 'Action', 152, 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 'Christopher Nolan', '2008-07-18', 9.0, 'https://image.tmdb.org/t/p/w500/dark_knight.jpg', 13.99),
                                                                                                                         ('Interstellar', 'Sci-Fi', 169, 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 'Christopher Nolan', '2014-11-07', 8.6, 'https://image.tmdb.org/t/p/w500/interstellar.jpg', 15.99),
                                                                                                                         ('Avengers: Endgame', 'Action', 181, 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos'' actions and restore balance to the universe.', 'Anthony Russo', '2019-04-26', 8.4, 'https://image.tmdb.org/t/p/w500/endgame.jpg', 16.99),
                                                                                                                         ('Dune', 'Sci-Fi', 155, 'Feature adaptation of Frank Herbert''s science fiction novel, about the son of a noble family entrusted with the protection of the most valuable asset and most vital element in the galaxy.', 'Denis Villeneuve', '2021-10-22', 8.0, 'https://image.tmdb.org/t/p/w500/dune.jpg', 15.99),
                                                                                                                         ('The Matrix', 'Sci-Fi', 136, 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', 'Lana Wachowski', '1999-03-31', 8.7, 'https://image.tmdb.org/t/p/w500/matrix.jpg', 12.99),
                                                                                                                         ('Pulp Fiction', 'Crime', 154, 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 'Quentin Tarantino', '1994-10-14', 8.9, 'https://image.tmdb.org/t/p/w500/pulp_fiction.jpg', 12.99),
                                                                                                                         ('The Shawshank Redemption', 'Drama', 142, 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 'Frank Darabont', '1994-09-23', 9.3, 'https://image.tmdb.org/t/p/w500/shawshank.jpg', 11.99);

-- Generate seats for each screen
DO $$
DECLARE
screen_rec RECORD;
    row_letter CHAR(1);
    seat_num INT;
    row_idx INT;
BEGIN
FOR screen_rec IN SELECT id, rows_count, seats_per_row FROM core.screen LOOP
    FOR row_idx IN 1..screen_rec.rows_count LOOP
    row_letter := CHR(64 + row_idx); -- A, B, C, etc.
FOR seat_num IN 1..screen_rec.seats_per_row LOOP
                INSERT INTO core.seat (
                    screen_id,
                    seat_number,
                    row_label,
                    is_available
                ) VALUES (
                    screen_rec.id,
                    row_letter || seat_num,
                    row_letter,
                    TRUE
                );
END LOOP;
END LOOP;
END LOOP;
END $$;

-- Insert screenings
INSERT INTO core.screening (movie_id, screen_id, start_time, end_time, price)
SELECT
    m.id,
    s.id,
    '2024-03-20 10:00:00'::TIMESTAMP + (n || ' hours')::INTERVAL,
    '2024-03-20 10:00:00'::TIMESTAMP + (n || ' hours')::INTERVAL + (m.duration || ' minutes')::INTERVAL,
    m.base_price
FROM core.movie m
         CROSS JOIN core.screen s
         CROSS JOIN generate_series(0, 12, 3) n
WHERE m.id <= 4
  AND s.id <= 3
    LIMIT 30;

-- ============================================
-- 9. VERIFICATION (can be removed after confirming)
-- ============================================

-- Check row counts
SELECT 'branch' as table_name, COUNT(*) as row_count FROM core.branch
UNION ALL SELECT 'screen', COUNT(*) FROM core.screen
UNION ALL SELECT 'movie', COUNT(*) FROM core.movie
UNION ALL SELECT 'seat', COUNT(*) FROM core.seat
UNION ALL SELECT 'screening', COUNT(*) FROM core.screening
ORDER BY table_name;