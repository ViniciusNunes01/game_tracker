import { getIgdbImageUrl, searchGameImages } from '@/src/services/igdbService';
import { loadWishlistFromStorage, saveWishlistToStorage } from '@/src/services/storageService';
import { Game } from '@/src/types/Game';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

export default function WishlistScreen() {
    const [wishlist, setWishlist] = useState<Game[]>([]);
    
    // Estados da Pesquisa
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Estados do Modal Dinâmico
    const [isPlatformModalVisible, setIsPlatformModalVisible] = useState(false);
    const [gameToSave, setGameToSave] = useState<any | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadWishlist();
        }, [])
    );

    async function loadWishlist() {
        const data = await loadWishlistFromStorage();
        setWishlist(data);
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults([]);

        try {
            const results = await searchGameImages(searchQuery);
            
            // A nossa peneira limpa tudo
            const forbiddenWords = ['bundle', 'pack', 'collection', 'soundtrack'];
            const cleanResults = results.filter((g: any) => !forbiddenWords.some(w => g.name.toLowerCase().includes(w)));
            
            const seenNames = new Set();
            const uniqueResults = cleanResults.filter((game: any) => {
                const normalizedName = game.name.toLowerCase().trim();
                if (seenNames.has(normalizedName)) return false;
                seenNames.add(normalizedName);
                return true;
            });

            uniqueResults.sort((a: any, b: any) => {
                const dateA = a.first_release_date || 9999999999;
                const dateB = b.first_release_date || 9999999999;
                return dateA - dateB;
            });

            setSearchResults(uniqueResults);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    // Prepara o jogo e abre o modal mostrando as plataformas OFICIAIS dele
    const handleInitAddToWishlist = (gameData: any) => {
        if (wishlist.some(g => g.igdbId === gameData.id)) {
            Alert.alert("Aviso", "Este jogo já está na sua Lista de Desejos!");
            return;
        }
        setGameToSave(gameData);
        setIsPlatformModalVisible(true);
    };

    // Salva o jogo com a plataforma oficial escolhida
    const confirmAddToWishlist = async (platformName: string) => {
        if (!gameToSave) return;

        const newWishlistGame: Game = {
            idGame: Math.floor(Math.random() * 100000),
            igdbId: gameToSave.id,
            name: gameToSave.name,
            coverUrl: getIgdbImageUrl(gameToSave.cover?.image_id, 't_cover_big') || '',
            releaseYear: gameToSave.first_release_date ? new Date(gameToSave.first_release_date * 1000).getFullYear() : new Date().getFullYear(),
            status: 'wishlist',
            platforms: [{ idPlatform: Math.floor(Math.random() * 100), name: platformName }],
            mediaType: [] 
        };

        const updatedWishlist = [newWishlistGame, ...wishlist];
        setWishlist(updatedWishlist);
        await saveWishlistToStorage(updatedWishlist);
        
        setIsPlatformModalVisible(false);
        setGameToSave(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveFromWishlist = (idGame: number) => {
        Alert.alert("Remover", "Deseja remover este jogo da sua lista de desejos?", [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Remover", 
                style: "destructive", 
                onPress: async () => {
                    const updated = wishlist.filter(g => g.idGame !== idGame);
                    setWishlist(updated);
                    await saveWishlistToStorage(updated);
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <Stack.Screen options={{ 
                title: "Lista de Desejos", 
                headerBackTitle: "Voltar",
                headerTintColor: '#8257E5',
                headerStyle: { backgroundColor: '#121212' },
            }} />

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#7C7C8A" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquisar jogos para adicionar..."
                        placeholderTextColor="#7C7C8A"
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            if (text.length === 0) setSearchResults([]);
                        }}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                            <Ionicons name="close-circle" size={20} color="#7C7C8A" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isSearching ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8257E5" />
                    <Text style={styles.loadingText}>Buscando no banco de dados...</Text>
                </View>
            ) : searchResults.length > 0 ? (
                /* --- RESULTADOS DA PESQUISA --- */
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.resultItem} onPress={() => handleInitAddToWishlist(item)}>
                            <Image 
                                source={{ uri: getIgdbImageUrl(item.cover?.image_id, 't_cover_small') || 'https://via.placeholder.com/45x60.png?text=Sem+Capa' }} 
                                style={styles.resultCover} 
                            />
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultTitle}>{item.name}</Text>
                                <Text style={styles.resultYear}>{item.first_release_date ? new Date(item.first_release_date * 1000).getFullYear() : 'N/A'}</Text>
                            </View>
                            <Ionicons name="add-circle" size={28} color="#8257E5" />
                        </TouchableOpacity>
                    )}
                />
            ) : (
                /* --- A SUA WISHLIST SALVA --- */
                <FlatList
                    data={wishlist}
                    keyExtractor={(item) => item.idGame.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="heart-dislike-outline" size={64} color="#323238" />
                            <Text style={styles.emptyText}>A sua lista de desejos está vazia.</Text>
                            <Text style={styles.emptySubText}>Pesquise um jogo acima para começar a adicionar.</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const platformName = item.platforms && item.platforms.length > 0 
                                            ? (typeof item.platforms[0] === 'string' ? item.platforms[0] : item.platforms[0].name)
                                            : 'Sem Plataforma';

                        return (
                            <View style={styles.wishlistItem}>
                                <Image source={{ uri: item.coverUrl }} style={styles.wishlistCover} />
                                <View style={styles.wishlistInfo}>
                                    <Text style={styles.wishlistTitle} numberOfLines={2}>{item.name}</Text>
                                    <View style={styles.badgeContainer}>
                                        <Text style={styles.wishlistYear}>{item.releaseYear}</Text>
                                        <Text style={styles.dotSeparator}>•</Text>
                                        <Text style={styles.wishlistPlatform}>{platformName}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFromWishlist(item.idGame)}>
                                    <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />
            )}

            {/* MODAL MÁGICO: LISTA AS PLATAFORMAS OFICIAIS DO JOGO */}
            <Modal visible={isPlatformModalVisible} animationType="fade" transparent={true}>
                <View style={styles.overlayModal}>
                    <View style={styles.smallModalContent}>
                        <Text style={styles.smallModalTitle}>Em qual plataforma deseja?</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            
                            {/* Renderiza as plataformas que a API do IGDB devolveu para este jogo específico */}
                            {gameToSave?.platforms?.map((plat: any) => (
                                <TouchableOpacity 
                                    key={plat.id} 
                                    style={styles.optionItem} 
                                    onPress={() => confirmAddToWishlist(plat.name)}
                                >
                                    <Text style={styles.optionText}>{plat.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#7C7C8A" />
                                </TouchableOpacity>
                            ))}

                            {/* Fallback de segurança caso a API devolva um jogo sem plataforma cadastrada lá */}
                            {(!gameToSave?.platforms || gameToSave.platforms.length === 0) && (
                                <TouchableOpacity 
                                    style={styles.optionItem} 
                                    onPress={() => confirmAddToWishlist('Desconhecida / Qualquer')}
                                >
                                    <Text style={styles.optionText}>Qualquer plataforma</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#7C7C8A" />
                                </TouchableOpacity>
                            )}

                        </ScrollView>
                        <TouchableOpacity 
                            style={styles.closeOptionButton} 
                            onPress={() => { setIsPlatformModalVisible(false); setGameToSave(null); }}
                        >
                            <Text style={styles.closeOptionText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    searchSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#323238', backgroundColor: '#121212' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202024', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#323238' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, color: '#FFF', paddingVertical: 12, fontSize: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#E1E1E6', marginTop: 16, fontSize: 16 },
    listContainer: { padding: 16, paddingBottom: 40 },
    
    resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202024', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#8257E5' },
    resultCover: { width: 40, height: 55, borderRadius: 4, backgroundColor: '#000', marginRight: 12 },
    resultInfo: { flex: 1 },
    resultTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    resultYear: { color: '#7C7C8A', fontSize: 14 },

    wishlistItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202024', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#323238' },
    wishlistCover: { width: 55, height: 75, borderRadius: 6, backgroundColor: '#000', marginRight: 16 },
    wishlistInfo: { flex: 1, justifyContent: 'center' },
    wishlistTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6, lineHeight: 22 },
    badgeContainer: { flexDirection: 'row', alignItems: 'center' },
    wishlistYear: { color: '#7C7C8A', fontSize: 14, fontWeight: '600' },
    dotSeparator: { color: '#323238', marginHorizontal: 6, fontSize: 16, fontWeight: 'bold' },
    wishlistPlatform: { color: '#8257E5', fontSize: 14, fontWeight: 'bold' }, 
    removeButton: { padding: 10, backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 8 },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#E1E1E6', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
    emptySubText: { color: '#7C7C8A', textAlign: 'center', marginTop: 8, fontSize: 14, paddingHorizontal: 20 },

    overlayModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    smallModalContent: { backgroundColor: '#202024', width: '100%', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#323238' },
    smallModalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#323238' },
    optionText: { color: '#E1E1E6', fontSize: 16, fontWeight: 'bold' },
    closeOptionButton: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
    closeOptionText: { color: '#FF6B6B', fontSize: 16, fontWeight: 'bold' },
});