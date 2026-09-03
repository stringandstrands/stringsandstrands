import React from 'react';
import { Video, CheckCircle, XCircle, MessageCircle, Clock, AlertTriangle } from 'lucide-react';

const ELIGIBLE = [
  'Product received is damaged or broken',
  'Wrong item delivered (different from order)',
  'Manufacturing defect visible on the product',
  'Missing parts or accessories included in listing',
];

const NOT_ELIGIBLE = [
  'Change of mind or personal preference',
  'Colour variation due to screen differences',
  'Size or fit issues',
  'Items used, worn, or tampered with',
  'Claims raised after 48 hours of delivery',
  'No unboxing video provided as proof',
];

const STEPS = [
  {
    num: '01',
    title: 'Record an Unboxing Video',
    desc: 'Before opening your package, start recording a continuous video. Show the sealed package, then open it on camera — this is mandatory proof for any defect claim.',
  },
  {
    num: '02',
    title: 'Raise a Claim Within 48 Hours',
    desc: 'Contact us within 48 hours of delivery via WhatsApp. Send the unboxing video clearly showing the defect along with your order details.',
  },
  {
    num: '03',
    title: 'We Review Your Claim',
    desc: 'Our team will review the video within 24–48 hours and confirm whether your claim is eligible for a return, replacement, or refund.',
  },
  {
    num: '04',
    title: 'Resolution',
    desc: "On approval, we'll arrange a pickup of the defective item and dispatch a replacement or process a refund within 5–7 business days.",
  },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#FFEAF2]">
      {/* Header */}
      <section className="bg-[#B3184F] text-[#FFEAF2] py-20 px-4 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 80%, #FF2D74 0%, transparent 60%)' }}
        />
        <div className="relative">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#FFD1E3]/70 mb-4">Returns & Exchange</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Return Policy
          </h1>
          <p className="text-[#FFEAF2]/60 text-sm max-w-md mx-auto">
            Last updated: September 2026
          </p>
        </div>
      </section>

      {/* Important Banner */}
      <section className="max-w-3xl mx-auto px-4 pt-10">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center flex-shrink-0">
            <Video size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Unboxing Video is Mandatory</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              To process any return or exchange claim, you <strong>must</strong> send an unboxing video
              showing the defect to our WhatsApp number{' '}
              <a href="https://wa.me/917000863158" className="font-bold underline">
                +91 70008 63158
              </a>.
              Claims without a video will not be accepted.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {/* Overview */}
        <PolicySection title="Our Return Policy">
          <p>
            At Strings & Strands, we take great pride in the quality of our handcrafted jewellery.
            Every item is carefully inspected before dispatch. However, if you receive a damaged
            or defective product, we're here to make it right.
          </p>
          <p>
            We accept return/exchange requests <strong>only for damaged or defective products</strong>,
            subject to the conditions listed below. We do not accept returns based on personal
            preference or change of mind.
          </p>
        </PolicySection>

        {/* How to Claim */}
        <div>
          <h2
            className="text-lg font-bold text-[#B3184F] mb-6 pb-2 border-b border-[#FFD1E3]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            How to Raise a Return / Exchange
          </h2>
          <div className="space-y-4">
            {STEPS.map(step => (
              <div key={step.num} className="bg-white rounded-2xl p-5 flex gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#FF2D74] text-[#FFEAF2] text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#B3184F] mb-1">{step.title}</p>
                  <p className="text-xs text-[#B3184F]/60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact to Send Video */}
        <div className="bg-[#FF2D74] rounded-2xl p-6 text-[#FFEAF2]">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle size={22} />
            <h2 className="text-base font-bold">Send Your Unboxing Video Here</h2>
          </div>
          <p className="text-[#FFEAF2]/80 text-xs leading-relaxed mb-5">
            Send a WhatsApp message with your unboxing video clearly showing the defect,
            your order ID, and your name to our support number:
          </p>
          <a
            href="https://wa.me/917000863158?text=Hi%2C%20I%20want%20to%20raise%20a%20return%20claim%20for%20my%20order.%20Attaching%20the%20unboxing%20video."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#FF2D74] text-[11px] font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#FFEAF2] transition-colors"
          >
            <MessageCircle size={14} />
            WhatsApp: +91 70008 63158
          </a>
          <div className="mt-4 flex items-center gap-2 text-[#FFEAF2]/60 text-[11px]">
            <Clock size={13} />
            <span>Claim must be raised within 48 hours of delivery</span>
          </div>
        </div>

        {/* Eligible & Not Eligible */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={18} className="text-green-500" />
              <h3 className="text-sm font-bold text-[#B3184F]">Eligible for Return / Exchange</h3>
            </div>
            <ul className="space-y-2.5">
              {ELIGIBLE.map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-[#B3184F]/60">
                  <CheckCircle size={13} className="text-green-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={18} className="text-red-400" />
              <h3 className="text-sm font-bold text-[#B3184F]">Not Eligible</h3>
            </div>
            <ul className="space-y-2.5">
              {NOT_ELIGIBLE.map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-[#B3184F]/60">
                  <XCircle size={13} className="text-red-300 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Refund Timeline */}
        <PolicySection title="Refund Timeline">
          <p>
            Once your return is approved and the item is picked up and received by us,
            refunds are processed within <strong>5–7 business days</strong>.
          </p>
          <p>
            Refunds are issued to the original payment method. UPI and card refunds typically
            reflect within 3–5 business days after processing. COD orders will be refunded
            via bank transfer — please share your bank details when raising the claim.
          </p>
        </PolicySection>

        {/* Exchange */}
        <PolicySection title="Exchanges">
          <p>
            We offer exchanges for the same product (replacement) where the item received
            was defective or damaged. Exchanges for different products or styles are not
            available at this time.
          </p>
        </PolicySection>

        <div className="bg-[#FFEAF2] border border-[#FFD1E3] rounded-2xl p-5 flex gap-3 items-start">
          <AlertTriangle size={16} className="text-[#FF2D74] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B3184F]/70 leading-relaxed">
            Strings & Strands reserves the right to reject return claims that do not meet
            the above conditions or where the unboxing video does not clearly show the
            reported defect. Our decision is final and binding.
          </p>
        </div>
      </section>
    </div>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-lg font-bold text-[#B3184F] mb-4 pb-2 border-b border-[#FFD1E3]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm text-[#B3184F]/70 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
