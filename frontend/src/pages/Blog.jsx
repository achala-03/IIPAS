import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Fetching real articles from Dev.to API about interviews and career
        const response = await fetch('https://dev.to/api/articles?tag=interview&per_page=9');
        const data = await response.json();
        
        const formattedPosts = data.map(post => ({
          id: post.id,
          title: post.title,
          category: post.tags.split(',')[0] || 'Career',
          date: new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          readTime: `${post.reading_time_minutes} min read`,
          image: post.cover_image || post.social_image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
          excerpt: post.description,
          link: post.url
        }));
        
        setPosts(formattedPosts);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">Insights & <span className="text-gradient">Tips</span></h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Read our latest articles on interview preparation, career growth and industry trends</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div key={skeleton} className="glass-card rounded-2xl overflow-hidden animate-pulse border border-border">
                <div className="h-48 bg-muted"></div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="h-4 w-20 bg-muted rounded"></div>
                    <div className="h-4 w-20 bg-muted rounded"></div>
                  </div>
                  <div className="h-6 w-full bg-muted rounded"></div>
                  <div className="h-6 w-3/4 bg-muted rounded"></div>
                  <div className="space-y-2 pt-2">
                    <div className="h-4 w-full bg-muted rounded"></div>
                    <div className="h-4 w-5/6 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <motion.a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  key={post.id} 
                  className="glass-card rounded-2xl overflow-hidden hover:shadow-purple transition-all duration-300 group border border-border flex flex-col"
                >
                  <div className="h-48 overflow-hidden relative shrink-0">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-black text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">{post.category}</span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                      <span className="flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" /> {post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-3 flex-1">{post.excerpt}</p>
                    <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all mt-auto">
                      Read Full Article <ExternalLink className="w-4 h-4 ml-1.5 opacity-70 group-hover:opacity-100" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function ClockIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
