import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useTaskCompletion } from "@/src/hooks/useTaskCompletion";
import { useTaskDetail } from "@/src/hooks/useTaskDetail";
import { Task } from "@/src/types";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";

function formatReminder(notification: NonNullable<Task["notification"]>): string {
  const hh = notification.time.hour.toString().padStart(2, "0");
  const mm = notification.time.minute.toString().padStart(2, "0");
  return notification.repeats
    ? `Todos los días a las ${hh}:${mm}`
    : `A las ${hh}:${mm}`;
}

export default function DetailScreen(): React.JSX.Element {
  const { projectId = "", taskId = "" } = useLocalSearchParams<{
    projectId: string;
    taskId: string;
  }>();

  const { task, notFound, subtasks, progress, goToEdit, openSubtask } =
    useTaskDetail(projectId, taskId);
  const { completeTask, reopenTask } = useTaskCompletion();

  if (notFound || !task) {
    return (
      <View style={styles.notFoundContainer}>
        <Typography variant="body" style={styles.notFoundText}>
          Tarea no encontrada
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>
        {task.title}
      </Typography>

      {task.description.trim() !== "" && (
        <Typography variant="body" style={styles.description}>
          {task.description}
        </Typography>
      )}

      <Card style={styles.metaCard}>
        <Typography variant="caption" style={styles.metaLabel}>
          Estado
        </Typography>
        <Typography variant="body">
          {task.completed ? "Completada" : "Activa"}
        </Typography>
      </Card>

      <Card style={styles.metaCard}>
        <Typography variant="caption" style={styles.metaLabel}>
          Recordatorio
        </Typography>
        <Typography variant="body">
          {task.notification ? formatReminder(task.notification) : "Sin recordatorio"}
        </Typography>
      </Card>

      {progress.total > 0 && (
        <View style={styles.progressContainer}>
          <Typography variant="caption" style={styles.progressText}>
            Subtareas: {progress.completed} de {progress.total} ({Math.round((progress.completed / progress.total) * 100)}%)
          </Typography>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(progress.completed / progress.total) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {subtasks.length > 0 && (
        <View style={styles.subtasksSection}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Subtareas
          </Typography>
          {subtasks.map((sub) => (
            <Pressable
              key={sub.id}
              testID={`detail-subtask-${sub.id}`}
              onPress={() => openSubtask(sub.id)}
            >
              <Card style={styles.subtaskCard}>
                <Typography variant="body" style={styles.subtaskTitle}>
                  {sub.title}
                </Typography>
                <Switch
                  testID={`subtask-toggle-${sub.id}`}
                  value={sub.completed}
                  onValueChange={() =>
                    sub.completed ? reopenTask(sub.id) : completeTask(sub.id)
                  }
                  trackColor={{ true: Colors.light.primary }}
                />
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <Button title="Editar" onPress={goToEdit} style={styles.editBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Utility.spacing.m,
  },
  title: {
    marginBottom: Utility.spacing.s,
  },
  description: {
    marginBottom: Utility.spacing.m,
  },
  metaCard: {
    marginBottom: Utility.spacing.m,
  },
  metaLabel: {
    color: "#666",
    marginBottom: Utility.spacing.xs,
  },
  progressContainer: {
    marginBottom: Utility.spacing.m,
  },
  progressText: {
    color: "#666",
    marginBottom: Utility.spacing.xs,
    fontSize: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  subtasksSection: {
    marginBottom: Utility.spacing.m,
  },
  sectionTitle: {
    marginBottom: Utility.spacing.s,
  },
  subtaskCard: {
    marginBottom: Utility.spacing.s,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtaskTitle: {
    flex: 1,
    marginRight: Utility.spacing.s,
  },
  editBtn: {
    marginTop: Utility.spacing.m,
    marginBottom: Utility.spacing.xl,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    padding: Utility.spacing.l,
  },
  notFoundText: {
    color: "#666",
  },
});
