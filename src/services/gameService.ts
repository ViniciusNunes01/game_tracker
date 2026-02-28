import { Game } from "../types/Game";
import { loadGamesFromStorage } from "./storageService";


export async function getGameById(idGame: number) {
    // 1. Pega os jogos reais que estão salvos no celular
    const savedGames = await loadGamesFromStorage();

    // 2. Procura o ID lá dentro
    return savedGames.find((game) => game.idGame === idGame);
}