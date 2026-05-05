import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import DietPlanGenerator from '../components/DietPlanGenerator';
import DietPlanHistory from '../components/DietPlanHistory';
import DietPlanManual from '../components/DietPlanManual';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('pessoal');
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);

  // Form Data for Patient Editing
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

  // Form Data for New Consultation
  const [consultaData, setConsultaData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  useEffect(() => {
    // Validação básica de UUID para evitar erros no Supabase
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (id && uuidRegex.test(id)) {
      fetchData();
    } else if (id) {
      console.error('ID de paciente inválido:', id);
      setLoading(false);
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Patient
      const { data: patientData, error: patientError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (patientError) throw patientError;
      setPatient(patientData);
      setFormData({
        ...patientData,
        objetivos: patientData.objetivos || [],
        patologias: patientData.patologias || [],
        restricoes_alimentares: patientData.restricoes_alimentares || [],
        alergias: patientData.alergias || []
      });

      // Fetch Consultations
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', id)
        .order('data_consulta', { ascending: false });
      
      if (consultasError) throw consultasError;
      setConsultas(consultasData);

      // Fetch Meal Plans
      const { data: planosData, error: planosError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', id)
        .order('created_at', { ascending: false });
      
      if (planosError) throw planosError;
      setPlanos(planosData);

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => {
      const current = prev[name] || [];
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter(i => i !== value) };
      } else {
        return { ...prev, [name]: [...current, value] };
      }
    });
  };

  const savePatientChanges = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('pacientes')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      
      setPatient({ ...patient, ...formData });
      triggerToast('Dados do paciente atualizados!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleConsultaChange = (e) => {
    const { name, value } = e.target;
    setConsultaData(prev => ({ ...prev, [name]: value }));
  };

  const saveNewConsulta = async (e) => {
    e.preventDefault();
    if (!consultaData.peso) return alert('Peso é obrigatório.');

    try {
      setSaving(true);
      const { error } = await supabase
        .from('consultas')
        .insert([{
          ...consultaData,
          paciente_id: id,
          peso: parseFloat(consultaData.peso),
          cintura: consultaData.cintura ? parseFloat(consultaData.cintura) : null,
          quadril: consultaData.quadril ? parseFloat(consultaData.quadril) : null,
          percentual_gordura: consultaData.percentual_gordura ? parseFloat(consultaData.percentual_gordura) : null
        }]);

      if (error) throw error;

      setShowConsultaModal(false);
      setConsultaData({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });
      
      // Refresh consultations
      fetchData();
      triggerToast('Consulta registrada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      alert('Erro ao registrar consulta.');
    } finally {
      setSaving(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getChartData = () => {
    // Combine initial weight and consultation weights
    const data = [];
    
    // Initial data point from patient profile
    if (patient?.created_at && patient?.peso_inicial) {
      data.push({
        date: new Date(patient.created_at).toLocaleDateString('pt-BR'),
        peso: parseFloat(patient.peso_inicial),
        originalDate: new Date(patient.created_at)
      });
    }

    // Add consultation data points
    consultas.forEach(c => {
      data.push({
        date: new Date(c.data_consulta).toLocaleDateString('pt-BR'),
        peso: parseFloat(c.peso),
        originalDate: new Date(c.data_consulta)
      });
    });

    // Sort by date ascending for the chart
    return data.sort((a, b) => a.originalDate - b.originalDate);
  };

  const objetivosOptions = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
  const patologiasOptions = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
  const restricoesOptions = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
  const alergiasOptions = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

  if (loading && !patient) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">
          <div className="empty-state">Carregando perfil do paciente...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <button 
                onClick={() => navigate('/pacientes')} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <h2 style={{ margin: 0 }}>{patient?.nome}</h2>
            </div>
            <p style={{ color: 'var(--text-muted)' }}>ID: {id?.substring(0, 8)}...</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn-secondary" 
              style={{ width: 'auto', background: 'white', border: '1px solid var(--border)' }}
              onClick={() => {
                setPlanToEdit(null);
                setShowManual(true);
                setShowGenerator(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Plano Manual
            </button>
            <button 
              className="btn-primary" 
              style={{ width: 'auto' }}
              onClick={() => {
                setShowGenerator(true);
                setShowManual(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Gerar com IA
            </button>
          </div>
        </header>

        {showGenerator && (
          <div className="profile-container" style={{ marginBottom: '2rem' }}>
            <section className="profile-section" style={{ border: '2px solid var(--primary-light)' }}>
              <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path></svg>
                  Inteligência Artificial: Gerador de Planos
                </h3>
                <button className="modal-close" onClick={() => setShowGenerator(false)} style={{ background: '#f5f5f5', borderRadius: '50%', padding: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="section-content">
                <DietPlanGenerator 
                  patient={patient} 
                  onSaveSuccess={fetchData} 
                  onClose={() => setShowGenerator(false)} 
                />
              </div>
            </section>
          </div>
        )}

        {showManual && (
          <div className="profile-container" style={{ marginBottom: '2rem' }}>
            <section className="profile-section" style={{ border: '2px solid var(--primary-light)' }}>
              <div className="section-content" style={{ paddingTop: '1rem' }}>
                <DietPlanManual 
                  patient={patient}
                  initialPlan={planToEdit}
                  onSaveSuccess={() => {
                    fetchData();
                    setPlanToEdit(null);
                  }} 
                  onClose={() => {
                    setShowManual(false);
                    setPlanToEdit(null);
                  }} 
                />
              </div>
            </section>
          </div>
        )}

        <div className="profile-container">
          
          {/* Section 1: Dados do Paciente */}
          <section className="profile-section">
            <div className="section-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Dados do Paciente
              </h3>
              <div className="tabs-header" style={{ background: 'transparent', border: 'none', marginBottom: 0 }}>
                <button className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`} onClick={() => setActiveTab('pessoal')}>Pessoal</button>
                <button className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`} onClick={() => setActiveTab('clinico')}>Clínico</button>
                <button className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`} onClick={() => setActiveTab('habitos')}>Hábitos</button>
              </div>
            </div>
            
            <div className="section-content">
              {activeTab === 'pessoal' && (
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label>Nome Completo</label>
                    <input type="text" name="nome" value={formData.nome} onChange={handlePatientChange} />
                  </div>
                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <input type="date" name="data_nascimento" value={formData.data_nascimento || ''} onChange={handlePatientChange} />
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select name="sexo" value={formData.sexo || ''} onChange={handlePatientChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                      <option value="">Selecione...</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handlePatientChange} />
                  </div>
                  <div className="form-group">
                    <label>E-mail</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handlePatientChange} />
                  </div>
                </div>
              )}

              {activeTab === 'clinico' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Peso Inicial</label>
                    <div className="input-wrapper">
                      <input type="number" step="0.1" name="peso_inicial" value={formData.peso_inicial || ''} onChange={handlePatientChange} />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Altura</label>
                    <div className="input-wrapper">
                      <input type="number" name="altura" value={formData.altura || ''} onChange={handlePatientChange} />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>
                  <div className="form-group form-full">
                    <label>Objetivos</label>
                    <div className="checkbox-group">
                      {objetivosOptions.map(opt => (
                        <label key={opt} className="checkbox-item">
                          <input type="checkbox" checked={formData.objetivos?.includes(opt)} onChange={() => handleMultiSelect('objetivos', opt)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group form-full">
                    <label>Patologias</label>
                    <div className="checkbox-group">
                      {patologiasOptions.map(opt => (
                        <label key={opt} className="checkbox-item">
                          <input type="checkbox" checked={formData.patologias?.includes(opt)} onChange={() => handleMultiSelect('patologias', opt)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group form-full">
                    <label>Alergias</label>
                    <div className="checkbox-group">
                      {alergiasOptions.map(opt => (
                        <label key={opt} className="checkbox-item">
                          <input type="checkbox" checked={formData.alergias?.includes(opt)} onChange={() => handleMultiSelect('alergias', opt)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'habitos' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Refeições por dia</label>
                    <input type="number" name="refeicoes_por_dia" value={formData.refeicoes_por_dia || ''} onChange={handlePatientChange} />
                  </div>
                  <div className="form-group">
                    <label>Consumo de água (L)</label>
                    <input type="number" step="0.1" name="litros_agua" value={formData.litros_agua || ''} onChange={handlePatientChange} />
                  </div>
                  <div className="form-group form-full">
                    <label className="checkbox-item">
                      <input type="checkbox" name="atividade_fisica" checked={formData.atividade_fisica} onChange={handlePatientChange} />
                      Pratica atividade física?
                    </label>
                  </div>
                  <div className="form-group form-full">
                    <label>Observações</label>
                    <textarea name="observacoes" value={formData.observacoes || ''} onChange={handlePatientChange} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button 
                  className="btn-primary" 
                  style={{ width: 'auto' }} 
                  onClick={savePatientChanges}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </section>

          {/* Section 2: Consultas */}
          <section className="profile-section">
            <div className="section-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                Evolução e Consultas
              </h3>
              <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setShowConsultaModal(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Nova Consulta
              </button>
            </div>

            <div className="section-content">
              <div className="chart-container">
                {consultas.length > 0 || patient?.peso_inicial ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} unit="kg" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: 'var(--shadow-md)' }}
                        itemStyle={{ color: 'var(--primary)', fontWeight: '700' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="peso" 
                        stroke="var(--primary)" 
                        strokeWidth={3} 
                        dot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    <p>Nenhuma consulta registrada ainda</p>
                  </div>
                )}
              </div>

              <div className="consultas-list">
                {consultas.length > 0 ? (
                  consultas.map(c => (
                    <div key={c.id} className="consulta-card">
                      <div className="consulta-header-row">
                        <div className="consulta-date-label">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                        </div>
                        {c.proximo_retorno && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Retorno: <strong>{new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}</strong>
                          </div>
                        )}
                      </div>
                      <div className="consulta-stat">
                        <span className="stat-label-sm">Peso</span>
                        <span className="stat-value-sm">{c.peso} kg</span>
                      </div>
                      <div className="consulta-stat">
                        <span className="stat-label-sm">Cintura</span>
                        <span className="stat-value-sm">{c.cintura || '--'} cm</span>
                      </div>
                      <div className="consulta-stat">
                        <span className="stat-label-sm">Quadril</span>
                        <span className="stat-value-sm">{c.quadril || '--'} cm</span>
                      </div>
                      <div className="consulta-stat">
                        <span className="stat-label-sm">% Gordura</span>
                        <span className="stat-value-sm">{c.percentual_gordura || '--'}%</span>
                      </div>
                      {c.observacoes && (
                        <div className="consulta-obs">
                          {c.observacoes}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">Ainda não há histórico de consultas.</div>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Planos Alimentares */}
          <section className="profile-section">
            <div className="section-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Planos Alimentares
              </h3>
            </div>
            <div className="section-content">
              <DietPlanHistory 
                planos={planos} 
                onEdit={(plan) => {
                  setPlanToEdit(plan);
                  setShowManual(true);
                  setShowGenerator(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </section>

        </div>

        {/* Modal: Nova Consulta */}
        {showConsultaModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Nova Consulta</h3>
                <button className="modal-close" onClick={() => setShowConsultaModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <form onSubmit={saveNewConsulta}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Data da Consulta *</label>
                      <input type="date" name="data_consulta" value={consultaData.data_consulta} onChange={handleConsultaChange} required />
                    </div>
                    <div className="form-group">
                      <label>Peso Atual (kg) *</label>
                      <input type="number" step="0.1" name="peso" value={consultaData.peso} onChange={handleConsultaChange} required />
                    </div>
                    <div className="form-group">
                      <label>Cintura (cm)</label>
                      <input type="number" step="0.1" name="cintura" value={consultaData.cintura} onChange={handleConsultaChange} />
                    </div>
                    <div className="form-group">
                      <label>Quadril (cm)</label>
                      <input type="number" step="0.1" name="quadril" value={consultaData.quadril} onChange={handleConsultaChange} />
                    </div>
                    <div className="form-group">
                      <label>% de Gordura</label>
                      <input type="number" step="0.1" name="percentual_gordura" value={consultaData.percentual_gordura} onChange={handleConsultaChange} />
                    </div>
                    <div className="form-group">
                      <label>Próximo Retorno</label>
                      <input type="date" name="proximo_retorno" value={consultaData.proximo_retorno} onChange={handleConsultaChange} />
                    </div>
                    <div className="form-group form-full">
                      <label>Observações</label>
                      <textarea name="observacoes" value={consultaData.observacoes} onChange={handleConsultaChange} placeholder="Anotações sobre a consulta..." />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowConsultaModal(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto' }}>
                    {saving ? 'Salvando...' : 'Salvar Consulta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showToast && (
          <div className="toast-container">
            <div className="toast">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              {toastMessage}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientProfile;
