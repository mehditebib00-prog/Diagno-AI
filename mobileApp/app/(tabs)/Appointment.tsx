import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const doctors = [
  'Dr. Smith',
  'Dr. Johnson',
  'Dr. Lee',
  'Dr. Martin',
  'Dr. Ahmed',
];

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

const dates = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

type AppointmentType = {
  id: string;
  name: string;
  doctor: string;
  day: string;
  date: string;
};

export default function Appointment() {
  const router = useRouter();

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [doctor, setDoctor] = useState('');
  const [day, setDay] = useState('');
  const [date, setDate] = useState('');

  const [list, setList] = useState<AppointmentType[]>([]);

  const createAppointment = () => {
    if (!id || !name || !doctor || !day || !date) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const exists = list.some(
      (a) =>
        a.id === id ||
        (a.doctor === doctor && a.day === day && a.date === date)
    );

    if (exists) {
      Alert.alert('Warning', 'This appointment already exists');
      return;
    }

    const newItem: AppointmentType = {
      id,
      name,
      doctor,
      day,
      date,
    };

    setList([newItem, ...list]);

    setId('');
    setName('');
    setDoctor('');
    setDay('');
    setDate('');
  };

  const deleteAppointment = (id: string) => {
    Alert.alert(
      'Cancel appointment',
      'Do you really want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setList(list.filter((item) => item.id !== id));
            Alert.alert('Cancelled', 'Your appointment has been cancelled');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.title}>Appointment</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* FORM */}
        <View style={styles.card}>

          <TextInput
            placeholder="Patient ID"
            placeholderTextColor="#94A3B8"
            value={id}
            onChangeText={setId}
            style={styles.input}
          />

          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          {/* DOCTOR */}
          <TouchableOpacity
            style={styles.selector}
            onPress={() =>
              Alert.alert('Select Doctor', '', doctors.map((d) => ({
                text: d,
                onPress: () => setDoctor(d),
              })))
            }
          >
            <Text style={styles.selectorText}>
              {doctor || 'Select Doctor'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="white" />
          </TouchableOpacity>

          {/* DAY */}
          <TouchableOpacity
            style={styles.selector}
            onPress={() =>
              Alert.alert('Select Day', '', days.map((d) => ({
                text: d,
                onPress: () => setDay(d),
              })))
            }
          >
            <Text style={styles.selectorText}>
              {day || 'Select Day'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="white" />
          </TouchableOpacity>

          {/* DATE */}
          <TouchableOpacity
            style={styles.selector}
            onPress={() =>
              Alert.alert('Select Time', '', dates.map((d) => ({
                text: d,
                onPress: () => setDate(d),
              })))
            }
          >
            <Text style={styles.selectorText}>
              {date || 'Select Time'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="white" />
          </TouchableOpacity>

          {/* BUTTON */}
          <TouchableOpacity
            onPress={createAppointment}
            style={styles.button}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Create Appointment
            </Text>
          </TouchableOpacity>

        </View>

        {/* LIST */}
        {list.map((item) => (
          <View key={item.id} style={styles.appCard}>

            <View>
              <Text style={styles.appText}>ID: {item.id}</Text>
              <Text style={styles.appText}>Name: {item.name}</Text>
              <Text style={styles.appText}>Doctor: {item.doctor}</Text>
              <Text style={styles.appText}>Day: {item.day}</Text>
              <Text style={styles.appText}>Time: {item.date}</Text>
            </View>

            <TouchableOpacity
              onPress={() => deleteAppointment(item.id)}
              style={styles.cancelBtn}
            >
              <Text style={{ color: 'white' }}>Cancel</Text>
            </TouchableOpacity>

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
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },

  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },

  card: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 10,
    color: 'white',
    marginBottom: 10,
  },

  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },

  selectorText: {
    color: 'white',
  },

  button: {
    marginTop: 10,
    backgroundColor: '#38BDF8',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  appCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  appText: {
    color: '#E2E8F0',
    fontSize: 12,
  },

  cancelBtn: {
    backgroundColor: '#EF4444',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
});