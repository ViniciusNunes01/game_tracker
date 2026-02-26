import { GameCard } from "@/src/components/GameCard";
import { mockGames } from "@/src/services/gameService";
import { Link } from "expo-router";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {

  // Filtragem de jogos numa barra de pesquisa
  const [searchText, setSearchText] = useState('');
  const filteredGames = mockGames.filter((game) => {
    return game.name.toUpperCase().includes(searchText.toUpperCase());
  })



  return (
    <SafeAreaView style={styles.container}>

      {/* Filtro */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar jogo pelo nome..."
        placeholderTextColor="#7C7C8A"
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Lista de Jogos */}
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.idGame.toString()}
        renderItem={({ item }) => <GameCard data={item} />}
        contentContainerStyle={styles.listContent}
      />

      {/* Botão de Adicionar */}
      <Link href={"/game/new"} asChild>
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
  }
});