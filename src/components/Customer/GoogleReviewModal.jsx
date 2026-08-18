import React, { useState, useContext, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { LanguageContext } from '../../context/LanguageContext';
import { SettingsContext } from '../../context/SettingsContext';
import { fetchAPI } from '../../utils/api';
import confetti from 'canvas-confetti';
import { Star, MapPin, Send, Utensils } from 'lucide-react';

export const GoogleReviewModal = ({ isOpen, onClose, onSkip, orderId, order, googleReviewUrl }) => {
  const { t } = useContext(LanguageContext);
  const { settings } = useContext(SettingsContext) || {};
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [itemRatings, setItemRatings] = useState({}); // { [item_name]: { rating: 5, comment: '' } }
  const [submitted, setSubmitted] = useState(false);
  const [gUrl, setGUrl] = useState(googleReviewUrl || settings?.google_maps_review_url || 'https://maps.google.com/?q=Aamantran+Bistro');

  useEffect(() => {
    if (settings?.google_maps_review_url) {
      setGUrl(googleReviewUrl || settings.google_maps_review_url);
    }
  }, [settings, googleReviewUrl]);

  const orderItems = order?.items || [];

  useEffect(() => {
    if (orderItems.length > 0) {
      const initial = {};
      orderItems.forEach(it => {
        initial[it.item_name] = { rating: 5, comment: '' };
      });
      setItemRatings(initial);
    }
  }, [order]);

  if (!isOpen) return null;

  const handleSetItemRating = (itemName, newRating) => {
    setItemRatings(prev => ({
      ...prev,
      [itemName]: { ...(prev[itemName] || { comment: '' }), rating: newRating }
    }));
  };

  const handleSetItemComment = (itemName, newComment) => {
    setItemRatings(prev => ({
      ...prev,
      [itemName]: { ...(prev[itemName] || { rating: 5 }), comment: newComment }
    }));
  };

  const handleSubmitRating = async () => {
    if (rating >= 4) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    const itemReviewsPayload = Object.keys(itemRatings).map(itemName => ({
      item_name: itemName,
      rating: itemRatings[itemName].rating || 5,
      comment: itemRatings[itemName].comment || ''
    }));

    try {
      const res = await fetchAPI('/orders/review', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId || order?.id,
          rating,
          comment,
          redirected_to_google: rating >= 4 ? 1 : 0,
          item_reviews: itemReviewsPayload
        })
      });
      if (res && res.google_maps_review_url) {
        setGUrl(res.google_maps_review_url);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Review submit error:', err);
    }
  };

  const handleOpenGoogle = () => {
    if (comment) {
      navigator.clipboard?.writeText(comment);
    }
    window.open(gUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onSkip || onClose} title={orderId ? `⭐ Review Your Order #${orderId}` : '⭐ Post-Order Dining & Item Review'}>
      {!submitted ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--brand-primary)' }}>
              How was your meal at Aamantran?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Please rate your overall experience and individual dishes below
            </p>

            {/* Interactive 5-Star Overall Picker */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', margin: '0.75rem 0' }}>
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
              placeholder="Write a review about food taste, service, or restaurant ambience..."
              className="input-field"
              rows={2}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {/* Dish Item-by-Item Review Section */}
          {orderItems.length > 0 && (
            <div style={{ marginBottom: '1.25rem', borderTop: '1px border-color var(--border-color)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Utensils size={15} />
                <span>Rate Individual Dishes Ordered:</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {orderItems.map((it, idx) => {
                  const itemState = itemRatings[it.item_name] || { rating: 5, comment: '' };
                  return (
                    <div key={idx} style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{it.item_name}</span>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleSetItemRating(it.item_name, s)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <Star
                                size={18}
                                fill={s <= itemState.rating ? '#f59e0b' : 'transparent'}
                                color={s <= itemState.rating ? '#f59e0b' : 'var(--text-muted)'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={itemState.comment}
                        onChange={(e) => handleSetItemComment(it.item_name, e.target.value)}
                        placeholder={`Specific dish feedback for ${it.item_name}...`}
                        className="input-field"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={handleSubmitRating} className="btn btn-primary btn-lg" style={{ width: '100%', gap: '0.5rem', fontWeight: 800 }}>
            <Send size={18} />
            <span>Submit Restaurant & Dish Rating</span>
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}
            >
              Skip for now
            </button>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
            Thank You for your Review! 🎉
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Your feedback and item ratings have been collected for our restaurant kitchen team.
          </p>

          {/* Google Maps Review Card */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-surface-elevated)', marginBottom: '1rem', border: '1px solid var(--brand-primary)' }}>
            <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--brand-primary)' }}>
              🌟 Share your experience on Google Maps!
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Would you mind posting your review directly onto our official Google Maps profile?
            </p>

            <button
              onClick={handleOpenGoogle}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', gap: '0.5rem', background: '#4285F4', fontWeight: 800 }}
            >
              <MapPin size={20} />
              <span>🌐 Post Review on Google Maps</span>
            </button>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Close
          </button>
        </div>
      )}
    </Modal>
  );
};
