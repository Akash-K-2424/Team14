import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/teamMembers.css';

export default function ViewMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/members');
        setMembers(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch members.');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  return (
    <div className="team-page-wrapper">
      <div className="team-container">
        <h2>Team Members</h2>

        {loading && <p>Loading members...</p>}
        {error && <p className="team-error">{error}</p>}

        {!loading && !error && (
          <div className="team-grid">
            {members.map((member) => (
              <div key={member._id} className="team-card">
                <img src={`/uploads/${member.image}`} alt={member.fullName} className="team-avatar" />
                <h3>{member.fullName}</h3>
                <p>{member.role}</p>
                <Link to={`/team/members/${member._id}`} className="team-btn team-btn-secondary">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
