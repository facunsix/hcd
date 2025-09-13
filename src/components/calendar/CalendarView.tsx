import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users } from 'lucide-react';

interface CalendarViewProps {
  tasks: any[];
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }
    
    return days;
  }, [currentYear, currentMonth, daysInMonth, startingDayOfWeek]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    if (!date) return [];
    
    return tasks.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      // Check if the target date falls within the task's date range
      return targetDate >= new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate()) &&
             targetDate <= new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate());
    });
  };

  // Get selected date tasks
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!date || !selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Calendario de Actividades</span>
                </CardTitle>
                <CardDescription>
                  Vista mensual de todas las actividades programadas
                </CardDescription>
              </div>
              <Button onClick={goToToday} variant="outline" size="sm">
                Hoy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <h2 className="text-xl font-semibold">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayTasks = date ? getTasksForDate(date) : [];
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                      ${date ? 'hover:bg-gray-50' : 'bg-gray-100 cursor-default'}
                      ${isToday(date) ? 'border-green-500 bg-green-50' : 'border-gray-200'}
                      ${isSelected(date) ? 'border-blue-500 bg-blue-50' : ''}
                    `}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday(date) ? 'text-green-700' : 'text-gray-900'}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className={`
                                text-xs p-1 rounded text-white truncate
                                ${task.completed ? 'bg-green-600' : isOverdue(task) ? 'bg-red-600' : 'bg-blue-600'}
                              `}
                              title={task.title}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayTasks.length - 3} más
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate 
                ? `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`
                : 'Selecciona una fecha'
              }
            </CardTitle>
            <CardDescription>
              {selectedDateTasks.length === 0 
                ? 'No hay actividades programadas'
                : `${selectedDateTasks.length} actividad${selectedDateTasks.length !== 1 ? 'es' : ''} programada${selectedDateTasks.length !== 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateTasks.length > 0 ? (
              <div className="space-y-3">
                {selectedDateTasks.map((task, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                        {task.title}
                      </h4>
                      <div className="flex flex-col space-y-1">
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        {task.completed && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Completada
                          </Badge>
                        )}
                        {isOverdue(task) && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Vencida
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">{task.description}</p>
                    
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(task.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                          {new Date(task.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{task.workArea}</span>
                      </div>
                      {task.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>Ubicación marcada</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No hay actividades programadas para esta fecha.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Selecciona una fecha en el calendario para ver las actividades programadas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total actividades:</span>
                <span className="font-medium">
                  {tasks.filter(task => {
                    const taskDate = new Date(task.startDate);
                    return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completadas:</span>
                <span className="font-medium text-green-600">
                  {tasks.filter(task => {
                    const taskDate = new Date(task.startDate);
                    return task.completed && taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pendientes:</span>
                <span className="font-medium text-blue-600">
                  {tasks.filter(task => {
                    const taskDate = new Date(task.startDate);
                    return !task.completed && new Date(task.endDate) >= new Date() && 
                           taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vencidas:</span>
                <span className="font-medium text-red-600">
                  {tasks.filter(task => {
                    const taskDate = new Date(task.startDate);
                    return !task.completed && new Date(task.endDate) < new Date() && 
                           taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
                  }).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}