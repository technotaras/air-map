import { useEffect } from 'react';

export default function VideoModal({ entry, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрити">×</button>
        <div className="modal-header">
          <div className="modal-id">#{entry.id}</div>
          {entry.targetType && <div className="modal-tag">{entry.targetType}</div>}
          {!entry.hasCoords && <div className="modal-tag warn">координати приблизні</div>}
        </div>
        <video
          className="modal-video"
          src={entry.videoUrl}
          controls
          preload="metadata"
          playsInline
        />
        <pre className="modal-comment">{entry.comment || '(без коментаря)'}</pre>
      </div>
    </div>
  );
}
