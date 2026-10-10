import React, { useEffect, useMemo, useState } from 'react';
import { Film, Search, Play, X, ShieldCheck, Plus, LogIn, LogOut, Clapperboard, Tv, ChevronRight, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from './lib/youtube.js';

const demoItems = [
  {
    id: 'demo-1', title: 'The Sample Premiere', type: 'movie', year: 2025, genre: 'Drama',
    description: 'A sample card to preview the CineBox layout. Replace it with a video you own or are licensed to stream.',
    youtube_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', published: true
  },
  {
    id: 'demo-2', title: 'Behind the Story', type: 'series', year: 2024, genre: 'Documentary',
    description: 'An example series listing. Only publish episodes and videos you have permission to distribute.',
    youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', published: true
  }
];

const copy = {
  en: {
    tagline: 'Stories worth staying in for.', search: 'Search titles, genres…', home: 'Home', movies: 'Movies',
    series: 'Series', admin: 'Admin', featured: 'FEATURED', trending: 'Explore CineBox', all: 'All titles',
    movie: 'Movie', seriesType: 'Series', play: 'Watch now', details: 'More info', empty: 'No titles match your search.',
    demo: 'Preview mode — connect Supabase to manage your real catalogue.', signIn: 'Admin sign in',
    email: 'Email address', password: 'Password', login: 'Sign in', logout: 'Sign out', adminTitle: 'Content studio',
    adminHelp: 'Add authorized YouTube videos to your catalogue. Publishing makes the title visible to everyone.',
    title: 'Title', type: 'Content type', year: 'Release year', genre: 'Genre', description: 'Description',
    videoUrl: 'YouTube video URL', publish: 'Publish title', saving: 'Saving…', published: 'Published',
    draft: 'Draft', delete: 'Delete', loginNeeded: 'Sign in with an admin account to manage content.',
    configure: 'Setup needed: add your Supabase URL and public anon/publishable key in .env.local, then run the SQL in README.',
    invalidVideo: 'Enter a valid YouTube video URL or 11-character video ID.', success: 'Title saved.',
    deleteConfirm: 'Delete this title?', noAdmin: 'This account is not marked as an admin. Ask the project owner to grant access.',
    adminOnly: 'Admin only', footer: 'Only content you own or are licensed to distribute should be published.'
  },
  hi: {
    tagline: 'Aisi kahaniyan, jo aapko rok kar rakhein.', search: 'Title ya genre search karein…', home: 'Home',
    movies: 'Movies', series: 'Series', admin: 'Admin', featured: 'FEATURED', trending: 'CineBox explore karein',
    all: 'Sabhi titles', movie: 'Movie', seriesType: 'Series', play: 'Abhi dekhein', details: 'Aur jaanein',
    empty: 'Aapki search se koi title nahi mila.', demo: 'Preview mode — asli catalogue manage karne ke liye Supabase connect karein.',
    signIn: 'Admin login', email: 'Email address', password: 'Password', login: 'Login', logout: 'Logout',
    adminTitle: 'Content studio', adminHelp: 'Sirf authorized YouTube videos add karein. Publish karne par title sabko dikhega.',
    title: 'Title', type: 'Content type', year: 'Release year', genre: 'Genre', description: 'Description',
    videoUrl: 'YouTube video URL', publish: 'Title publish karein', saving: 'Save ho raha hai…',
    published: 'Published', draft: 'Draft', delete: 'Delete', loginNeeded: 'Content manage karne ke liye admin account se login karein.',
    configure: 'Setup zaroori hai: .env.local mein Supabase URL aur public anon/publishable key daalein, phir README ka SQL run karein.',
    invalidVideo: 'Valid YouTube URL ya 11-character video ID daalein.', success: 'Title save ho gaya.',
    deleteConfirm: 'Kya aap ye title delete karna chahte hain?',
    noAdmin: 'Is account ko admin access nahi mila. Project owner se access dilwayein.',
    adminOnly: 'Sirf admin', footer: 'Sirf apna ya licensed content hi publish karein.'
  }
};

function Poster({ item, large = false }) {
  const thumb = item.poster_url || getYouTubeThumbnail(item.youtube_url);
  return <div className={`poster ${large ? 'poster-large' : ''}`}>
    {thumb ? <img src={thumb} alt={`${item.title} poster`} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} /> : null}
    <div className="poster-fallback"><Film size={36}/><span>{item.title}</span></div>
    <div className="poster-shade" />
    <span className="poster-tag">{item.type === 'series' ? 'SERIES' : 'MOVIE'}</span>
  </div>;
}

function PlayerModal({ item, onClose, t }) {
  const embed = getYouTubeEmbedUrl(item.youtube_url);
  useEffect(() => {
    const handle = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="player-modal" role="dialog" aria-modal="true" aria-label={item.title}>
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X/></button>
      {embed ? <div className="video-frame"><iframe src={embed} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div> : <div className="video-error"><AlertCircle/><p>Invalid YouTube URL</p></div>}
      <div className="player-meta"><div><span className="eyebrow">{item.type === 'series' ? t.seriesType : t.movie} · {item.year || '—'} · {item.genre || 'General'}</span><h2>{item.title}</h2><p>{item.description}</p></div></div>
    </section>
  </div>;
}

function AdminPanel({ t, session, onClose, onChanged }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', type: 'movie', year: new Date().getFullYear(), genre: 'Drama', description: '', youtube_url: '', poster_url: '', published: true });

  async function checkRole(currentSession) {
    setChecking(true);
    if (!currentSession?.user) { setIsAdmin(false); setChecking(false); return; }
    const { data, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', currentSession.user.id).maybeSingle();
    setIsAdmin(!roleError && data?.role === 'admin');
    if (roleError) setError('Could not verify admin role. Check the database SQL and policies.');
    setChecking(false);
  }
  useEffect(() => { checkRole(session); }, [session?.user?.id]);

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    else {
      const { data: { session: newSession } } = await supabase.auth.getSession();
      await checkRole(newSession);
    }
    setBusy(false);
  }

  async function save(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    if (!getYouTubeEmbedUrl(form.youtube_url)) { setError(t.invalidVideo); setBusy(false); return; }
    const payload = { ...form, year: Number(form.year) || null };
    const { error: saveError } = await supabase.from('titles').insert(payload);
    if (saveError) setError(saveError.message);
    else {
      setNotice(t.success);
      setForm({ title: '', type: 'movie', year: new Date().getFullYear(), genre: 'Drama', description: '', youtube_url: '', poster_url: '', published: true });
      onChanged();
    }
    setBusy(false);
  }

  async function signOut() { await supabase.auth.signOut(); setIsAdmin(false); }
  async function remove(item) {
    if (!window.confirm(t.deleteConfirm)) return;
    const { error: removeError } = await supabase.from('titles').delete().eq('id', item.id);
    if (removeError) setError(removeError.message); else { setNotice(t.success); onChanged(); }
  }

  return <div className="admin-wrap">
    <div className="admin-heading"><div><span className="eyebrow"><ShieldCheck size={14}/> {t.adminOnly}</span><h2>{t.adminTitle}</h2><p>{t.adminHelp}</p></div><button className="icon-button" onClick={onClose} aria-label="Close admin"><X/></button></div>
    {checking ? <p className="muted">Checking access…</p> : !session ? <form className="admin-form login-form" onSubmit={signIn}>
      <h3>{t.signIn}</h3><label>{t.email}<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username"/></label>
      <label>{t.password}<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/></label>
      {error && <p className="notice error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? '…' : <><LogIn size={16}/>{t.login}</>}</button>
      <p className="muted small">{t.loginNeeded}</p>
    </form> : !isAdmin ? <div className="notice error">{error || t.noAdmin}</div> : <>
      <div className="admin-user"><span>{session.user.email}</span><button className="ghost-button" onClick={signOut}><LogOut size={15}/>{t.logout}</button></div>
      <form className="admin-form" onSubmit={save}>
        <div className="form-grid">
          <label>{t.title}<input value={form.title} onChange={e => setForm({...form, title:e.target.value})} required maxLength={140}/></label>
          <label>{t.type}<select value={form.type} onChange={e => setForm({...form, type:e.target.value})}><option value="movie">{t.movie}</option><option value="series">{t.seriesType}</option></select></label>
          <label>{t.year}<input type="number" min="1888" max="2100" value={form.year} onChange={e => setForm({...form, year:e.target.value})}/></label>
          <label>{t.genre}<input value={form.genre} onChange={e => setForm({...form, genre:e.target.value})} maxLength={60}/></label>
        </div>
        <label>{t.description}<textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows="3" maxLength={1200}/></label>
        <label>{t.videoUrl}<input type="url" placeholder="https://www.youtube.com/watch?v=…" value={form.youtube_url} onChange={e => setForm({...form, youtube_url:e.target.value})} required/></label>
        <label>Poster image URL (optional)<input type="url" placeholder="https://…" value={form.poster_url} onChange={e => setForm({...form, poster_url:e.target.value})}/></label>
        <label className="check-label"><input type="checkbox" checked={form.published} onChange={e => setForm({...form, published:e.target.checked})}/>{t.published}</label>
        {error && <p className="notice error">{error}</p>}{notice && <p className="notice success"><CheckCircle2 size={16}/>{notice}</p>}
        <button className="primary-button" disabled={busy}>{busy ? t.saving : <><Plus size={17}/>{t.publish}</>}</button>
      </form>
      <div className="admin-list"><h3>Published / saved titles</h3>{(window.__cineboxItems || []).map(item => <div className="admin-list-item" key={item.id}><span>{item.title} <small>{item.published ? t.published : t.draft}</small></span><button className="icon-button danger-button" onClick={() => remove(item)} title={t.delete}><Trash2 size={16}/></button></div>)}</div>
    </>}
  </div>;
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [items, setItems] = useState(demoItems);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [dbError, setDbError] = useState('');
  const t = copy[lang];

  async function loadTitles() {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true); setDbError('');
    const { data, error } = await supabase.from('titles').select('*').eq('published', true).order('created_at', { ascending: false });
    if (error) { setDbError(error.message); setItems([]); }
    else setItems(data || []);
    setLoading(false);
  }
  useEffect(() => { loadTitles(); }, []);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const filtered = useMemo(() => items.filter(item => {
    const matchesType = filter === 'all' || item.type === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [item.title, item.genre, item.description, String(item.year || '')].some(v => (v || '').toLowerCase().includes(q));
    return matchesType && matchesQuery;
  }), [items, filter, query]);

  const hero = filtered[0] || items[0];
  window.__cineboxItems = items;

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e => {e.preventDefault();setFilter('all');setQuery('');}}><span className="brand-mark"><Clapperboard size={22}/></span><span>CINE<span>BOX</span></span></a>
      <nav className="main-nav"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>{t.home}</button><button className={filter === 'movie' ? 'active' : ''} onClick={() => setFilter('movie')}>{t.movies}</button><button className={filter === 'series' ? 'active' : ''} onClick={() => setFilter('series')}>{t.series}</button></nav>
      <div className="header-actions"><label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={14}/></button>}</label><button className="lang-button" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>{lang === 'en' ? 'हिंदी' : 'EN'}</button><button className="admin-button" onClick={() => { if (!isSupabaseConfigured) { setAdminOpen(true); return; } setAdminOpen(true); }}><ShieldCheck size={16}/><span>{t.admin}</span></button></div>
    </header>

    {!isSupabaseConfigured && <div className="setup-banner"><AlertCircle size={16}/><span>{t.demo}</span></div>}
    {dbError && <div className="setup-banner error-banner"><AlertCircle size={16}/><span>Database error: {dbError}</span></div>}

    {hero && filter === 'all' && !query && <section className="hero" style={{'--hero-image': `url("${hero.poster_url || getYouTubeThumbnail(hero.youtube_url)}")`}}>
      <div className="hero-bg"/><div className="hero-content"><span className="eyebrow"><span className="red-dot"/>{t.featured} · CINEBOX ORIGINALS</span><h1>{hero.title}</h1><div className="hero-meta"><span>{hero.year || 'New'}</span><span className="rating-chip">HD</span><span>{hero.genre || 'Entertainment'}</span></div><p>{hero.description}</p><div className="hero-buttons"><button className="primary-button" onClick={() => setSelected(hero)}><Play size={18} fill="currentColor"/>{t.play}</button><button className="secondary-button" onClick={() => setSelected(hero)}>{t.details}<ChevronRight size={17}/></button></div></div>
      <div className="hero-bottom-fade"/>
    </section>}

    <main className="catalog">
      <div className="section-heading"><div><span className="eyebrow">{filter === 'movie' ? 'FEATURE FILMS' : filter === 'series' ? 'EPISODIC STORIES' : 'YOUR NEXT FAVORITE'}</span><h2>{query ? `Search: “${query}”` : t.trending}</h2></div><span className="result-count">{filtered.length} titles</span></div>
      {loading ? <div className="empty-state">Loading CineBox…</div> : filtered.length ? <div className="movie-grid">{filtered.map(item => <article className="movie-card" key={item.id}><button className="poster-button" onClick={() => setSelected(item)} aria-label={`${t.play}: ${item.title}`}><Poster item={item}/><span className="card-play"><Play fill="currentColor" size={20}/></span></button><div className="card-info"><div className="card-title-line"><h3>{item.title}</h3><span className="quality">HD</span></div><p>{item.year || '—'} <span>·</span> {item.genre || 'General'}</p><button className="text-play" onClick={() => setSelected(item)}><Play size={13} fill="currentColor"/>{t.play}</button></div></article>)}</div> : <div className="empty-state"><Film size={32}/><p>{t.empty}</p></div>}
      {!isSupabaseConfigured && <div className="setup-note"><AlertCircle size={17}/><p>{t.configure}</p></div>}
    </main>

    <section className="trust-strip"><div><ShieldCheck size={20}/><span>Curated catalogue</span></div><div><Tv size={20}/><span>Movies & series</span></div><div><Play size={20}/><span>Watch on your screen</span></div></section>
    <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Clapperboard size={18}/></span><span>CINE<span>BOX</span></span></a><p>{t.footer}</p><span>© {new Date().getFullYear()} CineBox</span></footer>

    {selected && <PlayerModal item={selected} onClose={() => setSelected(null)} t={t}/>}
    {adminOpen && <div className="admin-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setAdminOpen(false); }}><aside className="admin-drawer"><AdminPanel t={t} session={session} onClose={() => setAdminOpen(false)} onChanged={loadTitles}/></aside></div>}
  </div>;
}