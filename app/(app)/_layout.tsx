import { useProject } from "@/src/hooks/useProject";
import { HeaderProjectSwitcher } from "@/src/components/HeaderProjectSwitcher";
import { Stack } from "expo-router";

export default function AppLayout() {
  const { isProjectSelected, loading } = useProject();

  if (loading) return null;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: isProjectSelected,
          headerTitle: () => <HeaderProjectSwitcher />,
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: "Agregar Tarea",
          headerBackTitle: "Volver",
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          title: "Detalle de Tarea",
          headerBackTitle: "Volver",
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: "Editar Tarea",
          headerBackTitle: "Volver",
        }}
      />
    </Stack>
  );
}
