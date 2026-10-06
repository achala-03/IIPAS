import { useState } from 'react';
import { User, Bell, Shield, Moon, Monitor, Sun } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useTheme } from '../../components/ThemeProvider';

export default function Settings() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security & Privacy', icon: <Shield size={18} /> },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="glass-card p-6 rounded-2xl border border-border shadow-card min-h-[400px]">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                  <div className="grid grid-cols-3 gap-4 max-w-md">
                    {[
                      { id: 'light', label: 'Light', icon: <Sun size={20} /> },
                      { id: 'dark', label: 'Dark', icon: <Moon size={20} /> },
                      { id: 'system', label: 'System', icon: <Monitor size={20} /> },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                          theme === t.id 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border hover:border-primary/50 text-muted-foreground'
                        }`}
                      >
                        {t.icon}
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Full Name</label>
                      <input type="text" defaultValue={user?.name} className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Email Address</label>
                      <input type="email" defaultValue={user?.email} disabled className="w-full bg-secondary/50 border border-input rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
                    </div>
                    <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium shadow-md hover:bg-primary/90 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
                {[
                  { title: 'Interview Reminders', desc: 'Receive emails before a scheduled interview.' },
                  { title: 'Weekly Progress', desc: 'Get a summary of your performance every week.' },
                  { title: 'New Courses', desc: 'Be notified when we add new study materials.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i !== 2} />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 text-center py-10">
                <Shield size={48} className="mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold">Security settings are managed by your provider</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  To change your password or update 2FA settings, please visit the central authentication portal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
