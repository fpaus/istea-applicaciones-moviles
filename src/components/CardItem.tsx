import React from "react";
import { View, Switch, StyleSheet } from "react-native";
import { Card } from "@/src/components/ui/Card";
import { Typography } from "@/src/components/ui/Typography";
import { Button } from "@/src/components/ui/Button";
import { Colors, Utility } from "@/src/constants/theme";
import { Reminder } from "@/src/types";

interface CardItemProps {
  item: Reminder;
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
          {item.time
            ? item.repeats
              ? `Every day at ${item.time.hour.toString().padStart(2, "0")}:${item.time.minute.toString().padStart(2, "0")}`
              : `At ${item.time.hour.toString().padStart(2, "0")}:${item.time.minute.toString().padStart(2, "0")}`
            : (item as any).hour !== undefined
              ? `At ${(item as any).hour.toString().padStart(2, "0")}:${(item as any).minute.toString().padStart(2, "0")}`
              : "Unknown time"}
        </Typography>
        <Button
          title="Delete"
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
