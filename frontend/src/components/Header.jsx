import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <h1>E-Commerce Store</h1>
      </div>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
          <li><a href="/cart">Cart</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
