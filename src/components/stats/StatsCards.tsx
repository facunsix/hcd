import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, Users, MapPin, Calendar, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  tasks: any[];
  users: any[];
}

export function StatsCards({ tasks, users }: StatsCardsProps) {
  const getStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.filter(task => !task.completed && new Date(task.endDate) >= new Date()).length;
    const overdueTasks = tasks.filter(task => !task.completed && new Date(task.endDate) < new Date()).length;
    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.user_metadata?.role === 'admin').length;
    const regularUsers = users.filter(user => user.user_metadata?.role !== 'admin').length;
    const tasksWithLocation = tasks.filter(task => task.location).length;
    
    // Tasks this week
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const tasksThisWeek = tasks.filter(task => {
      const taskStart = new Date(task.startDate);
      return taskStart >= weekStart && taskStart <= weekEnd;
    }).length;

    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      totalUsers,
      adminUsers,
      regularUsers,
      tasksWithLocation,
      tasksThisWeek,
      completionRate
    };
  };

  const stats = getStats();

  const getWorkAreaStats = () => {
    const workAreas = {};
    tasks.forEach(task => {
      if (!workAreas[task.workArea]) {
        workAreas[task.workArea] = 0;
      }
      workAreas[task.workArea]++;
    });
    return workAreas;
  };

  const workAreaStats = getWorkAreaStats();
  const topWorkArea = Object.entries(workAreaStats).sort(([,a], [,b]) => b - a)[0];

  const statCards = [
    {
      title: 'Total Actividades',
      value: stats.totalTasks,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Actividades creadas'
    },
    {
      title: 'Completadas',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: `${stats.completionRate}% de completitud`
    },
    {
      title: 'Pendientes',
      value: stats.pendingTasks,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'En progreso'
    },
    {
      title: 'Vencidas',
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Requieren atención'
    },
    {
      title: 'Usuarios Activos',
      value: stats.regularUsers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: `${stats.adminUsers} administradores`
    },
    {
      title: 'Con Ubicación',
      value: stats.tasksWithLocation,
      icon: MapPin,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Geolocalizadas'
    },
    {
      title: 'Esta Semana',
      value: stats.tasksThisWeek,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Programadas'
    },
    {
      title: 'Área Principal',
      value: topWorkArea ? topWorkArea[1] : 0,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      description: topWorkArea ? topWorkArea[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}