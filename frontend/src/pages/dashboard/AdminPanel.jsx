import { Users, FileText, Activity, ShieldAlert, BarChart } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Navigate } from 'react-router-dom';

export default function AdminPanel() {
  const { user } = useAuthStore();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2 flex items-center gap-2">
          <ShieldAlert className="text-destructive" size={28} /> Super Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Manage users, view platform metrics, and control system settings.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '1,245', icon: <Users size={24} className="text-primary" />, trend: '+12% this month' },
          { label: 'Interviews Conducted', value: '8,432', icon: <FileText size={24} className="text-accent" />, trend: '+34% this month' },
          { label: 'Active Sessions', value: '42', icon: <Activity size={24} className="text-success" />, trend: 'Live right now' },
          { label: 'System Health', value: '99.9%', icon: <BarChart size={24} className="text-warning" />, trend: 'All systems operational' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl shadow-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-3xl font-bold font-display mb-1">{stat.value}</h3>
            <p className="font-medium text-sm text-foreground mb-1">{stat.label}</p>
            <p className="text-xs text-muted-foreground">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-card min-h-[400px]">
          <h2 className="text-lg font-semibold mb-4">Recent User Registrations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">Test User {item}</td>
                    <td className="px-4 py-3 text-muted-foreground">user{item}@example.com</td>
                    <td className="px-4 py-3 text-muted-foreground">Today, {10 - item}:00 AM</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full font-medium">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full py-3 px-4 rounded-xl bg-secondary text-left font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-between">
              Manage API Quotas <Activity size={16} />
            </button>
            <button className="w-full py-3 px-4 rounded-xl bg-secondary text-left font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-between">
              Broadcast Message <Users size={16} />
            </button>
            <button className="w-full py-3 px-4 rounded-xl bg-secondary text-left font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-between">
              Export Database <FileText size={16} />
            </button>
            <button className="w-full py-3 px-4 rounded-xl bg-destructive/10 text-destructive text-left font-medium text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-between mt-6">
              System Purge <ShieldAlert size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
