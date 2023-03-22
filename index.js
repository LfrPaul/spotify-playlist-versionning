var request = require('request');
var mysql = require('mysql');

const {
    client_info
} = require('./conf/conf');

var access_token = {token: ""};
var liste_songs = [];

var con = mysql.createConnection({
    host: "51.254.115.118",
    user: "spotify_user",
    password: client_info.password_db,
    database: "spotify"
});
  
con.connect(function(err) {
    if (err) throw err;
    con.query("SELECT id_spotify, id FROM Songs", function (err, result, fields) {
        if (err) throw err;
        for(var i = 0; i < result.length; i++) {
            liste_songs.push({
                'id_spotify': result[i].id_spotify,
                'id': result[i].id
            });
        }

        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_info.client_id + ':' + client_info.client_secret).toString('base64')) },
            form: {
            grant_type: 'refresh_token',
            refresh_token: client_info.refresh_token
            },
            json: true
        };
        
        request.post(authOptions, function (error, response, body) {
            if (error) throw error;
            if (!error && response.statusCode === 200) {
            access_token.token = body.access_token;
        
            let authOptions = { // Options pour la requête API pour obtenir les informations de la playlist
                url: 'https://api.spotify.com/v1/playlists/7FTji2BE2MLqBgSVYoT3iK',
                headers: { 'Authorization': 'Bearer ' + access_token.token },
                json: true
            };
        
            request.get(authOptions, function (error, response, body) {
                if (error) throw error;
                if (!error && response.statusCode === 200) {
                    var playlist = {
                        "id": "",
                        "name": "",
                        "author": "",
                        "total_tracks": 0,
                        "image": "",
                        "tracks": []
                    };
        
                    playlist.id = "7FTji2BE2MLqBgSVYoT3iK";
                    playlist.name = body.name;
                    playlist.author = body.owner.display_name;
                    playlist.total_tracks = body.tracks.total;
                    playlist.image = body.images[0].url;

                    var sql = "INSERT INTO Playlists_Versions (id_playlist, date) VALUES ('" + playlist.id + "', NOW())";
                    con.query(sql, (err, result, fields) => {
                        if (err) throw err;
                        let playlist_version_id = result.insertId;

                        tracksRequest("7FTji2BE2MLqBgSVYoT3iK").then((liste) => {
                            let compteur = 0;
                            liste.forEach(async function (track) {
                                playlist.tracks.push(track);
                                let song_ids = liste_songs.find(song => song.id_spotify === track.id_spotify);
                                if(song_ids != -1) {
                                    compteur ++;
                                    var sql = "INSERT INTO Songs (id_spotify, title, artist, album, duration, url, image_url) VALUES ('" + track.id_spotify + "', '" + track.title + "', '" + track.artist + "', '" + track.album + "', '" + track.duration  + "', '"  + track.preview_url  + "', '" + track.image + "')";
                                    await con.query(sql, (err, result, fields) => {
                                        if (err) throw err;
                                        const new_song_id = result.insertId;
                                        var sql = "INSERT INTO Playlists_Versions_Songs (id_playlist_version, id_song, added_at) VALUES ('" + playlist_version_id + "', '" + new_song_id + "', '" + track.added_at + "')";
                                        con.query(sql, (err, result, fields) => {
                                            if (err) throw err;
                                            return result.insertId;
                                        });
                                        return;
                                    });
                                } else {
                                    var sql = "INSERT INTO Playlists_Versions_Songs (id_playlist_version, id_song, added_at) VALUES ('" + playlist_version_id + "', '" + song_ids.id + "', '" + track.added_at + "')";
                                    await con.query(sql, (err, result, fields) => {
                                        if (err) throw err;
                                        return result.insertId;
                                    });
                                }
                            })
                        })
                        return
                    });
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
  

function tracksRequest(playlistID, offset = 0) {
    return new Promise((resolve, reject) => {

        let authOptions = { // Options pour la requête API pour obtenir les informations de la playlist
            url: 'https://api.spotify.com/v1/playlists/' + playlistID + "/tracks?limit=100&offset=" + offset,
            headers: { 'Authorization': 'Bearer ' + access_token.token },
            json: true
        };

        listeItem = [];

        request.get(authOptions, function (error, response, body) {
            if (body.items.length === 0) {
                resolve([]);
            } else {
                tracksRequest(playlistID, offset + 100).then((liste) => {
                        
                    listeItem = liste;

                    body.items.forEach(function (track) {
                        if (!track.is_local && track.track.type == "track" && track.track.preview_url != null) {
                            var music = {
                                "id_spotify": "",
                                "title": "",
                                "artist": "",
                                "album": "",
                                "duration": 0,
                                "preview_url": "",
                                "image": "",
                                "playlistID": playlistID,
                                "added_at": undefined
                            };
        
        
                            music.id_spotify = track.track.id;
                            music.title = track.track.name.replace(/'/g, "''");
                            music.artist = track.track.artists[0].name.replace(/'/g, "''");;
                            music.album = track.track.album.name.replace(/'/g, "''");;
                            music.duration = track.track.duration_ms;
                            music.preview_url = track.track.preview_url;
                            music.image = "../images/track_image_default.jpg";
                            music.added_at = new Date(track.added_at);
                            music.added_at = music.added_at.getFullYear() + "-" + (music.added_at.getMonth() + 1) + "-" + music.added_at.getDate() + " " + music.added_at.getHours() + ":" + music.added_at.getMinutes() + ":" + music.added_at.getSeconds();
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