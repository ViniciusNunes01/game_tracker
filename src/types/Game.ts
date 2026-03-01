import { Platform } from "./Platform";

export type GameStatus = string;
export type MediaType = 'physical' | 'digital';

export type CoverOffset = {
    x: number;
    y: number;
    scale: number;
};

export interface Game {

    idGame: number;
    rawgId?: number;

    name: string;
    coverUrl: string;
    releaseYear: number;

    personalDescription?: string;
    platforms: Platform[];
    status: GameStatus;
    mediaType?: MediaType;
    myCollection?: boolean;

    coverOffset?: CoverOffset;
}

