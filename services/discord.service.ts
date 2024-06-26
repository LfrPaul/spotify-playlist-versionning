import { DiscordEmbeds } from "../classes/discord-embed";
import { discord_webhook } from "../conf/conf";

var request = require('request');

const colors = {
    "add": 2021216,
    "delete": 13842231
}

const spotify_base_url = "https://open.spotify.com/intl-fr/track/";

function sendWebhook(addSong: boolean, content: string, url_thumbnail: string, url?: string) {
    const body: DiscordEmbeds = {
        "embeds": [
          {
            "title": addSong?"Ajout d'un son":"Suppression d'un son",
            "description": `${content} a été ${addSong?"ajouté à":"supprimé de"} la playlist`,
            "color": addSong?colors.add:colors.delete,
            "thumbnail": {
              "url": url_thumbnail
            }
          }
        ]
    }

    if(url) {
        body.embeds[0].url = url
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

function sendAddSongWebhook(id: string, title: string, artist: string, url_thumbnail: string, is_local: boolean) {
    sendWebhook(true, artist?`**${title}** de **${artist}**`:`**${title}**`, url_thumbnail, !is_local?`${spotify_base_url}${id}`:undefined);
}

function sendDeleteSongWebhook(id: string, title: string, artist: string, url_thumbnail: string, is_local: boolean) {
    sendWebhook(false, artist?`**${title}** de **${artist}**`:`**${title}**`, url_thumbnail, !is_local?`${spotify_base_url}${id}`:undefined);
}

export {
    sendDeleteSongWebhook,
    sendAddSongWebhook
};