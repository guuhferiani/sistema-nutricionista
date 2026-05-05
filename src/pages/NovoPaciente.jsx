import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const NovoPaciente = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pessoal');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    restricoes_alimentares: [],
    alergias: [],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  const [imc, setImc] = useState(null);
  const [idade, setIdade] = useState(null);

  // Cálculos automáticos
  useEffect(() => {
    if (formData.peso_inicial && formData.altura) {
      const hStr = String(formData.altura).replace(',', '.');
      const wStr = String(formData.peso_inicial).replace(',', '.');
      const h = parseFloat(hStr) / 100;
      const w = parseFloat(wStr);
      if (h > 0) {
        setImc((w / (h * h)).toFixed(1));
      }
    } else {
      setImc(null);
    }
  }, [formData.peso_inicial, formData.altura]);

  useEffect(() => {
    if (formData.data_nascimento) {
      const birth = new Date(formData.data_nascimento);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      setIdade(age);
    } else {
      setIdade(null);
    }
  }, [formData.data_nascimento]);

  const maskPhone = (value) => {
    if (!value) return "";
    let cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length > 11) cleanValue = cleanValue.slice(0, 11);
    
    if (cleanValue.length > 10) {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleanValue.length > 6) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (cleanValue.length > 2) {
      return cleanValue.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      return cleanValue;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    
    if (name === 'whatsapp') {
      finalValue = maskPhone(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => {
      const current = prev[name];
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter(i => i !== value) };
      } else {
        return { ...prev, [name]: [...current, value] };
      }
    });
  };

  const formatTimeInput = (value) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 2) return clean.padStart(2, '0') + ':00';
    if (clean.length === 3) return '0' + clean.slice(0, 1) + ':' + clean.slice(1);
    if (clean.length === 4) return clean.slice(0, 2) + ':' + clean.slice(2);
    return value;
  };

  const handleBlurTime = (name) => {
    const value = formData[name];
    if (value && !value.includes(':')) {
      setFormData(prev => ({ ...prev, [name]: formatTimeInput(value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) return alert('Por favor, informe o nome completo.');

    try {
      setLoading(true);
      setError(null);

      // Limpar dados antes de enviar (evita erro de tipo em campos numéricos/data)
      const dataToSave = { ...formData };
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === '' || (Array.isArray(dataToSave[key]) && dataToSave[key].length === 0)) {
          dataToSave[key] = null;
        }
      });

      const { data, error: insertError } = await supabase
        .from('pacientes')
        .insert([{
          ...dataToSave,
          nutricionista_id: user.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        navigate(`/pacientes/${data.id}`);
      }, 1500);

    } catch (err) {
      console.error(err);
      setError('Erro ao salvar paciente. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getImcClass = () => {
    if (!imc) return '';
    const val = parseFloat(imc);
    if (val < 18.5) return 'imc-alerta';
    if (val < 25) return 'imc-normal';
    if (val < 30) return 'imc-alerta';
    return 'imc-perigo';
  };

  const objetivosOptions = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
  const nivelAtividadeOptions = ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'];
  const patologiasOptions = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
  const restricoesOptions = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
  const alergiasOptions = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <header className="page-header" style={{ marginBottom: '1.5rem' }}>
          <h2>Novo Paciente</h2>
          <p style={{ color: 'var(--text-muted)' }}>Preencha os dados para cadastrar um novo acompanhamento.</p>
        </header>

        {success && (
          <div className="error-message" style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}>
            Paciente cadastrado com sucesso! Redirecionando...
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="tabs-container">
          <div style={{ padding: '1.5rem 2.5rem 0.5rem' }}>
            <div className="progress-bar-container" style={{ height: '6px', background: '#f0f0f0', borderRadius: '10px', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  height: '100%', 
                  background: 'var(--primary)', 
                  width: activeTab === 'pessoal' ? '33%' : activeTab === 'clinico' ? '66%' : '100%',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 10px var(--primary-glass)'
                }} 
              />
            </div>
          </div>
          
          <div className="tabs-header">
            <button type="button" className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`} onClick={() => setActiveTab('pessoal')}>
              <span className="step-number">1</span> Pessoal
            </button>
            <button type="button" className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`} onClick={() => setActiveTab('clinico')}>
              <span className="step-number">2</span> Clínico
            </button>
            <button type="button" className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`} onClick={() => setActiveTab('habitos')}>
              <span className="step-number">3</span> Hábitos
            </button>
          </div>

          <form className="tab-content" onSubmit={handleSubmit}>
            {activeTab === 'pessoal' && (
              <div className="form-grid">
                <div className="form-group form-full">
                  <label>Nome Completo *</label>
                  <input type="text" name="nome" value={formData.nome} onChange={handleChange} required placeholder="Ex: João da Silva" />
                </div>
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} style={{ flex: 1 }} />
                    {idade !== null && <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{idade} anos</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label>Sexo</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-group input" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="form-group form-full">
                  <label>WhatsApp</label>
                  <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(00) 00000-0000" />
                </div>
                <div className="form-group form-full">
                  <label>E-mail</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="joao@exemplo.com" />
                </div>
              </div>
            )}

            {activeTab === 'clinico' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Peso Atual</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" name="peso_inicial" value={formData.peso_inicial} onChange={handleChange} />
                    <span className="input-suffix">kg</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Altura</label>
                  <div className="input-wrapper">
                    <input type="number" name="altura" value={formData.altura} onChange={handleChange} />
                    <span className="input-suffix">cm</span>
                  </div>
                </div>
                
                <div className="form-group form-full">
                  <label>IMC (Calculado)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="text" value={imc || '--'} readOnly style={{ width: '100px', textAlign: 'center', background: '#f3f4f6' }} />
                    {imc && <span className={`imc-badge ${getImcClass()}`}>
                      {parseFloat(imc) < 18.5 ? 'Abaixo do peso' : 
                       parseFloat(imc) < 25 ? 'Peso normal' : 
                       parseFloat(imc) < 30 ? 'Sobrepeso' : 'Obesidade'}
                    </span>}
                  </div>
                </div>

                <div className="form-group form-full">
                  <label>Objetivos</label>
                  <div className="checkbox-group">
                    {objetivosOptions.map(opt => (
                      <label key={opt} className="checkbox-item">
                        <input type="checkbox" checked={formData.objetivos.includes(opt)} onChange={() => handleMultiSelect('objetivos', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <textarea name="objetivo_texto" value={formData.objetivo_texto} onChange={handleChange} placeholder="Outros objetivos ou detalhes..." style={{ marginTop: '1rem' }} />
                </div>

                <div className="form-group form-full">
                  <label>Nível de Atividade Física</label>
                  <div className="checkbox-group">
                    {nivelAtividadeOptions.map(opt => (
                      <label key={opt} className="checkbox-item">
                        <input type="radio" name="nivel_atividade" value={opt} checked={formData.nivel_atividade === opt} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group form-full">
                  <label>Patologias ou Condições de Saúde</label>
                  <div className="checkbox-group">
                    {patologiasOptions.map(opt => (
                      <label key={opt} className="checkbox-item">
                        <input type="checkbox" checked={formData.patologias.includes(opt)} onChange={() => handleMultiSelect('patologias', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group form-full">
                  <label>Restrições Alimentares</label>
                  <div className="checkbox-group">
                    {restricoesOptions.map(opt => (
                      <label key={opt} className="checkbox-item">
                        <input type="checkbox" checked={formData.restricoes_alimentares.includes(opt)} onChange={() => handleMultiSelect('restricoes_alimentares', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group form-full">
                  <label>Alergias Alimentares</label>
                  <div className="checkbox-group">
                    {alergiasOptions.map(opt => (
                      <label key={opt} className="checkbox-item">
                        <input type="checkbox" checked={formData.alergias.includes(opt)} onChange={() => handleMultiSelect('alergias', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Medicamentos Contínuos</label>
                  <textarea name="medicamentos" value={formData.medicamentos} onChange={handleChange} placeholder="Liste os medicamentos..." />
                </div>
                <div className="form-group">
                  <label>Suplementos em uso</label>
                  <textarea name="suplementos" value={formData.suplementos} onChange={handleChange} placeholder="Liste os suplementos..." />
                </div>
              </div>
            )}

            {activeTab === 'habitos' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Refeições por dia</label>
                  <input type="number" name="refeicoes_por_dia" value={formData.refeicoes_por_dia} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Consumo de água</label>
                  <div className="input-wrapper">
                    <input type="number" step="0.1" name="litros_agua" value={formData.litros_agua} onChange={handleChange} />
                    <span className="input-suffix">litros</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Horário que acorda</label>
                  <input type="text" name="horario_acorda" value={formData.horario_acorda} onChange={handleChange} onBlur={() => handleBlurTime('horario_acorda')} placeholder="Ex: 6 ou 06:30" />
                </div>
                <div className="form-group">
                  <label>Horário que dorme</label>
                  <input type="text" name="horario_dorme" value={formData.horario_dorme} onChange={handleChange} onBlur={() => handleBlurTime('horario_dorme')} placeholder="Ex: 23 ou 22:30" />
                </div>
                <div className="form-group form-full">
                  <label className="checkbox-item">
                    <input type="checkbox" name="atividade_fisica" checked={formData.atividade_fisica} onChange={handleChange} />
                    Pratica atividade física?
                  </label>
                  {formData.atividade_fisica && (
                    <textarea name="atividade_fisica_descricao" value={formData.atividade_fisica_descricao} onChange={handleChange} placeholder="Qual atividade e frequência semanal?" style={{ marginTop: '0.5rem' }} />
                  )}
                </div>
                <div className="form-group form-full">
                  <label>Observações Gerais</label>
                  <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} placeholder="Detalhes adicionais..." />
                </div>
              </div>
            )}

            <div className="form-footer">
              <button type="button" className="btn-secondary" onClick={() => navigate('/pacientes')}>Cancelar</button>
              {activeTab !== 'habitos' ? (
                <button type="button" className="btn-primary" onClick={(e) => { e.preventDefault(); setActiveTab(activeTab === 'pessoal' ? 'clinico' : 'habitos'); }}>Próximo</button>
              ) : (
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Paciente'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NovoPaciente;
