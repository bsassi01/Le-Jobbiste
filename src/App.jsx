import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CandidateView from './views/CandidateView';
import CompanyView from './views/CompanyView';
import { User, Building } from 'lucide-react';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-200 font-sans text-slate-900">
        
        {/* Barre de navigation globale */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="font-black text-xl tracking-tight">Le Jobbiste <span className="text-blue-600 text-sm">BETA</span></div>
            <div className="flex gap-4">
              <Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center transition-colors">
                <User className="w-4 h-4 mr-1"/> Jeunes
              </Link>
              <Link to="/recruteur" className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center transition-colors">
                <Building className="w-4 h-4 mr-1"/> Entreprises
              </Link>
            </div>
          </div>
        </nav>

        {/* Contenu des pages */}
        <main className="pb-12 pt-6">
          <Routes>
            <Route path="/" element={<CandidateView />} />
            <Route path="/recruteur" element={<CompanyView />} />
          </Routes>
        </main>
        
      </div>
    </Router>
  );
}