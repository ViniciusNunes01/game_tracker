export type Platform = 'PS5' | 'PS4' | 'Xbox Series' | 'PC' | 'Switch';
export type GameStatus = 'playing' | 'completed' | 'backlog' | 'abandoned';
export type MediaType = 'physical' | 'digital';

export interface Game {

    idGame: number;
    rawgId?: number;

    name: string;
    coverUrl: string;
    releaseYear: number;

    personalDescription: string;
    platforms: Platform[];
    status: GameStatus;
    mediaType?: MediaType;
    myCollection?: boolean;
}