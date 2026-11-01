import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import FormattedText from "../components/FormattedText";
import FilePicker from '../components/FilePicker';
import AttachmentList from '../components/AttachmentList';


const CATEGORIES = ["Academic", "Admin", "Events", "General"];
const OTHER = "__other__";
const emptyForm = {
  title: "",
  content: "",
  category: "General",
  customCategory: "",
};

function Announcements() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [files, setFiles] = useState([]);

  const isStaff = user && (user.role === "admin" || user.role === "authority");
  const canManage = (item) =>
    user && (user.role === "admin" || item.createdBy?._id === user.id);

  const loadItems = async () => {
    try {
      const res = await api.get("/api/announcements");
      setItems(res.data);
      setError("");
    } catch {
      setError("Could not load announcements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
    setFiles([]);
  };

  const openEdit = (item) => {
    const known = CATEGORIES.includes(item.category);
    setEditingId(item._id);
    setForm({
      title: item.title,
      content: item.content,
      category: known ? item.category : OTHER,
      customCategory: known ? "" : item.category,
    });
    setFormError("");
    setFiles([]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFiles([]);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const category =
      form.category === OTHER ? form.customCategory.trim() : form.category;
    if (!category) {
      setFormError("Please type a category name.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/announcements/${editingId}`, {
          title: form.title,
          content: form.content,
          category,
        });
      } else {
        const body = new FormData();
        body.append('title', form.title);
        body.append('content', form.content);
        body.append('category', category);
        files.forEach((f) => body.append('files', f));
        await api.post('/api/announcements', body);
      }
      closeForm();
      await loadItems();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/announcements/${id}`);
      setConfirmDeleteId(null);
      await loadItems();
    } catch (err) {
      setConfirmDeleteId(null);
      setError(
        err.response?.data?.message || "Could not delete the announcement.",
      );
    }
  };

  // Filter options come from whatever categories actually exist
  const categories = ["All", ...new Set(items.map((i) => i.category))];
  const activeFilter = categories.includes(filter) ? filter : "All";
  const shown =
    activeFilter === "All"
      ? items
      : items.filter((i) => i.category === activeFilter);

  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
        {isStaff && !showForm && (
          <button className="btn" onClick={openCreate}>
            New announcement
          </button>
        )}
      </div>

      {showForm && (
        <div className="panel">
          <h3>{editingId ? "Edit announcement" : "New announcement"}</h3>
          <form onSubmit={handleSubmit}>
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />

            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={OTHER}>Other (type your own)</option>
            </select>
            {form.category === OTHER && (
              <input
                name="customCategory"
                value={form.customCategory}
                onChange={handleChange}
                placeholder="Your category name"
              />
            )}

            <label>Content</label>
            <textarea
              name="content"
              rows={6}
              value={form.content}
              onChange={handleChange}
              required
            />
            <p className="muted">
              Tip: put deadlines between **double asterisks** to make them bold.
            </p>

            {editingId ? (
              <p className="muted">Attachments can only be added when an FAQ is first published.</p>
            ) : (
              <>
                <label>Attachments (optional)</label>
                <FilePicker allowPdf files={files} onChange={setFiles} />
              </>
            )}

            {formError && <p className="msg msg-error">{formError}</p>}

            <div className="row">
              <button className="btn" disabled={saving}>
                {saving ? (files.length ? 'Uploading...' : 'Saving...') : editingId ? 'Save changes' : 'Publish'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {categories.length > 2 && (
        <div className="row filter-row">
          <label htmlFor="cat-filter">Show:</label>
          <select
            id="cat-filter"
            value={activeFilter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="msg msg-error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && shown.length === 0 && (
        <p className="muted">No announcements yet.</p>
      )}

      {shown.map((item) => (
        <article className="item" key={item._id}>
          <span className="badge">{item.category}</span>
          <h3>{item.title}</h3>
          <FormattedText text={item.content} />
          <AttachmentList urls={item.attachments} />
          <p className="item-meta">
            Posted {new Date(item.createdAt).toLocaleDateString()}
            {item.createdBy?.username && ` · by ${item.createdBy.username}`}
          </p>

          {canManage(item) &&
            (confirmDeleteId === item._id ? (
              <div className="row">
                <span className="muted">Delete this announcement?</span>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDelete(item._id)}
                >
                  Yes, delete
                </button>
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="row">
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => setConfirmDeleteId(item._id)}
                >
                  Delete
                </button>
              </div>
            ))}
        </article>
      ))}
    </div>
  );
}

export default Announcements;
