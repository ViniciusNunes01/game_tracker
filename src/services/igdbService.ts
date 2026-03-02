import axios from 'axios';

const CLIENT_ID = process.env.EXPO_PUBLIC_IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_IGDB_CLIENT_SECRET;

let accessToken: string | null = null;

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

export async function searchGameImages(gameName: string) {
    const token = await getIgdbToken();
    if (!token) return [];

    try {
        const query = `fields name,first_release_date,game_type,category,version_parent,cover.image_id,artworks.image_id,screenshots.image_id,expansions; search "${gameName}"; limit 50;`;

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
            /Edition/i,
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
        const filtered = response.data.filter((game: any) => {
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
            // Adicionado cover.image_id aqui também por segurança!
            data: `fields cover.image_id, artworks.image_id, screenshots.image_id; where id = ${igdbId}; limit 1;`
        });
        return response.data[0];
    } catch (error) {
        throw error;
    }
};