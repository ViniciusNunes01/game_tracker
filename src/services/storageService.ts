import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from '../types/Game';

const STORAGE_KEY = '@my_games_collection';

export async function saveGamesToStorage(games: Game[]) {
    try {

        const jsonValue = JSON.stringify(games);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
        console.error("Erro ao salvar os jogos no celular:", error);
    }
}

export async function loadGamesFromStorage(): Promise<Game[]> {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);

        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error("Erro ao carregar os jogos do celular:", error);
        return [];
    }
}