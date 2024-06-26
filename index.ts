import { SongEntity } from './classes/song.entity';
import {
    sendDeleteSongWebhook,
    sendAddSongWebhook
} from './services/discord.service';

import { checkSongExistenceInDb, closeDbConnection, getAllSongsInDb, getSongInfo, initDbConnection, insertSong, insertSongInPlaylist, removeSongFromPlaylist } from './services/db.service';
import { getPlaylistSongs, initSpotifyToken } from './services/spotify-api.service';


async function main() {
    await initDbConnection()
    await initSpotifyToken()

    const listeSongsDb: Array<SongEntity> = await getAllSongsInDb()

    const listeSongsSpotifyApi: Array<SongEntity> = (await getPlaylistSongs()).map((song) => {
        const songEntity: SongEntity = {
            id_song: song.track.id,
            title: song.track.name.replace(/'/g, "''"),
            artist: song.track.artists[0].name.replace(/'/g, "''"),
            album: song.track.album.name.replace(/'/g, "''"),
            duration: song.track.duration_ms,
            url: song.track.preview_url ? song.track.preview_url : "",
            added_at: new Date(song.added_at),
            image_url: song.track.album.images[1]?.url? song.track.album.images[1].url : "",
            is_local: song.is_local
        }

        return songEntity
    });

    const playlistSongsToInsert: Array<SongEntity> = listeSongsSpotifyApi.filter((song) => {
        return listeSongsDb.find((song_db) => song_db.id_song === song.id_song) === undefined
    });
    
    const songsToInsert: Array<SongEntity> = Array<SongEntity>();

    for(const song of playlistSongsToInsert) {
        if(!(await checkSongExistenceInDb(song.id_song))) {
            songsToInsert.push(song)
        }
    };

    // son pas encore dans la table Songs
    songsToInsert.forEach(async (song) => {
        await insertSong(song)
    });

    // son pas encore dans la table Playlists_Songs
    playlistSongsToInsert.forEach(async (song) => {
        await insertSongInPlaylist('7FTji2BE2MLqBgSVYoT3iK', song.id_song, song.added_at!!)
        sendAddSongWebhook(song.id_song, song.title!!, song.artist!!, song.image_url!!, song.is_local!!)
    });

    const playlistSongsToDelete: Array<SongEntity> = listeSongsDb.filter((song) => {
        return listeSongsSpotifyApi.find((song_spotify) => song_spotify.id_song === song.id_song) === undefined
    });

    
    playlistSongsToDelete.forEach(async (song) => {
        const songInfo = await getSongInfo(song.id_song)
        sendDeleteSongWebhook(song.id_song, songInfo.title!!, songInfo.artist!!, songInfo.image_url!!, song.is_local!!)

        await removeSongFromPlaylist('7FTji2BE2MLqBgSVYoT3iK', song.id_song)
    });
    
    await closeDbConnection()
}

main()
