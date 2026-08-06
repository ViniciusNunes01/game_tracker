import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from '../types/Game';

const STORAGE_KEY = '@my_games_collection';
const WISHLIST_STORAGE_KEY = '@gamelog:wishlist';
const EXPANSION_OWNERSHIP_KEY = '@gamelog:expansion_ownership';
const ROULETTE_STATS_KEY = '@gamelog:roulette_stats';
const ROULETTE_ACTIVE_GAME_KEY = '@gamelog:roulette_active_game_id';

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

export async function updateGameStatusInStorage(idGameToUpdate: number, status: string) {
    try {
        const existingGames = await loadGamesFromStorage();
        const updatedGames = existingGames.map((game) => {
            if (game.idGame !== idGameToUpdate) return game;
            return {
                ...game,
                status,
            };
        });

        await saveGamesToStorage(updatedGames);
    } catch (error) {
        console.error('Erro ao atualizar o status do jogo:', error);
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

export async function loadExpansionOwnership(): Promise<Record<string, boolean>> {
    try {
        const jsonValue = await AsyncStorage.getItem(EXPANSION_OWNERSHIP_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (error) {
        console.error("Erro ao carregar posse de expansões:", error);
        return {};
    }
}

export async function saveExpansionOwnership(ownership: Record<string, boolean>) {
    try {
        const jsonValue = JSON.stringify(ownership);
        await AsyncStorage.setItem(EXPANSION_OWNERSHIP_KEY, jsonValue);
    } catch (error) {
        console.error("Erro ao salvar posse de expansões:", error);
    }
}

export async function setExpansionOwnership(expansionId: number, owned: boolean) {
    const currentOwnership = await loadExpansionOwnership();
    currentOwnership[String(expansionId)] = owned;
    await saveExpansionOwnership(currentOwnership);
}

export async function getExpansionOwnership(expansionId: number): Promise<boolean | null> {
    const ownership = await loadExpansionOwnership();
    const value = ownership[String(expansionId)];
    return typeof value === 'boolean' ? value : null;
}

type RouletteStats = {
    acceptedCount: number;
};

export async function loadRouletteStats(): Promise<RouletteStats> {
    try {
        const jsonValue = await AsyncStorage.getItem(ROULETTE_STATS_KEY);
        if (!jsonValue) return { acceptedCount: 0 };

        const parsed = JSON.parse(jsonValue) as Partial<RouletteStats>;
        return {
            acceptedCount: typeof parsed.acceptedCount === 'number' ? parsed.acceptedCount : 0,
        };
    } catch (error) {
        console.error('Erro ao carregar estatísticas da roleta:', error);
        return { acceptedCount: 0 };
    }
}

export async function saveRouletteStats(stats: RouletteStats) {
    try {
        const jsonValue = JSON.stringify(stats);
        await AsyncStorage.setItem(ROULETTE_STATS_KEY, jsonValue);
    } catch (error) {
        console.error('Erro ao salvar estatísticas da roleta:', error);
    }
}

export async function incrementRouletteAcceptedCount(): Promise<number> {
    const stats = await loadRouletteStats();
    const nextStats = { ...stats, acceptedCount: stats.acceptedCount + 1 };
    await saveRouletteStats(nextStats);
    return nextStats.acceptedCount;
}

export async function resetRouletteAcceptedCount(): Promise<number> {
    const nextStats = { acceptedCount: 0 };
    await saveRouletteStats(nextStats);
    return nextStats.acceptedCount;
}

export async function saveRouletteActiveGameId(gameId: number | null) {
    try {
        if (gameId === null) {
            await AsyncStorage.removeItem(ROULETTE_ACTIVE_GAME_KEY);
            return;
        }

        await AsyncStorage.setItem(ROULETTE_ACTIVE_GAME_KEY, String(gameId));
    } catch (error) {
        console.error('Erro ao salvar o jogo ativo da roleta:', error);
    }
}

export async function loadRouletteActiveGameId(): Promise<number | null> {
    try {
        const value = await AsyncStorage.getItem(ROULETTE_ACTIVE_GAME_KEY);
        if (!value) return null;

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    } catch (error) {
        console.error('Erro ao carregar o jogo ativo da roleta:', error);
        return null;
    }
}