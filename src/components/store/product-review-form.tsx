"use client";

import { useState, type FormEvent } from "react";

/** Buyer-only review form — loaded after the main product buy path is ready. */
export function ProductReviewForm() {
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  function showBuyerOnlyMessage() {
    setMessage(
      "Only buyers can leave a review. Purchase this product to share your experience.",
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    showBuyerOnlyMessage();
  }

  return (
    <form className="store-review-form" onSubmit={handleSubmit}>
      <h3>Write a review</h3>
      <p className="store-review-form-note">
        Share your experience with this product.
      </p>

      <label className="store-review-field">
        <span>Rating</span>
        <select
          value={rating}
          onChange={(event) => {
            setRating(Number(event.target.value));
            showBuyerOnlyMessage();
          }}
          onFocus={showBuyerOnlyMessage}
          aria-label="Review rating"
        >
          <option value={5}>5 stars</option>
          <option value={4}>4 stars</option>
          <option value={3}>3 stars</option>
          <option value={2}>2 stars</option>
          <option value={1}>1 star</option>
        </select>
      </label>

      <label className="store-review-field">
        <span>Your review</span>
        <textarea
          value={quote}
          onChange={(event) => {
            setQuote(event.target.value);
            showBuyerOnlyMessage();
          }}
          onFocus={showBuyerOnlyMessage}
          placeholder="Write your review..."
          rows={4}
        />
      </label>

      <button type="submit" className="store-btn-primary store-review-submit">
        Submit review
      </button>

      {message ? (
        <p className="store-review-buyer-only" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
