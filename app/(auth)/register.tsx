import { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { useAuth } from "@/src/hooks/useAuth";
import { Typography } from "@/src/components/ui/Typography";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { Utility, Colors } from "@/src/constants/theme";
import { useRouter } from "expo-router";

export default function Register() {
  const { register, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleRegister = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Error", "Please fill out all fields.");
        return;
      }
      await register({ email, password });
      await login({ email, password });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h1" style={styles.title}>
        Create Account
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
          title="Register" 
          onPress={handleRegister} 
          style={styles.button}
          disabled={!isFormValid}
        />
        <Button 
          title="Back to login" 
          variant="outline"
          onPress={() => router.back()} 
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
    marginTop: Utility.spacing.s,
  },
});
