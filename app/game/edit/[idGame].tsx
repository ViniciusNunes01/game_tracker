import { getGameById } from '@/src/services/gameService';
import { getGameImagesByIgdbId, getIgdbImageUrl, searchGameImages } from '@/src/services/igdbService';
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
    const [igdbId, setIgdbId] = useState<number | undefined>(undefined);

    const [game, setGame] = useState<Game | null>(null);
    const [gameName, setGameName] = useState('');
    const [platform, setPlatform] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [description, setDescription] = useState('');

    // --- NOVO: Múltiplas Mídias ---
    const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [coverUrl, setCoverUrl] = useState('');
    const [boxArtUrl, setBoxArtUrl] = useState('');

    // --- ESTADOS DOS MODAIS DO IGDB ---
    const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
    const [isIgdbModalVisible, setIsIgdbModalVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [gameVersions, setGameVersions] = useState<any[]>([]);
    const [igdbImages, setIgdbImages] = useState<string[]>([]);

    useEffect(() => {
        async function loadGameData() {
            const existingGame = await getGameById(gameId);
            if (existingGame) {
                setGame(existingGame);
                setGameName(existingGame.name);
                setCoverUrl(existingGame.coverUrl);
                setBoxArtUrl(existingGame.boxArtUrl || '');
                setIgdbId(existingGame.igdbId);
                setReleaseYear(existingGame.releaseYear.toString());
                setDescription(existingGame.personalDescription ?? '');

                // Carrega a mídia transformando em Array (caso o jogo antigo tenha string simples)
                if (existingGame.mediaType) {
                    if (Array.isArray(existingGame.mediaType)) {
                        setSelectedMedia(existingGame.mediaType);
                    } else {
                        setSelectedMedia([existingGame.mediaType as string]);
                    }
                }

                if (existingGame.platforms && existingGame.platforms.length > 0) {
                    const firstPlat = existingGame.platforms[0];
                    setPlatform(typeof firstPlat === 'string' ? firstPlat : firstPlat.name);
                }
            }
            setIsLoading(false);
        }
        loadGameData();
    }, [gameId]);

    // Função para ligar/desligar as mídias
    const toggleMedia = (type: string) => {
        if (selectedMedia.includes(type)) {
            setSelectedMedia(selectedMedia.filter(m => m !== type));
        } else {
            setSelectedMedia([...selectedMedia, type]);
        }
    };

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
                        boxArtUrl: boxArtUrl,
                        igdbId: igdbId,
                        releaseYear: Number(releaseYear) || new Date().getFullYear(),
                        personalDescription: description,
                        mediaType: selectedMedia as any, // Salva o array com as mídias selecionadas
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

    // 1. Busca as versões do jogo para evitar misturar imagens de sequências
    // Busca Inteligente de Imagens (Via ID ou Fallback por Nome)
    const handleFetchImages = async () => {
        setIsSearching(true);
        setIgdbImages([]);

        try {
            // SE TIVER O ID: Caminho Expresso! Vai direto pras imagens.
            if (igdbId) {
                const gameData = await getGameImagesByIgdbId(igdbId);

                let extractedImages: string[] = [];
                if (gameData?.artworks) {
                    gameData.artworks.forEach((art: any) => extractedImages.push(art.image_id));
                }
                if (gameData?.screenshots) {
                    gameData.screenshots.forEach((shot: any) => extractedImages.push(shot.image_id));
                }

                setIgdbImages([...new Set(extractedImages)]);
                setIsIgdbModalVisible(true); // Abre direto o modal de fotos!
            }
            // SE NÃO TIVER ID (Jogos Antigos): Caminho longo para vincular a versão primeiro
            else {
                if (!gameName) return;
                setIsVersionModalVisible(true);

                const results = await searchGameImages(gameName);
                setGameVersions(results);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    // 2. O usuário escolhe a versão exata e abrimos as imagens dela
    const handleSelectVersion = (game: any) => {
        setIsVersionModalVisible(false); // Fecha a lista de jogos
        setIgdbId(game.id);

        let extractedImages: string[] = [];
        if (game.artworks) {
            game.artworks.forEach((art: any) => extractedImages.push(art.image_id));
        }
        if (game.screenshots) {
            game.screenshots.forEach((shot: any) => extractedImages.push(shot.image_id));
        }

        setIgdbImages([...new Set(extractedImages)]);

        // Se por acaso a capa vertical estiver vazia, aproveitamos para consertar
        if (game.cover?.image_id && !boxArtUrl) {
            setBoxArtUrl(getIgdbImageUrl(game.cover.image_id, 't_cover_big') || '');
        }

        // Dá um pequeno delay para a transição dos modais ser suave
        setTimeout(() => {
            setIsIgdbModalVisible(true);
        }, 300);
    };

    const handleSelectImage = (imageId: string) => {
        const fullUrl = getIgdbImageUrl(imageId, 't_1080p');
        if (fullUrl) setCoverUrl(fullUrl);
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
                    {/* Opacidade menor para indicar que é travado */}
                    <TextInput style={[styles.input, { opacity: 0.6 }]} value={gameName} editable={false} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Arte do Detalhe (Banner)</Text>
                    <View style={styles.urlInputContainer}>
                        <TextInput style={styles.urlInput} value={coverUrl ? "Imagem selecionada" : ""} editable={false} placeholderTextColor="#7C7C8A" />
                        <TouchableOpacity style={styles.searchButton} onPress={handleFetchImages}>
                            <Ionicons name="search" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    {coverUrl !== '' && (
                        <Image source={{ uri: coverUrl }} style={styles.miniBannerPreview} resizeMode="cover" />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Plataforma</Text>
                    <TextInput style={styles.input} value={platform} onChangeText={setPlatform} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ano de Lançamento</Text>
                    <TextInput style={[styles.input, { opacity: 0.6 }]} value={releaseYear} keyboardType="numeric" editable={false} />
                </View>

                {/* --- MÚLTIPLAS MÍDIAS APLICADAS AQUI --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Formato de Mídia (Selecione uma ou ambas)</Text>
                    <View style={styles.mediaSelectorContainer}>
                        <TouchableOpacity
                            style={[styles.mediaButton, selectedMedia.includes('physical') && styles.mediaButtonActive]}
                            onPress={() => toggleMedia('physical')}
                        >
                            <Ionicons name="disc-outline" size={20} color={selectedMedia.includes('physical') ? '#FFF' : '#7C7C8A'} />
                            <Text style={[styles.mediaButtonText, selectedMedia.includes('physical') && styles.mediaButtonTextActive]}>Mídia Física</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.mediaButton, selectedMedia.includes('digital') && styles.mediaButtonActive]}
                            onPress={() => toggleMedia('digital')}
                        >
                            <Ionicons name="cloud-download-outline" size={20} color={selectedMedia.includes('digital') ? '#FFF' : '#7C7C8A'} />
                            <Text style={[styles.mediaButtonText, selectedMedia.includes('digital') && styles.mediaButtonTextActive]}>Digital</Text>
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

                {/* --- MODAL 1: ESCOLHER A VERSÃO EXATA DO JOGO --- */}
                <Modal visible={isVersionModalVisible} animationType="slide" presentationStyle="pageSheet">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Qual versão de "{gameName}"?</Text>
                            <TouchableOpacity onPress={() => setIsVersionModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#E1E1E6" />
                            </TouchableOpacity>
                        </View>
                        {isSearching ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#8257E5" />
                                <Text style={styles.loadingText}>Buscando no banco de dados...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={gameVersions}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.listContainer}
                                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma versão encontrada.</Text>}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.gameListItem} onPress={() => handleSelectVersion(item)}>
                                        <Image
                                            source={{ uri: getIgdbImageUrl(item.cover?.image_id, 't_cover_small') || 'https://via.placeholder.com/45x60.png?text=Sem+Capa' }}
                                            style={styles.gameListCover}
                                        />
                                        <View style={styles.gameListInfo}>
                                            <Text style={styles.gameListTitle}>{item.name}</Text>
                                            <Text style={styles.gameListYear}>Lançamento: {item.first_release_date ? new Date(item.first_release_date * 1000).getFullYear() : 'N/A'}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#323238" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </Modal>

                {/* --- MODAL 2: ESCOLHER A ARTE HORIZONTAL --- */}
                <Modal visible={isIgdbModalVisible} animationType="slide" presentationStyle="pageSheet">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Escolher Banner</Text>
                            <TouchableOpacity onPress={() => setIsIgdbModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#E1E1E6" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={igdbImages}
                            keyExtractor={(item) => item}
                            numColumns={1}
                            contentContainerStyle={styles.gridContainer}
                            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma imagem de banner encontrada.</Text>}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.landscapeCard} onPress={() => handleSelectImage(item)}>
                                    <Image source={{ uri: getIgdbImageUrl(item, 't_screenshot_med') || '' }} style={styles.gridImage} resizeMode="cover" />
                                </TouchableOpacity>
                            )}
                        />
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
    miniBannerPreview: { width: '100%', height: 100, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#323238' },

    mediaSelectorContainer: { flexDirection: 'row', gap: 12 },
    mediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: '#202024', borderRadius: 8, borderWidth: 1, borderColor: '#323238', gap: 8 },
    mediaButtonActive: { backgroundColor: '#8257E5', borderColor: '#8257E5' },
    mediaButtonText: { color: '#7C7C8A', fontSize: 15, fontWeight: 'bold' },
    mediaButtonTextActive: { color: '#FFF' },

    // Modais
    modalContainer: { flex: 1, backgroundColor: '#121212' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#323238' },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#E1E1E6', marginTop: 16, fontSize: 16 },

    // Lista de Versões
    listContainer: { padding: 16 },
    gameListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202024', padding: 10, borderRadius: 8, marginBottom: 12 },
    gameListCover: { width: 45, height: 60, borderRadius: 4, backgroundColor: '#000', marginRight: 12 },
    gameListInfo: { flex: 1 },
    gameListTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    gameListYear: { color: '#7C7C8A', fontSize: 14 },

    // Galeria de Banners
    gridContainer: { padding: 16 },
    landscapeCard: { width: '100%', height: 200, marginBottom: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#202024' },
    gridImage: { width: '100%', height: '100%' },
    emptyText: { color: '#7C7C8A', textAlign: 'center', marginTop: 40, fontSize: 16 }
});