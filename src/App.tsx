import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { LogOut, Users, ClipboardList } from 'lucide-react';
import { supabase } from './utils/supabase/client';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const onAuthSuccess = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sistema de Gestión de Actividades
              </h1>
              <p className="text-gray-600">
                Honorable Consejo Deliberante - Posadas, Misiones
              </p>
            </div>

            <Tabs value={isLogin ? "login" : "register"} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="login" 
                  onClick={() => setIsLogin(true)}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  onClick={() => setIsLogin(false)}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm onSuccess={onAuthSuccess} />
              </TabsContent>
              
              <TabsContent value="register">
                <RegisterForm onSuccess={onAuthSuccess} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.user_metadata?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  Gestión de Actividades
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Consejo Deliberante - Posadas
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="hidden sm:flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isAdmin ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <span className="text-sm text-gray-600 hidden md:inline">
                  {user.user_metadata?.name || user.email}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isAdmin 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isAdmin ? 'Admin' : 'Usuario'}
                </span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {isAdmin ? (
          <AdminDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}
      </main>
    </div>
  );
}