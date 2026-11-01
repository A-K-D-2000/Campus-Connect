const isPdf = (url) => /\.pdf($|\?)/i.test(url);

function AttachmentList({ urls = [] }) {
  if (!urls || urls.length === 0) return null;

  const images = urls.filter((u) => !isPdf(u));
  const pdfs = urls.filter(isPdf);

  return (
    <div className="attachments">
      {images.length > 0 && (
        <div className="attach-images">
          {images.map((u) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer">
              <img src={u} alt="Attachment" loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {pdfs.map((u, i) => (
        <a key={u} className="attach-pdf" href={u} target="_blank" rel="noopener noreferrer">
          📄 PDF attachment{pdfs.length > 1 ? ` ${i + 1}` : ''}
        </a>
      ))}
    </div>
  );
}

export default AttachmentList;