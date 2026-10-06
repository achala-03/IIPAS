import { useState } from 'react';
import api from '../lib/api';
import { Star, X, Loader2, MessageSquareHeart } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/contact/feedback', { rating, category, message });
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setMessage('');
      }, 2000);
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border p-6 relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquareHeart size={24} />
          </div>
          <h2 className="text-2xl font-bold">Platform Feedback</h2>
          <p className="text-muted-foreground text-sm mt-1">Help us improve your experience</p>
        </div>

        {status === 'success' ? (
          <div className="text-center py-8 text-green-500 space-y-2">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <p className="font-bold text-xl">Thank You!</p>
            <p className="text-sm opacity-80">Your feedback has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-center">How would you rate us?</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      size={32} 
                      className={`${(hoveredRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select 
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="general">General Feedback</option>
                <option value="feature_request">Feature Request</option>
                <option value="bug">Report a Bug</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea 
                required rows={4}
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what you love or what we can improve..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {status === 'error' && <p className="text-red-500 text-sm text-center">Failed to submit. Please try again.</p>}

            <button 
              type="submit" disabled={status === 'loading'}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2"
            >
              {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
