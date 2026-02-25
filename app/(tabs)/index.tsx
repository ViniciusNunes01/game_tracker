import React from "react";
import { View, Text, Image, FlatList, StyleSheet } from "react-native";

const mockGames = [
  {
    id: "1",
    name: "Red Dead Redemption 2",
    image: "https://via.placeholder.com/300",
    status: "completed",
  },
  {
    id: "2",
    name: "Cyberpunk 2077",
    image: "https://via.placeholder.com/300",
    status: "playing",
  },
  {
    id: "3",
    name: "Baldur's Gate 3",
    image: "https://via.placeholder.com/300",
    status: "backlog",
  },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockGames}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#121212",
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  status: {
    color: "#aaaaaa",
    marginTop: 4,
  },
});