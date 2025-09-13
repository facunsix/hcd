import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TaskList } from '../tasks/TaskList';
import { CalendarView } from '../calendar/CalendarView';
import { TaskMap } from '../map/TaskMap';
import { ClipboardList, Calendar, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface UserDashboardProps {
  user: any;
}

export function UserDashboard({ user }: UserDashboardProps) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No access token available');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-55f0477a/tasks`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        console.error('Error loading tasks:', await response.text());
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.filter(task => !task.completed).length;
    const overdue = tasks.filter(task => 
      !task.completed && new Date(task.endDate) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Cargando tus actividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Hola, {user.user_metadata?.name || 'Usuario'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Tus actividades asignadas y calendario de trabajo
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-xs sm:text-sm text-gray-600">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs sm:text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.overdue}</p>
                <p className="text-xs sm:text-sm text-gray-600">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <ClipboardList className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <ClipboardList className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Tareas</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <Calendar className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <MapPin className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Mapa</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Próximas Actividades</span>
                </CardTitle>
                <CardDescription>
                  Actividades programadas para los próximos días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks
                    .filter(task => !task.completed && new Date(task.startDate) >= new Date())
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .slice(0, 5)
                    .map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{task.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{task.workArea}</p>
                          <p className="text-xs text-gray-500">
                            Inicia: {new Date(task.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={task.priority === 'high' ? "destructive" : task.priority === 'medium' ? "default" : "secondary"} className="text-xs flex-shrink-0 ml-2">
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                    ))}
                  {tasks.filter(task => !task.completed && new Date(task.startDate) >= new Date()).length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No tienes actividades próximas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Completed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Actividades Completadas</span>
                </CardTitle>
                <CardDescription>
                  Últimas actividades que has completado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.completed)
                    .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
                    .slice(0, 5)
                    .map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{task.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{task.workArea}</p>
                          <p className="text-xs text-gray-500">
                            Completada: {new Date(task.completedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                      </div>
                    ))}
                  {tasks.filter(task => task.completed).length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No has completado actividades aún
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskList 
            tasks={tasks} 
            users={[]}
            onTaskUpdated={handleTaskUpdated}
            isAdmin={false}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView tasks={tasks} />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <TaskMap tasks={tasks.filter(task => task.location)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}