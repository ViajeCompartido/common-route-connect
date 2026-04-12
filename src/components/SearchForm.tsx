import { useState } from 'react';
import { MapPin, Calendar, Search, PawPrint, Luggage } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

interface SearchFormProps {
  onSearch?: (filters: SearchFilters) => void;
  compact?: boolean;
}

export interface SearchFilters {
  origin: string;
  destination: string;
  date: string;
  acceptsPets: boolean;
  allowsLuggage: boolean;
}

const SearchForm = ({ onSearch, compact = false }: SearchFormProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    origin: '',
    destination: '',
    date: '',
    acceptsPets: false,
    allowsLuggage: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(filters);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
        <Input
          placeholder="¿Desde dónde salís?"
          value={filters.origin}
          onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
          className="pl-10"
        />
      </div>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        <Input
          placeholder="¿A dónde vas?"
          value={filters.destination}
          onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
          className="pl-10"
        />
      </div>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="pl-10"
        />
      </div>

      {!compact && (
        <div className="flex gap-6 py-1">
          <div className="flex items-center gap-2">
            <Switch
              id="pets"
              checked={filters.acceptsPets}
              onCheckedChange={(v) => setFilters({ ...filters, acceptsPets: v })}
            />
            <Label htmlFor="pets" className="text-sm flex items-center gap-1">
              <PawPrint className="h-3.5 w-3.5" /> Mascotas
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="luggage"
              checked={filters.allowsLuggage}
              onCheckedChange={(v) => setFilters({ ...filters, allowsLuggage: v })}
            />
            <Label htmlFor="luggage" className="text-sm flex items-center gap-1">
              <Luggage className="h-3.5 w-3.5" /> Equipaje
            </Label>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full gradient-accent text-primary-foreground gap-2">
        <Search className="h-4 w-4" />
        Buscar viajes
      </Button>
    </motion.form>
  );
};

export default SearchForm;
