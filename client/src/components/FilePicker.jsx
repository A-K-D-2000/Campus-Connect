import { useEffect, useMemo, useRef, useState } from "react";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB, same limit as the server
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ATTACHMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

function FilePicker({ files, onChange, allowPdf = false }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const allowed = allowPdf ? ATTACHMENT_TYPES : IMAGE_TYPES;
  const limit = allowPdf ? 5 : 4;

  // Temporary preview addresses for the chosen images
  const previews = useMemo(
    () =>
      files.map((f) =>
        f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      ),
    [files],
  );
  useEffect(
    () => () => previews.forEach((u) => u && URL.revokeObjectURL(u)),
    [previews],
  );

  const handlePick = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = ""; // lets the user pick the same file again later
    setError("");

    const next = [...files];
    for (const f of picked) {
      if (!allowed.includes(f.type)) {
        setError(
          `"${f.name}" is not allowed. ${
            allowPdf
              ? "Only images and PDF files"
              : "Only images (JPG, PNG, WEBP, GIF)"
          } are accepted.`,
        );
        continue;
      }
      if (f.size > MAX_SIZE) {
        setError(`"${f.name}" is larger than 5 MB.`);
        continue;
      }
      if (next.length >= limit) {
        setError(`You can attach at most ${limit} files.`);
        break;
      }
      next.push(f);
    }
    onChange(next);
  };

  const remove = (index) => {
    setError("");
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="file-picker">
      <button
        type="button"
        className="btn btn-outline btn-small"
        onClick={() => inputRef.current.click()}
        disabled={files.length >= limit}
      >
        {allowPdf ? "Attach images or PDFs" : "Attach images"}
      </button>
      <span className="muted"> up to {limit} files, 2 MB each</span>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={allowed.join(",")}
        onChange={handlePick}
        style={{ display: "none" }}
      />

      {error && <p className="msg msg-error">{error}</p>}

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="file-chip">
              {previews[i] ? (
                <img src={previews[i]} alt="" className="file-thumb" />
              ) : (
                <span className="file-icon">📄</span>
              )}
              <span className="file-name">{f.name}</span>
              <button
                type="button"
                className="file-remove"
                onClick={() => remove(i)}
                aria-label="Remove file"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FilePicker;
