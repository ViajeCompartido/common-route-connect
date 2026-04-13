import { useState } from 'react';
import { Calendar, Search, SlidersHorizontal, X, Clock, PawPrint, Luggage, Star, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import LocationInput from '@/components/LocationInput';

interface SearchFormProps {
  onSearch?: (filters: SearchFilters) => void;
  compact?: boolean;
}

export interface SearchFilters {
  origin: string;
  destination: string;
  date: string;
  time: string;
  acceptsPets: boolean;
  driverHasPet: boolean;
  allowsLuggage: boolean;
  minRating: number;
  minSeats: number;
}

const SearchForm = ({ onSearch, compact = false }: SearchFormProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    origin: '', destination: '', date: '', time: '',
    acceptsPets: false, driverHasPet: false, allowsLuggage: false,
    minRating: 0, minSeats: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(filters);
  };

  const activeFilterCount = [
    filters.acceptsPets, filters.driverHasPet, filters.allowsLuggage,
    filters.minRating > 0, filters.minSeats > 1,
  ].filter(Boolean).length;

  return (
    <motion.form onSubmit={handleSubmit} className="space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <LocationInput
        value={filters.origin}
        onChange={v => setFilters({ ...filters, origin: v })}
        placeholder="¿Desde dónde salís?"
        iconColor="text-accent"
      />
      <LocationInput
        value={filters.destination}
        onChange={v => setFilters({ ...filters, destination: v })}
        placeholder="¿A dónde vas?"
        iconColor="text-primary"
      />

      {!compact && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className="pl-10 h-12 text-sm rounded-xl" />
          </div>
          <div className="relative w-[130px]">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="time" value={filters.time} onChange={e => setFilters({ ...filters, time: e.target.value })} className="pl-10 h-12 text-sm rounded-xl" />
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/70 -mt-1">
        Te mostramos viajes y pasajeros compatibles con tu ruta, no hace falta que coincidan exacto.
      </p>

      {!compact && (
        <button type="button" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-sm text-primary font-medium py-1">
          <SlidersHorizontal className="h-4 w-4" /> Filtros
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </button>
      )}

      <AnimatePresence>
        {!compact && showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4 pt-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="pets-search" className="text-sm flex items-center gap-2"><PawPrint className="h-4 w-4 text-accent" /> Acepta mascotas</Label>
                <Switch id="pets-search" checked={filters.acceptsPets} onCheckedChange={v => setFilters({ ...filters, acceptsPets: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="driver-pet" className="text-sm flex items-center gap-2"><PawPrint className="h-4 w-4 text-muted-foreground" /> Chofer viaja con mascota</Label>
                <Switch id="driver-pet" checked={filters.driverHasPet} onCheckedChange={v => setFilters({ ...filters, driverHasPet: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="luggage-search" className="text-sm flex items-center gap-2"><Luggage className="h-4 w-4" /> Permite equipaje grande</Label>
                <Switch id="luggage-search" checked={filters.allowsLuggage} onCheckedChange={v => setFilters({ ...filters, allowsLuggage: v })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Reputación mínima: {filters.minRating > 0 ? `${filters.minRating}+ ★` : 'Cualquiera'}</Label>
              <Slider value={[filters.minRating]} onValueChange={([v]) => setFilters({ ...filters, minRating: v })} min={0} max={5} step={0.5} className="py-2" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Asientos mínimos: {filters.minSeats}</Label>
              <Slider value={[filters.minSeats]} onValueChange={([v]) => setFilters({ ...filters, minSeats: v })} min={1} max={6} step={1} className="py-2" />
            </div>
            {activeFilterCount > 0 && (
              <button type="button" onClick={() => setFilters({ ...filters, acceptsPets: false, driverHasPet: false, allowsLuggage: false, minRating: 0, minSeats: 1 })} className="text-xs text-destructive flex items-center gap-1">
                <X className="h-3 w-3" /> Limpiar filtros
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold">
        <Search className="h-4 w-4" /> Buscar viajes compatibles
      </Button>
    </motion.form>
  );
};

export default SearchForm;
