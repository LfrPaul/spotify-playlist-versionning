CREATE TABLE `Playlists` (
  `id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Playlists` (`id`) VALUES
('7FTji2BE2MLqBgSVYoT3iK');

CREATE TABLE `Playlists_Songs` (
  `id` int NOT NULL,
  `id_playlist` varchar(255) NOT NULL,
  `id_song` varchar(255) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `removed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Songs` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `artist` varchar(255) NOT NULL,
  `album` varchar(255) NOT NULL,
  `duration` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `image_url` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `Playlists`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `Playlists_Songs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_playlist` (`id_playlist`),
  ADD KEY `id_song` (`id_song`);

ALTER TABLE `Songs`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `Playlists_Songs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=227;

ALTER TABLE `Playlists_Songs`
  ADD CONSTRAINT `Playlists_Songs_ibfk_1` FOREIGN KEY (`id_playlist`) REFERENCES `Playlists` (`id`),
  ADD CONSTRAINT `Playlists_Songs_ibfk_2` FOREIGN KEY (`id_song`) REFERENCES `Songs` (`id`);
COMMIT;