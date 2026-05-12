import { CardItem } from "@/src/components/CardItem";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useReminders } from "@/src/hooks/useReminders";
import { useRouter } from "expo-router";
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const { activeReminders, completedReminders, markCompleted, deleteReminder } =
    useReminders();
  const router = useRouter();

  const sections = [];
  if (activeReminders.length > 0) {
    sections.push({ title: "Active Reminders", data: activeReminders });
  }
  if (completedReminders.length > 0) {
    sections.push({ title: "Completed", data: completedReminders });
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section: { title } }) => (
          <Typography variant="h3" style={styles.sectionTitle}>
            {title}
          </Typography>
        )}
        ListEmptyComponent={
          <Typography style={styles.empty}>
            No reminders yet. Add one!
          </Typography>
        }
        renderItem={({ item }) => (
          <CardItem
            item={item}
            onMarkCompleted={markCompleted}
            onDelete={deleteReminder}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  list: {
    padding: Utility.spacing.m,
  },
  sectionTitle: {
    marginTop: Utility.spacing.m,
    marginBottom: Utility.spacing.s,
    color: Colors.light.text,
  },
  empty: {
    textAlign: "center",
    marginTop: Utility.spacing.xl,
  },
  fab: {
    position: "absolute",
    bottom: Utility.spacing.xl,
    right: Utility.spacing.m,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: "#FFFFFF",
    lineHeight: 36,
    fontWeight: "300",
  },
});
