import { client_info } from "../conf/conf";
import { PlaylistSongs } from "../dto/playlist-songs.dto";
import { SongDto } from "../dto/song.dto";
import { TokenDto } from "../dto/token.dto";

let access_token: string;

export async function initSpotifyToken(): Promise<void> {
    const headers: Headers = new Headers();
    headers.set('Authorization', `Basic ${Buffer.from(client_info.client_id + ':' + client_info.client_secret).toString('base64')}`)

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: client_info.refresh_token
    })

    const token: TokenDto = await spotifyRequest<TokenDto>(
        'https://accounts.spotify.com/api/token',
        'post',
        headers,
        body
    )

    access_token = token.access_token
}

export async function getPlaylistSongs(offset: number = 0): Promise<SongDto[]> {
    const headers: Headers = new Headers();
    headers.delete('Authorization');
    headers.set('Authorization', `Bearer ${access_token}`)

    const playlist = await spotifyRequest<PlaylistSongs>(
        `https://api.spotify.com/v1/playlists/7FTji2BE2MLqBgSVYoT3iK/tracks?limit=100&offset=${offset}`,
        'get',
        headers
    );

    if(playlist.items.length === 0) {
        return [];
    } else {
        const nextSongs = await getPlaylistSongs(offset + 100);
        playlist.items.push(...nextSongs);
    }

    const playlistSongs: Array<SongDto> = playlist.items.filter((song) => !song.is_local).map((song) => song as SongDto);

    
    return playlistSongs;
}

async function spotifyRequest<T>(url: string, method: string, headers: Headers, body: URLSearchParams | null = null) {
    let request: Request;
    if(body) {
        request = new Request(url, {
            method,
            headers,
            body
        })
    } else {
        request = new Request(url, {
            method,
            headers,
        })
    }

    const response = await fetch(request)

    return response.json() as Promise<T>
}