import { discord_webhook } from "../conf/conf";

var request = require('request');


const colors = {
    "add": 2021216,
    "delete": 13842231
}

const spotify_base_url = "https://open.spotify.com/intl-fr/track/";

function sendWebhook(url: String, addSong: boolean, content: String, url_thumbnail: String) {
    const body = {
        "embeds": [
          {
            "title": addSong?"Ajout d'un son":"Suppression d'un son",
            "description": `${content} a été ${addSong?"ajouté à":"supprimé de"} la playlist`,
            "color": addSong?colors.add:colors.delete,
            "fields": [],
            "thumbnail": {
              "url": url_thumbnail
            },
            "url": url
          }
        ]
    }
    

    request.post({
        url: discord_webhook.url,
        body: body,
        headers : {
            "content-type": "application/json",
        },
        json: true
    })

}

function sendAddSongWebhook(id: String, title: String, artist: String, url_thumbnail: String) {
    sendWebhook(`${spotify_base_url}${id}`, true, `**${title}** de **${artist}**`, url_thumbnail);
}

function sendDeleteSongWebhook(id: String, title: String, artist: String, url_thumbnail: String) {
    sendWebhook(`${spotify_base_url}${id}`, false, `**${title}** de **${artist}**`, url_thumbnail);
}

export {
    sendDeleteSongWebhook,
    sendAddSongWebhook
};