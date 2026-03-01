import { getGameById } from '@/src/services/gameService';
import { getIgdbImageUrl, searchGameImages } from '@/src/services/igdbService';
import { loadGamesFromStorage, saveGamesToStorage } from '@/src/services/storageService';
import { Game } from '@/src/types/Game';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditGameScreen() {
    const { idGame } = useLocalSearchParams();
    const gameId = Number(idGame);

    const [game, setGame] = useState<Game | null>(null);
    const [gameName, setGameName] = useState('');
    const [platform, setPlatform] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [description, setDescription] = useState('');
    const [media, setMedia] = useState<'physical' | 'digital'>('physical');
    const [isLoading, setIsLoading] = useState(true);


    const [coverUrl, setCoverUrl] = useState('');
    const [boxArtUrl, setBoxArtUrl] = useState('');

    const [isIgdbModalVisible, setIsIgdbModalVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [igdbImages, setIgdbImages] = useState<string[]>([]);

    useEffect(() => {
        async function loadGameData() {
            const existingGame = await getGameById(gameId);
            if (existingGame) {
                setGame(existingGame);
                setGameName(existingGame.name);
                setCoverUrl(existingGame.coverUrl);
                setBoxArtUrl(existingGame.boxArtUrl || ''); // <-- CARREGA A CAPA AQUI
                setReleaseYear(existingGame.releaseYear.toString());
                setDescription(existingGame.personalDescription ?? '');
                setMedia(existingGame.mediaType || 'physical');

                if (existingGame.platforms && existingGame.platforms.length > 0) {
                    const firstPlat = existingGame.platforms[0];
                    setPlatform(typeof firstPlat === 'string' ? firstPlat : firstPlat.name);
                }
            }
            setIsLoading(false);
        }
        loadGameData();
    }, [gameId]);

    const handleUpdate = async () => {
        if (!game) return;
        try {
            const allGames = await loadGamesFromStorage();

            const updatedGames = allGames.map(g => {
                if (g.idGame === gameId) {
                    return {
                        ...g,
                        name: gameName,
                        coverUrl: coverUrl,
                        boxArtUrl: boxArtUrl, // <-- SALVA NO BANCO AQUI
                        releaseYear: Number(releaseYear) || new Date().getFullYear(),
                        personalDescription: description,
                        mediaType: media,
                        platforms: [{ idPlatform: Math.floor(Math.random() * 100), name: platform }],
                    };
                }
                return g;
            });

            await saveGamesToStorage(updatedGames);
            router.back();

        } catch (error) {
            console.error("Erro ao atualizar:", error);
        }
    };

    const handleSearchImages = async () => {
        if (!gameName) return;
        setIsIgdbModalVisible(true);
        setIsSearching(true);
        setIgdbImages([]);

        try {
            const results = await searchGameImages(gameName);

            // --- AUTO-CAPTURA DA CAPA VERTICAL (BOX ART) ---
            const firstGameWithCover = results.find((g: any) => g.cover?.image_id);
            if (firstGameWithCover) {
                const verticalUrl = getIgdbImageUrl(firstGameWithCover.cover.image_id, 't_cover_big');
                setBoxArtUrl(verticalUrl || '');
            }
            // -----------------------------------------------

            let extractedImages: string[] = [];

            results.forEach((gameData: any) => {
                if (gameData.artworks) {
                    gameData.artworks.forEach((art: any) => extractedImages.push(art.image_id));
                }
                if (gameData.screenshots) {
                    gameData.screenshots.forEach((shot: any) => extractedImages.push(shot.image_id));
                }
            });

            extractedImages = [...new Set(extractedImages)];
            setIgdbImages(extractedImages);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectImage = (imageId: string) => {
        const fullUrl = getIgdbImageUrl(imageId, 't_1080p');
        if (fullUrl) {
            setCoverUrl(fullUrl);
        }
        setIsIgdbModalVisible(false);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8257E5" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: "Editar Jogo", headerBackTitle: "Cancelar" }} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome do Jogo</Text>
                    <TextInput style={styles.input} value={gameName} onChangeText={setGameName} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Imagem do Jogo</Text>
                    <View style={styles.urlInputContainer}>
                        <TextInput style={styles.urlInput} value={coverUrl} editable={false} />
                        <TouchableOpacity style={styles.searchButton} onPress={handleSearchImages}>
                            <Ionicons name="search" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Plataforma</Text>
                    <TextInput style={styles.input} value={platform} onChangeText={setPlatform} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ano de Lançamento</Text>
                    <TextInput style={styles.input} value={releaseYear} onChangeText={setReleaseYear} keyboardType="numeric" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Formato de Mídia</Text>
                    <View style={styles.mediaSelectorContainer}>
                        <TouchableOpacity
                            style={[styles.mediaButton, media === 'physical' && styles.mediaButtonActive]}
                            onPress={() => setMedia('physical')}
                        >
                            <Ionicons name="disc-outline" size={20} color={media === 'physical' ? '#FFF' : '#7C7C8A'} />
                            <Text style={[styles.mediaButtonText, media === 'physical' && styles.mediaButtonTextActive]}>Mídia Física</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.mediaButton, media === 'digital' && styles.mediaButtonActive]}
                            onPress={() => setMedia('digital')}
                        >
                            <Ionicons name="cloud-download-outline" size={20} color={media === 'digital' ? '#FFF' : '#7C7C8A'} />
                            <Text style={[styles.mediaButtonText, media === 'digital' && styles.mediaButtonTextActive]}>Digital</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Descrição / Anotações</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline={true} />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                    <Text style={styles.buttonText}>Salvar Alterações</Text>
                </TouchableOpacity>

                <Modal visible={isIgdbModalVisible} animationType="slide" presentationStyle="pageSheet">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Escolher Imagem</Text>
                            <TouchableOpacity onPress={() => setIsIgdbModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#E1E1E6" />
                            </TouchableOpacity>
                        </View>

                        {isSearching ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#8257E5" />
                                <Text style={styles.loadingText}>Buscando imagens panorâmicas...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={igdbImages}
                                keyExtractor={(item) => item}
                                numColumns={1}
                                contentContainerStyle={styles.gridContainer}
                                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma imagem encontrada.</Text>}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.landscapeCard} onPress={() => handleSelectImage(item)}>
                                        <Image source={{ uri: getIgdbImageUrl(item, 't_screenshot_med') || '' }} style={styles.gridImage} resizeMode="cover" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 16 },
    title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 24, marginTop: 16 },
    inputGroup: { marginBottom: 16 },
    label: { color: '#E1E1E6', marginBottom: 8, fontSize: 16 },
    input: { backgroundColor: '#202024', color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, fontSize: 16 },
    button: { backgroundColor: '#8257E5', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    textArea: { height: 120, textAlignVertical: 'top' },

    urlInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202024', borderRadius: 8 },
    urlInput: { flex: 1, color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    searchButton: { backgroundColor: '#8257E5', paddingHorizontal: 16, paddingVertical: 12, borderTopRightRadius: 8, borderBottomRightRadius: 8, justifyContent: 'center', alignItems: 'center' },

    mediaSelectorContainer: { flexDirection: 'row', gap: 12 },
    mediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: '#202024', borderRadius: 8, borderWidth: 1, borderColor: '#323238', gap: 8 },
    mediaButtonActive: { backgroundColor: '#8257E5', borderColor: '#8257E5' },
    mediaButtonText: { color: '#7C7C8A', fontSize: 15, fontWeight: 'bold' },
    mediaButtonTextActive: { color: '#FFF' },

    modalContainer: { flex: 1, backgroundColor: '#121212' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#323238' },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#E1E1E6', marginTop: 16, fontSize: 16 },
    gridContainer: { padding: 16 },
    landscapeCard: { width: '100%', height: 200, marginBottom: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#202024' },
    gridImage: { width: '100%', height: '100%' },
    emptyText: { color: '#7C7C8A', textAlign: 'center', marginTop: 40, fontSize: 16 }
});