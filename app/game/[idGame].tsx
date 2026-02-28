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
            <View style={styles.container}>
                <Text style={styles.description}>Jogo não encontrado!</Text>
            </View>
        )
    }

    const handleDelete = () => {
        Alert.alert(
            "Apagar Jogo",
            `Tem certeza que deseja remover "${game?.name}" da sua coleção?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
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

    return (
        <ScrollView style={styles.container}>
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
                            <Text style={styles.chipText}>Nenhuma</Text>
                        </View>
                    )}

                    <View style={[styles.chip, styles.chipStatus]}>
                        <Text style={styles.chipTextStatus}>{game.status?.toUpperCase() || 'BACKLOG'}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Anotações</Text>
                <Text style={styles.description}>{game.personalDescription}</Text>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Lançado em {game.releaseYear}</Text>
                    <Text style={styles.footerText}>•</Text>
                    <Text style={styles.footerText}>{game.mediaType === 'physical' ? 'Mídia Física' : 'Digital'}</Text>
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Apagar Jogo</Text>
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
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: "#AAA",
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        color: "#DDD",
        fontWeight: "500",
    },
    description: {
        fontSize: 16,
        color: "#EEE",
        lineHeight: 24,
        marginTop: 20,
    },

    chipsContainer: {
        flexDirection: "row",
        marginBottom: 20,
        gap: 10,
    },
    chip: {
        backgroundColor: "#323238",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    chipStatus: {
        backgroundColor: "#00B37E",
    },
    chipText: {
        color: "#E1E1E6",
        fontSize: 12,
        fontWeight: "bold",
    },
    chipTextStatus: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 8,
    },
    footer: {
        flexDirection: "row",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "#323238",
        paddingTop: 16,
    },
    footerText: {
        color: "#7C7C8A",
        fontSize: 14,
    },
    deleteButton: {
        marginTop: 32,
        marginBottom: 20,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        backgroundColor: "#323238"
    },
    deleteButtonText: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: 'bold',
    }
});