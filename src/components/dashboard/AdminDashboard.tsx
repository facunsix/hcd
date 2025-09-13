import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CreateTaskForm } from '../tasks/CreateTaskForm';
import { TaskList } from '../tasks/TaskList';
import { CalendarView } from '../calendar/CalendarView';
import { StatsCards } from '../stats/StatsCards';
import { Plus, ClipboardList, Calendar, BarChart3, Users, MapPin } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface AdminDashboardProps {
  user: any;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No access token available');
        return;
      }

      // Load tasks
      const tasksResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-55f0477a/tasks`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      } else {
        console.error('Error loading tasks:', await tasksResponse.text());
      }

      // Load users
      const usersResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-55f0477a/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      } else {
        console.error('Error loading users:', await usersResponse.text());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    setShowCreateTask(false);
    loadData();
  };

  const handleTaskUpdated = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Cargando panel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            Bienvenido, {user.user_metadata?.name || 'Administrador'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Panel de control para gestión de actividades comunitarias
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateTask(true)}
          className="bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Nueva Actividad</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards tasks={tasks} users={users} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <BarChart3 className="w-4 h-4" />
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
          <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <Users className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Usuarios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClipboardList className="w-5 h-5" />
                  <span>Actividades Recientes</span>
                </CardTitle>
                <CardDescription>
                  Últimas actividades creadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{task.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{task.workArea}</p>
                      </div>
                      <Badge variant={task.completed ? "default" : "secondary"} className="text-xs flex-shrink-0 ml-2">
                        {task.completed ? "Completada" : "Pendiente"}
                      </Badge>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No hay actividades creadas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Usuarios del Sistema</span>
                </CardTitle>
                <CardDescription>
                  Miembros registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-medium text-sm sm:text-base">
                          {user.user_metadata?.name?.charAt(0) || user.email.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {user.user_metadata?.name || 'Usuario'}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                      </div>
                      <Badge variant={user.user_metadata?.role === 'admin' ? "default" : "secondary"} className="text-xs flex-shrink-0">
                        {user.user_metadata?.role === 'admin' ? 'Admin' : 'Usuario'}
                      </Badge>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No hay usuarios registrados
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
            users={users} 
            onTaskUpdated={handleTaskUpdated}
            isAdmin={true}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView tasks={tasks} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Lista completa de usuarios registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-medium text-base sm:text-lg">
                          {user.user_metadata?.name?.charAt(0) || user.email.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {user.user_metadata?.name || 'Usuario'}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          Registrado: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge variant={user.user_metadata?.role === 'admin' ? "default" : "secondary"} className="text-xs">
                        {user.user_metadata?.role === 'admin' ? 'Admin' : 'Usuario'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No hay usuarios registrados en el sistema
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskForm
          users={users}
          onTaskCreated={handleTaskCreated}
          onCancel={() => setShowCreateTask(false)}
        />
      )}
    </div>
  );
}