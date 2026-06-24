import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Loader2,
  RefreshCw,
  ExternalLink,
  Eye,
  Mail,
  Phone,
  Download,
  GraduationCap,
  Globe,
  Code2,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  Building,
  BookOpen,
  Award,
  MoreHorizontal,
  X,
  Link2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ApplicationStatus = 'applied' | 'shortlisted' | 'interview_scheduled' | 'selected' | 'rejected';

interface InternshipApplication {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  university: string | null;
  degree: string | null;
  graduation_year: string | null;
  role_id: string;
  role_name: string;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  resume_file_path: string | null;
  resume_file_name: string | null;
  cover_letter: string;
  why_growlancer: string | null;
  weekly_availability: number | null;
  available_from: string | null;
  available_to: string | null;
  status: ApplicationStatus;
  notes: string | null;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-500/10 text-blue-400',
  shortlisted: 'bg-amber-500/10 text-amber-400',
  interview_scheduled: 'bg-purple-500/10 text-purple-400',
  selected: 'bg-emerald-500/10 text-emerald-400',
  rejected: 'bg-red-500/10 text-red-400',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  selected: 'Selected',
  rejected: 'Rejected',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function AdminInternshipsPage() {
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusChangeId, setStatusChangeId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('applied');
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('internship_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (roleFilter !== 'all') query = query.eq('role_id', roleFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      setApplications((data || []) as InternshipApplication[]);
    } catch (err) {
      console.error('Failed to fetch internship applications:', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase.channel(`admin-internships-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internship_applications' }, () => fetchApplications())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [fetchApplications]);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    setActionLoading(`status-${id}`);
    try {
      const notes = notesInput[id] || undefined;
      // Call the edge function so status emails are sent via Brevo
      const { error } = await supabase.functions.invoke('internship-applications', {
        method: 'PATCH',
        body: { application_id: id, status, notes },
      });
      if (error) {
        console.error('Status update via edge function failed:', error);
        // Fallback to direct DB update
        await supabase
          .from('internship_applications')
          .update({ status, notes: notes || null })
          .eq('id', id);
      }
      setStatusChangeId(null);
      setNotesInput(prev => ({ ...prev, [id]: '' }));
      await fetchApplications();
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getResumeDownloadUrl = (app: InternshipApplication): string | null => {
    if (app.resume_file_path) {
      const { data } = supabase.storage
        .from('internship_resumes')
        .getPublicUrl(app.resume_file_path);
      return data.publicUrl;
    }
    return app.resume_url || null;
  };

  const filteredApplications = applications.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.role_name.toLowerCase().includes(q) ||
      (a.university?.toLowerCase().includes(q) ?? false) ||
      (a.country?.toLowerCase().includes(q) ?? false)
    );
  });

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interview: applications.filter(a => a.status === 'interview_scheduled').length,
    selected: applications.filter(a => a.status === 'selected').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Internship Applications</h1>
        <p className="text-slate-400 text-sm mt-1">Manage, review, and process internship applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-100' },
          { label: 'Applied', value: stats.applied, color: 'text-blue-400' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-amber-400' },
          { label: 'Interview', value: stats.interview, color: 'text-purple-400' },
          { label: 'Selected', value: stats.selected, color: 'text-emerald-400' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-400' },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-2xl" style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1rem' }}>
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, university..." className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-800 border border-white/5 text-[10px] font-bold uppercase rounded-lg px-3 py-2 text-slate-300 cursor-pointer min-w-[140px]">
            <option value="all">All Roles</option>
            <option value="frontend-dev">Frontend</option>
            <option value="backend-supabase">Backend</option>
            <option value="qa-testing">QA</option>
            <option value="ui-ux-design">UI/UX</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-white/5 text-[10px] font-bold uppercase rounded-lg px-3 py-2 text-slate-300 cursor-pointer min-w-[140px]">
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview_scheduled">Interview</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button onClick={fetchApplications}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">No applications found</p>
          </div>
        ) : (
          filteredApplications.map(app => (
            <div
              key={app.id}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {/* Card Header */}
              <div
                className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {app.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-white text-sm">{app.full_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{app.role_name}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                      {app.country && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{app.country}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(app.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expandedId === app.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === app.id && (
                <div className="border-t border-white/5 px-5 py-5 space-y-6 animate-fade-in">
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleStatusChange(app.id, 'shortlisted')}
                      disabled={actionLoading === `status-${app.id}` || app.status === 'shortlisted'}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 transition-colors">
                      Shortlist
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'interview_scheduled')}
                      disabled={actionLoading === `status-${app.id}` || app.status === 'interview_scheduled'}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-30 transition-colors">
                      Interview Scheduled
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'selected')}
                      disabled={actionLoading === `status-${app.id}` || app.status === 'selected'}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-colors">
                      Select
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'rejected')}
                      disabled={actionLoading === `status-${app.id}` || app.status === 'rejected'}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors">
                      Reject
                    </button>
                  </div>

                  {/* Contact Info & Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contact</h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <a href={`mailto:${app.email}`} className="hover:text-emerald-400 transition-colors">{app.email}</a>
                        </p>
                        {app.phone && (
                          <p className="flex items-center gap-2 text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <a href={`tel:${app.phone}`} className="hover:text-emerald-400 transition-colors">{app.phone}</a>
                          </p>
                        )}
                        {app.country && (
                          <p className="flex items-center gap-2 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {app.country}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Education</h4>
                      <div className="space-y-2 text-sm">
                        {app.university && (
                          <p className="flex items-center gap-2 text-slate-300">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            {app.university}
                          </p>
                        )}
                        {app.degree && (
                          <p className="flex items-center gap-2 text-slate-300">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                            {app.degree}
                          </p>
                        )}
                        {app.graduation_year && (
                          <p className="flex items-center gap-2 text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            Graduation: {app.graduation_year}
                          </p>
                        )}
                        {!app.university && !app.degree && (
                          <p className="text-slate-500 text-xs">Not provided</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Links</h4>
                      <div className="space-y-2 text-sm">
                        {app.linkedin_url ? (
                          <p className="flex items-center gap-2">
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                            <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer"
                              className="text-slate-300 hover:text-emerald-400 transition-colors truncate">LinkedIn</a>
                          </p>
                        ) : null}
                        {app.github_url ? (
                          <p className="flex items-center gap-2">
                            <Code2 className="w-3.5 h-3.5 text-slate-400" />
                            <a href={app.github_url} target="_blank" rel="noopener noreferrer"
                              className="text-slate-300 hover:text-emerald-400 transition-colors truncate">GitHub</a>
                          </p>
                        ) : null}
                        {app.portfolio_url ? (
                          <p className="flex items-center gap-2">
                            <Link2 className="w-3.5 h-3.5 text-slate-400" />
                            <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer"
                              className="text-slate-300 hover:text-emerald-400 transition-colors truncate">Portfolio</a>
                          </p>
                        ) : null}
                        {!app.linkedin_url && !app.github_url && !app.portfolio_url && (
                          <p className="text-slate-500 text-xs">No links provided</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resume */}
                  {getResumeDownloadUrl(app) && (
                    <div>
                      <a
                        href={getResumeDownloadUrl(app)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {app.resume_file_name || 'Download Resume'}
                      </a>
                    </div>
                  )}

                  {/* Cover Letter */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cover Letter</h4>
                    <div className="p-4 rounded-xl text-sm text-slate-300 leading-relaxed" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                      {app.cover_letter}
                    </div>
                  </div>

                  {/* Why Growlancer */}
                  {app.why_growlancer && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Why Growlancer?</h4>
                      <div className="p-4 rounded-xl text-sm text-slate-300 leading-relaxed" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                        {app.why_growlancer}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {(app.weekly_availability || app.available_from) && (
                    <div className="p-4 rounded-xl flex flex-wrap gap-6" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                      {app.weekly_availability && (
                        <p className="flex items-center gap-2 text-sm text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {app.weekly_availability} hrs/week
                        </p>
                      )}
                      {app.available_from && (
                        <p className="flex items-center gap-2 text-sm text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          From: {formatDate(app.available_from)}
                        </p>
                      )}
                      {app.available_from && (
                        <p className="flex items-center gap-2 text-sm text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          To: {formatDate(app.available_to || app.available_from)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Admin Notes</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={notesInput[app.id] || ''}
                        onChange={(e) => setNotesInput(prev => ({ ...prev, [app.id]: e.target.value }))}
                        placeholder="Add a note..."
                        className="flex-1 px-4 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleStatusChange(app.id, app.status)}
                        disabled={!notesInput[app.id]?.trim()}
                        className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 disabled:opacity-30 transition-colors"
                      >
                        Save Note
                      </button>
                    </div>
                    {app.notes && (
                      <p className="mt-2 text-xs text-slate-500 italic">Previous note: {app.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
