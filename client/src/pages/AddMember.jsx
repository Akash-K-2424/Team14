import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/teamMembers.css';

export default function AddMember() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    email: '',
    contact: '',
    bio: '',
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.role || !formData.email || !formData.contact) {
      setError('Please fill all required fields.');
      return;
    }

    if (!image) {
      setError('Please upload a profile image.');
      return;
    }

    try {
      setLoading(true);
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      payload.append('image', image);

      await api.post('/members', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/team/members');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="team-page-wrapper">
      <div className="team-form-card">
        <h2>Add New Member</h2>
        <form onSubmit={handleSubmit} className="team-form">
          <input
            name="fullName"
            placeholder="Full Name *"
            value={formData.fullName}
            onChange={handleChange}
          />
          <input
            name="role"
            placeholder="Role *"
            value={formData.role}
            onChange={handleChange}
          />
          <input
            name="email"
            placeholder="Email *"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            name="contact"
            placeholder="Contact *"
            value={formData.contact}
            onChange={handleChange}
          />
          <textarea
            name="bio"
            placeholder="Short Bio (optional)"
            value={formData.bio}
            onChange={handleChange}
          />
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />

          {error && <p className="team-error">{error}</p>}

          <button type="submit" className="team-btn team-btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Member'}
          </button>
        </form>
      </div>
    </div>
  );
}
