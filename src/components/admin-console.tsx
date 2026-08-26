import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Check, ExternalLink, LogOut, Plus, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  createEvent,
  createGalleryItem,
  createMenuCategory,
  createMenuItem,
  deleteGalleryItem,
  getAdminEvents,
  getAdminGalleryItems,
  getAdminMenuCategories,
  getAdminMenuItems,
  type EventRecord,
  type GalleryItem,
  type MenuCategory,
  type MenuItem,
  updateEvent,
  updateGalleryItem,
  updateMenuCategory,
  updateMenuItem,
} from '@/lib/queries';
import { removeGalleryImage, uploadGalleryImage } from '@/lib/supabase';

type Status = { type: 'success' | 'error'; text: string } | null;

const emptyEvent = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  cover_image_url: '',
  featured: false,
  published: false,
};

const emptyMenu = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  image_url: '',
  featured: false,
  available: true,
  published: false,
};

function useRecords<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);

    try {
      setItems(await load());
      setError('');
    } catch {
      setError('Could not load this content. Confirm your admin profile and RLS policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { items, loading, error, refresh };
}

function Message({ status }: { status: Status }) {
  return status ? (
    <p className={`form-message ${status.type}`}>{status.text}</p>
  ) : null;
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="admin-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function ManagedLoginPage() {
  const [, setLocation] = useLocation();
  const { signIn, isAdmin, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && isAdmin) {
      setLocation('/admin');
    }
  }, [loading, isAdmin, setLocation]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      setMessage('Enter your email and password.');
      return;
    }

    setMessage('');

    try {
      await signIn(email, password);
      setMessage('Checking your admin access…');
    } catch (error) {
      console.error('LOGIN ERROR:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Login failed.';

      setMessage(errorMessage);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link href="/" className="brand-mark">
          <span>HAOLAS</span>
          <small>Bar & Lounge</small>
        </Link>

        <span className="eyebrow">Private room</span>

        <h1>
          Admin
          <br />
          <span className="display-italic">access.</span>
        </h1>

        <p>For the people who keep the room moving.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {message ? (
            <p className="form-message error">{message}</p>
          ) : null}

          <button className="button" disabled={loading}>
            {loading ? 'Checking…' : 'Enter admin'}
          </button>
        </form>

        <Link href="/" className="login-back">
          Return to the lounge
        </Link>
      </div>
    </div>
  );
}

export function ManagedAdminPage() {
  const [location, setLocation] = useLocation();
  const { loading, session, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      setLocation('/login');
    } else if (!loading && session && !isAdmin) {
      setLocation('/');
    }
  }, [loading, session, isAdmin, setLocation]);

  if (loading) {
    return (
      <div className="state-box">
        <h3>Checking access…</h3>
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  const path = location.split('/').pop() ?? 'admin';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/" className="brand-mark">
          <span>HAOLAS</span>
          <small>Bar & Lounge</small>
        </Link>

        <nav className="admin-nav">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/content">Menu content</Link>
          <Link href="/admin/events">Events</Link>
          <Link href="/admin/gallery">Gallery</Link>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <span className="kicker">HAOLAS control room</span>

          <div className="admin-actions">
            <Link href="/" className="button button-secondary">
              View public site <ExternalLink size={13} />
            </Link>

            <button
              className="button button-secondary"
              onClick={() => void signOut()}
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          {path === 'content' ? (
            <MenuManager />
          ) : path === 'events' ? (
            <EventManager />
          ) : path === 'gallery' ? (
            <GalleryManager />
          ) : (
            <Overview onNavigate={setLocation} />
          )}
        </main>
      </div>
    </div>
  );
}

function Overview({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <>
      <div className="admin-title">
        <span className="eyebrow">Connected workspace</span>
        <h1>Good evening.</h1>
        <p className="muted">Manage the menu, calendar, and gallery.</p>
      </div>

      <div className="admin-panels">
        <div className="admin-panel">
          <h3>Quick actions</h3>

          <div className="action-list">
            <button onClick={() => onNavigate('/admin/content')}>
              Manage menu <Plus size={15} />
            </button>

            <button onClick={() => onNavigate('/admin/events')}>
              Manage events <Plus size={15} />
            </button>

            <button onClick={() => onNavigate('/admin/gallery')}>
              Upload gallery image <Upload size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function EventManager() {
  const records = useRecords(getAdminEvents);
  const [editing, setEditing] =
    useState<Partial<EventRecord> | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editing?.title) {
      return setStatus({
        type: 'error',
        text: 'An event title is required.',
      });
    }

    try {
      const data = { ...emptyEvent, ...editing };

      if (editing.id) {
        await updateEvent(editing.id, data);
      } else {
        await createEvent(data);
      }

      setEditing(null);
      setStatus({ type: 'success', text: 'Event saved.' });
      await records.refresh();
    } catch {
      setStatus({
        type: 'error',
        text: 'Event could not be saved.',
      });
    }
  };

  return (
    <section>
      <div className="admin-title">
        <span className="eyebrow">Calendar</span>
        <h1>Events</h1>
      </div>

      <button
        className="button"
        onClick={() => setEditing(emptyEvent)}
      >
        <Plus size={14} /> New event
      </button>

      <Message status={status} />

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Live</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {records.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                </td>
                <td>{item.date}</td>
                <td>{item.published ? 'Published' : 'Draft'}</td>
                <td>
                  <button
                    className="button button-ghost"
                    onClick={() => setEditing(item)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <form className="admin-panel admin-form" onSubmit={save}>
          <h3>{editing.id ? 'Edit event' : 'New event'}</h3>

          <Text
            label="Title"
            value={editing.title ?? ''}
            onChange={(v) => setEditing({ ...editing, title: v })}
          />

          <Text
            label="Description"
            multiline
            value={editing.description ?? ''}
            onChange={(v) =>
              setEditing({ ...editing, description: v })
            }
          />

          <div className="form-grid">
            <Text
              label="Date"
              value={editing.date ?? ''}
              onChange={(v) => setEditing({ ...editing, date: v })}
            />

            <Text
              label="Time"
              value={editing.time ?? ''}
              onChange={(v) => setEditing({ ...editing, time: v })}
            />

            <Text
              label="Location"
              value={editing.location ?? ''}
              onChange={(v) =>
                setEditing({ ...editing, location: v })
              }
            />

            <Text
              label="Cover image URL"
              value={editing.cover_image_url ?? ''}
              onChange={(v) =>
                setEditing({
                  ...editing,
                  cover_image_url: v,
                })
              }
            />
          </div>

          <Toggle
            label="Published"
            checked={Boolean(editing.published)}
            onChange={(v) =>
              setEditing({ ...editing, published: v })
            }
          />

          <Toggle
            label="Featured"
            checked={Boolean(editing.featured)}
            onChange={(v) =>
              setEditing({ ...editing, featured: v })
            }
          />

          <FormActions onCancel={() => setEditing(null)} />
        </form>
      )}
    </section>
  );
}

function MenuManager() {
  const categories = useRecords(getAdminMenuCategories);
  const items = useRecords(getAdminMenuItems);

  const [category, setCategory] =
    useState<MenuCategory | null>(null);
  const [menu, setMenu] =
    useState<Partial<MenuItem> | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category?.name) return;

    try {
      if (category.id) {
        await updateMenuCategory(category.id, {
          name: category.name,
        });
      } else {
        await createMenuCategory({
          name: category.name,
        });
      }

      setCategory(null);
      await categories.refresh();
      setStatus({
        type: 'success',
        text: 'Category saved.',
      });
    } catch {
      setStatus({
        type: 'error',
        text: 'Category could not be saved.',
      });
    }
  };

  const saveMenu = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!menu?.name || !menu.price) {
      return setStatus({
        type: 'error',
        text: 'Name and price are required.',
      });
    }

    try {
      const data = {
        ...emptyMenu,
        ...menu,
        price: Number(menu.price),
      };

      if (menu.id) {
        await updateMenuItem(menu.id, data);
      } else {
        await createMenuItem(data);
      }

      setMenu(null);
      await items.refresh();

      setStatus({
        type: 'success',
        text: 'Menu item saved.',
      });
    } catch {
      setStatus({
        type: 'error',
        text: 'Menu item could not be saved.',
      });
    }
  };

  return (
    <section>
      <div className="admin-title">
        <span className="eyebrow">Food & drinks</span>
        <h1>Menu content</h1>
      </div>

      <div className="admin-actions">
        <button
          className="button"
          onClick={() => setMenu(emptyMenu)}
        >
          <Plus size={14} /> New item
        </button>

        <button
          className="button button-secondary"
          onClick={() =>
            setCategory({ id: '', name: '' })
          }
        >
          New category
        </button>
      </div>

      <Message status={status} />

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Live</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {items.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                </td>

                <td>
                  {categories.items.find(
                    (c) => c.id === item.category_id
                  )?.name ?? 'Unassigned'}
                </td>

                <td>
                  {item.published && item.available
                    ? 'Published'
                    : 'Draft / unavailable'}
                </td>

                <td>
                  <button
                    className="button button-ghost"
                    onClick={() => setMenu(item)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {category && (
        <form
          className="admin-panel admin-form"
          onSubmit={saveCategory}
        >
          <h3>Category</h3>

          <Text
            label="Name"
            value={category.name}
            onChange={(v) =>
              setCategory({
                ...category,
                name: v,
              })
            }
          />

          <FormActions
            onCancel={() => setCategory(null)}
          />
        </form>
      )}

      {menu && (
        <form
          className="admin-panel admin-form"
          onSubmit={saveMenu}
        >
          <h3>
            {menu.id
              ? 'Edit menu item'
              : 'New menu item'}
          </h3>

          <div className="form-grid">
            <Text
              label="Name"
              value={menu.name ?? ''}
              onChange={(v) =>
                setMenu({
                  ...menu,
                  name: v,
                })
              }
            />

            <Text
              label="Price"
              value={String(menu.price ?? '')}
              onChange={(v) =>
                setMenu({
                  ...menu,
                  price: Number(v),
                })
              }
            />

            <label className="field">
              <span>Category</span>

              <select
                value={menu.category_id ?? ''}
                onChange={(e) =>
                  setMenu({
                    ...menu,
                    category_id: e.target.value,
                  })
                }
              >
                <option value="">Select category</option>

                {categories.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <Text
              label="Image URL"
              value={menu.image_url ?? ''}
              onChange={(v) =>
                setMenu({
                  ...menu,
                  image_url: v,
                })
              }
            />
          </div>

          <Text
            label="Description"
            multiline
            value={menu.description ?? ''}
            onChange={(v) =>
              setMenu({
                ...menu,
                description: v,
              })
            }
          />

          <Toggle
            label="Published"
            checked={Boolean(menu.published)}
            onChange={(v) =>
              setMenu({
                ...menu,
                published: v,
              })
            }
          />

          <Toggle
            label="Available"
            checked={Boolean(menu.available)}
            onChange={(v) =>
              setMenu({
                ...menu,
                available: v,
              })
            }
          />

          <Toggle
            label="Featured"
            checked={Boolean(menu.featured)}
            onChange={(v) =>
              setMenu({
                ...menu,
                featured: v,
              })
            }
          />

          <FormActions
            onCancel={() => setMenu(null)}
          />
        </form>
      )}
    </section>
  );
}

function GalleryManager() {
  const records = useRecords(getAdminGalleryItems);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('');
  const [published, setPublished] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const choose = (next: File | null) => {
    if (!next) return;

    if (
      !next.type.startsWith('image/') ||
      next.size > 8 * 1024 * 1024
    ) {
      return setStatus({
        type: 'error',
        text: 'Choose an image smaller than 8 MB.',
      });
    }

    setFile(next);
    setPreview(URL.createObjectURL(next));
    setStatus(null);
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      return setStatus({
        type: 'error',
        text: 'Choose an image first.',
      });
    }

    setBusy(true);

    let path = '';

    try {
      const ext =
        file.name
          .split('.')
          .pop()
          ?.replace(/[^a-z0-9]/gi, '') || 'jpg';

      path = `uploads/${crypto.randomUUID()}.${ext}`;

      const uploaded = await uploadGalleryImage(
        path,
        file
      );

      try {
        await createGalleryItem({
          image_url: uploaded.publicUrl,
          caption: caption || null,
          category: category || null,
          published,
        });
      } catch (error) {
        try {
          await removeGalleryImage(path);
        } catch {
          setStatus({
            type: 'error',
            text: 'Record failed and the uploaded file could not be cleaned up.',
          });
          return;
        }

        throw error;
      }

      setFile(null);
      setPreview('');
      setCaption('');
      setCategory('');
      setPublished(false);

      setStatus({
        type: 'success',
        text: 'Gallery image saved.',
      });

      await records.refresh();
    } catch {
      setStatus({
        type: 'error',
        text: 'Gallery upload could not be completed.',
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: GalleryItem) => {
    if (!window.confirm('Delete this gallery record?')) return;

    try {
      await deleteGalleryItem(item.id);

      const marker =
        '/storage/v1/object/public/gallery-images/';

      const index = item.image_url.indexOf(marker);

      if (index >= 0) {
        try {
          await removeGalleryImage(
            decodeURIComponent(
              item.image_url.slice(
                index + marker.length
              )
            )
          );
        } catch {
          setStatus({
            type: 'error',
            text: 'Record removed, but the Storage object could not be removed.',
          });
        }
      }

      await records.refresh();
    } catch {
      setStatus({
        type: 'error',
        text: 'Gallery record could not be deleted.',
      });
    }
  };

  return (
    <section>
      <div className="admin-title">
        <span className="eyebrow">Atmosphere</span>
        <h1>Gallery</h1>
      </div>

      <form
        className="admin-panel admin-form"
        onSubmit={upload}
      >
        <h3>Upload image</h3>

        <label className="field">
          <span>Image</span>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              choose(e.target.files?.[0] ?? null)
            }
          />
        </label>

        {preview ? (
          <img
            className="admin-image-preview"
            src={preview}
            alt="Selected gallery preview"
          />
        ) : null}

        <div className="form-grid">
          <Text
            label="Caption"
            value={caption}
            onChange={setCaption}
          />

          <Text
            label="Category"
            value={category}
            onChange={setCategory}
          />
        </div>

        <Toggle
          label="Publish immediately"
          checked={published}
          onChange={setPublished}
        />

        <button className="button" disabled={busy}>
          <Upload size={14} />
          {busy ? 'Uploading…' : 'Upload image'}
        </button>

        <Message status={status} />
      </form>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Caption</th>
              <th>Live</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {records.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <img
                    className="admin-thumb"
                    src={item.image_url}
                    alt=""
                  />
                </td>

                <td>{item.caption ?? '—'}</td>

                <td>
                  <button
                    className="button button-ghost"
                    onClick={() =>
                      void updateGalleryItem(
                        item.id,
                        {
                          published: !item.published,
                        }
                      )
                        .then(records.refresh)
                        .catch(() =>
                          setStatus({
                            type: 'error',
                            text: 'Publish state could not be updated.',
                          })
                        )
                    }
                  >
                    {item.published
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                </td>

                <td>
                  <button
                    className="button button-ghost"
                    onClick={() => void remove(item)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Text({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function FormActions({
  onCancel,
}: {
  onCancel: () => void;
}) {
  return (
    <div className="admin-actions">
      <button className="button" type="submit">
        <Check size={14} /> Save
      </button>

      <button
        className="button button-secondary"
        type="button"
        onClick={onCancel}
      >
        <X size={14} /> Cancel
      </button>
    </div>
  );
}