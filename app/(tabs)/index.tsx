import { getPlatformAbbreviation } from "@/src/services/platformService";
import { incrementRouletteAcceptedCount, loadGamesFromStorage, loadRouletteActiveGameId, loadRouletteStats, resetRouletteAcceptedCount, saveRouletteActiveGameId, updateGameStatusInStorage } from "@/src/services/storageService";
import { Game } from "@/src/types/Game";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Animated, Dimensions, FlatList, Image, Keyboard, Modal, TextInput as RNTextInput, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [myGames, setMyGames] = useState<Game[]>([]);

  const [activeFolder, setActiveFolder] = useState('Todos');
  const [userFilters, setUserFilters] = useState<string[]>(['Todos']);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [catalogTitle, setCatalogTitle] = useState('Meu Catálogo');
  const titleRef = useRef<RNTextInput>(null);
  const [dashboardColumns, setDashboardColumns] = useState<number>(2);
  const [rouletteAcceptedCount, setRouletteAcceptedCount] = useState(0);
  const [rouletteActiveGameId, setRouletteActiveGameId] = useState<number | null>(null);

  const [isRouletteModalVisible, setIsRouletteModalVisible] = useState(false);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const [roulettePreviewGame, setRoulettePreviewGame] = useState<Game | null>(null);
  const [rouletteResultGame, setRouletteResultGame] = useState<Game | null>(null);

  const [rouletteStatusFilters, setRouletteStatusFilters] = useState<string[]>([]);
  const [rouletteMediaFilter, setRouletteMediaFilter] = useState<'all' | 'physical' | 'digital'>('all');
  const [roulettePlatformFilter, setRoulettePlatformFilter] = useState('Todos');

  const roulettePulse = useRef(new Animated.Value(1)).current;
  const rouletteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rouletteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roulettePulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // --- ESTADOS DA ANIMAÇÃO RETRÁTIL ---
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const filterHeight = useRef(new Animated.Value(0)).current; // Começa escondido (altura 0)
  const filterOpacity = useRef(new Animated.Value(0)).current; // Começa transparente

  // --- ESTADOS DE ORDENAÇÃO ---
  type SortOption = 'recent' | 'a-z' | 'z-a' | 'year-desc' | 'year-asc' | 'platform' | 'status';
  const [sortOption, setSortOption] = useState<SortOption>('a-z'); // Começa com A-Z como você preferiu
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const [showFinishedOnly, setShowFinishedOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function fetchGames() {
        const storedGames = await loadGamesFromStorage();
        setMyGames(storedGames.reverse());

        const savedTitle = await AsyncStorage.getItem('userCatalogTitle');
        if (savedTitle) setCatalogTitle(savedTitle);
        const savedColumns = await AsyncStorage.getItem('dashboardColumns');
        if (savedColumns) setDashboardColumns(Number(savedColumns));

        const rouletteStats = await loadRouletteStats();
        setRouletteAcceptedCount(rouletteStats.acceptedCount);

        const activeRouletteGameId = await loadRouletteActiveGameId();
        setRouletteActiveGameId(activeRouletteGameId);
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

  const rouletteStatusOptions = useMemo(() => {
    return Array.from(new Set(myGames.map(g => g.status).filter(Boolean))) as string[];
  }, [myGames]);

  const roulettePlatformOptions = useMemo(() => {
    const allPlatforms = myGames.flatMap(g =>
      g.platforms?.map(p => typeof p === 'string' ? p : p.name) || []
    ).filter(Boolean) as string[];

    return ['Todos', ...Array.from(new Set(allPlatforms))];
  }, [myGames]);

  const currentPlayingGames = useMemo(() => {
    return myGames.filter((game) => (game.status || '').toLowerCase().includes('jogando'));
  }, [myGames]);

  // Conta quantos jogos estão com o status "Terminado" ou "Platinado"
  const finishedGamesCount = useMemo(() => {
    return myGames.filter(game => {
      const statusLower = (game.status || '').toLowerCase();
      return statusLower === 'terminado' || statusLower === 'platinado';
    }).length;
  }, [myGames]);

  const rouletteActiveGame = useMemo(() => {
    return myGames.find((game) => game.idGame === rouletteActiveGameId) || null;
  }, [myGames, rouletteActiveGameId]);

  const rouletteHeroSubtitle = useMemo(() => {
    const highlightedGame = rouletteActiveGame || currentPlayingGames[0] || null;

    if (!highlightedGame) {
      return 'Nenhum jogo marcado como Jogando no momento.';
    }

    return `Jogando agora: ${highlightedGame.name}`;
  }, [currentPlayingGames, rouletteActiveGame]);

  const displayGames = useMemo(() => {
    // 1. Primeiro fazemos o filtro normal (Busca e Pastas)
    let filtered = myGames.filter((game) =>
      game.name.toUpperCase().includes(searchText.toUpperCase())
    );

    if (showFinishedOnly) {
      filtered = filtered.filter(g => {
        const s = (g.status || '').toLowerCase();
        return s === 'terminado' || s === 'platinado';
      });
    }

    if (activeFolder === 'Física') {
      filtered = filtered.filter(g => g.mediaType === 'physical');
    } else if (activeFolder === 'Digital') {
      filtered = filtered.filter(g => g.mediaType === 'digital');
    } else if (activeFolder !== 'Todos') {
      filtered = filtered.filter(g =>
        g.platforms?.some(p => (typeof p === 'string' ? p : p.name) === activeFolder)
      );
    }

    // 2. Criamos uma cópia para não mutar o estado original e aplicamos a ordenação
    const sorted = [...filtered];

    switch (sortOption) {
      case 'a-z':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
        break;
      case 'z-a':
        sorted.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR', { sensitivity: 'base' }));
        break;
      case 'year-desc': // Lançamentos mais novos primeiro
        sorted.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
        break;
      case 'year-asc': // Clássicos mais antigos primeiro
        sorted.sort((a, b) => (a.releaseYear || 0) - (b.releaseYear || 0));
        break;
      case 'platform': // Agrupa pela plataforma (alfabetica)
        sorted.sort((a, b) => {
          const platA = a.platforms?.[0] ? (typeof a.platforms[0] === 'string' ? a.platforms[0] : a.platforms[0].name) : '';
          const platB = b.platforms?.[0] ? (typeof b.platforms[0] === 'string' ? b.platforms[0] : b.platforms[0].name) : '';
          return platA.localeCompare(platB, 'pt-BR', { sensitivity: 'base' });
        });
        break;
      case 'status': // Agrupa pelo status (Jogando, Platinado, etc)
        sorted.sort((a, b) => (a.status || '').localeCompare(b.status || '', 'pt-BR', { sensitivity: 'base' }));
        break;
      case 'recent':
      default:
        // Mantém a ordem padrão (como foi adicionado no app)
        break;
    }

    return sorted;
  }, [myGames, searchText, activeFolder, sortOption, showFinishedOnly]);

  const roulettePreviewImage = roulettePreviewGame?.boxArtUrl || roulettePreviewGame?.coverUrl;

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

  const getRouletteCandidates = useCallback(() => {
    return myGames.filter((game) => {
      if (rouletteStatusFilters.length > 0 && !rouletteStatusFilters.includes(game.status)) {
        return false;
      }

      if (rouletteMediaFilter !== 'all' && game.mediaType !== rouletteMediaFilter) {
        return false;
      }

      if (roulettePlatformFilter !== 'Todos') {
        const gamePlatforms = game.platforms?.map(p => typeof p === 'string' ? p : p.name) || [];
        if (!gamePlatforms.includes(roulettePlatformFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [myGames, rouletteMediaFilter, roulettePlatformFilter, rouletteStatusFilters]);

  const clearRouletteTimers = useCallback(() => {
    if (rouletteIntervalRef.current) {
      clearInterval(rouletteIntervalRef.current);
      rouletteIntervalRef.current = null;
    }

    if (rouletteTimeoutRef.current) {
      clearTimeout(rouletteTimeoutRef.current);
      rouletteTimeoutRef.current = null;
    }

    roulettePulseRef.current?.stop();
    roulettePulse.setValue(1);
  }, [roulettePulse]);

  const openRoulette = () => {
    setIsRouletteModalVisible(true);
    setRouletteResultGame(null);
    setIsRouletteSpinning(false);
  };

  const startRoulette = () => {
    const candidates = getRouletteCandidates();

    if (candidates.length === 0) {
      alert('Nenhum jogo encontrado com esses filtros.');
      return;
    }

    clearRouletteTimers();
    setRouletteResultGame(null);
    setIsRouletteSpinning(true);

    const pickRandomGame = () => candidates[Math.floor(Math.random() * candidates.length)];
    setRoulettePreviewGame(pickRandomGame());

    roulettePulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(roulettePulse, { toValue: 1.04, duration: 180, useNativeDriver: true }),
        Animated.timing(roulettePulse, { toValue: 0.98, duration: 180, useNativeDriver: true }),
      ])
    );
    roulettePulseRef.current.start();

    rouletteIntervalRef.current = setInterval(() => {
      setRoulettePreviewGame(pickRandomGame());
    }, 110);

    rouletteTimeoutRef.current = setTimeout(() => {
      clearRouletteTimers();
      const finalGame = pickRandomGame();
      setRoulettePreviewGame(finalGame);
      setRouletteResultGame(finalGame);
      setIsRouletteSpinning(false);
    }, 1800);
  };

  const acceptRouletteGame = async () => {
    if (!rouletteResultGame) return;

    await updateGameStatusInStorage(rouletteResultGame.idGame, 'Jogando');
    await saveRouletteActiveGameId(rouletteResultGame.idGame);

    const nextCount = await incrementRouletteAcceptedCount();
    setRouletteAcceptedCount(nextCount);
    setRouletteActiveGameId(rouletteResultGame.idGame);
    setMyGames(prevGames => prevGames.map((game) => (
      game.idGame === rouletteResultGame.idGame ? { ...game, status: 'Jogando' } : game
    )));
    setIsRouletteModalVisible(false);
    router.push(`/game/${rouletteResultGame.idGame}`);
  };

  const handleResetRouletteCounter = () => {
    Alert.alert(
      'Zerar contador',
      'Quer zerar o contador de jogos aceitos na roleta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Zerar',
          style: 'destructive',
          onPress: async () => {
            const nextCount = await resetRouletteAcceptedCount();
            setRouletteAcceptedCount(nextCount);
          },
        },
      ]
    );
  };

  const resetRouletteFilters = () => {
    setRouletteStatusFilters([]);
    setRouletteMediaFilter('all');
    setRoulettePlatformFilter('Todos');
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
        <View style={{ flex: 1, paddingRight: 16 }}>

          {/* O ScrollView horizontal permite arrastar um título gigante pro lado sem quebrar a tela */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
              onSubmitEditing={() => titleRef.current?.blur()}
            />
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>

            {/* BOTÃO 1: MOSTRAR TODOS OS JOGOS */}
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowFinishedOnly(false)}>
              <Text style={[
                styles.gameCount,
                // Se NÃO estiver filtrando por terminados, este texto fica em destaque (Roxo), senão fica Cinza
                { color: !showFinishedOnly ? '#8257E5' : '#7C7C8A' }
              ]}>
                {myGames.length} {myGames.length === 1 ? 'jogo' : 'jogos'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.gameCount, { color: '#7C7C8A', marginHorizontal: 6 }]}>•</Text>

            {/* BOTÃO 2: MOSTRAR APENAS TERMINADOS */}
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowFinishedOnly(true)}>
              <Text style={[
                styles.gameCount,
                // Se ESTIVER filtrando por terminados, este texto fica em destaque (Roxo), senão fica Cinza
                { color: showFinishedOnly ? '#8257E5' : '#7C7C8A' }
              ]}>
                {finishedGamesCount} {finishedGamesCount === 1 ? 'terminado' : 'terminados'}
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setIsSortModalVisible(true)}>
            <Ionicons name="swap-vertical" size={26} color="#E1E1E6" />
          </TouchableOpacity>

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

      <TouchableOpacity style={styles.rouletteHeroCard} onPress={openRoulette} activeOpacity={0.85}>
        <View style={styles.rouletteHeroTextBlock}>
          <Text style={styles.rouletteHeroTitle}>Escolher jogo aleatório</Text>
          <Text style={styles.rouletteHeroSubtitle} numberOfLines={2}>
            {rouletteHeroSubtitle}
          </Text>
        </View>

        <View style={styles.rouletteHeroCounter}>
          <Text style={styles.rouletteHeroCounterValue}>{rouletteAcceptedCount}</Text>
          <Text style={styles.rouletteHeroCounterLabel}>aceitos</Text>
        </View>
      </TouchableOpacity>

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

        <TouchableOpacity style={styles.resetRouletteCounterButton} onPress={handleResetRouletteCounter} activeOpacity={0.8}>
          <Text style={styles.resetRouletteCounterText}>Zerar contador da roleta</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* GRADE DE JOGOS */}
      <FlatList
        key={`cols-${dashboardColumns}`}
        data={displayGames}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        keyExtractor={(item) => item.idGame.toString()}
        numColumns={dashboardColumns}
        columnWrapperStyle={dashboardColumns > 1 ? styles.row : undefined}
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
            ? item.platforms
              .map(p => {
                if (typeof p === 'string') {
                  return getPlatformAbbreviation(p);
                }

                return getPlatformAbbreviation(p.name, p.abbreviation);
              })
              .join(' • ')
            : 'Variados';

          const showInfo = dashboardColumns < 4;

          return (
            <TouchableOpacity
              style={[styles.card, { width: getCardWidth(dashboardColumns) }]}
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

              {showInfo && (
                <View style={styles.cardInfo}>
                  <Text style={styles.gameTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.gamePlatform} numberOfLines={1}>
                    {platformText}
                  </Text>
                </View>
              )}
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

      {/* MODAL: Roleta */}
      <Modal visible={isRouletteModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsRouletteModalVisible(false)}>
        <View style={styles.rouletteOverlay}>
          <Animated.View style={[styles.rouletteModalContent, { transform: [{ scale: roulettePulse }] }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Roleta</Text>
                <Text style={styles.rouletteModalSubtitle}>Escolha os filtros e deixe o app sortear.</Text>
              </View>
              <TouchableOpacity onPress={() => { clearRouletteTimers(); setIsRouletteModalVisible(false); }}>
                <Ionicons name="close" size={28} color="#E1E1E6" />
              </TouchableOpacity>
            </View>

            {!rouletteResultGame ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rouletteModalBody}>
                <View style={styles.rouletteFilterSection}>
                  <Text style={styles.rouletteFilterTitle}>Status</Text>
                  <View style={styles.chipsWrap}>
                    {rouletteStatusOptions.length > 0 ? rouletteStatusOptions.map((status) => {
                      const active = rouletteStatusFilters.includes(status);
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[styles.rouletteChip, active && styles.rouletteChipActive]}
                          onPress={() => setRouletteStatusFilters(prev => active ? prev.filter(s => s !== status) : [...prev, status])}
                        >
                          <Text style={[styles.rouletteChipText, active && styles.rouletteChipTextActive]}>{status}</Text>
                        </TouchableOpacity>
                      );
                    }) : <Text style={styles.rouletteEmptyText}>Nenhum status encontrado.</Text>}
                  </View>
                </View>

                <View style={styles.rouletteFilterSection}>
                  <Text style={styles.rouletteFilterTitle}>Mídia</Text>
                  <View style={styles.chipsWrap}>
                    {(['all', 'physical', 'digital'] as const).map((value) => {
                      const labels = { all: 'Todas', physical: 'Física', digital: 'Digital' } as const;
                      const active = rouletteMediaFilter === value;
                      return (
                        <TouchableOpacity key={value} style={[styles.rouletteChip, active && styles.rouletteChipActive]} onPress={() => setRouletteMediaFilter(value)}>
                          <Text style={[styles.rouletteChipText, active && styles.rouletteChipTextActive]}>{labels[value]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.rouletteFilterSection}>
                  <Text style={styles.rouletteFilterTitle}>Plataforma</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformChipsScroll}>
                    {roulettePlatformOptions.map(platform => {
                      const active = roulettePlatformFilter === platform;
                      return (
                        <TouchableOpacity key={platform} style={[styles.rouletteChip, active && styles.rouletteChipActive]} onPress={() => setRoulettePlatformFilter(platform)}>
                          <Text style={[styles.rouletteChipText, active && styles.rouletteChipTextActive]}>{platform}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.rouletteFooterActions}>
                  <TouchableOpacity style={styles.rouletteSecondaryButton} onPress={resetRouletteFilters}>
                    <Text style={styles.rouletteSecondaryButtonText}>Limpar filtros</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.roulettePrimaryButton} onPress={startRoulette}>
                    <Text style={styles.roulettePrimaryButtonText}>Sortear</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.rouletteModalBody}>
                <Text style={styles.rouletteSpinningLabel}>{isRouletteSpinning ? 'Girando...' : 'Resultado'}</Text>

                <Animated.View style={[styles.rouletteResultCard, { opacity: roulettePreviewGame ? 1 : 0.5 }]}>
                  {roulettePreviewImage ? (
                    <Image source={{ uri: roulettePreviewImage }} style={styles.rouletteResultImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.rouletteResultImageFallback}>
                      <Ionicons name="game-controller-outline" size={42} color="#7C7C8A" />
                    </View>
                  )}
                  <Text style={styles.rouletteResultTitle}>{roulettePreviewGame?.name}</Text>
                  <Text style={styles.rouletteResultSubtitle}>{roulettePreviewGame?.status || 'Sem status'}</Text>
                </Animated.View>

                {!isRouletteSpinning && rouletteResultGame && (
                  <View style={styles.rouletteFooterActions}>
                    <TouchableOpacity style={styles.rouletteSecondaryButton} onPress={() => { setRouletteResultGame(null); startRoulette(); }}>
                      <Text style={styles.rouletteSecondaryButtonText}>Sortear de novo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.roulettePrimaryButton} onPress={acceptRouletteGame}>
                      <Text style={styles.roulettePrimaryButtonText}>Aceitar este</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL: Ordenação */}
      <Modal visible={isSortModalVisible} animationType="fade" transparent={true}>
        <View style={styles.overlayModal}>
          <View style={styles.smallModalContent}>
            <Text style={styles.smallModalTitle}>Ordenar Catálogo</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {[
                { id: 'a-z', label: 'Ordem Alfabética (A - Z)' },
                { id: 'z-a', label: 'Ordem Alfabética (Z - A)' },
                { id: 'recent', label: 'Adição Recente' },
                { id: 'year-desc', label: 'Ano (Mais novos primeiro)' },
                { id: 'year-asc', label: 'Ano (Clássicos primeiro)' },
                { id: 'platform', label: 'Agrupar por Plataforma' },
                { id: 'status', label: 'Agrupar por Status' },
              ].map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionItem}
                  onPress={() => {
                    setSortOption(option.id as SortOption);
                    setIsSortModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, sortOption === option.id && { color: '#8257E5', fontWeight: 'bold' }]}>
                    {option.label}
                  </Text>
                  {sortOption === option.id && <Ionicons name="checkmark" size={20} color="#8257E5" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeOptionButton} onPress={() => setIsSortModalVisible(false)}>
              <Text style={styles.closeOptionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
  card: { backgroundColor: '#202024', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#323238' },
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
  modalFilterText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  rouletteHeroCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#202024', borderWidth: 1, borderColor: '#323238', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  rouletteHeroTextBlock: { flex: 1 },
  rouletteHeroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(130, 87, 229, 0.18)', borderWidth: 1, borderColor: 'rgba(130, 87, 229, 0.45)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 10 },
  rouletteHeroTagText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  rouletteHeroTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  rouletteHeroSubtitle: { color: '#7C7C8A', fontSize: 13, lineHeight: 18 },
  rouletteHeroCounter: { minWidth: 72, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: '#17171A', borderWidth: 1, borderColor: '#323238', alignItems: 'center' },
  rouletteHeroCounterValue: { color: '#8257E5', fontSize: 24, fontWeight: '900' },
  rouletteHeroCounterLabel: { color: '#7C7C8A', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  resetRouletteCounterButton: { alignSelf: 'flex-end', marginRight: 16, marginBottom: 12, paddingVertical: 4, paddingHorizontal: 2 },
  resetRouletteCounterText: { color: '#7C7C8A', fontSize: 12, fontWeight: '700' },

  rouletteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  rouletteModalContent: { width: '100%', backgroundColor: '#202024', borderRadius: 18, borderWidth: 1, borderColor: '#323238', overflow: 'hidden' },
  rouletteModalSubtitle: { color: '#7C7C8A', fontSize: 12, marginTop: 4 },
  rouletteModalBody: { padding: 20, gap: 18 },
  rouletteNowPlayingSection: { gap: 10 },
  rouletteNowPlayingTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  rouletteNowPlayingScroll: { gap: 10, paddingRight: 4 },
  rouletteNowPlayingChip: { backgroundColor: 'rgba(130, 87, 229, 0.16)', borderWidth: 1, borderColor: 'rgba(130, 87, 229, 0.4)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 220 },
  rouletteNowPlayingChipText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  rouletteNowPlayingEmpty: { color: '#7C7C8A', fontSize: 13 },
  rouletteFilterSection: { gap: 10 },
  rouletteFilterTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rouletteChip: { backgroundColor: '#17171A', borderWidth: 1, borderColor: '#323238', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  rouletteChipActive: { backgroundColor: 'rgba(130, 87, 229, 0.2)', borderColor: '#8257E5' },
  rouletteChipText: { color: '#E1E1E6', fontSize: 13, fontWeight: '700' },
  rouletteChipTextActive: { color: '#FFF' },
  rouletteEmptyText: { color: '#7C7C8A', fontSize: 13 },
  platformChipsScroll: { gap: 10, paddingRight: 4 },
  rouletteFooterActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  rouletteSecondaryButton: { flex: 1, backgroundColor: '#17171A', borderWidth: 1, borderColor: '#323238', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  roulettePrimaryButton: { flex: 1, backgroundColor: '#8257E5', borderWidth: 1, borderColor: '#8257E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  rouletteSecondaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  roulettePrimaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  rouletteSpinningLabel: { color: '#7C7C8A', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '800' },
  rouletteResultCard: { backgroundColor: '#17171A', borderWidth: 1, borderColor: '#323238', borderRadius: 16, padding: 14, alignItems: 'center', gap: 10 },
  rouletteResultImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#000' },
  rouletteResultImageFallback: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#0D0D0F', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#323238' },
  rouletteResultTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  rouletteResultSubtitle: { color: '#7C7C8A', fontSize: 13, textAlign: 'center' },
  overlayModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  smallModalContent: { backgroundColor: '#202024', width: '100%', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#323238' },
  smallModalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#323238' },
  optionText: { color: '#E1E1E6', fontSize: 16 },
  closeOptionButton: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
  closeOptionText: { color: '#7C7C8A', fontSize: 16, fontWeight: 'bold' },
});

function getCardWidth(columns: number) {
  const screenWidth = Dimensions.get('window').width;
  if (!columns || columns <= 1) return screenWidth - 32; // full width minus list padding

  const listHorizontalPadding = 32; // contentContainerStyle paddingHorizontal * 2
  const availableWidth = screenWidth - listHorizontalPadding;

  const gapPx = 8; // approximate gap between items
  const totalGaps = Math.max(0, columns - 1) * gapPx;

  const widthPx = Math.floor((availableWidth - totalGaps) / columns);
  return widthPx;
}