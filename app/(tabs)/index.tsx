import { GameCard } from "@/src/components/GameCard";
import { mockGames } from "@/src/services/gameService"; // Importe o mock
import React from "react";
import { View, FlatList, StyleSheet } from "react-native"; // Removi Image e Text pois não uso mais aqui

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockGames}
        keyExtractor={(item) => item.idGame.toString()}
        renderItem={({ item }) => <GameCard data={item} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  listContent: {
    padding: 16,
  },
});