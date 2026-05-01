import React, { useState } from 'react';

const DietPlanHistory = ({ planos }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const mealLabels = {
    cafe_da_manha: '☀️ Café da Manhã',
    lanche_manha: '🍎 Lanche da Manhã',
    almoco: '🥗 Almoço',
    lanche_tarde: '🥨 Lanche da Tarde',
    jantar: '🍲 Jantar'
  };

  if (selectedPlan) {
    return (
      <div className="plan-view">
        <button 
          className="btn-secondary" 
          onClick={() => setSelectedPlan(null)}
          style={{ width: 'auto', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Voltar para a Lista
        </button>

        <header style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: 0 }}>Plano de {new Date(selectedPlan.created_at).toLocaleDateString('pt-BR')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {selectedPlan.id.substring(0, 8)}</p>
        </header>

        <div className="diet-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {selectedPlan.conteudo.plano_semanal.map((dia) => (
            <div key={dia.dia} className="day-column" style={{ width: '100%' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
                {dia.dia}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(dia.refeicoes).map(([mealKey, options]) => (
                  <div key={mealKey} className="meal-card" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--primary)' }}>
                      {mealLabels[mealKey] || mealKey}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {options.map((opt, idx) => (
                        <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-main)', borderLeft: '3px solid var(--primary-light)', paddingLeft: '0.5rem' }}>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="history-list">
      {planos.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {planos.map(p => (
            <div 
              key={p.id} 
              className="meal-plan-item" 
              onClick={() => setSelectedPlan(p)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div>
                  <div className="meal-plan-date" style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                    Plano Gerado em {new Date(p.created_at).toLocaleDateString('pt-BR')} às {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {p.id.substring(0, 8)}...</div>
                </div>
              </div>
              <div className="meal-plan-status" style={{ color: 'var(--primary)', fontWeight: '600' }}>Visualizar →</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <p>Nenhum plano alimentar gerado ainda para este paciente.</p>
        </div>
      )}
    </div>
  );
};

export default DietPlanHistory;
