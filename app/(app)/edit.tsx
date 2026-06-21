import { CardItem } from "@/src/components/CardItem";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { KeyboardAvoidingContainer } from "@/src/components/ui/KeyboardAvoidingContainer";
import { NumberInput } from "@/src/components/ui/NumberInput";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useEditTaskForm } from "@/src/hooks/useEditTaskForm";
import { useTaskActions } from "@/src/hooks/useTaskActions";
import { useTaskCompletion } from "@/src/hooks/useTaskCompletion";
import { useTaskStore } from "@/src/stores/task-store";
import { Task } from "@/src/types";
import { LocationSelectionModal } from "@/src/components/LocationSelectionModal";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

const EMPTY_TASKS: Task[] = [];

interface SubtreeNodeProps {
  taskId: string;
  projectId: string;
  depth: number;
}

function SubtreeNode({ taskId, projectId, depth }: SubtreeNodeProps): React.JSX.Element | null {
  const projectTasks = useTaskStore(
    useCallback((s) => s.tasks[projectId] ?? EMPTY_TASKS, [projectId])
  );
  const { deleteTask } = useTaskActions();
  const { completeTask, reopenTask } = useTaskCompletion();
  const router = useRouter();

  const children = projectTasks.filter((t) => t.parentId === taskId);
  if (children.length === 0) return null;

  const cappedPadding = depth >= 3 ? 0 : 12;
  const showLine = depth < 3;

  return (
    <View
      style={[
        { paddingLeft: cappedPadding },
        showLine && {
          borderLeftWidth: 1.5,
          borderLeftColor: "#CBD5E1",
          marginLeft: 6,
        },
      ]}
    >
      {children.map((child) => {
        const childSubtasks = projectTasks.filter((t) => t.parentId === child.id);
        const childTotal = childSubtasks.length;
        const childCompleted = childSubtasks.filter((t) => t.completed).length;

        return (
          <View key={child.id} style={{ marginTop: 8 }}>
            <CardItem
              item={child}
              onMarkCompleted={child.completed ? reopenTask : completeTask}
              onDelete={deleteTask}
              onEdit={(id) => {
                router.push({
                  pathname: "/edit",
                  params: { projectId, taskId: id },
                });
              }}
              childrenCount={childTotal}
              completedChildrenCount={childCompleted}
            />
            <SubtreeNode taskId={child.id} projectId={projectId} depth={depth + 1} />
          </View>
        );
      })}
    </View>
  );
}

export default function EditScreen(): React.JSX.Element {
  const { projectId = "", taskId = "" } = useLocalSearchParams<{
    projectId: string;
    taskId: string;
  }>();

  const scrollViewRef = useRef<ScrollView>(null);

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
    isFormValid,
    handleSave,
  } = useEditTaskForm(projectId, taskId);

  const [modalVisible, setModalVisible] = useState(false);

  const projectTasks = useTaskStore(
    useCallback((s) => s.tasks[projectId] ?? EMPTY_TASKS, [projectId])
  );

  const directChildren = projectTasks.filter((t) => t.parentId === taskId);
  const totalChildren = directChildren.length;
  const completedChildren = directChildren.filter((t) => t.completed).length;

  // Local state for the subtask form
  const [subTitle, setSubTitle] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subHasReminder, setSubHasReminder] = useState(false);
  const [subHour, setSubHour] = useState<number | null>(null);
  const [subMinute, setSubMinute] = useState<number | null>(null);
  const [subRepeats, setSubRepeats] = useState(false);

  const { addTask } = useTaskActions();

  const isSubtaskFormValid =
    subTitle.trim().length > 0 &&
    (!subHasReminder || (subHour !== null && subMinute !== null));

  const handleAddSubtask = async (): Promise<void> => {
    if (!isSubtaskFormValid) return;

    await addTask({
      title: subTitle,
      description: subDesc,
      notification: subHasReminder && subHour !== null && subMinute !== null
        ? {
            time: { hour: subHour, minute: subMinute },
            repeats: subRepeats,
            notificationId: null,
          }
        : null,
      parentId: taskId,
    });

    // Reset Form
    setSubTitle("");
    setSubDesc("");
    setSubHasReminder(false);
    setSubHour(null);
    setSubMinute(null);
    setSubRepeats(false);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingContainer style={styles.flex}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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

      <LocationSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={(lat, lon, label) => setLocation({ latitude: lat, longitude: lon, label })}
      />

      <Button
        title="Guardar Cambios"
        onPress={handleSave}
        style={styles.saveBtn}
        disabled={!isFormValid}
      />

      {totalChildren > 0 && (
        <View style={styles.currentTaskProgress}>
          <Typography variant="caption" style={styles.progressText}>
            Progreso de subtareas directas: {completedChildren} de {totalChildren} ({Math.round((completedChildren / totalChildren) * 100)}%)
          </Typography>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(completedChildren / totalChildren) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.divider} />

      <Typography variant="h3" style={styles.sectionTitle}>
        Subtareas
      </Typography>

      <SubtreeNode taskId={taskId} projectId={projectId} depth={0} />

      <View style={styles.divider} />

      <Typography variant="h3" style={styles.sectionTitle}>
        Agregar Nueva Subtarea
      </Typography>

      <Input
        label="Título de Subtarea"
        placeholder="Ej.: Subtarea A"
        value={subTitle}
        onChangeText={setSubTitle}
      />

      <Input
        label="Descripción de Subtarea"
        placeholder="Detalles de la subtarea..."
        value={subDesc}
        onChangeText={setSubDesc}
      />

      <View style={styles.switchContainer}>
        <Typography variant="body">Agregar recordatorio a subtarea</Typography>
        <Switch
          value={subHasReminder}
          onValueChange={setSubHasReminder}
          trackColor={{ true: Colors.light.primary }}
        />
      </View>

      {subHasReminder && (
        <>
          <View style={styles.timeContainer}>
            <NumberInput
              label="Hora (0-23)"
              placeholder="ej.: 14"
              value={subHour}
              onChangeNumber={setSubHour}
              minValue={0}
              maxValue={23}
              style={styles.timeInput}
            />
            <NumberInput
              label="Minuto (0-59)"
              placeholder="ej.: 30"
              value={subMinute}
              onChangeNumber={setSubMinute}
              minValue={0}
              maxValue={59}
              style={styles.timeInput}
            />
          </View>

          <View style={styles.switchContainer}>
            <Typography variant="body">Repetir recordatorio subtarea</Typography>
            <Switch
              value={subRepeats}
              onValueChange={setSubRepeats}
              trackColor={{ true: Colors.light.primary }}
            />
          </View>
        </>
      )}

      <Button
        title="Agregar Subtarea"
        onPress={handleAddSubtask}
        style={styles.addSubtaskBtn}
        disabled={!isSubtaskFormValid}
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
  },
  title: {
    marginBottom: Utility.spacing.l,
  },
  saveBtn: {
    marginTop: Utility.spacing.l,
    marginBottom: Utility.spacing.m,
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
  currentTaskProgress: {
    marginTop: Utility.spacing.m,
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
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: Utility.spacing.l,
  },
  sectionTitle: {
    marginBottom: Utility.spacing.m,
  },
  addSubtaskBtn: {
    marginTop: Utility.spacing.l,
    marginBottom: Utility.spacing.xl,
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
});
