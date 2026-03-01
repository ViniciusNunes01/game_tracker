import { getIgdbImageUrl, searchGameImages } from '@/src/services/igdbService';
import { loadGamesFromStorage, saveGamesToStorage } from '@/src/services/storageService';
import { Game } from '@/src/types/Game';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewGameScreen() {

    const [gameName, setGameName] = useState('');
    const [platform, setPlatform] = useState('');
    const [media, setMedia] = useState<'physical' | 'digital'>('physical');
    const [releaseYear, setReleaseYear] = useState('');
    const [description, setDescription] = useState('');

    const [boxArtUrl, setBoxArtUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [igdbImages, setIgdbImages] = useState<string[]>([]);

    const handleSave = async () => {
        try {
            const newGame: Game = {
                idGame: Math.floor(Math.random() * 10000),
                name: gameName,
                coverUrl: coverUrl,      // A imagem panorâmica que você escolheu na lista
                boxArtUrl: boxArtUrl,    // A capa vertical que o app pegou sozinho!
                releaseYear: Number(releaseYear) || new Date().getFullYear(),
                personalDescription: description,
                mediaType: media,
                status: 'backlog',
                platforms: [{
                    idPlatform: Math.floor(Math.random() * 100),
                    name: platform
                }],
            };

            const existingGames = await loadGamesFromStorage();
            existingGames.push(newGame);
            await saveGamesToStorage(existingGames);

            router.back();
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    };

    const handleSelectImage = (imageId: string) => {
        const fullUrl = getIgdbImageUrl(imageId, 't_1080p');
        if (fullUrl) {
            setCoverUrl(fullUrl);
        }
        setIsModalVisible(false);
    };

    const handleSearchImages = async () => {
        if (!gameName) {
            alert("Por favor, digite o nome do jogo primeiro!");
            return;
        }

        setIsModalVisible(true);
        setIsSearching(true);
        setIgdbImages([]);

        try {
            const results = await searchGameImages(gameName);

            // --- AUTO-CAPTURA DA CAPA VERTICAL (BOX ART) ---
            // Ele acha o primeiro resultado que tenha uma capa oficial e guarda em segredo!
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
            alert("Erro ao buscar imagens.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Adicionar Novo Jogo</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome do Jogo</Text>
                    <TextInput style={styles.input} placeholder="Ex: The Last of Us" placeholderTextColor="#7C7C8A" value={gameName} onChangeText={setGameName} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Capa do Jogo</Text>
                    <View style={styles.urlInputContainer}>
                        <TextInput style={styles.urlInput} placeholder="Clique na lupa para buscar..." placeholderTextColor="#7C7C8A" value={coverUrl} editable={false} />
                        <TouchableOpacity style={styles.searchButton} onPress={handleSearchImages}>
                            <Ionicons name="search" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Plataforma</Text>
                    <TextInput style={styles.input} placeholder="Ex: PS5, Nintendo Switch..." placeholderTextColor="#7C7C8A" value={platform} onChangeText={setPlatform} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ano de Lançamento</Text>
                    <TextInput style={styles.input} placeholder="Ex: 2013" placeholderTextColor="#7C7C8A" value={releaseYear} onChangeText={setReleaseYear} keyboardType="numeric" maxLength={4} />
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
                    <Text style={styles.label}>Anotações</Text>
                    <TextInput style={[styles.input, styles.textArea]} placeholder="O que você achou desse jogo?" placeholderTextColor="#7C7C8A" value={description} onChangeText={setDescription} multiline={true} numberOfLines={4} />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Salvar Jogo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* --- MODAL DO IGDB CORRIGIDO --- */}
            <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Escolher Imagem</Text>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#E1E1E6" />
                        </TouchableOpacity>
                    </View>

                    {isSearching ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#8257E5" />
                            <Text style={styles.loadingText}>Buscando artes no IGDB...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={igdbImages}
                            keyExtractor={(item) => item}
                            numColumns={1}
                            contentContainerStyle={styles.gridContainer}
                            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma imagem encontrada para "{gameName}".</Text>}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.landscapeCard} onPress={() => handleSelectImage(item)}>
                                    <Image source={{ uri: getIgdbImageUrl(item, 't_screenshot_med') || '' }} style={styles.gridImage} resizeMode="cover" />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 16 },
    title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 24, marginTop: 16 },
    inputGroup: { marginBottom: 16 },
    label: { color: '#E1E1E6', marginBottom: 8, fontSize: 16 },
    input: { backgroundColor: '#202024', color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, fontSize: 16 },
    button: { backgroundColor: '#8257E5', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { padding: 16, alignItems: 'center', marginTop: 8 },
    cancelButtonText: { color: '#7C7C8A', fontSize: 16 },
    textArea: { height: 120, textAlignVertical: 'top' },

    urlInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202024', borderRadius: 8 },
    urlInput: { flex: 1, color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    searchButton: { backgroundColor: '#8257E5', paddingHorizontal: 16, paddingVertical: 12, borderTopRightRadius: 8, borderBottomRightRadius: 8, justifyContent: 'center', alignItems: 'center' },

    // Estilos dos botões de Mídia
    mediaSelectorContainer: { flexDirection: 'row', gap: 12 },
    mediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: '#202024', borderRadius: 8, borderWidth: 1, borderColor: '#323238', gap: 8 },
    mediaButtonActive: { backgroundColor: '#8257E5', borderColor: '#8257E5' },
    mediaButtonText: { color: '#7C7C8A', fontSize: 15, fontWeight: 'bold' },
    mediaButtonTextActive: { color: '#FFF' },

    // Estilos do Modal
    modalContainer: { flex: 1, backgroundColor: '#121212' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#323238' },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#E1E1E6', marginTop: 16, fontSize: 16 },
    gridContainer: { padding: 16 },
    landscapeCard: { width: '100%', height: 200, marginBottom: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#202024' },
    gridImage: { width: '100%', height: '100%' },
    emptyText: { color: '#7C7C8A', textAlign: 'center', marginTop: 40, fontSize: 16 },
});