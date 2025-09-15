import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Calendar, Users, Navigation } from 'lucide-react';

interface TaskMapProps {
  tasks: any[];
}

export function TaskMap({ tasks }: TaskMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);

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
        const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 12);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Add markers for tasks
        addTaskMarkers(L, map);

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

  const addTaskMarkers = async (L: any, map: any) => {
    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Create custom icons for different task statuses
    const createCustomIcon = (color: string) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          width: 25px;
          height: 25px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      });
    };

    const completedIcon = createCustomIcon('#10b981'); // green
    const pendingIcon = createCustomIcon('#3b82f6'); // blue
    const overdueIcon = createCustomIcon('#ef4444'); // red

    // Add markers for each task with location
    const tasksWithLocation = tasks.filter(task => task.location && task.location.lat && task.location.lng);
    
    if (tasksWithLocation.length === 0) {
      return;
    }

    tasksWithLocation.forEach(task => {
      const { lat, lng } = task.location;
      const isOverdue = !task.completed && new Date(task.endDate) < new Date();
      
      let icon;
      if (task.completed) {
        icon = completedIcon;
      } else if (isOverdue) {
        icon = overdueIcon;
      } else {
        icon = pendingIcon;
      }

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      
      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${task.title}</h3>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${task.description}</p>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
            <div><strong>Estado:</strong> ${task.completed ? 'Completada' : isOverdue ? 'Vencida' : 'Pendiente'}</div>
            <div><strong>Área:</strong> ${task.workArea}</div>
            <div><strong>Fecha:</strong> ${new Date(task.startDate).toLocaleDateString()}</div>
            ${task.location.address ? `<div><strong>Dirección:</strong> ${task.location.address}</div>` : ''}
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      
      // Add click event to show task details in sidebar
      marker.on('click', () => {
        setSelectedTask(task);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (tasksWithLocation.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

// Update markers when tasks change
useEffect(() => {
  if (mapInstanceRef.current) {
    (async () => {
      const L = (await import('leaflet')).default; // ✅ CORRECCIÓN AQUÍ
      addTaskMarkers(L, mapInstanceRef.current);
    })();
  }
}, [tasks]);


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Media';
    }
  };

  const isOverdue = (task: any) => {
    return !task.completed && new Date(task.endDate) < new Date();
  };

  const openInMaps = (task: any) => {
    if (task.location && task.location.lat && task.location.lng) {
      const { lat, lng } = task.location;
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Mapa de Actividades</span>
            </CardTitle>
            <CardDescription>
              Ubicaciones de las actividades asignadas en Posadas, Misiones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              ref={mapRef} 
              style={{ height: '500px', width: '100%' }}
              className="rounded-b-lg overflow-hidden"
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Leyenda</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Pendiente</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Completada</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Vencida</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Details Sidebar */}
      <div className="space-y-4">
        {selectedTask ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalles de la Actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedTask.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    {new Date(selectedTask.startDate).toLocaleDateString()} - {new Date(selectedTask.endDate).toLocaleDateString()}
                  </span>
                </div>

                {selectedTask.location?.address && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{selectedTask.location.address}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={getPriorityColor(selectedTask.priority)}>
                  {getPriorityLabel(selectedTask.priority)}
                </Badge>
                {selectedTask.completed && (
                  <Badge className="bg-green-100 text-green-800">
                    Completada
                  </Badge>
                )}
                {isOverdue(selectedTask) && (
                  <Badge className="bg-red-100 text-red-800">
                    Vencida
                  </Badge>
                )}
              </div>

              {selectedTask.location && (
                <Button
                  onClick={() => openInMaps(selectedTask)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Abrir en Google Maps
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                Selecciona una actividad
              </h3>
              <p className="text-sm text-gray-600">
                Haz clic en un marcador del mapa para ver los detalles de la actividad.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas del Mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total con ubicación:</span>
                <span className="font-medium">{tasks.filter(t => t.location).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completadas:</span>
                <span className="font-medium text-green-600">
                  {tasks.filter(t => t.location && t.completed).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pendientes:</span>
                <span className="font-medium text-blue-600">
                  {tasks.filter(t => t.location && !t.completed && new Date(t.endDate) >= new Date()).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vencidas:</span>
                <span className="font-medium text-red-600">
                  {tasks.filter(t => t.location && !t.completed && new Date(t.endDate) < new Date()).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
