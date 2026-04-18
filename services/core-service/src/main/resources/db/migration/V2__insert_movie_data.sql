-- Insert Movies
INSERT INTO movies (title, description, release_year, duration, rating, poster_url, trailer_url, genre) VALUES
                                                                                                            ('Dune: Part Two', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', 2024, 166, 8.9, 'http://localhost:9000/posters/Dune Part Two.jpg', 'https://www.youtube.com/embed/Way9Dexny3w', 'Sci-Fi'),
                                                                                                            ('Oppenheimer', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', 2023, 180, 8.5, 'http://localhost:9000/posters/Oppenheimer.jpg', 'https://www.youtube.com/embed/uYPbbksJxIg', 'Drama'),
                                                                                                            ('Barbie', 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.', 2023, 114, 7.8, 'http://localhost:9000/posters/Barbie.jpg', 'https://www.youtube.com/embed/pBk4NYhWNMM', 'Comedy'),
                                                                                                            ('John Wick: Chapter 4', 'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy.', 2023, 169, 8.2, 'http://localhost:9000/posters/John Wick Chapter 4.jpg', 'https://www.youtube.com/embed/qEVUtrk8_B4', 'Action'),
                                                                                                            ('The Batman', 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city''s hidden corruption.', 2022, 176, 8.1, 'http://localhost:9000/posters/The Batman.jpg', 'https://www.youtube.com/embed/mqqft2x_Aa4', 'Action'),
                                                                                                            ('Spider-Man: Across the Spider-Verse', 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.', 2023, 140, 8.7, 'http://localhost:9000/posters/Spider_Man Across the Spider_Verse.jpg', 'https://www.youtube.com/embed/cqGjhVJWtEg', 'Animation'),
                                                                                                            ('The Super Mario Bros. Movie', 'A plumber named Mario travels through an underground labyrinth with his brother, Luigi, trying to save a captured princess.', 2023, 92, 7.5, 'http://localhost:9000/posters/The Super Mario Bros. Movie.jpg', 'https://www.youtube.com/embed/TnGl01FkMMo', 'Animation'),
                                                                                                            ('Mission: Impossible - Dead Reckoning Part One', 'Ethan Hunt and his IMF team must track down a terrifying new weapon that threatens all of humanity.', 2023, 163, 8.3, 'http://localhost:9000/posters/Mission Impossible_Dead Reckoning Part One.jpg', 'https://www.youtube.com/embed/2m1drlOZSDw', 'Action'),
                                                                                                            ('Wonka', 'Armed with nothing but a hatful of dreams, young chocolatier Willy Wonka manages to change the world, one delectable bite at a time.', 2023, 116, 7.6, 'http://localhost:9000/posters/wonka.jpg', 'https://www.youtube.com/embed/otNh9bTjCWs', 'Fantasy'),
                                                                                                            ('Poor Things', 'The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by a brilliant and unorthodox scientist.', 2023, 141, 8.4, 'http://localhost:9000/posters/poor_things.jpg', 'https://www.youtube.com/embed/RlbR5N6veqw', 'Comedy'),
                                                                                                            ('The Hunger Games: The Ballad of Songbirds & Snakes', 'Coriolanus Snow mentors and develops feelings for the female District 12 tribute during the 10th Hunger Games.', 2023, 157, 7.4, 'http://localhost:9000/posters/The_Hunger_Games_The_Ballad_of_songbirds_&_Snakes.jpg', 'https://www.youtube.com/embed/O0QZ6sy7bCw', 'Action'),
                                                                                                            ('Killers of the Flower Moon', 'When oil is discovered in 1920s Oklahoma under Osage Nation land, the Osage people are murdered one by one.', 2023, 206, 8.2, 'http://localhost:9000/posters/killers_of_the_flower_moon.jpg', 'https://www.youtube.com/embed/EG0si5bSd6I', 'Crime'),
                                                                                                            ('The Marvels', 'Carol Danvers gets her powers entangled with those of Kamala Khan and Monica Rambeau, forcing them to work together to save the universe.', 2023, 105, 6.2, 'http://localhost:9000/posters/the_marvels.jpg', 'https://www.youtube.com/embed/wS_qbDztgVY', 'Action'),
                                                                                                            ('Aquaman and the Lost Kingdom', 'Aquaman must forge an uneasy alliance with an unlikely ally to protect Atlantis and the world from irreversible devastation.', 2023, 124, 6.5, 'http://localhost:9000/posters/aquaman_and_the_lost_kingdom.jpg', 'https://www.youtube.com/embed/UGc5Tzz9Urs', 'Action'),
                                                                                                            ('Wish', 'A young woman named Asha makes a powerful wish that is answered by a cosmic force, Star, together they face a formidable foe.', 2023, 95, 6.1, 'http://localhost:9000/posters/wish.jpg', 'https://www.youtube.com/embed/ctlz0R1tSZE', 'Animation');

-- Insert Cinemas
INSERT INTO cinemas (name, address, city, total_halls) VALUES
                                                           ('Grand Cinema Downtown', '123 Main St, Downtown', 'City Center', 5),
                                                           ('Cineplex Midtown', '456 Broadway Ave, Midtown', 'City Center', 4),
                                                           ('IMAX Westside', '789 Cinema Blvd, Westside', 'City Center', 3),
                                                           ('Star Cinema East', '1000 Movie Ln, Eastside', 'City Center', 4);

-- Insert Cinema Halls
DO $$
DECLARE
cinema_record RECORD;
    hall_names TEXT[] := ARRAY['Hall 1', 'Hall 2', 'Hall 3', 'IMAX', '4DX'];
    seat_counts INT[] := ARRAY[64, 80, 96, 120, 150];
BEGIN
FOR cinema_record IN SELECT id FROM cinemas LOOP
    FOR i IN 1..array_length(hall_names, 1) LOOP
                     INSERT INTO cinema_halls (cinema_id, hall_name, total_seats, seat_layout)
                     VALUES (
                         cinema_record.id,
                         hall_names[i],
                         seat_counts[i],
                         jsonb_build_object('rows', 8, 'columns', seat_counts[i] / 8)
                         );
END LOOP;
END LOOP;
END $$;

-- Insert Screenings for the next 7 days
DO $$
DECLARE
movie_record RECORD;
    hall_record RECORD;
    screening_date DATE;
    screening_times TIME[] := ARRAY['10:00:00', '13:00:00', '16:00:00', '19:00:00', '22:00:00'];
    time_index INT;
BEGIN
FOR movie_record IN SELECT id FROM movies LOOP
                                   -- For each movie, add screenings for next 7 days
    FOR day_offset IN 0..6 LOOP
    screening_date := CURRENT_DATE + day_offset;

-- Add 3 screenings per day (morning, afternoon, evening)
FOR time_slot IN 1..3 LOOP
                -- Pick a random hall
SELECT id, cinema_id INTO hall_record
FROM cinema_halls
ORDER BY RANDOM()
    LIMIT 1;

time_index := 1 + ((day_offset + time_slot) % 3);

INSERT INTO screenings (
    movie_id,
    cinema_hall_id,
    cinema_id,
    screening_time,
    available_seats,
    price
)
VALUES (
           movie_record.id,
           hall_record.id,
           hall_record.cinema_id,
           screening_date + screening_times[time_index],
           (SELECT total_seats FROM cinema_halls WHERE id = hall_record.id),
           12.50 + (time_index * 2.5) -- Different prices based on time
       );
END LOOP;
END LOOP;
END LOOP;
END $$;

-- Add some ratings and reviews (optional)
INSERT INTO ratings (movie_id, user_id, rating, review) VALUES
                                                            (1, 'user1', 9, 'Masterpiece! Best sci-fi film of the decade.'),
                                                            (1, 'user2', 8, 'Visually stunning but a bit long.'),
                                                            (2, 'user3', 10, 'Nolan at his best. Must watch!'),
                                                            (3, 'user4', 9, 'Fun and thought-provoking.'),
                                                            (4, 'user1', 8, 'Action packed from start to finish.');

-- Update movie average ratings
UPDATE movies m
SET rating = (
    SELECT AVG(rating)
    FROM ratings
    WHERE movie_id = m.id
)
WHERE EXISTS (
    SELECT 1 FROM ratings WHERE movie_id = m.id
);