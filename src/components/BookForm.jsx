import { useState } from 'react';
import apiClient from '../api/client';
import { compressImage } from '../utils/imageCompression';

export default function BookForm({ initialBook, onSubmit, submitting }) {
  const [title, setTitle] = useState(initialBook?.title ?? '');
  const [authorName, setAuthorName] = useState(initialBook?.author_name ?? '');
  const [coverUrl, setCoverUrl] = useState(initialBook?.cover_url ?? '');
  const [description, setDescription] = useState(initialBook?.description ?? '');
  const [fileUrl, setFileUrl] = useState(initialBook?.file_url ?? '');
  const [fileName, setFileName] = useState(initialBook?.file_name ?? '');

  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  async function uploadFile(file, type, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    // Not setting Content-Type manually - axios sets the correct
    // multipart boundary automatically when given a FormData object.
    const res = await apiClient.post('/uploads', formData, {
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) onProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    });
    return res.data;
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploadingCover(true);
    setCoverProgress(0);
    try {
      // Cover art is only ever shown as a small thumbnail - shrink an
      // oversized photo before upload, same as avatar/portfolio covers.
      const toUpload = await compressImage(file);
      const { url } = await uploadFile(toUpload, 'image', setCoverProgress);
      setCoverUrl(url);
    } catch {
      setUploadError('Cover upload failed - try a JPG, PNG, WebP, or JFIF under 10MB.');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleBookFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploadingFile(true);
    setFileProgress(0);
    try {
      // The book file itself (PDF/EPUB) is NOT compressed - unlike the
      // cover image, this is the actual content someone will read, so it
      // has to go up byte-for-byte. On a slow connection a large book can
      // legitimately take several minutes; the progress percentage below
      // is what keeps that from looking like a stuck/broken upload.
      const { url, original_name } = await uploadFile(file, 'document', setFileProgress);
      setFileUrl(url);
      setFileName(original_name);
    } catch {
      setUploadError('File upload failed - try a PDF or EPUB under 50MB.');
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
      {uploadingCover && <p className="post-meta">Uploading cover… {coverProgress}%</p>}
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
      {uploadingFile && <p className="post-meta">Uploading file… {fileProgress}%</p>}
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
