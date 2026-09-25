import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success(`You're subscribed! Check ${email} for a confirmation.`);
    setEmail('');
  };

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="container mx-auto px-4 lg:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-primary-500 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm leading-none">S</span>
              </div>
              <span className="text-white font-bold text-base tracking-tight">ShopHub</span>
            </div>
            <p className="text-sm leading-relaxed">
              Your destination for quality products at prices that make sense.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase text-xs">Shop</h3>
            <ul className="space-y-2.5">
              <li><Link to="/products" className="text-sm hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/about" className="text-sm hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase text-xs">Support</h3>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm hover:text-white transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Returns</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase text-xs">Newsletter</h3>
            <p className="text-sm mb-4">Get deals and new arrivals first.</p>
            <form onSubmit={handleSubscribe} className="flex gap-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 min-w-0 px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-r-lg hover:bg-primary-500 transition-colors flex-shrink-0"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} ShopHub. All rights reserved.</p>
          <p className="text-xs text-slate-600">Built with care for great shopping experiences.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
