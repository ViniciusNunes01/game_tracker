import { GameCard } from "@/src/components/GameCard";
import { loadGamesFromStorage } from "@/src/services/storageService";
import { Game } from "@/src/types/Game";
import { Link, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');

  const [myGames, setMyGames] = useState<Game[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function fetchGames() {
        const storedGames = await loadGamesFromStorage();
        setMyGames(storedGames);
      }

      fetchGames();
    }, [])
  );

  const filteredGames = myGames.filter((game) => {
    return game.name.toUpperCase().includes(searchText.toUpperCase());
  });

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar jogo pelo nome..."
        placeholderTextColor="#7C7C8A"
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.idGame.toString()}
        renderItem={({ item }) => <GameCard data={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum jogo na coleção ainda.</Text>}
      />

      <Link href="/game/new" asChild>
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  searchInput: {
    backgroundColor: "#202024",
    color: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#8257E5",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 34,
  },
  emptyText: {
    color: '#7C7C8A',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});