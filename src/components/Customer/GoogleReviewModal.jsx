import React, { useState, useContext } from 'react';
import { Modal } from '../Common/Modal';
import { LanguageContext } from '../../context/LanguageContext';
import { fetchAPI } from '../../utils/api';
import confetti from 'canvas-confetti';
import { Star, MapPin, Send } from 'lucide-react';

export const GoogleReviewModal = ({ isOpen, onClose, orderId, googleReviewUrl }) => {
  const { t } = useContext(LanguageContext);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitRating = async () => {
    if (rating >= 4) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    try {
      await fetchAPI('/orders/review', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          rating,
          comment,
          redirected_to_google: rating >= 4 ? 1 : 0
        })
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Review submit error:', err);
    }
  };

  const handleOpenGoogle = () => {
    // Copy review text to clipboard for easy pasting into Google Maps
    if (comment) {
      navigator.clipboard?.writeText(comment);
    }
    window.open(googleReviewUrl || 'https://maps.google.com/?q=Aamantran+Bistro', '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('leaveReview')}>
      {!submitted ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            How was your dining experience with us today?
          </p>

          {/* Interactive 5-Star Picker */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s ease' }}
              >
                <Star
                  size={36}
                  fill={star <= rating ? '#f59e0b' : 'transparent'}
                  color={star <= rating ? '#f59e0b' : 'var(--text-muted)'}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a brief comment about food taste, service, or ambience..."
            className="input-field"
            rows={3}
            style={{ marginBottom: '1.25rem' }}
          />

          <button onClick={handleSubmitRating} className="btn btn-primary btn-lg" style={{ width: '100%', gap: '0.5rem' }}>
            <Send size={18} />
            <span>Submit Rating</span>
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
            Thank You for your feedback! 🎉
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your rating helps us improve our service every day.
          </p>

          {/* Compliant Google Maps Redirect Flow (C12) */}
          {rating >= 4 && (
            <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-surface-elevated)', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                🌟 Help others discover Aamantran!
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Would you mind sharing your 5-star review on our Google Maps profile?
              </p>

              <button
                onClick={handleOpenGoogle}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', gap: '0.5rem', background: '#4285F4' }}
              >
                <MapPin size={20} />
                <span>{t('reviewOnGoogle')}</span>
              </button>
            </div>
          )}

          <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Close
          </button>
        </div>
      )}
    </Modal>
  );
};
