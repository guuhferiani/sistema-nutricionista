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
      <div className="loading-container">
        <div className="spinner-premium"></div>
        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Criando Plano Personalizado</h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '300px' }}>
          Nossa IA está analisando os dados de <strong>{patient.nome}</strong> para elaborar a melhor estratégia nutricional...
        </p>
      </div>
    );
  }

  if (!editingPlan) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ marginBottom: '2rem', color: 'var(--primary)' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--primary-light)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          </div>
        </div>
        <h2 style={{ marginBottom: '1rem' }}>Gerador de Plano com IA</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
          Utilizaremos inteligência artificial avançada para cruzar dados antropométricos, objetivos clínicos e restrições alimentares, gerando um plano semanal completo.
        </p>
        <button className="btn-primary" onClick={generatePlan} style={{ padding: '1rem 2.5rem', fontSize: '1rem', margin: '0 auto' }}>
          Iniciar Geração Inteligente
        </button>
      </div>
    );
  }

  return (
    <div className="diet-results-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Sugestão de Plano Semanal</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Revise e ajuste as opções abaixo antes de salvar.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => setEditingPlan(null)}>Recomeçar</button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Imprimir / PDF
            </button>
            <button className="btn-primary" onClick={savePlan} disabled={saving} style={{ width: 'auto' }}>
              {saving ? 'Salvando...' : 'Salvar Plano Alimentar'}
            </button>
          </div>
        </div>
      </header>

      <div className="diet-grid">
        {editingPlan.plano_semanal.map((dia, dayIdx) => (
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

export default DietPlanGenerator;
