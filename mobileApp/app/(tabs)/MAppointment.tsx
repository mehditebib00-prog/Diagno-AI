import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { API_URL } from '../../config';

export default function Schedule() {
  const router = useRouter();

  type Appointment = {
  id: string;
  name: string;
  time: string;
  reason: string;
  status: string;
};

const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async () => {
  try {
    const res = await fetch(`${API_URL}/api/appointments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch appointments');

    const data = await res.json();
    setAppointments(data);
  } catch (err) {
    console.log(err);
  }
};
useEffect(() => {
  fetchAppointments();
}, []);
const updateAppointment = async (id: string, updatedData: any) => {
  try {
    const res = await fetch(`${API_URL}/api/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!res.ok) throw new Error('Update failed');

    const data = await res.json();

    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? data : item))
    );
  } catch (err) {
    console.log(err);
  }
};

const deleteAppointment = async (id: string) => {
  try {
    const res = await fetch(`${API_URL}/api/appointments/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('Delete failed');

    setAppointments((prev) =>
      prev.filter((item) => item.id !== id)
    );
  } catch (err) {
    console.log(err);
  }
};

const setStatus = async (id: string, status: string) => {
  try {
    const res = await fetch(`${API_URL}/api/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) throw new Error('Failed to update');

    const updated = await res.json();

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === id ? updated : item
      )
    );
  } catch (err) {
    console.log(err);
  }
};

  //  POURCENTAGE DONE
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
              <TouchableOpacity
              onPress={() => deleteAppointment(item.id)}
              style={[styles.btn, { backgroundColor: '#111827' }]}
              >
              <Text style={styles.btnText}>Delete</Text>
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