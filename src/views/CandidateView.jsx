import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Calendar from '../components/Calendar';
import { Briefcase, Calendar as CalIcon, LogOut, MapPin, Euro, Send, ChevronLeft, Zap, Coffee, Train, Coins, Shirt, GraduationCap, Clock, Package, User } from 'lucide-react';

export default function CandidateView() {
  const [currentCandidate, setCurrentCandidate] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [viewingJob, setViewingJob] = useState(null);
  
  const [profileData, setProfileData] = useState({ 
    first_name: '', last_name: '', birth_date: '', phone: '', city: '', transport: '', experience: '',
    specific_dates_json: [] 
  });

  useEffect(() => {
    if (currentCandidate) {
      if (activeTab === 'jobs') fetchJobs();
      if (activeTab === 'profile') setProfileData(currentCandidate);
    }
  }, [currentCandidate, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('candidates').select('*').eq('email', authEmail).single();
    if (data) { 
      setCurrentCandidate(data); 
      setProfileData(data); 
    } else { 
      setIsRegistering(true); 
    }
  };

  const handleRegisterCandidate = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('candidates').insert([{
      email: authEmail,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      city: profileData.city
    }]).select().single();
    
    if (!error) { 
      setCurrentCandidate(data); 
      setIsRegistering(false); 
    } else { 
      alert("Erreur lors de la création du compte."); 
    }
  };

  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs')
      .select('*, companies(company_name)')
      .eq('is_active', true)
      .order('start_date', { ascending: true });
    if (data) setJobs(data);
  };

  const handleUpdateProfile = async () => {
    const { data, error } = await supabase.from('candidates').update(profileData).eq('id', currentCandidate.id).select().single();
    if (!error) { setCurrentCandidate(data); alert("Profil sauvegardé !"); setActiveTab('jobs'); }
  };

  const handleApply = async (jobId) => {
    if (!currentCandidate.first_name || !currentCandidate.city || !currentCandidate.phone || !currentCandidate.birth_date) {
      alert("Mets à jour ton profil complet (Prénom, Date de naissance, Téléphone, Ville) avant de postuler !");
      setActiveTab('profile');
      return;
    }

    const { error } = await supabase.from('applications').insert([{
      job_id: jobId, candidate_id: currentCandidate.id, candidate_email: currentCandidate.email,
      first_name: currentCandidate.first_name, last_name: currentCandidate.last_name,
      phone: currentCandidate.phone, birth_date: currentCandidate.birth_date,
      city: currentCandidate.city, transport: currentCandidate.transport,
      experience: currentCandidate.experience, status: 'pending'
    }]);
    
    if (!error) {
      alert("Postulé avec succès !");
      setViewingJob(null);
    } else {
      alert("Erreur lors de la candidature.");
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    const isMatchA = profileData.specific_dates_json?.includes(a.start_date) ? 1 : 0;
    const isMatchB = profileData.specific_dates_json?.includes(b.start_date) ? 1 : 0;
    
    if (isMatchA !== isMatchB) {
      return isMatchB - isMatchA;
    }
    
    const dateA = new Date(a.start_date || 0);
    const dateB = new Date(b.start_date || 0);
    return dateA - dateB;
  });

  if (!currentCandidate) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl mt-10 border-2 border-slate-900">
        <h2 className="text-xl font-black mb-6 flex items-center text-slate-900">Le Jobbiste Jeunes</h2>
        {!isRegistering ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input required type="email" placeholder="Ton e-mail" className="w-full p-4 border-2 border-slate-900 rounded-xl bg-gray-50" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-black shadow-lg border-2 border-slate-900">Continuer</button>
          </form>
        ) : (
          <form onSubmit={handleRegisterCandidate} className="space-y-4">
            <p className="text-sm font-bold text-slate-500 mb-2">Création de ton compte</p>
            <input required type="text" placeholder="Ton prénom" className="w-full p-4 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setProfileData({...profileData, first_name: e.target.value})} />
            <input required type="text" placeholder="Ton nom" className="w-full p-4 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setProfileData({...profileData, last_name: e.target.value})} />
            <input required type="text" placeholder="Ta ville (ex: Strasbourg)" className="w-full p-4 border-2 border-slate-900 rounded-xl bg-gray-50" onChange={e => setProfileData({...profileData, city: e.target.value})} />
            <button type="submit" className="w-full bg-green-500 text-white p-4 rounded-xl font-black shadow-lg border-2 border-slate-900 mt-2">Valider l'inscription</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-200 min-h-screen pb-24">
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border-2 border-slate-900 flex gap-4 z-50">
        <button onClick={() => { setActiveTab('jobs'); setViewingJob(null); }} className={`p-3 rounded-xl transition-colors ${activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}><Briefcase size={24}/></button>
        <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}><User size={24}/></button>
        <button onClick={() => setCurrentCandidate(null)} className="p-3 text-gray-400 hover:text-red-500"><LogOut size={24}/></button>
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-900 space-y-4">
            <h3 className="font-black text-slate-900 border-b-2 border-slate-900 pb-2">Identité & Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Prénom</label><input type="text" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={profileData.first_name || ''} onChange={e => setProfileData({...profileData, first_name: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nom</label><input type="text" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={profileData.last_name || ''} onChange={e => setProfileData({...profileData, last_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Date de naissance</label><input type="date" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={profileData.birth_date || ''} onChange={e => setProfileData({...profileData, birth_date: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Téléphone</label><input type="tel" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={profileData.phone || ''} onChange={e => setProfileData({...profileData, phone: e.target.value})} /></div>
            </div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Email de contact</label><input type="email" disabled className="w-full p-3 border-2 border-slate-300 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={currentCandidate.email} /></div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-900 space-y-4">
            <h3 className="font-black text-slate-900 border-b-2 border-slate-900 pb-2">Logistique & Profil</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Ville</label><input type="text" className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={profileData.city || ''} onChange={e => setProfileData({...profileData, city: e.target.value})} /></div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Transport</label>
                <select className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50" value={profileData.transport || ''} onChange={e => setProfileData({...profileData, transport: e.target.value})}>
                  <option value="">Sélectionner</option>
                  <option value="Aucun">Aucun</option>
                  <option value="Transports en commun">Transports en commun</option>
                  <option value="Scooter / Moto">Scooter / Moto</option>
                  <option value="Voiture">Voiture</option>
                  <option value="Vélo / Trottinette">Vélo / Trottinette</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Motivation / Expérience</label>
              <textarea placeholder="Décris brièvement ton parcours et ta motivation..." className="w-full p-3 border-2 border-slate-900 rounded-xl bg-gray-50 h-24" value={profileData.experience || ''} onChange={e => setProfileData({...profileData, experience: e.target.value})} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-900 space-y-4">
            <h3 className="font-black text-slate-900 border-b-2 border-slate-900 pb-2">Mes disponibilités</h3>
            <Calendar 
              selectedDates={profileData.specific_dates_json || []}
              onUpdate={(dates) => setProfileData({...profileData, specific_dates_json: dates})}
              evenings={profileData.availability_evenings}
              onToggleEvenings={(val) => setProfileData({...profileData, availability_evenings: val})}
              weekends={profileData.availability_weekends}
              onToggleWeekends={(val) => setProfileData({...profileData, availability_weekends: val})}
            />
          </div>
          
          <button onClick={handleUpdateProfile} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-colors border-2 border-slate-900">SAUVEGARDER</button>
        </div>
      ) : viewingJob ? (
        <div className="bg-white rounded-3xl shadow-lg p-6 animate-in slide-in-from-bottom-4 duration-300 border-2 border-slate-900">
          <button onClick={() => setViewingJob(null)} className="flex items-center text-xs font-bold text-blue-700 mb-6 uppercase tracking-wider"><ChevronLeft size={16} className="mr-1"/> Retour aux offres</button>
          <div className="mb-6">
             <h3 className="text-2xl font-black leading-tight mb-1 text-slate-900">{viewingJob.title}</h3>
             <p className="text-slate-600 font-bold">{viewingJob.companies?.company_name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
             <div className="bg-slate-100 p-3 rounded-2xl border-2 border-slate-900">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Dates & Horaires</p>
               <p className="text-xs font-bold text-slate-800">
                 {viewingJob.end_date ? `Du ${viewingJob.start_date} au ${viewingJob.end_date}` : viewingJob.start_date}
                 <br/>
                 <span className="flex items-center mt-1"><Clock size={12} className="mr-1"/> {viewingJob.schedule} {viewingJob.weekly_hours && `(${viewingJob.weekly_hours})`}</span>
               </p>
             </div>
             <div className="bg-slate-100 p-3 rounded-2xl border-2 border-slate-900"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">Paye</p><p className="text-sm font-black text-green-700">{viewingJob.salary}</p></div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-900 mb-6 space-y-3">
             <div className="flex items-center text-sm font-bold text-slate-700"><GraduationCap size={16} className="mr-2 text-slate-500"/> {viewingJob.experience_level}</div>
             {viewingJob.dress_code && <div className="flex items-center text-sm font-bold text-slate-700"><Shirt size={16} className="mr-2 text-slate-500"/> {viewingJob.dress_code}</div>}
             {viewingJob.provided_equipment && <div className="flex items-center text-sm font-bold text-slate-700"><Package size={16} className="mr-2 text-slate-500"/> Fourni : {viewingJob.provided_equipment}</div>}
             
             {(viewingJob.perk_meal || viewingJob.perk_transport || viewingJob.perk_tips) && (
               <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap gap-2">
                 {viewingJob.perk_meal && <span className="bg-blue-100 text-blue-800 border-2 border-slate-900 text-[10px] font-black px-2 py-1 rounded-lg flex items-center uppercase"><Coffee size={12} className="mr-1"/> Repas</span>}
                 {viewingJob.perk_transport && <span className="bg-blue-100 text-blue-800 border-2 border-slate-900 text-[10px] font-black px-2 py-1 rounded-lg flex items-center uppercase"><Train size={12} className="mr-1"/> Transport</span>}
                 {viewingJob.perk_tips && <span className="bg-blue-100 text-blue-800 border-2 border-slate-900 text-[10px] font-black px-2 py-1 rounded-lg flex items-center uppercase"><Coins size={12} className="mr-1"/> Pourboires</span>}
               </div>
             )}
          </div>

          <div className="mb-8">
            <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 border-b-2 border-slate-900 pb-1">Mission</h4>
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{viewingJob.description}</p>
          </div>
          <button onClick={() => handleApply(viewingJob.id)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex justify-center items-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest border-2 border-slate-900"><Send size={18} className="mr-2"/> Postuler maintenant</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="px-2 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Offres pour toi</h3>
            <span className="text-[10px] bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full font-bold border border-slate-900">{jobs.length} DISPO</span>
          </div>
          {sortedJobs.map(job => {
            const isMatch = profileData.specific_dates_json?.includes(job.start_date);
            return (
              <div key={job.id} onClick={() => setViewingJob(job)} className={`bg-white p-5 rounded-3xl shadow-sm border-2 cursor-pointer transition-all ${isMatch ? 'border-green-500 ring-4 ring-green-100' : 'border-slate-900 hover:border-blue-600'}`}>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-black text-slate-900 text-lg">{job.title}</h3>
                  {isMatch && <div className="bg-green-400 text-slate-900 px-2 py-1 rounded-md border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest">Pendant tes dispos !</div>}
                </div>
                <p className="text-blue-700 font-bold text-sm mb-4">{job.companies?.company_name}</p>
                
                {(job.perk_meal || job.perk_transport || job.perk_tips) && (
                  <div className="flex gap-1 mb-4">
                    {job.perk_meal && <span className="bg-blue-50 border border-slate-900 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center uppercase"><Coffee size={10} className="mr-1"/> Repas</span>}
                    {job.perk_transport && <span className="bg-blue-50 border border-slate-900 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center uppercase"><Train size={10} className="mr-1"/> Trans.</span>}
                  </div>
                )}

                <div className="flex items-center text-[11px] font-black text-slate-600 gap-3">
                  <span className="bg-slate-100 border-2 border-slate-900 px-2 py-1 rounded-md flex items-center text-slate-700"><MapPin size={10} className="mr-1 text-slate-500"/> {job.location}</span>
                  <span className={`px-2 py-1 rounded-md flex items-center border-2 ${isMatch ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-100 border-slate-900 text-slate-700'}`}>
                    <CalIcon size={10} className="mr-1 shrink-0"/> 
                    <span className="truncate">{job.end_date ? `Du ${job.start_date} au ${job.end_date}` : job.start_date}</span>
                  </span>
                </div>
              </div>
            );
          })}
          {jobs.length === 0 && <p className="text-center text-slate-500 font-bold py-10">Aucune annonce pour le moment.</p>}
        </div>
      )}
    </div>
  );
}