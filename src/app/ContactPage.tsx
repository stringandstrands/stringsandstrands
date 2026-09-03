import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — replace with actual backend / email service if needed
    await new Promise(res => setTimeout(res, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FFEAF2]">
      {/* Header */}
      <section className="bg-[#B3184F] text-[#FFEAF2] py-20 px-4 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, #FF2D74 0%, transparent 60%)`,
          }}
        />
        <div className="relative">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#FFD1E3]/70 mb-4">Get in Touch</p>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Contact Us
          </h1>
          <p className="text-[#FFEAF2]/60 text-sm max-w-md mx-auto">
            Have a question, a custom order request, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2
              className="text-xl font-bold text-[#B3184F] mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Reach Us Directly
            </h2>

            <div className="space-y-6">
              {/* WhatsApp / Phone */}
              <a
                href="https://wa.me/917000863158"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#25D366] text-white flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#B3184F] uppercase tracking-widest mb-1">WhatsApp / Phone</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#FF2D74] transition-colors">
                    +91 70008 63158
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Mon – Sat, 10 AM – 7 PM IST</p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:stringsandstrands26@gmail.com"
                className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#FF2D74] text-[#FFEAF2] flex items-center justify-center flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#B3184F] uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#FF2D74] transition-colors">
                    stringsandstrands26@gmail.com
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">We reply within 24 hours</p>
                </div>
              </a>

              {/* Call */}
              <a
                href="tel:+917000863158"
                className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#B3184F] text-[#FFEAF2] flex items-center justify-center flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#B3184F] uppercase tracking-widest mb-1">Call Us</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#FF2D74] transition-colors">
                    +91 70008 63158
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Mon – Sat, 10 AM – 7 PM IST</p>
                </div>
              </a>
            </div>
          </div>

          {/* Enquiry Form */}
          <div>
            <h2
              className="text-xl font-bold text-[#B3184F] mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Send Us a Message
            </h2>

            {submitted ? (
              <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#FFEAF2] flex items-center justify-center">
                  <CheckCircle size={32} className="text-[#FF2D74]" />
                </div>
                <h3 className="text-lg font-bold text-[#B3184F]">Message Sent!</h3>
                <p className="text-sm text-[#B3184F]/60">
                  Thanks for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
                  className="mt-2 text-xs font-bold text-[#FF2D74] uppercase tracking-widest hover:underline"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#B3184F] mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Priya Sharma"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] focus:ring-1 focus:ring-[#FF2D74] transition-all placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#B3184F] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="priya@example.com"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] focus:ring-1 focus:ring-[#FF2D74] transition-all placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#B3184F] mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what you need…"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] focus:ring-1 focus:ring-[#FF2D74] transition-all placeholder:text-gray-300 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#FF2D74] hover:bg-[#B3184F] text-[#FFEAF2] text-[11px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
