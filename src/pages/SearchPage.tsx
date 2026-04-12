import { useState } from 'react';
import SearchForm, { SearchFilters } from '@/components/SearchForm';
import TripCard from '@/components/TripCard';
import BottomNav from '@/components/BottomNav';
import { mockTrips } from '@/data/mockData';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(mockTrips);

  const handleSearch = (filters: SearchFilters) => {
    let filtered = mockTrips;
    if (filters.origin) filtered = filtered.filter(t => t.origin.toLowerCase().includes(filters.origin.toLowerCase()));
    if (filters.destination) filtered = filtered.filter(t => t.destination.toLowerCase().includes(filters.destination.toLowerCase()));
    if (filters.date) filtered = filtered.filter(t => t.date === filters.date);
    if (filters.acceptsPets) filtered = filtered.filter(t => t.acceptsPets);
    if (filters.allowsLuggage) filtered = filtered.filter(t => t.allowsLuggage);
    setResults(filtered);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground mb-4">Buscar viajes</h1>
          <div className="bg-card rounded-xl p-4">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-4">{results.length} viajes encontrados</p>
        <div className="space-y-3">
          {results.map((trip, i) => (
            <TripCard key={trip.id} trip={trip} index={i} />
          ))}
          {results.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No se encontraron viajes con esos filtros.</p>
          )}
        </div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default SearchPage;
