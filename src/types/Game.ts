import { Platform } from "./Platform";

export type CoverOffset = {
    x: number;
    y: number;
    scale: number;
};

export interface Game {

    idGame: number;
    igdbId?: number;

    name: string;
    releaseYear: number;
    personalDescription?: string;
    platforms: Platform[];
    status: string;
    mediaType?: string | string[];
    myCollection?: boolean;

    coverUrl: string;
    boxArtUrl?: string;
}

