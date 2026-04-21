import { Link } from 'react-router-dom';
import '../styles/teamMembers.css';

export default function TeamHome() {
  return (
    <div className="team-page-wrapper">
      <div className="team-container">
        <h1 className="team-title">Student Team Members Management Application</h1>
        <p className="team-subtitle">
          Welcome to Team ResuAI. Use this module to add and manage team members.
        </p>
        <div className="team-actions">
          <Link to="/team/add-member" className="team-btn team-btn-primary">
            Add Member
          </Link>
          <Link to="/team/members" className="team-btn team-btn-secondary">
            View Members
          </Link>
        </div>
      </div>
    </div>
  );
}
