import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { User, Mail, Briefcase, Code, Link as LinkIcon, Loader2, FileText, Upload, Trash2, CheckCircle, Target, TrendingUp, Trophy, Flame } from 'lucide-react';

export default function Profile() {
  const { user, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const [resume, setResume] = useState(() => {
    const key = user?.email ? `user_resume_meta_${user.email}` : 'user_resume_meta';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  });
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      targetRole: user?.targetRole || '',
      experience: user?.experience || 'Fresher',
      preferredLanguage: user?.preferredLanguage || 'English',
      githubUrl: user?.githubUrl || '',
      linkedinUrl: user?.linkedinUrl || ''
    }
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get('/progress/dashboard');
      return res.data.data;
    }
  });

  const stats = dashboardData?.stats || {
    averageScore: 0,
    totalInterviews: 0,
    highestScore: 0,
    currentStreak: 0
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSuccess('');
    try {
      await api.put('/auth/profile', data);
      await checkAuth(); // refresh user data
      setSuccess('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }
    setResumeUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const meta = { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() };
      const metaKey = user?.email ? `user_resume_meta_${user.email}` : 'user_resume_meta';
      const base64Key = user?.email ? `user_resume_base64_${user.email}` : 'user_resume_base64';
      localStorage.setItem(metaKey, JSON.stringify(meta));
      localStorage.setItem(base64Key, ev.target.result);
      setResume(meta);
      setResumeUploading(false);
      setResumeSuccess(true);
      setTimeout(() => setResumeSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveResume = () => {
    const metaKey = user?.email ? `user_resume_meta_${user.email}` : 'user_resume_meta';
    const base64Key = user?.email ? `user_resume_base64_${user.email}` : 'user_resume_base64';
    localStorage.removeItem(metaKey);
    localStorage.removeItem(base64Key);
    setResume(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="glass-card rounded-3xl p-8 border border-border">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold border-4 border-background shadow-xl">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail size={16} /> {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {success && (
            <div className="p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-sm font-medium">
              {success}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-medium text-sm ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input 
                  {...register('name')}
                  className="w-full bg-background border border-border rounded-xl px-11 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm ml-1">Target Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input 
                  {...register('targetRole')}
                  className="w-full bg-background border border-border rounded-xl px-11 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g. Frontend Developer"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-medium text-sm ml-1">Experience Level</label>
              <select 
                {...register('experience')}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="Fresher">Fresher</option>
                <option value="1 Year">1 Year</option>
                <option value="2 Years">2 Years</option>
                <option value="5 Years">5 Years</option>
                <option value="10+ Years">10+ Years</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm ml-1">Preferred UI Language</label>
              <select 
                {...register('preferredLanguage')}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Bengali">Bengali</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-medium text-sm ml-1">GitHub Profile</label>
              <div className="relative">
                <Code className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input 
                  {...register('githubUrl')}
                  className="w-full bg-background border border-border rounded-xl px-11 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm ml-1">LinkedIn Profile</label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input 
                  {...register('linkedinUrl')}
                  className="w-full bg-background border border-border rounded-xl px-11 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          <button 
            disabled={isLoading}
            type="submit"
            className="w-full sm:w-auto mt-6 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Performance Stats */}
      <div className="glass-card rounded-3xl p-8 border border-border">
        <h2 className="text-xl font-bold mb-6">Performance Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg Score', value: `${stats.averageScore || 0}%`, icon: <Target className="text-blue-500 w-5 h-5" />, color: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Interviews', value: stats.totalInterviews || 0, icon: <TrendingUp className="text-green-500 w-5 h-5" />, color: 'bg-green-500/10 border-green-500/20' },
            { label: 'Highest Score', value: `${stats.highestScore || 0}%`, icon: <Trophy className="text-yellow-500 w-5 h-5" />, color: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Current Streak', value: stats.currentStreak || 0, icon: <Flame className="text-orange-500 w-5 h-5" />, color: 'bg-orange-500/10 border-orange-500/20' },
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${stat.color} bg-card shadow-sm flex flex-col items-center justify-center text-center gap-2`}>
              <div className={`p-2 rounded-xl bg-background shadow-sm`}>
                {stat.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-muted-foreground text-xs font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resume Upload Card */}
      <div className="glass-card rounded-3xl p-8 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Resume / CV</h2>
            <p className="text-muted-foreground text-sm">Upload your resume to auto-personalize mock interviews</p>
          </div>
        </div>

        {resume ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm truncate max-w-[200px]">{resume.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(resume.size / 1024).toFixed(0)} KB · Uploaded {new Date(resume.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveResume}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                title="Remove Resume"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {resumeSuccess && (
              <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                <CheckCircle size={16} /> Resume saved successfully!
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1.5"
            >
              <Upload size={14} /> Replace Resume
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-10 text-center cursor-pointer transition-colors group"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <Upload size={28} className="text-primary" />
            </div>
            <p className="font-semibold mb-1">Click to upload your Resume</p>
            <p className="text-muted-foreground text-sm">PDF or Word Document · Max 5MB</p>
            <p className="text-xs text-primary mt-3 font-medium">Your resume will be used to generate personalized interview questions</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleResumeUpload}
        />
      </div>
    </div>
  );
}
