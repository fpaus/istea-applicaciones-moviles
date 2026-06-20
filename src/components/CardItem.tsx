import React from "react";
import { View, Switch, StyleSheet } from "react-native";
import { Card } from "@/src/components/ui/Card";
import { Typography } from "@/src/components/ui/Typography";
import { Button } from "@/src/components/ui/Button";
import { Colors, Utility } from "@/src/constants/theme";
import { Task } from "@/src/types";

interface CardItemProps {
  item: Task;
  onMarkCompleted: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CardItem({ item, onMarkCompleted, onDelete }: CardItemProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Typography variant="h3">{item.title}</Typography>
        {!item.completed && (
          <Switch
            value={item.completed}
            onValueChange={() => onMarkCompleted(item.id)}
            trackColor={{ true: Colors.light.primary }}
          />
        )}
      </View>
      <Typography variant="body" style={styles.description}>
        {item.description}
      </Typography>
      <View style={styles.cardFooter}>
        <Typography variant="caption">
          {item.repeats
            ? `Todos los días a las ${item.time.hour.toString().padStart(2, "0")}:${item.time.minute.toString().padStart(2, "0")}`
            : `A las ${item.time.hour.toString().padStart(2, "0")}:${item.time.minute.toString().padStart(2, "0")}`}
        </Typography>
        <Button
          title="Eliminar"
          variant="outline"
          onPress={() => onDelete(item.id)}
          style={styles.deleteBtn}
        />
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
  description: {
    marginBottom: Utility.spacing.m,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
