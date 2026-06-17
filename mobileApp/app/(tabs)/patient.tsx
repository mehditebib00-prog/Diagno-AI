import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config';

export default function PatientLogin() {
  const router = useRouter();

  const [patientId, setPatientId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);



   const handleLogin = async () => {
  if (!patientId || !password) {
    setError('Please fill all fields');
    return;
  }

  try {
    setLoading(true);
    setError('');

    const response = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: patientId,
          password,
        }),
      }
    );

    const data = await response.json();

    console.log("STATUS:", response.status);
    console.log("DATA:", data);

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem(
      'profile',
      JSON.stringify({
        id: data.id,
        fullName: data.name,
        email: data.email,
      })
    );

    console.log("TOKEN:", data.token);

    router.replace('/(tabs)/Pdashboard');

  } catch (err: any) {
    setError(err.message || 'Unable to connect to server');
    console.error(err);
  } finally {
    setLoading(false);
  }
;
  };

  const handleGoogle = () => {
    alert('Google login (to integrate later)');
  };

  const handleApple = () => {
    alert('Apple login (iPhone Sign-In)');
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#CBD5F5" />
        </TouchableOpacity>

        <Text style={styles.title}>Patient Access</Text>
      </View>

      <Text style={styles.subtitle}>Secure medical authentication</Text>

      {/* CARD */}
      <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY }] }]}>

        {/* ID */}
        <View style={styles.input}>
          <Ionicons name="person-outline" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Patient ID / Email"
            placeholderTextColor="#94A3B8"
            style={styles.inputText}
            value={patientId}
            onChangeText={setPatientId}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.input}>
          <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            style={styles.inputText}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* ERROR */}
        {error !== '' && <Text style={styles.error}>{error}</Text>}

        {/* LOGIN */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>
            {loading ? 'Connecting...' : 'Login with Email'}
          </Text>
        </TouchableOpacity>

        {/* OR */}
        <Text style={styles.or}>OR</Text>

        {/* GOOGLE */}
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle}>
          <Ionicons name="logo-google" size={18} color="white" />
          <Text style={styles.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* APPLE */}
        <TouchableOpacity style={styles.appleBtn} onPress={handleApple}>
          <Ionicons name="logo-apple" size={20} color="white" />
          <Text style={styles.socialText}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* REGISTER */}
        <TouchableOpacity onPress={() => router.push('/registerPatient')}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerBold}>Create one</Text>
          </Text>
        </TouchableOpacity>

      </Animated.View>

      {/* SECURITY */}
      <View style={styles.securityBox}>
        <Ionicons name="shield-checkmark" size={16} color="#38BDF8" />
        <Text style={styles.securityText}>
          End-to-end encrypted patient authentication
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 55,
  },

  backBtn: {
    marginRight: 12,
  },

  title: {
    fontSize: 28,
    color: 'white',
    fontWeight: '700',
  },

  subtitle: {
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 25,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 15,
  },

  inputText: {
    flex: 1,
    color: 'white',
    marginLeft: 10,
  },

  loginBtn: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },

  loginText: {
    color: 'white',
    fontWeight: '600',
  },

  or: {
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 15,
  },

  googleBtn: {
    flexDirection: 'row',
    backgroundColor: '#DB4437',
    padding: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  appleBtn: {
    flexDirection: 'row',
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  socialText: {
    color: 'white',
    fontWeight: '600',
  },

  error: {
    color: '#F87171',
    marginBottom: 10,
  },

  registerText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
  },

  registerBold: {
    color: '#38BDF8',
    fontWeight: '700',
  },

  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },

  securityText: {
    marginLeft: 8,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
});