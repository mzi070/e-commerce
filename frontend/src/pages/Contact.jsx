import React, { useState } from 'react';
import { toast } from 'sonner';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
  };

  const inputCls = (field) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm text-slate-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-stone-50'
    }`;

  return (
    <div className="min-h-screen">
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 lg:px-6 text-center">
          <p className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4">Get in touch</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">Contact Us</h1>
          <p className="text-slate-300 text-lg md:text-xl leading-relaxed">We'd love to hear from you. Send us a message!</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                label: 'Email',
                value: 'support@shophub.com',
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
                label: 'Phone',
                value: '+1 (800) 123-4567',
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                label: 'Hours',
                value: 'Mon–Fri, 9am–6pm EST',
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 text-center">
                <div className="w-12 h-12 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {icon}
                  </svg>
                </div>
                <div className="font-semibold text-slate-900 mb-1">{label}</div>
                <div className="text-stone-500 text-sm">{value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 max-w-2xl mx-auto">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Message sent!</h2>
                <p className="text-stone-500">We'll reply to <strong className="text-slate-700">{form.email}</strong> within 24 hours.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" className={inputCls('name')} />
                      {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls('email')} />
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <input name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" className={inputCls('subject')} />
                    {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell us more about your question or issue…"
                      className={inputCls('message')}
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
