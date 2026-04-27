import { useState } from 'react';

export default function HospitalAppointments() {
  const [filter, setFilter] = useState('all');
  const [appointments] = useState([
    { id: 1, patient: 'Rajesh Kumar', phone: '9876543001', dept: 'Cardiology', date: '2026-04-27', time: '10:00', type: 'regular', status: 'confirmed', priority: 3 },
    { id: 2, patient: 'Priya Sharma', phone: '9876543002', dept: 'General Medicine', date: '2026-04-27', time: '10:30', type: 'follow_up', status: 'pending', priority: 2 },
    { id: 3, patient: 'Amit Patel', phone: '9876543003', dept: 'Emergency', date: '2026-04-27', time: '11:00', type: 'emergency', status: 'confirmed', priority: 1 },
    { id: 4, patient: 'Sunita Devi', phone: '9876543004', dept: 'Pediatrics', date: '2026-04-27', time: '11:30', type: 'regular', status: 'pending', priority: 3 },
    { id: 5, patient: 'Mohammed Ali', phone: '9876543005', dept: 'Orthopedics', date: '2026-04-27', time: '14:00', type: 'consultation', status: 'confirmed', priority: 3 },
  ]);

  const statusColors = { pending: 'warning', confirmed: 'primary', in_progress: 'info', completed: 'success', cancelled: 'danger' };
  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter || a.type === filter);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header"><h1>📥 Patient Appointments</h1><p>View and manage incoming patient bookings & emergencies</p></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'emergency'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Priority</th><th>Patient</th><th>Department</th><th>Date/Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.sort((a, b) => a.priority - b.priority).map(a => (
              <tr key={a.id}>
                <td><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: a.priority === 1 ? 'var(--danger)' : a.priority === 2 ? 'var(--warning)' : 'var(--success)' }} /></td>
                <td><div style={{ fontWeight: 600 }}>{a.patient}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.phone}</div></td>
                <td>{a.dept}</td>
                <td>{a.date} • {a.time}</td>
                <td><span className={`badge badge-${a.type === 'emergency' ? 'danger' : 'info'}`}>{a.type}</span></td>
                <td><span className={`badge badge-${statusColors[a.status]}`}>{a.status}</span></td>
                <td><button className="btn btn-ghost btn-sm">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
