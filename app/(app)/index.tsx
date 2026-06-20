import { CardItem } from "@/src/components/CardItem";
import { ProjectSelector } from "@/src/components/ProjectSelector";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useDashboard } from "@/src/hooks/useDashboard";
import { useTaskCompletion } from "@/src/hooks/useTaskCompletion";
import { useRouter } from "expo-router";
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const {
    isProjectSelected,
    projectId,
    activeTasks,
    completedTasks,
    deleteTask,
    hasPermission,
    requestPermission,
    getDirectChildrenProgress,
  } = useDashboard();
  const { completeTask, reopenTask } = useTaskCompletion();
  const router = useRouter();

  if (!isProjectSelected) {
    return (
      <View style={styles.selectorContainer}>
        <ProjectSelector compact={false} />
      </View>
    );
  }

  const sections = [];
  if (activeTasks.length > 0) {
    sections.push({ title: "Tareas Activas", data: activeTasks });
  }
  if (completedTasks.length > 0) {
    sections.push({ title: "Completadas", data: completedTasks });
  }

  return (
    <View style={styles.container}>
      {hasPermission === false && (
        <TouchableOpacity
          style={styles.warningBanner}
          onPress={requestPermission}
          activeOpacity={0.9}
        >
          <Typography style={styles.warningText}>
            ⚠️ Las notificaciones están desactivadas. Las tareas no sonarán. Toca aquí para activarlas.
          </Typography>
        </TouchableOpacity>
      )}

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
            No hay tareas todavía. ¡Agrega una!
          </Typography>
        }
        renderItem={({ item }) => {
          const progress = getDirectChildrenProgress(item.id);
          return (
            <CardItem
              item={item}
              onMarkCompleted={item.completed ? reopenTask : completeTask}
              onDelete={deleteTask}
              onEdit={(id) => {
                router.push({
                  pathname: "/edit",
                  params: { projectId, taskId: id },
                });
              }}
              childrenCount={progress.total}
              completedChildrenCount={progress.completed}
            />
          );
        }}
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
  warningBanner: {
    backgroundColor: "#FFF3CD",
    padding: Utility.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: "#FFEBA0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
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
  selectorContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
});
