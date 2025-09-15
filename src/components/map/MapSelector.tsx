import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface MapSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  selectedLocation: { lat: number; lng: number; address?: string } | null;
  height?: string;
}

export function MapSelector({ onLocationSelect, selectedLocation, height = "300px" }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const loadMap = async () => {
      if (!mapRef.current) return;

      try {
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default;
        
        // Import Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Fix default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Default location: Posadas, Misiones, Argentina
        const defaultLat = -27.3676;
        const defaultLng = -55.8967;

        // Initialize map
        const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Handle map clicks
        map.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          
          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Add new marker
          markerRef.current = L.marker([lat, lng]).addTo(map);

          // Try to get address via reverse geocoding (Nominatim)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();
            const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            
            onLocationSelect({ lat, lng, address });
            markerRef.current.bindPopup(address).openPopup();
          } catch (error) {
            console.error('Error getting address:', error);
            const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationSelect({ lat, lng, address });
            markerRef.current.bindPopup(address).openPopup();
          }
        });

        // Set existing marker if location is already selected
        if (selectedLocation) {
          markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);
          if (selectedLocation.address) {
            markerRef.current.bindPopup(selectedLocation.address);
          }
          map.setView([selectedLocation.lat, selectedLocation.lng], 15);
        }

        mapInstanceRef.current = map;

        // Cleanup function
        return () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
          }
        };
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    loadMap();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

// Update marker when selectedLocation changes
useEffect(() => {
  if (mapInstanceRef.current && selectedLocation) {
    (async () => {
      const L = (await import('leaflet')).default; // ✅ corrección

      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Add new marker
      markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(mapInstanceRef.current);
      if (selectedLocation.address) {
        markerRef.current.bindPopup(selectedLocation.address);
      }
      mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 15);
    })();
  }
}, [selectedLocation]);


  return (
    <div className="space-y-2">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-300 overflow-hidden"
      />
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span>
          {selectedLocation 
            ? selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
            : 'Haga clic en el mapa para seleccionar una ubicación'
          }
        </span>
      </div>
      {selectedLocation && (
        <button
          type="button"
          onClick={() => {
            onLocationSelect(null);
            if (markerRef.current && mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current);
              markerRef.current = null;
            }
          }}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Limpiar ubicación
        </button>
      )}
    </div>
  );
}
