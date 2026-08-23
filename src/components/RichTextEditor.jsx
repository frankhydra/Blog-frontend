import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import apiClient from '../api/client';

// Rich text editor for post/letter bodies, built on Quill.
//
// Switched from Tiptap to Quill specifically to support click-to-select
// media (image/video) with a floating resize + alignment toolbar. That
// interaction mutates the selected element's style/class directly, then
// re-reads the editor's full HTML - a natural fit for Quill (which treats
// images/iframes as opaque embeds it doesn't repaint on unrelated edits),
// but not for Tiptap (whose ProseMirror-based document model actively
// fights direct DOM writes like this).
//
// props:
//   content   - initial HTML string (empty string for a new post/letter)
//   onChange  - called with the updated HTML string on every edit
export default function RichTextEditor({ content, onChange }) {
  const containerRef = useRef(null);
  const editorWrapRef = useRef(null);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingImageIndexRef = useRef(0);
  const audioCtxRef = useRef(null);

  const [canvasTheme, setCanvasTheme] = useState('paper'); // paper | ink | sepia
  const [isZen, setIsZen] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [html, setHtml] = useState(content || '');
  const [wordGoal, setWordGoal] = useState(300);

  // Init Quill once. Deliberately not re-running on `content` changes -
  // this is an uncontrolled editor (like the Tiptap version was), so the
  // parent form only reads via onChange rather than pushing content back in.
  //
  // Quill instance creation is guarded by quillRef so React 18/19
  // StrictMode's dev-only double-invoke (mount -> cleanup -> mount again)
  // doesn't create two Quill instances on the same DOM node. But listener
  // registration happens OUTSIDE that guard, on every invoke - it has to,
  // because StrictMode's cleanup between the two mounts removes the click
  // listener, and if re-attaching it were also gated behind "only if no
  // Quill instance yet", the second mount would skip re-adding it entirely,
  // leaving the editor permanently without a working click listener even
  // though the Quill instance itself looks fine. That was the actual bug
  // behind media clicks silently doing nothing.
  useEffect(() => {
    if (!containerRef.current) return;

    if (!quillRef.current) {
      const quill = new Quill(containerRef.current, {
        theme: 'snow',
        placeholder: 'Write your post or letter here…',
        modules: {
          toolbar: {
            container: [
              [{ header: [2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote', 'code-block'],
              ['link', 'image', 'video'],
              ['clean'],
            ],
            handlers: {
              image() {
                const range = this.quill.getSelection(true);
                pendingImageIndexRef.current = range ? range.index : 0;
                fileInputRef.current?.click();
              },
              video() {
                const range = this.quill.getSelection(true);
                const index = range ? range.index : 0;
                const url = window.prompt('YouTube video URL:');
                if (!url) return;
                const embedUrl = toYoutubeEmbedUrl(url);
                if (!embedUrl) {
                  alert("That doesn't look like a YouTube link.");
                  return;
                }
                this.quill.insertEmbed(index, 'video', embedUrl, 'user');
                this.quill.setSelection(index + 1);
              },
            },
          },
        },
      });

      quillRef.current = quill;

      // Load existing content (editing a post/letter) by writing straight
      // into the DOM rather than through Quill's HTML->Delta parser. The
      // parser only understands the attributes it was built for, so it
      // would silently drop the width/style and media-align-*/media-float-*
      // classes our own floating toolbar wrote on a previous save.
      // quill.update() then tells Quill to resync its internal model to
      // match what's now in the DOM, so normal editing still works.
      if (content) {
        quill.root.innerHTML = content;
        quill.update(Quill.sources.SILENT);
      }
    }

    const quill = quillRef.current;
    const root = quill.root;

    function handleTextChange() {
      const nextHtml = quill.root.innerHTML;
      setHtml(nextHtml);
      onChange(nextHtml);
    }
    quill.on('text-change', handleTextChange);

    // Click-to-select media + floating resize/align toolbar. Images are
    // plain DOM nodes and receive clicks normally. Video embeds are
    // cross-origin <iframe>s though - once a YouTube player has loaded
    // inside one, clicks landing on the player go to YouTube's own page,
    // not this document, so a plain click listener on quill.root never
    // sees them. Each iframe gets a thin transparent overlay sibling to
    // catch clicks for selection purposes; it only intercepts the click,
    // everything else about the iframe is untouched.
    function ensureVideoOverlays() {
      root.querySelectorAll('iframe').forEach((iframe) => {
        if (iframe.nextElementSibling?.classList?.contains('media-click-catcher')) return;
        const overlay = document.createElement('div');
        overlay.className = 'media-click-catcher';
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        iframe.style.position = iframe.style.position || 'relative';
        iframe.insertAdjacentElement('afterend', overlay);
        const wrapper = document.createElement('span');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'block';
        iframe.parentNode.insertBefore(wrapper, iframe);
        wrapper.appendChild(iframe);
        wrapper.appendChild(overlay);
      });
    }
    ensureVideoOverlays();
    quill.on('text-change', ensureVideoOverlays);

    function selectMedia(target) {
      root.querySelectorAll('.media-selected').forEach((el) => el.classList.remove('media-selected'));
      target.classList.add('media-selected');

      // Position against .rich-editor (editorWrapRef), the actual
      // `position: relative` ancestor the floating toolbar is placed in -
      // NOT containerRef, which after Quill initializes points at the
      // inner .ql-container and sits lower (below Quill's own toolbar),
      // throwing the math off by that toolbar's height.
      const rect = target.getBoundingClientRect();
      const parentRect = editorWrapRef.current.getBoundingClientRect();

      setSelectedMedia(target);
      setToolbarPos({
        top: rect.top - parentRect.top - 48,
        left: Math.max(10, rect.left - parentRect.left + rect.width / 2 - 160),
      });
    }

    function handleMediaClick(e) {
      const target = e.target.closest('img, iframe, .media-click-catcher');
      if (target?.classList?.contains('media-click-catcher')) {
        selectMedia(target.previousElementSibling);
        return;
      }
      if (target && (target.tagName === 'IMG' || target.tagName === 'IFRAME')) {
        selectMedia(target);
        return;
      }
      root.querySelectorAll('.media-selected').forEach((el) => el.classList.remove('media-selected'));
      setSelectedMedia(null);
    }
    root.addEventListener('click', handleMediaClick);

    return () => {
      quill.off('text-change', handleTextChange);
      quill.off('text-change', ensureVideoOverlays);
      root.removeEventListener('click', handleMediaClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileChosen(e) {
    const file = e.target.files[0];
    e.target.value = ''; // allow choosing the same file twice in a row
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    try {
      const res = await apiClient.post('/uploads', formData);
      const quill = quillRef.current;
      const index = pendingImageIndexRef.current;
      quill.insertEmbed(index, 'image', res.data.url, 'user');
      quill.setSelection(index + 1);
    } catch {
      alert('Image upload failed - try a JPG, PNG, or WebP under 5MB.');
    }
  }

  function getPlainText() {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.innerText || tempDiv.textContent || '';
  }

  const plainText = getPlainText();
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const goalPct = Math.min(100, Math.round((wordCount / wordGoal) * 100));

  function toggleAmbientAudio() {
    if (isAudioOn) {
      audioCtxRef.current?.close();
      setIsAudioOn(false);
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.15;

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseNode.start();
      setIsAudioOn(true);
    } catch (err) {
      console.error('Audio synthesis error:', err);
    }
  }

  function toggleSpeechProofread() {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = getPlainText();
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  function insertCallout(type) {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection(true) || { index: quill.getLength() };
    let markup = '';

    if (type === 'tip') {
      markup = `<div class="callout-box callout-tip"><span>💡</span><div><strong>Tip:</strong> Add your helpful insight or best practice here.</div></div><p><br></p>`;
    } else if (type === 'warning') {
      markup = `<div class="callout-box callout-warning"><span>⚠️</span><div><strong>Important:</strong> Highlight a crucial warning or requirement here.</div></div><p><br></p>`;
    } else if (type === 'stat') {
      markup = `<div class="callout-box callout-stat"><div><span class="callout-stat-figure">99.9%</span><br /><span>Key metric goes here</span></div></div><p><br></p>`;
    }

    quill.clipboard.dangerouslyPasteHTML(range.index, markup, 'user');
  }

  function applyMediaSize(widthPercent) {
    if (!selectedMedia) return;
    selectedMedia.style.width = widthPercent;
    setHtml(quillRef.current.root.innerHTML);
    onChange(quillRef.current.root.innerHTML);
  }

  function applyMediaAlignment(alignClass) {
    if (!selectedMedia) return;
    selectedMedia.className = `media-selected ${alignClass}`;
    setHtml(quillRef.current.root.innerHTML);
    onChange(quillRef.current.root.innerHTML);
  }

  function deleteSelectedMedia() {
    if (!selectedMedia) return;
    selectedMedia.remove();
    setSelectedMedia(null);
    setHtml(quillRef.current.root.innerHTML);
    onChange(quillRef.current.root.innerHTML);
  }

  return (
    <div className={`rich-editor-studio ${isZen ? 'zen-active' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        hidden
      />

      <div className="studio-toolbar">
        <button
          type="button"
          onClick={toggleAmbientAudio}
          className={`studio-pill ${isAudioOn ? 'studio-pill-active audio-active' : ''}`}
        >
          {isAudioOn ? '🌧️ Rain audio on' : '🎧 Focus audio'}
        </button>
        <button
          type="button"
          onClick={toggleSpeechProofread}
          className={`studio-pill ${isSpeaking ? 'studio-pill-active' : ''}`}
        >
          {isSpeaking ? '🔊 Speaking…' : '🗣️ Listen to draft'}
        </button>

        <span className="studio-toolbar-divider" />

        <span className="studio-toolbar-label">Canvas</span>
        <div className="canvas-swatch-group">
          <button type="button" onClick={() => setCanvasTheme('paper')} className={`canvas-swatch canvas-swatch-paper ${canvasTheme === 'paper' ? 'canvas-swatch-active' : ''}`} title="Paper (default)" aria-label="Paper canvas" />
          <button type="button" onClick={() => setCanvasTheme('ink')} className={`canvas-swatch canvas-swatch-ink ${canvasTheme === 'ink' ? 'canvas-swatch-active' : ''}`} title="Ink (dark)" aria-label="Ink canvas" />
          <button type="button" onClick={() => setCanvasTheme('sepia')} className={`canvas-swatch canvas-swatch-sepia ${canvasTheme === 'sepia' ? 'canvas-swatch-active' : ''}`} title="Sepia" aria-label="Sepia canvas" />
        </div>

        <span className="studio-toolbar-divider" />

        <button type="button" onClick={() => setIsZen(!isZen)} className="studio-pill">
          {isZen ? '🚪 Exit zen' : '🧘 Zen focus'}
        </button>
      </div>

      <div className="callout-quickbar">
        <span className="callout-quickbar-label">Insert block:</span>
        <button type="button" onClick={() => insertCallout('tip')} className="callout-chip callout-chip-tip">💡 Tip</button>
        <button type="button" onClick={() => insertCallout('warning')} className="callout-chip callout-chip-warning">⚠️ Alert</button>
        <button type="button" onClick={() => insertCallout('stat')} className="callout-chip callout-chip-stat">📊 Stat</button>
      </div>

      <div className="rich-editor" ref={editorWrapRef}>
        {selectedMedia && (
          <div
            style={{ top: `${toolbarPos.top}px`, left: `${toolbarPos.left}px` }}
            className="media-float-toolbar"
          >
            <span className="media-float-label">Size</span>
            <button type="button" onClick={() => applyMediaSize('25%')}>25%</button>
            <button type="button" onClick={() => applyMediaSize('50%')}>50%</button>
            <button type="button" onClick={() => applyMediaSize('75%')}>75%</button>
            <button type="button" onClick={() => applyMediaSize('100%')}>100%</button>
            <span className="media-float-divider" />
            <span className="media-float-label">Align</span>
            <button type="button" onClick={() => applyMediaAlignment('media-align-center')}>Center</button>
            <button type="button" onClick={() => applyMediaAlignment('media-float-left')}>Float left</button>
            <button type="button" onClick={() => applyMediaAlignment('media-float-right')}>Float right</button>
            <span className="media-float-divider" />
            <button type="button" onClick={deleteSelectedMedia} className="media-float-delete">🗑️</button>
          </div>
        )}

        <div className={`editor-content canvas-${canvasTheme}`}>
          <div ref={containerRef}></div>
        </div>
      </div>

      <div className="studio-stats">
        <div className="studio-stats-row">
          <span>Words: <strong>{wordCount}</strong></span>
          <span>Characters: <strong>{charCount}</strong></span>
          <span>Read time: <strong>{readingTime} min</strong></span>
          <span className="studio-stats-goal">
            Goal:{' '}
            <input
              type="number"
              min="50"
              step="50"
              value={wordGoal}
              onChange={(e) => setWordGoal(Math.max(50, Number(e.target.value) || 50))}
            />{' '}
            words
          </span>
        </div>
        <div className="studio-progress">
          <div className="studio-progress-bar" style={{ width: `${goalPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// Accepts a standard watch/share/short YouTube URL and returns an embeddable
// URL, or null if the input doesn't look like YouTube. Quill's video format
// inserts whatever URL it's given directly into an <iframe src>, so this has
// to happen before insertEmbed - Quill won't rewrite the link itself.
function toYoutubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    let videoId = null;

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1];
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1];
      }
    }

    if (!videoId) return null;
    videoId = videoId.split('?')[0].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}
