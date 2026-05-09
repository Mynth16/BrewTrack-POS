import Navigation from '../../components/Navigation/Navigation.jsx';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <Navigation/>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>BrewTrack POS Dashboard</h1>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
