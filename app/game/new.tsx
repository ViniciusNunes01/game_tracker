import { getIgdbImageUrl, searchGameImages } from '@/src/services/igdbService';
import { loadGamesFromStorage, saveGamesToStorage } from '@/src/services/storageService';
import { Game } from '@/src/types/Game';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewGameScreen() {
    // --- ESTADOS DE DADOS DO FORMULÁRIO ---
    const [gameName, setGameName] = useState('');
    const [platform, setPlatform] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

    const [boxArtUrl, setBoxArtUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    // --- ESTADOS DA BUSCA (DROPDOWN) ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchingGames, setIsSearchingGames] = useState(false);
    const [gameResults, setGameResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // Guarda o jogo completo selecionado para podermos extrair as imagens depois
    const [selectedGameData, setSelectedGameData] = useState<any | null>(null);

    // --- ESTADOS DO MODAL DE IMAGENS ---
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);

    // 1. Busca os jogos no IGDB para o Dropdown
    const handleSearchGames = async () => {
        if (!searchQuery) return;

        setIsSearchingGames(true);
        setShowDropdown(true);
        setGameResults([]);

        try {
            const results = await searchGameImages(searchQuery);

            const seenNames = new Set();
            const uniqueResults = results.filter((game: any) => {
                const normalizedName = game.name.toLowerCase().trim();
                if (seenNames.has(normalizedName)) {
                    return false;
                }
                seenNames.add(normalizedName);
                return true;
            });

            uniqueResults.sort((a: any, b: any) => {
                const dateA = a.first_release_date || 9999999999;
                const dateB = b.first_release_date || 9999999999;
                return dateA - dateB;
            });

            setGameResults(uniqueResults);
        } catch (error) {
            console.error(error);
            alert("Erro ao buscar jogos.");
        } finally {
            setIsSearchingGames(false);
        }
    };

    // 2. Quando o usuário clica em um jogo do Dropdown
    const handleSelectGameFromDropdown = (game: any) => {
        setSelectedGameData(game); // Guarda os dados completos na memória

        // Auto-preenche os inputs
        setGameName(game.name);
        setSearchQuery(game.name); // Atualiza o input com o nome certinho

        if (game.first_release_date) {
            const year = new Date(game.first_release_date * 1000).getFullYear();
            setReleaseYear(year.toString());
        }

        if (game.cover?.image_id) {
            setBoxArtUrl(getIgdbImageUrl(game.cover.image_id, 't_cover_big') || '');
        }

        // Esconde o dropdown
        setShowDropdown(false);

        // Zera a capa horizontal caso o usuário troque de jogo no meio do cadastro
        setCoverUrl('');
    };

    // 3. Abre o modal para escolher a arte horizontal
    const handleOpenImageSelector = () => {
        if (!selectedGameData) {
            alert("Por favor, busque e selecione um jogo no campo acima primeiro!");
            return;
        }
        setIsImageModalVisible(true);
    };

    // Gera a lista de imagens baseada no jogo que já está na memória
    const getAvailableImages = () => {
        if (!selectedGameData) return [];
        let extractedImages: string[] = [];

        if (selectedGameData.artworks) {
            selectedGameData.artworks.forEach((art: any) => extractedImages.push(art.image_id));
        }
        if (selectedGameData.screenshots) {
            selectedGameData.screenshots.forEach((shot: any) => extractedImages.push(shot.image_id));
        }

        return [...new Set(extractedImages)];
    };

    const handleSelectImage = (imageId: string) => {
        const fullUrl = getIgdbImageUrl(imageId, 't_1080p');
        if (fullUrl) {
            setCoverUrl(fullUrl);
        }
        setIsImageModalVisible(false);
    };

    const handleSave = async () => {
        try {
            const newGame: Game = {
                idGame: Math.floor(Math.random() * 10000),
                igdbId: selectedGameData?.id,
                name: gameName || searchQuery, // Garante que salva o nome
                coverUrl: coverUrl || boxArtUrl, // Fallback se não escolher arte
                boxArtUrl: boxArtUrl,
                releaseYear: Number(releaseYear) || new Date().getFullYear(),
                personalDescription: description,
                mediaType: selectedMedia as any,
                status: 'backlog',
                platforms: platform ? [{ idPlatform: Math.floor(Math.random() * 100), name: platform }] : [],
            };

            const existingGames = await loadGamesFromStorage();
            existingGames.push(newGame);
            await saveGamesToStorage(existingGames);

            router.back();
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    };

    const toggleMedia = (type: string) => {
        if (selectedMedia.includes(type)) {
            setSelectedMedia(selectedMedia.filter(m => m !== type));
        } else {
            setSelectedMedia([...selectedMedia, type]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Adicionar Novo Jogo</Text>

                {/* --- 1. BUSCA INTELIGENTE (COM DROPDOWN) --- */}
                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                    <Text style={styles.label}>Buscar Jogo Oficial</Text>
                    <View style={styles.urlInputContainer}>
                        <TextInput
                            style={styles.urlInput}
                            placeholder="Digite o nome e clique na lupa..."
                            placeholderTextColor="#7C7C8A"
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                setShowDropdown(false); // Esconde se começar a digitar de novo
                            }}
                            onSubmitEditing={handleSearchGames}
                        />
                        <TouchableOpacity style={styles.searchButton} onPress={handleSearchGames}>
                            <Ionicons name="search" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* O DROPDOWN INLINE COM SCROLL */}
                    {showDropdown && (
                        <ScrollView
                            style={styles.dropdownContainer}
                            nestedScrollEnabled={true} // Permite rolar dentro da ScrollView principal!
                            keyboardShouldPersistTaps="handled" // Evita que o teclado feche ao tentar clicar no jogo
                        >
                            {isSearchingGames ? (
                                <ActivityIndicator size="small" color="#8257E5" style={{ padding: 20 }} />
                            ) : gameResults.length > 0 ? (
                                gameResults.map((game) => (
                                    <TouchableOpacity
                                        key={game.id}
                                        style={styles.dropdownItem}
                                        onPress={() => handleSelectGameFromDropdown(game)}
                                    >
                                        <Image
                                            source={{ uri: getIgdbImageUrl(game.cover?.image_id, 't_cover_small') || 'https://via.placeholder.com/45x60.png?text=Sem+Capa' }}
                                            style={styles.dropdownCover}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.dropdownTitle}>{game.name}</Text>
                                            <Text style={styles.dropdownYear}>
                                                {game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : 'N/A'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.dropdownEmpty}>Nenhum jogo encontrado.</Text>
                            )}
                        </ScrollView>
                    )}
                </View>

                {/* --- 2. ESCOLHER ARTE HORIZONTAL --- */}
                <View style={[styles.inputGroup, { zIndex: 1, opacity: selectedGameData ? 1 : 0.5 }]}>
                    <Text style={styles.label}>Arte do Detalhe (Banner)</Text>
                    <View style={styles.urlInputContainer}>
                        <TextInput
                            style={styles.urlInput}
                            placeholder={selectedGameData ? "Clique na lupa para escolher..." : "Selecione o jogo primeiro"}
                            placeholderTextColor="#7C7C8A"
                            value={coverUrl ? "Imagem selecionada!" : ""}
                            editable={false}
                        />
                        <TouchableOpacity
                            style={[styles.searchButton, !selectedGameData && { backgroundColor: '#323238' }]}
                            onPress={handleOpenImageSelector}
                            disabled={!selectedGameData}
                        >
                            <Ionicons name="image" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    {/* Miniatura do Banner se já tiver escolhido */}
                    {coverUrl !== '' && (
                        <Image source={{ uri: coverUrl }} style={styles.miniBannerPreview} resizeMode="cover" />
                    )}
                </View>

                {/* --- RESTO DO FORMULÁRIO MANUAL --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Plataforma</Text>
                    <TextInput style={styles.input} placeholder="Ex: PS5, Nintendo Switch..." placeholderTextColor="#7C7C8A" value={platform} onChangeText={setPlatform} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ano de Lançamento</Text>
                    <TextInput style={styles.input} value={releaseYear} onChangeText={setReleaseYear} keyboardType="numeric" maxLength={4} editable={false} />
                </View>

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
                    <Text style={styles.label}>Anotações</Text>
                    <TextInput style={[styles.input, styles.textArea]} placeholder="O que você achou desse jogo?" placeholderTextColor="#7C7C8A" value={description} onChangeText={setDescription} multiline={true} numberOfLines={4} />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Salvar Jogo na Coleção</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* --- MODAL DA GALERIA DE ARTES --- */}
            <Modal visible={isImageModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Galeria: {gameName}</Text>
                        <TouchableOpacity onPress={() => setIsImageModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#E1E1E6" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={getAvailableImages()}
                        keyExtractor={(item) => item}
                        numColumns={1}
                        contentContainerStyle={styles.gridContainer}
                        ListEmptyComponent={<Text style={styles.emptyText}>O IGDB não possui artes extras para este jogo.</Text>}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.landscapeCard} onPress={() => handleSelectImage(item)}>
                                <Image source={{ uri: getIgdbImageUrl(item, 't_screenshot_med') || '' }} style={styles.gridImage} resizeMode="cover" />
                            </TouchableOpacity>
                        )}
                    />
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

    urlInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202024', borderRadius: 8, borderWidth: 1, borderColor: '#8257E5' },
    urlInput: { flex: 1, color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    searchButton: { backgroundColor: '#8257E5', paddingHorizontal: 16, paddingVertical: 12, borderTopRightRadius: 7, borderBottomRightRadius: 7, justifyContent: 'center', alignItems: 'center' },

    // Dropdown UI
    dropdownContainer: { backgroundColor: '#202024', borderWidth: 1, borderColor: '#323238', borderRadius: 8, marginTop: 4, maxHeight: 250, overflow: 'hidden' },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#323238' },
    dropdownCover: { width: 35, height: 48, borderRadius: 4, marginRight: 12, backgroundColor: '#000' },
    dropdownTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    dropdownYear: { color: '#7C7C8A', fontSize: 13, marginTop: 2 },
    dropdownEmpty: { color: '#7C7C8A', padding: 16, textAlign: 'center' },

    // Preview do Banner
    miniBannerPreview: { width: '100%', height: 100, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#323238' },

    mediaSelectorContainer: { flexDirection: 'row', gap: 12 },
    mediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: '#202024', borderRadius: 8, borderWidth: 1, borderColor: '#323238', gap: 8 },
    mediaButtonActive: { backgroundColor: '#8257E5', borderColor: '#8257E5' },
    mediaButtonText: { color: '#7C7C8A', fontSize: 15, fontWeight: 'bold' },
    mediaButtonTextActive: { color: '#FFF' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#121212' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#323238' },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    gridContainer: { padding: 16 },
    landscapeCard: { width: '100%', height: 200, marginBottom: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#202024' },
    gridImage: { width: '100%', height: '100%' },
    emptyText: { color: '#7C7C8A', textAlign: 'center', marginTop: 40, fontSize: 16 },
});