import React, { useState } from 'react';
import api from '../services/api';

const MedicationForm = () => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const patientId = JSON.parse(localStorage.getItem('user')).id;
      await api.post('/medications', { name, dosage, patientId });
      alert('Medication added successfully');
      setName('');
      setDosage('');
    } catch (error) {
      alert('Error adding medication');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3>Add Medication</h3>
      <div className="form-group">
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Dosage:</label>
        <input
          type="text"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          required
        />
      </div>
      <button type="submit">Add Medication</button>
    </form>
  );
};

export default MedicationForm;