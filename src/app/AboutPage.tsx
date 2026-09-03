import React from 'react';
import { Sparkles, Heart, Shield, Package } from 'lucide-react';

const VALUES = [
  {
    icon: <Sparkles size={22} />,
    title: 'Handcrafted with Love',
    desc: 'Every piece in our collection is carefully handcrafted by skilled artisans who pour their heart into each detail — from the clasp to the finish.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Anti-Tarnish Guaranteed',
    desc: 'We use only certified anti-tarnish materials so your jewellery stays as brilliant on day 365 as it did on day one.',
  },
  {
    icon: <Heart size={22} />,
    title: 'Made for Every Story',
    desc: 'Whether it\'s a birthday, an anniversary, or simply a Tuesday treat — our jewellery is designed to celebrate every moment of your life.',
  },
  {
    icon: <Package size={22} />,
    title: 'Sustainably Packaged',
    desc: 'Our jewellery arrives in eco-conscious, gift-ready packaging because we care about the planet as much as we care about your experience.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FFEAF2]">
      {/* Hero */}
      <section className="relative bg-[#B3184F] text-[#FFEAF2] py-24 px-4 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #FF2D74 0%, transparent 60%),
                              radial-gradient(circle at 80% 20%, #FFD1E3 0%, transparent 50%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#FFD1E3]/70 mb-4">Our Story</p>
          <h1
            className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Where Every Jewel Tells&nbsp;a Story
          </h1>
          <p className="text-[#FFEAF2]/70 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Strings & Strands was born from a simple belief — that beautiful, handcrafted jewellery
            should be accessible to every woman, for every occasion.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#FF2D74] mb-3">Who We Are</p>
            <h2
              className="text-2xl md:text-3xl font-bold text-[#B3184F] mb-5 leading-snug"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              A Passion for Craftsmanship
            </h2>
            <p className="text-[#B3184F]/70 text-sm leading-relaxed mb-4">
              Strings & Strands started as a small passion project — a love for jewellery that feels
              personal, intentional, and full of meaning. We work with skilled artisans to create
              pieces that blend traditional craftsmanship with modern aesthetics.
            </p>
            <p className="text-[#B3184F]/70 text-sm leading-relaxed mb-4">
              Each collection is thoughtfully curated to complement your personality — whether you're
              drawn to minimal elegance, bold statement pieces, or delicate everyday wear.
            </p>
            <p className="text-[#B3184F]/70 text-sm leading-relaxed">
              We believe jewellery is more than an accessory. It's a memory, a milestone, a mood.
              And we're honoured to be part of yours.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-[#FFD1E3] flex items-center justify-center overflow-hidden shadow-xl">
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, #FFD1E3 0%, #FF2D74 50%, #B3184F 100%)`,
                }}
              >
                <span
                  className="text-8xl select-none"
                  role="img"
                  aria-label="jewellery"
                >
                  ✦
                </span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl bg-[#FF2D74] opacity-20" />
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#B3184F] opacity-20" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#FF2D74] mb-3">What We Stand For</p>
            <h2
              className="text-2xl md:text-3xl font-bold text-[#B3184F]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Our Values
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(v => (
              <div
                key={v.title}
                className="bg-[#FFEAF2] rounded-2xl p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FF2D74] text-[#FFEAF2] flex items-center justify-center">
                  {v.icon}
                </div>
                <h3 className="text-sm font-bold text-[#B3184F]">{v.title}</h3>
                <p className="text-xs text-[#B3184F]/60 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2
          className="text-2xl md:text-3xl font-bold text-[#B3184F] mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Find Your Perfect Piece
        </h2>
        <p className="text-[#B3184F]/60 text-sm mb-8 max-w-md mx-auto">
          Browse our handcrafted collections and find jewellery that speaks to your story.
        </p>
        <a
          href="/"
          className="inline-block bg-[#FF2D74] text-[#FFEAF2] text-[11px] font-bold uppercase tracking-widest px-10 py-3.5 rounded-full hover:bg-[#B3184F] transition-colors"
        >
          Shop Now
        </a>
      </section>
    </div>
  );
}
