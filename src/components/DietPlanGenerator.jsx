import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const DietPlanGenerator = ({ patient, onSaveSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const generatePlan = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dados_do_paciente: {
            nome: patient.nome,
            objetivos: patient.objetivos,
            objetivo_texto: patient.objetivo_texto,
            restricoes_alimentares: patient.restricoes_alimentares,
            alergias: patient.alergias,
            peso_inicial: patient.peso_inicial,
            altura: patient.altura,
            nivel_atividade: patient.nivel_atividade,
            patologias: patient.patologias,
            refeicoes_por_dia: patient.refeicoes_por_dia
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar plano');
      }

      const data = await response.json();
      setGeneratedPlan(data);
      setEditingPlan(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar plano alimentar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (dayIndex, mealKey, optionIndex, newValue) => {
    const newPlan = { ...editingPlan };
    newPlan.plano_semanal[dayIndex].refeicoes[mealKey][optionIndex] = newValue;
    setEditingPlan(newPlan);
  };

  const savePlan = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('planos_alimentares')
        .insert([
          {
            paciente_id: patient.id,
            conteudo: editingPlan
          }
        ]);

      if (error) throw error;

      alert('Plano alimentar salvo com sucesso!');
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

  if (loading) {
    return (
      <div className="loading-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>A IA está elaborando um plano personalizado para {patient.nome}...</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Isso pode levar alguns segundos.</p>
      </div>
    );
  }

  if (!editingPlan) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
        <h3>Gerador de Plano com IA</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto 2rem' }}>
          Utilizaremos os dados clínicos, objetivos e restrições de {patient.nome} para criar um plano semanal equilibrado.
        </p>
        <button className="btn-primary" onClick={generatePlan} style={{ width: 'auto' }}>
          Gerar Plano Agora
        </button>
      </div>
    );
  }

  return (
    <div className="diet-generator-results">
      <header style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: 0 }}>Plano de {new Date().toLocaleDateString('pt-BR')}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {editingPlan.id?.substring(0, 8) || 'Novo'}</p>
      </header>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => setEditingPlan(null)} style={{ width: 'auto' }}>Recomeçar</button>
        <button className="btn-primary" onClick={savePlan} disabled={saving} style={{ width: 'auto' }}>
          {saving ? 'Salvando...' : 'Salvar no Prontuário'}
        </button>
      </div>

      <div className="diet-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {editingPlan.plano_semanal.map((dia, dayIdx) => (
          <div key={dia.dia} className="day-column" style={{ width: '100%' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
              {dia.dia}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(dia.refeicoes).map(([mealKey, options]) => (
                <div key={mealKey} className="meal-card" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--primary)' }}>
                    {mealLabels[mealKey] || mealKey}
                  </div>
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DietPlanGenerator;
