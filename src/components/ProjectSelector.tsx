import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useProjectSelector } from "../hooks/useProjectSelector";
import { Colors, Utility } from "../constants/theme";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Typography } from "./ui/Typography";
import { ProjectPickerModal } from "./ProjectPickerModal";

interface ProjectSelectorProps {
  compact?: boolean;
  onSelect?: (id: string) => void;
}

export function ProjectSelector({
  compact = false,
  onSelect,
}: ProjectSelectorProps) {
  const {
    currentProject,
    projects,
    hasProjects,
    isCreating,
    newProjectName,
    showDropdown,
    error,
    changeName,
    startCreating,
    cancelCreating,
    openDropdown,
    closeDropdown,
    handleCreate,
    handleSelect,
  } = useProjectSelector(onSelect);

  // If there are no projects, prompt creation of the first one
  if (!hasProjects) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Typography variant={compact ? "h3" : "h2"} style={styles.title}>
          {compact ? "Nuevo Proyecto" : "Comienza creando un proyecto"}
        </Typography>
        <Typography variant="caption" style={styles.subtitle}>
          Crea un proyecto para empezar a organizar tus tareas.
        </Typography>
        <Input
          placeholder="Nombre del proyecto"
          value={newProjectName}
          onChangeText={changeName}
          error={error}
          autoFocus={!compact}
        />
        <Button
          title="Crear Proyecto"
          onPress={handleCreate}
          disabled={newProjectName.trim() === ""}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!compact && (
        <Typography variant="h2" style={styles.title}>
          Selecciona tu proyecto
        </Typography>
      )}

      {/* Dropdown Activator */}
      <TouchableOpacity
        style={[styles.dropdownTrigger, compact && styles.compactTrigger]}
        onPress={openDropdown}
      >
        <View style={styles.triggerContent}>
          <Text style={styles.triggerText}>
            {currentProject ? currentProject.name : "Seleccione un proyecto..."}
          </Text>
          <Text style={styles.arrow}>▼</Text>
        </View>
      </TouchableOpacity>

      {/* Inline Create Toggle */}
      {!isCreating ? (
        <TouchableOpacity style={styles.toggleCreateBtn} onPress={startCreating}>
          <Text style={styles.toggleCreateText}>+ Nuevo proyecto</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.createForm}>
          <Input
            placeholder="Nombre del proyecto"
            value={newProjectName}
            onChangeText={changeName}
            error={error}
            style={styles.createInput}
          />
          <View style={styles.formActions}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={cancelCreating}
              style={styles.formBtn}
            />
            <Button
              title="Crear"
              onPress={handleCreate}
              disabled={newProjectName.trim() === ""}
              style={styles.formBtn}
            />
          </View>
        </View>
      )}

      {/* Picker Modal Dropdown (shared, list-only) */}
      <ProjectPickerModal
        visible={showDropdown}
        projects={projects}
        currentId={currentProject?.id}
        onSelect={handleSelect}
        onClose={closeDropdown}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Utility.spacing.m,
  },
  compactContainer: {
    padding: 0,
  },
  title: {
    textAlign: "center",
    marginBottom: Utility.spacing.s,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Utility.spacing.l,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Utility.borderRadius.s,
    paddingHorizontal: Utility.spacing.m,
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
    marginBottom: Utility.spacing.m,
  },
  compactTrigger: {
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
  },
  triggerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  triggerText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: "500",
  },
  arrow: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  toggleCreateBtn: {
    alignItems: "center",
    paddingVertical: Utility.spacing.xs,
  },
  toggleCreateText: {
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  createForm: {
    marginTop: Utility.spacing.s,
    gap: Utility.spacing.s,
  },
  createInput: {
    marginBottom: 0,
  },
  formActions: {
    flexDirection: "row",
    gap: Utility.spacing.m,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 10,
  },
});
