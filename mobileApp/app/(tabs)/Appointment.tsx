import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://172.20.10.3:8085';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export default function Appointment() {
    const router = useRouter();

    const [patientId, setPatientId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    const [doctors, setDoctors] = useState<string[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoadingDoctors(true);
                const email = await AsyncStorage.getItem('userEmail');

                if (email) {
                    const res = await axios.get(`${API_URL}/api/patients/search?name=&id=`);
                    const currentPatient = res.data.find((p: any) => p.email === email);

                    if (currentPatient) {
                        setPatientId(currentPatient.id.toString());
                        const fullName = currentPatient.name || `${currentPatient.firstName || ''} ${currentPatient.lastName || ''}`.trim();
                        setPatientName(fullName || `Patient #${currentPatient.id}`);
                    }
                }

                const response = await axios.get(`${API_URL}/api/appointments/doctors-list`);
                setDoctors(response.data);
            } catch (error) {
                console.error("Erreur d'initialisation :", error);
                Alert.alert('Erreur', 'Impossible de charger les données de session.');
            } finally {
                setLoadingDoctors(false);
            }
        };

        initializeData();
    }, []);

    const handleCreateAppointment = async () => {
        if (!patientId) {
            Alert.alert('Erreur', 'Identifiant de session introuvable. Veuillez vous reconnecter.');
            return;
        }
        if (!doctorName) {
            Alert.alert('Erreur', 'Veuillez sélectionner un praticien.');
            return;
        }
        if (!selectedTime) {
            Alert.alert('Erreur', 'Veuillez choisir un horaire.');
            return;
        }

        try {
            setLoadingSubmit(true);
            const isoDateTime = `2026-06-12T${selectedTime}:00`;

            const appointmentPayload = {
                patientId: parseInt(patientId, 10),
                patientName: patientName,
                doctorName: doctorName,
                date: isoDateTime
            };

            const response = await axios.post(`${API_URL}/api/appointments`, appointmentPayload);

            if (response.status === 200 || response.status === 201) {
                Alert.alert(
                    'Rendez-vous confirmé ✨',
                    `Votre consultation avec le ${response.data.doctorName} a bien été enregistrée.`
                );
                setDoctorName('');
                setSelectedDay('');
                setSelectedTime('');
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', 'Le serveur a refusé la création du rendez-vous.');
        } finally {
            setLoadingSubmit(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <Text style={styles.title}>Nouvelle consultation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* PROFIL PATIENT (BADGE PURE) */}
                <View style={styles.profileBadge}>
                    <View style={styles.profileAvatar}>
                        <Ionicons name="person" size={18} color="#38BDF8" />
                    </View>
                    <View>
                        <Text style={styles.profileLabel}>Patient connecté</Text>
                        <Text style={styles.profileValue}>{patientName || 'Chargement...'}</Text>
                    </View>
                </View>

                {/* SÉLECTION DU MÉDECIN */}
                <Text style={styles.sectionTitle}>Choisir un praticien</Text>
                {loadingDoctors ? (
                    <ActivityIndicator size="small" color="#38BDF8" style={{ marginVertical: 20 }} />
                ) : doctors.length === 0 ? (
                    <Text style={styles.emptyText}>Aucun médecin disponible pour le moment.</Text>
                ) : (
                    <View style={styles.doctorList}>
                        {doctors.map((d) => {
                            const isSelected = doctorName === d;
                            return (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.doctorCard, isSelected && styles.selectedDoctorCard]}
                                    onPress={() => setDoctorName(d)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.doctorAvatar, isSelected && styles.selectedDoctorAvatar]}>
                                        <Ionicons name="medical" size={16} color={isSelected ? '#38BDF8' : '#64748B'} />
                                    </View>
                                    <Text style={[styles.doctorText, isSelected && styles.selectedDoctorText]}>
                                        {d}
                                    </Text>
                                    <View style={[styles.radioCircle, isSelected && styles.radioCircleChecked]}>
                                        {isSelected && <View style={styles.radioInnerCircle} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* DATE & HEURE */}
                <Text style={styles.sectionTitle}>Date & Horaire</Text>

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Jour</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() =>
                                Alert.alert('Sélectionner un Jour', '', days.map((d) => ({
                                    text: d,
                                    onPress: () => setSelectedDay(d),
                                })))
                            }
                        >
                            <Text style={[styles.selectorText, selectedDay ? styles.textActive : null]}>
                                {selectedDay || 'Choisir...'}
                            </Text>
                            <Ionicons name="calendar-outline" size={16} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ width: 16 }} />

                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Heure</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() =>
                                Alert.alert('Sélectionner une Heure', '', times.map((t) => ({
                                    text: t,
                                    onPress: () => setSelectedTime(t),
                                })))
                            }
                        >
                            <Text style={[styles.selectorText, selectedTime ? styles.textActive : null]}>
                                {selectedTime || 'Choisir...'}
                            </Text>
                            <Ionicons name="time-outline" size={16} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* BOUTON DE SOUMISSION */}
                <TouchableOpacity
                    onPress={handleCreateAppointment}
                    style={[styles.submitButton, loadingSubmit && { opacity: 0.6 }]}
                    disabled={loadingSubmit || loadingDoctors}
                    activeOpacity={0.8}
                >
                    {loadingSubmit ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Confirmer le rendez-vous</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1220' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
    },
    title: { color: '#F8FAFC', fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 60 },

    // Badge Profil Pur
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
        marginBottom: 32,
        gap: 12
    },
    profileAvatar: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    profileLabel: { color: '#64748B', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
    profileValue: { color: '#E2E8F0', fontSize: 14, fontWeight: '600', marginTop: 1 },

    sectionTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginBottom: 16, letterSpacing: -0.1 },

    // Liste Praticiens épurée
    doctorList: { marginBottom: 28, gap: 10 },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
        gap: 12
    },
    selectedDoctorCard: {
        borderColor: 'rgba(56, 189, 248, 0.4)',
        backgroundColor: 'rgba(56, 189, 248, 0.03)'
    },
    doctorAvatar: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    selectedDoctorAvatar: {
        backgroundColor: 'rgba(56, 189, 248, 0.12)'
    },
    doctorText: { color: '#94A3B8', fontSize: 14, fontWeight: '500', flex: 1 },
    selectedDoctorText: { color: '#F8FAFC', fontWeight: '600' },

    // Radio boutons stylisés
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleChecked: { borderColor: '#38BDF8' },
    radioInnerCircle: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#38BDF8' },

    // Formulaire Date & Heure
    row: { flexDirection: 'row', marginBottom: 40 },
    fieldLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '500', marginBottom: 8 },
    selector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)'
    },
    selectorText: { color: '#64748B', fontSize: 14 },
    textActive: { color: '#F8FAFC', fontWeight: '500' },

    // Bouton de soumission Moderne
    submitButton: {
        backgroundColor: '#38BDF8',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 3
    },
    submitButtonText: { color: '#0B1220', fontWeight: '600', fontSize: 15, letterSpacing: -0.1 },
    emptyText: { color: '#64748B', fontStyle: 'italic', marginVertical: 10, fontSize: 13 }
});