import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const DietPlanHistory = ({ planos }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(null);
  const [saving, setSaving] = useState(false);

  const mealLabels = {
    cafe_da_manha: '☀️ Café da Manhã',
    lanche_manha: '🍎 Lanche da Manhã',
    almoco: '🥗 Almoço',
    lanche_tarde: '🥨 Lanche da Tarde',
    jantar: '🍲 Jantar'
  };

  const startEditing = () => {
    setEditedContent(JSON.parse(JSON.stringify(selectedPlan.conteudo)));
    setIsEditing(true);
  };

  const handleOptionChange = (dayIndex, mealKey, optionIndex, newValue) => {
    const newContent = { ...editedContent };
    newContent.plano_semanal[dayIndex].refeicoes[mealKey][optionIndex] = newValue;
    setEditedContent(newContent);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('planos_alimentares')
        .update({ conteudo: editedContent })
        .eq('id', selectedPlan.id);

      if (error) throw error;

      alert('Plano alimentar atualizado com sucesso!');
      selectedPlan.conteudo = editedContent;
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao atualizar plano alimentar.');
    } finally {
      setSaving(false);
    }
  };

  if (selectedPlan) {
    return (
      <div className="plan-view">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button 
            className="btn-secondary" 
            onClick={() => { setSelectedPlan(null); setIsEditing(false); }}
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Voltar para a Lista
          </button>

          {!isEditing ? (
            <button className="btn-primary" onClick={startEditing} style={{ width: 'auto' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Editar Plano
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setIsEditing(false)} style={{ width: 'auto' }}>Cancelar</button>
              <button className="btn-primary" onClick={saveChanges} disabled={saving} style={{ width: 'auto' }}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </div>

        <header style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: 0 }}>Plano de {new Date(selectedPlan.created_at).toLocaleDateString('pt-BR')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {selectedPlan.id.substring(0, 8)}</p>
        </header>

        <div className="diet-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {(isEditing ? editedContent : selectedPlan.conteudo).plano_semanal.map((dia, dayIdx) => (
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
                    
                    {!isEditing ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {options.map((opt, idx) => (
                          <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-main)', borderLeft: '3px solid var(--primary-light)', paddingLeft: '0.5rem' }}>
                            {opt}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {options.map((opt, optIdx) => (
                          <input 
                            key={optIdx}
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(dayIdx, mealKey, optIdx, e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '0.5rem', 
                              borderRadius: '0.5rem', 
                              border: '1px solid #f0f0f0', 
                              fontSize: '0.85rem' 
                            }}
                          />
                        ))}
                      </div>
                    )}
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
