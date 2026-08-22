import { useState } from 'react';
import apiClient from '../api/client';

export default function BookForm({ initialBook, onSubmit, submitting }) {
  const [title, setTitle] = useState(initialBook?.title ?? '');
  const [authorName, setAuthorName] = useState(initialBook?.author_name ?? '');
  const [coverUrl, setCoverUrl] = useState(initialBook?.cover_url ?? '');
  const [description, setDescription] = useState(initialBook?.description ?? '');
  const [fileUrl, setFileUrl] = useState(initialBook?.file_url ?? '');
  const [fileName, setFileName] = useState(initialBook?.file_name ?? '');

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function uploadFile(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    // Not setting Content-Type manually - axios sets the correct
    // multipart boundary automatically when given a FormData object.
    const res = await apiClient.post('/uploads', formData);
    return res.data;
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploadingCover(true);
    try {
      const { url } = await uploadFile(file, 'image');
      setCoverUrl(url);
    } catch {
      setUploadError('Cover upload failed - try a JPG, PNG, or WebP under 5MB.');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleBookFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploadingFile(true);
    try {
      const { url, original_name } = await uploadFile(file, 'document');
      setFileUrl(url);
      setFileName(original_name);
    } catch {
      setUploadError('File upload failed - try a PDF or EPUB under 20MB.');
    } finally {
      setUploadingFile(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      title,
      author_name: authorName,
      cover_url: coverUrl || null,
      description: description || null,
      file_url: fileUrl || null,
      file_name: fileName || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <label htmlFor="title">Book title</label>
      <input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <label htmlFor="author_name">Author name</label>
      <input
        id="author_name"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Your name, or the book's actual author"
        required
      />

      <label htmlFor="cover_file">Cover image</label>
      <input id="cover_file" type="file" accept="image/*" onChange={handleCoverChange} />
      {uploadingCover && <p className="post-meta">Uploading cover…</p>}
      {coverUrl && (
        <img src={coverUrl} alt="Cover preview" style={{ width: 100, marginTop: '0.5rem', borderRadius: 4 }} />
      )}
      <label htmlFor="cover_url">Or paste a cover image URL instead</label>
      <input
        id="cover_url"
        value={coverUrl}
        onChange={(e) => setCoverUrl(e.target.value)}
        placeholder="https://..."
      />

      <label htmlFor="book_file">Book file (PDF or EPUB, optional)</label>
      <input id="book_file" type="file" accept=".pdf,.epub" onChange={handleBookFileChange} />
      {uploadingFile && <p className="post-meta">Uploading file…</p>}
      {fileName && <p className="post-meta">Attached: {fileName}</p>}

      {uploadError && <p className="form-error">{uploadError}</p>}

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={6}
      />

      <p className="post-meta">
        A purchase/affiliate link isn't collected here yet - that's coming in
        a later phase.
      </p>

      <button type="submit" disabled={submitting || uploadingCover || uploadingFile}>
        {submitting ? 'Saving…' : 'Save book'}
      </button>
    </form>
  );
}
