import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Github } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-12 px-4 border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto max-w-6xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="font-display font-bold text-lg mb-4 flex items-center gap-3">
              <img src="/logo.jpg" alt="IIPAS Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
              <div className="flex flex-col">
                <span className="leading-tight">IIPAS</span>
                <span className="text-[10px] text-muted-foreground font-normal tracking-tight">Intelligent Interview Performance Analytics System</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Intelligent Interview Performance Analytics System — AI-powered mock interviews with real-time facial emotion detection and confidence analysis.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Platform</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/dashboard/setup" className="block hover:text-foreground transition-colors">Mock Interview</Link>
              <Link to="/quiz" className="block hover:text-foreground transition-colors">Aptitude Tests</Link>
              <Link to="/leaderboard" className="block hover:text-foreground transition-colors">Leaderboard</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Resources</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/blog" className="block hover:text-foreground transition-colors">Blog & Tips</Link>
              <Link to="/dashboard/ai-mentor" className="block hover:text-foreground transition-colors">AI Mentor</Link>
              <span className="block hover:text-foreground transition-colors cursor-pointer">FAQ</span>
              <span className="block hover:text-foreground transition-colors cursor-pointer">Support</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Company</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <span className="block hover:text-foreground transition-colors cursor-pointer">About Us</span>
              <span className="block hover:text-foreground transition-colors cursor-pointer">Careers</span>
              <span className="block hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
              <span className="block hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} IIPAS - All rights reserved
          </p>
          
          <div className="flex items-center gap-5 text-muted-foreground">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors p-2 hover:bg-muted rounded-full">
              <Twitter size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors p-2 hover:bg-muted rounded-full">
              <Linkedin size={20} />
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors p-2 hover:bg-muted rounded-full">
              <Github size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
