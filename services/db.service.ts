import { SongEntity } from "../classes/song.entity";
import { Query } from "mysql2/typings/mysql/lib/protocol/sequences/Query";

import  mysql, { Connection, RowDataPacket } from 'mysql2/promise';
import { client_info, db_credentials } from "../conf/conf";

let dbConnection: Connection

export async function initDbConnection(): Promise<void> {
    dbConnection = await mysql.createConnection({
        host: db_credentials.host,
        user: db_credentials.user,
        password: db_credentials.password,
        database: db_credentials.database,
        port: db_credentials.port
    });
}

export async function closeDbConnection(): Promise<void> {
    await dbConnection.end();
}

export async function getAllSongsInDb(): Promise<SongEntity[]> {
    let [rows, fields]: [RowDataPacket[][], any] = await dbConnection.query('SELECT s.id, ps.removed_at FROM Songs as s, Playlists_Songs as ps WHERE ps.id_song = s.id AND ps.removed_at IS NULL');

    const listeSongs: SongEntity[] = rows.map((song: any) => {
        const songEntity: SongEntity = {
            id_song: song.id,
            removed_at: song.removed_at
        }
        return songEntity;
    });

    return listeSongs;
}

export async function getSongInfo(id: string): Promise<SongEntity> {
    let [rows, fields]: [RowDataPacket[], any] = await dbConnection.query('SELECT id AS id_song, title, artist, image_url FROM Songs WHERE id = ?', [id]);

    return rows[0] as SongEntity;
}

export async function checkSongExistenceInDb(id: string): Promise<boolean> {
    let [rows, fields]: [RowDataPacket[], any] = await dbConnection.query('SELECT COUNT(*) as exist FROM Songs WHERE id = ?', [id]);

    return rows[0].exist > 0;
}

export async function insertSong(song: SongEntity): Promise<void> {
    await dbConnection.query('INSERT INTO Songs (id, title, artist, album, duration, url, image_url, is_local) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [song.id_song, song.title, song.artist, song.album, song.duration, song.url, song.image_url, song.is_local?1:0]);
}

export async function insertSongInPlaylist(id_playlist: string, id_song: string): Promise<void> {
    await dbConnection.query('INSERT INTO Playlists_Songs (id_playlist, id_song, added_at) VALUES (?, ?, NOW())', [id_playlist, id_song]);
}

export async function removeSongFromPlaylist(id_playlist: string, id_song: string): Promise<void> {
    await dbConnection.query('UPDATE Playlists_Songs SET removed_at = NOW() WHERE id_playlist = ? AND id_song = ?', [id_playlist, id_song]);
}