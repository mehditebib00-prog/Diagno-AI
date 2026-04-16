import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);

    // Fetch data
    const fetchData = async () => {
      try {
        const [symptomsRes, medsRes, apptsRes] = await Promise.all([
          api.get(`/symptoms/patient/${userData.id}`),
          api.get(`/medications/patient/${userData.id}`),
          api.get(`/appointments/patient/${userData.id}`)
        ]);
        setSymptoms(symptomsRes.data);
        setMedications(medsRes.data);
        setAppointments(apptsRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };

    fetchData();
  }, [navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Welcome to DiagnoAI, {user.name}</h1>
      <div className="dashboard-sections">
        <section>
          <h2>Your Symptoms</h2>
          <ul>
            {symptoms.map(symptom => (
              <li key={symptom.id}>{symptom.description} - {new Date(symptom.date).toLocaleString()}</li>
            ))}
          </ul>
          <button onClick={() => navigate('/symptoms')}>Add Symptom</button>
        </section>
        <section>
          <h2>Your Medications</h2>
          <ul>
            {medications.map(med => (
              <li key={med.id}>{med.name} - {med.dosage}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Your Appointments</h2>
          <ul>
            {appointments.map(appt => (
              <li key={appt.id}>{appt.doctorName} - {new Date(appt.date).toLocaleString()}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;