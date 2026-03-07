import axios from 'axios';

const CLIENT_ID = process.env.EXPO_PUBLIC_IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_IGDB_CLIENT_SECRET;

let accessToken: string | null = null;

export interface IgdbPlatform {
    id: number;
    name: string;
    abbreviation?: string;
}

export interface IgdbGameResult {
    id: number;
    name: string;
    first_release_date?: number;
    game_type?: number;
    category?: number;
    version_parent?: number;
    cover?: { image_id?: string };
    artworks?: Array<{ image_id: string }>;
    screenshots?: Array<{ image_id: string }>;
    platforms?: IgdbPlatform[];
}

export function mergeIgdbGamesByName(games: IgdbGameResult[]): IgdbGameResult[] {
    const groupedByName = new Map<string, IgdbGameResult>();

    games.forEach((game) => {
        const key = game.name.toLowerCase().trim();
        const existing = groupedByName.get(key);

        if (!existing) {
            groupedByName.set(key, {
                ...game,
                platforms: [...(game.platforms || [])],
            });
            return;
        }

        const combinedPlatforms = [...(existing.platforms || []), ...(game.platforms || [])];
        const uniquePlatforms = combinedPlatforms.filter((platform, index, self) =>
            index === self.findIndex((p) => p.id === platform.id)
        );

        const existingDate = existing.first_release_date || Number.MAX_SAFE_INTEGER;
        const currentDate = game.first_release_date || Number.MAX_SAFE_INTEGER;
        const canonicalGame = currentDate < existingDate ? game : existing;

        groupedByName.set(key, {
            ...canonicalGame,
            platforms: uniquePlatforms,
        });
    });

    return Array.from(groupedByName.values());
}

export async function getIgdbToken() {
    if (accessToken) return accessToken;

    try {
        const response = await axios.post(
            `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
        );
        accessToken = response.data.access_token;
        return accessToken;
    } catch (error) {
        return null;
    }
}

export async function searchGameImages(gameName: string): Promise<IgdbGameResult[]> {
    const token = await getIgdbToken();
    if (!token) return [];

    try {
        const query = `fields name,first_release_date,game_type,version_parent,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,platforms.abbreviation; search "${gameName}"; limit 50;`;

        const response = await axios({
            url: 'https://api.igdb.com/v4/games',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Client-ID': CLIENT_ID as string,
                'Authorization': `Bearer ${token}`,
            },
            data: query
        });

        if (!Array.isArray(response.data)) return [];

        // Palavras-chave para excluir DLCs, edições especiais, etc
        const excludePatterns = [
            /Bundle/i,
            /Pack/i,
            /Collection/i,
            /DLC/i,
            /Ultimate/i,
            /Game of the Year/i,
            /Deluxe/i,
            /Collector/i,
            /Limited/i,
            /Complete/i,
            /Special/i
        ];

        // Filtra jogos válidos considerando variações de enums do IGDB (game_type/category)
        const filtered = response.data.filter((game: IgdbGameResult) => {
            const normalizedType = game.game_type ?? game.category;
            const validGameTypes = [0, 3, 4, 7, 8, 9, 10];
            const isRemasterByName = /remaster|remastered/i.test(game.name || '');
            const isValidType = validGameTypes.includes(normalizedType) || isRemasterByName;
            const hasVersionParent = !!game.version_parent;
            const matchesExcludePattern = excludePatterns.some(pattern => pattern.test(game.name));

            const allowsVersionParent = [3, 4, 7, 8, 9, 10].includes(normalizedType) || isRemasterByName;
            const shouldExclude = hasVersionParent && !allowsVersionParent;

            return isValidType && !shouldExclude && !matchesExcludePattern;
        });

        return filtered;
    } catch (error) {
        return [];
    }
}

export function getIgdbImageUrl(imageId: string, size: string = 't_cover_big') {
    if (!imageId) return null;
    return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}

// Nova função: Busca cirúrgica pelo ID exato do jogo
export const getGameImagesByIgdbId = async (igdbId: number) => {
    const token = await getIgdbToken();
    if (!token) return null;

    try {
        const response = await axios({
            url: 'https://api.igdb.com/v4/games',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Client-ID': CLIENT_ID as string,
                'Authorization': `Bearer ${token}`,
            },
            data: `fields cover.image_id, artworks.image_id, screenshots.image_id, platforms.name, platforms.abbreviation; where id = ${igdbId}; limit 1;`
        });
        return response.data[0];
    } catch (error) {
        throw error;
    }
};