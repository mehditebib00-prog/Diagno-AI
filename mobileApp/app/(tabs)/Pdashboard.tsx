import React, { useState, useRef } from 'react';
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
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const { width, height } = Dimensions.get('window');
const isTabletOrDesktop = width >= 768;

const tabs = ['home', 'meds', 'symptoms', 'account'] as const;
type TabType = typeof tabs[number];

export default function PatientDashboard() {
  const router = useRouter();

  const [tab, setTab] = useState<TabType>('home');
  const [photo, setPhoto] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    fullName?: string;
    residence?: string;
    phone?: string;
    socialSecurity?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        setToken(savedToken);

        const savedProfile = await AsyncStorage.getItem('profile');
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          setProfile(parsedProfile);
          if (parsedProfile?.id) {
            fetchSymptoms(parsedProfile.id);
          }
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      }
    };

    loadAuthData();
  }, []);


  const [meds, setMeds] = useState([
  {
    id: '1',
    name: 'Paracetamol',
    dosage: '500mg',
    frequency: 'Morning',
    status: '',
  },
  {
    id: '2',
    name: 'Vitamin D',
    dosage: '1000UI',
    frequency: 'Afternoon',
    status: '',
  },
]);

const commonSymptoms = [
  "Headache",
  "Fever",
  "Cough",
  "Fatigue",
  "Sore throat",
  "Nausea",
  "Dizziness",
  "Chest pain",
  "Shortness of breath",
  "Back pain",
  "Stomach ache",
  "Diarrhea",
  "Constipation",
  "Runny nose",
  "Body pain",
  "Chills",
  "Loss of appetite",
  "Vomiting",
  "Insomnia",
  "Anxiety",
  "Depression",
  "Skin rash",
  "Itching",
  "Muscle cramps",
  "Joint pain",
  "Blurred vision",
  "Double vision",
  "Eye pain",
  "Ear pain",
  "Hearing loss",
  "Ringing in ears",
  "Nasal congestion",
  "Sneezing",
  "Dry mouth",
  "Bleeding gums",
  "Swollen glands",
  "Palpitations",
  "Rapid heartbeat",
  "Slow heartbeat",
  "High blood pressure",
  "Low blood pressure",
  "Cold hands and feet",
  "Excessive sweating",
  "Night sweats",
  "Hot flashes",
  "Weight loss",
  "Weight gain",
  "Dehydration",
  "Frequent urination",
  "Painful urination",
  "Blood in urine",
  "Dark urine",
  "Swelling",
  "Leg pain",
  "Arm pain",
  "Neck pain",
  "Shoulder pain",
  "Hip pain",
  "Knee pain",
  "Foot pain",
  "Weakness",
  "Numbness",
  "Tingling",
  "Balance problems",
  "Memory loss",
  "Confusion",
  "Difficulty concentrating",
  "Mood swings",
  "Irritability",
  "Panic attacks",
  "Short-term memory issues",
  "Dry skin",
  "Hair loss",
  "Brittle nails",
  "Sensitivity to light"
];
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [filteredSymptoms, setFilteredSymptoms] = useState<string[]>([]);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [deleteSymptomMode, setDeleteSymptomMode] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  const fetchSymptoms = async (patientId?: string) => {
    try {
      const url = patientId
        ? `${API_URL}/api/symptoms/patient/${patientId}`
        : `${API_URL}/api/symptoms`;

      const res = await fetch(url);

      if (!res.ok) throw new Error('Failed to load symptoms');

      const data = await res.json();
      setSymptoms(data);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Could not load symptoms');
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    fetchSymptoms(profile.id);
  }, [profile]);

const [appointment, setAppointment] = useState({
  name: '',
  date: '',
  time: '',
  doctor: '',
});
const handleAppointmentSubmit = () => {
  if (!appointment.name || !appointment.date || !appointment.time) return;

  Alert.alert(
    "Appointment booked",
    `Name: ${appointment.name}\nDate: ${appointment.date}\nTime: ${appointment.time}`
  );

  setShowAppointmentForm(false);
  setAppointment({ name: '', date: '', time: '', doctor: '' });
};


  const addSymptom = async () => {
    const value = newSymptom.trim();

    if (!value) return;

    if (!profile?.id) {
      Alert.alert('Error', 'Patient profile is not loaded yet');
      return;
    }

    // prevent duplicates locally
    const exists = symptoms.some(
      (s) => (s.description || s.name || '').toLowerCase() === value.toLowerCase()
    );

    if (exists) {
      Alert.alert("Error", "This symptom already exists");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/symptoms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: value,
          patientId: Number(profile.id),
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save symptom");
      }

      const saved = await res.json();

      setSymptoms((prev) => [...prev, saved]);
      setNewSymptom('');
      setFilteredSymptoms([]);
      setShowSymptomForm(false);

    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not save symptom");
    }
  };

  const deleteSymptom = async (id: string) => {
  try {
    await fetch(`${API_URL}/api/symptoms/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    setSymptoms((prev) => prev.filter((s) => s.id !== id));
  } catch (err) {
    Alert.alert('Error', 'Could not delete symptom');
  }
};




const calculateProgress = () => {
  if (meds.length === 0) return 0;

  const taken = meds.filter((m) => m.status === 'taken').length;
  return Math.round((taken / meds.length) * 100);
};

const handleTake = (id: string) => {
  setMeds((prev) =>
    prev.map((m) =>
      m.id === id ? { ...m, status: 'taken' } : m
    )
  );
};

const handleForgot = (id: string) => {
  setMeds((prev) =>
    prev.map((m) =>
      m.id === id ? { ...m, status: 'forgot' } : m
    )
  );
};
const getBgColor = (status: string) => {
  if (status === 'taken') return 'rgba(56,189,248,0.2)';
  if (status === 'forgot') return 'rgba(239,68,68,0.2)';
  return 'rgba(255,255,255,0.05)';
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

  const animateTab = (selected: TabType) => {
    tabs.forEach((t) => {
      Animated.spring(animValues[t], {
        toValue: t === selected ? 1.25 : 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
    });
  };

  const changeTab = (t: TabType) => {
    setTab(t);
    animateTab(t);
  };

  /* 📸 IMAGE */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good morning 👋";
  if (hour >= 12 && hour < 18) return "Good afternoon ☀️";
  return "Good evening 🌙";
};
  /* ================= HOME ================= */
  const renderHome = () => (
  <ScrollView style={{ padding: 20, paddingTop: 60 }}>
    <View
  style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  }}
>
  <View>
    <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>
      {getGreeting()}
    </Text>

    <Text style={{ color: '#94A3B8', marginTop: 5 }}>
      Your health dashboard is active
    </Text>
  </View>

  <TouchableOpacity
    onPress={() => router.push('/(tabs)/Chatbot')}
    style={{
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#38BDF8',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Ionicons
      name="chatbubble-ellipses"
      size={24}
      color="white"
    />
  </TouchableOpacity>
</View>
    {/* IMAGE */}
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Image
         source={require('../../assets/images/patient.jpeg')}
        style={{
    width: '100%',
    height: 200,
    borderRadius: 15,
  }}
  resizeMode="cover"
      />
    </View>

    {/* DESCRIPTION */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📱 About the app</Text>
      <Text style={styles.cardText}>
        This application helps you track your medications, symptoms,
        and manage your medical appointments easily.
      </Text>
    </View>

    {/* MEDICATION CARD */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🏥 Health Guidelines</Text>

      <Text style={styles.cardText}>
        ✔ Take your medication on time{"\n"}
        ✔ Monitor your symptoms daily{"\n"}
        ✔ Never miss your appointments
      </Text>
    </View>

    {/* APPOINTMENT CARD */}
    <View style={styles.card}>
  <Text style={styles.cardTitle}>📅 Appointment</Text>
  <Text style={styles.cardText}>Stay on track with your health. Your next appointment will be displayed here.</Text>

  <TouchableOpacity
    onPress={() => router.push('/(tabs)/Appointment')}
    style={{
      marginTop: 10,
      backgroundColor: '#38BDF8',
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
    }}
  >
    <Text style={{ color: 'white' }}>Take an appointment</Text>
  </TouchableOpacity>
</View>
  </ScrollView>
);
  

  /* ================= ACCOUNT ================= */
  const renderAccount = () => (
  <ScrollView
    style={styles.accountContainer}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingBottom: 120 }}
  >

    {/* PHOTO */}
    <TouchableOpacity onPress={pickImage} style={styles.profileBox}>
      <View style={styles.avatar}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="camera" size={28} color="#0B1220" />
        )}
      </View>
      <Text style={styles.changePhoto}>Tap to change photo</Text>
    </TouchableOpacity>

    {/* ID (READ ONLY) */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🆔 Patient ID</Text>
      <Text style={styles.cardText}>{profile?.id}</Text>
    </View>

    {/* FULL NAME (FIX SAFE) */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>👤 Full Name</Text>

      {editMode ? (
        <TextInput
          value={profile?.fullName || ''}
          onChangeText={(t) =>
            setProfile((prev) => prev ? { ...prev, fullName: t } : prev)
          }
          style={styles.input}
        />
      ) : (
        <Text style={styles.cardText}>
          {profile?.fullName || 'No name set'}
        </Text>
      )}
    </View>

    {/* RESIDENCE */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🏠 Residence</Text>
      {editMode ? (
        <TextInput
          value={profile?.residence || ''}
          onChangeText={(t) =>
            setProfile((prev) => prev ? { ...prev, residence: t } : prev)
          }
          style={styles.input}
        />
      ) : (
        <Text style={styles.cardText}>{profile?.residence}</Text>
      )}
    </View>

    {/* PHONE */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📞 Phone</Text>
      {editMode ? (
        <TextInput
          value={profile?.phone || ''}
          onChangeText={(t) =>
            setProfile((prev) => prev ? { ...prev, phone: t } : prev)
          }
          style={styles.input}
        />
      ) : (
        <Text style={styles.cardText}>{profile?.phone}</Text>
      )}
    </View>

    {/* SOCIAL SECURITY (READ ONLY) */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🧾 Social Security</Text>
      <Text style={styles.cardText}>{profile?.socialSecurity}</Text>
    </View>

    {/* EDIT BUTTON */}
    <TouchableOpacity
      style={styles.editBtn}
      onPress={() => setEditMode(!editMode)}
    >
      <Text style={styles.editText}>
        {editMode ? 'Save Changes' : 'Edit Information'}
      </Text>
    </TouchableOpacity>

    {/* LOGOUT */}
    <TouchableOpacity
      style={styles.logoutBtn}
      onPress={() => router.replace('/(tabs)/role')}
    >
      <Ionicons name="log-out-outline" size={18} color="white" />
      <Text style={styles.logoutText}>Log out</Text>
    </TouchableOpacity>

  </ScrollView>
);
const renderMeds = () => {
  const progress = calculateProgress();

  return (
    <View style={styles.medsContainer}>

      <Text style={styles.homeTitle}>💊 My Medications</Text>
      <Text style={styles.homeSub}>
        Overall adherence: {progress}%
      </Text>

      {/* BAR */}
      <View style={{
        height: 10,
        backgroundColor: '#1e293b',
        borderRadius: 10,
        marginVertical: 10,
        overflow: 'hidden',
      }}>
        <View
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#38BDF8',
          }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 200 }}
      >

        {meds.map((med) => (
          <View
            key={med.id}
            style={[
              styles.cardRow,
              { backgroundColor: getBgColor(med.status) } // 👈 IMPORTANT
            ]}
          >

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{med.name}</Text>
              <Text style={styles.cardText}>
                {med.dosage} • {med.frequency}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>

              <TouchableOpacity
                onPress={() => handleTake(med.id)}
                style={{
                  backgroundColor:
                    med.status === 'taken' ? '#0ea5e9' : '#38BDF8',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>
                  Take
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleForgot(med.id)}
                style={{
                  backgroundColor:
                    med.status === 'forgot' ? '#b91c1c' : '#EF4444',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>
                  Forgot
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        ))}

      </ScrollView>
    </View>
  );
};
const renderSymptoms = () => (
  <View style={styles.medsContainer}>

    <Text style={styles.homeTitle}>🤒 Symptoms</Text>
    <Text style={styles.homeSub}>Track how you feel</Text>

    <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>

      {symptoms.map((s) => (
        <View key={s.id} style={styles.cardRow}>

          <Text style={styles.cardText}>{s.name}</Text>

          {deleteSymptomMode && (
            <TouchableOpacity
              onPress={() => deleteSymptom(s.id)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: '#EF4444',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>
          )}

        </View>
      ))}

    </ScrollView>

    {/* ➕ ADD BUTTON */}
    <TouchableOpacity
      style={styles.fabAdd}
      onPress={() => setShowSymptomForm(true)}
    >
      <Ionicons name="add" size={28} color="white" />
    </TouchableOpacity>

    {/* ➖ DELETE MODE */}
    <TouchableOpacity
      style={styles.fabMinus}
      onPress={() => setDeleteSymptomMode(!deleteSymptomMode)}
    >
      <Ionicons name="remove" size={28} color="white" />
    </TouchableOpacity>

    {/* FORM */}
    {showSymptomForm && (
      <View style={styles.modal}>
        <View style={styles.form}>

          <Text style={styles.formTitle}>Add Symptom</Text>
          {filteredSymptoms.length > 0 && (
  <View style={{
    backgroundColor: '#1E293B',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 150,
  }}>
    <ScrollView>
      {filteredSymptoms.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            setNewSymptom(item);
            setFilteredSymptoms([]);
          }}
          style={{
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#334155',
          }}
        >
          <Text style={{ color: 'white' }}>{item}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}

          <TextInput
  placeholder="Symptom name"
  placeholderTextColor="#94A3B8"
  value={newSymptom}
  onChangeText={(text) => {
    setNewSymptom(text);

    if (text.length > 0) {
      const filtered = commonSymptoms.filter((item) =>
        item.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSymptoms(filtered);
    } else {
      setFilteredSymptoms([]);
    }
  }}
  style={styles.input}
/>

          <TouchableOpacity
            onPress={addSymptom}
            style={{
              backgroundColor: '#38BDF8',
              padding: 12,
              borderRadius: 12,
              marginTop: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white' }}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowSymptomForm(false)}>
            <Text style={{ color: '#EF4444', marginTop: 10, textAlign: 'center' }}>
              Cancel
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    )}

  </View>
);
  const renderContent = () => {
    if (tab === 'home') return renderHome();
    if (tab === 'account') return renderAccount();
    if (tab === 'meds') return renderMeds();
    if (tab === 'symptoms') return renderSymptoms();

    return (
      <View style={styles.center}>
        <Text style={styles.text}>{String(tab).toUpperCase()} SCREEN</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* NAV */}
      <View style={styles.navWrapper}>
        <BlurView intensity={35} tint="dark" style={styles.nav}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => changeTab(t)}
              style={styles.tab}
            >
              <Ionicons
                name={icons[t]}
                size={22}
                color={tab === t ? '#38BDF8' : '#94A3B8'}
              />
              <Text style={[styles.label, tab === t && styles.active]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </BlurView>
      </View>

    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { 
  flex: 1,
  alignSelf: 'center',
  width: isTabletOrDesktop ? '70%' : '100%',
  maxWidth: 1000,
},

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', fontSize: 18, fontWeight: '600' },

  homeContainer: { 
  padding: isTabletOrDesktop ? 40 : 20, 
  paddingTop: isTabletOrDesktop ? 80 : 60 
},
  homeTitle: { color: 'white', fontSize: 22, fontWeight: '700' },
  homeSub: { color: '#94A3B8', fontSize: 12, marginBottom: 20 },

  accountContainer: { 
  padding: isTabletOrDesktop ? 40 : 20, 
  paddingTop: isTabletOrDesktop ? 80 : 60 
},

  profileBox: { alignItems: 'center', marginBottom: 25 },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 42,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  avatarImg: {
    width: 85,
    height: 85,
    borderRadius: 42,
  },

  changePhoto: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 5,
  },

card: {
  backgroundColor: 'rgba(255,255,255,0.05)',
  padding: isTabletOrDesktop ? 20 : 16,
  borderRadius: 18,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
},

  cardTitle: { color: '#38BDF8', fontWeight: '600', marginBottom: 5 },
  cardText: { color: '#E2E8F0', fontSize: 12 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    borderRadius: 10,
    color: 'white',
    marginTop: 5,
  },

  editBtn: {
    marginTop: 15,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.5)',
    alignItems: 'center',
  },

  editText: { color: '#38BDF8', fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },

  logoutText: { color: 'white', fontWeight: '600' },

  navWrapper: {
    position: 'absolute',
    bottom: 25,
    width: '100%',
    alignItems: 'center',
  },

nav: {
  flexDirection: 'row',
  width: isTabletOrDesktop ? 500 : '92%',
  borderRadius: 38,
  paddingVertical: isTabletOrDesktop ? 18 : 16,
  paddingHorizontal: 10,
  justifyContent: 'space-around',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.18)',
  overflow: 'hidden',
},

  tab: { alignItems: 'center', flex: 1 },

  label: { fontSize: 10, color: '#94A3B8', marginTop: 4 },

  active: { color: '#38BDF8', fontWeight: '700' },


cardRow: {
  backgroundColor: 'rgba(255,255,255,0.05)',
  padding: isTabletOrDesktop ? 20 : 16,
  borderRadius: 18,
  marginBottom: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
},
medsContainer: {
  flex: 1,
  paddingTop: isTabletOrDesktop ? 80 : 60,
  paddingHorizontal: isTabletOrDesktop ? 40 : 20,
  alignSelf: 'center',
  width: isTabletOrDesktop ? '70%' : '100%',
  maxWidth: 1000,
},
fabAdd: {
  position: 'absolute',
  bottom: 110,
  right: 20,
  width: 65,
  height: 65,
  borderRadius: 32,
  backgroundColor: '#38BDF8',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
},

fabMinus: {
  position: 'absolute',
  bottom: 110,
  left: 20,
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: '#EF4444',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
},
modal: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
},
form: {
  width: isTabletOrDesktop ? 400 : '85%',
  backgroundColor: '#0F172A',
  padding: 20,
  borderRadius: 20,
},
formTitle: {
  color: 'white',
  fontSize: 18,
  fontWeight: '700',
  marginBottom: 15,
},
});