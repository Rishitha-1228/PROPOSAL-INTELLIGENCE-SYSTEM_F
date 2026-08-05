import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpportunities } from '../services/api';
import ProcessingState from "../components/ProcessingState";
export default function Dashboard() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('pis_user') || '{}');

  useEffect(() => {
    // Redirect if not logged in
    const token = localStorage.getItem('pis_token');
    if (!token) { navigate('/'); return; }
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const data = await getOpportunities();
      setOpportunities(data.data || []);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const stats = [
    { title: 'Total opportunities', value: opportunities.length },
    { title: 'Interpreted', value: opportunities.filter(o => o.status === 'interpreted').length },
    { title: 'Questions ready', value: opportunities.filter(o => o.status === 'questions_ready').length },
    { title: 'Approach note written', value: opportunities.filter(o => o.status === 'approach_note_written').length },
    { title: 'Ready to export', value: opportunities.filter(o => o.status === 'ready_to_export').length },
  ];

  return (
    <div style={{ background: '#f5f7fb', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '42px', color: '#0f172a', fontWeight: '800' }}>
              🚀 Dashboard
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Welcome back, {user.first_name} · {user.role}
            </p>
          </div>
          <button onClick={handleLogout} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #dbe2ea', background: 'white', cursor: 'pointer', fontSize: '14px' }}>
            Logout
          </button>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {stats.map((card, i) => (
            <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #dbe2ea', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>{card.title}</p>
              <h2 style={{ color: '#0f172a', fontSize: '42px', fontWeight: '800', margin: 0 }}>{card.value}</h2>
            </div>
          ))}
        </div>

        {/* OPPORTUNITIES TABLE */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #dbe2ea', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          {/* TABLE HEADER */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr', padding: '20px', background: '#f8fafc', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
            <div>Client</div>
            <div>Goals</div>
            <div>Created</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : opportunities.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '18px' }}>
              No opportunities yet — create your first one!
            </div>
          ) : (
            opportunities.map((opp) => (
              <div key={opp._id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr', padding: '18px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: '14px', color: '#334155' }}>
                <div style={{ fontWeight: '600' }}>{opp.client_name}</div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>{opp.interpreted?.goals?.[0] || 'Not interpreted yet'}</div>
                <div>{new Date(opp.createdAt).toLocaleDateString()}</div>
                <div>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: opp.status === 'ready_to_export' ? '#dcfce7' : '#e0f2fe', color: opp.status === 'ready_to_export' ? '#16a34a' : '#0369a1' }}>
                    {opp.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => { localStorage.setItem('pis_opportunity_id', opp._id); navigate('/questions'); }}
                    style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                  >
                    Open →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '28px' }}>
            <button
  onClick={() => {
    // Explicit "start fresh" action from the Dashboard — clear any
    // in-progress intake form/analysis/opportunity ID, so the New
    // Opportunity page opens blank instead of restoring old work.
    localStorage.removeItem('pis_intake_state');
    localStorage.removeItem('pis_opportunity_id');
    navigate('/new');
  }}
  style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}
>
  + New Opportunity
</button>
          <button
            onClick={loadOpportunities}
            style={{ flex: 1, padding: '18px', borderRadius: '16px', border: '1px solid #dbe2ea', background: 'white', color: '#0f172a', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>

      </div>
    </div>
  );
}