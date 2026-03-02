import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from '../types/Game';

const STORAGE_KEY = '@my_games_collection';
const WISHLIST_STORAGE_KEY = '@gamelog:wishlist';

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

export async function deleteGameFromStorage(idGameToRemove: number) {
    try {
        const existingGames = await loadGamesFromStorage();

        const updatedGames = existingGames.filter((game) => game.idGame !== idGameToRemove);

        await saveGamesToStorage(updatedGames);
    } catch (error) {
        console.error("Erro ao apagar o jogo do celular:", error);
    }
}

export async function loadWishlistFromStorage(): Promise<Game[]> {
    try {
        const jsonValue = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error("Erro ao carregar a Wishlist:", error);
        return [];
    }
}

export async function saveWishlistToStorage(games: Game[]) {
    try {
        const jsonValue = JSON.stringify(games);
        await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, jsonValue);
    } catch (error) {
        console.error("Erro ao guardar a Wishlist:", error);
    }
}