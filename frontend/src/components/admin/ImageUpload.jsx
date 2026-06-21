import { useRef, useState } from 'react';

const UploadIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </svg>
);

// Reusable image picker: click to browse OR drag & drop. Reads the file as a
// data-URL and reports it via onChange. Shows a preview once set.
export default function ImageUpload({ value, onChange, label = 'image' }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  function openPicker() { inputRef.current?.click(); }

  return (
    <div
      className={`img-upload${dragOver ? ' img-upload--over' : ''}${value ? ' img-upload--has' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Upload ${label}`}
      onClick={openPicker}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); } }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
    >
      {value ? (
        <>
          <img src={value} alt={label} className="img-upload__preview" />
          <div className="img-upload__overlay"><span>Change image</span></div>
        </>
      ) : (
        <div className="img-upload__placeholder">
          <UploadIcon />
          <p className="img-upload__title">Drag &amp; drop or <span>browse</span></p>
          <p className="img-upload__hint">PNG, JPG or WEBP</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
