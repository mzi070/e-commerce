import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold text-slate-100 mb-0 leading-none select-none">404</div>
        <div className="-mt-4 mb-4">
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-sm font-semibold rounded-full border border-primary-100">
            Page not found
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Looks like you're lost</h1>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-stone-200 text-slate-600 rounded-xl hover:bg-stone-50 font-medium transition-colors text-sm"
          >
            Go Back
          </button>
          <Link
            to="/"
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-500 font-semibold transition-colors text-sm"
          >
            Home
          </Link>
          <Link
            to="/products"
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-semibold transition-colors text-sm"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
