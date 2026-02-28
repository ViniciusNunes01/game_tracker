import { Platform } from '../types/Platform';

export const availablePlatforms: Platform[] = [
    {
        idPlatform: 1,
        name: 'PS5',
        releaseYear: 2020,
        manufacturer: 'Sony',
        description: 'Console de nona geração da Sony.',
        funFact: 'O controle DualSense possui atuadores de bobina de voz para um feedback tátil ultra preciso.'
    },
    {
        idPlatform: 2,
        name: 'PS4',
        releaseYear: 2013,
        manufacturer: 'Sony'
    },
    {
        idPlatform: 3,
        name: 'PS3',
        releaseYear: 2006,
        manufacturer: 'Sony',
        funFact: 'O processador Cell do PS3 era tão poderoso que a Força Aérea dos EUA ligou 1.760 deles em rede para criar um supercomputador.'
    },
    {
        idPlatform: 4,
        name: 'PS Vita',
        releaseYear: 2011,
        manufacturer: 'Sony',
        description: 'Console portátil poderoso com tela OLED na sua primeira versão.',
    }
];

export function getPlatformById(id: number): Platform | undefined {
    return availablePlatforms.find(p => p.idPlatform === id);
}