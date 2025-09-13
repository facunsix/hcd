import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface MapSelectorWithSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string } | null) => void;
  selectedLocation: { lat: number; lng: number; address?: string } | null;
  height?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

export function MapSelectorWithSearch({
  onLocationSelect,
  selectedLocation,
  height = "300px",
}: MapSelectorWithSearchProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar mapa
  useEffect(() => {
    const loadMap = async () => {
      if (!mapRef.current) return;

      try {
        const L = (await import('leaflet')).default;

        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        const defaultLat = -27.3676;
        const defaultLng = -55.8967;

        const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        map.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) map.removeLayer(markerRef.current);
          markerRef.current = L.marker([lat, lng]).addTo(map);

          try {
            const response = await fetch(
              `/nominatim/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
              { headers: { 'Accept': 'application/json' } }
            );
            const data = await response.json();
            const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationSelect({ lat, lng, address });
            markerRef.current.bindPopup(address).openPopup();
          } catch (error) {
            console.error('Error obteniendo dirección:', error);
            const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationSelect({ lat, lng, address });
            markerRef.current.bindPopup(address).openPopup();
          }
        });

        // Si ya hay ubicación seleccionada, mostrar marcador
        if (selectedLocation) {
          markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);
          if (selectedLocation.address) markerRef.current.bindPopup(selectedLocation.address);
          map.setView([selectedLocation.lat, selectedLocation.lng], 15);
        }

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Error cargando mapa:', error);
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Función de búsqueda automática
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/nominatim/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=ar&viewbox=-56.5,-26.5,-55.5,-28.5&bounded=1&addressdetails=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data: SearchResult[] = await response.json();

      if (data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        const address = first.display_name;

        onLocationSelect({ lat, lng, address });
        setSearchQuery(address);

        if (mapInstanceRef.current) {
          const L = (await import('leaflet')).default;
          if (markerRef.current) mapInstanceRef.current.removeLayer(markerRef.current);
          markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
          markerRef.current.bindPopup(address).openPopup();
          mapInstanceRef.current.setView([lat, lng], 15);
        }
      }
    } catch (error) {
      console.error('Error buscando lugar:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Input con debounce
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-2 sm:space-y-3 relative">
      {/* Search Input */}
      <div className="relative z-50">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar lugar..."
          value={searchQuery}
          onChange={handleSearchInput}
          className="pl-10 pr-10 text-sm"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-300 overflow-hidden"
      />

      {/* Location Info */}
      <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
        <span className="break-words">
          {selectedLocation
            ? selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
            : 'Busque un lugar o toque el mapa'}
        </span>
      </div>

      {/* Clear Location Button */}
      {selectedLocation && (
        <button
          type="button"
          onClick={() => {
            onLocationSelect(null);
            if (markerRef.current && mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current);
              markerRef.current = null;
            }
            clearSearch();
          }}
          className="text-xs sm:text-sm text-red-600 hover:text-red-800"
        >
          Limpiar ubicación
        </button>
      )}
    </div>
  );
}
