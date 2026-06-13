import React, { useState, useRef, useEffect } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Image,
    ScrollView,
    TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/api';

// Fonction d'affichage du badge de statut (placée correctement ici en haut)
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'ACCEPTED':
            return <Text style={{ color: '#10B981', fontWeight: 'bold' }}>✅ Accepté</Text>;
        case 'REFUSED':
            return <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>❌ Refusé</Text>;
        default:
            return <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>⏳ En attente</Text>;
    }
};

const { width } = Dimensions.get('window');
const isTabletOrDesktop = width >= 768;

const tabs = ['home', 'meds', 'symptoms', 'account'] as const;
type TabType = typeof tabs[number];

interface Symptom {
    id: number;
    description: string;
    date?: string;
    patientId: number;
}

// Interface pour typer proprement les rendez-vous
interface Appointment {
    id: number;
    date: string;
    doctorName: string;
    patientId: number;
    status: string;
    rejectionReason?: string;
}

export default function PatientDashboard() {
    const router = useRouter();

    const [tab, setTab] = useState<TabType>('home');
    const [photo, setPhoto] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

    // Profil synchronisé avec la base de données
    const [profile, setProfile] = useState({
        id: '',
        fullName: '',
        residence: 'Paris, France',
        phone: '+33 6 00 00 00 00',
        email: '',
        socialSecurity: '',
    });

    // Listes de données réelles MySQL
    const [meds, setMeds] = useState<{ id: string; name: string; dosage: string }[]>([]);
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);

    // États pour la gestion de la fenêtre modale des symptômes (Ajout / Modification)
    const [showAddModal, setShowAddModal] = useState(false);
    const [symptomText, setSymptomText] = useState('');
    const [editingSymptomId, setEditingSymptomId] = useState<number | null>(null);

    // Système d'animation pour la barre de navigation basse
    const animValues = useRef(
        tabs.reduce((acc, t) => {
            acc[t] = new Animated.Value(1);
            return acc;
        }, {} as Record<TabType, Animated.Value>)
    ).current;

    const icons: Record<TabType, keyof typeof Ionicons.glyphMap> = {
        home: 'home',
        meds: 'medical',
        symptoms: 'pulse',
        account: 'person',
    };

    // Chargement initial des données de l'utilisateur connecté
    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                setLoading(true);
                const email = await AsyncStorage.getItem('userEmail');
                if (!email) {
                    router.replace('/(tabs)/role');
                    return;
                }

                console.log("Patient - Recherche du compte pour :", email);
                const response = await axios.get(`${API_URL}/api/patients/search?name=&id=`);
                const found = response.data.find((p: any) => p.email === email);

                if (found) {
                    setProfile({
                        id: found.id.toString(),
                        fullName: found.name,
                        residence: 'Paris, France',
                        phone: '+33 6 12 34 56 78',
                        email: found.email,
                        socialSecurity: found.socialSecurity,
                    });

                    // 1. Récupération des médicaments associés
                    const medsResponse = await axios.get(`${API_URL}/api/medications/mobile/patient/${found.id}`);
                    setMeds(medsResponse.data);

                    // 2. Récupération des symptômes associés
                    const symptomsResponse = await axios.get(`${API_URL}/api/symptoms/mobile/patient/${found.id}`);
                    setSymptoms(symptomsResponse.data);

                    // 3. 🚀 AJOUT : Récupération des vrais rendez-vous du patient depuis l'API
                    const appointmentsResponse = await axios.get(`${API_URL}/api/appointments/patient/${found.id}`);
                    setMyAppointments(appointmentsResponse.data);
                } else {
                    Alert.alert("Erreur", "Données du profil introuvables.");
                }
            } catch (error) {
                console.error("Erreur de récupération globale patient :", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, []);

    const changeTab = (t: TabType) => {
        setTab(t);
        Animated.spring(animValues[t], {
            toValue: 1.25,
            useNativeDriver: true,
            friction: 6,
        }).start(() => {
            tabs.forEach((tabItem) => {
                if (tabItem !== t) animValues[tabItem].setValue(1);
            });
        });
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) setPhoto(result.assets[0].uri);
    };

    // Enregistrer ou modifier un symptôme dans la base de données
    const handleSaveSymptom = async () => {
        if (!symptomText.trim()) {
            Alert.alert("Erreur", "Veuillez décrire votre symptôme.");
            return;
        }

        try {
            if (editingSymptomId) {
                console.log("Modification du symptôme ID:", editingSymptomId);
                const response = await axios.put(`${API_URL}/api/symptoms/${editingSymptomId}`, {
                    description: symptomText.trim(),
                    patientId: parseInt(profile.id),
                    date: new Date().toISOString()
                });

                setSymptoms(prev => prev.map(s => s.id === editingSymptomId ? response.data : s));
                Alert.alert("Succès", "Votre symptôme a bien été modifié !");
            } else {
                console.log("Ajout d'un nouveau symptôme");
                const response = await axios.post(`${API_URL}/api/symptoms`, {
                    description: symptomText.trim(),
                    patientId: parseInt(profile.id),
                    date: new Date().toISOString()
                });

                setSymptoms(prev => [response.data, ...prev]);
                Alert.alert("Succès", "Votre symptôme a bien été enregistré !");
            }

            setSymptomText('');
            setEditingSymptomId(null);
            setShowAddModal(false);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du symptôme :", error);
            Alert.alert("Erreur", "Impossible d'enregistrer les données sur le serveur.");
        }
    };

    // Supprimer un symptôme de MySQL
    const deleteSymptom = async (id: number) => {
        try {
            await axios.delete(`${API_URL}/api/symptoms/${id}`);
            setSymptoms(prev => prev.filter(s => s.id !== id));
            Alert.alert("Succès", "Symptôme supprimé de votre dossier.");
        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
            Alert.alert("Erreur", "Impossible de supprimer ce symptôme.");
        }
    };

    // Fonction utilitaire pour rendre la date lisible
    const formatDateTime = (isoString: string) => {
        try {
            const dateObj = new Date(isoString);
            return `${dateObj.toLocaleDateString()} à ${isoString.split('T')[1].substring(0, 5)}`;
        } catch {
            return isoString;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#38BDF8" />
            </View>
        );
    }

    /* ================= HOME ================= */
    const renderHome = () => (
        <ScrollView style={{ padding: 20, paddingTop: 60 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Hello 👋</Text>
            <Text style={{ color: '#94A3B8', marginTop: 5 }}>Welcome back, {profile.fullName}</Text>

            <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Image
                    source={require('../../assets/images/docteur.jpeg')}
                    style={{ width: '100%', height: 200, borderRadius: 15 }}
                    resizeMode="cover"
                />
            </View>

            {/* 🗓️ BOUTON POUR REJOINDRE L'ÉCRAN DE PRISE DE RENDEZ-VOUS */}
            <TouchableOpacity
                style={{
                    backgroundColor: '#38BDF8',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 20,
                    gap: 10,
                    elevation: 3,
                    shadowColor: '#38BDF8',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 5
                }}
                onPress={() => router.push('/Appointment')}
            >
                <Ionicons name="calendar" size={22} color="white" />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Prendre un Rendez-vous</Text>
            </TouchableOpacity>

            {/* 🚀 DEBUT DE LA SECTION : MES DEMANDES DE RENDEZ-VOUS */}
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 5 }}>
                🗓️ Vos Demandes de Rendez-vous
            </Text>

            <View style={{ marginBottom: 20 }}>
                {myAppointments.length === 0 ? (
                    <View style={[styles.card, { borderStyle: 'dashed' }]}>
                        <Text style={{ color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                            Aucun rendez-vous planifié pour le moment.
                        </Text>
                    </View>
                ) : (
                    myAppointments.map((appt) => (
                        <View key={appt.id} style={styles.card}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                                    {appt.doctorName}
                                </Text>
                                {getStatusBadge(appt.status)}
                            </View>

                            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 5, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="time-outline" size={13} color="#38BDF8" /> {formatDateTime(appt.date)}
                            </Text>

                            {/* Affichage du message si le médecin refuse le rdv */}
                            {appt.status === 'REFUSED' && appt.rejectionReason && (
                                <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
                                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Motif du refus :</Text>
                                    <Text style={{ color: '#E2E8F0', fontSize: 13, fontStyle: 'italic', marginTop: 2 }}>"{appt.rejectionReason}"</Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </View>
            {/* 🚀 FIN DE LA SECTION RENDEZ-VOUS */}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 Health Status Overview</Text>
                <Text style={styles.cardText}>💊 Treatments active: {meds.length}{"\n"}🤒 Registered Symptoms: {symptoms.length}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>💡 Medical Recommendation</Text>
                <Text style={styles.cardText}>Remember to register any new symptom regularly to keep your doctor informed in real time.</Text>
            </View>
        </ScrollView>
    );

    /* ================= MEDS ================= */
    const renderMeds = () => (
        <View style={styles.medsContainer}>
            <Text style={styles.homeTitle}>📋 My Prescriptions</Text>
            <Text style={styles.homeSub}>List of treatments prescribed by your doctor</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                {meds.length === 0 ? (
                    <Text style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                        No treatment currently prescribed.
                    </Text>
                ) : (
                    meds.map((med) => (
                        <View key={med.id} style={styles.cardRow}>
                            <View style={styles.medIcon}>
                                <Ionicons name="medical" size={20} color="#38BDF8" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>{med.name}</Text>
                                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{med.dosage}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );

    /* ================= SYMPTOMS ================= */
    const renderSymptoms = () => (
        <View style={styles.medsContainer}>
            <Text style={styles.homeTitle}>🤒 Track Symptoms</Text>
            <Text style={styles.homeSub}>Declare or update your medical records</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                {symptoms.length === 0 ? (
                    <Text style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                        No symptoms declared yet.
                    </Text>
                ) : (
                    symptoms.map((s) => (
                        <View key={s.id} style={styles.cardRow}>
                            <View style={[styles.medIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>{s.description}</Text>
                                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                                    {s.date ? `Declared: ${new Date(s.date).toLocaleDateString()}` : 'Recent'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setEditingSymptomId(s.id);
                                    setSymptomText(s.description);
                                    setShowAddModal(true);
                                }}
                                style={[styles.editSmallBtn, { marginRight: 8 }]}
                            >
                                <Ionicons name="create-outline" size={16} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => deleteSymptom(s.id)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Bouton FAB d'Ajout */}
            <View style={styles.fabAdd}>
                <TouchableOpacity
                    onPress={() => {
                        setEditingSymptomId(null);
                        setSymptomText('');
                        setShowAddModal(true);
                    }}
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                >
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            </View>

            {/* Fenêtre Modale d'Ajout / Édition */}
            {showAddModal && (
                <View style={styles.modal}>
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>
                            {editingSymptomId ? '✏️ Update Symptom' : '➕ Declare Symptom'}
                        </Text>

                        <TextInput
                            placeholder="Describe what you feel (e.g. Sharp headache, High fever...)"
                            placeholderTextColor="#94A3B8"
                            value={symptomText}
                            onChangeText={setSymptomText}
                            style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                            multiline={true}
                        />

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowAddModal(false);
                                    setEditingSymptomId(null);
                                    setSymptomText('');
                                }}
                                style={styles.cancelBtn}
                            >
                                <Text style={{ color: 'white', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveSymptom} style={styles.saveBtn}>
                                <Text style={{ color: 'white', fontWeight: '600' }}>
                                    {editingSymptomId ? 'Save' : 'Add'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

    /* ================= ACCOUNT ================= */
    const renderAccount = () => (
        <ScrollView style={{ flex: 1, paddingTop: 60, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center', marginVertical: 25 }}>
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} /> : <Ionicons name="camera" size={28} color="#0B1220" />}
                </View>
                <Text style={{ color: '#38BDF8', marginTop: 10, fontWeight: '600', fontSize: 13 }}>Tap to change photo</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>👤 Full Name</Text>
                {editMode ? <TextInput value={profile.fullName} onChangeText={(t) => setProfile({ ...profile, fullName: t })} style={styles.input} /> : <Text style={styles.cardText}>{profile.fullName}</Text>}
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>🧾 Social Security Number</Text>
                <Text style={styles.cardText}>{profile.socialSecurity}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>📧 Email Account</Text>
                <Text style={styles.cardText}>{profile.email}</Text>
            </View>

            <TouchableOpacity
                style={{ backgroundColor: '#EF4444', padding: 14, borderRadius: 16, alignItems: 'center', marginTop: 20 }}
                onPress={async () => {
                    await AsyncStorage.removeItem('userEmail');
                    router.replace('/(tabs)/role');
                }}
            >
                <Text style={{ color: 'white', fontWeight: '700' }}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {tab === 'home' && renderHome()}
            {tab === 'meds' && renderMeds()}
            {tab === 'symptoms' && renderSymptoms()}
            {tab === 'account' && renderAccount()}

            {/* Navigation basse */}
            <View style={styles.navWrapper}>
                <BlurView intensity={30} style={styles.blurContainer}>
                    {tabs.map((t) => {
                        const isActive = tab === t;
                        return (
                            <TouchableOpacity key={t} onPress={() => changeTab(t)} style={styles.tab} activeOpacity={0.7}>
                                <Animated.View style={{ transform: [{ scale: animValues[t] }] }}>
                                    <Ionicons name={icons[t]} size={22} color={isActive ? '#38BDF8' : '#94A3B8'} />
                                </Animated.View>
                                <Text style={[styles.label, isActive && styles.active]}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1220' },
    card: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    cardTitle: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 8 },
    cardText: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },
    input: { backgroundColor: '#0F172A', color: 'white', padding: 12, borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    homeTitle: { color: 'white', fontSize: 24, fontWeight: '700' },
    homeSub: { color: '#94A3B8', fontSize: 13, marginTop: 4, marginBottom: 25 },
    cardRow: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    medsContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    medIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(56,189,248,0.15)', justifyContent: 'center', alignItems: 'center' },
    editSmallBtn: { backgroundColor: '#38BDF8', padding: 10, borderRadius: 10 },
    deleteBtn: { backgroundColor: '#EF4444', padding: 10, borderRadius: 10 },
    fabAdd: { position: 'absolute', bottom: 110, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    modal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 99 },
    formCard: { width: isTabletOrDesktop ? 400 : '85%', backgroundColor: '#0F172A', padding: 20, borderRadius: 20 },
    formTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 15 },
    formInput: { backgroundColor: '#0B1220', color: 'white', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    cancelBtn: { flex: 1, backgroundColor: '#EF4444', padding: 12, borderRadius: 10, alignItems: 'center' },
    saveBtn: { flex: 1, backgroundColor: '#38BDF8', padding: 12, borderRadius: 10, alignItems: 'center' },
    navWrapper: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
    blurContainer: { flexDirection: 'row', width: isTabletOrDesktop ? 500 : '92%', borderRadius: 38, paddingVertical: 16, justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
    tab: { alignItems: 'center', flex: 1 },
    label: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
    active: { color: '#38BDF8', fontWeight: '700' },
});