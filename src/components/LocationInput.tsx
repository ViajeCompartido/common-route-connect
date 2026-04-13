import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { getLocationSuggestions, normalizeLocation } from '@/lib/normalizeLocation';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  iconColor?: string;
  className?: string;
  required?: boolean;
}

const LocationInput = ({ value, onChange, placeholder, iconColor = 'text-accent', className = '', required }: LocationInputProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (text: string) => {
    onChange(text);
    const s = getLocationSuggestions(text);
    setSuggestions(s);
    setShowSuggestions(s.length > 0);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Normalize on blur
    setTimeout(() => {
      if (value.trim()) {
        onChange(normalizeLocation(value));
      }
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${iconColor}`} />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        onBlur={handleBlur}
        className={`pl-10 h-12 text-sm rounded-xl ${className}`}
        required={required}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
              onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
