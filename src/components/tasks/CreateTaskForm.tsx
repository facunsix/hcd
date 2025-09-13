import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { MapSelectorWithSearch } from '../map/MapSelectorWithSearch';
import { X, Save, MapPin, Users, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface CreateTaskFormProps {
  users: any[];
  onTaskCreated: () => void;
  onCancel: () => void;
}

export function CreateTaskForm({ users, onTaskCreated, onCancel }: CreateTaskFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    workArea: 'general',
    priority: 'medium',
    assignedUsers: [] as string[]
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const workAreas = [
  { value: 'general', label: 'General' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'servicios_publicos', label: 'Servicios Públicos' },
  { value: 'eventos', label: 'Eventos Comunitarios' },
  { value: 'asistencia_social', label: 'Asistencia Social' },
  { value: 'educacion', label: 'Educación' },
  { value: 'salud', label: 'Salud' },
  { value: 'seguridad', label: 'Seguridad Ciudadana' },
  { value: 'cultura', label: 'Cultura y Patrimonio' },
  { value: 'deporte', label: 'Deporte y Recreación' },
  { value: 'medio_ambiente', label: 'Medio Ambiente y Sustentabilidad' },
  { value: 'transporte', label: 'Transporte y Movilidad' },
  { value: 'economia', label: 'Desarrollo Económico' },
  { value: 'tecnologia', label: 'Innovación y Tecnología' }
];


  const priorities = [
    { value: 'low', label: 'Baja', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      setError('Todos los campos obligatorios deben ser completados');
      setLoading(false);
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('La fecha de finalización debe ser posterior a la fecha de inicio');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Error de autenticación. Intente nuevamente.');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-55f0477a/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          location: selectedLocation
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear la actividad');
        return;
      }

      onTaskCreated();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Error al crear la actividad. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserToggle = (userId: string) => {
    setFormData({
      ...formData,
      assignedUsers: formData.assignedUsers.includes(userId)
        ? formData.assignedUsers.filter(id => id !== userId)
        : [...formData.assignedUsers, userId]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Nueva Actividad</CardTitle>
                <CardDescription>
                  Crear una nueva actividad para asignar a los miembros del equipo
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título de la Actividad *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Ej: Inspección de cañerías en Barrio Centro"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describa los detalles de la actividad..."
                      required
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Fecha de Inicio *</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Fecha de Finalización *</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="workArea">Área de Trabajo</Label>
                      <Select value={formData.workArea} onValueChange={(value) => setFormData({...formData, workArea: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                        <SelectContent>
                          {workAreas.map((area) => (
                            <SelectItem key={area.value} value={area.value}>
                              {area.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Prioridad</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              <Badge className={priority.color}>
                                {priority.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Assigned Users */}
                  <div>
                    <Label className="flex items-center space-x-2 mb-3">
                      <Users className="w-4 h-4" />
                      <span>Asignar a Usuarios</span>
                    </Label>
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                      {users.filter(user => user.user_metadata?.role !== 'admin').map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={formData.assignedUsers.includes(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                          />
                          <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer min-w-0">
                            <div>
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                {user.user_metadata?.name || 'Usuario'}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                      {users.filter(user => user.user_metadata?.role !== 'admin').length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No hay usuarios disponibles para asignar
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Map Selector */}
                  <div>
                    <Label className="flex items-center space-x-2 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>Ubicación (Opcional)</span>
                    </Label>
                    <div className="border rounded-lg p-2 sm:p-3">
                      <MapSelectorWithSearch
                        onLocationSelect={setSelectedLocation}
                        selectedLocation={selectedLocation}
                        height="180px"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t">
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Crear Actividad</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}