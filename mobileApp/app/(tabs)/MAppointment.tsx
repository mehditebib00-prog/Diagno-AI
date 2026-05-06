import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Schedule() {
  const router = useRouter();

  const [appointments, setAppointments] = useState([
    { id: '1', name: 'John Doe', time: '10:30 AM', reason: 'Consultation', status: '' },
    { id: '2', name: 'Sarah Martin', time: '11:15 AM', reason: 'Follow-up', status: '' },
    { id: '3', name: 'Mark Lee', time: '14:00 PM', reason: 'Check-up', status: '' },
  ]);

  const setStatus = (id: string, status: string) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  };

  // ✅ POURCENTAGE DONE
  const calculateProgress = () => {
    if (appointments.length === 0) return 0;
    const done = appointments.filter((a) => a.status === 'done').length;
    return Math.round((done / appointments.length) * 100);
  };

  const progress = calculateProgress();

  const getCardColor = (status: string) => {
    if (status === 'done') return 'rgba(56,189,248,0.2)';
    if (status === 'rate') return 'rgba(239,68,68,0.2)';
    return 'rgba(255,255,255,0.05)';
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.title}>Today's Schedule</Text>
      </View>

      {/* ✅ PROGRESS */}
      <Text style={styles.progressText}>
        Progress: {progress}%
      </Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {appointments.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: getCardColor(item.status) }
            ]}
          >

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.reason}>{item.reason}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>

            <View style={{ gap: 8 }}>

              <TouchableOpacity
                onPress={() => setStatus(item.id, 'done')}
                style={[styles.btn, { backgroundColor: '#38BDF8' }]}
              >
                <Text style={styles.btnText}>Done</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatus(item.id, 'rate')}
                style={[styles.btn, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.btnText}>Rate</Text>
              </TouchableOpacity>

            </View>

          </View>
        ))}

      </ScrollView>

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
    marginTop: 50,
    marginBottom: 10,
  },

  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 10,
  },

  // ✅ PROGRESS STYLE
  progressText: {
    color: '#94A3B8',
    marginBottom: 6,
    fontSize: 12,
  },

  progressBar: {
    height: 10,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },

  card: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  name: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  reason: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },

  time: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 5,
  },

  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  btnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});