import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { generateCustomId } from '../../utils/idGenerator';
import '../../styles/form.css';
import { useNavigate } from 'react-router-dom';

const BlindSignup = () => {
  const [form, setForm] = useState({ name: '', age: '', gender: '' });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: countData } = await supabase
      .from('blind_users')
      .select('id', { count: 'exact', head: true });
    const blindId = generateCustomId('BLIND', countData || 0);

    const { error } = await supabase.from('blind_users').insert([
      {
        name: form.name,
        age: form.age,
        gender: form.gender,
        blind_id: blindId,
      },
    ]);

    if (!error) {
      alert(`Registration successful! Your Blind ID is ${blindId}`);
      navigate('/blind/login');
    } else {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Blind User Signup</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Enter your age"
          onChange={handleChange}
          required
        />
        <select name="gender" onChange={handleChange} required>
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default BlindSignup;
