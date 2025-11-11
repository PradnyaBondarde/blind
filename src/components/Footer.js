import React from 'react';
import '../styles/navbar.css'; // Reuse gradient for consistency

const Footer = () => {
    return (
        <footer className="footer">
            <p>© {new Date().getFullYear()} Blind–Guardian Validation System</p>
            <p>Developed with 2BL22CS Batch 39</p>
        </footer>
    );
};

export default Footer;
