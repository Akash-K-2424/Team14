import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/teamMembers.css';

export default function MemberDetails() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await api.get(`/members/${id}`);
        setMember(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch member details.');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handleUpdatePhoto = async () => {
    if (!photoFile) {
      setPhotoError('Please choose an image first.');
      return;
    }

    try {
      setPhotoError('');
      setSavingPhoto(true);
      const payload = new FormData();
      payload.append('image', photoFile);

      const response = await api.put(`/members/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMember(response.data);
      setPhotoFile(null);
    } catch (err) {
      setPhotoError(err.response?.data?.error || 'Failed to update photo.');
    } finally {
      setSavingPhoto(false);
    }
  };

  if (loading) {
    return <div className="team-page-wrapper team-container">Loading member details...</div>;
  }

  if (error) {
    return <div className="team-page-wrapper team-container team-error">{error}</div>;
  }

  if (!member) {
    return <div className="team-page-wrapper team-container">Member not found.</div>;
  }

  return (
    <div className="team-page-wrapper">
      <div className="team-details-card">
        <div className="team-details-header">
          <img
            src={photoPreview || `/uploads/${member.image}`}
            alt={member.fullName}
            className="team-avatar-large"
            loading="lazy"
          />
          <h2 className="team-details-name">{member.fullName}</h2>
          <p className="team-details-role">{member.role}</p>
        </div>

        <div className="team-photo-edit">
          <div className="team-photo-edit-row">
            <label className="team-photo-label">
              Edit Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              className="team-btn team-btn-primary"
              onClick={handleUpdatePhoto}
              disabled={savingPhoto}
            >
              {savingPhoto ? 'Updating...' : 'Update Photo'}
            </button>
          </div>
          {photoError && <p className="team-error">{photoError}</p>}
        </div>

        <div className="team-details">
          <div className="team-detail-row">
            <span className="team-detail-label">Role</span>
            <span className="team-detail-value">{member.role}</span>
          </div>
          <div className="team-detail-row">
            <span className="team-detail-label">Email</span>
            <span className="team-detail-value">{member.email}</span>
          </div>
          <div className="team-detail-row">
            <span className="team-detail-label">Contact</span>
            <span className="team-detail-value">{member.contact}</span>
          </div>
          {member.bio && (
            <div className="team-detail-row team-detail-row-multiline">
              <span className="team-detail-label">Bio</span>
              <span className="team-detail-value">{member.bio}</span>
            </div>
          )}
        </div>

        <Link to="/team/members" className="team-btn team-btn-secondary">
          Back to Members
        </Link>
      </div>
    </div>
  );
}
