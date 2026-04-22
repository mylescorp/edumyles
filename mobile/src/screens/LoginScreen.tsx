import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../hooks/useAuth";
import { theme } from "../theme";

const LoginScreen: React.FC = () => {
  const { signIn, checkSignInStatus, clearPendingSignIn, pendingAuthRequest, isLoading } =
    useAuth();
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const expiresInMinutes = useMemo(() => {
    if (!pendingAuthRequest) {
      return null;
    }
    const remainingMs = Math.max(0, pendingAuthRequest.expiresAt - Date.now());
    return Math.ceil(remainingMs / 60000);
  }, [pendingAuthRequest]);

  const handleLogin = async () => {
    try {
      const request = await signIn(email);
      setStatusMessage(
        "Open the browser window, finish sign-in, then return here. We’ll keep checking for approval."
      );
      await Linking.openURL(request.approvalUrl);
    } catch (error) {
      Alert.alert("Sign-in failed", error instanceof Error ? error.message : "Try again.");
    }
  };

  const handleStatusCheck = async () => {
    if (!pendingAuthRequest) {
      return;
    }

    try {
      setIsPolling(true);
      const status = await checkSignInStatus(pendingAuthRequest.requestId);

      if (status.status === "pending") {
        setStatusMessage(
          "Approval is still pending. Finish sign-in in the browser, then check again."
        );
        return;
      }

      if (status.status === "completed") {
        setStatusMessage("This device is now signed in.");
        return;
      }

      const message =
        status.status === "expired"
          ? "That mobile sign-in request expired. Start a new one to continue."
          : "That mobile sign-in request is no longer active. Start a new one to continue.";
      setStatusMessage(message);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "We could not confirm the sign-in yet."
      );
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    if (!pendingAuthRequest) {
      return;
    }

    let cancelled = false;
    const interval = setInterval(() => {
      void (async () => {
        try {
          const status = await checkSignInStatus(pendingAuthRequest.requestId);
          if (!cancelled && status.status === "pending") {
            setStatusMessage("Waiting for browser approval...");
          }
        } catch {
          if (!cancelled) {
            setStatusMessage("Still waiting for approval. You can also tap Check Status.");
          }
        }
      })();
    }, pendingAuthRequest.pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [checkSignInStatus, pendingAuthRequest]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>EM</Text>
          </View>
          <Text style={styles.title}>EduMyles Mobile</Text>
          <Text style={styles.subtitle}>
            Sign in with the same email you use on the web portal. We’ll open a secure browser
            window, let you finish approval there, and then connect this device automatically.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="student@school.edu"
            placeholderTextColor={theme.colors.textLight}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            disabled={isLoading}
            onPress={handleLogin}
            style={[styles.button, isLoading && styles.buttonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Continue In Browser</Text>
            )}
          </TouchableOpacity>

          {pendingAuthRequest ? (
            <View style={styles.approvalCard}>
              <Text style={styles.approvalTitle}>Finish sign-in in your browser</Text>
              <Text style={styles.approvalText}>
                Request ID: {pendingAuthRequest.requestId.slice(0, 10)}...
              </Text>
              <Text style={styles.approvalText}>
                Expires in about {expiresInMinutes ?? 0} minute{expiresInMinutes === 1 ? "" : "s"}.
              </Text>
              {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

              <TouchableOpacity
                disabled={isPolling}
                onPress={() => Linking.openURL(pendingAuthRequest.approvalUrl)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Open Browser Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isPolling}
                onPress={handleStatusCheck}
                style={[styles.secondaryButton, styles.checkButton]}
              >
                {isPolling ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Text style={[styles.secondaryButtonText, styles.checkButtonText]}>
                    Check Status
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isPolling}
                onPress={() => {
                  clearPendingSignIn();
                  setStatusMessage(null);
                }}
                style={styles.tertiaryButton}
              >
                <Text style={styles.tertiaryButtonText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff6ff",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  hero: {
    marginBottom: theme.spacing.xl,
    alignItems: "center",
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  logoText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.xxxl,
    fontFamily: theme.fonts.display,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xxxl,
    fontFamily: theme.fonts.display,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.base,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: theme.fonts.regular,
  },
  form: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.displayMedium,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.regular,
  },
  button: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.displayMedium,
  },
  approvalCard: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  approvalTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.displayMedium,
  },
  approvalText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
    fontFamily: theme.fonts.regular,
  },
  statusMessage: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.bodyMedium,
    lineHeight: 20,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: "#93c5fd",
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    backgroundColor: theme.colors.white,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.displayMedium,
  },
  checkButton: {
    borderColor: theme.colors.primary,
  },
  checkButtonText: {
    color: theme.colors.primary,
  },
  tertiaryButton: {
    alignItems: "center",
    paddingTop: theme.spacing.xs,
  },
  tertiaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.bodyMedium,
  },
});

export default LoginScreen;
