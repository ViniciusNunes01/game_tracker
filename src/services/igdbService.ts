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
        // O Pulo do Gato: A chave agora é o Nome + o Ano de Lançamento
        const year = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : '0000';
        const key = `${game.name.toLowerCase().trim()}-${year}`;

        const existing = groupedByName.get(key);

        if (!existing) {
            groupedByName.set(key, {
                ...game,
                platforms: [...(game.platforms || [])],
            });
            return;
        }

        // Se chegar aqui, é literalmente o mesmo jogo do mesmo ano (talvez listado duplicado pela API)
        // Então nós unimos as plataformas sem apagar o jogo!
        const combinedPlatforms = [...(existing.platforms || []), ...(game.platforms || [])];
        const uniquePlatforms = combinedPlatforms.filter((platform, index, self) =>
            index === self.findIndex((p) => p.id === platform.id)
        );

        groupedByName.set(key, {
            ...existing,
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
        const query = `fields name,first_release_date,game_type,version_parent,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,platforms.abbreviation; where name ~ *"${gameName}"*; limit 50;`;

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

            // Treat missing/undefined type as acceptable (IGDB sometimes omits these fields)
            const isValidType = (typeof normalizedType === 'number' ? validGameTypes.includes(normalizedType) : true) || isRemasterByName;
            const hasVersionParent = !!game.version_parent;
            const matchesExcludePattern = excludePatterns.some(pattern => pattern.test(game.name));

            const allowsVersionParent = (typeof normalizedType === 'number' && [3, 4, 7, 8, 9, 10].includes(normalizedType)) || isRemasterByName;
            const shouldExclude = hasVersionParent && !allowsVersionParent;

            return isValidType && !shouldExclude && !matchesExcludePattern;
        });

        return filtered;
    } catch (error) {
        return [];
    }
}

export function getIgdbImageUrl(imageId?: string, size: string = 't_cover_big') {
    if (!imageId) return null;
    return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}

export interface IgdbExpansion {
    id: number;
    name: string;
    cover?: { image_id?: string };
}

// Busca expansões (DLCs) relacionadas ao jogo pelo IGDB ID
export const getExpansionsByIgdbId = async (igdbId: number): Promise<IgdbExpansion[]> => {
    const token = await getIgdbToken();
    if (!token) return [];

    try {
        const response = await axios({
            url: 'https://api.igdb.com/v4/games',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Client-ID': CLIENT_ID as string,
                'Authorization': `Bearer ${token}`,
            },
            // AGORA PEDIMOS dlcs E expansions NA MESMA REQUISIÇÃO
            data: `fields expansions.name, expansions.id, expansions.cover.image_id, dlcs.name, dlcs.id, dlcs.cover.image_id; where id = ${igdbId}; limit 1;`
        });

        const game = response.data && response.data[0];
        if (!game) return [];

        // Juntamos as duas listas
        const expansions = game.expansions || [];
        const dlcs = game.dlcs || [];
        const combined = [...expansions, ...dlcs];

        // Remove possíveis duplicatas caso o IGDB retorne o mesmo item nas duas listas
        const unique = combined.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );

        return unique as IgdbExpansion[];
    } catch (error) {
        return [];
    }
};

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