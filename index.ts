var request = require('request');
var mysql = require('mysql');

import {
    sendDeleteSongWebhook,
    sendAddSongWebhook
} from './discord';

const {
    client_info
} = require('./conf/conf');

var access_token = {token: ""};
var liste_songs = Array();
var actual_list_songs = Array();

var con = mysql.createConnection({
    host: "51.254.115.118",
    user: "spotify_user",
    password: client_info.password_db,
    database: "spotify"
});

con.connect(function(err: any) {
    if (err) throw err;
    con.query("SELECT Songs.id as id, removed_at FROM Songs, Playlists_Songs WHERE Playlists_Songs.id_song = Songs.id", function (err: any, result: any, fields: any) {
        if (err) throw err;
        for(var i = 0; i < result.length; i++) {
            liste_songs.push({
                'id': result[i].id,
                'removed_at': result[i].removed_at
            });
        }

        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: { 'Authorization': 'Basic ' + (Buffer.from(client_info.client_id + ':' + client_info.client_secret).toString('base64')) },
            form: {
            grant_type: 'refresh_token',
            refresh_token: client_info.refresh_token
            },
            json: true
        };

        request.post(authOptions, function (error: any, response: any, body: any) {
            if (error) throw error;
            if (!error && response.statusCode === 200) {
            access_token.token = body.access_token;

            let authOptions = { // Options pour la requête API pour obtenir les informations de la playlist
                url: 'https://api.spotify.com/v1/playlists/7FTji2BE2MLqBgSVYoT3iK',
                headers: { 'Authorization': 'Bearer ' + access_token.token },
                json: true
            };

            request.get(authOptions, function (error: any, response: any, body: any) {
                if (error) throw error;
                if (!error && response.statusCode === 200) {
                    var playlist = {
                        "id": "",
                        "name": "",
                        "author": "",
                        "total_tracks": 0,
                        "image": "",
                        "tracks": Array()
                    };

                    playlist.id = "7FTji2BE2MLqBgSVYoT3iK";
                    playlist.name = body.name;
                    playlist.author = body.owner.display_name;
                    playlist.total_tracks = body.tracks.total;
                    playlist.image = body.images[0].url;

                    console.log("liste_songs", liste_songs);


                    tracksRequest("7FTji2BE2MLqBgSVYoT3iK").then((liste: Array<any>) => {
                        let compteur = 0;

                        let sql_songs = "INSERT INTO Songs (id, title, artist, album, duration, url, image_url) VALUES ";
                        let insert_song = false;
                        let sql_playlists_songs = "INSERT INTO Playlists_Songs (id_playlist, id_song, added_at) VALUES ";
                        let insert_playlist_song = false;

                        liste.forEach(async function (track) {

                            actual_list_songs.push({
                                'id': track.id_spotify,
                            });
                            playlist.tracks.push(track);
                            let song_ids = liste_songs.find(song => song.id === track.id_spotify);


                            if(song_ids == undefined) { // si le son n'est pas dans la base de données
                                compteur ++;
                                sql_songs += "('" + track.id_spotify + "', '" + track.title + "', '" + track.artist + "', '" + track.album + "', '" + track.duration  + "', '"  + track.preview_url  + "', '" + track.image + "'),";

                                insert_song = true;
                                insert_playlist_song = true;
                                sql_playlists_songs += "('7FTji2BE2MLqBgSVYoT3iK', '" + track.id_spotify + "', '" + track.added_at + "'),";
                                
                                sendAddSongWebhook(track.id, track.title, track.artist, track.image);

                            } else { // si le son est déjà dans la base de données
                                if(checkPlaylistSong(song_ids.id)) {
                                    insert_playlist_song = true;
                                    sql_playlists_songs += "('7FTji2BE2MLqBgSVYoT3iK', '" + song_ids.id + "', '" + track.added_at + "'),";

                                    sendAddSongWebhook(track.id, track.title, track.artist, track.image);
                                }
                            }
                        })

                        //delete last comma
                        sql_songs = sql_songs.slice(0, -1);
                        sql_playlists_songs = sql_playlists_songs.slice(0, -1);

                        if(insert_song) {
                            con.query(sql_songs, (err: any, result: any, fields: any) => {
                                if (err) throw err;

                                con.query(sql_playlists_songs, (err: any, result: any, fields: any) => {
                                    if (err) throw err;
                                });
                            });
                        } else {
                            if(insert_playlist_song) {
                                con.query(sql_playlists_songs, (err: any, result: any, fields: any) => {
                                    if (err) throw err;
                                });
                            }
                        }

                        liste_songs.forEach(function (song) {
                            if(song.removed_at == null) {
                                let songFind = actual_list_songs.find(s => s.id === song.id);
                                if(songFind == undefined) {

                                    con.query(`SELECT title, artist, image_url FROM Songs as s WHERE s.id = '${song.id}'`, function (err: any, result: any, fields: any) {
                                        if (err) throw err;
                                        sendDeleteSongWebhook(song.id, result[0].title, result[0].artist, result[0].image_url);
                                    });

                                    let sql = "UPDATE Playlists_Songs SET removed_at = NOW() WHERE id_song = '" + song.id + "' AND id_playlist = '7FTji2BE2MLqBgSVYoT3iK'";
                                    con.query(sql, (err: any, result: any, fields: any) => {
                                        if (err) throw err;
                                    });
                                }
                            }
                        });
                    })
                }
            });
            }
        });
        return;
    });
    // con.end();
});

setTimeout(() => {
    con.end();
}, 100000);

function checkPlaylistSong(id_song: String) {
    let song_ids = liste_songs.find(song => song.id === id_song && song.removed_at == null);
    if(song_ids == undefined) {
        return true;
    }
    return false;
}

function addPlaylistSong(id_playlist: String, id_song: String, added_at: String) {
    var sql = "INSERT INTO Playlists_Songs (id_playlist, id_song, added_at) VALUES ('" + id_playlist + "', '" + id_song + "', '" + added_at + "')";
    con.query(sql, (err: any, result: any, fields: any) => {
        if (err) throw err;
        return result.insertId;
    });
}


function  tracksRequest(playlistID: String, offset: number = 0): Promise<any> {
    return new Promise((resolve, reject) => {

        let authOptions = { // Options pour la requête API pour obtenir les informations de la playlist
            url: 'https://api.spotify.com/v1/playlists/' + playlistID + "/tracks?limit=100&offset=" + offset,
            headers: { 'Authorization': 'Bearer ' + access_token.token },
            json: true
        };

        var listeItem = Array();

        request.get(authOptions, function (error: any, response: any, body: any) {
            if (body.items.length === 0) {
                resolve([]);
            } else {
                tracksRequest(playlistID, offset + 100).then((liste) => {

                    listeItem = liste;

                    body.items.forEach(function (track: any) {
                        if (!track.is_local && track.track.type == "track") {
                            var music = {
                                "id_spotify": "",
                                "title": "",
                                "artist": "",
                                "album": "",
                                "duration": 0,
                                "preview_url": "",
                                "image": "",
                                "playlistID": playlistID,
                                "added_at": Date()
                            };


                            music.id_spotify = track.track.id;
                            music.title = track.track.name.replace(/'/g, "''");
                            music.artist = track.track.artists[0].name.replace(/'/g, "''");;
                            music.album = track.track.album.name.replace(/'/g, "''");;
                            music.duration = track.track.duration_ms;
                            music.preview_url = track.track.preview_url?track.track.preview_url:"";
                            music.image = "../images/track_image_default.jpg";
                            var added_at: Date = new Date(track.added_at);
                            music.added_at = added_at.getFullYear() + "-" + (added_at.getMonth() + 1) + "-" + added_at.getDate() + " " + added_at.getHours() + ":" + added_at.getMinutes() + ":" + added_at.getSeconds();
                            if(track.track.album.images[1]) {
                                music.image = track.track.album.images[1].url;
                            }


                            listeItem.push(music);
                        }
                    });

                    resolve(listeItem);
                });
            }
        })
    })
}
