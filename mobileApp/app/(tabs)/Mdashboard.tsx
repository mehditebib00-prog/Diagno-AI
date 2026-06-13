import React, { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
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

const API_URL = 'http://172.20.10.3:8085';

const { width, height } = Dimensions.get('window');
const isTabletOrDesktop = width >= 768;

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

    const [medName, setMedName] = useState('');
    const [medDosage, setMedDosage] = useState('');
    const [medFrequency, setMedFrequency] = useState('');

    useEffect(() => {
        const loadDoctorProfile = async () => {
            try {
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

                console.log("Demande de profil pour le médecin :", savedEmail);
                const response = await axios.get(`${API_URL}/api/doctors/profile?email=${encodeURIComponent(savedEmail)}`);

                setProfile({
                    fullName: response.data.name,
                    specialty: response.data.specialization || 'Généraliste',
                    hospital: response.data.hospital || 'Paris Hospital',
                    phone: response.data.phone || '+33 6 12 34 56 78',
                });

            } catch (err) {
                console.error("Erreur lors du chargement du profil médecin:", err);
                setProfile({
                    fullName: 'Médecin (Mode Hors-ligne)',
                    specialty: 'Généraliste',
                    hospital: 'Hôpital Central',
                    phone: '+33 6 12 34 56 78',
                });
            }
        };

        loadDoctorProfile();
    }, []);

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

            console.log("Appel API recherche :", url);
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
            console.log("Envoi du nouveau médicament en BDD pour le patient ID:", patient.id);

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
            console.log("Suppression en cours du médicament ID:", id);
            await axios.delete(`${API_URL}/api/medications/mobile/delete/${id}`);

            setMeds((prev) => prev.filter((m) => m.id !== id));
            Alert.alert("Supprimé", "Le médicament a été retiré avec succès de la base de données.");
        } catch (err) {
            console.error("Erreur suppression médicament:", err);
            Alert.alert("Erreur", "Impossible de supprimer la prescription.");
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

    /* ================= HOME ================= */
    const renderHome = () => (
        <ScrollView style={{ padding: 20, paddingTop: 60 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Good day 👋</Text>
            <Text style={{ color: '#94A3B8', marginTop: 5 }}>Welcome back, Dr. {profile.fullName}</Text>

            <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Image
                    source={require('../../assets/images/docteur.jpeg')}
                    style={{ width: '100%', height: 200, borderRadius: 15 }}
                    resizeMode="cover"
                />
            </View>

            {/* 📅 BOUTON AJOUTÉ POUR OUVRIR LE PLANNING SANS TOUCHER AU DESIGN */}
            <TouchableOpacity
                style={styles.planningLinkBtn}
                onPress={() => router.push('/MAppointment')}
            >
                <Ionicons name="calendar" size={20} color="white" />
                <Text style={styles.planningLinkText}>Gérer mon Planning / RDV</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 Today Overview</Text>
                <Text style={styles.cardText}>👥 Patients today: 12{"\n"}📅 Appointments: 5</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>🏥 Clinical Activity</Text>
                <Text style={styles.cardText}>✔ Review patient symptoms{"\n"}✔ Monitor ongoing treatments</Text>
            </View>
        </ScrollView>
    );

    /* ================= ACCOUNT ================= */
    const renderAccount = () => (
        <ScrollView style={styles.accountContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <TouchableOpacity onPress={pickImage} style={styles.profileBox}>
                <View style={styles.avatar}>
                    {photo ? <Image source={{ uri: photo }} style={styles.avatarImg} /> : <Ionicons name="camera" size={28} color="#0B1220" />}
                </View>
                <Text style={styles.changePhoto}>Tap to change photo</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>👤 Full Name</Text>
                {editMode ? <TextInput value={profile.fullName} onChangeText={(t) => setProfile({ ...profile, fullName: t })} style={styles.input} /> : <Text style={styles.cardText}>{profile.fullName}</Text>}
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>🩺 Specialty</Text>
                {editMode ? <TextInput value={profile.specialty} onChangeText={(t) => setProfile({ ...profile, specialty: t })} style={styles.input} /> : <Text style={styles.cardText}>{profile.specialty}</Text>}
            </View>

            <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(!editMode)}>
                <Text style={styles.editText}>{editMode ? 'Save Changes' : 'Edit Information'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    /* ================= MEDS ================= */
    const renderMeds = () => (
        <View style={styles.medsContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.homeTitle}>💊 Medications</Text>
                    <Text style={styles.homeSub}>Manage patient prescriptions easily</Text>
                </View>
                <TouchableOpacity onPress={resetMedsPage} style={styles.resetBtn}>
                    <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" />
                <TextInput placeholder="Patient name (Optional)" placeholderTextColor="#94A3B8" value={searchName} onChangeText={setSearchName} style={styles.searchInput} />
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="id-card-outline" size={18} color="#94A3B8" />
                <TextInput placeholder="Patient ID (Optional)" placeholderTextColor="#94A3B8" value={searchId} onChangeText={searchId => setSearchId(searchId)} style={styles.searchInput} keyboardType="numeric" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                <TouchableOpacity onPress={() => handleSearch(false)} style={[styles.searchBtn, { flex: 1, marginBottom: 0 }]}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSearch(true)} style={[styles.searchBtn, { flex: 1, marginBottom: 0, backgroundColor: '#0EA5E9' }]}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Show All Patients</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
                {patientsList.length > 0 && !patient && (
                    <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 10, fontWeight: '600' }}>
                        Patients found ({patientsList.length}) : Tap one to select
                    </Text>
                )}

                {!patient && patientsList.map((p) => (
                    <TouchableOpacity
                        key={p.id}
                        onPress={async () => {
                            setPatient(p);
                            setSymptomPatient(p);
                            try {
                                console.log("Chargement des médicaments pour le patient sélectionné:", p.id);
                                const medsRes = await axios.get(`${API_URL}/api/medications/mobile/patient/${p.id}`);
                                setMeds(medsRes.data);

                                const symptomsRes = await axios.get(`${API_URL}/api/symptoms/mobile/patient/${p.id}`);
                                setSymptoms(symptomsRes.data);
                            } catch(e) {
                                console.error("Erreur chargement données liste:", e);
                            }
                        }}
                        style={styles.patientCard}
                    >
                        <View>
                            <Text style={styles.patientName}>{p.name}</Text>
                            <Text style={styles.patientId}>ID: {p.id}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#38BDF8" />
                    </TouchableOpacity>
                ))}

                {patient && (
                    <>
                        <View style={[styles.patientCard, { backgroundColor: 'rgba(56,189,248,0.12)', borderColor: '#38BDF8' }]}>
                            <View>
                                <Text style={styles.patientName}>{patient.name}</Text>
                                <Text style={styles.patientId}>ID: {patient.id}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.editSmallBtn}>
                                <Ionicons name={editMode ? "eye-outline" : "create-outline"} size={16} color="white" />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: 'white', fontSize: 15, fontWeight: '600', marginBottom: 12, marginTop: 5 }}>
                            {editMode ? "✏️ Edit Prescription Mode" : "📋 Current Medications"}
                        </Text>

                        {meds.length === 0 && (
                            <Text style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', paddingLeft: 5 }}>No registered treatment found for this patient.</Text>
                        )}

                        {meds.map((med) => (
                            <View key={med.id} style={styles.medCard}>
                                <View style={styles.medIcon}><Ionicons name="medical" size={20} color="#38BDF8" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.medName}>{med.name}</Text>
                                    <Text style={styles.medInfo}>{med.dosage}</Text>
                                </View>
                                {editMode && (
                                    <TouchableOpacity onPress={() => deleteMed(med.id)} style={styles.deleteBtn}>
                                        <Ionicons name="trash-outline" size={18} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {editMode && patient && (
                <View style={styles.addContainer}>
                    <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.addBtn}>
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {showAddForm && (
                <View style={styles.modal}>
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>➕ Add Medication</Text>
                        <TextInput placeholder="Medication Name" placeholderTextColor="#94A3B8" value={medName} onChangeText={setMedName} style={styles.formInput} />
                        <TextInput placeholder="Dosage (e.g. 1000mg, 1 tablet)" placeholderTextColor="#94A3B8" value={medDosage} onChangeText={setMedDosage} style={styles.formInput} />
                        <TextInput placeholder="Frequency (e.g. Morning, 3x/day)" placeholderTextColor="#94A3B8" value={medFrequency} onChangeText={setMedFrequency} style={styles.formInput} />

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.cancelBtn}>
                                <Text style={{ color: 'white', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddMed} style={styles.saveBtn}>
                                <Text style={{ color: 'white', fontWeight: '600' }}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

    /* ================= SYMPTOMS ================= */
    const renderSymptoms = () => (
        <View style={styles.medsContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.homeTitle}>🤒 Symptoms</Text>
                    <Text style={styles.homeSub}>Review symptoms reported by patients</Text>
                </View>
                <TouchableOpacity onPress={resetSymptomsPage} style={styles.resetBtn}>
                    <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" />
                <TextInput placeholder="Patient name (Optional)" placeholderTextColor="#94A3B8" value={searchName} onChangeText={setSearchName} style={styles.searchInput} />
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="id-card-outline" size={18} color="#94A3B8" />
                <TextInput placeholder="Patient ID (Optional)" placeholderTextColor="#94A3B8" value={searchId} onChangeText={searchId => setSearchId(searchId)} style={styles.searchInput} keyboardType="numeric" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                <TouchableOpacity onPress={() => handleSearch(false)} style={[styles.searchBtn, { flex: 1, marginBottom: 0 }]}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSearch(true)} style={[styles.searchBtn, { flex: 1, marginBottom: 0, backgroundColor: '#0EA5E9' }]}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Show All Patients</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
                {patientsList.length > 0 && !symptomPatient && (
                    <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 10, fontWeight: '600' }}>
                        Patients found ({patientsList.length}) : Tap one to view symptoms
                    </Text>
                )}

                {!symptomPatient && patientsList.map((p) => (
                    <TouchableOpacity
                        key={p.id}
                        onPress={async () => {
                            setSymptomPatient(p);
                            setPatient(p);
                            try {
                                console.log("Chargement des symptômes réels pour le patient:", p.id);
                                const symptomsRes = await axios.get(`${API_URL}/api/symptoms/mobile/patient/${p.id}`);
                                setSymptoms(symptomsRes.data);

                                const medsRes = await axios.get(`${API_URL}/api/medications/mobile/patient/${p.id}`);
                                setMeds(medsRes.data);
                            } catch(e) {
                                console.error("Erreur chargement symptômes:", e);
                            }
                        }}
                        style={styles.patientCard}
                    >
                        <View>
                            <Text style={styles.patientName}>{p.name}</Text>
                            <Text style={styles.patientId}>ID: {p.id}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#38BDF8" />
                    </TouchableOpacity>
                ))}

                {symptomPatient && (
                    <>
                        <View style={[styles.patientCard, { backgroundColor: 'rgba(56,189,248,0.12)', borderColor: '#38BDF8' }]}>
                            <View>
                                <Text style={styles.patientName}>{symptomPatient.name}</Text>
                                <Text style={styles.patientId}>ID: {symptomPatient.id}</Text>
                            </View>
                            <Ionicons name="pulse" size={20} color="#EF4444" />
                        </View>

                        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowSymptoms(!showSymptoms)}>
                            <Text style={styles.dropdownBtnText}>View Symptoms Log</Text>
                            <Ionicons name={showSymptoms ? "chevron-up" : "chevron-down"} size={20} color="white" />
                        </TouchableOpacity>

                        {showSymptoms && (
                            <View style={{ marginTop: 10 }}>
                                <View style={styles.toggleRow}>
                                    <TouchableOpacity onPress={() => setSymptomType('new')} style={[styles.toggleTab, symptomType === 'new' && styles.toggleActive]}>
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>New</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setSymptomType('old')} style={[styles.toggleTab, symptomType === 'old' && styles.toggleActive]}>
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>History</Text>
                                    </TouchableOpacity>
                                </View>

                                {symptoms.length === 0 ? (
                                    <Text style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', paddingLeft: 5, marginTop: 10 }}>
                                        No symptoms declared by this patient in database.
                                    </Text>
                                ) : (
                                    symptoms.map((s) => (
                                        <View key={s.id} style={styles.medCard}>
                                            <View style={[styles.medIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                                                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.medName}>{s.description}</Text>
                                                <Text style={styles.medInfo}>
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

    return (
        <View style={styles.container}>
            {tab === 'home' && renderHome()}
            {tab === 'meds' && renderMeds()}
            {tab === 'symptoms' && renderSymptoms()}
            {tab === 'account' && renderAccount()}

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
    accountContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    profileBox: { alignItems: 'center', marginVertical: 25 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    changePhoto: { color: '#38BDF8', marginTop: 10, fontWeight: '600', fontSize: 13 },
    input: { backgroundColor: '#0F172A', color: 'white', padding: 12, borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    editBtn: { backgroundColor: 'transparent', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#38BDF8', marginTop: 10 },
    editText: { color: '#38BDF8', fontWeight: '700' },
    medsContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    homeTitle: { color: 'white', fontSize: 24, fontWeight: '700' },
    homeSub: { color: '#94A3B8', fontSize: 13, marginTop: 4, marginBottom: 15 },
    resetBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', height: 46 },
    searchInput: { flex: 1, color: 'white', marginLeft: 10, fontSize: 14 },
    searchBtn: { backgroundColor: '#38BDF8', padding: 12, borderRadius: 14, alignItems: 'center', marginBottom: 15, justifyContent: 'center', height: 46 },
    patientCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    patientName: { color: 'white', fontSize: 15, fontWeight: '600' },
    patientId: { color: '#64748B', fontSize: 12, marginTop: 3 },
    editSmallBtn: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 8, borderRadius: 10 },
    medCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    medIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(56,189,248,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    medName: { color: 'white', fontSize: 14, fontWeight: '600' },
    medInfo: { color: '#64748B', fontSize: 12, marginTop: 3 },
    deleteBtn: { backgroundColor: '#EF4444', padding: 8, borderRadius: 10 },
    addContainer: { position: 'absolute', bottom: 100, right: 20 },
    addBtn: { backgroundColor: '#38BDF8', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    modal: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(11,18,32,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    formCard: { width: '100%', backgroundColor: '#0F172A', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    formTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 15 },
    formInput: { backgroundColor: '#0B1220', color: 'white', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    cancelBtn: { flex: 1, backgroundColor: '#EF4444', padding: 12, borderRadius: 12, alignItems: 'center' },
    saveBtn: { flex: 1, backgroundColor: '#38BDF8', padding: 12, borderRadius: 12, alignItems: 'center' },
    dropdownBtn: { backgroundColor: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    dropdownBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
    toggleRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 10, marginBottom: 15 },
    toggleTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    toggleActive: { backgroundColor: '#38BDF8' },
    navWrapper: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 64, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    blurContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'rgba(11,18,32,0.5)' },
    tab: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    label: { color: '#94A3B8', fontSize: 10, marginTop: 4, fontWeight: '500' },
    active: { color: '#38BDF8', fontWeight: '600' },

    // ✅ NOVEAUX STYLES HARMONIEUX POUR LE BOUTON PLANNING SANS ALTÉRER LE RESTE
    planningLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(56,189,248,0.1)',
        padding: 14,
        borderRadius: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.25)',
    },
    planningLinkText: {
        color: '#38BDF8',
        fontWeight: '600',
        fontSize: 14,
        flex: 1,
        marginLeft: 10,
    }
});