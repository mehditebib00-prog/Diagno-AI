import React, { useState } from 'react';
import api from '../services/api';

const SymptomForm = ({ onSymptomAdded }) => {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const patientId = JSON.parse(localStorage.getItem('user')).id;
      await api.post('/symptoms', { description, date, patientId });
      alert('Symptom added successfully');
      setDescription('');
      setDate('');
      if (onSymptomAdded) onSymptomAdded();
    } catch (error) {
      alert('Error adding symptom');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3>Add Symptom</h3>
      <div className="form-group">
        <label>Description:</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Date:</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <button type="submit">Add Symptom</button>
    </form>
  );
};

export default SymptomForm;