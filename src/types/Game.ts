export type Platform = 'PS5' | 'PS4' | 'Xbox Series' | 'PC' | 'Switch';
export type GameStatus = 'playing' | 'completed' | 'backlog' | 'abandoned';
export type MediaType = 'physical' | 'digital';

export interface Game {
    idGame: number;
    name: string;
    image: string;
    description: string;
    releaseYear: number;
    platforms: Platform[];
    status: GameStatus;
    mediaType?: MediaType;
    myCollection?: boolean;
}