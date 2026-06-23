import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Ajuste l'adresse IP si nécessaire pour correspondre à ton réseau local
const API_URL = 'http://172.20.10.3:8085';

export default function DoctorLogin() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
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
        if (!email || !code) {
            setError('Please fill all fields');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Requête HTTP POST vers l'authentification Spring Boot
            const response = await axios.post(`${API_URL}/api/doctors/login`, {
                email: email,
                password: code
            });

            console.log('Connexion Médecin réussie ! Data:', response.data);

            if (response.data) {
                // 🚀 SAUVEGARDE SÉCURISÉE DES DONNÉES DU MÉDECIN CONNECTÉ
                await AsyncStorage.setItem('userEmail', response.data.email);
                await AsyncStorage.setItem('doctorEmail', response.data.email);
                await AsyncStorage.setItem('doctorName', response.data.name); // Stocke le vrai nom (ex: "Dr. Martin")
                await AsyncStorage.setItem('doctorId', response.data.id.toString()); // Stocke son ID unique
                await AsyncStorage.setItem('userRole', 'DOCTOR'); // Verrouille le rôle
            }

            setLoading(false);

            // Redirection vers le tableau de bord Médecin
            router.replace('/Mdashboard');

        } catch (err: any) {
            setLoading(false);
            if (err.response && err.response.data) {
                setError(err.response.data.message || 'Invalid credentials');
            } else {
                setError('Cannot connect to server. Please check your network.');
            }
        }
    };

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#CBD5F5" />
                </TouchableOpacity>

                <Text style={styles.title}>Doctor Access</Text>
            </View>

            <Text style={styles.subtitle}>Secure medical authentication</Text>

            {/* CARD */}
            <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY }] }]}>

                {/* INPUT EMAIL */}
                <View style={styles.input}>
                    <Ionicons name="mail-outline" size={18} color="#94A3B8" />
                    <TextInput
                        placeholder="Doctor Email"
                        placeholderTextColor="#94A3B8"
                        style={styles.inputTextField}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                {/* CODE / PASSWORD */}
                <View style={styles.input}>
                    <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
                    <TextInput
                        placeholder="Access Code / Password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        style={styles.inputTextField}
                        value={code}
                        onChangeText={setCode}
                    />
                </View>

                {/* ERROR */}
                {error !== '' && <Text style={styles.error}>{error}</Text>}

                {/* BUTTON */}
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.buttonText}>
                        {loading ? 'Connecting...' : 'Login'}
                    </Text>
                </TouchableOpacity>

            </Animated.View>

            {/* SECURITY */}
            <View style={styles.securityBox}>
                <Ionicons name="shield-checkmark" size={16} color="#38BDF8" />
                <Text style={styles.securityText}>
                    End-to-end encrypted medical authentication
                </Text>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B1220',
        padding: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 55
    },
    backBtn: {
        marginRight: 12
    },
    title: {
        fontSize: 28,
        color: 'white',
        fontWeight: '700'
    },
    subtitle: {
        color: '#94A3B8',
        marginTop: 6,
        marginBottom: 25
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 14,
        paddingVertical: 16,
        borderRadius: 14,
        marginBottom: 15
    },
    inputTextField: {
        flex: 1,
        color: 'white',
        marginLeft: 10
    },
    button: {
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15
    },
    error: {
        color: '#F87171',
        marginBottom: 10
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
        borderColor: 'rgba(56, 189, 248, 0.25)'
    },
    securityText: {
        marginLeft: 8,
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500'
    },
});