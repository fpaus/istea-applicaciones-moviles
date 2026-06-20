import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { NumberInput } from "@/src/components/ui/NumberInput";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useEditTaskForm } from "@/src/hooks/useEditTaskForm";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

export default function EditScreen() {
  const { projectId, taskId } = useLocalSearchParams<{
    projectId: string;
    taskId: string;
  }>();

  const {
    title,
    setTitle,
    description,
    setDescription,
    hasReminder,
    setHasReminder,
    hour,
    setHour,
    minute,
    setMinute,
    repeats,
    setRepeats,
    isFormValid,
    handleSave,
  } = useEditTaskForm(projectId || "", taskId || "");

  return (
    <ScrollView style={styles.container}>
      <Typography variant="h2" style={styles.title}>
        Editar Tarea
      </Typography>

      <Input
        label="Título"
        placeholder="Ej.: Tomar agua"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Descripción"
        placeholder="Detalles..."
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.switchContainer}>
        <Typography variant="body">Agregar recordatorio</Typography>
        <Switch
          value={hasReminder}
          onValueChange={setHasReminder}
          trackColor={{ true: Colors.light.primary }}
        />
      </View>

      {hasReminder && (
        <>
          <View style={styles.timeContainer}>
            <NumberInput
              label="Hora (0-23)"
              placeholder="ej.: 14"
              value={hour}
              onChangeNumber={setHour}
              minValue={0}
              maxValue={23}
              style={styles.timeInput}
            />
            <NumberInput
              label="Minuto (0-59)"
              placeholder="ej.: 30"
              value={minute}
              onChangeNumber={setMinute}
              minValue={0}
              maxValue={59}
              style={styles.timeInput}
            />
          </View>

          <View style={styles.switchContainer}>
            <Typography variant="body">Repetir a diario</Typography>
            <Switch
              value={repeats}
              onValueChange={setRepeats}
              trackColor={{ true: Colors.light.primary }}
            />
          </View>
        </>
      )}

      <Button
        title="Guardar Cambios"
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
