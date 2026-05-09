import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdDashboard, MdShoppingCart, MdInventory2, MdAssessment, MdManageAccounts, MdLogout } from 'react-icons/md';
import './Navigation.css';

function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const menuItems = [
        { label: 'Dashboard', path: '/dashboard', icon: MdDashboard },
        { label: 'Point of Sale', path: '/pos', icon: MdShoppingCart },
        { label: 'Inventory', path: '/inventory', icon: MdInventory2 },
        { label: 'Reports', path: '/reports', icon: MdAssessment },
        { label: 'User Manager', path: '/user-manager', icon: MdManageAccounts },
    ];

    return (
        <nav className="sidebar">
            <div className="sidebar-content">
                <div className="sidebar-menu">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                                title={item.label}
                            >
                                <Icon className="menu-icon" />
                                <span className="menu-label">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={handleLogout}
                    className="menu-item logout-item"
                    title="Logout"
                >
                    <MdLogout className="menu-icon" />
                    <span className="menu-label">Logout</span>
                </button>
            </div>
        </nav>
    );
}

export default Navigation;