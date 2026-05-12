import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Typography } from "@/src/components/ui/Typography";
import { Colors, Utility } from "@/src/constants/theme";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async () => {
    try {
      await login({
        email,
        password,
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h1" style={styles.title}>
        Login to your account
      </Typography>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          style={styles.button}
          disabled={!isFormValid}
        />
        <Typography style={styles.tooltip}>
          Don't have an account yet?
        </Typography>
        <Button
          title="Create an account"
          variant="outline"
          onPress={() => router.push("/register")}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Utility.spacing.l,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: Utility.spacing.xl * 2,
  },
  form: {
    gap: Utility.spacing.m,
  },
  button: {
    marginTop: 0,
  },
  tooltip: {
    textAlign: "center",
    marginTop: Utility.spacing.s,
    marginBottom: 0,
    fontSize: 14,
  },
});
