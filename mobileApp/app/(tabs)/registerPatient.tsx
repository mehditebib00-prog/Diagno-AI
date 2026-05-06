import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
export const options = {
  animation: 'fade_from_bottom',
};

export default function RegisterPatient() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [socialSecurity, setSocialSecurity] = useState('');
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

const handleRegister = () => {
  if (!name || !email || !password || !socialSecurity) {
    setError('Please fill all fields');
    return;
  }

  setError('');
  setLoading(true);

  setTimeout(() => {
    setLoading(false);
    router.replace('/(tabs)/Pdashboard');
  }, 800);
};

  const handleGoogle = () => {
    alert('Google signup (to integrate later)');
  };

  const handleApple = () => {
    alert('Apple signup (iPhone Sign-In)');
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#CBD5F5" />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
      </View>

      <Text style={styles.subtitle}>Patient registration</Text>

      {/* CARD */}
      <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY }] }]}>

        {/* NAME */}
        <View style={styles.input}>
          <Ionicons name="person-outline" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#94A3B8"
            style={styles.inputText}
            value={name}
            onChangeText={setName}
          />
        </View>
        {/* SOCIAL SECURITY */}
        <View style={styles.input}>
        <Ionicons name="card-outline" size={18} color="#94A3B8" />
        <TextInput
         placeholder="Social Security Number"
        placeholderTextColor="#94A3B8"
        style={styles.inputText}
         value={socialSecurity}
        onChangeText={setSocialSecurity}
        />
        </View>

        {/* EMAIL */}
        <View style={styles.input}>
          <Ionicons name="mail-outline" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            style={styles.inputText}
            value={email}
            onChangeText={setEmail}
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

        {/* REGISTER EMAIL */}
        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
          <Text style={styles.registerText}>Create account</Text>
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

        {/* LOGIN LINK */}
        <TouchableOpacity onPress={() => router.push('/patient')}>
          <Text style={styles.loginLink}>
            Already have an account? <Text style={styles.loginBold}>Login</Text>
          </Text>
        </TouchableOpacity>

      </Animated.View>

      {/* SECURITY */}
      <View style={styles.securityBox}>
        <Ionicons name="shield-checkmark" size={16} color="#38BDF8" />
        <Text style={styles.securityText}>
          Your data is encrypted and secure
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

  registerBtn: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },

  registerText: {
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

  loginLink: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
  },

  loginBold: {
    color: '#38BDF8',
    fontWeight: '700',
  },

  error: {
    color: '#F87171',
    marginBottom: 10,
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