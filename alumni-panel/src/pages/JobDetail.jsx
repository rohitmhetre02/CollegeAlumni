// src/pages/JobDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * JobDetail.jsx
 * Full job-detail page updated to visually match the provided Unstop screenshot.
 *
 * Expects job object from API: see usage of fields below.
 */

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingFAQ, setSubmittingFAQ] = useState(false);
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

  // Application form
  const [applicationForm, setApplicationForm] = useState({
    resumeUrl: '',
    coverLetter: ''
  });

  // Review form
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  // FAQ form
  const [faqForm, setFaqForm] = useState({
    question: ''
  });

  // Discussion form
  const [discussionForm, setDiscussionForm] = useState({
    message: ''
  });

  // Reply form map keyed by discussion id
  const [replyForm, setReplyForm] = useState({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    setLoading(true);
    await Promise.all([fetchJob(), fetchRelatedJobs()]);
    setLoading(false);
  };

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      console.error('fetchJob error', err);
      setJob(null);
    }
  };

  const fetchRelatedJobs = async () => {
    try {
      const res = await api.get(`/jobs/${id}/related`);
      setRelatedJobs(res.data || []);
    } catch (err) {
      console.error('fetchRelatedJobs error', err);
      setRelatedJobs([]);
    }
  };

  const hasApplied = () => {
    if (!job || !job.applications) return false;
    if (!user) return false;
    return job.applications.some(app => {
      // handle either nested student obj or plain id
      if (app.student && app.student._id) return app.student._id === user.id;
      if (app.student) return app.student === user.id;
      if (app.userId) return app.userId === user.id;
      return false;
    });
  };

  // Apply action
  const handleApply = async () => {
    if (!user) {
      alert('Please login to apply.');
      return;
    }

    setApplying(true);
    try {
      // expecting backend to accept { resumeUrl, coverLetter } as JSON
      await api.post(`/jobs/${id}/apply`, applicationForm);
      alert('Applied successfully');
      setShowApplyModal(false);
      setApplicationForm({ resumeUrl: '', coverLetter: '' });
      fetchJob();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please login to add review.');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/jobs/${id}/reviews`, reviewForm);
      alert('Review submitted');
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      fetchJob();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit FAQ
  const handleSubmitFAQ = async () => {
    if (!faqForm.question.trim()) return;
    setSubmittingFAQ(true);
    try {
      await api.post(`/jobs/${id}/faqs`, faqForm);
      setFaqForm({ question: '' });
      fetchJob();
      alert('Question submitted');
    } catch (err) {
      console.error(err);
      alert('Failed to submit question');
    } finally {
      setSubmittingFAQ(false);
    }
  };

  // Post discussion
  const handleSubmitDiscussion = async () => {
    if (!discussionForm.message.trim()) return;
    setSubmittingDiscussion(true);
    try {
      await api.post(`/jobs/${id}/discussions`, discussionForm);
      setDiscussionForm({ message: '' });
      fetchJob();
    } catch (err) {
      console.error(err);
      alert('Failed to post');
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  // Reply to discussion
  const handleReply = async (discussionId) => {
    const text = replyForm[discussionId];
    if (!text?.trim()) return;
    try {
      await api.post(`/jobs/${id}/discussions/${discussionId}/replies`, { message: text });
      setReplyForm(prev => ({ ...prev, [discussionId]: '' }));
      fetchJob();
    } catch (err) {
      console.error(err);
      alert('Reply failed');
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not Disclosed';
    if (typeof salary === 'string') return salary;
    if (typeof salary === 'object') {
      const { min, max, currency } = salary;
      const sym = currency === 'USD' ? '$' : '₹';
      if (min && max) {
        if (currency === 'INR') {
          const formatLakhs = (num) => {
            if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
            if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
            return num.toString();
          };
          return `${sym}${formatLakhs(min)} - ${sym}${formatLakhs(max)}`;
        }
        return `${sym}${min.toLocaleString()} - ${sym}${max.toLocaleString()}`;
      }
      if (min) return `${sym}${min.toLocaleString()}+`;
      if (max) return `Up to ${sym}${max.toLocaleString()}`;
    }
    return 'Not Disclosed';
  };

  const getDaysAgo = (date) => {
    if (!date) return '';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const averageRating = job?.reviews?.length > 0
    ? (job.reviews.reduce((s, r) => s + (r.rating || 0), 0) / job.reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <main className="flex-grow-1 p-4" style={{ background: '#fff5f8', minHeight: '100vh' }}>
          <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="d-flex">
        <Sidebar />
        <main className="flex-grow-1 p-4">
          <div className="alert alert-warning">Job not found</div>
        </main>
      </div>
    );
  }

  // --- Page UI ---
  return (
    <div className="d-flex">
      <Sidebar />
      <main className="flex-grow-1" style={{ background: '#fff0f4', minHeight: '100vh' }}>
        {/* Top breadcrumb / return */}
        <div className="container-fluid px-4 py-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <button className="btn btn-link p-0 text-decoration-none" onClick={() => navigate('/jobs-directory')}>
                <i className="bi bi-arrow-left"></i> Back to Jobs
              </button>
            </div>
            <div className="d-flex align-items-center gap-3">
              {/* small icons similar to screenshot */}
              <button className="btn btn-sm btn-light rounded-circle" title="Notifications"><i className="bi bi-bell"></i></button>
              <img 
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`} 
                alt="me" 
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} 
              />
            </div>
          </div>
        </div>

        <div className="container-fluid px-4 pb-5">
          <div className="row gx-4">
            {/* Main Column */}
            <div className="col-lg-8">
              {/* Hero Card */}
              <div className="card mb-4" style={{ borderRadius: 12, overflow: 'hidden', background: '#fdeef3' }}>
                <div className="d-flex p-4">
                  <div style={{ width: 72, height: 72, marginRight: 16 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: 12, background: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontWeight: 700, color: '#8a2be2', fontSize: '24px' }}>{(job.company || '').slice(0, 1).toUpperCase()}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <h2 style={{ marginBottom: 4, fontSize: '28px', fontWeight: '700' }}>{job.title}</h2>
                    <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: 14 }}>
                      <div><i className="bi bi-building"></i> <strong className="text-dark">{job.company}</strong></div>
                      <div><i className="bi bi-geo-alt"></i> {job.location || 'Location not specified'}</div>
                      <div><i className="bi bi-clock"></i> Updated: {getDaysAgo(job.updatedAt)}</div>
                    </div>
                  </div>

                  {/* Action area */}
                  <div style={{ minWidth: 180 }}>
                    <div className="d-flex justify-content-end align-items-start gap-2">
                      <button className="btn btn-outline-secondary btn-sm" title="Save"><i className="bi bi-heart"></i></button>
                      <button className="btn btn-outline-secondary btn-sm" title="Calendar"><i className="bi bi-calendar-event"></i></button>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#fff', border: '1px solid #e7e7e7' }}
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: job.title, url: window.location.href });
                          } else {
                            navigator.clipboard?.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                          }
                        }}
                        title="Share"
                      >
                        <i className="bi bi-share"></i>
                      </button>
                    </div>
                    <div className="mt-3 d-grid">
                      {user?.role === 'student' ? (
                        <button 
                          className={`btn btn-primary btn-lg ${hasApplied() ? 'disabled' : ''}`} 
                          onClick={() => setShowApplyModal(true)}
                          disabled={hasApplied()}
                        >
                          {hasApplied() ? 'Applied' : 'Apply'}
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary btn-lg" 
                          onClick={() => {
                            if (!user) { alert('Please login to apply'); return; }
                            setShowApplyModal(true);
                          }}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Small control + promo area */}
              <div className="row">
                <div className="col-md-7">
                  {/* Eligibility chip */}
                  {job.eligibility && (
                    <div className="card mb-3" style={{ borderRadius: 10 }}>
                      <div className="card-body p-3">
                        <strong>Eligibility</strong>
                        <div className="text-muted mt-1">
                          {job.eligibility.summary || 
                           (job.eligibility.minEducation ? `${job.eligibility.minEducation} ` : '') +
                           (job.eligibility.minExperience ? `with ${job.eligibility.minExperience} experience` : 'Experienced Professionals')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Refer & Win */}
                  {job.referAndWin?.enabled && (
                    <div className="card mb-3" style={{ borderRadius: 10 }}>
                      <div className="card-body p-3 d-flex align-items-center justify-content-between">
                        <div>
                          <small className="text-muted">Refer & Win</small>
                          <div style={{ fontWeight: 700 }}>{job.referAndWin.title || 'Refer & Win rewards'}</div>
                          <small className="text-muted">{job.referAndWin.description}</small>
                        </div>
                        <div style={{ width: 64 }}>
                          {/* small promo image */}
                          <img 
                            src={job.referAndWin.image || 'https://via.placeholder.com/64x64?text=Reward'} 
                            alt="promo" 
                            style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-md-5">
                  {/* Ad banner */}
                  <div className="card mb-3" style={{ borderRadius: 10 }}>
                    <div className="card-body p-2">
                      <img 
                        src={job.bannerImage || 'https://via.placeholder.com/600x120?text=Advertisement'} 
                        alt="banner" 
                        style={{ width: '100%', borderRadius: 8 }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs with content */}
              <div className="card mb-4" style={{ borderRadius: 12 }}>
                <div className="card-body p-3">
                  <ul className="nav nav-pills mb-3">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'description' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('description')}
                        style={{ border: 'none' }}
                      >
                        Job Description
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'dates' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('dates')}
                        style={{ border: 'none' }}
                      >
                        Dates & Deadlines
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('reviews')}
                        style={{ border: 'none' }}
                      >
                        Reviews ({job.reviews?.length || 0})
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'faqs' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('faqs')}
                        style={{ border: 'none' }}
                      >
                        FAQs & Discussions
                      </button>
                    </li>
                  </ul>

                  <div>
                    {activeTab === 'description' && (
                      <>
                        {/* Details card */}
                        <div className="card mb-4" style={{ borderRadius: 10 }}>
                          <div className="card-body">
                            <h5>Details</h5>
                            <p className="text-muted mb-3">{job.shortSummary || job.description?.substring(0, 200) || `Hiring for ${job.title}`}</p>

                            <div className="mb-3">
                              <h6>About the Role</h6>
                              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{job.description}</p>
                            </div>

                            {job.responsibilities && job.responsibilities.length > 0 && (
                              <div className="mb-3">
                                <h6>Responsibilities</h6>
                                <ul style={{ lineHeight: '2' }}>
                                  {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            )}

                            {job.requirements && job.requirements.length > 0 && (
                              <div className="mb-3">
                                <h6>Requirements</h6>
                                <ul style={{ lineHeight: '2' }}>
                                  {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Important notice */}
                        {job.importantNote && (
                          <div className="mb-3">
                            <div className="p-3" style={{ background: '#fff7e6', border: '1px solid #ffecb5', borderRadius: 8 }}>
                              <strong>Note:</strong> {job.importantNote}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {activeTab === 'dates' && (
                      <div>
                        {job.importantDates ? (
                          <div className="row g-3">
                            {job.importantDates.applicationDeadline && (
                              <div className="col-md-6">
                                <div className="p-3 border" style={{ borderRadius: 8 }}>
                                  <small className="text-muted">Application Deadline</small>
                                  <div className="mt-1" style={{ fontWeight: 700 }}>
                                    {new Date(job.importantDates.applicationDeadline).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                            {job.importantDates.startDate && (
                              <div className="col-md-6">
                                <div className="p-3 border" style={{ borderRadius: 8 }}>
                                  <small className="text-muted">Start Date</small>
                                  <div className="mt-1" style={{ fontWeight: 700 }}>
                                    {new Date(job.importantDates.startDate).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                            {job.importantDates.endDate && (
                              <div className="col-md-6">
                                <div className="p-3 border" style={{ borderRadius: 8 }}>
                                  <small className="text-muted">End Date</small>
                                  <div className="mt-1" style={{ fontWeight: 700 }}>
                                    {new Date(job.importantDates.endDate).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : <p className="text-muted">No dates available.</p>}
                      </div>
                    )}

                    {activeTab === 'reviews' && (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h5 className="mb-0">Reviews</h5>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ fontSize: '20px', fontWeight: '700' }}>{averageRating}</span>
                              <div>
                                {[1,2,3,4,5].map(i => (
                                  <i 
                                    key={i} 
                                    className={`bi ${i <= parseFloat(averageRating) ? 'bi-star-fill' : 'bi-star'}`} 
                                    style={{ color: '#ffc107', fontSize: '16px' }}
                                  ></i>
                                ))}
                              </div>
                              <span className="text-muted">· {job.reviews?.length || 0} reviews</span>
                            </div>
                          </div>
                          <div>
                            <button className="btn btn-outline-primary" onClick={() => setShowReviewModal(true)}>Add Review</button>
                          </div>
                        </div>

                        {job.reviews && job.reviews.length > 0 ? (
                          job.reviews.map((r, idx) => (
                            <div key={idx} className="mb-3 border-bottom pb-3">
                              <div className="d-flex align-items-start gap-3">
                                <img 
                                  src={r.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.name || 'U')}`} 
                                  alt="u" 
                                  style={{ width: 44, height: 44, borderRadius: 44, objectFit: 'cover' }} 
                                />
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between">
                                    <strong>{r.user?.name || 'Anonymous'}</strong>
                                    <small className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</small>
                                  </div>
                                  <div className="mb-1">
                                    {[1,2,3,4,5].map(i => (
                                      <i 
                                        key={i} 
                                        className={`bi ${i <= r.rating ? 'bi-star-fill' : 'bi-star'}`} 
                                        style={{ color: '#ffc107', fontSize: '14px' }}
                                      ></i>
                                    ))}
                                  </div>
                                  <div>{r.comment}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : <p className="text-muted">No reviews yet.</p>}
                      </div>
                    )}

                    {activeTab === 'faqs' && (
                      <div>
                        <h5 className="mb-3">FAQs</h5>
                        {job.faqs && job.faqs.length > 0 ? (
                          <div className="accordion mb-3" id="faqAcc">
                            {job.faqs.map((f, i) => (
                              <div className="accordion-item" key={i}>
                                <h2 className="accordion-header">
                                  <button 
                                    className="accordion-button collapsed" 
                                    type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target={`#faq${i}`}
                                  >
                                    {f.question}
                                  </button>
                                </h2>
                                <div id={`faq${i}`} className="accordion-collapse collapse" data-bs-parent="#faqAcc">
                                  <div className="accordion-body">{f.answer || <em>Not answered yet</em>}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-muted">No FAQs yet.</p>}

                        <div className="mb-4">
                          <label className="form-label">Ask a question</label>
                          <div className="d-flex gap-2">
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Be specific..." 
                              value={faqForm.question} 
                              onChange={(e) => setFaqForm({ question: e.target.value })} 
                            />
                            <button 
                              className="btn btn-primary" 
                              onClick={handleSubmitFAQ} 
                              disabled={!faqForm.question.trim() || submittingFAQ}
                            >
                              {submittingFAQ ? 'Posting...' : 'Post'}
                            </button>
                          </div>
                        </div>

                        <h5 className="mb-3">Discussions</h5>
                        {job.discussions && job.discussions.length > 0 ? (
                          job.discussions.map((d, idx) => (
                            <div key={idx} className="mb-3 pb-3 border-bottom">
                              <div className="d-flex gap-2">
                                <img 
                                  src={d.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.user?.name || 'U')}`} 
                                  alt="u" 
                                  style={{ width: 36, height: 36, borderRadius: 36, objectFit: 'cover' }} 
                                />
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between">
                                    <strong>{d.user?.name || 'Anonymous'}</strong>
                                    <small className="text-muted">{new Date(d.createdAt).toLocaleDateString()}</small>
                                  </div>
                                  <div className="mt-1">{d.message}</div>

                                  {d.replies && d.replies.length > 0 && (
                                    <div className="ms-4 mt-3">
                                      {d.replies.map((rep, rIdx) => (
                                        <div key={rIdx} className="mb-2">
                                          <div className="d-flex gap-2">
                                            <img 
                                              src={rep.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(rep.user?.name || 'U')}`} 
                                              alt="r" 
                                              style={{ width: 28, height: 28, borderRadius: 28, objectFit: 'cover' }} 
                                            />
                                            <div>
                                              <strong style={{ fontSize: 13 }}>{rep.user?.name || 'Anonymous'}</strong>
                                              <div style={{ fontSize: 14 }}>{rep.message}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="d-flex gap-2 mt-2">
                                    <input 
                                      type="text" 
                                      className="form-control form-control-sm" 
                                      placeholder="Reply..." 
                                      value={replyForm[d._id] || ''} 
                                      onChange={(e) => setReplyForm(prev => ({ ...prev, [d._id]: e.target.value }))} 
                                    />
                                    <button 
                                      className="btn btn-sm btn-outline-primary" 
                                      onClick={() => handleReply(d._id)}
                                      disabled={!replyForm[d._id]?.trim()}
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : <p className="text-muted">No discussions yet. Start one!</p>}

                        <div className="d-flex gap-2">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Start a discussion..." 
                            value={discussionForm.message} 
                            onChange={(e) => setDiscussionForm({ message: e.target.value })} 
                          />
                          <button 
                            className="btn btn-primary" 
                            onClick={handleSubmitDiscussion} 
                            disabled={!discussionForm.message.trim() || submittingDiscussion}
                          >
                            {submittingDiscussion ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Column */}
            <aside className="col-lg-4">
              <div className="sticky-top" style={{ top: 16 }}>
                <div className="card mb-4" style={{ borderRadius: 12 }}>
                  <div className="card-body">
                    <h6 className="text-muted">Job Location</h6>
                    <div className="mb-3"><strong>{job.location || 'Not specified'}</strong></div>

                    <h6 className="text-muted">Experience</h6>
                    <div className="mb-3">
                      {job.experience 
                        ? `${job.experience.min || 0} - ${job.experience.max || '-'} ${job.experience.unit || 'years'}` 
                        : 'Not specified'}
                    </div>

                    <h6 className="text-muted">Salary</h6>
                    <div className="mb-3"><strong>{formatSalary(job.salary)}</strong></div>

                    <h6 className="text-muted">Work Detail</h6>
                    <div className="mb-3">{job.workDays || 'Working Days: 5 Days'}</div>

                    <h6 className="text-muted">Job Type/Timing</h6>
                    <div className="mb-3">{job.type ? job.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Full Time (In Office)'}</div>
                  </div>
                </div>

                {/* Featured opportunities (carousel-like preview) */}
                {job.featured && job.featuredItems && job.featuredItems.length > 0 && (
                  <div className="card mb-4" style={{ borderRadius: 12 }}>
                    <div className="card-body">
                      <h6>Featured Opportunities</h6>
                      <div className="mt-2">
                        {job.featuredItems.slice(0, 3).map((f, i) => (
                          <div key={i} className="d-flex gap-2 align-items-center mb-2">
                            <img 
                              src={f.image || 'https://via.placeholder.com/64'} 
                              alt="f" 
                              style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8 }} 
                            />
                            <div>
                              <div style={{ fontWeight: 700 }}>{f.title}</div>
                              <small className="text-muted">{f.subtitle}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Related opportunities */}
                {relatedJobs.length > 0 && (
                  <div className="card mb-4" style={{ borderRadius: 12 }}>
                    <div className="card-body">
                      <h6>Related Opportunities</h6>
                      {relatedJobs.slice(0, 5).map((r) => (
                        <div 
                          key={r._id || r.id} 
                          className="py-2 border-bottom" 
                          style={{ cursor: 'pointer' }} 
                          onClick={() => navigate(`/job/${r._id || r.id}`)}
                        >
                          <div style={{ fontWeight: 700 }}>{r.title}</div>
                          <small className="text-muted">{r.company} · {r.location}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback & Rating small form */}
                <div className="card mb-4" style={{ borderRadius: 12 }}>
                  <div className="card-body">
                    <h6>Feedback & Rating</h6>
                    <textarea 
                      className="form-control mb-2" 
                      rows="3" 
                      placeholder="Write a feedback" 
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        {[1,2,3,4,5].map(i => (
                          <i 
                            key={i} 
                            className={`bi ${i <= reviewForm.rating ? 'bi-star-fill' : 'bi-star'}`} 
                            style={{ 
                              color: i <= reviewForm.rating ? '#ffc107' : '#e0e0e0', 
                              marginRight: 4,
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                            onClick={() => setReviewForm({ ...reviewForm, rating: i })}
                          ></i>
                        ))}
                      </div>
                      <button 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={handleSubmitReview}
                        disabled={!reviewForm.comment.trim() || submittingReview}
                      >
                        {submittingReview ? 'Posting...' : 'Enter'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </aside>
          </div>
        </div>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Apply for {job.title}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    aria-label="Close" 
                    onClick={() => {
                      setShowApplyModal(false);
                      setApplicationForm({ resumeUrl: '', coverLetter: '' });
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Resume URL <span className="text-danger">*</span></label>
                    <input 
                      type="url" 
                      className="form-control" 
                      placeholder="Paste resume link (or upload and paste link)" 
                      value={applicationForm.resumeUrl} 
                      onChange={(e) => setApplicationForm({ ...applicationForm, resumeUrl: e.target.value })} 
                    />
                    <small className="form-text text-muted">Upload your resume via S3/upload UI and paste the URL here.</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Cover Letter (optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="4" 
                      value={applicationForm.coverLetter} 
                      onChange={(e) => setApplicationForm({ ...applicationForm, coverLetter: e.target.value })}
                      placeholder="Tell us why you're interested in this position..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowApplyModal(false);
                      setApplicationForm({ resumeUrl: '', coverLetter: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleApply} 
                    disabled={applying || !applicationForm.resumeUrl.trim()}
                  >
                    {applying ? 'Applying...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Review</h5>
                  <button 
                    className="btn-close" 
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewForm({ rating: 5, comment: '' });
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <label className="form-label">Rating</label>
                  <div className="mb-3">
                    {[1,2,3,4,5].map(i => (
                      <i 
                        key={i} 
                        className={`bi ${i <= reviewForm.rating ? 'bi-star-fill' : 'bi-star'}`} 
                        style={{ fontSize: 26, color: '#ffc107', cursor: 'pointer', marginRight: 6 }} 
                        onClick={() => setReviewForm({ ...reviewForm, rating: i })}
                      ></i>
                    ))}
                  </div>
                  <label className="form-label">Comment</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    value={reviewForm.comment} 
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience..."
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewForm({ rating: 5, comment: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSubmitReview} 
                    disabled={submittingReview || !reviewForm.comment.trim()}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer small */}
        <footer className="py-4 text-center text-muted" style={{ background: '#fff', marginTop: '40px' }}>
          <small>Powered by Unstop UI — best viewed in modern browsers</small>
        </footer>
      </main>
    </div>
  );
};

export default JobDetail;
