import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DietPlanManual = ({ patient, initialPlan = null, onSaveSuccess, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan.conteudo);
    } else {
      // Initialize empty structure
      const emptyPlan = {
        plano_semanal: [
          'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
        ].map(dia => ({
          dia,
          refeicoes: {
            cafe_da_manha: ['', '', '', '', ''],
            lanche_manha: ['', '', '', '', ''],
            almoco: ['', '', '', '', ''],
            lanche_tarde: ['', '', '', '', ''],
            jantar: ['', '', '', '', '']
          }
        }))
      };
      setPlan(emptyPlan);
    }
  }, [initialPlan]);

  const handleOptionChange = (dayIndex, mealKey, optionIndex, newValue) => {
    const newPlan = { ...plan };
    newPlan.plano_semanal[dayIndex].refeicoes[mealKey][optionIndex] = newValue;
    setPlan(newPlan);
  };

  const savePlan = async () => {
    try {
      setSaving(true);
      
      const payload = {
        paciente_id: patient.id,
        conteudo: plan
      };

      let result;
      if (initialPlan?.id) {
        // Update existing
        result = await supabase
          .from('planos_alimentares')
          .update(payload)
          .eq('id', initialPlan.id);
      } else {
        // Insert new
        result = await supabase
          .from('planos_alimentares')
          .insert([payload]);
      }

      if (result.error) throw result.error;

      alert(initialPlan?.id ? 'Plano atualizado com sucesso!' : 'Plano salvo com sucesso!');
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar plano alimentar.');
    } finally {
      setSaving(false);
    }
  };

  const mealLabels = {
    cafe_da_manha: '☀️ Café da Manhã',
    lanche_manha: '🍎 Lanche da Manhã',
    almoco: '🥗 Almoço',
    lanche_tarde: '🥨 Lanche da Tarde',
    jantar: '🍲 Jantar'
  };

  if (!plan) return null;

  return (
    <div className="diet-results-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{initialPlan ? 'Editar Plano Alimentar' : 'Novo Plano Alimentar (Manual)'}</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Preencha as opções de refeição para cada dia da semana.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir / PDF
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={savePlan} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Plano'}
          </button>
        </div>
      </header>

      <div className="diet-grid">
        {plan.plano_semanal.map((dia, dayIdx) => (
          <div key={dia.dia} className="day-column">
            <div className="day-header">
              {dia.dia}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(dia.refeicoes).map(([mealKey, options]) => (
                <div key={mealKey} className="meal-card">
                  <div className="meal-title">
                    {mealLabels[mealKey] || mealKey}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {options.map((opt, optIdx) => (
                      <input 
                        key={optIdx}
                        type="text"
                        className="option-input"
                        value={opt}
                        onChange={(e) => handleOptionChange(dayIdx, mealKey, optIdx, e.target.value)}
                        placeholder={`Opção ${optIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DietPlanManual;
