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

const { width, height } = Dimensions.get('window');
const isTabletOrDesktop = width >= 768;

const tabs = ['home', 'meds', 'symptoms', 'account'] as const;
type TabType = typeof tabs[number];

export default function PatientDashboard() {
  const router = useRouter();

  const [tab, setTab] = useState<TabType>('home');
  const [photo, setPhoto] = useState<string | null>(null);
 

const [profile, setProfile] = useState({
  fullName: 'John Doe',
  specialty: 'Cardiologist',
  hospital: 'Paris Hospital',
  phone: '+33 6 12 34 56 78',
});
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
const [symptoms, setSymptoms] = useState([
  { id: '1', name: 'Headache' },
  { id: '2', name: 'Fatigue' },
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
const [symptomPatient, setSymptomPatient] = useState<Patient | null>(null);
const [showSymptoms, setShowSymptoms] = useState(false);
const [symptomType, setSymptomType] = useState<'new' | 'old'>('new');

const [showSymptomForm, setShowSymptomForm] = useState(false);

const [showAppointmentForm, setShowAppointmentForm] = useState(false);

const [appointment, setAppointment] = useState({
  name: '',
  date: '',
  time: '',
  doctor: '',
});
const resetSymptomsPage = () => {
  setSearchName('');
  setSearchId('');
  setSymptomPatient(null);
  setShowSymptoms(false);
  setSymptomType('new');
};
const handleAppointmentSubmit = () => {
  if (!appointment.name || !appointment.date || !appointment.time) return;

  Alert.alert(
    "Appointment booked",
    `Name: ${appointment.name}\nDate: ${appointment.date}\nTime: ${appointment.time}`
  );

  setShowAppointmentForm(false);
  setAppointment({ name: '', date: '', time: '', doctor: '' });
};


const [newSymptom, setNewSymptom] = useState('');
const addSymptom = () => {
  if (!newSymptom.trim()) return;

  const exists = symptoms.some(
    (s) =>
      s.name.toLowerCase().trim() === newSymptom.trim().toLowerCase()
  );

  if (exists) {
    Alert.alert("Error", "This symptom already exists");
    return;
  }

  setSymptoms((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      name: newSymptom.trim(),
    },
  ]);

  setNewSymptom('');
  setShowSymptomForm(false);
};

const deleteSymptom = (id: string) => {
  setSymptoms((prev) => prev.filter((s) => s.id !== id));
};
const calculateProgress = () => {
  if (meds.length === 0) return 0;

  const taken = meds.filter((m) => m.status === 'taken').length;
  return Math.round((taken / meds.length) * 100);
};
const resetMedsPage = () => {
  setSearchName('');
  setSearchId('');
  setPatient(null);
  setEditMode(false);
  setShowAddForm(false);

  setMedName('');
  setMedDosage('');
  setMedFrequency('');
};
type Patient = {
  name: string;
  id: string;
};
const [searchName, setSearchName] = useState('');
const [searchId, setSearchId] = useState('');
const [patient, setPatient] = useState<Patient | null>(null);
const [editMode, setEditMode] = useState(false);
const [newMed, setNewMed] = useState('');
const [showAddForm, setShowAddForm] = useState(false);
const [medName, setMedName] = useState('');
const [medDosage, setMedDosage] = useState('');
const [medFrequency, setMedFrequency] = useState('');
const handleSearch = () => {
  if (!searchName || !searchId) return;

  setPatient({
    name: searchName,
    id: searchId,
  });
};

const handleAddMed = () => {
  if (!medName || !medDosage || !medFrequency) {
    Alert.alert("Error", "Please fill all fields");
    return;
  }

  setMeds(prev => [
    ...prev,
    {
      id: Date.now().toString(),
      name: medName,
      dosage: medDosage,
      frequency: medFrequency,
      status: '',
    }
  ]);

  // reset
  setMedName('');
  setMedDosage('');
  setMedFrequency('');
  setShowAddForm(false);
};
const deleteMed = (id: string) => {
  setMeds((prev) => prev.filter((m) => m.id !== id));
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

    {/* TITLE */}
    <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>
      {getGreeting()}
    </Text>

    <Text style={{ color: '#94A3B8', marginTop: 5 }}>
      Your clinical dashboard is active
    </Text>

    {/* IMAGE */}
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Image
        source={require('../../assets/images/docteur.jpeg')}
        style={{
          width: '100%',
          height: 200,
          borderRadius: 15,
        }}
        resizeMode="cover"
      />
    </View>

    {/* STATS CARD */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📊 Today Overview</Text>
      <Text style={styles.cardText}>
        👥 Patients today: 12{"\n"}
        📅 Appointments: 5{"\n"}
        💊 Prescriptions written: 8{"\n"}
        ⚠️ Pending follow-ups: 3
      </Text>
    </View>

    {/* CLINICAL ACTIVITY */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🏥 Clinical Activity</Text>

      <Text style={styles.cardText}>
        ✔ Review patient symptoms{"\n"}
        ✔ Monitor ongoing treatments{"\n"}
        ✔ Validate prescriptions
      </Text>
    </View>

    {/* APPOINTMENTS */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📅 Today’s Appointments</Text>

      <Text style={styles.cardText}>
        “Doctor,remember to review your appointments regularly to ensure timely follow-ups and optimal patient care.”
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/MAppointment')}
        style={{
          marginTop: 10,
          backgroundColor: '#38BDF8',
          padding: 10,
          borderRadius: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white' }}>View Schedule</Text>
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

    {/* FULL NAME */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>👤 Full Name</Text>
      {editMode ? (
        <TextInput
          value={profile?.fullName || ''}
          onChangeText={(t) =>
            setProfile({ ...profile, fullName: t })
          }
          style={styles.input}
        />
      ) : (
        <Text style={styles.cardText}>
          {profile?.fullName || 'No name set'}
        </Text>
      )}
    </View>

    {/* SPECIALTY */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🩺 Specialty</Text>
      {editMode ? (
        <TextInput
          value={profile?.specialty || ''}
          onChangeText={(t) =>
            setProfile({ ...profile, specialty: t })
          }
          style={styles.input}
        />
      ) : (
        <Text style={styles.cardText}>
          {profile?.specialty || 'No specialty set'}
        </Text>
      )}
    </View>

    {/* HOSPITAL / CLINIC */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🏥 Hospital / Clinic</Text>
      {editMode ? (
        <TextInput
          value={profile?.hospital || ''}
          onChangeText={(t) =>
            setProfile({ ...profile, hospital: t })
          }
          style={styles.input}
        />
      ) : (
        <Text style={styles.cardText}>
          {profile?.hospital || 'No hospital set'}
        </Text>
      )}
    </View>

    {/* PHONE */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📞 Phone</Text>
      {editMode ? (
        <TextInput
          value={profile?.phone || ''}
          onChangeText={(t) =>
            setProfile({ ...profile, phone: t })
          }
          style={styles.input}
        />
      ) : (
        <Text style={styles.cardText}>
          {profile?.phone || 'No phone set'}
        </Text>
      )}
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
  return (
    <View style={styles.medsContainer}>

      {/* HEADER */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

  <View>
    <Text style={styles.homeTitle}>💊 Medications</Text>
    <Text style={styles.homeSub}>Manage patient prescriptions easily</Text>
  </View>

  <TouchableOpacity onPress={resetMedsPage} style={styles.resetBtn}>
    <Ionicons name="refresh" size={20} color="white" />
  </TouchableOpacity>

</View>

      {/* SEARCH BOX */}
      <View style={styles.searchBox}>
        <Ionicons name="person-outline" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Patient name"
          placeholderTextColor="#94A3B8"
          value={searchName}
          onChangeText={setSearchName}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="id-card-outline" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Patient ID"
          placeholderTextColor="#94A3B8"
          value={searchId}
          onChangeText={setSearchId}
          style={styles.searchInput}
        />
      </View>

      <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
        <Text style={{ color: 'white', fontWeight: '600' }}>Search</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>

        {/* PATIENT CARD */}
        {patient && (
          <View style={styles.patientCard}>

            <View>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientId}>ID: {patient.id}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setEditMode(!editMode)}
              style={styles.editSmallBtn}
            >
              <Ionicons name="create-outline" size={16} color="white" />
            </TouchableOpacity>

          </View>
        )}

        {/* MED LIST */}
        {editMode && meds.map((med) => (
          <View key={med.id} style={styles.medCard}>

            <View style={styles.medIcon}>
              <Ionicons name="medkit" size={20} color="#38BDF8" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medInfo}>
                {med.dosage} • {med.frequency}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => deleteMed(med.id)}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={18} color="white" />
            </TouchableOpacity>

          </View>
        ))}

      </ScrollView>

      {/* ADD MED FLOAT */}
      {editMode && (
        <View style={styles.addContainer}>

       

          <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.addBtn}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        

        </View>
      )}
      {showAddForm && (
  <View style={styles.modal}>

    <View style={styles.formCard}>
      <Text style={styles.formTitle}>➕</Text>

      <TextInput
        placeholder="Name"
        placeholderTextColor="#94A3B8"
        value={medName}
        onChangeText={setMedName}
        style={styles.input}
      />

      <TextInput
        placeholder="Dosage (ex: 500mg)"
        placeholderTextColor="#94A3B8"
        value={medDosage}
        onChangeText={setMedDosage}
        style={styles.input}
      />

      <TextInput
        placeholder="Frequency (ex: Morning)"
        placeholderTextColor="#94A3B8"
        value={medFrequency}
        onChangeText={setMedFrequency}
        style={styles.input}
      />

      <View style={{ flexDirection: 'row', marginTop: 15 }}>

        <TouchableOpacity
          onPress={() => setShowAddForm(false)}
          style={styles.cancelBtn}
        >
          <Text style={{ color: 'white' }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddMed}
          style={styles.saveBtn}
        >
          <Text style={{ color: 'white' }}>Add</Text>
        </TouchableOpacity>

      </View>
    </View>

  </View>
)}

    </View>
  );
};
const renderSymptoms = () => {
  return (
    <View style={styles.medsContainer}>

      {/* HEADER */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

  <View>
    <Text style={styles.homeTitle}>🤒 Symptoms</Text>
    <Text style={styles.homeSub}>Search patient symptoms history</Text>
  </View>

  <TouchableOpacity onPress={resetSymptomsPage} style={styles.resetBtn}>
    <Ionicons name="refresh" size={20} color="white" />
  </TouchableOpacity>

</View>
      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="person-outline" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Patient name"
          placeholderTextColor="#94A3B8"
          value={searchName}
          onChangeText={setSearchName}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="id-card-outline" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Patient ID"
          placeholderTextColor="#94A3B8"
          value={searchId}
          onChangeText={setSearchId}
          style={styles.searchInput}
        />
      </View>

      <TouchableOpacity
        onPress={() => {
          if (!searchName || !searchId) return;

          setSymptomPatient({
            name: searchName,
            id: searchId,
          });
        }}
        style={styles.searchBtn}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Search</Text>
      </TouchableOpacity>

      {/* PATIENT CARD */}
      {symptomPatient && (
        <View style={styles.patientCard}>

          <View>
            <Text style={styles.patientName}>{symptomPatient.name}</Text>
            <Text style={styles.patientId}>ID: {symptomPatient.id}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowSymptoms(true)}
            style={{
              backgroundColor: '#38BDF8',
              padding: 8,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Ionicons name="eye-outline" size={16} color="white" />
            <Text style={{ color: 'white', fontSize: 12 }}>View</Text>
          </TouchableOpacity>

        </View>
      )}

      {/* TYPE SWITCH */}
      {showSymptoms && (
        <View style={{ flexDirection: 'row', marginBottom: 15 }}>

          <TouchableOpacity
            onPress={() => setSymptomType('new')}
            style={[
              styles.typeBtn,
              symptomType === 'new' && styles.typeBtnActive
            ]}
          >
            <Text style={{ color: 'white' }}>New</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSymptomType('old')}
            style={[
              styles.typeBtn,
              symptomType === 'old' && styles.typeBtnActive
            ]}
          >
            <Text style={{ color: 'white' }}>Old</Text>
          </TouchableOpacity>

        </View>
      )}

      {/* SYMPTOMS LIST */}
      {showSymptoms && (
        <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>

          {symptoms.map((s) => (
            <View key={s.id} style={styles.medCard}>

              <View style={styles.medIcon}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{s.name}</Text>
              </View>

              <View style={{
                backgroundColor: symptomType === 'new' ? '#38BDF8' : '#64748B',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
              }}>
                <Text style={{ color: 'white', fontSize: 11 }}>
                  {symptomType.toUpperCase()}
                </Text>
              </View>

            </View>
          ))}

        </ScrollView>
      )}

    </View>
  );
};
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
searchBox: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderRadius: 12,
  paddingHorizontal: 12,
  marginBottom: 10,
},

searchInput: {
  flex: 1,
  color: 'white',
  padding: 10,
},

searchBtn: {
  backgroundColor: '#38BDF8',
  padding: 12,
  borderRadius: 12,
  alignItems: 'center',
  marginBottom: 15,
},

patientCard: {
  backgroundColor: 'rgba(56,189,248,0.15)',
  padding: 16,
  borderRadius: 16,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
},

patientName: {
  color: 'white',
  fontWeight: '700',
  fontSize: 16,
},

patientId: {
  color: '#94A3B8',
  fontSize: 12,
},

editSmallBtn: {
  backgroundColor: '#38BDF8',
  padding: 8,
  borderRadius: 10,
},

medCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.05)',
  padding: 14,
  borderRadius: 16,
  marginBottom: 10,
},

medIcon: {
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: 'rgba(56,189,248,0.15)',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},

medName: {
  color: 'white',
  fontWeight: '600',
},

medInfo: {
  color: '#94A3B8',
  fontSize: 12,
},

deleteBtn: {
  backgroundColor: '#EF4444',
  padding: 10,
  borderRadius: 10,
},

addContainer: {
  position: 'absolute',
  bottom: 110,
  right: 20,
  flexDirection: 'row',
  alignItems: 'center',
},

addInput: {
  backgroundColor: 'rgba(255,255,255,0.08)',
  color: 'white',
  padding: 10,
  borderRadius: 12,
  width: 160,
  marginRight: 10,
},

addBtn: {
  width: 55,
  height: 55,
  borderRadius: 28,
  backgroundColor: '#38BDF8',
  justifyContent: 'center',
  alignItems: 'center',
},
formCard: {
  width: isTabletOrDesktop ? 400 : '85%',
  backgroundColor: '#0F172A',
  padding: 20,
  borderRadius: 20,
},

cancelBtn: {
  flex: 1,
  backgroundColor: '#EF4444',
  padding: 12,
  borderRadius: 10,
  alignItems: 'center',
  marginRight: 5,
},

saveBtn: {
  flex: 1,
  backgroundColor: '#38BDF8',
  padding: 12,
  borderRadius: 10,
  alignItems: 'center',
  marginLeft: 5,
},
resetBtn: {
  backgroundColor: 'rgba(56,189,248,0.2)',
  padding: 10,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#38BDF8',
},
typeBtn: {
  flex: 1,
  padding: 12,
  backgroundColor: 'rgba(255,255,255,0.05)',
  marginRight: 5,
  borderRadius: 12,
  alignItems: 'center',
},

typeBtnActive: {
  backgroundColor: '#38BDF8',
},

});