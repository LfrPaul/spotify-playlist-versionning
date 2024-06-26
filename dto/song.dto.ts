export interface SongDto {
    track: {
        id: string,
        name: string,
        artists: any[],
        album: {
            name: string,
            images: any[]
        },
        duration_ms: number,
        preview_url: string,
        uri: string
    }
    added_at: Date,
    is_local: boolean
}