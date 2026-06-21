import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { KeyboardAvoidingContainer } from "@/src/components/ui/KeyboardAvoidingContainer";
import { NumberInput } from "@/src/components/ui/NumberInput";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useAddTaskForm } from "@/src/hooks/useAddTaskForm";
import { Image } from "expo-image";
import {
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

export default function AddScreen() {
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
    imageUri,
    pickImage,
    removeImage,
    isFormValid,
    handleSave,
  } = useAddTaskForm();

  return (
    <KeyboardAvoidingContainer style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="h2" style={styles.title}>
          Crear Nueva Tarea
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

      <View style={styles.imageSection}>
        <Button
          title={imageUri ? "Cambiar imagen" : "Agregar imagen"}
          variant="outline"
          onPress={pickImage}
        />
        {imageUri && (
          <>
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              contentFit="cover"
            />
            <Button
              title="Quitar imagen"
              variant="outline"
              onPress={removeImage}
              style={styles.removeImageBtn}
            />
          </>
        )}
      </View>

      <Button
        title="Guardar Tarea"
        onPress={handleSave}
        style={styles.saveBtn}
        disabled={!isFormValid}
      />
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Utility.spacing.m,
    paddingBottom: Utility.spacing.xl,
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
  imageSection: {
    marginTop: Utility.spacing.l,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: Utility.spacing.m,
    backgroundColor: "#E2E8F0",
  },
  removeImageBtn: {
    marginTop: Utility.spacing.s,
  },
});
