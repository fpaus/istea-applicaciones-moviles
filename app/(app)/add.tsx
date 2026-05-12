import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { NumberInput } from "@/src/components/ui/NumberInput";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useReminders } from "@/src/hooks/useReminders";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

export default function AddScreen() {
  const { addReminder } = useReminders();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hour, setHour] = useState<number | null>(null);
  const [minute, setMinute] = useState<number | null>(null);
  const [repeats, setRepeats] = useState(false);

  const isFormValid = title.trim() !== "" && hour !== null && minute !== null;

  const handleSave = async () => {
    await addReminder({
      title,
      description,
      time: {
        hour: hour!,
        minute: minute!,
      },
      repeats,
    });

    setTitle("");
    setDescription("");
    setHour(null);
    setMinute(null);
    setRepeats(false);

    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Typography variant="h2" style={styles.title}>
        Create New Task
      </Typography>

      <Input
        label="Title"
        placeholder="E.g., Drink Water"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Description"
        placeholder="Details..."
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.timeContainer}>
        <NumberInput
          label="Hour (0-23)"
          placeholder="e.g., 14"
          value={hour}
          onChangeNumber={setHour}
          minValue={0}
          maxValue={23}
          style={styles.timeInput}
        />
        <NumberInput
          label="Minute (0-59)"
          placeholder="e.g., 30"
          value={minute}
          onChangeNumber={setMinute}
          minValue={0}
          maxValue={59}
          style={styles.timeInput}
        />
      </View>

      <View style={styles.switchContainer}>
        <Typography variant="body">Repeat Daily</Typography>
        <Switch
          value={repeats}
          onValueChange={setRepeats}
          trackColor={{ true: Colors.light.primary }}
        />
      </View>

      <Button
        title="Save Reminder"
        onPress={handleSave}
        style={styles.saveBtn}
        disabled={!isFormValid}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Utility.spacing.m,
    backgroundColor: Colors.light.background,
  },
  title: {
    marginBottom: Utility.spacing.l,
  },
  saveBtn: {
    marginTop: Utility.spacing.l,
    marginBottom: Utility.spacing.xl,
  },
  timeContainer: {
    flexDirection: "row",
    gap: Utility.spacing.m,
  },
  timeInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Utility.spacing.m,
  },
});
