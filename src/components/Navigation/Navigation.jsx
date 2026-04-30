import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navigation.css';

function Navigation() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();



    return (
        <nav>
            <h2>Welcome, {user?.username}!</h2>
            <button onClick = {() => navigate('/dashboard')}>
                Dashboard
            </button>
            <button>
                Point of Sale
            </button>
            <button onClick = {() => navigate('/inventory')}>
                Inventory
            </button>
            <button>
                Reports
            </button>
        </nav>
    );
}

export default Navigation;