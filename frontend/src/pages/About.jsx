import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-4 lg:px-6 max-w-3xl text-center">
          <p className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4">Our story</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">About ShopHub</h1>
          <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
            We're on a mission to make quality products accessible to everyone, everywhere.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-6 max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            ShopHub was founded with a simple idea: online shopping should be easy, enjoyable, and affordable.
            We carefully curate products across electronics, clothing, home goods, and more — so you never have
            to compromise on quality or price.
          </p>
          <p className="text-stone-600 text-lg leading-relaxed">
            Every product in our catalog is vetted for quality. We partner with trusted suppliers and back
            everything with a 30-day return policy and dedicated customer support.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                ),
                title: 'Quality First',
                desc: 'Every product is tested and verified before it reaches our catalog.',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                ),
                title: 'Fair Prices',
                desc: 'We negotiate hard with suppliers so you get the best possible deal.',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                ),
                title: 'Real Support',
                desc: 'Humans, not bots. Our support team is here when you need us.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {icon}
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4 lg:px-6 text-center">
          <p className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4">Ready to start?</p>
          <h2 className="text-3xl font-bold text-white mb-6">Ready to start shopping?</h2>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-colors"
          >
            Browse Products
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
