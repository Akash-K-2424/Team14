import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/teamMembers.css';

export default function MemberDetails() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            src={`/uploads/${member.image}`}
            alt={member.fullName}
            className="team-avatar-large"
            loading="lazy"
          />
          <h2 className="team-details-name">{member.fullName}</h2>
          <p className="team-details-role">{member.role}</p>
        </div>

        <div className="team-details">
          <div className="team-detail-row">
            <span className="team-detail-label">Full Name</span>
            <span className="team-detail-value">{member.fullName}</span>
          </div>
          <div className="team-detail-row">
            <span className="team-detail-label">Role</span>
            <span className="team-detail-value">{member.role || 'Student'}</span>
          </div>
          <div className="team-detail-row">
            <span className="team-detail-label">Email</span>
            <span className="team-detail-value">{member.email || 'Not provided'}</span>
          </div>
          <div className="team-detail-row">
            <span className="team-detail-label">Contact</span>
            <span className="team-detail-value">{member.contact || 'Not provided'}</span>
          </div>
          <div className="team-detail-row team-detail-row-multiline">
            <span className="team-detail-label">Additional Details</span>
            <span className="team-detail-value">
              {[
                member.rollNumber ? `Roll Number: ${member.rollNumber}` : '',
                member.year ? `Year: ${member.year}` : '',
                member.degree ? `Degree: ${member.degree}` : '',
                member.aboutProject ? `About Project: ${member.aboutProject}` : '',
                member.hobbies ? `Hobbies: ${member.hobbies}` : '',
                member.certificate ? `Certificate: ${member.certificate}` : '',
                member.internship ? `Internship: ${member.internship}` : '',
                member.aboutAim ? `About Aim: ${member.aboutAim}` : '',
                member.bio ? `Bio: ${member.bio}` : '',
              ].filter(Boolean).join(' | ') || 'No additional details provided.'}
            </span>
          </div>
        </div>

        <Link to="/team/members" className="team-btn team-btn-secondary">
          Back to Members
        </Link>
      </div>
    </div>
  );
}
