import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navigation from '../../components/Navigation/Navigation.jsx';
import './Inventory.css';

function Inventory() {
    return (
        <div className = "inventory-container">
            <Navigation />
            <section>
                <h1>Inventory</h1>
                <div className = "inventory-content">
                    <div className = "inventory-list">
                        <form action = "">
                            <input type = "text" placeholder = "Search Ingredient" />
                            <select value = "fil">
                                <option>agqwrg</option>
                            </select>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Inventory;