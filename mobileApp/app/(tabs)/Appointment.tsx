import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// URL de ton serveur Spring Boot
const API_URL = 'http://172.20.10.3:8085';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export default function Appointment() {
    const router = useRouter();

    // États du formulaire
    const [patientId, setPatientId] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    // États pour les données de la BDD
    const [doctors, setDoctors] = useState<string[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    // Charger les données (Patient connecté + Liste des médecins) au démarrage
    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoadingDoctors(true);

                // 1. Récupérer l'email du patient connecté depuis le stockage de l'app
                const email = await AsyncStorage.getItem('userEmail');
                console.log("Email de la session connecté :", email);

                if (email) {
                    // Rechercher l'ID correspondant à cet email dans ta BDD
                    const res = await axios.get(`${API_URL}/api/patients/search?name=&id=`);
                    const currentPatient = res.data.find((p: any) => p.email === email);

                    if (currentPatient) {
                        console.log("Patient trouvé en BDD, ID assigné :", currentPatient.id);
                        setPatientId(currentPatient.id.toString()); // Met automatiquement le bon ID (ex: 13)
                    }
                }

                // 2. Récupérer la liste des médecins depuis l'endpoint BDD
                const response = await axios.get(`${API_URL}/api/appointments/doctors-list`);
                setDoctors(response.data);

            } catch (error) {
                console.error("Erreur lors de l'initialisation des données :", error);
                Alert.alert('Erreur', 'Impossible de charger les données de session ou les médecins.');
            } finally {
                setLoadingDoctors(false);
            }
        };

        initializeData();
    }, []);

    const handleCreateAppointment = async () => {
        if (!patientId) {
            Alert.alert('Erreur', 'Impossible de récupérer votre identifiant de session. Veuillez vous reconnecter.');
            return;
        }
        if (!doctorName) {
            Alert.alert('Erreur', 'Veuillez sélectionner un médecin dans la liste.');
            return;
        }
        if (!selectedTime) {
            Alert.alert('Erreur', 'Veuillez sélectionner un horaire.');
            return;
        }

        try {
            setLoadingSubmit(true);

            // Format LocalDateTime requis par ton DTO Spring Boot (ex: 2026-06-12T09:00:00)
            const isoDateTime = `2026-06-12T${selectedTime}:00`;

            // Payload aligné à ton AppointmentDTO.java
            const appointmentPayload = {
                patientId: parseInt(patientId, 10),
                doctorName: doctorName,
                date: isoDateTime
            };

            console.log("Envoi du rendez-vous à l'API :", appointmentPayload);

            const response = await axios.post(`${API_URL}/api/appointments`, appointmentPayload);

            if (response.status === 200 || response.status === 201) {
                Alert.alert(
                    'Succès 🎉',
                    `Votre rendez-vous avec le ${response.data.doctorName} a bien été enregistré en base de données !`
                );
                setDoctorName('');
                setSelectedDay('');
                setSelectedTime('');
            }
        } catch (error: any) {
            console.error("Erreur d'enregistrement :", error);
            Alert.alert('Erreur', 'Le serveur a refusé la création du rendez-vous.');
        } finally {
            setLoadingSubmit(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Prendre un Rendez-vous</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={styles.card}>

                    {/* ID masqué ou affiché à titre indicatif */}
                    <Text style={styles.label}>Votre ID Patient (Automatique) :</Text>
                    <TextInput
                        value={patientId ? `Patient #${patientId}` : "Récupération..."}
                        editable={false}
                        style={[styles.input, { opacity: 0.6, color: '#38BDF8', fontWeight: 'bold' }]}
                    />

                    <Text style={styles.label}>Sélectionner un Médecin (Depuis la BDD) :</Text>

                    {loadingDoctors ? (
                        <ActivityIndicator size="small" color="#38BDF8" style={{ marginVertical: 15 }} />
                    ) : doctors.length === 0 ? (
                        <Text style={{ color: '#EF4444', fontStyle: 'italic', marginVertical: 10 }}>
                            Aucun médecin trouvé dans la BDD.
                        </Text>
                    ) : (
                        <View style={{ marginBottom: 15 }}>
                            {doctors.map((d) => {
                                const isSelected = doctorName === d;
                                return (
                                    <TouchableOpacity
                                        key={d}
                                        style={[styles.doctorCard, isSelected && styles.selectedDoctorCard]}
                                        onPress={() => setDoctorName(d)}
                                    >
                                        <Ionicons name="person-outline" size={16} color={isSelected ? 'white' : '#38BDF8'} />
                                        <Text style={[styles.doctorText, isSelected && { color: 'white', fontWeight: '700' }]}>
                                            {d}
                                        </Text>
                                        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    <Text style={styles.label}>Jour :</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() =>
                            Alert.alert('Choisir un Jour', '', days.map((d) => ({
                                text: d,
                                onPress: () => setSelectedDay(d),
                            })))
                        }
                    >
                        <Text style={styles.selectorText}>{selectedDay || 'Sélectionner le jour'}</Text>
                        <Ionicons name="chevron-down" size={18} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.label}>Horaire :</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() =>
                            Alert.alert('Choisir une Heure', '', times.map((t) => ({
                                text: t,
                                onPress: () => setSelectedTime(t),
                            })))
                        }
                    >
                        <Text style={styles.selectorText}>{selectedTime || "Sélectionner l'heure"}</Text>
                        <Ionicons name="chevron-down" size={18} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCreateAppointment}
                        style={[styles.button, loadingSubmit && { opacity: 0.7 }]}
                        disabled={loadingSubmit || loadingDoctors}
                    >
                        {loadingSubmit ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: 'white', fontWeight: '600' }}>
                                Enregistrer en Base de Données
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1220' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    title: { color: 'white', fontSize: 18, fontWeight: '700' },
    card: { margin: 20, padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    label: { color: '#94A3B8', fontSize: 13, marginBottom: 6, marginTop: 10 },
    input: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 10, color: 'white', marginBottom: 10 },
    doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 10, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    selectedDoctorCard: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
    doctorText: { color: '#E2E8F0', fontSize: 14, flex: 1 },
    selector: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 10, alignItems: 'center' },
    selectorText: { color: 'white' },
    button: { marginTop: 20, backgroundColor: '#10B981', padding: 14, borderRadius: 10, alignItems: 'center' },
});