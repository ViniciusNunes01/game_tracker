import { loadGamesFromStorage } from "@/src/services/storageService";
import { Game } from "@/src/types/Game";
import { Link, useFocusEffect, router } from "expo-router";
import React, { useCallback, useState, useMemo, useRef } from "react";
import { FlatList, StyleSheet, Text, TextInput as RNTextInput, TouchableOpacity, View, Image, ScrollView, Modal, TextInput, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [myGames, setMyGames] = useState<Game[]>([]);

  const [activeFolder, setActiveFolder] = useState('Todos');
  const [userFilters, setUserFilters] = useState<string[]>(['Todos']);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [catalogTitle, setCatalogTitle] = useState('Meu Catálogo');
  const titleRef = useRef<RNTextInput>(null);

  // --- ESTADOS DA ANIMAÇÃO RETRÁTIL ---
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const filterHeight = useRef(new Animated.Value(0)).current; // Começa escondido (altura 0)
  const filterOpacity = useRef(new Animated.Value(0)).current; // Começa transparente

  useFocusEffect(
    useCallback(() => {
      async function fetchGames() {
        const storedGames = await loadGamesFromStorage();
        setMyGames(storedGames.reverse());

        const savedTitle = await AsyncStorage.getItem('userCatalogTitle');
        if (savedTitle) setCatalogTitle(savedTitle);
      }
      fetchGames();
    }, [])
  );

  const availableFilters = useMemo(() => {
    const allPlatforms = myGames.flatMap(g =>
      g.platforms?.map(p => typeof p === 'string' ? p : p.name) || []
    ).filter(Boolean) as string[];

    const uniquePlatforms = Array.from(new Set(allPlatforms));
    return ['Física', 'Digital', ...uniquePlatforms];
  }, [myGames]);

  const displayGames = useMemo(() => {
    let filtered = myGames.filter((game) =>
      game.name.toUpperCase().includes(searchText.toUpperCase())
    );

    if (activeFolder === 'Física') {
      filtered = filtered.filter(g => g.mediaType === 'physical');
    } else if (activeFolder === 'Digital') {
      filtered = filtered.filter(g => g.mediaType === 'digital');
    } else if (activeFolder !== 'Todos') {
      filtered = filtered.filter(g =>
        g.platforms?.some(p => (typeof p === 'string' ? p : p.name) === activeFolder)
      );
    }

    return filtered;
  }, [myGames, searchText, activeFolder]);

  const handleAddFilter = (filter: string) => {
    if (!userFilters.includes(filter)) {
      setUserFilters([...userFilters, filter]);
    }
    setActiveFolder(filter);
    setIsFilterModalVisible(false);
  };

  const handleRemoveFilter = (filterToRemove: string) => {
      setUserFilters(prev => prev.filter(f => f !== filterToRemove));
      if (activeFolder === filterToRemove) {
          setActiveFolder('Todos');
      }
  };

  const handleTitleChange = async (text: string) => {
    setCatalogTitle(text);
    await AsyncStorage.setItem('userCatalogTitle', text);
  };

  // --- FUNÇÃO QUE DISPARA A ANIMAÇÃO ---
  const toggleFilters = () => {
    const toValue = isFiltersVisible ? 0 : 1;
    
    Animated.parallel([
        Animated.timing(filterHeight, {
            toValue: isFiltersVisible ? 0 : 130, // 130 é a altura suficiente para os inputs e botões
            duration: 300,
            useNativeDriver: false, // height não suporta native driver
        }),
        Animated.timing(filterOpacity, {
            toValue,
            duration: 250,
            useNativeDriver: false,
        })
    ]).start();

    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* CABEÇALHO FIXO */}
      <View style={styles.fixedHeader}>
        <View>
          <TextInput
            ref={titleRef}
            style={styles.title}
            value={catalogTitle}
            onChangeText={handleTitleChange}
            placeholder="Nome da Coleção..."
            placeholderTextColor="#7C7C8A"
            returnKeyType="done"
            selectTextOnFocus={true}
            cursorColor="#8257E5"
            onSubmitEditing={() => {
              titleRef.current?.blur();
            }}
          />
          <Text style={styles.gameCount}>
            {myGames.length} {myGames.length === 1 ? 'jogo' : 'jogos'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* BOTÃO DA GAVETA RETRÁTIL */}
          <TouchableOpacity style={styles.iconButton} onPress={toggleFilters}>
            <Ionicons name={isFiltersVisible ? "chevron-up" : "search"} size={26} color="#E1E1E6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/wishlist' as any)}>
            <Ionicons name="heart" size={26} color="#E1E1E6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/game/new')}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* GAVETA ANIMADA DE BUSCA E FILTROS */}
      <Animated.View style={[styles.collapsibleContainer, { height: filterHeight, opacity: filterOpacity }]}>
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#7C7C8A" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar na coleção..."
              placeholderTextColor="#7C7C8A"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* BARRA DE PASTAS VIRTUAIS */}
        <View style={styles.foldersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foldersScroll}>
            {userFilters.map(folder => (
              <TouchableOpacity
                key={folder}
                style={[styles.folderChip, activeFolder === folder && styles.folderChipActive]}
                onPress={() => setActiveFolder(folder)}
              >
                <View style={styles.chipContent}>
                    <Text style={[styles.folderText, activeFolder === folder && styles.folderTextActive]}>
                      {folder}
                    </Text>
                    
                    {folder !== 'Todos' && (
                        <TouchableOpacity onPress={() => handleRemoveFilter(folder)} style={styles.removeFilterIcon}>
                            <Ionicons 
                                name="close-circle" 
                                size={16} 
                                color={activeFolder === folder ? '#FFF' : '#7C7C8A'} 
                            />
                        </TouchableOpacity>
                    )}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addFolderChip} onPress={() => setIsFilterModalVisible(true)}>
              <Ionicons name="add" size={18} color="#E1E1E6" />
              <Text style={styles.addFolderText}>Filtro</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>

      {/* GRADE DE JOGOS */}
      <FlatList
        data={displayGames}
        keyExtractor={(item) => item.idGame.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#323238" />
            <Text style={styles.emptyText}>
              {searchText || activeFolder !== 'Todos'
                ? "Nenhum jogo neste filtro/busca."
                : "Sua coleção está vazia."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const platformText = item.platforms && item.platforms.length > 0
            ? item.platforms.map(p => typeof p === 'string' ? p : p.name).join(', ')
            : 'Variados';

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push(`/game/${item.idGame}`)}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.boxArtUrl || item.coverUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.gameTitle} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.gamePlatform} numberOfLines={1}>
                  {platformText}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* MODAL DE ESCOLHA DE FILTROS */}
      <Modal visible={isFilterModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar Filtro</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
              <Ionicons name="close" size={28} color="#E1E1E6" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableFilters.filter(f => !userFilters.includes(f))}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Você já adicionou todos os filtros disponíveis!</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalFilterItem}
                onPress={() => handleAddFilter(item)}
              >
                <Text style={styles.modalFilterText}>{item}</Text>
                <Ionicons name="add-circle-outline" size={24} color="#8257E5" />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },

  fixedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  title: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  gameCount: { color: '#8257E5', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconButton: { padding: 4 },
  addButton: { backgroundColor: '#8257E5', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // GAVETA RETRÁTIL - Adicionado overflow hidden
  collapsibleContainer: { overflow: 'hidden' },

  searchSection: { paddingHorizontal: 16, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202024', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#FFF', paddingVertical: 12, fontSize: 16 },

  // Pastas Virtuais (Chips)
  foldersContainer: { marginBottom: 16 },
  foldersScroll: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  folderChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#202024', borderWidth: 1, borderColor: '#323238' },
  folderChipActive: { backgroundColor: '#8257E5', borderColor: '#8257E5' },
  chipContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  folderText: { color: '#7C7C8A', fontSize: 14, fontWeight: 'bold' },
  folderTextActive: { color: '#FFF' },
  removeFilterIcon: { padding: 2, marginLeft: -2, marginRight: -4 },

  addFolderChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#323238', borderStyle: 'dashed', gap: 4 },
  addFolderText: { color: '#E1E1E6', fontSize: 14, fontWeight: 'bold' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: { width: '48%', backgroundColor: '#202024', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#323238' },
  imageContainer: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#000' },
  cardImage: { width: '100%', height: '100%' },

  cardInfo: { padding: 12 },
  gameTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 4, lineHeight: 20 },
  gamePlatform: { color: '#7C7C8A', fontSize: 13, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#7C7C8A', textAlign: 'center', marginTop: 16, fontSize: 16 },

  modalContainer: { flex: 1, backgroundColor: '#121212' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#323238' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  modalList: { padding: 16 },
  modalFilterItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#202024', padding: 16, borderRadius: 8, marginBottom: 10 },
  modalFilterText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});