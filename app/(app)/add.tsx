import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { KeyboardAvoidingContainer } from "@/src/components/ui/KeyboardAvoidingContainer";
import { NumberInput } from "@/src/components/ui/NumberInput";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useAddTaskForm } from "@/src/hooks/useAddTaskForm";
import { LocationSelectionModal } from "@/src/components/LocationSelectionModal";
import { Image } from "expo-image";
import { useState } from "react";
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
    location,
    setLocation,
    isLocating,
    captureLocation,
    clearLocation,
    responsible,
    pickResponsible,
    clearResponsible,
    isFormValid,
    handleSave,
  } = useAddTaskForm();

  const [modalVisible, setModalVisible] = useState(false);

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

      <View style={styles.locationSection}>
        <View style={styles.locationButtonsRow}>
          <Button
            title={isLocating ? "Buscando..." : "Ubicación actual"}
            variant="outline"
            onPress={captureLocation}
            disabled={isLocating}
            style={styles.locationBtn}
          />
          <Button
            title="Seleccionar..."
            variant="outline"
            onPress={() => setModalVisible(true)}
            disabled={isLocating}
            style={styles.locationBtn}
          />
        </View>
        {location && (
          <View style={styles.locationPreview}>
            <Typography variant="body" style={styles.locationLabel}>
              📍 {location.label || "Ubicación seleccionada"}
            </Typography>
            <Typography variant="caption" style={styles.locationCoords}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Typography>
            <Button
              title="Quitar ubicación"
              variant="outline"
              onPress={clearLocation}
              style={styles.removeLocationBtn}
            />
          </View>
        )}
      </View>

      <View style={styles.responsibleSection}>
        <Button
          title={responsible ? "Cambiar responsable" : "Asignar responsable"}
          variant="outline"
          onPress={pickResponsible}
        />
        {responsible && (
          <View style={styles.responsiblePreview}>
            <Typography variant="body" style={styles.responsibleName}>
              👤 {responsible.name}
            </Typography>
            {responsible.phone && (
              <Typography variant="caption" style={styles.responsiblePhone}>
                📞 {responsible.phone}
              </Typography>
            )}
            {responsible.email && (
              <Typography variant="caption" style={styles.responsibleEmail}>
                ✉️ {responsible.email}
              </Typography>
            )}
            <Button
              title="Quitar responsable"
              variant="outline"
              onPress={clearResponsible}
              style={styles.removeResponsibleBtn}
            />
          </View>
        )}
      </View>

      <LocationSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={(lat, lon, label) => setLocation({ latitude: lat, longitude: lon, label })}
      />

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
  locationSection: {
    marginTop: Utility.spacing.l,
  },
  locationPreview: {
    marginTop: Utility.spacing.m,
    padding: Utility.spacing.m,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  locationLabel: {
    fontWeight: "600",
    color: "#1E293B",
  },
  locationCoords: {
    color: "#64748B",
    marginTop: Utility.spacing.xs,
  },
  removeLocationBtn: {
    marginTop: Utility.spacing.m,
  },
  locationButtonsRow: {
    flexDirection: "row",
    gap: Utility.spacing.s,
  },
  locationBtn: {
    flex: 1,
  },
  responsibleSection: {
    marginTop: Utility.spacing.l,
  },
  responsiblePreview: {
    marginTop: Utility.spacing.m,
    padding: Utility.spacing.m,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  responsibleName: {
    fontWeight: "600",
    color: "#1E293B",
  },
  responsiblePhone: {
    color: "#64748B",
    marginTop: Utility.spacing.xs,
  },
  responsibleEmail: {
    color: "#64748B",
    marginTop: Utility.spacing.xs,
  },
  removeResponsibleBtn: {
    marginTop: Utility.spacing.m,
  },
});
