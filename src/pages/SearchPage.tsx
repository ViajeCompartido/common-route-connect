import { useState } from 'react';
import SearchForm, { SearchFilters } from '@/components/SearchForm';
import TripCard from '@/components/TripCard';
import BottomNav from '@/components/BottomNav';
import { mockTrips } from '@/data/mockData';
import { computeMatchScore, MatchResult } from '@/lib/fuzzyMatch';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/types';
import { motion } from 'framer-motion';

interface ScoredTrip {
  trip: Trip;
  match: MatchResult;
}

const compatibilityColor = (score: number) => {
  if (score >= 0.9) return 'bg-green-500/15 text-green-700 border-green-500/30';
  if (score >= 0.7) return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
  if (score >= 0.5) return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
  return 'bg-muted text-muted-foreground border-border';
};

const SearchPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ScoredTrip[]>(
    mockTrips.map(trip => ({ trip, match: { tripId: trip.id, overallScore: 1, originMatch: { match: true, score: 1, label: '' }, destinationMatch: { match: true, score: 1, label: '' }, timeMatch: { match: true, diffMinutes: 0, label: '' }, dateMatch: { match: true, label: '' }, compatibilityLabel: '' } }))
  );
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (filters: SearchFilters) => {
    setHasSearched(true);
    
    // First apply hard filters (pets, luggage, rating, seats)
    let filtered = mockTrips.filter(t => {
      if (filters.acceptsPets && !t.acceptsPets) return false;
      if (filters.driverHasPet && !t.hasPet) return false;
      if (filters.allowsLuggage && !t.allowsLuggage) return false;
      if (filters.minRating > 0 && t.driverRating < filters.minRating) return false;
      if (filters.minSeats > 1 && t.availableSeats < filters.minSeats) return false;
      return true;
    });

    // Then compute fuzzy match scores
    const scored: ScoredTrip[] = filtered
      .map(trip => ({
        trip,
        match: computeMatchScore(
          { origin: filters.origin, destination: filters.destination, date: filters.date, time: filters.time },
          trip
        ),
      }))
      .filter(s => {
        // At least origin or destination must have some match if provided
        if (filters.origin && !s.match.originMatch.match) return false;
        if (filters.destination && !s.match.destinationMatch.match) return false;
        return s.match.overallScore >= 0.2;
      })
      .sort((a, b) => b.match.overallScore - a.match.overallScore);

    setResults(scored);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground mb-1">Buscar viajes</h1>
          <p className="text-xs text-primary-foreground/60 mb-4">Buscamos viajes compatibles con tu zona y horario</p>
          <div className="bg-card rounded-2xl p-5 shadow-ocean">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          {results.length} viaje{results.length !== 1 ? 's' : ''} {hasSearched ? 'compatible' : 'disponible'}{results.length !== 1 ? 's' : ''}
        </p>
        <div className="space-y-3">
          {results.map(({ trip, match }, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {hasSearched && match.compatibilityLabel && (
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${compatibilityColor(match.overallScore)}`}>
                    <Sparkles className="h-3 w-3" />
                    {match.compatibilityLabel}
                  </span>
                  {match.originMatch.label && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Origen: {match.originMatch.label}
                    </span>
                  )}
                  {match.timeMatch.label && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {match.timeMatch.label}
                    </span>
                  )}
                  {match.dateMatch.label && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {match.dateMatch.label}
                    </span>
                  )}
                </div>
              )}
              <TripCard trip={trip} index={i} />
            </motion.div>
          ))}
          {results.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">No encontramos viajes compatibles.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Probá ampliando la zona o cambiando el horario.</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default SearchPage;
