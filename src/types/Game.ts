import { Platform } from "./Platform";

export type MediaType = 'physical' | 'digital';

export type CoverOffset = {
    x: number;
    y: number;
    scale: number;
};

export interface Game {

    idGame: number;
    name: string;
    releaseYear: number;
    personalDescription?: string;
    platforms: Platform[];
    status: string;
    mediaType?: MediaType;
    myCollection?: boolean;

    coverUrl: string;
    boxArtUrl?: string;
}

