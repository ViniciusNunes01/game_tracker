import { getExpansionsByIgdbId, getIgdbImageUrl } from '@/src/services/igdbService';
import { deleteGameFromStorage, loadExpansionOwnership } from "@/src/services/storageService";
import { Game } from "@/src/types/Game";
import { Link, router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getGameById } from "../../src/services/gameService";

export default function GameDetail() {

    const { idGame } = useLocalSearchParams();
    const idGameString = Array.isArray(idGame) ? idGame[0] : idGame;
    const gameId = Number(idGameString || "0");

    const [game, setGame] = useState<Game | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expansions, setExpansions] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            async function fetchGame() {
                const foundGame = await getGameById(gameId);
                setGame(foundGame || null);
                setIsLoading(false);
                // carrega expansões via IGDB quando houver igdbId
                if (foundGame?.igdbId) {
                    const exps = await getExpansionsByIgdbId(foundGame.igdbId);
                    const expansionOwnership = await loadExpansionOwnership();
                    const mapped = exps.map((e: any) => ({
                        ...e,
                        owned: expansionOwnership[String(e.id)] ?? false,
                    }));
                    setExpansions(mapped);
                }
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

    const platformNames = game.platforms?.length > 0
        ? game.platforms.map((plat) => (typeof plat === 'string' ? plat : plat.name))
        : ['Sem Plataforma'];
    const mediaText = getMediaText();
    const statusLabel = (game.status || 'Backlog').toUpperCase();

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

            <View style={styles.heroContainer}>
                <Image
                    source={{ uri: game.coverUrl }}
                    style={styles.cover}
                    resizeMode="cover"
                />
                <View style={styles.heroOverlay} />
                <View style={styles.heroInfo}>
                    <View style={styles.heroTopRow}>
                    </View>
                    <Text style={styles.title}>{game.name}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>Informações</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ano</Text>
                        <Text style={styles.infoValue}>{game.releaseYear}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Plataformas</Text>
                        <Text style={styles.infoValue}>{platformNames.join(', ')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mídia</Text>
                        <Text style={styles.infoValue}>{mediaText || 'Não definido'}</Text>
                    </View>
                </View>

                <View style={styles.statusCard}>
                    <Text style={styles.statusCardLabel}>Status atual</Text>
                    <Text style={styles.statusCardValue}>{statusLabel}</Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Anotações</Text>
                    {game.personalDescription ? (
                        <Text style={styles.description}>{game.personalDescription}</Text>
                    ) : (
                        <Text style={[styles.description, { fontStyle: 'italic', color: '#7C7C8A' }]}>Nenhuma anotação salva para este jogo.</Text>
                    )}
                </View>

                {expansions.length > 0 && (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Expansões / DLCs</Text>
                            <Text style={styles.sectionHint}>{expansions.length} itens</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.expansionRow}>
                            {expansions.map((exp) => (
                                <TouchableOpacity key={exp.id} style={styles.expansionCard} onPress={() => router.push(`/game/expansion/${exp.id}`)}>
                                    <Image
                                        source={{ uri: getIgdbImageUrl(exp.cover?.image_id, 't_cover_big') || undefined }}
                                        style={[styles.expansionCover, !exp.owned && styles.expansionCoverDisabled]}
                                    />
                                    <Text style={[styles.expansionName, !exp.owned && styles.expansionNameDisabled]} numberOfLines={2}>{exp.name}</Text>
                                    <View style={[styles.expansionTag, exp.owned ? styles.expansionTagOwned : styles.expansionTagUnowned]}>
                                        <Text style={[styles.expansionTagText, !exp.owned && styles.expansionTagTextUnowned]}>{exp.owned ? 'Na coleção' : 'Não possui'}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push(`/game/edit/${game.idGame}`)}>
                        <Text style={styles.secondaryButtonText}>Editar jogo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>Apagar</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
    },
    heroContainer: {
        height: 360,
        backgroundColor: '#000',
    },
    cover: {
        width: "100%",
        height: '100%',
        backgroundColor: "#000",
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    heroInfo: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 20,
    },
    heroTopRow: {
        marginBottom: 12,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 8,
    },
    infoCard: {
        backgroundColor: '#202024',
        borderWidth: 1,
        borderColor: '#323238',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    infoCardTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statusCard: {
        backgroundColor: 'rgba(130, 87, 229, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(130, 87, 229, 0.45)',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
    },
    statusCardLabel: {
        color: '#CDBBFF',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
        fontWeight: '700',
    },
    statusCardValue: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#323238',
    },
    infoLabel: {
        color: '#7C7C8A',
        fontSize: 14,
        fontWeight: '700',
        flexShrink: 0,
    },
    infoValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
    },
    sectionCard: {
        backgroundColor: '#202024',
        borderWidth: 1,
        borderColor: '#323238',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: "#E1E1E6",
        lineHeight: 24,
        marginTop: 8,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionHint: {
        color: '#7C7C8A',
        fontSize: 12,
        fontWeight: '600',
    },
    expansionRow: {
        gap: 12,
    },
    expansionCard: {
        width: 128,
    },
    expansionCover: {
        width: 128,
        height: 180,
        borderRadius: 12,
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: '#323238',
    },
    expansionCoverDisabled: {
        opacity: 0.35,
        borderColor: '#444',
    },
    expansionName: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 8,
        minHeight: 34,
    },
    expansionNameDisabled: {
        color: '#7C7C8A',
    },
    expansionTag: {
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
    },
    expansionTagOwned: {
        backgroundColor: 'rgba(0, 179, 126, 0.14)',
    },
    expansionTagUnowned: {
        backgroundColor: 'rgba(124, 124, 138, 0.14)',
    },
    expansionTagText: {
        color: '#00B37E',
        fontSize: 11,
        fontWeight: '700',
    },
    expansionTagTextUnowned: {
        color: '#7C7C8A',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#323238',
        backgroundColor: '#202024',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    deleteButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF6B6B',
        fontSize: 15,
        fontWeight: '700',
    },
});

// estilos para expansoes
// expansion styles intentionally inline in JSX to avoid TS typing conflicts