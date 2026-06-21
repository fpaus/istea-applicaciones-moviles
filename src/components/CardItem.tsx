import React from "react";
import { View, Switch, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Card } from "@/src/components/ui/Card";
import { Typography } from "@/src/components/ui/Typography";
import { Button } from "@/src/components/ui/Button";
import { Colors, Utility } from "@/src/constants/theme";
import { Task } from "@/src/types";

interface CardItemProps {
  item: Task;
  onMarkCompleted: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  /** When provided, the card body (title/description) opens the read-only detail. */
  onOpen?: (id: string) => void;
  childrenCount?: number;
  completedChildrenCount?: number;
}

export function CardItem({
  item,
  onMarkCompleted,
  onDelete,
  onEdit,
  onOpen,
  childrenCount,
  completedChildrenCount,
}: CardItemProps) {
  const body = (
    <>
      <View style={styles.cardHeader}>
        {item.imageUri && (
          <Image
            testID={`task-thumbnail-${item.id}`}
            source={{ uri: item.imageUri }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        )}
        <Typography variant="h3" style={styles.titleText}>
          {item.title}
        </Typography>
        <Switch
          value={item.completed}
          onValueChange={() => onMarkCompleted(item.id)}
          trackColor={{ true: Colors.light.primary }}
        />
      </View>
      <Typography variant="body" style={styles.description}>
        {item.description}
      </Typography>
      {item.location && (
        <View style={styles.locationIndicator}>
          <Typography variant="caption" style={styles.locationText}>
            📍 {item.location.label || `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`}
          </Typography>
        </View>
      )}
      {item.responsible && (
        <View style={styles.responsibleIndicator}>
          <Typography variant="caption" style={styles.responsibleText}>
            👤 {item.responsible.name}
          </Typography>
        </View>
      )}
      {childrenCount !== undefined && childrenCount > 0 && (
        <View style={styles.progressContainer}>
          <Typography variant="caption" style={styles.progressText}>
            Subtareas: {completedChildrenCount ?? 0} de {childrenCount} ({Math.round(((completedChildrenCount ?? 0) / childrenCount) * 100)}%)
          </Typography>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((completedChildrenCount ?? 0) / childrenCount) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}
    </>
  );

  return (
    <Card style={styles.card}>
      {onOpen ? (
        <Pressable
          testID={`task-card-body-${item.id}`}
          onPress={() => onOpen(item.id)}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
      <View style={styles.cardFooter}>
        {item.notification ? (
          <Typography variant="caption">
            {item.notification.repeats
              ? `Todos los días a las ${item.notification.time.hour.toString().padStart(2, "0")}:${item.notification.time.minute.toString().padStart(2, "0")}`
              : `A las ${item.notification.time.hour.toString().padStart(2, "0")}:${item.notification.time.minute.toString().padStart(2, "0")}`}
          </Typography>
        ) : (
          <View />
        )}
        <View style={styles.actionsContainer}>
          {onEdit && (
            <Button
              title="Editar"
              variant="outline"
              onPress={() => onEdit(item.id)}
              style={styles.editBtn}
            />
          )}
          <Button
            title="Eliminar"
            variant="outline"
            onPress={() => onDelete(item.id)}
            style={styles.deleteBtn}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Utility.spacing.m,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Utility.spacing.xs,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: Utility.spacing.s,
    backgroundColor: "#E2E8F0",
  },
  titleText: {
    flex: 1,
    marginRight: Utility.spacing.s,
  },
  description: {
    marginBottom: Utility.spacing.m,
  },
  progressContainer: {
    marginTop: Utility.spacing.s,
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
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: Utility.spacing.s,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  locationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Utility.spacing.m,
  },
  locationText: {
    color: "#64748B",
    fontSize: 12,
  },
  responsibleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Utility.spacing.m,
  },
  responsibleText: {
    color: "#64748B",
    fontSize: 12,
  },
});
