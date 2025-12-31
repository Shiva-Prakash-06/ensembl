import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MusicianAnalytics.css';

export default function MusicianAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role !== 'musician') {
      navigate('/');
      return;
    }

    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/musician', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  const isPro = analytics?.is_pro;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Your Analytics</h1>
        {!isPro && (
          <div className="pro-badge-header">
            <span className="free-badge">Free</span>
          </div>
        )}
        {isPro && (
          <div className="pro-badge-header">
            <span className="pro-badge">✨ Pro</span>
          </div>
        )}
      </div>

      {/* Free User: Preview + Teaser */}
      {!isPro && (
        <>
          <div className="preview-section">
            <h2>Preview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{analytics.preview.total_gigs}</div>
                <div className="stat-label">Total Gigs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.preview.completed_gigs}</div>
                <div className="stat-label">Completed Gigs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.preview.acceptance_rate}%</div>
                <div className="stat-label">Acceptance Rate</div>
              </div>
            </div>
          </div>

          <div className="pro-teaser">
            <div className="pro-teaser-header">
              <span className="lock-icon">🔒</span>
              <h2>{analytics.pro_teaser.message}</h2>
            </div>
            <ul className="pro-features">
              {analytics.pro_teaser.features.map((feature, idx) => (
                <li key={idx}>
                  <span className="check-icon">✓</span> {feature}
                </li>
              ))}
            </ul>
            <p className="pro-note">
              Contact admin to enable Pro for your account
            </p>
          </div>
        </>
      )}

      {/* Pro User: Full Analytics */}
      {isPro && (
        <>
          {/* Overview Stats */}
          <div className="overview-section">
            <h2>Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{analytics.overview.total_gigs}</div>
                <div className="stat-label">Total Gigs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.overview.completed_gigs}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.overview.total_applications}</div>
                <div className="stat-label">Applications</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.overview.acceptance_rate}%</div>
                <div className="stat-label">Acceptance Rate</div>
              </div>
            </div>
          </div>

          {/* Genre Breakdown */}
          <div className="chart-section">
            <h2>Genre Breakdown</h2>
            <div className="genre-chart">
              {analytics.genres.length === 0 ? (
                <p className="empty-state">No genre data yet. Play more gigs!</p>
              ) : (
                <div className="genre-bars">
                  {analytics.genres.map((genre, idx) => {
                    const maxCount = Math.max(...analytics.genres.map(g => g.count));
                    const percentage = (genre.count / maxCount) * 100;
                    return (
                      <div key={idx} className="genre-bar-item">
                        <span className="genre-name">{genre.name}</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="genre-count">{genre.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="chart-section">
            <h2>Gigs Over Time</h2>
            <div className="timeline-chart">
              {analytics.timeline.length === 0 ? (
                <p className="empty-state">No timeline data yet</p>
              ) : (
                <div className="timeline-bars">
                  {analytics.timeline.map((item, idx) => {
                    const maxGigs = Math.max(...analytics.timeline.map(t => t.gigs));
                    const percentage = (item.gigs / maxGigs) * 100;
                    return (
                      <div key={idx} className="timeline-bar-item">
                        <span className="timeline-month">{item.month}</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill timeline-fill" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="timeline-count">{item.gigs}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Collaborators */}
          <div className="info-section">
            <h2>Collaborators</h2>
            <p className="collaborator-count">
              You've played with <strong>{analytics.collaborators.count}</strong> musicians
            </p>
            {analytics.collaborators.names.length > 0 && (
              <div className="collaborator-tags">
                {analytics.collaborators.names.map((name, idx) => (
                  <span key={idx} className="collaborator-tag">{name}</span>
                ))}
              </div>
            )}
          </div>

          {/* Top Venues */}
          <div className="info-section">
            <h2>Top Venues</h2>
            {analytics.top_venues.length === 0 ? (
              <p className="empty-state">No venue data yet</p>
            ) : (
              <div className="top-venues-list">
                {analytics.top_venues.map((venue, idx) => (
                  <div key={idx} className="venue-item">
                    <span className="venue-rank">#{idx + 1}</span>
                    <span className="venue-name">{venue.name}</span>
                    <span className="venue-gigs">{venue.gigs} gigs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
