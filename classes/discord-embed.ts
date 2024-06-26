type DiscordEmbed = {
    title: string,
    description: string,
    color: number,
    thumbnail: {
        url: string
    },
    url?: string
}

export type DiscordEmbeds = {
    embeds: Array<DiscordEmbed>
}