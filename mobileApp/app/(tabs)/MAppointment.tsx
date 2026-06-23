
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';

const API_URL = 'http://172.20.10.3:8085';

type AppointmentType = {
    id: number;
    date: string;
    doctorName: string;
    patientId: number;
    patientName?: string; // 🚀 Ajouté pour afficher le vrai nom du patient
    status: string; // 'PENDING', 'ACCEPTED', 'REFUSED'
    rejectionReason?: string;
};

export default function Schedule() {
    const router = useRouter();
    const { doctorId } = useLocalSearchParams(); // 👈 Récupère le doctorId envoyé du Dashboard

    const [appointments, setAppointments] = useState<AppointmentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorConnected, setDoctorConnected] = useState('');

    useEffect(() => {
        fetchDoctorAppointments();
    }, [doctorId]); // 👈 Ajoute doctorId ici pour recharger si l'id change

    const fetchDoctorAppointments = async () => {
        try {
            setLoading(true);

            // 1. On tente de récupérer le nom
            let savedDoctorName = await AsyncStorage.getItem('doctorName');

            // 2. Si le nom est null, on va chercher l'email pour appeler son profil et récupérer son nom !
            if (!savedDoctorName) {
                console.log("⚠️ Nom absent. Tentative de récupération via l'email du médecin...");
                const doctorEmail = await AsyncStorage.getItem('doctorEmail') || await AsyncStorage.getItem('userEmail');

                if (doctorEmail) {
                    // On appelle l'API profil du médecin pour récupérer son vrai nom en BDD
                    const docProfile = await axios.get(`${API_URL}/api/doctors/profile?email=${encodeURIComponent(doctorEmail.trim())}`);
                    if (docProfile.data && docProfile.data.name) {
                        savedDoctorName = docProfile.data.name;
                        // On le sauvegarde localement pour la prochaine fois
                        await AsyncStorage.setItem('doctorName', savedDoctorName);
                    }
                }
            }

            console.log("➡️ [MAppointment] Nom final du médecin utilisé :", savedDoctorName);

            if (!savedDoctorName) {
                console.error("❌ Impossible de trouver le nom du médecin connecté.");
                setDoctorConnected('Médecin non identifié');
                setAppointments([]);
                return;
            }

            // Met à jour l'affichage du sous-titre avec le nom réel du médecin
            setDoctorConnected(`Dr. ${savedDoctorName}`);

            // 3. Appel à ton endpoint backend actuel avec le nom récupéré dynamiquement
            const url = `${API_URL}/api/appointments/doctor/${encodeURIComponent(savedDoctorName.trim())}`;
            console.log("📡 Envoi de la requête vers :", url);

            const response = await axios.get(url);
            console.log("🍏 Liste des rendez-vous reçue :", response.data);

            if (response.data) {
                setAppointments(response.data);
            }

        } catch (error: any) {
            console.error("❌ Erreur lors du chargement des rendez-vous :", error?.response?.data || error.message);
            Alert.alert("Erreur", "Impossible de charger les rendez-vous.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: string, reason: string = '') => {
        try {
            const response = await axios.put(
                `${API_URL}/api/appointments/${id}/status`,
null,
    {
        params: {
            status: newStatus,
            rejectionReason: reason
        }
    }
);

if (response.status === 200) {
    setAppointments((prev) =>
        prev.map((item) =>
            item.id === id ? { ...item, status: newStatus, rejectionReason: reason } : item
        )
    );
    Alert.alert('Mis à jour', `Le rendez-vous a bien été passé en : ${newStatus === 'ACCEPTED' ? 'Accepté ✅' : 'Refusé ❌'}.`);
}
} catch (error) {
    console.error("Erreur lors du changement de statut :", error);
    Alert.alert('Erreur', 'Impossible de modifier le statut sur le serveur.');
}
};

const triggerRefusal = (id: number) => {
    Alert.prompt(
        "Motif du refus",
        "Veuillez expliquer brièvement la raison du refus au patient :",
        [
            { text: "Annuler", style: "cancel" },
            {
                text: "Envoyer le refus",
                onPress: (reason: string | undefined) => {
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
    const processed = appointments.filter((a) => a.status === 'ACCEPTED' || a.status === 'REFUSED').length;
    return Math.round((processed / appointments.length) * 100);
};

const progress = calculateProgress();

const getCardColor = (status: string) => {
    switch (status) {
        case 'ACCEPTED': return 'rgba(16, 185, 129, 0.08)';
        case 'REFUSED': return 'rgba(239, 68, 68, 0.08)';
        default: return 'rgba(255, 255, 255, 0.04)';
    }
};

const formatDateTime = (isoString: string) => {
    try {
        const dateObj = new Date(isoString);
        const datePart = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const timePart = isoString.split('T')[1]?.substring(0, 5) || '';
        return `${datePart} à ${timePart}`;
    } catch {
        return isoString;
    }
};

const getStatusTextBadge = (status: string) => {
    switch (status) {
        case 'ACCEPTED': return <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 12 }}>✅ Accepté</Text>;
        case 'REFUSED': return <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>❌ Refusé</Text>;
        default: return <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 12 }}>⏳ En attente</Text>;
    }
};

return (
    <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.title} numberOfLines={1}>Mes Rendez-vous</Text>
                <Text style={styles.subtitle}>{doctorConnected}</Text>
            </View>
            <TouchableOpacity onPress={fetchDoctorAppointments} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={22} color="#38BDF8" />
            </TouchableOpacity>
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Demandes traitées : {progress}%</Text>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
        </View>

        {/* LISTE DES RENDEZ-VOUS */}
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {loading ? (
                <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 50 }} />
            ) : appointments.length === 0 ? (
                <Text style={styles.emptyText}>Aucun rendez-vous de planifié.</Text>
            ) : (
                appointments.map((item) => (
                    <View key={item.id} style={[styles.card, { backgroundColor: getCardColor(item.status), borderColor: item.status === 'ACCEPTED' ? 'rgba(16,185,129,0.3)' : item.status === 'REFUSED' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)' }]}>
                        <View style={{ flex: 1, paddingRight: 5 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                {/* 🚀 Affiche ici directement le nom récupéré de l'API */}
                                <Text style={styles.patientName}>👤 {item.patientName || `Patient #${item.patientId}`}</Text>
                                {getStatusTextBadge(item.status)}
                            </View>

                            <Text style={styles.timeText}>
                                <Ionicons name="calendar-outline" size={14} color="#38BDF8" /> {formatDateTime(item.date)}
                            </Text>

                            {item.status === 'REFUSED' && item.rejectionReason && (
                                <Text style={styles.reasonText}>Raison : {"\""}{item.rejectionReason}{"\""}</Text>
                            )}
                        </View>

                        {/* ACTIONS */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    {
                                        backgroundColor: item.status === 'ACCEPTED' ? '#10B981' : 'rgba(16,185,129,0.15)',
                                        borderWidth: 1,
                                        borderColor: '#10B981'
                                    }
                                ]}
                                onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
                            >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={22}
                                    color={item.status === 'ACCEPTED' ? 'white' : '#10B981'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    {
                                        backgroundColor: item.status === 'REFUSED' ? '#EF4444' : 'rgba(239,68,68,0.15)',
                                        borderWidth: 1,
                                        borderColor: '#EF4444'
                                    }
                                ]}
                                onPress={() => triggerRefusal(item.id)}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={22}
                                    color={item.status === 'REFUSED' ? 'white' : '#EF4444'}
                                />
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
    container: { flex: 1, backgroundColor: '#0B1220', paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginTop: 60, marginBottom: 25 },
    backBtn: { padding: 4 },
    title: { color: 'white', fontSize: 20, fontWeight: '700' },
    subtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
    refreshBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 },
    progressContainer: { marginBottom: 20 },
    progressText: { color: '#94A3B8', marginBottom: 8, fontSize: 13, fontWeight: '500' },
    progressBar: { height: 8, backgroundColor: '#1E293B', borderRadius: 10, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#38BDF8' },
    card: { padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
    patientName: { color: 'white', fontSize: 15, fontWeight: '600' },
    timeText: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
    reasonText: { color: '#EF4444', fontSize: 12, fontStyle: 'italic', marginTop: 6, opacity: 0.8 },
    actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    actionBtn: { padding: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#64748B', textAlign: 'center', marginTop: 40, fontStyle: 'italic', fontSize: 15 }
});

