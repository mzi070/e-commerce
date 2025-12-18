import React from 'react';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <CartProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          <Home />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;
