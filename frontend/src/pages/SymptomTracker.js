import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SymptomForm from '../components/SymptomForm';
import api from '../services/api';

const SymptomTracker = () => {
  const [symptoms, setSymptoms] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    fetchSymptoms(userData.id);
  }, [navigate]);

  const fetchSymptoms = async (patientId) => {
    try {
      const response = await api.get(`/symptoms/patient/${patientId}`);
      setSymptoms(response.data);
    } catch (error) {
      console.error('Error fetching symptoms', error);
    }
  };

  const handleAnalyze = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await api.post(`/ai/analyze?patientId=${userData.id}`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing symptoms', error);
    }
  };

  return (
    <div className="symptom-tracker">
      <h1>Symptom Tracker</h1>
      <SymptomForm onSymptomAdded={() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        fetchSymptoms(userData.id);
      }} />
      <div className="symptoms-list">
        <h2>Your Symptoms</h2>
        <ul>
          {symptoms.map(symptom => (
            <li key={symptom.id}>{symptom.description} - {new Date(symptom.date).toLocaleString()}</li>
          ))}
        </ul>
      </div>
      <button onClick={handleAnalyze}>Analyze Symptoms with AI</button>
      {analysis && (
        <div className="analysis">
          <h3>AI Analysis</h3>
          <p>{analysis}</p>
        </div>
      )}
    </div>
  );
};

export default SymptomTracker;