import { useState, useEffect } from 'react';
import { Bell, Briefcase, Building2, Landmark, MapPin, ExternalLink, Clock, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Indian Government Jobs (Since there's no single reliable public API for all govt jobs)
const GOVT_JOBS = [
  {
    id: 'gov-1',
    title: 'UPSC Civil Services Examination 2026',
    organization: 'Union Public Service Commission (UPSC)',
    type: 'Government',
    location: 'All India',
    deadline: '2026-08-15',
    link: 'https://upsconline.nic.in/',
    tags: ['IAS', 'IPS', 'IFS'],
    posted: '2 days ago'
  },
  {
    id: 'gov-2',
    title: 'SSC Combined Graduate Level (CGL)',
    organization: 'Staff Selection Commission (SSC)',
    type: 'Government',
    location: 'All India',
    deadline: '2026-09-01',
    link: 'https://ssc.nic.in/',
    tags: ['Group B', 'Group C', 'Graduate'],
    posted: '5 days ago'
  },
  {
    id: 'gov-3',
    title: 'RBI Grade B Officer',
    organization: 'Reserve Bank of India',
    type: 'Government',
    location: 'Mumbai / Various',
    deadline: '2026-08-25',
    link: 'https://opportunities.rbi.org.in/',
    tags: ['Banking', 'Finance', 'Grade B'],
    posted: '1 week ago'
  },
  {
    id: 'gov-4',
    title: 'RRB NTPC Recruitment',
    organization: 'Railway Recruitment Board',
    type: 'Government',
    location: 'All India',
    deadline: '2026-10-10',
    link: 'https://indianrailways.gov.in/',
    tags: ['Railways', 'Non-Technical'],
    posted: '3 days ago'
  }
];

export default function Notifications() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Government, Private
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPrivateJobs = async () => {
      try {
        // Using Remotive API for remote tech/private jobs
        const response = await fetch('https://remotive.com/api/remote-jobs?limit=15');
        const data = await response.json();
        
        const privateJobs = data.jobs.map(job => ({
          id: `priv-${job.id}`,
          title: job.title,
          organization: job.company_name,
          type: 'Private',
          location: job.candidate_required_location || 'Remote',
          link: job.url,
          tags: job.tags?.slice(0, 3) || [job.category],
          posted: new Date(job.publication_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        // Mix govt jobs and private jobs
        const mixedJobs = [...GOVT_JOBS, ...privateJobs].sort(() => Math.random() - 0.5);
        setJobs(mixedJobs);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        // Fallback to govt jobs if private API fails
        setJobs(GOVT_JOBS);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivateJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'All' || job.type === filter;
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.organization.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Bell className="text-primary" size={28} /> Job Alerts & Notifications
          </h1>
          <p className="text-muted-foreground mt-2">Live updates for Government and Private sector opportunities.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search by job title or organization..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Government', 'Private'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                filter === f 
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' 
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {f === 'Government' && <Landmark size={16} />}
              {f === 'Private' && <Building2 size={16} />}
              {f === 'All' && <Filter size={16} />}
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-border flex flex-col md:flex-row gap-4 animate-pulse">
              <div className="w-16 h-16 bg-muted rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="flex gap-2 mt-4">
                  <div className="h-6 w-16 bg-muted rounded-full"></div>
                  <div className="h-6 w-16 bg-muted rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredJobs.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 glass-card rounded-2xl border border-border"
              >
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">No jobs found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
              </motion.div>
            ) : (
              filteredJobs.map((job, index) => (
                <motion.div 
                  key={job.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5 sm:p-6 rounded-2xl border border-border hover:border-primary/40 transition-colors shadow-sm group"
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                      job.type === 'Government' ? 'bg-orange-500/10 text-orange-600' : 'bg-primary/10 text-primary'
                    }`}>
                      {job.type === 'Government' ? <Landmark size={28} /> : <Building2 size={28} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{job.title}</h3>
                          <p className="text-muted-foreground font-medium mt-1">{job.organization}</p>
                        </div>
                        <a 
                          href={job.link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg text-sm font-semibold transition-colors shrink-0"
                        >
                          Apply Now <ExternalLink size={16} />
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground mt-4 mb-4">
                        <span className="flex items-center gap-1.5"><MapPin size={16} /> {job.location}</span>
                        {job.deadline && <span className="flex items-center gap-1.5"><Clock size={16} /> Deadline: {job.deadline}</span>}
                        <span className="flex items-center gap-1.5"><Briefcase size={16} /> {job.type} Sector</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-border/50">
                        <div className="flex flex-wrap gap-2">
                          {job.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">Posted: {job.posted}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
