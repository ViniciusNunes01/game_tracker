import { Game } from "../types/Game";

export const mockGames: Game[] = [
    {
        idGame: 1,
        name: "Red Dead Redemption 2",
        coverUrl: "https://images.wallpapersden.com/image/download/red-dead-redemption-2-minimal-gaming_bWxpamiUmZqaraWkpJRmbmdlrWZlbWU.jpg",
        status: "completed",
        personalDescription: "Arthur Morgan e a gangue Van der Linde são forçados a fugir. Com agentes federais e os melhores caçadores de recompensas em seu encalço, a gangue deve roubar, assaltar e lutar pelo coração robusto da América para sobreviver.",
        releaseYear: 2018,
        platforms: ['PS4', "Xbox Series", 'PC'],
        mediaType: "physical",
        myCollection: true,
    },
    {
        idGame: 2,
        name: "Cyberpunk 2077",
        coverUrl: "https://images7.alphacoders.com/131/1317815.png",
        status: "playing",
        personalDescription: "Cyberpunk 2077 é uma história de ação e aventura em mundo aberto ambientada em Night City, uma megalópole obcecada por poder, glamour e modificação corporal.",
        releaseYear: 2020,
        platforms: ['PS5', 'PC'],
        mediaType: "digital",
        myCollection: true,
    },
    {
        idGame: 3,
        name: "Baldur's Gate 3",
        coverUrl: "https://4kwallpapers.com/images/wallpapers/baldurs-gate-3-pc-3440x1440-12716.jpeg",
        status: "backlog",
        personalDescription: "Reúna seu grupo e volte aos Reinos Esquecidos em uma história de amizade e traição, sacrifício e sobrevivência, e o atrativo do poder absoluto.",
        releaseYear: 2023,
        platforms: ['PC'],
        mediaType: "digital",
        myCollection: false,
    },
];

export function getGameById(idGame: number) {

    return (
        mockGames.find((game) => game.idGame === idGame)
    )

}