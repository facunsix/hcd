import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface WorkAreaManagerProps {
  workAreas: any[];
  onWorkAreaCreated: () => void;
}

export function WorkAreaManager({ workAreas, onWorkAreaCreated }: WorkAreaManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'neighborhood', // neighborhood, category, sector
    color: '#10B981'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const areaTypes = {
    neighborhood: 'Barrio',
    category: 'Categoría',
    sector: 'Sector'
  };

  const predefinedColors = [
    '#10B981', // green
    '#3B82F6', // blue
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16'  // lime
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Error de autenticación');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-55f0477a/work-areas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear área de trabajo');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'neighborhood',
        color: '#10B981'
      });
      setShowCreateForm(false);
      onWorkAreaCreated();
    } catch (error) {
      setError(error.message || 'Error al crear área de trabajo');
      console.error('Work area creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'neighborhood':
        return '🏘️';
      case 'category':
        return '📂';
      case 'sector':
        return '🏢';
      default:
        return '📍';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Áreas de Trabajo
            </CardTitle>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Área
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create form */}
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Crear Nueva Área de Trabajo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area-name">Nombre del Área *</Label>
                      <Input
                        id="area-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Ej: Barrio San José"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area-type">Tipo de Área</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => handleInputChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="neighborhood">Barrio</SelectItem>
                          <SelectItem value="category">Categoría</SelectItem>
                          <SelectItem value="sector">Sector</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area-description">Descripción</Label>
                    <Textarea
                      id="area-description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe esta área de trabajo..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Color Identificativo</Label>
                    <div className="flex space-x-2">
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color ? 'border-gray-400' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleInputChange('color', color)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando...
                        </div>
                      ) : (
                        'Crear Área'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Areas list */}
          {workAreas.length === 0 && !showCreateForm ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No hay áreas de trabajo creadas</p>
              <p className="text-sm text-gray-500">Las áreas ayudan a organizar las tareas por ubicación o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workAreas.map(area => (
                <Card key={area.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: area.color || '#10B981' }}
                        />
                        <h4 className="font-medium">{area.name}</h4>
                      </div>
                      <span className="text-lg">{getTypeIcon(area.type)}</span>
                    </div>
                    
                    <Badge variant="outline" className="mb-2">
                      {areaTypes[area.type] || area.type}
                    </Badge>
                    
                    {area.description && (
                      <p className="text-sm text-gray-600 mb-2">{area.description}</p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Creada: {new Date(area.created_at).toLocaleDateString('es-AR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Default areas info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Áreas Predefinidas Disponibles:</h4>
            <div className="flex flex-wrap gap-2">
              {['Centro', 'Barrio Norte', 'Barrio Sur', 'Barrio Este', 'Barrio Oeste'].map(area => (
                <Badge key={area} variant="outline" className="text-blue-700 border-blue-200">
                  {area}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-blue-700 mt-2">
              Estas áreas están disponibles automáticamente al crear tareas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}