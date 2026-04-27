import { useState, useEffect } from 'react';
import * as api from '../../services/api';

export default function DoctorManagement({ user }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDoctor, setNewDoctor] = useState({ name: '', department: '', phone: '', availability: 'available' });

  useEffect(() => {
    // In a real app, we'd fetch doctors for this specific hospital
    // For the demo, we'll use a mocked list or fetch from hospital data
    loadDoctors();
  }, [user?.hospitalId]);

  const loadDoctors = async () => {
    try {
      // Mocked doctors for demo
      setDoctors([
        { id: '1', name: 'Dr. Sarah Wilson', department: 'Cardiology', phone: '9876543210', availability: 'available' },
        { id: '2', name: 'Dr. James Bond', department: 'Surgery', phone: '9876543211', availability: 'on_call' },
        { id: '3', name: 'Dr. Emily Blunt', department: 'Pediatrics', phone: '9876543212', availability: 'busy' }
      ]);
    } catch {}
    setLoading(false);
  };

  const handleAddDoctor = (e) => {
    e.preventDefault();
    setDoctors([...doctors, { ...newDoctor, id: Date.now().toString() }]);
    setNewDoctor({ name: '', department: '', phone: '', availability: 'available' });
  };

  const handleDeleteDoctor = (id) => {
    setDoctors(doctors.filter(d => d.id !== id));
  };

  const toggleAvailability = (id) => {
    setDoctors(doctors.map(d => {
      if (d.id === id) {
        const next = d.availability === 'available' ? 'busy' : d.availability === 'busy' ? 'on_call' : 'available';
        return { ...d, availability: next };
      }
      return d;
    }));
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>👨‍⚕️ Doctor Management</h1>
        <p>Manage hospital staff, departments, and real-time availability</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Add Doctor Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Add New Doctor</h3>
          <form onSubmit={handleAddDoctor} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Full Name</label>
              <input 
                className="input-field" 
                required 
                value={newDoctor.name}
                onChange={e => setNewDoctor({...newDoctor, name: e.target.value})}
                placeholder="Dr. Name"
              />
            </div>
            <div className="input-group">
              <label>Department</label>
              <select 
                className="input-field" 
                required 
                value={newDoctor.department}
                onChange={e => setNewDoctor({...newDoctor, department: e.target.value})}
              >
                <option value="">Select Dept</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Surgery">Surgery</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="General Medicine">General Medicine</option>
              </select>
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input 
                className="input-field" 
                required 
                value={newDoctor.phone}
                onChange={e => setNewDoctor({...newDoctor, phone: e.target.value})}
                placeholder="987..."
              />
            </div>
            <button className="btn btn-primary btn-block">Add Doctor</button>
          </form>
        </div>

        {/* Doctor List */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Staff Directory</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {doctors.map(d => (
              <div key={d.id} className="card-glass" style={{ padding: 16, position: 'relative' }}>
                <button 
                  onClick={() => handleDeleteDoctor(d.id)}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem' }}
                >✕</button>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>👨‍⚕️</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{d.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.department}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge badge-${d.availability === 'available' ? 'success' : d.availability === 'busy' ? 'danger' : 'warning'}`}>
                    {d.availability.replace('_', ' ')}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleAvailability(d.id)}>Toggle</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
