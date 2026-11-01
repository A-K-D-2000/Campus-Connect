import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import FormattedText from "../components/FormattedText";
import FilePicker from '../components/FilePicker';
import AttachmentList from '../components/AttachmentList';

const emptyForm = { title: "", description: "" };

function FAQs() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState([]);

  const isStaff = user && (user.role === "admin" || user.role === "authority");
  // Admin can manage everything; Authority only their own items
  const canManage = (faq) =>
    user && (user.role === "admin" || faq.createdBy?._id === user.id);

  const loadFaqs = async () => {
    try {
      const res = await api.get('/api/faqs', {
      params: query.trim() ? { q: query.trim() } : {},
      });
      setFaqs(res.data);
      setError("");
    } catch {
      setError("Could not load FAQs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Wait 300 ms after the last keystroke before searching
  useEffect(() => {
    const timer = setTimeout(loadFaqs, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
    setFiles([]);
  };

  const openEdit = (faq) => {
    setEditingId(faq._id);
    setForm({ title: faq.title, description: faq.description });
    setFormError("");
    setShowForm(true);
    setFiles([]);
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
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/faqs/${editingId}`, form);
      } else {
        const body = new FormData();
        body.append('title', form.title);
        body.append('description', form.description);
        files.forEach((f) => body.append('files', f));
        await api.post('/api/faqs', body);
      }
      closeForm();
      await loadFaqs();
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
      await api.delete(`/api/faqs/${id}`);
      setConfirmDeleteId(null);
      await loadFaqs();
    } catch (err) {
      setConfirmDeleteId(null);
      setError(err.response?.data?.message || "Could not delete the FAQ.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>FAQ Navigator</h1>
        {isStaff && !showForm && (
          <button className="btn" onClick={openCreate}>
            New FAQ
          </button>
        )}
      </div>
      <p className="muted">
        Who to contact, in what order, and what to expect, for common college
        processes.
      </p>

      <input
        className="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search FAQs, for example: bus fee refund"
      />

      {showForm && (
        <div className="panel">
          <h3>{editingId ? "Edit FAQ" : "New FAQ"}</h3>
          <form onSubmit={handleSubmit}>
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              rows={8}
              value={form.description}
              onChange={handleChange}
              placeholder="Write the whole process here: who to contact first, what comes next, online or in person, which block, how long it usually takes."
              required
            />
            <p className="muted">
              Tip: put text between **double asterisks** to make it bold.
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
                {saving ? (files.length ? 'Uploading...' : 'Saving...') : editingId ? 'Save changes' : 'Publish FAQ'}
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

      {error && <p className="msg msg-error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && faqs.length === 0 && (
        <p className="muted">{query.trim() ? 'No FAQs match your search.' : 'No FAQs yet.'}</p>
      )}

      {faqs.map((faq) => (
        <article className="item" key={faq._id}>
          <h3>{faq.title}</h3>
          <FormattedText text={faq.description} />
          <AttachmentList urls={faq.attachments} />
          <p className="item-meta">
            Last updated {new Date(faq.updatedAt).toLocaleDateString()}
            {faq.createdBy?.username && ` · by ${faq.createdBy.username}`}
          </p>

          {canManage(faq) &&
            (confirmDeleteId === faq._id ? (
              <div className="row">
                <span className="muted">Delete this FAQ?</span>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDelete(faq._id)}
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
                  onClick={() => openEdit(faq)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => setConfirmDeleteId(faq._id)}
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

export default FAQs;
