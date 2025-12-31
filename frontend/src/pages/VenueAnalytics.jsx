import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './VenueAnalytics.css';

export default function VenueAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role !== 'venue') {
      navigate('/');
      return;
    }

    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/venue', {
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
        <h1>Venue Analytics</h1>
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
                <div className="stat-label">Total Gigs Posted</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.preview.completed_gigs}</div>
                <div className="stat-label">Completed Gigs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.preview.verified_gigs}</div>
                <div className="stat-label">Verified Gigs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.preview.completion_rate}%</div>
                <div className="stat-label">Completion Rate</div>
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
                <div className="stat-value">{analytics.overview.verified_gigs}</div>
                <div className="stat-label">Verified</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.overview.completion_rate}%</div>
                <div className="stat-label">Completion Rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.overview.avg_applications_per_gig}</div>
                <div className="stat-label">Avg Applications</div>
              </div>
            </div>
          </div>

          {/* Genre Breakdown */}
          <div className="chart-section">
            <h2>Genre Breakdown</h2>
            <div className="genre-chart">
              {analytics.genres.length === 0 ? (
                <p className="empty-state">No genre data yet. Post more gigs!</p>
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

          {/* Top Ensembles */}
          <div className="info-section">
            <h2>Top Ensembles</h2>
            {analytics.top_ensembles.length === 0 ? (
              <p className="empty-state">No ensemble data yet</p>
            ) : (
              <div className="top-ensembles-list">
                {analytics.top_ensembles.map((ensemble, idx) => (
                  <div key={idx} className="ensemble-item">
                    <span className="ensemble-rank">#{idx + 1}</span>
                    <span className="ensemble-name">{ensemble.name}</span>
                    <span className="ensemble-gigs">{ensemble.gigs} gigs</span>
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
