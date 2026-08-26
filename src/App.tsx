import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, Clock3, Copy, ExternalLink, Instagram, LayoutDashboard, Mail, MapPin, Menu as MenuIcon, Phone, QrCode, Settings, ShieldCheck, Utensils, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { createEnquiry, getAdminCounts, getGalleryItems, getMenuCategories, getPublishedEvents, getPublishedMenuItems, type EventRecord, type GalleryItem, type MenuCategory, type MenuItem } from '@/lib/queries';
import { isSupabaseConfigured, signInWithPassword, SupabaseConnectionError } from '@/lib/supabase';
import { ManagedAdminPage, ManagedLoginPage } from '@/components/admin-console';
import { previewCategories, previewEvents, previewImages, previewMenu } from '@/lib/preview-data';
import './index.css';

type ContentResult<T> = { data: T; loading: boolean; error: string | null; preview: boolean; retry: () => void };

function useContent<T>(loader: () => Promise<T>, fallback: T): ContentResult<T> {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    setLoading(true);
    loader()
      .then((value) => { if (active) { setData(value); setError(null); setLoading(false); } })
      .catch((reason: unknown) => { if (active) { console.error(reason); setError('Live content could not be loaded. Please try again.'); setLoading(false); } });
    return () => { active = false; };
  }, [attempt]);
  return { data, loading, error, preview: !isSupabaseConfigured, retry: () => setAttempt((value) => value + 1) };
}

function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} · HAOLAS BAR & LOUNGE`;
    const setMeta = (name: string, content: string) => {
      let node = document.querySelector(`meta[name="${name}"]`);
      if (!node) { node = document.createElement('meta'); node.setAttribute('name', name); document.head.appendChild(node); }
      node.setAttribute('content', content);
    };
    setMeta('description', description);
    setMeta('og:title', `${title} · HAOLAS BAR & LOUNGE`);
    setMeta('og:description', description);
  }, [title, description]);
}

const navItems = [
  ['/', 'Home'], ['/discover', 'Discover'], ['/food', 'Food'], ['/drinks', 'Drinks'],
  ['/events', 'Events'], ['/gallery', 'Gallery'], ['/about', 'About'], ['/contact', 'Contact'],
];

function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  return (
    <>
      <div className="topbar">Kajola Bus Stop PHASE 1 · Ibeju-Lekki, Lagos · 08030403367</div>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link href="/" className="brand-mark" data-testid="link-brand"><span>HAOLAS</span><small>Bar & Lounge</small></Link>
          <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main navigation">
            {navItems.map(([href, label]) => <Link key={href} href={href} aria-current={location === href ? 'page' : undefined} onClick={() => setOpen(false)} data-testid={`link-nav-${label.toLowerCase()}`}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link href="/menu" className="button" data-testid="link-header-menu">View Menu <ChevronRight size={14} /></Link>
            <button className="menu-toggle" aria-expanded={open} aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen((value) => !value)} data-testid="button-mobile-nav"><MenuIcon size={22} /></button>
          </div>
        </div>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <span className="eyebrow">Where good vibes live</span>
          <h3 style={{ marginTop: 18 }}>The best table<br /><i>in the room.</i></h3>
          <p>Every week · Great music · Great people · Unforgettable nights.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <div className="footer-links">{navItems.slice(1, 5).map(([href, label]) => <Link key={href} href={href} data-testid={`link-footer-${label.toLowerCase()}`}>{label}</Link>)}</div>
        </div>
        <div>
          <h3>Find us</h3>
          <p>Kajola Bus Stop PHASE 1,<br />Ibeju-Lekki, Lagos.</p>
          <div className="footer-links" style={{ marginTop: 14 }}><a href="tel:08030403367" data-testid="link-footer-phone">08030403367</a><a href="tel:08080706529" data-testid="link-footer-phone-two">08080706529</a></div>
        </div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} HAOLAS BAR & LOUNGE</span><span>Good nights, properly hosted.</span></div>
    </footer>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><Header />{children}<Footer /></div>;
}

function ContentStatus({ preview, error, onRetry }: { preview: boolean; error: string | null; onRetry: () => void }) {
  if (error) return <div className="content-status status-error"><span><strong>Live connection issue</strong> · {error}</span><button className="button button-ghost" onClick={onRetry} data-testid="button-retry-content">Retry</button></div>;
  if (preview) return <div className="content-status"><span><strong>Editorial preview</strong> · Connect Supabase to publish live venue content.</span><Link href="/login" className="button button-ghost" data-testid="link-preview-login">Admin login <ChevronRight size={13} /></Link></div>;
  return null;
}

function PageHero({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return <section className="page-hero"><div className="container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{children}</div></section>;
}

function HomePage() {
  usePageMeta('Where good vibes live', 'HAOLAS BAR & LOUNGE in Ibeju-Lekki, Lagos. Great music, great people, unforgettable nights.');
  const events = useContent(getPublishedEvents, previewEvents);
  const menu = useContent(getPublishedMenuItems, previewMenu);
  const featuredEvent = events.data.find((event) => event.featured) ?? events.data[0];
  const featuredMenu = menu.data.filter((item) => item.featured).slice(0, 3);
  return <PublicLayout>
    <main>
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(16,20,18,.93) 0%, rgba(16,20,18,.62) 47%, rgba(16,20,18,.26) 100%), url("${previewImages.hero}")` }}>
        <div className="container hero-content"><span className="eyebrow">HAOLAS BAR & LOUNGE · LAGOS</span><h1>Where good<br /><span className="display-italic">vibes live.</span></h1><p className="hero-copy">The room is warm, the sound is right, and there is always a reason to stay for one more.</p><div className="hero-actions"><Link href="/discover" className="button" data-testid="link-hero-discover">Explore Haolas <ArrowRight size={15} /></Link><Link href="/menu" className="button button-secondary" data-testid="link-hero-menu">View the menu</Link></div></div>
        <div className="scroll-note"><span>Scroll to discover</span></div>
      </section>
      <div className="rhythm-band"><div className="container rhythm-track"><span>Every week</span><b aria-hidden="true">/</b><span>Great music</span><b aria-hidden="true">/</b><span>Great people</span><b aria-hidden="true">/</b><span>Unforgettable nights</span></div></div>
      <section className="section"><div className="container"><div className="section-intro"><div><span className="eyebrow">The next reason to come through</span><h2>Tonight has<br /><span className="display-italic">a pulse.</span></h2></div><p>Whatever brings you in, let the room take it from there. Check what is happening at Haolas.</p></div><ContentStatus preview={events.preview} error={events.error} onRetry={events.retry} /><Link href={`/events/${featuredEvent?.id ?? 'weekly-entertainment'}`} className="feature-event" data-testid="card-featured-event"><img src={featuredEvent?.cover_image_url ?? previewImages.event} alt="" /><div className="feature-event-content"><span className="date-chip"><span />{featuredEvent?.date ?? 'This week'} · {featuredEvent?.time ?? 'From 7:00 PM'}</span><h3>{featuredEvent?.title ?? 'Weekly Entertainment'}</h3><p className="muted">{featuredEvent?.description}</p><span className="button button-ghost">See event details <ArrowRight size={14} /></span></div></Link></div></section>
      <div className="container"><div className="split-heading" style={{ marginBottom: 44 }}><div><span className="eyebrow">A little rhythm</span><h2>Made for the<br /><span className="display-italic">after hours.</span></h2></div><p className="muted">A place to catch up, turn up, and find your people. The week feels different when there is good music in the walls.</p></div></div>
      <section className="section-tight"><div className="container editorial-grid"><Link href="/food" className="editorial-card" data-testid="card-food-preview"><img src={previewImages.food} alt="A plated dish at Haolas" /><div className="editorial-overlay"><span className="eyebrow">From the kitchen</span><h3>Come hungry.</h3><span>Explore food <ArrowRight size={13} /></span></div></Link><div className="editorial-stack"><Link href="/drinks" className="editorial-card small" data-testid="card-drinks-preview"><img src={previewImages.drinks} alt="Cocktail at Haolas" /><div className="editorial-overlay"><span className="eyebrow">At the bar</span><h3>Stay thirsty.</h3><span>Explore drinks <ArrowRight size={13} /></span></div></Link><Link href="/gallery" className="editorial-card small" data-testid="card-gallery-preview"><img src={previewImages.room} alt="The Haolas lounge interior" /><div className="editorial-overlay"><span className="eyebrow">Inside Haolas</span><h3>See the room.</h3><span>View gallery <ArrowRight size={13} /></span></div></Link></div></div></section>
      <section className="section"><div className="container menu-preview"><div><span className="eyebrow">On the table</span><h2>Something<br /><span className="display-italic">worth ordering.</span></h2><p className="muted" style={{ marginTop: 20 }}>A quick look at the menu. For the full, current selection, head to the live menu.</p><Link href="/menu" className="button button-secondary" style={{ marginTop: 28 }} data-testid="link-home-full-menu">Browse full menu <ArrowRight size={14} /></Link></div><div><ContentStatus preview={menu.preview} error={menu.error} onRetry={menu.retry} /><div className="menu-list">{(featuredMenu.length ? featuredMenu : menu.data.slice(0, 3)).map((item) => <div className="menu-row" key={item.id} data-testid={`row-featured-menu-${item.id}`}><div><h3>{item.name}</h3><p>{item.description}</p></div><span className="price">₦{Number(item.price).toLocaleString()}</span></div>)}</div></div></div></section>
      <section className="section-tight"><div className="container"><div className="story-panel"><img src={previewImages.room} alt="Warmly lit lounge seating at Haolas" /><div className="story-content"><span className="eyebrow">Pull up a chair</span><h2>Good nights<br /><span className="display-italic">start here.</span></h2><p>HAOLAS BAR & LOUNGE is your place for the easy arrival, the familiar face at the next table, and a soundtrack that carries the night.</p><Link href="/about" className="button" data-testid="link-home-about">About Haolas <ArrowRight size={14} /></Link></div></div></div></section>
      <section className="section"><div className="container"><div className="section-intro"><div><span className="eyebrow">A glimpse inside</span><h2>The room<br /><span className="display-italic">after dark.</span></h2></div><Link href="/gallery" className="button button-secondary" data-testid="link-home-gallery">Open gallery <ArrowRight size={14} /></Link></div><div className="gallery-strip">{previewImages.gallery.slice(0, 4).map((image, index) => <Link href="/gallery" key={image} data-testid={`link-home-gallery-${index}`}><img src={image} alt={`Haolas atmosphere ${index + 1}`} loading="lazy" /></Link>)}</div></div></section>
      <section className="section-tight"><div className="container location-band"><div><span className="eyebrow">Come find us</span><h2>Kajola Bus Stop<br /><span className="display-italic">PHASE 1.</span></h2></div><div className="location-meta"><div><strong>Ibeju-Lekki, Lagos</strong><span>Easy to find. Worth the trip.</span></div><div><strong>08030403367 · 08080706529</strong><span>Call ahead or just come through.</span></div><Link href="/location" className="button button-secondary" data-testid="link-home-location">Get directions <MapPin size={14} /></Link></div></div></section>
    </main>
  </PublicLayout>;
}

function MenuCard({ item, categories }: { item: MenuItem; categories: MenuCategory[] }) {
  const category = categories.find((value) => value.id === item.category_id);
  return <article className="menu-card" data-testid={`card-menu-item-${item.id}`}><div className="menu-card-image"><img src={item.image_url ?? previewImages.food} alt={item.name} loading="lazy" /></div><div className="menu-card-body"><span className="kicker">{category?.name ?? 'Haolas selection'}</span><h3>{item.name}</h3><p>{item.description || 'A Haolas favourite, served for the room.'}</p><div className="menu-card-meta"><span className="price">₦{Number(item.price).toLocaleString()}</span>{item.featured ? <span className="tag">Featured</span> : null}</div></div></article>;
}

function MenuPage({ kind = 'all' }: { kind?: 'all' | 'food' | 'drinks' }) {
  const title = kind === 'food' ? 'Food for the table.' : kind === 'drinks' ? 'Drinks for the moment.' : 'The Haolas menu.';
  usePageMeta(kind === 'all' ? 'Menu' : kind === 'food' ? 'Food' : 'Drinks', 'Browse the current menu at HAOLAS BAR & LOUNGE.');
  const menu = useContent(getPublishedMenuItems, previewMenu);
  const categories = useContent(getMenuCategories, previewCategories);
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => menu.data.filter((item) => filter === 'all' || item.category_id === filter).filter((item) => {
    if (kind === 'all') return true;
    const category = categories.data.find((value) => value.id === item.category_id);
    return category?.slug === kind || category?.name.toLowerCase().includes(kind);
  }), [menu.data, categories.data, filter, kind]);
  return <PublicLayout><main><PageHero eyebrow={kind === 'all' ? 'A good place to start' : kind === 'food' ? 'From the kitchen' : 'From the bar'} title={title}><p>Take your time. Order what sounds right. The room will handle the rest.</p></PageHero><section className="page-body"><div className="container"><ContentStatus preview={menu.preview} error={menu.error} onRetry={menu.retry} /><div className="filter-bar"><button className={`filter-button ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} data-testid="button-filter-all">All</button>{categories.data.map((category) => <button key={category.id} className={`filter-button ${filter === category.id ? 'active' : ''}`} onClick={() => setFilter(category.id)} data-testid={`button-filter-${category.id}`}>{category.name}</button>)}</div>{menu.loading ? <div className="state-box"><h3>Setting the table…</h3><p>Loading the current selection.</p></div> : menu.error ? <div className="state-box"><h3>We lost the signal.</h3><p>Try again when you are ready.</p><button className="button button-secondary" onClick={menu.retry} data-testid="button-retry-menu">Retry</button></div> : filtered.length ? <div className="cards-grid">{filtered.map((item) => <MenuCard key={item.id} item={item} categories={categories.data} />)}</div> : <div className="state-box"><h3>Nothing on this shelf yet.</h3><p>Try another category or check back soon.</p></div>}<QRPanel /></div></section></main></PublicLayout>;
}

function QRPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = `${(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')}/menu`;
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (canvasRef.current) QRCode.toCanvas(canvasRef.current, target, { margin: 0, width: 180, color: { dark: '#101412', light: '#e8e8d9' } }); }, [target]);
  const copy = async () => { await navigator.clipboard?.writeText(target); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const download = () => { const link = document.createElement('a'); link.download = 'haolas-menu-qr.png'; link.href = canvasRef.current?.toDataURL('image/png') ?? ''; link.click(); };
  return <div className="qr-panel" style={{ marginTop: 70 }}><div className="qr-box"><canvas ref={canvasRef} aria-label="QR code linking to the Haolas menu" data-testid="qr-menu-code" /></div><div><span className="eyebrow">One scan away</span><h3>Scan to view the Haolas menu.</h3><p className="muted">This code opens the menu page. The selection stays live and can change without changing the code.</p><span className="qr-url" data-testid="text-qr-destination">{target}</span><div className="hero-actions" style={{ marginTop: 4 }}><button className="button button-secondary" onClick={copy} data-testid="button-copy-qr-url">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy link'}</button><button className="button" onClick={download} data-testid="button-download-qr">Download QR <QrCode size={14} /></button></div></div></div>;
}

function EventsPage() {
  usePageMeta('Events', 'The week at HAOLAS BAR & LOUNGE: music, gatherings, and memorable nights.');
  const events = useContent(getPublishedEvents, previewEvents);
  return <PublicLayout><main><PageHero eyebrow="Make a night of it" title={<>What’s on<br /><span className="display-italic">at Haolas.</span></>}><p>A room with a calendar. Find your next reason to get dressed and come through.</p></PageHero><section className="page-body"><div className="container"><ContentStatus preview={events.preview} error={events.error} onRetry={events.retry} />{events.loading ? <div className="state-box"><h3>Checking the calendar…</h3></div> : events.error ? <div className="state-box"><h3>The calendar is taking a breather.</h3><button className="button button-secondary" onClick={events.retry} data-testid="button-retry-events">Retry</button></div> : <div className="events-grid">{events.data.map((event) => <EventCard key={event.id} event={event} />)}</div>}</div></section></main></PublicLayout>;
}

function EventCard({ event }: { event: EventRecord }) {
  return <Link href={`/events/${event.id}`} className="event-card" data-testid={`card-event-${event.id}`}><img src={event.cover_image_url ?? previewImages.event} alt="" loading="lazy" /><div className="event-card-info"><span className="date-chip"><span />{event.date ?? 'Coming up'}{event.time ? ` · ${event.time}` : ''}</span><h3>{event.title}</h3><p className="muted">{event.description}</p></div></Link>;
}

function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const events = useContent(getPublishedEvents, previewEvents);
  const event = events.data.find((item) => item.id === id) ?? events.data[0];
  usePageMeta(event?.title ?? 'Event', event?.description ?? 'Upcoming happenings at HAOLAS BAR & LOUNGE.');
  return <PublicLayout><main><section className="page-hero"><div className="container"><Link href="/events" className="eyebrow" data-testid="link-back-events"><ArrowLeft size={13} /> Back to events</Link><h1>{event?.title ?? 'Event details'}</h1><p>{event?.description ?? 'Event details will appear here when published.'}</p></div></section><section className="page-body"><div className="container contact-grid"><div><img src={event?.cover_image_url ?? previewImages.event} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} /></div><div><span className="eyebrow">Save the feeling</span><div className="contact-details"><div><strong><CalendarDays size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />{event?.date ?? 'Coming up'}</strong><span>Date at a glance.</span></div><div><strong><Clock3 size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />{event?.time ?? 'From 7:00 PM'}</strong><span>Doors open when the room is ready.</span></div><div><strong><MapPin size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />{event?.location ?? 'HAOLAS BAR & LOUNGE'}</strong><span>Kajola Bus Stop PHASE 1, Ibeju-Lekki, Lagos.</span></div></div><Link href="/contact" className="button" style={{ marginTop: 35 }} data-testid="link-event-contact">Ask about this night <ArrowRight size={14} /></Link></div></div></section></main></PublicLayout>;
}

function GalleryPage() {
  usePageMeta('Gallery', 'A look inside HAOLAS BAR & LOUNGE.');
  const gallery = useContent(getGalleryItems, previewImages.gallery.map((image, index) => ({ id: `preview-${index}`, image_url: image, caption: ['Warm light', 'The room', 'At the bar', 'The sound', 'After hours', 'Your table'][index], category: 'Atmosphere' })));
  const [active, setActive] = useState<number | null>(null);
  const current = active === null ? null : gallery.data[active];
  const move = (direction: number) => { if (active === null) return; setActive((active + direction + gallery.data.length) % gallery.data.length); };
  return <PublicLayout><main><PageHero eyebrow="Inside Haolas" title={<>The room<br /><span className="display-italic">after dark.</span></>}><p>Atmosphere is part of the order. Take a look around before you arrive.</p></PageHero><section className="page-body"><div className="container"><ContentStatus preview={gallery.preview} error={gallery.error} onRetry={gallery.retry} /><div className="gallery-grid">{gallery.data.map((item, index) => <button className="gallery-tile" key={item.id} onClick={() => setActive(index)} aria-label={`Open ${item.caption ?? 'gallery image'}`} data-testid={`button-gallery-${item.id}`}><img src={item.image_url} alt={item.caption ?? 'Haolas atmosphere'} loading="lazy" /><span>{item.caption ?? 'HAOLAS BAR & LOUNGE'}</span></button>)}</div></div></section></main>{current ? <div className="lightbox" role="dialog" aria-modal="true" aria-label="Gallery image viewer" onClick={() => setActive(null)}><button className="lightbox-close" onClick={() => setActive(null)} aria-label="Close image viewer" data-testid="button-close-lightbox"><X size={20} /></button><button className="lightbox-nav prev" onClick={(event) => { event.stopPropagation(); move(-1); }} aria-label="Previous image" data-testid="button-gallery-previous"><ArrowLeft size={20} /></button><img src={current.image_url} alt={current.caption ?? 'Haolas atmosphere'} onClick={(event) => event.stopPropagation()} /><button className="lightbox-nav next" onClick={(event) => { event.stopPropagation(); move(1); }} aria-label="Next image" data-testid="button-gallery-next"><ArrowRight size={20} /></button></div> : null}</PublicLayout>;
}

function DiscoverPage() {
  usePageMeta('Discover', 'Discover the energy, food, music, and people of HAOLAS BAR & LOUNGE.');
  return <PublicLayout><main><PageHero eyebrow="A little more Haolas" title={<>The night<br /><span className="display-italic">starts here.</span></>}><p>There is no dress code for a good mood. Come for a drink, stay because the music got better.</p></PageHero><section className="section"><div className="container"><div className="story-panel"><img src={previewImages.event} alt="People enjoying a night out" /><div className="story-content"><span className="eyebrow">The Haolas feeling</span><h2>Find your<br /><span className="display-italic">good people.</span></h2><p>Some nights are planned. The best ones have a way of becoming stories. Haolas is a place to meet the night somewhere between the first hello and the last song.</p><Link href="/events" className="button" data-testid="link-discover-events">See what’s on <ArrowRight size={14} /></Link></div></div></div></section><section className="section-tight"><div className="container editorial-grid"><Link href="/food" className="editorial-card" data-testid="link-discover-food"><img src={previewImages.food} alt="Food served at Haolas" /><div className="editorial-overlay"><span className="eyebrow">Food</span><h3>Order for the table.</h3></div></Link><Link href="/drinks" className="editorial-card" data-testid="link-discover-drinks"><img src={previewImages.drinks} alt="Drinks at Haolas" /><div className="editorial-overlay"><span className="eyebrow">Drinks</span><h3>Take it slow. Or don’t.</h3></div></Link></div></section></main></PublicLayout>;
}

function AboutPage() {
  usePageMeta('About', 'The story and spirit of HAOLAS BAR & LOUNGE.');
  return <PublicLayout><main><PageHero eyebrow="Our kind of place" title={<>Meet<br /><span className="display-italic">Haolas.</span></>}><p>A Lagos bar and lounge for good music, good people, and nights you will want to repeat.</p></PageHero><section className="section"><div className="container split-heading"><div><span className="eyebrow">Where good vibes live</span><h2>Come as you are.<br /><span className="display-italic">Stay a while.</span></h2></div><div><p className="muted">HAOLAS BAR & LOUNGE is built around a simple feeling: that a great night is better when the setting feels right. A warm welcome, music in the walls, and a table worth finding.</p><p className="muted" style={{ marginTop: 22 }}>From the first drink to the last song, the room is yours to enjoy.</p></div></div></section><section className="section-tight"><div className="container"><img src={previewImages.room} alt="The Haolas lounge interior" style={{ width: '100%', maxHeight: 620, objectFit: 'cover' }} /></div></section></main></PublicLayout>;
}

function LocationPage() {
  usePageMeta('Location', 'Find HAOLAS BAR & LOUNGE at Kajola Bus Stop PHASE 1, Ibeju-Lekki, Lagos.');
  return <PublicLayout><main><PageHero eyebrow="Your next stop" title={<>Come<br /><span className="display-italic">through.</span></>}><p>Kajola Bus Stop PHASE 1, Ibeju-Lekki, Lagos.</p></PageHero><section className="page-body"><div className="container"><div className="map-card"><div><div className="pin"><MapPin size={25} /></div><h3>HAOLAS BAR & LOUNGE</h3><p className="muted">Kajola Bus Stop PHASE 1,<br />Ibeju-Lekki, Lagos.</p><a className="button" href="https://www.google.com/maps/search/?api=1&query=Kajola+Bus+Stop+Ibeju-Lekki+Lagos" target="_blank" rel="noreferrer" style={{ marginTop: 20 }} data-testid="link-open-map">Open in Maps <ExternalLink size={14} /></a></div></div><div className="location-band"><div><span className="eyebrow">Talk to us</span><h2>Ring the<br /><span className="display-italic">room.</span></h2></div><div className="location-meta"><div><strong>08030403367</strong><a href="tel:08030403367" data-testid="link-location-phone">Call this number</a></div><div><strong>08080706529</strong><a href="tel:08080706529" data-testid="link-location-phone-two">Call this number</a></div></div></div></div></section></main></PublicLayout>;
}

function ContactPage() {
  usePageMeta('Contact', 'Get in touch with HAOLAS BAR & LOUNGE.');
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState<{ type: '' | 'loading' | 'success' | 'error'; message: string }>({ type: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Tell us your name.';
    if (!/^[0-9+() -]{7,}$/.test(form.phone.trim())) next.phone = 'Add a valid phone number.';
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Check the email format.';
    if (form.message.trim().length < 10) next.message = 'Give us a little more to work with.';
    setErrors(next);
    if (Object.keys(next).length) return;
    if (!isSupabaseConfigured) { setStatus({ type: 'error', message: 'Supabase is not connected yet. Your enquiry was not submitted.' }); return; }
    setStatus({ type: 'loading', message: 'Sending your note…' });
    try { await createEnquiry(form); setStatus({ type: 'success', message: 'Your note is in. We will be in touch.' }); setForm({ name: '', phone: '', email: '', message: '' }); } catch (reason) { console.error(reason); setStatus({ type: 'error', message: 'We could not send that just now. Please call the room directly.' }); }
  };
  return <PublicLayout><main><PageHero eyebrow="Say hello" title={<>Let’s make<br /><span className="display-italic">a plan.</span></>}><p>Questions, celebrations, table requests, or just a good idea? We are listening.</p></PageHero><section className="page-body"><div className="container contact-grid"><div className="contact-copy"><span className="eyebrow">Contact Haolas</span><h2>Bring the<br /><span className="display-italic">good energy.</span></h2><p>Send a note and the room will get back to you. For quick questions, call us directly.</p><div className="contact-details"><div><strong><Phone size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />08030403367</strong><a href="tel:08030403367" data-testid="link-contact-phone">Call the lounge</a></div><div><strong><Phone size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />08080706529</strong><a href="tel:08080706529" data-testid="link-contact-phone-two">Call the lounge</a></div><div><strong><MapPin size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />Ibeju-Lekki, Lagos</strong><Link href="/location" data-testid="link-contact-location">Get directions</Link></div></div></div><form onSubmit={submit} noValidate><div className="form-grid"><Field label="Name" name="name" value={form.name} onChange={(value) => update('name', value)} error={errors.name} placeholder="Your name" /><Field label="Phone" name="phone" value={form.phone} onChange={(value) => update('phone', value)} error={errors.phone} placeholder="0803 040 3367" /><Field label="Email (optional)" name="email" value={form.email} onChange={(value) => update('email', value)} error={errors.email} placeholder="you@example.com" type="email" /><div /><Field label="Message" name="message" value={form.message} onChange={(value) => update('message', value)} error={errors.message} placeholder="Tell us what you have in mind…" textarea /></div><div className="form-footer"><span className={`form-message ${status.type}`} aria-live="polite" data-testid="status-contact-form">{status.message}</span><button type="submit" className="button" disabled={status.type === 'loading'} data-testid="button-submit-contact">{status.type === 'loading' ? 'Sending…' : 'Send enquiry'} <ArrowRight size={14} /></button></div></form></div></section></main></PublicLayout>;
}

function Field({ label, name, value, onChange, error, placeholder, type = 'text', textarea = false }: { label: string; name: string; value: string; onChange: (value: string) => void; error?: string; placeholder: string; type?: string; textarea?: boolean }) {
  return <div className="field full"><label htmlFor={name}>{label}</label>{textarea ? <textarea id={name} name={name} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} data-testid={`input-${name}`} /> : <input id={name} name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} data-testid={`input-${name}`} />}{error ? <span className="field-error">{error}</span> : null}</div>;
}

function LoginPage() {
  usePageMeta('Admin login', 'Secure admin access for HAOLAS BAR & LOUNGE.');
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.email || !form.password) { setMessage('Enter your email and password.'); return; }
    if (!isSupabaseConfigured) { setMessage('Supabase is not connected. Admin access is unavailable until it is configured.'); return; }
    setLoading(true); setMessage('');
    try { await signInWithPassword(form.email, form.password); setLocation('/admin'); } catch (reason) { console.error(reason); setMessage(reason instanceof SupabaseConnectionError ? 'Supabase is not connected.' : 'We could not verify those details.'); } finally { setLoading(false); }
  };
  return <div className="login-page"><div className="login-card"><Link href="/" className="brand-mark" data-testid="link-login-brand"><span>HAOLAS</span><small>Bar & Lounge</small></Link><span className="eyebrow">Private room</span><h1>Admin<br /><span className="display-italic">access.</span></h1><p>For the people who keep the room moving.</p><form onSubmit={submit}><div className="field"><label htmlFor="login-email">Email</label><input id="login-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@haolas.com" data-testid="input-login-email" /></div><div className="field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" data-testid="input-login-password" /></div>{message ? <p className="form-message error" aria-live="polite" data-testid="status-login">{message}</p> : null}<button className="button" type="submit" disabled={loading} data-testid="button-login">{loading ? 'Checking…' : 'Enter admin'}</button></form><Link href="/" className="login-back" data-testid="link-login-back"><ArrowLeft size={13} /> Return to the lounge</Link></div></div>;
}

const adminNav = [['/admin', 'Overview', LayoutDashboard], ['/admin/content', 'Menu content', Utensils], ['/admin/events', 'Events', CalendarDays], ['/admin/gallery', 'Gallery', Instagram], ['/admin/enquiries', 'Enquiries', Mail], ['/admin/settings', 'Settings', Settings]] as const;

function AdminPage() {
  const [location, setLocation] = useLocation();
  const path = location.split('/').filter(Boolean).pop() ?? 'admin';
  const counts = useContent(getAdminCounts, { menu: 0, events: 0, gallery: 0 });
  const titles: Record<string, [string, string]> = { admin: ['Good evening.', 'Here is the room at a glance.'], content: ['Menu content', 'Keep the table current.'], events: ['Events', 'Give the week a reason.'], gallery: ['Gallery', 'Set the atmosphere.'], enquiries: ['Enquiries', 'Notes from the room.'], settings: ['Settings', 'The details behind the door.'] };
  const [title, subtitle] = titles[path] ?? titles.admin;
  const stats = [{ label: 'Menu items', value: counts.data.menu, icon: Utensils }, { label: 'Events', value: counts.data.events, icon: CalendarDays }, { label: 'Gallery', value: counts.data.gallery, icon: Instagram }, { label: 'Enquiries', value: '—', icon: Mail }, { label: 'Connection', value: isSupabaseConfigured ? 'Live' : 'Needs setup', icon: ShieldCheck }];
  return <div className="admin-layout"><aside className="admin-sidebar"><Link href="/" className="brand-mark" data-testid="link-admin-brand"><span>HAOLAS</span><small>Bar & Lounge</small></Link><nav className="admin-nav" aria-label="Admin navigation">{adminNav.map(([href, label, Icon]) => <Link key={href} href={href} aria-current={location === href ? 'page' : undefined} data-testid={`link-admin-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} />{label}</Link>)}</nav><p className="admin-note">Auth, RLS and Storage connect through Supabase. This shell is ready for your team once the project is configured.</p></aside><div className="admin-main"><header className="admin-header"><span className="kicker">HAOLAS control room</span><Link href="/" className="button button-secondary" data-testid="link-admin-view-site">View public site <ExternalLink size={13} /></Link></header><main className="admin-content"><div className="admin-title"><span className="eyebrow">{isSupabaseConfigured ? 'Connected workspace' : 'Connection needed'}</span><h1>{title}</h1><p className="muted">{subtitle}</p></div><ContentStatus preview={counts.preview} error={counts.error} onRetry={counts.retry} />{path === 'admin' ? <><div className="stats-grid">{stats.map(({ label, value, icon: Icon }) => <div className="stat-card" key={label}><Icon size={17} color="var(--coral)" /><strong>{value}</strong><span>{label}</span></div>)}</div><div className="admin-panels"><div className="admin-panel"><h3>Quick actions</h3><div className="action-list"><Link href="/admin/content" data-testid="link-admin-add-food"><span>Add or edit menu items</span><ChevronRight size={15} /></Link><Link href="/admin/events" data-testid="link-admin-add-event"><span>Create an event</span><ChevronRight size={15} /></Link><Link href="/admin/gallery" data-testid="link-admin-upload-gallery"><span>Upload gallery image</span><ChevronRight size={15} /></Link></div></div><div className="admin-panel"><h3>Live connection</h3><p className="muted">Public content reads from published Supabase records. Enquiries stay private behind RLS. Images belong in Supabase Storage.</p><p className="admin-note">To go live: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then confirm Auth policies and storage buckets.</p></div></div></> : <AdminSection path={path} onNavigate={setLocation} />}</main></div></div>;
}

function AdminSection({ path, onNavigate }: { path: string; onNavigate: (path: string) => void }) {
  if (!isSupabaseConfigured) return <div className="state-box"><ShieldCheck size={24} color="var(--lime)" style={{ marginBottom: 12 }} /><h3>Connect Supabase to manage content.</h3><p>This screen is intentionally not pretending to save anything. Add the project URL and anon key to enable Auth, RLS, and Storage.</p><Link href="/login" className="button" style={{ marginTop: 20 }} data-testid="link-admin-connect">Go to admin login</Link></div>;
  if (path === 'content') return <div className="admin-panel"><h3>Menu content</h3><p className="muted">Published menu items will appear here when the project schema is connected. Create, edit, publish, and archive actions belong in this workspace.</p><button className="button button-secondary" onClick={() => onNavigate('/menu')} style={{ marginTop: 20 }} data-testid="button-admin-preview-menu">Preview public menu</button></div>;
  if (path === 'events') return <div className="admin-panel"><h3>Events calendar</h3><p className="muted">Create and publish weekly entertainment, live music, and special events from Supabase.</p><button className="button button-secondary" onClick={() => onNavigate('/events')} style={{ marginTop: 20 }} data-testid="button-admin-preview-events">Preview public events</button></div>;
  if (path === 'gallery') return <div className="admin-panel"><h3>Gallery storage</h3><p className="muted">Upload image files to the gallery-images Storage bucket, then publish their gallery record.</p><button className="button button-secondary" onClick={() => onNavigate('/gallery')} style={{ marginTop: 20 }} data-testid="button-admin-preview-gallery">Preview public gallery</button></div>;
  if (path === 'enquiries') return <div className="admin-panel"><h3>Private enquiries</h3><p className="muted">Enquiry records are only readable to authorized staff through Supabase RLS. No public reader is implemented.</p></div>;
  return <div className="admin-panel"><h3>Workspace settings</h3><p className="muted">Site settings, profiles, Auth, RLS, and Storage policies are managed in the connected Supabase project.</p></div>;
}

function NotFoundPage() {
  usePageMeta('Not found', 'This page is not available at HAOLAS BAR & LOUNGE.');
  return <PublicLayout><main><PageHero eyebrow="Wrong turn" title={<>This page<br /><span className="display-italic">isn’t here.</span></>}><Link href="/" className="button" style={{ marginTop: 28 }} data-testid="link-not-found-home">Back to Haolas <ArrowLeft size={14} /></Link></PageHero></main></PublicLayout>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={HomePage} />
    <Route path="/discover" component={DiscoverPage} />
    <Route path="/food"><MenuPage kind="food" /></Route>
    <Route path="/drinks"><MenuPage kind="drinks" /></Route>
    <Route path="/menu"><MenuPage /></Route>
    <Route path="/events/:id" component={EventDetailPage} />
    <Route path="/events" component={EventsPage} />
    <Route path="/gallery" component={GalleryPage} />
    <Route path="/about" component={AboutPage} />
    <Route path="/contact" component={ContactPage} />
    <Route path="/location" component={LocationPage} />
    <Route path="/login" component={ManagedLoginPage} />
    <Route path="/admin" component={ManagedAdminPage} />
    <Route path="/admin/content" component={ManagedAdminPage} />
    <Route path="/admin/events" component={ManagedAdminPage} />
    <Route path="/admin/gallery" component={ManagedAdminPage} />
    <Route path="/admin/enquiries" component={ManagedAdminPage} />
    <Route path="/admin/settings" component={ManagedAdminPage} />
    <Route component={NotFoundPage} />
  </Switch></ErrorBoundary>;
}

function App() {
  return <Router />;
}

export default App;
