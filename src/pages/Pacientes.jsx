import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const Pacientes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchPacientes();
    }
  }, [user]);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      // Buscamos pacientes e suas consultas para pegar a última data
      const { data, error } = await supabase
        .from('pacientes')
        .select(`
          id, 
          nome, 
          objetivo_texto,
          objetivos,
          consultas (
            data_consulta
          )
        `)
        .eq('nutricionista_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;

      // Processamos os dados para obter a data da última consulta
      const processedPacientes = data.map(p => {
        const sortedConsultas = p.consultas.sort((a, b) => 
          new Date(b.data_consulta) - new Date(a.data_consulta)
        );
        const lastDate = sortedConsultas.length > 0 ? sortedConsultas[0].data_consulta : 'Nenhuma consulta';
        
        // Objetivo formatado (pega o primeiro da lista ou o texto livre)
        const primaryGoal = p.objetivos && p.objetivos.length > 0 ? p.objetivos[0] : (p.objetivo_texto || 'Não informado');

        return {
          ...p,
          lastConsulta: lastDate,
          primaryGoal: primaryGoal
        };
      });

      setPacientes(processedPacientes);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <header className="content-header">
          <div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Pacientes</h2>
            <p style={{ color: 'var(--text-muted)' }}>Gerencie seus pacientes cadastrados.</p>
          </div>
          <Link to="/pacientes/novo" className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Novo Paciente
          </Link>
        </header>

        <div className="search-bar" style={{ marginBottom: '2rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Buscar paciente por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">Carregando pacientes...</div>
        ) : (
          <div className="patients-grid">
            {filteredPacientes.length > 0 ? (
              filteredPacientes.map(patient => (
                <Link key={patient.id} to={`/pacientes/${patient.id}`} className="patient-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div className="patient-avatar" style={{ width: '56px', height: '56px', fontSize: '1.5rem', background: 'var(--primary-glass)' }}>
                      {patient.nome.charAt(0)}
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                  
                  <div className="patient-details" style={{ marginTop: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{patient.nome}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{patient.primaryGoal}</p>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <span>
                        Última consulta: {patient.lastConsulta !== 'Nenhuma consulta' 
                          ? new Date(patient.lastConsulta).toLocaleDateString('pt-BR')
                          : 'Nunca consultou'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                {searchTerm ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Pacientes;
