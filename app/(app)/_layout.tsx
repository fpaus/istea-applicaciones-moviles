import { useProject } from "@/src/hooks/useProject";
import { ProjectSelector } from "@/src/components/ProjectSelector";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppLayout() {
  const { isProjectSelected, loading } = useProject();
  const insets = useSafeAreaInsets();

  if (loading) return null;

  return (
    <Drawer
      screenOptions={{
        swipeEnabled: isProjectSelected,
      }}
      drawerContent={(props) => (
        <View style={styles.drawerContainer}>
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
          </DrawerContentScrollView>
          <View
            style={[
              styles.bottomContainer,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <ProjectSelector compact={true} />
          </View>
        </View>
      )}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Tablero",
          title: "Tablero",
          headerShown: isProjectSelected,
        }}
      />
      <Drawer.Screen
        name="add"
        options={{
          drawerItemStyle: { display: "none" }, // Hide from drawer
          title: "Agregar Tarea",
          headerShown: isProjectSelected,
        }}
      />
    </Drawer>
  );
}


const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
});
