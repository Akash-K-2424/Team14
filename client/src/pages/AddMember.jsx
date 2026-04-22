import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/teamMembers.css';

export default function AddMember() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    year: '',
    degree: '',
    aboutProject: '',
    hobbies: '',
    certificate: '',
    internship: '',
    aboutAim: '',
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

    if (!formData.fullName || !formData.rollNumber || !formData.year || !formData.degree) {
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
        <h2>Add Team Member</h2>
        <form onSubmit={handleSubmit} className="team-form">
          <input
            name="fullName"
            placeholder="Name *"
            value={formData.fullName}
            onChange={handleChange}
          />
          <input
            name="rollNumber"
            placeholder="Roll Number *"
            value={formData.rollNumber}
            onChange={handleChange}
          />
          <input
            name="year"
            placeholder="Year *"
            value={formData.year}
            onChange={handleChange}
          />
          <input
            name="degree"
            placeholder="Degree *"
            value={formData.degree}
            onChange={handleChange}
          />
          <textarea
            name="aboutProject"
            placeholder="About Project"
            value={formData.aboutProject}
            onChange={handleChange}
          />
          <input
            name="hobbies"
            placeholder="Hobbies (comma separated)"
            value={formData.hobbies}
            onChange={handleChange}
          />
          <input
            name="certificate"
            placeholder="Certificate"
            value={formData.certificate}
            onChange={handleChange}
          />
          <input
            name="internship"
            placeholder="Internship"
            value={formData.internship}
            onChange={handleChange}
          />
          <textarea
            name="aboutAim"
            placeholder="About Your Aim"
            value={formData.aboutAim}
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
