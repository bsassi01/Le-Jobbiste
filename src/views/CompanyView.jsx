import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Building, List, PlusCircle, Settings, LogOut, LogIn, Archive, RefreshCw, Eye, Lock, Copy, Edit2, ThumbsUp, ThumbsDown, ShoppingCart } from 'lucide-react';

export default function CompanyView() {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [appFilters, setAppFilters] = useState({}); 
  
  const [cart, setCart] = useState([]);

  const [companyProfile, setCompanyProfile] = useState({
    company_name: '', siret: '', legal_status: 'SAS / SASU', 
    contact_name: '', phone: '', address: '', postal_code: '', city: '',
    tva_number: '', billing_email: '', description: ''
  });

  const [jobData, setJobData] = useState({
    title: '', description: '', location: '', job_type: 'Saisonnier',
    start_date: '', end_date: '', schedule: '', weekly_hours: '', salary: '', 
    experience_level: 'Débutant accepté', dress_code: '', provided_equipment: '',
    perk_meal: false, perk_transport: false, perk_tips: false
  });

  useEffect(() => {
    if (currentCompany) {
      if (activeTab === 'dashboard') fetchCompanyDashboard();
      if (activeTab === 'profile') {
        setCompanyProfile({
          ...currentCompany,
          legal_status: currentCompany.legal_status || 'SAS / SASU',
          postal_code: currentCompany.postal_code || '',
          city: currentCompany.city || '',
          tva_number: currentCompany.tva_number || '',
          billing_email: currentCompany.billing_email || currentCompany.email || ''
        });
      }
    }
  }, [currentCompany, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('companies').select('*').eq('email', authEmail).single();
    if (data) { setCurrentCompany(data); } 
    else { setIsRegistering(true); }
  };

  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('companies').insert([{
      email: authEmail,
      company_name: companyProfile.company_name,
      address: companyProfile.address
    }]).select().single();
    if (!error) { setCurrentCompany(data); setIsRegistering(false); } 
    else { alert("Erreur lors de la création du compte."); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('companies').update(companyProfile).eq('id', currentCompany.id).select().single();
    if (!error) { setCurrentCompany(data); alert("Profil mis à jour."); setActiveTab('dashboard'); }
  };

  const fetchCompanyDashboard = async () => {
    const { data } = await supabase.from('jobs')
      .select(`*, applications (*)`)
      .eq('company_id', currentCompany.id)
      .order('is_active', { ascending: false })
      .order('start_date', { ascending: true });
    if (data) setJobs(data);
  };

  const handleArchive = async (jobId) => {
    const { error } = await supabase.from('jobs').update({ is_active: false }).eq('id', jobId);
    if (!error) fetchCompanyDashboard();
  };

  const startEditAndRepublish = (job) => {
    setJobData({
      title: job.title, description: job.description, location: job.location,
      job_type: job.job_type || 'Saisonnier', start_date: job.start_date || '', 
      end_date: job.end_date || '', schedule: job.schedule || '', weekly_hours: job.weekly_hours || '',
      salary: job.salary || '', experience_level: job.experience_level || 'Débutant accepté',
      dress_code: job.dress_code || '', provided_equipment: job.provided_equipment || '',
      perk_meal: job.perk_meal || false, perk_transport: job.perk_transport || false, perk_tips: job.perk_tips || false
    });
    setEditingJobId(job.id);
    setActiveTab('post');
  };

  const startDuplicate = (job) => {
    setJobData({
      title: job.title, description: job.description, location: job.location,
      job_type: job.job_type || 'Saisonnier', start_date: '', end_date: '', schedule: job.schedule || '', 
      weekly_hours: job.weekly_hours || '', salary: job.salary || '', experience_level: job.experience_level || 'Débutant accepté',
      dress_code: job.dress_code || '', provided_equipment: job.provided_equipment || '',
      perk_meal: job.perk_meal || false, perk_transport: job.perk_transport || false, perk_tips: job.perk_tips || false
    });
    setEditingJobId(null);
    setActiveTab('post');
  };

  const resetJobForm = () => {
    setJobData({ title: '', description: '', location: currentCompany.address, job_type: 'Saisonnier', start_date: '', end_date: '', schedule: '', weekly_hours: '', salary: '', experience_level: 'Débutant accepté', dress_code: '', provided_equipment: '', perk_meal: false, perk_transport: false, perk_tips: false });
    setEditingJobId(null);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    const payload = { company_id: currentCompany.id, company_name: currentCompany.company_name, ...jobData, is_active: true };
    if (payload.start_date === '') payload.start_date = null;
    if (payload.end_date === '') payload.end_date = null;

    if (editingJobId) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', editingJobId);
      if (error) { alert("Erreur: " + error.message); return; }
    } else {
      const { error } = await supabase.from('jobs').insert([payload]);
      if (error) { alert("Erreur: " + error.message); return; }
    }
    await fetchCompanyDashboard();
    resetJobForm();
    setActiveTab('dashboard');
  };

  const setFilterForJob = (jobId, filterValue) => {
    setAppFilters(prev => ({ ...prev, [jobId]: filterValue }));
  };

  const toggleAppStatus = async (appId, currentStatus, targetStatus) => {
    const newStatus = currentStatus === targetStatus ? 'pending' : targetStatus;
    const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', appId);
    if (!error) {
      fetchCompanyDashboard();
      if (selectedApplicant && selectedApplicant.id === appId) {
        setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
      }
    }
  };

  const toggleCart = (applicant) => {
    if (cart.some(item => item.id === applicant.id)) {
      setCart(cart.filter(item => item.id !== applicant.id));
    } else {
      setCart([...cart, applicant]);
    }
  };

  if (!currentCompany) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow mt-10 border-2 border-slate-900">
        <h2 className="text-xl font-bold mb-6 flex items-center"><Building className="mr-2"/> Espace Recruteur</h2>
        {!isRegistering ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input required type="email" placeholder="Email entreprise" className="w-full p-4 border-2 border-slate-900 rounded-xl bg-gray-50" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold flex justify-center items-center border-2 border-slate-900"><LogIn className="w-4 h-4 mr-2"/> Connexion</button>
          </form>
        ) : (
          <form onSubmit={handleRegisterCompany} className="space-y-4">
            <input required type="text" placeholder="Raison sociale de l'entreprise" className="w-full p-3 border-2 border-slate-900 rounded-xl" onChange={e => setCompanyProfile({...companyProfile, company_name: e.target.value})} />
            <input required type="text" placeholder="Adresse du siège" className="w-full p-3 border-2 border-slate-900 rounded-xl" onChange={e => setCompanyProfile({...companyProfile, address: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold border-2 border-slate-900">Créer mon compte</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-black text-slate-900">{currentCompany.company_name}</h1>
        <div className="flex gap-2">
          <button onClick={() => { setActiveTab('dashboard'); resetJobForm(); }} className={`p-3 rounded-xl transition-colors border-2 ${activeTab === 'dashboard' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-slate-900 hover:bg-gray-100'}`}><List size={20}/></button>
          <button onClick={() => { setActiveTab('post'); resetJobForm(); setJobData({...jobData, location: currentCompany.address}); }} className={`p-3 rounded-xl transition-colors border-2 ${activeTab === 'post' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-slate-900 hover:bg-gray-100'}`}><PlusCircle size={20}/></button>
          <button onClick={() => { setActiveTab('profile'); resetJobForm(); }} className={`p-3 rounded-xl transition-colors border-2 ${activeTab === 'profile' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-slate-900 hover:bg-gray-100'}`}><Settings size={20}/></button>
          
          <button onClick={() => { setActiveTab('cart'); resetJobForm(); }} className={`p-3 rounded-xl transition-colors border-2 relative ${activeTab === 'cart' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-slate-900 hover:bg-gray-100'}`}>
            <ShoppingCart size={20}/>
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">{cart.length}</span>}
          </button>

          <button onClick={() => setCurrentCompany(null)} className="p-3 text-gray-400 hover:text-red-500 bg-white rounded-xl border-2 border-slate-900"><LogOut size={20}/></button>
        </div>
      </div>

      {activeTab === 'cart' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-slate-900 space-y-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
            <h3 className="text-xl font-black flex items-center"><ShoppingCart className="mr-2"/> Mon Panier</h3>
            <button onClick={() => setActiveTab('dashboard')} className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-1 rounded-lg border-2 border-slate-900 transition-colors">Fermer</button>
          </div>
          {cart.length > 0 ? (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 border-2 border-slate-900 rounded-2xl bg-gray-50">
                  <div>
                    <p className="font-bold text-slate-900">Candidat de {item.city}</p>
                    <p className="text-xs text-slate-500 font-medium">Référence Profil #{item.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-green-700">37,50 €</span>
                    <button onClick={() => toggleCart(item)} className="text-red-500 hover:text-red-700 text-xs font-bold underline">Retirer</button>
                  </div>
                </div>
              ))}
              <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center text-xl font-black text-slate-900">
                <span>Total HT</span>
                <span>{(cart.length * 37.5).toFixed(2).replace('.', ',')} €</span>
              </div>
              <button onClick={() => alert('Redirection vers la page de paiement Stripe...')} className="w-full bg-green-500 text-white p-4 rounded-xl font-black border-2 border-slate-900 hover:bg-green-600 transition flex justify-center items-center mt-6">
                <Lock size={18} className="mr-2"/> Payer et débloquer les {cart.length} contacts
              </button>
            </div>
          ) : (
            <p className="text-center text-slate-500 font-bold py-10">Ton panier est vide pour le moment.</p>
          )}
        </div>
      ) : activeTab === 'profile' ? (
        <form onSubmit={handleUpdateProfile} className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border-2 border-slate-900 space-y-6">
          <div>
            <h3 className="text-lg font-black border-b-2 border-slate-900 pb-2 mb-4">Informations générales</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nom de l'entreprise</label><input required type="text" value={companyProfile.company_name} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, company_name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contact sur place</label><input type="text" value={companyProfile.contact_name || ''} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, contact_name: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Téléphone</label><input type="tel" value={companyProfile.phone || ''} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, phone: e.target.value})} /></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description rapide</label><textarea className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50 h-24" value={companyProfile.description || ''} onChange={e => setCompanyProfile({...companyProfile, description: e.target.value})} /></div>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-black border-b-2 border-slate-900 pb-2 mb-4">Données de facturation</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Forme Juridique</label>
                  <select className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={companyProfile.legal_status} onChange={e => setCompanyProfile({...companyProfile, legal_status: e.target.value})}>
                    <option>SAS / SASU</option>
                    <option>SARL / EURL</option>
                    <option>SA</option>
                    <option>Micro-entreprise / EI</option>
                    <option>Association</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email de facturation</label><input required type="email" value={companyProfile.billing_email || ''} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, billing_email: e.target.value})} /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Numéro de SIRET</label><input required type="text" value={companyProfile.siret || ''} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, siret: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">N° TVA Intracommunautaire</label><input type="text" placeholder="Si assujetti" value={companyProfile.tva_number || ''} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, tva_number: e.target.value})} /></div>
              </div>

              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adresse du siège social</label><input required type="text" value={companyProfile.address || ''} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, address: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Code Postal</label><input required type="text" value={companyProfile.postal_code || ''} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, postal_code: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ville</label><input required type="text" value={companyProfile.city || ''} className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setCompanyProfile({...companyProfile, city: e.target.value})} /></div>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold border-2 border-slate-900 mt-6">Enregistrer le profil</button>
        </form>
      ) : activeTab === 'post' ? (
        <form onSubmit={handleJobSubmit} className="bg-white p-8 rounded-3xl shadow-sm border-2 border-slate-900 space-y-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-black border-b-2 border-slate-900 pb-4">{editingJobId ? "Modifier l'annonce" : "Nouvelle annonce"}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titre du poste</label><input required type="text" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.title} onChange={e => setJobData({...jobData, title: e.target.value})} /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type</label><select className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.job_type} onChange={e => setJobData({...jobData, job_type: e.target.value})}><option>Extra (1 jour)</option><option>Saisonnier</option><option>Job étudiant régulier</option></select></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adresse de la mission</label><input required type="text" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.location} onChange={e => setJobData({...jobData, location: e.target.value})} /></div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Expérience attendue</label>
              <select className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.experience_level} onChange={e => setJobData({...jobData, experience_level: e.target.value})}>
                <option>Débutant accepté</option>
                <option>1 an minimum</option>
                <option>Diplôme spécifique requis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date de début</label><input type="date" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.start_date} onChange={e => setJobData({...jobData, start_date: e.target.value})} /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date de fin (Optionnel)</label><input type="date" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.end_date || ''} onChange={e => setJobData({...jobData, end_date: e.target.value})} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Horaires (ex: 18h-23h)</label><input required type="text" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.schedule} onChange={e => setJobData({...jobData, schedule: e.target.value})} /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Volume horaire (ex: 35h/sem)</label><input type="text" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.weekly_hours || ''} onChange={e => setJobData({...jobData, weekly_hours: e.target.value})} /></div>
          </div>
          
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rémunération</label><input required type="text" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.salary} onChange={e => setJobData({...jobData, salary: e.target.value})} /></div>
          
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tenue exigée</label><input type="text" placeholder="Ex: Pantalon noir" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.dress_code || ''} onChange={e => setJobData({...jobData, dress_code: e.target.value})} /></div>
             <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Matériel fourni</label><input type="text" placeholder="Ex: Véhicule, téléphone..." className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={jobData.provided_equipment || ''} onChange={e => setJobData({...jobData, provided_equipment: e.target.value})} /></div>
          </div>

          <div className="bg-slate-100 p-4 rounded-xl border-2 border-slate-900">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Avantages proposés (Coches)</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer"><input type="checkbox" className="w-4 h-4 mr-2 accent-blue-600" checked={jobData.perk_meal} onChange={e => setJobData({...jobData, perk_meal: e.target.checked})} /><span className="text-sm font-bold">Repas fourni</span></label>
              <label className="flex items-center cursor-pointer"><input type="checkbox" className="w-4 h-4 mr-2 accent-blue-600" checked={jobData.perk_transport} onChange={e => setJobData({...jobData, perk_transport: e.target.checked})} /><span className="text-sm font-bold">Transport remb.</span></label>
              <label className="flex items-center cursor-pointer"><input type="checkbox" className="w-4 h-4 mr-2 accent-blue-600" checked={jobData.perk_tips} onChange={e => setJobData({...jobData, perk_tips: e.target.checked})} /><span className="text-sm font-bold">Pourboires</span></label>
            </div>
          </div>

          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description de la mission</label><textarea required className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50 h-24" value={jobData.description} onChange={e => setJobData({...jobData, description: e.target.value})} /></div>
          
          <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold border-2 border-slate-900">{editingJobId ? "Mettre à jour" : "Publier l'annonce"}</button>
        </form>
      ) : (
        <div className="space-y-6">
          {jobs.map(job => {
            const currentFilter = appFilters[job.id] || 'all';
            const filteredApps = (job.applications || []).filter(app => {
              if (currentFilter === 'all') return true;
              return app.status === currentFilter;
            });

            return (
              <div key={job.id} className={`p-6 rounded-3xl border-2 ${job.is_active ? 'bg-white shadow-sm border-slate-900' : 'bg-slate-100 border-slate-500 opacity-80'}`}>
                <div className="flex justify-between items-start mb-4 border-b-2 border-slate-900 pb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-slate-900">{job.title}</h3>
                      {job.is_active ? <span className="bg-green-100 border-2 border-slate-900 text-green-800 text-xs px-3 py-1 rounded-full font-bold uppercase">Active</span> : <span className="bg-slate-200 border-2 border-slate-900 text-slate-600 text-xs px-3 py-1 rounded-full font-bold uppercase">Archivée</span>}
                    </div>
                    <p className="text-slate-600 font-medium text-sm">
                      {job.end_date ? `Du ${job.start_date} au ${job.end_date}` : job.start_date} • {job.schedule}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startDuplicate(job)} className="p-2 text-slate-900 hover:text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border-2 border-transparent hover:border-slate-900" title="Dupliquer"><Copy size={18}/></button>
                    
                    {job.is_active ? (
                      <>
                        <button onClick={() => startEditAndRepublish(job)} className="p-2 text-slate-900 hover:text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border-2 border-transparent hover:border-slate-900" title="Modifier"><Edit2 size={18}/></button>
                        <button onClick={() => handleArchive(job.id)} className="p-2 text-slate-900 hover:text-red-600 rounded-lg hover:bg-red-100 transition-colors border-2 border-transparent hover:border-slate-900" title="Archiver"><Archive size={18}/></button>
                      </>
                    ) : (
                      <button onClick={() => startEditAndRepublish(job)} className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center text-sm font-bold transition-colors border-2 border-slate-900" title="Relancer"><RefreshCw size={16} className="mr-1"/> Relancer</button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-lg text-sm font-bold border-2 border-slate-900">
                      {job.applications?.length || 0} candidat(s)
                    </span>
                    
                    {job.applications?.length > 0 && (
                      <div className="flex gap-2">
                        <button onClick={() => setFilterForJob(job.id, 'all')} className={`px-3 py-1 rounded-lg text-xs font-bold border-2 border-slate-900 transition-colors ${currentFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Tous</button>
                        <button onClick={() => setFilterForJob(job.id, 'pending')} className={`px-3 py-1 rounded-lg text-xs font-bold border-2 border-slate-900 transition-colors ${currentFilter === 'pending' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>À trier</button>
                        <button onClick={() => setFilterForJob(job.id, 'accepted')} className={`px-2 py-1 rounded-lg border-2 border-slate-900 transition-colors ${currentFilter === 'accepted' ? 'bg-green-500 text-white' : 'bg-white text-green-600 hover:bg-green-50'}`} title="Retenus"><ThumbsUp size={14}/></button>
                        <button onClick={() => setFilterForJob(job.id, 'rejected')} className={`px-2 py-1 rounded-lg border-2 border-slate-900 transition-colors ${currentFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-red-600 hover:bg-red-50'}`} title="Refusés"><ThumbsDown size={14}/></button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {filteredApps.length > 0 ? (
                      filteredApps.map(app => (
                        <div key={app.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-slate-900">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">Candidat de {app.city}</p>
                            <p className="text-xs text-slate-600 font-medium mb-1">Transport : {app.transport}</p>
                            {app.status === 'accepted' && <span className="text-[10px] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-700 uppercase tracking-widest">Retenu</span>}
                            {app.status === 'rejected' && <span className="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-700 uppercase tracking-widest">Refusé</span>}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleAppStatus(app.id, app.status, 'accepted')} className={`p-2 rounded-xl border-2 border-slate-900 transition-colors ${app.status === 'accepted' ? 'bg-green-500 text-white' : 'bg-white text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title="Retenir">
                              <ThumbsUp size={16}/>
                            </button>
                            <button onClick={() => toggleAppStatus(app.id, app.status, 'rejected')} className={`p-2 rounded-xl border-2 border-slate-900 transition-colors ${app.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-slate-400 hover:text-red-600 hover:bg-red-50'}`} title="Refuser">
                              <ThumbsDown size={16}/>
                            </button>
                            <button onClick={() => setSelectedApplicant(app)} className="bg-white border-2 border-slate-900 text-slate-800 px-4 py-2 rounded-xl flex items-center text-sm font-bold hover:bg-blue-50 hover:text-blue-700 transition-colors">
                              <Eye size={16} className="mr-2"/> Fiche
                            </button>
                          </div>
                        </div>
                      ))
                    ) : <p className="text-sm text-slate-500 italic font-medium">Aucun candidat dans cette catégorie.</p>}
                  </div>
                </div>
              </div>
            );
          })}
          {jobs.length === 0 && <p className="text-center text-slate-500 font-bold py-10">Aucune annonce publiée.</p>}
        </div>
      )}

      {selectedApplicant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border-2 border-slate-900">
            <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
              <h3 className="font-black flex items-center"><Lock size={18} className="mr-2"/> Profil Anonymisé</h3>
              <button onClick={() => setSelectedApplicant(null)} className="text-gray-400 hover:text-white"><LogOut size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-slate-900"><p className="text-[10px] text-gray-500 uppercase font-black mb-1">Ville</p><p className="font-bold text-sm">{selectedApplicant.city}</p></div>
                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-slate-900"><p className="text-[10px] text-gray-500 uppercase font-black mb-1">Transport</p><p className="font-bold text-sm">{selectedApplicant.transport}</p></div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border-2 border-slate-900">
                <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Motivation / Expérience</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{selectedApplicant.experience}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t-2 border-slate-900 flex flex-col gap-3">
                <div className="flex justify-center gap-4 mb-2">
                   <button onClick={() => toggleAppStatus(selectedApplicant.id, selectedApplicant.status, 'accepted')} className={`p-3 rounded-xl border-2 border-slate-900 transition-colors ${selectedApplicant.status === 'accepted' ? 'bg-green-500 text-white' : 'bg-white text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title="Retenir"><ThumbsUp size={20}/></button>
                   <button onClick={() => toggleAppStatus(selectedApplicant.id, selectedApplicant.status, 'rejected')} className={`p-3 rounded-xl border-2 border-slate-900 transition-colors ${selectedApplicant.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-slate-400 hover:text-red-600 hover:bg-red-50'}`} title="Refuser"><ThumbsDown size={20}/></button>
                </div>

                <button onClick={() => toggleCart(selectedApplicant)} className={`w-full p-4 rounded-2xl font-black transition flex justify-center items-center shadow-lg border-2 border-slate-900 ${cart.some(c => c.id === selectedApplicant.id) ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  <ShoppingCart size={18} className="mr-2"/>
                  {cart.some(c => c.id === selectedApplicant.id) ? 'Retirer du panier' : 'Ajouter au panier (37,50 €)'}
                </button>

                <button onClick={() => alert(`SIMULATION DÉBLOCAGE (37,50 €) :\nNom : ${selectedApplicant.first_name} ${selectedApplicant.last_name}\nNaissance : ${selectedApplicant.birth_date || 'Non renseigné'}\nTéléphone : ${selectedApplicant.phone || 'Non renseigné'}\nEmail : ${selectedApplicant.candidate_email}`)} className="w-full bg-green-500 text-white p-4 rounded-2xl font-black hover:bg-green-600 transition flex justify-center items-center shadow-lg border-2 border-slate-900">
                  <Lock size={18} className="mr-2"/> Accéder aux coordonnées directes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}