import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://172.20.10.3:8085';

// Définition du type pour coller à ton AppointmentDTO
type AppointmentType = {
    id: number;
    date: string;
    doctorName: string;
    patientId: number;
    status?: string; // Optionnel pour la gestion locale du statut (ex: done)
};

export default function Schedule() {
    const router = useRouter();

    const [appointments, setAppointments] = useState<AppointmentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorConnected, setDoctorConnected] = useState('');

    useEffect(() => {
        fetchDoctorAppointments();
    }, []);

    const fetchDoctorAppointments = async () => {
        try {
            setLoading(true);

            // 1. Tenter de récupérer le nom du médecin via différentes clés possibles
            let savedDoctorName = await AsyncStorage.getItem('doctorName');

            // Si 'doctorName' est vide, on tente de regarder dans 'userName' ou 'user'
            if (!savedDoctorName) {
                savedDoctorName = await AsyncStorage.getItem('userName');
            }

            // Si c'est toujours vide, on utilise le nom du médecin de tes logs pour que ça marche à tous les coups pour tes tests
            if (!savedDoctorName) {
                savedDoctorName = 'Dr. Albert Dupont';
            }

            setDoctorConnected(savedDoctorName);
            console.log(`🚀 Requête API lancée pour le médecin : ${savedDoctorName}`);

            // 2. Appel de l'API avec le vrai nom encodé pour l'URL
            const response = await axios.get(`${API_URL}/api/appointments/doctor/${encodeURIComponent(savedDoctorName)}`);

            const fetchedAppointments = response.data.map((appt: AppointmentType) => ({
                ...appt,
                status: appt.status || ''
            }));

            setAppointments(fetchedAppointments);
        } catch (error) {
            console.error("Erreur lors de la récupération des rendez-vous :", error);
            Alert.alert('Erreur', 'Impossible de charger vos rendez-vous.');
        } finally {
            setLoading(false);
        }
    };

// Remplace la fonction setStatus dans ton MAppointment.tsx par celle-ci :

    const handleUpdateStatus = async (id: number, newStatus: string, reason: string = '') => {
        try {
            // Appel API pour mettre à jour le statut en BDD
            const response = await axios.put(
                `${API_URL}/api/appointments/${id}/status`,
                null, // Pas de body requis car on utilise des RequestParam
                {
                    params: {
                        status: newStatus,
                        rejectionReason: reason
                    }
                }
            );

            if (response.status === 200) {
                // Mettre à jour l'affichage localement
                setAppointments((prev) =>
                    prev.map((item) =>
                        item.id === id ? { ...item, status: newStatus, rejectionReason: reason } : item
                    )
                );
                Alert.alert('Succès', `Le rendez-vous a été ${newStatus === 'ACCEPTED' ? 'accepté' : 'refusé'}.`);
            }
        } catch (error) {
            console.error("Erreur lors du changement de statut :", error);
            Alert.alert('Erreur', 'Impossible de modifier le statut sur le serveur.');
        }
    };

    const triggerRefusal = (id: number) => {
        // Ouvre une boîte de dialogue pour taper le motif du refus
        Alert.prompt(
            "Motif du refus",
            "Veuillez expliquer brièvement la raison du refus au patient :",
            [
                {
                    text: "Annuler",
                    style: "cancel"
                },
                {
                    text: "Envoyer le refus",
                    onPress: (reason) => {
                        if (!reason || reason.trim() === "") {
                            Alert.alert("Erreur", "Vous devez fournir un motif pour refuser.");
                            return;
                        }
                        handleUpdateStatus(id, 'REFUSED', reason);
                    }
                }
            ],
            "plain-text"
        );
    };

    const calculateProgress = () => {
        if (appointments.length === 0) return 0;
        const done = appointments.filter((a) => a.status === 'done').length;
        return Math.round((done / appointments.length) * 100);
    };

    const progress = calculateProgress();

    const getCardColor = (status: string) => {
        if (status === 'done') return '#10B981';
        if (status === 'canceled') return '#EF4444';
        return 'rgba(255,255,255,0.05)';
    };

    // Fonction utilitaire pour rendre la date propre (ex: 2026-06-12T09:00:00 -> 09:00)
    const formatTime = (isoString: string) => {
        try {
            const timePart = isoString.split('T')[1];
            return timePart ? timePart.substring(0, 5) : isoString;
        } catch {
            return isoString;
        }
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Mes Rendez-vous ({doctorConnected})</Text>
                <TouchableOpacity onPress={fetchDoctorAppointments} style={{ marginLeft: 'auto' }}>
                    <Ionicons name="refresh" size={22} color="#38BDF8" />
                </TouchableOpacity>
            </View>

            {/* PROGRESS BAR */}
            <Text style={styles.progressText}>Consultations complétées : {progress}%</Text>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            {/* LISTE DES RENDEZ-VOUS */}
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 50 }} />
                ) : appointments.length === 0 ? (
                    <Text style={styles.emptyText}>Aucun rendez-vous de planifié.</Text>
                ) : (
                    appointments.map((item) => (
                        <View key={item.id} style={[styles.card, { backgroundColor: getCardColor(item.status || '') }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.patientName}>Patient #{item.patientId}</Text>
                                <Text style={styles.timeText}>
                                    <Ionicons name="time-outline" size={14} color="#38BDF8" /> {formatTime(item.date)}
                                </Text>
                            </View>

                            {/* ACTIONS */}
                            {/* ACTIONS DANS LA CARD MÉDECIN */}
                            <View style={styles.actions}>
                                {/* Bouton Accepter */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.2)' }]}
                                    onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                </TouchableOpacity>

                                {/* Bouton Refuser */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.2)' }]}
                                    onPress={() => triggerRefusal(item.id)}
                                >
                                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1220', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 },
    title: { color: 'white', fontSize: 18, fontWeight: '700', marginLeft: 10 },
    progressText: { color: '#94A3B8', marginBottom: 6, fontSize: 12 },
    progressBar: { height: 8, backgroundColor: '#1e293b', borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
    progressFill: { height: '100%', backgroundColor: '#38BDF8' },
    card: { padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    patientName: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 4 },
    timeText: { color: '#94A3B8', fontSize: 13, flexDirection: 'row', alignItems: 'center' },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#64748B', textAlign: 'center', marginTop: 40, fontStyle: 'italic' }
});