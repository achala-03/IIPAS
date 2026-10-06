import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { Bot, Moon, Sun, Globe, ChevronDown, Menu, X, LogOut } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLanguage } from '../i18n/LanguageContext';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t, supportedLanguages } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();

  const langCodeMap = {
    'English': 'en', 'Hindi': 'hi', 'Bengali': 'bn', 'Telugu': 'te', 'Marathi': 'mr', 
    'Tamil': 'ta', 'Urdu': 'ur', 'Gujarati': 'gu', 'Kannada': 'kn', 'Odia': 'or', 
    'Malayalam': 'ml', 'Punjabi': 'pa', 'Assamese': 'as', 'Maithili': 'mai', 
    'Santali': 'sat', 'Kashmiri': 'ks', 'Nepali': 'ne', 'Sindhi': 'sd', 
    'Dogri': 'doi', 'Konkani': 'gom', 'Manipuri': 'mni', 'Bodo': 'brx', 'Sanskrit': 'sa'
  };

  const handleLanguageChange = (l) => {
    setLang(l);
    setLangOpen(false);
    setMenuOpen(false);
    const code = langCodeMap[l] || 'en';
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="sticky top-0 w-full z-50 glass border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
           <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="IIPAS Logo" className="w-9 h-9 object-contain rounded-lg shadow-sm" />
              <div className="flex flex-col">
                <span className="font-bold text-xl leading-none">IIPAS</span>
                <span className="text-[9px] text-muted-foreground hidden sm:block tracking-tighter">Intelligent Interview Performance Analytics System</span>
              </div>
            </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.home')}</Link>
            <Link to="/quiz" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.aptitude')}</Link>
            <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.blog')}</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.contact')}</Link>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.dashboard')}</Link>
                <Link to="/dashboard/setup" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.practice')}</Link>
              </>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50"
              >
                <Globe className="w-4 h-4" />
                <span>{lang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 max-h-80 overflow-y-auto bg-card border border-border rounded-xl shadow-xl py-1 z-50 custom-scrollbar">
                  {supportedLanguages.map(l => (
                    <button
                      key={l}
                      onClick={() => handleLanguageChange(l)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${lang === l ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border/50"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-medium text-primary">
                  <div className="w-6 h-6 rounded-full bg-gradient-hero flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden lg:block">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                  Log in
                </Link>
                <Link to="/register">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity">
                    {t('nav.getStarted')}
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass border-t border-border px-4 py-4 flex flex-col gap-3"
        >
          {[
            { to: '/', label: t('nav.home') },
            { to: '/quiz', label: t('nav.aptitude') },
            { to: '/blog', label: t('nav.blog') },
            { to: '/contact', label: t('nav.contact') },
            ...(isAuthenticated ? [
              { to: '/dashboard', label: t('nav.dashboard') },
              { to: '/dashboard/setup', label: t('nav.practice') },
            ] : []),
          ].map(item => (
            <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="text-sm font-medium py-1">{item.label}</Link>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border max-h-48 overflow-y-auto">
            <Globe className="w-4 h-4 text-muted-foreground" />
            {supportedLanguages.map(l => (
              <button key={l} onClick={() => handleLanguageChange(l)}
                className={`px-2 py-1 rounded text-xs ${lang === l ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground'}`}>
                {l}
              </button>
            ))}
          </div>

          {isAuthenticated ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-sm font-medium text-destructive flex items-center gap-2">
              <LogOut size={16} /> {t('nav.signOut')}
            </button>
          ) : (
            <Link to="/register" onClick={() => setMenuOpen(false)}>
              <button className="w-full py-3 rounded-xl bg-gradient-hero text-white font-semibold text-sm">
                {t('nav.getStarted')}
              </button>
            </Link>
          )}
        </motion.div>
      )}
    </nav>
  );
}
