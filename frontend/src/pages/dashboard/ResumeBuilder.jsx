import { useState, useRef } from 'react';
import {
  FileEdit, Download, Plus, Trash2, Eye, EyeOff,
  AlignLeft, AlignCenter, AlignRight, Type, Palette,
  ChevronDown, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import useAuthStore from '../../store/authStore';

// ─── Default Data ──────────────────────────────────────────────────────────────
const initialData = {
  personal: { name: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', summary: '' },
  experience: [{ id: 1, company: '', role: '', startDate: '', endDate: '', current: false, description: '' }],
  education: [{ id: 1, institution: '', degree: '', field: '', startDate: '', endDate: '', grade: '' }],
  skills: [{ id: 1, category: 'Technical', skills: '' }],
  projects: [{ id: 1, name: '', url: '', description: '', tech: '' }],
};

const SECTIONS = [
  { id: 'personal', label: 'Personal Info', icon: '👤' },
  { id: 'summary', label: 'Professional Summary', icon: '📝' },
  { id: 'experience', label: 'Work Experience', icon: '💼' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'projects', label: 'Projects', icon: '🚀' },
];

const ACCENT_COLORS = [
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Slate', value: '#334155' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Orange', value: '#ea580c' },
];

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
];

// ─── Shared Input Components ───────────────────────────────────────────────────
function InputField({ label, value, onChange, type = 'text', placeholder = '', required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder = '', rows = 3 }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || label}
        rows={rows}
        className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
      />
    </div>
  );
}

// ─── Resume Preview ────────────────────────────────────────────────────────────
function ResumePreview({ data, style }) {
  const { personal, experience, education, skills, projects } = data;
  const { accentColor, fontSize, fontFamily, nameAlign, bodyAlign } = style;

  const sectionHeading = {
    fontSize: `${fontSize + 1}px`,
    fontWeight: '700',
    color: accentColor,
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    borderBottom: `1.5px solid ${accentColor}`,
    paddingBottom: '3px',
    marginBottom: '8px',
  };

  return (
    <div
      id="resume-preview"
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: '1.5',
        padding: '36px 40px',
        backgroundColor: '#ffffff',
        color: '#1f2937',
        minHeight: '297mm',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '18px', textAlign: nameAlign }}>
        <h1 style={{ fontSize: `${fontSize + 14}px`, fontWeight: '800', color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
          {personal.name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: nameAlign === 'center' ? 'center' : nameAlign === 'right' ? 'flex-end' : 'flex-start', color: '#6b7280', fontSize: `${fontSize - 1}px`, marginTop: '5px' }}>
          {personal.email && <span>✉ {personal.email}</span>}
          {personal.phone && <span>📞 {personal.phone}</span>}
          {personal.location && <span>📍 {personal.location}</span>}
          {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          {personal.github && <span>⚡ {personal.github}</span>}
          {personal.website && <span>🌐 {personal.website}</span>}
        </div>
      </div>

      {/* ── Summary ── */}
      {personal.summary && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeading}>Professional Summary</div>
          <p style={{ color: '#374151', margin: 0, textAlign: bodyAlign }}>{personal.summary}</p>
        </div>
      )}

      {/* ── Experience ── */}
      {experience.some(e => e.company || e.role) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeading}>Work Experience</div>
          {experience.map(exp => (exp.company || exp.role) && (
            <div key={exp.id} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: `${fontSize + 1}px`, color: '#111827' }}>{exp.role}</div>
                  <div style={{ color: accentColor, fontSize: `${fontSize}px`, fontWeight: '500' }}>{exp.company}</div>
                </div>
                <div style={{ color: '#9ca3af', fontSize: `${fontSize - 1}px`, whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                  {exp.startDate}{(exp.startDate || exp.endDate) ? ' – ' : ''}{exp.current ? 'Present' : exp.endDate}
                </div>
              </div>
              {exp.description && (
                <p style={{ color: '#374151', marginTop: '4px', margin: '5px 0 0 0', textAlign: bodyAlign, paddingLeft: '2px' }}>
                  {exp.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Education ── */}
      {education.some(e => e.institution || e.degree) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeading}>Education</div>
          {education.map(edu => (edu.institution || edu.degree) && (
            <div key={edu.id} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: `${fontSize + 1}px`, color: '#111827' }}>
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                </div>
                <div style={{ color: '#6b7280', fontSize: `${fontSize}px` }}>
                  {edu.institution}{edu.grade ? ` · ${edu.grade}` : ''}
                </div>
              </div>
              <div style={{ color: '#9ca3af', fontSize: `${fontSize - 1}px`, whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                {edu.startDate}{(edu.startDate || edu.endDate) ? ' – ' : ''}{edu.endDate}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ── */}
      {skills.some(s => s.skills) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeading}>Skills</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {skills.map(s => s.skills && (
              <div key={s.id} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: '700', color: '#111827', minWidth: '100px', flexShrink: 0 }}>{s.category}:</span>
                <span style={{ color: '#374151' }}>{s.skills}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Projects ── */}
      {projects.some(p => p.name) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeading}>Projects</div>
          {projects.map(proj => proj.name && (
            <div key={proj.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: '700', fontSize: `${fontSize + 1}px`, color: '#111827' }}>{proj.name}</div>
                {proj.url && <a href={proj.url} style={{ color: accentColor, fontSize: `${fontSize - 1}px` }}>{proj.url}</a>}
              </div>
              {proj.tech && <div style={{ color: '#6b7280', fontSize: `${fontSize - 1}px`, margin: '2px 0', fontStyle: 'italic' }}>Tech: {proj.tech}</div>}
              {proj.description && <p style={{ color: '#374151', margin: '3px 0 0 0', textAlign: bodyAlign }}>{proj.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Customization Panel ───────────────────────────────────────────────────────
function CustomizePanel({ style, setStyle }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2"><Palette size={15} className="text-primary" /> Customize Design</span>
        {open ? <ChevronDown size={15} /> : <ChevronRightIcon size={15} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Accent Color */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setStyle(s => ({ ...s, accentColor: c.value }))}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${style.accentColor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1"><Type size={12} /> Font Family</label>
            <div className="flex flex-wrap gap-1.5">
              {FONT_FAMILIES.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStyle(s => ({ ...s, fontFamily: f.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${style.fontFamily === f.value ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/40'}`}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Font Size: <span className="text-primary">{style.fontSize}px</span>
            </label>
            <input
              type="range"
              min={9}
              max={14}
              value={style.fontSize}
              onChange={e => setStyle(s => ({ ...s, fontSize: +e.target.value }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Compact (9)</span><span>Normal (11)</span><span>Large (14)</span>
            </div>
          </div>

          {/* Name Alignment */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Header Alignment</label>
            <div className="flex gap-2">
              {[
                { val: 'left', icon: <AlignLeft size={14} /> },
                { val: 'center', icon: <AlignCenter size={14} /> },
                { val: 'right', icon: <AlignRight size={14} /> },
              ].map(a => (
                <button
                  key={a.val}
                  onClick={() => setStyle(s => ({ ...s, nameAlign: a.val }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${style.nameAlign === a.val ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}
                >
                  {a.icon} {a.val.charAt(0).toUpperCase() + a.val.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Body Alignment */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Body Text Alignment</label>
            <div className="flex gap-2">
              {[
                { val: 'left', icon: <AlignLeft size={14} /> },
                { val: 'justify', icon: <AlignLeft size={14} /> },
                { val: 'right', icon: <AlignRight size={14} /> },
              ].map(a => (
                <button
                  key={a.val}
                  onClick={() => setStyle(s => ({ ...s, bodyAlign: a.val }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${style.bodyAlign === a.val ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}
                >
                  {a.icon} {a.val.charAt(0).toUpperCase() + a.val.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ResumeBuilder() {
  const { user } = useAuthStore();
  const [data, setData] = useState(() => ({
    ...initialData,
    personal: { ...initialData.personal, name: user?.name || '', email: user?.email || '' },
  }));
  const [activeSection, setActiveSection] = useState('personal');
  const [showPreview, setShowPreview] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [style, setStyle] = useState({
    accentColor: '#4f46e5',
    fontSize: 11,
    fontFamily: 'Arial, sans-serif',
    nameAlign: 'left',
    bodyAlign: 'left',
  });

  const updatePersonal = (key, val) => setData(d => ({ ...d, personal: { ...d.personal, [key]: val } }));
  const updateItem = (section, id, key, val) => setData(d => ({
    ...d,
    [section]: d[section].map(item => item.id === id ? { ...item, [key]: val } : item),
  }));
  const addItem = (section, template) => setData(d => ({
    ...d,
    [section]: [...d[section], { ...template, id: Date.now() }],
  }));
  const removeItem = (section, id) => setData(d => ({ ...d, [section]: d[section].filter(item => item.id !== id) }));

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const el = document.getElementById('resume-preview');
      const canvas = await html2canvas(el, { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.personal.name || 'resume'}_resume.pdf`);
    } catch (err) {
      alert('Download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const renderForm = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-3">
            <InputField required label="Full Name" value={data.personal.name} onChange={v => updatePersonal('name', v)} />
            <div className="grid grid-cols-2 gap-3">
              <InputField required label="Email" type="email" value={data.personal.email} onChange={v => updatePersonal('email', v)} />
              <InputField label="Phone" value={data.personal.phone} onChange={v => updatePersonal('phone', v)} placeholder="+91 9XXXXXXXXX" />
            </div>
            <InputField label="Location" value={data.personal.location} onChange={v => updatePersonal('location', v)} placeholder="City, State" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="LinkedIn URL" value={data.personal.linkedin} onChange={v => updatePersonal('linkedin', v)} placeholder="linkedin.com/in/username" />
              <InputField label="GitHub URL" value={data.personal.github} onChange={v => updatePersonal('github', v)} placeholder="github.com/username" />
            </div>
            <InputField label="Portfolio / Website" value={data.personal.website} onChange={v => updatePersonal('website', v)} placeholder="yoursite.com" />
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-xl p-3">
              💡 Write 2–3 sentences highlighting your strongest skills, experience level, and career goal. Keep it ATS-friendly.
            </p>
            <TextArea
              label="Professional Summary"
              value={data.personal.summary}
              onChange={v => updatePersonal('summary', v)}
              rows={7}
              placeholder="Results-driven Software Developer with 3+ years of experience building scalable web applications using React and Node.js. Passionate about clean code, performance optimization, and delivering user-centric products..."
            />
            <p className="text-xs text-muted-foreground text-right">{data.personal.summary.length} / 500 chars</p>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-5">
            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="p-4 rounded-2xl border border-border bg-secondary/20 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">💼 Position {idx + 1}</h4>
                  {data.experience.length > 1 && (
                    <button onClick={() => removeItem('experience', exp.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs">
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField required label="Company" value={exp.company} onChange={v => updateItem('experience', exp.id, 'company', v)} />
                  <InputField required label="Job Title" value={exp.role} onChange={v => updateItem('experience', exp.id, 'role', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Start Date" value={exp.startDate} onChange={v => updateItem('experience', exp.id, 'startDate', v)} placeholder="Jan 2023" />
                  <InputField label="End Date" value={exp.endDate} onChange={v => updateItem('experience', exp.id, 'endDate', v)} placeholder="Dec 2024 or Present" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                  <input type="checkbox" checked={exp.current} onChange={e => updateItem('experience', exp.id, 'current', e.target.checked)} className="accent-primary" />
                  Currently working here
                </label>
                <TextArea label="Description (use bullet points for better ATS)" value={exp.description} onChange={v => updateItem('experience', exp.id, 'description', v)} rows={4} placeholder="• Built React features that reduced load time by 40%&#10;• Led a team of 3 engineers for the payments module" />
              </div>
            ))}
            <button
              onClick={() => addItem('experience', { company: '', role: '', startDate: '', endDate: '', current: false, description: '' })}
              className="w-full py-3 border-2 border-dashed border-primary/40 rounded-2xl text-sm text-primary flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
            >
              <Plus size={16} /> Add Another Position
            </button>
          </div>
        );

      case 'education':
        return (
          <div className="space-y-5">
            {data.education.map((edu, idx) => (
              <div key={edu.id} className="p-4 rounded-2xl border border-border bg-secondary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">🎓 Education {idx + 1}</h4>
                  {data.education.length > 1 && (
                    <button onClick={() => removeItem('education', edu.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs">
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
                <InputField required label="Institution" value={edu.institution} onChange={v => updateItem('education', edu.id, 'institution', v)} placeholder="IIT Delhi, Delhi University..." />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Degree" value={edu.degree} onChange={v => updateItem('education', edu.id, 'degree', v)} placeholder="B.Tech, BCA, MBA..." />
                  <InputField label="Field of Study" value={edu.field} onChange={v => updateItem('education', edu.id, 'field', v)} placeholder="Computer Science" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InputField label="Start Year" value={edu.startDate} onChange={v => updateItem('education', edu.id, 'startDate', v)} placeholder="2020" />
                  <InputField label="End Year" value={edu.endDate} onChange={v => updateItem('education', edu.id, 'endDate', v)} placeholder="2024" />
                  <InputField label="Grade / CGPA" value={edu.grade} onChange={v => updateItem('education', edu.id, 'grade', v)} placeholder="8.5 CGPA" />
                </div>
              </div>
            ))}
            <button
              onClick={() => addItem('education', { institution: '', degree: '', field: '', startDate: '', endDate: '', grade: '' })}
              className="w-full py-3 border-2 border-dashed border-primary/40 rounded-2xl text-sm text-primary flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
            >
              <Plus size={16} /> Add Education
            </button>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-xl p-3">
              ⚡ Group your skills by category. Separate individual skills with commas for best ATS results.
            </p>
            {data.skills.map((s, idx) => (
              <div key={s.id} className="p-4 rounded-2xl border border-border bg-secondary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Skill Group {idx + 1}</h4>
                  {data.skills.length > 1 && (
                    <button onClick={() => removeItem('skills', s.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs">
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
                <InputField label="Category" value={s.category} onChange={v => updateItem('skills', s.id, 'category', v)} placeholder="Technical, Frontend, Tools, Soft Skills..." />
                <TextArea label="Skills (comma separated)" value={s.skills} onChange={v => updateItem('skills', s.id, 'skills', v)} rows={2} placeholder="React.js, Node.js, MongoDB, Docker, Git..." />
              </div>
            ))}
            <button
              onClick={() => addItem('skills', { category: '', skills: '' })}
              className="w-full py-3 border-2 border-dashed border-primary/40 rounded-2xl text-sm text-primary flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
            >
              <Plus size={16} /> Add Skill Group
            </button>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-5">
            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="p-4 rounded-2xl border border-border bg-secondary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">🚀 Project {idx + 1}</h4>
                  {data.projects.length > 1 && (
                    <button onClick={() => removeItem('projects', proj.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs">
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField required label="Project Name" value={proj.name} onChange={v => updateItem('projects', proj.id, 'name', v)} />
                  <InputField label="URL (GitHub / Live)" value={proj.url} onChange={v => updateItem('projects', proj.id, 'url', v)} placeholder="github.com/user/project" />
                </div>
                <InputField label="Tech Stack" value={proj.tech} onChange={v => updateItem('projects', proj.id, 'tech', v)} placeholder="React, Node.js, MongoDB, AWS" />
                <TextArea label="Description (impact & what you built)" value={proj.description} onChange={v => updateItem('projects', proj.id, 'description', v)} rows={3} placeholder="Built a full-stack expense tracker with AI-powered insights, reducing manual tracking time by 60% for 200+ users." />
              </div>
            ))}
            <button
              onClick={() => addItem('projects', { name: '', url: '', description: '', tech: '' })}
              className="w-full py-3 border-2 border-dashed border-primary/40 rounded-2xl text-sm text-primary flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
            >
              <Plus size={16} /> Add Project
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-1">
            Resume Builder
            <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full align-middle ml-2">Live Preview</span>
          </h1>
          <p className="text-muted-foreground text-sm">Build an ATS-friendly resume with real-time preview. Customize font, color & alignment.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setShowPreview(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className={`grid gap-6 ${showPreview ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>

        {/* ── Editor Panel ── */}
        <div className="flex gap-4 h-[calc(100vh-13rem)] overflow-hidden">
          {/* Section Tabs */}
          <div className="flex flex-col gap-1 w-44 shrink-0 overflow-y-auto custom-scrollbar pr-1">
            {SECTIONS.map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${activeSection === sec.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <span>{sec.icon}</span>
                <span className="truncate">{sec.label}</span>
              </button>
            ))}
          </div>

          {/* Form Panel */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            <CustomizePanel style={style} setStyle={setStyle} />
            <div className="glass-card rounded-2xl p-5 border border-border shadow-card">
              <h3 className="font-display font-semibold mb-4 text-base flex items-center gap-2">
                <span>{SECTIONS.find(s => s.id === activeSection)?.icon}</span>
                {SECTIONS.find(s => s.id === activeSection)?.label}
              </h3>
              {renderForm()}
            </div>
          </div>
        </div>

        {/* ── Preview Panel ── */}
        {showPreview && (
          <div className="h-[calc(100vh-13rem)] overflow-y-auto custom-scrollbar rounded-2xl border border-border shadow-card bg-gray-100">
            <div className="p-3 bg-secondary/60 border-b border-border text-center text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span>📄</span> Live Preview — this is how your resume will look
              <span className="ml-auto flex items-center gap-1" style={{ color: style.accentColor }}>
                ● {ACCENT_COLORS.find(c => c.value === style.accentColor)?.label} theme
              </span>
            </div>
            <div className="p-4">
              <div className="shadow-2xl rounded overflow-hidden">
                <ResumePreview data={data} style={style} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
