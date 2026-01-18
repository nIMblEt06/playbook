'use client'

import type { DiscoverReview } from '@/lib/api/services/discover'

interface ReviewStoryTemplateProps {
  review: DiscoverReview
}

export function ReviewStoryTemplate({ review }: ReviewStoryTemplateProps) {
  const rating = review.rating || 0
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  // Format date
  const reviewDate = new Date(review.createdAt)
  const formattedDate = reviewDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  // Get initials for avatar fallback
  const initials = review.author.displayName?.charAt(0).toUpperCase() || 'U'

  // Truncate review content if too long
  const maxContentLength = 280
  const content = review.content
    ? review.content.length > maxContentLength
      ? `${review.content.slice(0, maxContentLength)}...`
      : review.content
    : null

  return (
    <div
      className="story-capture"
      style={{
        width: '1080px',
        height: '1920px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {/* Accent gradient blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-160px',
          right: '-160px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          opacity: 0.2,
          background: 'radial-gradient(circle, #86EFAC 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-240px',
          left: '-160px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          opacity: 0.15,
          background: 'radial-gradient(circle, #4ADE80 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px',
        }}
      >
        {/* Header - Trackd Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <svg viewBox="0 0 200 200" fill="none" style={{ width: '56px', height: '56px' }}>
              <circle cx="100" cy="100" r="95" fill="none" stroke="#86EFAC" strokeWidth="5" />
              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="#86EFAC"
                strokeWidth="2"
                strokeOpacity="0.3"
              />
              <path d="M100 5 L100 40" stroke="#86EFAC" strokeWidth="7" strokeLinecap="square" />
              <circle cx="100" cy="100" r="30" fill="none" stroke="#86EFAC" strokeWidth="5" />
              <circle cx="100" cy="100" r="10" fill="#86EFAC" />
            </svg>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '30px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                color: '#86EFAC',
              }}
            >
              TRACKD
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            REVIEW
          </span>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Album Cover - Large & Prominent */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.album?.coverImageUrl || '/placeholder-album.png'}
                alt={review.album?.title || 'Album'}
                crossOrigin="anonymous"
                style={{
                  width: '420px',
                  height: '420px',
                  objectFit: 'cover',
                  boxShadow:
                    '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              />
              {/* Rating badge overlay */}
              {rating > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-24px',
                    right: '-24px',
                    width: '112px',
                    height: '112px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)',
                    clipPath:
                      'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '40px',
                      fontWeight: 700,
                      color: '#000',
                    }}
                  >
                    {rating}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Album Info */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '48px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#fff',
                lineHeight: 1.1,
                marginBottom: '12px',
                letterSpacing: '-0.02em',
              }}
            >
              {review.album?.title || 'Unknown Album'}
            </h1>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {review.album?.artistName || 'Unknown Artist'}
            </p>
          </div>

          {/* Star Rating Visual */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '40px',
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                style={{ width: '48px', height: '48px' }}
                fill={star <= fullStars ? '#86EFAC' : 'rgba(134, 239, 172, 0.3)'}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>

          {/* Review Content Card */}
          {content && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '40px',
                marginBottom: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#86EFAC',
                  }}
                />
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  My Thoughts
                </p>
              </div>
              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '24px',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                &ldquo;{content}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer - User Info & CTA */}
        <div style={{ paddingTop: '32px' }}>
          {/* User */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)',
                padding: '3px',
              }}
            >
              {review.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={review.author.avatarUrl}
                  alt={review.author.displayName}
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a0a',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#86EFAC',
                    }}
                  >
                    {initials}
                  </span>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                @{review.author.username}
              </p>
              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                {formattedDate}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '18px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.1em',
              }}
            >
              Track your music journey
            </p>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '20px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#86EFAC',
              }}
            >
              trackd.app
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
