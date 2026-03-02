import { getGameById } from '@/src/services/gameService';
import { getGameImagesByIgdbId, getIgdbImageUrl } from '@/src/services/igdbService';
import { loadGamesFromStorage, saveGamesToStorage } from '@/src/services/storageService';
import { Game } from '@/src/types/Game';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditGameScreen() {
    const { idGame } = useLocalSearchParams();
    const gameId = Number(idGame);
    const [igdbId, setIgdbId] = useState<number | undefined>(undefined);

    const [game, setGame] = useState<Game | null>(null);
    const [gameName, setGameName] = useState('');
    const [status, setStatus] = useState('Backlog');
    const [releaseYear, setReleaseYear] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
    
    // --- NOVO: ARRAY DE PLATAFORMAS ---
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [coverUrl, setCoverUrl] = useState('');
    const [boxArtUrl, setBoxArtUrl] = useState('');

    const [isIgdbModalVisible, setIsIgdbModalVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [igdbImages, setIgdbImages] = useState<string[]>([]);

    const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
    const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
    const [isPlatformModalVisible, setIsPlatformModalVisible] = useState(false);
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);

    useEffect(() => {
        async function loadGameData() {
            const savedPlatforms = await AsyncStorage.getItem('custom_platforms');
            const savedStatuses = await AsyncStorage.getItem('custom_statuses');
            if (savedPlatforms) setAvailablePlatforms(JSON.parse(savedPlatforms));
            else setAvailablePlatforms(['PS5', 'PS4', 'Nintendo Switch', 'PC']);
            
            if (savedStatuses) setAvailableStatuses(JSON.parse(savedStatuses));
            else setAvailableStatuses(['Backlog', 'Jogando', 'Terminado', 'Platinado', 'Abandonado']);

            const existingGame = await getGameById(gameId);
            if (existingGame) {
                setGame(existingGame);
                setGameName(existingGame.name);
                setCoverUrl(existingGame.coverUrl);
                setBoxArtUrl(existingGame.boxArtUrl || '');
                setIgdbId(existingGame.igdbId);
                setReleaseYear(existingGame.releaseYear.toString());
                setDescription(existingGame.personalDescription ?? '');
                
                setStatus(existingGame.status || 'Backlog');

                if (existingGame.mediaType) {
                    if (Array.isArray(existingGame.mediaType)) setSelectedMedia(existingGame.mediaType);
                    else setSelectedMedia([existingGame.mediaType as string]);
                }

                // RECUPERA AS PLATAFORMAS DO JOGO SALVO
                if (existingGame.platforms && existingGame.platforms.length > 0) {
                    const platNames = existingGame.platforms.map((p: any) => typeof p === 'string' ? p : p.name);
                    setSelectedPlatforms(platNames);
                }
            }
            setIsLoading(false);
        }
        loadGameData();
    }, [gameId]);

    const toggleMedia = (type: string) => {
        if (selectedMedia.includes(type)) setSelectedMedia(selectedMedia.filter(m => m !== type));
        else setSelectedMedia([...selectedMedia, type]);
    };

    const togglePlatform = (plat: string) => {
        if (selectedPlatforms.includes(plat)) setSelectedPlatforms(selectedPlatforms.filter(p => p !== plat));
        else setSelectedPlatforms([...selectedPlatforms, plat]);
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
                        mediaType: selectedMedia as any,
                        status: status,
                        platforms: selectedPlatforms.map(p => ({ idPlatform: Math.floor(Math.random() * 100), name: p })),
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

    const handleFetchImages = async () => {
        if (!igdbId) {
            alert("Este jogo não possui um ID oficial do IGDB vinculado. Por favor, cadastre-o novamente.");
            return;
        }

        setIsSearching(true);
        setIgdbImages([]);
        try {
            const gameData = await getGameImagesByIgdbId(igdbId);
            let extractedImages: string[] = [];
            
            if (gameData?.artworks) gameData.artworks.forEach((art: any) => extractedImages.push(art.image_id));
            if (gameData?.screenshots) gameData.screenshots.forEach((shot: any) => extractedImages.push(shot.image_id));
            
            setIgdbImages([...new Set(extractedImages)]);
            setIsIgdbModalVisible(true);
        } catch (error) {
            console.error(error);
            alert("Erro ao buscar imagens no IGDB.");
        } finally {
            setIsSearching(false);
        }
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
                    {coverUrl !== '' && ( <Image source={{ uri: coverUrl }} style={styles.miniBannerPreview} resizeMode="cover" /> )}
                </View>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Plataformas</Text>
                        <TouchableOpacity style={styles.selectorButton} onPress={() => setIsPlatformModalVisible(true)}>
                            <Text style={[styles.selectorText, selectedPlatforms.length === 0 && { color: '#7C7C8A' }]} numberOfLines={1}>
                                {selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : "Nenhuma"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#7C7C8A" />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Status</Text>
                        <TouchableOpacity style={styles.selectorButton} onPress={() => setIsStatusModalVisible(true)}>
                            <Text style={styles.selectorText} numberOfLines={1}>{status || "Backlog"}</Text>
                            <Ionicons name="chevron-down" size={20} color="#7C7C8A" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ano de Lançamento</Text>
                    <TextInput style={[styles.input, { opacity: 0.6 }]} value={releaseYear} keyboardType="numeric" editable={false} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Formato de Mídia</Text>
                    <View style={styles.mediaSelectorContainer}>
                        <TouchableOpacity style={[styles.mediaButton, selectedMedia.includes('physical') && styles.mediaButtonActive]} onPress={() => toggleMedia('physical')}>
                            <Ionicons name="disc-outline" size={20} color={selectedMedia.includes('physical') ? '#FFF' : '#7C7C8A'} />
                            <Text style={[styles.mediaButtonText, selectedMedia.includes('physical') && styles.mediaButtonTextActive]}>Física</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.mediaButton, selectedMedia.includes('digital') && styles.mediaButtonActive]} onPress={() => toggleMedia('digital')}>
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

                {/* MODAL: Galeria de Banners */}
                <Modal visible={isIgdbModalVisible} animationType="slide" presentationStyle="pageSheet">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Escolher Banner</Text>
                            <TouchableOpacity onPress={() => setIsIgdbModalVisible(false)}><Ionicons name="close" size={28} color="#E1E1E6" /></TouchableOpacity>
                        </View>
                        {isSearching ? (
                            <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#8257E5" /></View>
                        ) : (
                            <FlatList data={igdbImages} keyExtractor={(item) => item} numColumns={1} contentContainerStyle={styles.gridContainer}
                                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma imagem de banner encontrada.</Text>}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.landscapeCard} onPress={() => handleSelectImage(item)}>
                                        <Image source={{ uri: getIgdbImageUrl(item, 't_screenshot_med') || '' }} style={styles.gridImage} resizeMode="cover" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </Modal>

                {/* MODAL MULTI-SELEÇÃO: Plataforma */}
                <Modal visible={isPlatformModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.overlayModal}>
                        <View style={styles.smallModalContent}>
                            <Text style={styles.smallModalTitle}>Escolha as Plataformas</Text>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {availablePlatforms.map(plat => (
                                    <TouchableOpacity key={plat} style={styles.optionItem} onPress={() => togglePlatform(plat)}>
                                        <Text style={[styles.optionText, selectedPlatforms.includes(plat) && { color: '#8257E5', fontWeight: 'bold' }]}>{plat}</Text>
                                        {selectedPlatforms.includes(plat) && <Ionicons name="checkmark" size={20} color="#8257E5" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity style={styles.closeOptionButton} onPress={() => setIsPlatformModalVisible(false)}>
                                <Text style={styles.closeOptionText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* MODAL: Seleção de Status */}
                <Modal visible={isStatusModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.overlayModal}>
                        <View style={styles.smallModalContent}>
                            <Text style={styles.smallModalTitle}>Status de Jogo</Text>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {availableStatuses.map(stat => (
                                    <TouchableOpacity key={stat} style={styles.optionItem} onPress={() => { setStatus(stat); setIsStatusModalVisible(false); }}>
                                        <Text style={[styles.optionText, status === stat && { color: '#8257E5', fontWeight: 'bold' }]}>{stat}</Text>
                                        {status === stat && <Ionicons name="checkmark" size={20} color="#8257E5" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity style={styles.closeOptionButton} onPress={() => setIsStatusModalVisible(false)}>
                                <Text style={styles.closeOptionText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
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

    selectorButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#202024', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: '#323238' },
    selectorText: { color: '#FFF', fontSize: 16 },
    overlayModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    smallModalContent: { backgroundColor: '#202024', width: '100%', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#323238' },
    smallModalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#323238' },
    optionText: { color: '#E1E1E6', fontSize: 16 },
    closeOptionButton: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
    closeOptionText: { color: '#7C7C8A', fontSize: 16, fontWeight: 'bold' },

    mediaSelectorContainer: { flexDirection: 'row', gap: 12 },
    mediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: '#202024', borderRadius: 8, borderWidth: 1, borderColor: '#323238', gap: 8 },
    mediaButtonActive: { backgroundColor: '#8257E5', borderColor: '#8257E5' },
    mediaButtonText: { color: '#7C7C8A', fontSize: 15, fontWeight: 'bold' },
    mediaButtonTextActive: { color: '#FFF' },

    modalContainer: { flex: 1, backgroundColor: '#121212' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#323238' },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    loadingContainer: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
    gridContainer: { padding: 16 },
    landscapeCard: { width: '100%', height: 200, marginBottom: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#202024' },
    gridImage: { width: '100%', height: '100%' },
    emptyText: { color: '#7C7C8A', textAlign: 'center', marginTop: 40, fontSize: 16 },
});