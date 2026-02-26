import { GameCard } from "@/src/components/GameCard";
import { mockGames } from "@/src/services/gameService";
import React, { useState } from "react";
import { FlatList, StyleSheet, TextInput } from "react-native";
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

      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.idGame.toString()}
        renderItem={({ item }) => <GameCard data={item} />}
        contentContainerStyle={styles.listContent}
      />
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
  }
});