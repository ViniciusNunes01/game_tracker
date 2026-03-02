import { Link, router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getGameById } from "../../src/services/gameService";
import { useCallback, useState } from "react";
import { Game } from "@/src/types/Game";
import { deleteGameFromStorage } from "@/src/services/storageService";

export default function GameDetail() {

    const { idGame } = useLocalSearchParams();
    const idGameString = Array.isArray(idGame) ? idGame[0] : idGame;
    const gameId = Number(idGameString || "0");

    const [game, setGame] = useState<Game | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            async function fetchGame() {
                const foundGame = await getGameById(gameId);
                setGame(foundGame || null);
                setIsLoading(false);
            }
            fetchGame();
        }, [gameId])
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8257E5" />
            </View>
        );
    }

    if (!game) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.description}>Jogo não encontrado!</Text>
            </View>
        )
    }

    const handleDelete = () => {
        Alert.alert(
            "Apagar Jogo",
            `Tem certeza que deseja remover "${game?.name}" da sua coleção?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Apagar",
                    style: "destructive",
                    onPress: async () => {
                        await deleteGameFromStorage(gameId);
                        router.replace('/');
                    }
                }
            ]
        );
    };

    // --- Tratamento Inteligente de Múltiplas Mídias ---
    const getMediaText = () => {
        if (!game.mediaType) return null;
        
        // Garante que é um array para iterar facilmente
        const mediaArray = Array.isArray(game.mediaType) ? game.mediaType : [game.mediaType];
        
        if (mediaArray.length === 0) return null;

        // Traduz e junta com um "•"
        const translated = mediaArray.map(m => m === 'physical' ? 'Física' : 'Digital');
        return translated.join(' • ');
    };

    const mediaText = getMediaText();

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Stack.Screen options={{
                title: "Detalhes",
                headerBackTitle: "Voltar",
                headerRight: () => (
                    <Link href={`/game/edit/${game.idGame}`} asChild>
                        <TouchableOpacity>
                            <Text style={{ color: '#8257E5', fontSize: 16, fontWeight: 'bold' }}>Editar</Text>
                        </TouchableOpacity>
                    </Link>
                )
            }} />

            <Image
                source={{ uri: game.coverUrl }}
                style={styles.cover}
                resizeMode="cover"
            />

            <View style={styles.content}>
                <Text style={styles.title}>{game.name}</Text>

                {/* Container com flexWrap para não quebrar a tela se tiver muitas plataformas */}
                <View style={styles.chipsContainer}>
                    {game.platforms?.length > 0 ? (
                        game.platforms.map((plat, index) => (
                            <View key={index} style={styles.chip}>
                                <Text style={styles.chipText}>
                                    {typeof plat === 'string' ? plat : plat.name}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>Sem Plataforma</Text>
                        </View>
                    )}

                    <View style={[styles.chip, styles.chipStatus]}>
                        <Text style={styles.chipTextStatus}>{game.status?.toUpperCase() || 'BACKLOG'}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Anotações</Text>
                {game.personalDescription ? (
                    <Text style={styles.description}>{game.personalDescription}</Text>
                ) : (
                    <Text style={[styles.description, { fontStyle: 'italic', color: '#7C7C8A' }]}>
                        Nenhuma anotação salva para este jogo.
                    </Text>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Lançado em {game.releaseYear}</Text>
                    {mediaText && (
                        <>
                            <Text style={styles.footerText}>•</Text>
                            <Text style={styles.footerText}>{mediaText}</Text>
                        </>
                    )}
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Apagar Jogo da Coleção</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
    },
    cover: {
        width: "100%",
        height: 250,
        backgroundColor: "#000",
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: "#E1E1E6",
        lineHeight: 24,
        marginTop: 8,
        marginBottom: 24,
    },
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap", // <-- Isso salva o layout se houver muitas tags!
        marginBottom: 24,
        gap: 10,
    },
    chip: {
        backgroundColor: "#323238",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    chipStatus: {
        backgroundColor: "#00B37E",
    },
    chipText: {
        color: "#E1E1E6",
        fontSize: 13,
        fontWeight: "bold",
    },
    chipTextStatus: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "bold",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#323238",
        paddingBottom: 8,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "#323238",
        paddingTop: 16,
        marginTop: 8,
    },
    footerText: {
        color: "#7C7C8A",
        fontSize: 14,
        fontWeight: "600",
    },
    deleteButton: {
        marginTop: 40,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FF6B6B",
        backgroundColor: "rgba(255, 107, 107, 0.1)", // Fundo avermelhado super leve (elegante)
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: 'bold',
    }
});