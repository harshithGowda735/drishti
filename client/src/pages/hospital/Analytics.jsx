export default function Analytics() {
  const monthlyData = [
    { month: 'Jan', patients: 420, emergency: 35, revenue: 12 },
    { month: 'Feb', patients: 380, emergency: 28, revenue: 11 },
    { month: 'Mar', patients: 510, emergency: 42, revenue: 15 },
    { month: 'Apr', patients: 470, emergency: 38, revenue: 14 },
  ];

  const departments = [
    { name: 'General Medicine', patients: 156, load: 78 },
    { name: 'Cardiology', patients: 89, load: 65 },
    { name: 'Orthopedics', patients: 67, load: 45 },
    { name: 'Pediatrics', patients: 93, load: 55 },
    { name: 'Emergency', patients: 120, load: 90 },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header"><h1>📈 Analytics Dashboard</h1><p>Patient flow, resource usage & performance metrics</p></div>

      {/* Monthly chart (bar representation) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>📊 Monthly Patient Flow</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 200, padding: '0 20px' }}>
          {monthlyData.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end', height: 160 }}>
                <div style={{ width: 20, height: `${(d.patients / 600) * 160}px`, background: 'var(--gradient-primary)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} title={`Patients: ${d.patients}`} />
                <div style={{ width: 20, height: `${(d.emergency / 50) * 160}px`, background: 'var(--gradient-danger)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} title={`Emergency: ${d.emergency}`} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>{d.month}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)' }} /> Patients</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger)' }} /> Emergency</div>
        </div>
      </div>

      {/* Department Load */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>🏥 Department Load</h3>
        {departments.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < departments.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 140, fontSize: '0.88rem', fontWeight: 600 }}>{d.name}</div>
            <div style={{ flex: 1 }}>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${d.load}%`, background: d.load > 80 ? 'var(--danger)' : d.load > 60 ? 'var(--warning)' : 'var(--success)' }} />
              </div>
            </div>
            <div style={{ width: 60, textAlign: 'right', fontSize: '0.85rem', fontWeight: 700 }}>{d.load}%</div>
            <div style={{ width: 80, textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{d.patients} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}
