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
        console.error("Erro ao gerar token do IGDB:", error);
        return null;
    }
}

export async function searchGameImages(gameName: string) {
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
            data: `search "${gameName}"; fields name, cover.image_id, artworks.image_id, screenshots.image_id; limit 15;`
        });

        return response.data;
    } catch (error) {
        console.error("Erro ao buscar no IGDB:", error);
        return [];
    }
}

export function getIgdbImageUrl(imageId: string, size: string = 't_cover_big') {
    if (!imageId) return null;
    return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}