import { GameCard } from "@/src/components/GameCard";
import { mockGames } from "@/src/services/gameService";
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={mockGames}
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
  },
  listContent: {
    padding: 16,
  },
});