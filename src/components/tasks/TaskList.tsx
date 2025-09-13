import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, Clock, MapPin, Users, Calendar, Trash2, Search, Filter, ClipboardList } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface TaskListProps {
  tasks: any[];
  users: any[];
  onTaskUpdated: () => void;
  isAdmin: boolean;
}

export function TaskList({ tasks, users, onTaskUpdated, isAdmin }: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWorkArea, setFilterWorkArea] = useState('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const workAreas = [
    { value: 'all', label: 'Todas las áreas' },
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


  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && task.completed) ||
                         (filterStatus === 'pending' && !task.completed) ||
                         (filterStatus === 'overdue' && !task.completed && new Date(task.endDate) < new Date());
    const matchesWorkArea = filterWorkArea === 'all' || task.workArea === filterWorkArea;
    
    return matchesSearch && matchesStatus && matchesWorkArea;
  });

  const handleCompleteTask = async (taskId: string) => {
    setLoading(taskId);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Error de autenticación. Intente nuevamente.');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-55f0477a/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al marcar la actividad como completada');
        return;
      }

      onTaskUpdated();
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Error al completar la actividad. Intente nuevamente.');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta actividad?')) {
      return;
    }

    setLoading(taskId);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Error de autenticación. Intente nuevamente.');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-55f0477a/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al eliminar la actividad');
        return;
      }

      onTaskUpdated();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Error al eliminar la actividad. Intente nuevamente.');
    } finally {
      setLoading(null);
    }
  };

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

  const getWorkAreaLabel = (workArea: string) => {
    const area = workAreas.find(a => a.value === workArea);
    return area?.label || workArea;
  };

  const getUserNames = (userIds: string[]) => {
    return userIds.map(id => {
      const user = users.find(u => u.id === id);
      return user?.user_metadata?.name || user?.email || 'Usuario';
    }).join(', ');
  };

  const isOverdue = (task: any) => {
    return !task.completed && new Date(task.endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar actividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterWorkArea} onValueChange={setFilterWorkArea}>
              <SelectTrigger>
                <SelectValue placeholder="Área de trabajo" />
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
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`${task.completed ? 'border-green-200 bg-green-50/30' : isOverdue(task) ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <p className={`text-sm mt-1 ${task.completed ? 'text-gray-500' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                      {task.completed && (
                        <Badge className="bg-green-100 text-green-800">
                          Completada
                        </Badge>
                      )}
                      {isOverdue(task) && (
                        <Badge className="bg-red-100 text-red-800">
                          Vencida
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{getWorkAreaLabel(task.workArea)}</span>
                    </div>

                    {task.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Ubicación marcada</span>
                      </div>
                    )}

                    {isAdmin && task.assignedUsers && task.assignedUsers.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span className="truncate">
                          {getUserNames(task.assignedUsers)}
                        </span>
                      </div>
                    )}
                  </div>

                  {task.completed && task.completedAt && (
                    <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                      Completada el {new Date(task.completedAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {!task.completed && (
                    <Button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={loading === task.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      {loading === task.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completar
                        </>
                      )}
                    </Button>
                  )}
                  
                  {isAdmin && (
                    <Button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={loading === task.id}
                      variant="destructive"
                      size="sm"
                    >
                      {loading === task.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron actividades
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' || filterWorkArea !== 'all'
                  ? 'Intenta ajustar los filtros para ver más resultados.'
                  : 'No hay actividades disponibles en este momento.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}