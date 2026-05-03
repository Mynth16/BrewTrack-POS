import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './UpdateProduct.css';

function UpdateProduct() {

    const navigate = useNavigate();


    return (
        <div className = "update-product-container">
            <h1>Update Product</h1>
            <button onClick = {() => navigate(-1)}>Back</button>

            <form>
                <label>Enter New Product Name: </label> <br />
                <input type = "name" placeholder = "Enter New Product Name"/>
            </form>
        </div>
    );
}

export default UpdateProduct;