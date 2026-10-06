import { useState } from 'react';
import api from '../lib/api';
import { Mail, MessageSquare, Send, Loader2, Phone, MapPin } from 'lucide-react';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/contact', formData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[80vh] py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-muted-foreground text-lg">Have questions? We're here to help you ace your interviews.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-12">
          {/* Contact Info */}
          <div className="md:col-span-2 space-y-8">
            <div className="glass-card p-8 rounded-3xl border border-border">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><Mail size={20} /></div>
                  <div>
                    <p className="font-semibold">Email Us</p>
                    <p className="text-muted-foreground text-sm">support@interviewsarthi.ai</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><Phone size={20} /></div>
                  <div>
                    <p className="font-semibold">Call Us</p>
                    <p className="text-muted-foreground text-sm">+91 1800-SARTHI</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><MapPin size={20} /></div>
                  <div>
                    <p className="font-semibold">Visit Us</p>
                    <p className="text-muted-foreground text-sm">Tech Hub, Koramangala<br/>Bangalore, KA 560034</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl border border-border space-y-6">
              {status === 'success' && (
                <div className="bg-green-500/10 text-green-500 border border-green-500/20 p-4 rounded-xl text-sm font-medium">
                  Thanks for reaching out! We will get back to you shortly.
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-xl text-sm font-medium">
                  Failed to send message. Please try again.
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Your Name</label>
                  <input 
                    required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Email Address</label>
                  <input 
                    required type="email"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Subject</label>
                <input 
                  required
                  value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Message</label>
                <textarea 
                  required rows={5}
                  value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
              </div>

              <button 
                type="submit" disabled={status === 'loading'}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send size={18}/> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
