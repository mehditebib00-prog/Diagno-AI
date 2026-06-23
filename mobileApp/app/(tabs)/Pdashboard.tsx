import React, { useState, useRef, useEffect } from 'react';
import { Alert, ActivityIndicator, Modal } from 'react-native';
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

// Badge de statut épuré et professionnel
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'ACCEPTED':
            return (
                <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#34D399' }]}>Accepté</Text>
                </View>
            );
        case 'REFUSED':
            return (
                <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#F87171' }]}>Refusé</Text>
                </View>
            );
        default:
            return (
                <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#FBBF24' }]}>En attente</Text>
                </View>
            );
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
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [refreshingAppointments, setRefreshingAppointments] = useState(false);
    const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

    const [profile, setProfile] = useState({
        id: '',
        fullName: '',
        residence: 'Paris, France',
        phone: '+33 6 12 34 56 78',
        email: '',
        socialSecurity: '',
    });

    const [meds, setMeds] = useState<{ id: string; name: string; dosage: string }[]>([]);
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [symptomText, setSymptomText] = useState('');
    const [editingSymptomId, setEditingSymptomId] = useState<number | null>(null);

    const animValues = useRef(
        tabs.reduce((acc, t) => {
            acc[t] = new Animated.Value(1);
            return acc;
        }, {} as Record<TabType, Animated.Value>)
    ).current;

    const icons: Record<TabType, keyof typeof Ionicons.glyphMap> = {
        home: 'home-outline',
        meds: 'medical-outline',
        symptoms: 'pulse-outline',
        account: 'person-outline',
    };

    const refreshAppointmentsOnly = async (idToFetch = profile.id) => {
        if (!idToFetch) return;
        try {
            setRefreshingAppointments(true);
            const appointmentsResponse = await axios.get(`${API_URL}/api/appointments/patient/${idToFetch}`);
            setMyAppointments(appointmentsResponse.data);
        } catch (error) {
            console.error("Erreur lors de l'actualisation des rendez-vous :", error);
            Alert.alert("Erreur", "Impossible de rafraîchir les rendez-vous.");
        } finally {
            setRefreshingAppointments(false);
        }
    };

    const handleCancelAppointment = (id: number) => {
        Alert.alert(
            "Annuler le rendez-vous",
            "Êtes-vous sûr de vouloir annuler et supprimer ce rendez-vous ?",
            [
                { text: "Retour", style: "cancel" },
                {
                    text: "Oui, annuler",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/api/appointments/${id}`);
                            setMyAppointments(prev => prev.filter(appt => appt.id !== id));
                            Alert.alert("Succès", "Le rendez-vous a bien été annulé.");
                        } catch (error) {
                            console.error("Erreur lors de l'annulation du rendez-vous:", error);
                            Alert.alert("Erreur", "Impossible d'annuler le rendez-vous.");
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateProfile = async () => {
        if (!profile.fullName.trim() || !profile.email.trim()) {
            Alert.alert("Erreur", "Le nom et l'email ne peuvent pas être vides.");
            return;
        }

        try {
            setIsSavingProfile(true);

            await axios.put(`${API_URL}/api/patients/${profile.id}`, {
                id: parseInt(profile.id),
                name: profile.fullName.trim(),
                email: profile.email.trim(),
                socialSecurity: profile.socialSecurity,
                profilePicture: photo
            });

            await AsyncStorage.setItem('userEmail', profile.email.trim());
            setEditMode(false);
            Alert.alert("Succès", "Vos informations de compte ont été mises à jour ! ✨");
        } catch (error) {
            console.error("Erreur lors de la modification du compte :", error);
            Alert.alert("Erreur", "Impossible d'enregistrer les modifications sur le serveur.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                setLoading(true);
                // 1. Lire la clé
                const email = await AsyncStorage.getItem('userEmail');
                console.log("➡️ [Dashboard] E-mail récupéré dans AsyncStorage :", email);

                if (!email) {
                    console.error("❌ Aucun e-mail trouvé sous la clé 'userEmail' ! Redirection...");
                    router.replace('/(tabs)/role');
                    return;
                }

                // 2. Lancer la requête
                const url = `${API_URL}/api/patients/profile?email=${encodeURIComponent(email.trim())}`;
                console.log("📡 Envoi de la requête à :", url);

                const response = await axios.get(url);
                const found = response.data;
                console.log("🍏 Réponse brute reçue du backend :", found);

                if (found) {
                    setProfile({
                        id: found.id.toString(),
                        fullName: found.name, // Fait bien le lien avec 'name' du DTO
                        residence: 'Paris, France',
                        phone: '+33 6 12 34 56 78',
                        email: found.email,
                        socialSecurity: found.socialSecurity || 'Non renseigné',
                    });

                    if (found.profilePicture) {
                        setPhoto(found.profilePicture);
                    } else {
                        setPhoto(null);
                    }

                    // Chargements secondaires
                    const medsResponse = await axios.get(`${API_URL}/api/medications/mobile/patient/${found.id}`);
                    setMeds(medsResponse.data);

                    const symptomsResponse = await axios.get(`${API_URL}/api/symptoms/mobile/patient/${found.id}`);
                    setSymptoms(symptomsResponse.data);

                    const appointmentsResponse = await axios.get(`${API_URL}/api/appointments/patient/${found.id}`);
                    setMyAppointments(appointmentsResponse.data);
                } else {
                    Alert.alert("Erreur", "Données du profil introuvables.");
                }
            } catch (error: any) {
                console.error("❌ Erreur de récupération globale patient :", error?.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, []);

    const changeTab = (t: TabType) => {
        setTab(t);
        Animated.spring(animValues[t], {
            toValue: 1.15,
            useNativeDriver: true,
            friction: 6,
        }).start(() => {
            tabs.forEach((tabItem) => {
                if (tabItem !== t) animValues[tabItem].setValue(1);
            });
        });
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.4,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setPhoto(base64Image);

                const response = await axios.put(`${API_URL}/api/patients/${profile.id}`, {
                    id: parseInt(profile.id),
                    name: profile.fullName ? profile.fullName.trim() : "Patient",
                    email: profile.email ? profile.email.trim() : "",
                    socialSecurity: profile.socialSecurity || "",
                    profilePicture: base64Image
                });

                if (response.status === 200 || response.status === 204) {
                    Alert.alert("Succès", "Photo de profil enregistrée ! 📸");
                }
            }
        } catch (error: any) {
            console.error("❌ ERREUR DANS PICKIMAGE :", error);
            Alert.alert("Erreur", "Le serveur a refusé l'image.");
        }
    };

    const handleSaveSymptom = async () => {
        if (!symptomText.trim()) {
            Alert.alert("Erreur", "Veuillez décrire votre symptôme.");
            return;
        }

        try {
            if (editingSymptomId) {
                const response = await axios.put(`${API_URL}/api/symptoms/${editingSymptomId}`, {
                    description: symptomText.trim(),
                    patientId: parseInt(profile.id),
                    date: new Date().toISOString()
                });
                setSymptoms(prev => prev.map(s => s.id === editingSymptomId ? response.data : s));
                Alert.alert("Succès", "Votre symptôme a bien été modifié !");
            } else {
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
            Alert.alert("Erreur", "Impossible d'enregistrer les données.");
        }
    };

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

    const formatDateTime = (isoString: string) => {
        try {
            const dateObj = new Date(isoString);
            return `${dateObj.toLocaleDateString()} à ${isoString.split('T')[1].substring(0, 5)}`;
        } catch {
            return isoString;
        }
    };

    /* ================= Renders Panels ================= */
    const renderHome = () => (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.greetingText}>Hello</Text>
                    <Text style={styles.subGreetingText}>{profile.fullName}</Text>
                </View>
                {photo && (
                    <Image source={{ uri: photo }} style={styles.miniAvatar} />
                )}
            </View>

            <View style={styles.imageWrapper}>
                <Image
                    source={require('../../assets/images/docteur.jpeg')}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/Appointment')}>
                <Ionicons name="calendar" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Prendre un Rendez-vous</Text>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🗓️ Demandes de Rendez-vous</Text>
                <TouchableOpacity
                    onPress={() => refreshAppointmentsOnly()}
                    style={styles.refreshButton}
                    disabled={refreshingAppointments}
                >
                    {refreshingAppointments ? (
                        <ActivityIndicator size="small" color="#0EA5E9" />
                    ) : (
                        <Ionicons name="refresh" size={16} color="#0EA5E9" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
                {myAppointments.length === 0 ? (
                    <View style={[styles.card, styles.emptyCard]}>
                        <Text style={styles.emptyCardText}>
                            Aucun rendez-vous planifié pour le moment.
                        </Text>
                    </View>
                ) : (
                    myAppointments.map((appt) => (
                        <View key={appt.id} style={styles.card}>
                            <View style={styles.cardRowHeader}>
                                <Text style={styles.doctorNameText}>{appt.doctorName}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    {getStatusBadge(appt.status)}
                                    <TouchableOpacity onPress={() => handleCancelAppointment(appt.id)} style={styles.actionTrashIcon}>
                                        <Ionicons name="trash-outline" size={18} color="#F87171" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.timeContainer}>
                                <Ionicons name="time-outline" size={14} color="#0EA5E9" />
                                <Text style={styles.timeText}>{formatDateTime(appt.date)}</Text>
                            </View>

                            {appt.status === 'REFUSED' && appt.rejectionReason && (
                                <View style={styles.reasonContainer}>
                                    <Text style={styles.reasonTitle}>Motif du refus :</Text>
                                    <Text style={styles.reasonText}>{`"${appt.rejectionReason}"`}</Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 Health Status Overview</Text>
                <View style={styles.statsDivider} />
                <Text style={styles.cardText}>💊 Active treatments : <Text style={styles.whiteHighlight}>{meds.length}</Text></Text>
                <Text style={[styles.cardText, { marginTop: 4 }]}>🤒 Symptoms logged : <Text style={styles.whiteHighlight}>{symptoms.length}</Text></Text>
            </View>
        </ScrollView>
    );

    const renderMeds = () => (
        <View style={styles.panelContainer}>
            <Text style={styles.panelTitle}>📋 My Prescriptions</Text>
            <Text style={styles.panelSub}>List of treatments prescribed by your doctor</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                {meds.length === 0 ? (
                    <Text style={styles.emptyListText}>No treatment currently prescribed.</Text>
                ) : (
                    meds.map((med) => (
                        <View key={med.id} style={styles.itemRowCard}>
                            <View style={styles.medIconWrapper}>
                                <Ionicons name="medical" size={18} color="#0EA5E9" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={styles.itemMainName}>{med.name}</Text>
                                <Text style={styles.itemSubDetail}>{med.dosage}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );

    const renderSymptoms = () => (
        <View style={styles.panelContainer}>
            <Text style={styles.panelTitle}>🤒 Track Symptoms</Text>
            <Text style={styles.panelSub}>Declare or update your medical records</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                {symptoms.length === 0 ? (
                    <Text style={styles.emptyListText}>No symptoms declared yet.</Text>
                ) : (
                    symptoms.map((s) => (
                        <View key={s.id} style={styles.itemRowCard}>
                            <View style={[styles.medIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Ionicons name="alert-circle" size={18} color="#F87171" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={styles.itemMainName}>{s.description}</Text>
                                <Text style={styles.itemSubDetail}>
                                    {s.date ? `Declared: ${new Date(s.date).toLocaleDateString()}` : 'Recent'}
                                </Text>
                            </View>
                            <View style={styles.rowActionGroup}>
                                <TouchableOpacity onPress={() => { setEditingSymptomId(s.id); setSymptomText(s.description); setShowAddModal(true); }} style={styles.smallActionBtn}>
                                    <Ionicons name="create-outline" size={16} color="#0EA5E9" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteSymptom(s.id)} style={[styles.smallActionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                                    <Ionicons name="trash-outline" size={16} color="#F87171" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
            <TouchableOpacity style={styles.fabAdd} onPress={() => { setEditingSymptomId(null); setSymptomText(''); setShowAddModal(true); }}>
                <Ionicons name="add" size={26} color="white" />
            </TouchableOpacity>
        </View>
    );

    const renderAccount = () => (
        <ScrollView style={styles.panelContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                    {photo ? (
                        <Image source={{ uri: photo }} style={styles.avatarImage} />
                    ) : (
                        <Ionicons name="camera-outline" size={32} color="#0EA5E9" />
                    )}
                </TouchableOpacity>
                <Text style={styles.avatarChangeText}>Tap to change avatar</Text>
            </View>

            <TouchableOpacity
                style={[styles.toggleEditBtn, editMode ? styles.btnEditing : styles.btnNormal]}
                onPress={() => editMode ? handleUpdateProfile() : setEditMode(true)}
                disabled={isSavingProfile}
            >
                {isSavingProfile ? (
                    <ActivityIndicator size="small" color="#0EA5E9" />
                ) : (
                    <>
                        <Ionicons name={editMode ? "checkmark-circle-outline" : "create-outline"} size={18} color={editMode ? "#10B981" : "#0EA5E9"} />
                        <Text style={[styles.toggleEditBtnText, { color: editMode ? '#10B981' : '#0EA5E9' }]}>
                            {editMode ? "Save Changes" : "Edit Account Info"}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={styles.card}>
                <Text style={styles.accountCardLabel}>👤 Full Name</Text>
                {editMode ? (
                    <TextInput value={profile.fullName} onChangeText={(t) => setProfile({ ...profile, fullName: t })} style={styles.input} placeholderTextColor="#64748B" />
                ) : (
                    <Text style={styles.accountCardValue}>{profile.fullName}</Text>
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.accountCardLabel}>📧 Email Account</Text>
                {editMode ? (
                    <TextInput value={profile.email} onChangeText={(t) => setProfile({ ...profile, email: t })} style={styles.input} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#64748B" />
                ) : (
                    <Text style={styles.accountCardValue}>{profile.email}</Text>
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.accountCardLabel}>🧾 Social Security Number</Text>
                <Text style={styles.accountCardValue}>{profile.socialSecurity}</Text>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await AsyncStorage.removeItem('userEmail'); router.replace('/(tabs)/role'); }}>
                <Ionicons name="log-out-outline" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {tab === 'home' && renderHome()}
            {tab === 'meds' && renderMeds()}
            {tab === 'symptoms' && renderSymptoms()}
            {tab === 'account' && renderAccount()}

            {/* Modale d'ajout/modification de symptômes au design épuré */}
            <Modal transparent visible={showAddModal} animationType="fade" onRequestClose={() => setShowAddModal(false)}>
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingSymptomId ? 'Modifier le symptôme' : 'Déclarer un symptôme'}</Text>
                        <TextInput
                            style={styles.modalInput}
                            multiline
                            numberOfLines={4}
                            value={symptomText}
                            onChangeText={setSymptomText}
                            placeholder="Décrivez précisément ce que vous ressentez..."
                            placeholderTextColor="#475569"
                        />
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowAddModal(false)}>
                                <Text style={styles.modalBtnCancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSaveSymptom}>
                                <Text style={styles.modalBtnSaveText}>Confirmer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Navigation Bar premium et floutée */}
            <View style={styles.navWrapper}>
                <BlurView intensity={35} style={styles.blurContainer} tint="dark">
                    {tabs.map((t) => {
                        const isActive = tab === t;
                        return (
                            <TouchableOpacity key={t} onPress={() => changeTab(t)} style={styles.tab} activeOpacity={0.8}>
                                <Animated.View style={[{ transform: [{ scale: animValues[t] }] }, styles.tabIconAlign]}>
                                    <Ionicons name={isActive ? (icons[t].replace('-outline', '') as any) : icons[t]} size={20} color={isActive ? '#0EA5E9' : '#64748B'} />
                                    <Text style={[styles.label, isActive && styles.active]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    })}
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#090D16' },
    scrollContainer: { paddingHorizontal: 22, paddingTop: 60 },
    panelContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 22 },

    // Header & Greeting
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greetingText: { color: '#64748B', fontSize: 14, fontWeight: '500', letterSpacing: 0.5 },
    subGreetingText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: 2 },
    miniAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },

    // Hero Section
    imageWrapper: { width: '100%', height: 180, borderRadius: 24, overflow: 'hidden', marginVertical: 10, backgroundColor: '#131C2E' },
    heroImage: { width: '100%', height: '100%', opacity: 0.85 },

    // Cards Glassmorphism
    card: { backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
    cardText: { color: '#94A3B8', fontSize: 13, lineHeight: 20 },
    whiteHighlight: { color: '#FFFFFF', fontWeight: '600' },
    statsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
    emptyCard: { borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.2)', backgroundColor: 'transparent', padding: 25 },
    emptyCardText: { color: '#475569', fontStyle: 'italic', textAlign: 'center', fontSize: 13 },

    // List views
    panelTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
    panelSub: { color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 25 },
    emptyListText: { color: '#475569', fontStyle: 'italic', textAlign: 'center', marginTop: 40, fontSize: 14 },

    // Rows (Meds/Symptoms)
    itemRowCard: { backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    medIconWrapper: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center' },
    itemMainName: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
    itemSubDetail: { color: '#64748B', fontSize: 12, marginTop: 3 },
    rowActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    smallActionBtn: { backgroundColor: 'rgba(14,165,233,0.1)', padding: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    // Appointment specifics
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 10 },
    sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    refreshButton: { padding: 8, backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    cardRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    doctorNameText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
    timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    timeText: { color: '#64748B', fontSize: 12 },
    actionTrashIcon: { padding: 4 },

    // Badges
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '600' },
    reasonContainer: { backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: 12, borderRadius: 14, marginTop: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.12)', borderLeftWidth: 3, borderLeftColor: '#F87171' },
    reasonTitle: { color: '#F87171', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    reasonText: { color: '#CBD5E1', fontSize: 12, fontStyle: 'italic', marginTop: 3 },

    // Account details
    avatarContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(14, 165, 233, 0.08)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(14, 165, 233, 0.2)' },
    avatarImage: { width: '100%', height: '100%' },
    avatarChangeText: { color: '#0EA5E9', marginTop: 10, fontWeight: '500', fontSize: 12, letterSpacing: 0.2 },
    accountCardLabel: { color: '#64748B', fontSize: 12, fontWeight: '500', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    accountCardValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
    input: { backgroundColor: '#090D16', color: '#FFFFFF', padding: 12, borderRadius: 14, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', fontSize: 14 },

    // Buttons UI
    primaryButton: { backgroundColor: '#0EA5E9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 18, marginBottom: 25, gap: 10 },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
    toggleEditBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 16, marginBottom: 24, borderWidth: 1, gap: 8 },
    btnNormal: { backgroundColor: 'rgba(14, 165, 233, 0.08)', borderColor: 'rgba(14, 165, 233, 0.2)' },
    btnEditing: { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' },
    toggleEditBtnText: { fontWeight: '600', fontSize: 13 },
    logoutBtn: { backgroundColor: '#EF4444', padding: 14, borderRadius: 18, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center' },
    logoutText: { color: 'white', fontWeight: '600', fontSize: 14 },

    // Floating Action Button
    fabAdd: { position: 'absolute', bottom: 115, right: 22, width: 54, height: 54, borderRadius: 27, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 4, shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

    // Navigation bar glassmorphism
    navWrapper: { position: 'absolute', bottom: 26, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
    blurContainer: { flexDirection: 'row', width: isTabletOrDesktop ? 480 : '100%', borderRadius: 32, paddingVertical: 12, justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 12 },
    tab: { alignItems: 'center', flex: 1, paddingVertical: 4 },
    tabIconAlign: { alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: '500' },
    active: { color: '#0EA5E9', fontWeight: '600' },

    // Custom Modal styling
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { width: '100%', maxWidth: 400, backgroundColor: '#111827', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', elevation: 5 },
    modalTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    modalInput: { backgroundColor: '#090D16', color: 'white', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', textAlignVertical: 'top', fontSize: 14, marginBottom: 20 },
    modalActionRow: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    modalBtnCancelText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 },
    modalBtnSave: { backgroundColor: '#0EA5E9' },
    modalBtnSaveText: { color: 'white', fontWeight: '600', fontSize: 14 }
});