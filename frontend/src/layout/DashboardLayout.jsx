import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LayoutDashboard, Target, History, Settings, LogOut, Menu, X, Bell, MessageSquarePlus, Mic, BookOpen, Brain, Trophy, FileText, MessageCircle, FileEdit, ShieldAlert, Moon, Sun, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedbackModal from '../components/FeedbackModal';
import { useTheme } from '../components/ThemeProvider';
import LanguageSelector from '../components/LanguageSelector';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Mock Interview', href: '/dashboard/setup', icon: <Mic size={20} /> },
    { name: 'Resume Builder', href: '/dashboard/resume-builder', icon: <FileEdit size={20} /> },
    { name: 'Aptitude & Quiz', href: '/dashboard/quiz', icon: <Brain size={20} /> },
    { name: 'My Reports', href: '/dashboard/history', icon: <History size={20} /> },
    { name: 'AI Mentor Chat', href: '/dashboard/ai-mentor', icon: <MessageCircle size={20} /> },
    { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: <Trophy size={20} /> },
    { name: 'Blog', href: '/dashboard/blog', icon: <FileText size={20} /> },
    { name: 'Profile', href: '/dashboard/profile', icon: <Settings size={20} /> },
    { name: 'Settings', href: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  if (user?.role === 'admin') {
    navigation.unshift({ name: 'Admin Panel', href: '/dashboard/admin', icon: <ShieldAlert size={20} className="text-destructive" /> });
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:relative top-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-border">
  <div className="flex items-center gap-3">
    <img src="/logo.jpg" alt="IIPAS Logo" className="w-9 h-9 object-contain rounded-lg shadow-sm" />
    <Link to="/" className="flex flex-col">
      <span className="font-bold text-lg tracking-tight leading-none">IIPAS</span>
      <span className="text-[10px] text-primary font-medium tracking-tight mt-0.5">Intelligent Interview Analytics</span>
    </Link>
  </div>

  <button
    className="lg:hidden text-muted-foreground hover:text-foreground"
    onClick={() => setSidebarOpen(false)}
  >
    <X size={24} />
  </button>
</div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <nav className="space-y-2 pb-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-border space-y-2 shrink-0">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <MessageSquarePlus size={20} />
            Platform Feedback
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold hidden sm:block">
              {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            
            <LanguageSelector />

            <Link to="/dashboard/notifications">
              <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background"></span>
              </button>
            </Link>

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile in Navbar */}
            <Link to="/dashboard/profile" className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="font-semibold text-sm leading-tight">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground leading-tight">{user?.email}</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
