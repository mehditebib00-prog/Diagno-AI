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
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Utilisation de la constante globale ou URL fixe locale de ton fichier d'origine
const API_URL = 'http://172.20.10.3:8085';

const { width } = Dimensions.get('window');

const tabs = ['home', 'meds', 'symptoms', 'account'] as const;
type TabType = typeof tabs[number];

type Patient = {
    id: string;
    name: string;
    email?: string;
    socialSecurity?: string;
};

interface Symptom {
    id: number;
    description: string;
    date?: string;
    patientId: number;
}

export default function DoctorDashboard() {
    const router = useRouter();

    const [tab, setTab] = useState<TabType>('home');
    const [photo, setPhoto] = useState<string | null>(null);
    const [doctorId, setDoctorId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState({
        fullName: 'Chargement...',
        specialty: 'Patientez...',
        hospital: 'Paris Hospital',
        phone: '+33 6 12 34 56 78',
    });

    const [searchName, setSearchName] = useState('');
    const [searchId, setSearchId] = useState('');
    const [patient, setPatient] = useState<Patient | null>(null);
    const [patientsList, setPatientsList] = useState<Patient[]>([]);
    const [symptomPatient, setSymptomPatient] = useState<Patient | null>(null);

    const [meds, setMeds] = useState<{ id: string; name: string; dosage: string; patientId?: number }[]>([]);
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);

    const [showSymptoms, setShowSymptoms] = useState(false);
    const [symptomType, setSymptomType] = useState<'new' | 'old'>('new');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // États dynamiques pour stocker le nombre de rdv réels de l'API
    const [appointmentsCount, setAppointmentsCount] = useState(0);

    const [medName, setMedName] = useState('');
    const [medDosage, setMedDosage] = useState('');
    const [medFrequency, setMedFrequency] = useState('');

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

    useEffect(() => {
        const loadDoctorProfile = async () => {
            try {
                setLoading(true);
                const savedEmail = await AsyncStorage.getItem('doctorEmail');

                if (!savedEmail) {
                    setProfile({
                        fullName: 'Médecin Connected',
                        specialty: 'Généraliste',
                        hospital: 'Hôpital Central',
                        phone: '+33 6 12 34 56 78',
                    });
                    return;
                }

                const response = await axios.get(`${API_URL}/api/doctors/profile?email=${encodeURIComponent(savedEmail)}`);

                if (response.data.id) setDoctorId(response.data.id);
                if (response.data.profilePicture) {
                    setPhoto(response.data.profilePicture);
                }

                setProfile({
                    fullName: response.data.name,
                    specialty: response.data.specialization || 'Généraliste',
                    hospital: response.data.hospital || 'Paris Hospital',
                    phone: response.data.phone || '+33 6 12 34 56 78',
                });

                // Récupération dynamique des rendez-vous réels du médecin
                if (response.data.name) {
                    fetchRealAppointments(response.data.name);
                }

            } catch (err) {
                console.error("Erreur lors du chargement du profil médecin:", err);
                setProfile({
                    fullName: 'Médecin (Mode Hors-ligne)',
                    specialty: 'Généraliste',
                    hospital: 'Hôpital Central',
                    phone: '+33 6 12 34 56 78',
                });
            } finally {
                setLoading(false);
            }
        };

        loadDoctorProfile();
    }, []);

    // Fonction pour charger et compter les rendez-vous réels depuis le backend
    const fetchRealAppointments = async (doctorName: string) => {
        try {
            const res = await axios.get(`${API_URL}/api/appointments/doctor/${encodeURIComponent(doctorName.trim())}`);
            if (res.data && Array.isArray(res.data)) {
                setAppointmentsCount(res.data.length);
            }
        } catch (e) {
            console.error("Erreur de récupération des rendez-vous pour les statistiques :", e);
        }
    };

    const handleSearch = async (showAll = false) => {
        if (!showAll && !searchName.trim() && !searchId.trim()) {
            Alert.alert("Erreur", "Veuillez entrer un Nom OU un ID pour lancer la recherche.");
            return;
        }

        try {
            let url = `${API_URL}/api/patients/search`;

            if (!showAll) {
                const queryParams = [];
                if (searchId.trim()) queryParams.push(`id=${searchId.trim()}`);
                if (searchName.trim()) queryParams.push(`name=${encodeURIComponent(searchName.trim())}`);
                url += `?${queryParams.join('&')}`;
            }

            const response = await axios.get(url);
            setPatientsList(response.data);

            if (response.data.length === 1) {
                const selectedPatient = response.data[0];
                setPatient(selectedPatient);
                setSymptomPatient(selectedPatient);

                const medsRes = await axios.get(`${API_URL}/api/medications/mobile/patient/${selectedPatient.id}`);
                setMeds(medsRes.data);

                const symptomsRes = await axios.get(`${API_URL}/api/symptoms/mobile/patient/${selectedPatient.id}`);
                setSymptoms(symptomsRes.data);
            } else {
                setPatient(null);
                setSymptomPatient(null);
                setMeds([]);
                setSymptoms([]);
            }

        } catch (err: any) {
            console.error("Erreur recherche:", err);
            setPatientsList([]);
            setPatient(null);
            setSymptomPatient(null);
            setMeds([]);
            setSymptoms([]);
            if (err.response && err.response.status === 404) {
                Alert.alert("Aucun résultat", "Aucun patient trouvé avec ces critères.");
            } else {
                Alert.alert("Erreur", "Impossible de se connecter au serveur.");
            }
        }
    };

    const handleAddMed = async () => {
        if (!medName || !medDosage || !medFrequency) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs du formulaire.");
            return;
        }
        if (!patient) return;

        try {
            const response = await axios.post(`${API_URL}/api/medications/mobile/add`, {
                name: medName,
                dosage: `${medDosage} (${medFrequency})`,
                patientId: parseInt(patient.id)
            });

            setMeds(prev => [...prev, response.data]);
            setMedName('');
            setMedDosage('');
            setMedFrequency('');
            setShowAddForm(false);
            Alert.alert("Succès", "Le médicament a bien été enregistré !");
        } catch (err) {
            console.error("Erreur ajout médicament:", err);
            Alert.alert("Erreur", "Impossible d'enregistrer la prescription.");
        }
    };

    const deleteMed = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/api/medications/mobile/delete/${id}`);
            setMeds((prev) => prev.filter((m) => m.id !== id));
            Alert.alert("Supprimé", "Le médicament a été retiré avec succès.");
        } catch (err) {
            console.error("Erreur suppression médicament:", err);
            Alert.alert("Erreur", "Impossible de supprimer la prescription.");
        }
    };

    const handleUpdateProfile = async () => {
        if (!doctorId) {
            Alert.alert("Erreur", "Impossible d'identifier votre profil.");
            return;
        }
        try {
            setIsSavingProfile(true);
            const savedEmail = await AsyncStorage.getItem('doctorEmail') || "";

            await axios.put(`${API_URL}/api/doctors/${doctorId}`, {
                id: doctorId,
                name: profile.fullName.trim(),
                email: savedEmail.trim(),
                specialization: profile.specialty.trim(),
                profilePicture: photo
            });

            setEditMode(false);
            Alert.alert("Succès", "Profil mis à jour avec succès ! ✨");
        } catch (err) {
            console.error("Erreur mise à jour profil médecin:", err);
            Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const resetMedsPage = () => {
        setSearchName('');
        setSearchId('');
        setPatient(null);
        setPatientsList([]);
        setMeds([]);
        setEditMode(false);
        setShowAddForm(false);
        setMedName('');
        setMedDosage('');
        setMedFrequency('');
    };

    const resetSymptomsPage = () => {
        setSearchName('');
        setSearchId('');
        setSymptomPatient(null);
        setPatientsList([]);
        setSymptoms([]);
        setShowSymptoms(false);
        setSymptomType('new');
    };

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

            if (!result.canceled && result.assets[0].base64 && doctorId) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setPhoto(base64Image);

                const savedEmail = await AsyncStorage.getItem('doctorEmail') || "";
                await axios.put(`${API_URL}/api/doctors/${doctorId}`, {
                    id: doctorId,
                    name: profile.fullName.trim(),
                    email: savedEmail.trim(),
                    specialization: profile.specialty.trim(),
                    profilePicture: base64Image
                });
                Alert.alert("Succès", "Photo de profil médecin enregistrée ! 📸");
            }
        } catch (error) {
            console.error("Erreur sauvegarde photo automatique médecin :", error);
            Alert.alert("Erreur", "Le serveur n'a pas pu valider la photo.");
        }
    };

    /* ================= HOME ================= */
    const renderHome = () => (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.greetingText}>Good day</Text>
                    <Text style={styles.subGreetingText}>Dr.{profile.fullName}</Text>
                </View>
                {photo && <Image source={{ uri: photo }} style={styles.miniAvatar} />}
            </View>

            <View style={styles.imageWrapper}>
                <Image
                    source={require('../../assets/images/docteur.jpeg')}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/MAppointment')}>
                <Ionicons name="calendar" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Gérer mon Planning / RDV</Text>
            </TouchableOpacity>

            {/* 📊 CARTES KPIS ULTRA FONCTIONNELLES & DESIGN UNIQUE */}
            <View style={styles.kpiGridRow}>
                <View style={styles.kpiMiniCard}>
                    <View style={[styles.kpiIconWrapper, { backgroundColor: 'rgba(14, 165, 233, 0.12)' }]}>
                        <Ionicons name="people" size={18} color="#0EA5E9" />
                    </View>
                    <Text style={styles.kpiValue}>{patientsList.length > 0 ? patientsList.length : '0'}</Text>
                    <Text style={styles.kpiLabel}>Patients Listed</Text>
                </View>

                <TouchableOpacity
                    style={styles.kpiMiniCard}
                    onPress={() => router.push('/MAppointment')}
                >
                    <View style={[styles.kpiIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                        <Ionicons name="time" size={18} color="#10B981" />
                    </View>
                    <Text style={styles.kpiValue}>{appointmentsCount}</Text>
                    <Text style={styles.kpiLabel}>Total Bookings</Text>
                </TouchableOpacity>
            </View>

            {/* LA CARTE DOUBLE UNIQUE ET DE COULEUR SIMPLE A ETE ENLEVEE ICI */}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>🏥 Clinical Activity</Text>
                <View style={styles.statsDivider} />
                <Text style={styles.cardText}>✔ Review patient symptoms logged</Text>
                <Text style={[styles.cardText, { marginTop: 4 }]}>✔ Monitor and adapt ongoing treatments</Text>
            </View>
        </ScrollView>
    );

    /* ================= MEDS ================= */
    const renderMeds = () => (
        <View style={styles.panelContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.panelTitle}>💊 Medications</Text>
                    <Text style={styles.panelSub}>Manage patient prescriptions easily</Text>
                </View>
                <TouchableOpacity onPress={resetMedsPage} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={18} color="#0EA5E9" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <TextInput placeholder="Patient name (Optional)" placeholderTextColor="#64748B" value={searchName} onChangeText={setSearchName} style={styles.searchInput} />
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="id-card-outline" size={18} color="#64748B" />
                <TextInput placeholder="Patient ID (Optional)" placeholderTextColor="#64748B" value={searchId} onChangeText={setSearchId} style={styles.searchInput} keyboardType="numeric" />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
                <TouchableOpacity onPress={() => handleSearch(false)} style={[styles.inlineSearchBtn, { backgroundColor: 'rgba(30, 41, 59, 0.6)' }]}>
                    <Text style={{ color: '#0EA5E9', fontWeight: '600', fontSize: 13 }}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSearch(true)} style={[styles.inlineSearchBtn, { backgroundColor: '#0EA5E9' }]}>
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>Show All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
                {patientsList.length > 0 && !patient && (
                    <Text style={styles.listSectionLabel}>Patients found ({patientsList.length}) : Tap to select</Text>
                )}

                {!patient && patientsList.map((p) => (
                    <TouchableOpacity
                        key={p.id}
                        onPress={async () => {
                            setPatient(p);
                            setSymptomPatient(p);
                            try {
                                const medsRes = await axios.get(`${API_URL}/api/medications/mobile/patient/${p.id}`);
                                setMeds(medsRes.data);
                                const symptomsRes = await axios.get(`${API_URL}/api/symptoms/mobile/patient/${p.id}`);
                                setSymptoms(symptomsRes.data);
                            } catch(e) {
                                console.error(e);
                            }
                        }}
                        style={styles.itemRowCard}
                    >
                        <View style={styles.medIconWrapper}>
                            <Ionicons name="person" size={16} color="#0EA5E9" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.itemMainName}>{p.name}</Text>
                            <Text style={styles.itemSubDetail}>Patient ID: {p.id}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#0EA5E9" />
                    </TouchableOpacity>
                ))}

                {patient && (
                    <>
                        <View style={[styles.itemRowCard, { borderColor: '#0EA5E9', backgroundColor: 'rgba(14, 165, 233, 0.05)' }]}>
                            <View style={[styles.medIconWrapper, { backgroundColor: '#0EA5E9' }]}>
                                <Ionicons name="person" size={16} color="white" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={styles.itemMainName}>{patient.name}</Text>
                                <Text style={styles.itemSubDetail}>Active Patient ID: {patient.id}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.smallActionBtn}>
                                <Ionicons name={editMode ? "eye-outline" : "create-outline"} size={16} color="#0EA5E9" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.listSectionLabel}>
                            {editMode ? "✏️ Edit Prescription Mode" : "📋 Current Medications"}
                        </Text>

                        {meds.length === 0 && (
                            <Text style={styles.emptyListText}>No registered treatment found for this patient.</Text>
                        )}

                        {meds.map((med) => (
                            <View key={med.id} style={styles.itemRowCard}>
                                <View style={styles.medIconWrapper}>
                                    <Ionicons name="medical" size={16} color="#0EA5E9" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Text style={styles.itemMainName}>{med.name}</Text>
                                    <Text style={styles.itemSubDetail}>{med.dosage}</Text>
                                </View>
                                {editMode && (
                                    <TouchableOpacity onPress={() => deleteMed(med.id)} style={[styles.smallActionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                                        <Ionicons name="trash-outline" size={16} color="#F87171" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {editMode && patient && (
                <TouchableOpacity style={styles.fabAdd} onPress={() => setShowAddForm(true)}>
                    <Ionicons name="add" size={26} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );

    /* ================= SYMPTOMS ================= */
    const renderSymptoms = () => (
        <View style={styles.panelContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.panelTitle}>🤒 Symptoms</Text>
                    <Text style={styles.panelSub}>Review symptoms reported by patients</Text>
                </View>
                <TouchableOpacity onPress={resetSymptomsPage} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={18} color="#0EA5E9" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <TextInput placeholder="Patient name (Optional)" placeholderTextColor="#64748B" value={searchName} onChangeText={setSearchName} style={styles.searchInput} />
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="id-card-outline" size={18} color="#64748B" />
                <TextInput placeholder="Patient ID (Optional)" placeholderTextColor="#64748B" value={searchId} onChangeText={setSearchId} style={styles.searchInput} keyboardType="numeric" />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
                <TouchableOpacity onPress={() => handleSearch(false)} style={[styles.inlineSearchBtn, { backgroundColor: 'rgba(30, 41, 59, 0.6)' }]}>
                    <Text style={{ color: '#0EA5E9', fontWeight: '600', fontSize: 13 }}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSearch(true)} style={[styles.inlineSearchBtn, { backgroundColor: '#0EA5E9' }]}>
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>Show All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
                {patientsList.length > 0 && !symptomPatient && (
                    <Text style={styles.listSectionLabel}>Patients found ({patientsList.length}) : Tap to view symptoms</Text>
                )}

                {!symptomPatient && patientsList.map((p) => (
                    <TouchableOpacity
                        key={p.id}
                        onPress={async () => {
                            setSymptomPatient(p);
                            setPatient(p);
                            try {
                                const symptomsRes = await axios.get(`${API_URL}/api/symptoms/mobile/patient/${p.id}`);
                                setSymptoms(symptomsRes.data);
                                const medsRes = await axios.get(`${API_URL}/api/medications/mobile/patient/${p.id}`);
                                setMeds(medsRes.data);
                            } catch(e) {
                                console.error(e);
                            }
                        }}
                        style={styles.itemRowCard}
                    >
                        <View style={styles.medIconWrapper}>
                            <Ionicons name="person" size={16} color="#0EA5E9" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.itemMainName}>{p.name}</Text>
                            <Text style={styles.itemSubDetail}>ID: {p.id}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#0EA5E9" />
                    </TouchableOpacity>
                ))}

                {symptomPatient && (
                    <>
                        <View style={[styles.itemRowCard, { borderColor: '#F87171', backgroundColor: 'rgba(239, 68, 68, 0.03)' }]}>
                            <View style={[styles.medIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                <Ionicons name="pulse" size={16} color="#F87171" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={styles.itemMainName}>{symptomPatient.name}</Text>
                                <Text style={styles.itemSubDetail}>ID: {symptomPatient.id}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowSymptoms(!showSymptoms)}>
                            <Text style={styles.dropdownBtnText}>View Symptoms Log</Text>
                            <Ionicons name={showSymptoms ? "chevron-up" : "chevron-down"} size={18} color="white" />
                        </TouchableOpacity>

                        {showSymptoms && (
                            <View style={{ marginTop: 12 }}>
                                <View style={styles.toggleRow}>
                                    <TouchableOpacity onPress={() => setSymptomType('new')} style={[styles.toggleTab, symptomType === 'new' && styles.toggleActive]}>
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>New</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setSymptomType('old')} style={[styles.toggleTab, symptomType === 'old' && styles.toggleActive]}>
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>History</Text>
                                    </TouchableOpacity>
                                </View>

                                {symptoms.length === 0 ? (
                                    <Text style={styles.emptyListText}>No symptoms declared by this patient in database.</Text>
                                ) : (
                                    symptoms.map((s) => (
                                        <View key={s.id} style={styles.itemRowCard}>
                                            <View style={[styles.medIconWrapper, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                                                <Ionicons name="alert-circle" size={18} color="#F87171" />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 14 }}>
                                                <Text style={styles.itemMainName}>{s.description}</Text>
                                                <Text style={styles.itemSubDetail}>
                                                    {s.date ? `Le ${new Date(s.date).toLocaleDateString()}` : 'Récemment enregistré'}
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );

    /* ================= ACCOUNT ================= */
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
                <Text style={styles.accountCardLabel}>🩺 Specialty</Text>
                {editMode ? (
                    <TextInput value={profile.specialty} onChangeText={(t) => setProfile({ ...profile, specialty: t })} style={styles.input} placeholderTextColor="#64748B" />
                ) : (
                    <Text style={styles.accountCardValue}>{profile.specialty}</Text>
                )}
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await AsyncStorage.removeItem('doctorEmail'); router.replace('/(tabs)/role'); }}>
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

            {/* Modal d'ajout de prescription au design premium épuré */}
            <Modal transparent visible={showAddForm} animationType="fade" onRequestClose={() => setShowAddForm(false)}>
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>➕ Add Medication</Text>

                        <TextInput placeholder="Medication Name" placeholderTextColor="#475569" value={medName} onChangeText={setMedName} style={styles.modalInput} />
                        <TextInput placeholder="Dosage (e.g. 1000mg, 1 tablet)" placeholderTextColor="#475569" value={medDosage} onChangeText={setMedDosage} style={styles.modalInput} />
                        <TextInput placeholder="Frequency (e.g. Morning, 3x/day)" placeholderTextColor="#475569" value={medFrequency} onChangeText={setMedFrequency} style={styles.modalInput} />

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowAddForm(false)}>
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleAddMed}>
                                <Text style={styles.modalBtnSaveText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Navigation Bar Premium floutée fléchée sur le Dashboard Patient */}
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
    greetingText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
    subGreetingText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: 2 },
    miniAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },

    // Hero Image Section
    imageWrapper: { width: '100%', height: 180, borderRadius: 24, overflow: 'hidden', marginVertical: 10, backgroundColor: '#131C2E' },
    heroImage: { width: '100%', height: '100%', opacity: 0.85 },

    // 📊 STYLES PREMIUM DES KPIS GRAPHIC CARD
    kpiGridRow: { flexDirection: 'row', gap: 14, marginBottom: 18, width: '100%' },
    kpiMiniCard: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    kpiIconWrapper: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    kpiValue: { color: 'white', fontSize: 20, fontWeight: '700' },
    kpiLabel: { color: '#64748B', fontSize: 12, marginTop: 2, fontWeight: '500' },

    // Glassmorphism Cards
    card: { backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
    cardText: { color: '#94A3B8', fontSize: 13, lineHeight: 20 },
    whiteHighlight: { color: '#FFFFFF', fontWeight: '600' },
    statsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },

    // Titles & Subtitles for Inner Panels
    panelTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
    panelSub: { color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 20 },
    listSectionLabel: { color: '#94A3B8', fontSize: 13, marginBottom: 12, marginTop: 14, fontWeight: '600' },
    emptyListText: { color: '#475569', fontStyle: 'italic', textAlign: 'center', marginTop: 25, fontSize: 13 },

    // Inputs et Recherche stylisés
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 16, paddingHorizontal: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', height: 48 },
    searchInput: { flex: 1, color: 'white', marginLeft: 10, fontSize: 14 },
    inlineSearchBtn: { flex: 1, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    refreshButton: { padding: 8, backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },

    // Dossiers Patients, Médicaments & Lignes
    itemRowCard: { backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    medIconWrapper: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center' },
    itemMainName: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
    itemSubDetail: { color: '#64748B', fontSize: 12, marginTop: 3 },
    smallActionBtn: { backgroundColor: 'rgba(14,165,233,0.1)', padding: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    // Dropdowns et toggles spécifiques
    dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: 14, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    dropdownBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
    toggleRow: { flexDirection: 'row', backgroundColor: '#090D16', borderRadius: 12, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    toggleTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    toggleActive: { backgroundColor: '#0EA5E9' },

    // Account & Profile Settings
    avatarContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(14, 165, 233, 0.08)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(14, 165, 233, 0.2)' },
    avatarImage: { width: '100%', height: '100%' },
    avatarChangeText: { color: '#0EA5E9', marginTop: 10, fontWeight: '500', fontSize: 12 },
    accountCardLabel: { color: '#64748B', fontSize: 12, fontWeight: '500', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    accountCardValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
    input: { backgroundColor: '#090D16', color: '#FFFFFF', padding: 12, borderRadius: 14, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', fontSize: 14 },

    // Buttons Styles
    primaryButton: { backgroundColor: '#0EA5E9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 18, marginBottom: 25, gap: 10 },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
    toggleEditBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 16, marginBottom: 24, borderWidth: 1, gap: 8 },
    btnNormal: { backgroundColor: 'rgba(14, 165, 233, 0.08)', borderColor: 'rgba(14, 165, 233, 0.2)' },
    btnEditing: { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' },
    toggleEditBtnText: { fontWeight: '600', fontSize: 13 },
    logoutBtn: { backgroundColor: '#EF4444', padding: 14, borderRadius: 18, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center' },
    logoutText: { color: 'white', fontWeight: '600', fontSize: 14 },

    // Floating Action Button
    fabAdd: { position: 'absolute', bottom: 115, right: 22, width: 54, height: 54, borderRadius: 27, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', elevation: 4 },

    // Modals Glass Design
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 22 },
    modalContent: { width: '100%', backgroundColor: '#1E293B', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    modalInput: { backgroundColor: '#090D16', color: '#FFFFFF', padding: 12, borderRadius: 14, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
    modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 16, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: 'rgba(255,255,255,0.05)' },
    modalBtnCancelText: { color: '#94A3B8', fontWeight: '600' },
    modalBtnSave: { backgroundColor: '#0EA5E9' },
    modalBtnSaveText: { color: '#FFFFFF', fontWeight: '600' },

    // Bottom Premium Navigation Bar
    navWrapper: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 70, borderRadius: 24, overflow: 'hidden', backgroundColor: 'transparent' },
    blurContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10 },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabIconAlign: { alignItems: 'center', justifyContent: 'center', gap: 4 },
    label: { fontSize: 11, color: '#64748B', fontWeight: '500' },
    active: { color: '#0EA5E9', fontWeight: '600' }
});