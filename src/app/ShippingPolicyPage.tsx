import React from 'react';
import { Truck, Clock, MapPin, Package, PhoneCall, AlertCircle } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: <Truck size={20} />, label: 'Free Shipping', desc: 'On all orders above ₹499 across India' },
  { icon: <Clock size={20} />, label: '5–7 Business Days', desc: 'Standard delivery timeline' },
  { icon: <MapPin size={20} />, label: 'Pan-India Delivery', desc: 'Delivered via Shiprocket\'s network' },
  { icon: <Package size={20} />, label: 'Gift-Ready Packaging', desc: 'All orders packed with care' },
];

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FFEAF2]">
      {/* Header */}
      <section className="bg-[#B3184F] text-[#FFEAF2] py-20 px-4 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #FF2D74 0%, transparent 60%)' }}
        />
        <div className="relative">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#FFD1E3]/70 mb-4">Delivery Information</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Shipping Policy
          </h1>
          <p className="text-[#FFEAF2]/60 text-sm max-w-md mx-auto">
            Last updated: September 2026
          </p>
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-5xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {HIGHLIGHTS.map(h => (
            <div key={h.label} className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#FF2D74] text-[#FFEAF2] flex items-center justify-center">
                {h.icon}
              </div>
              <p className="text-xs font-bold text-[#B3184F]">{h.label}</p>
              <p className="text-[11px] text-[#B3184F]/50 leading-snug">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Policy Content */}
      <section className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <PolicySection title="1. Our Logistics Partner">
          <p>
            All orders placed on Strings & Strands are fulfilled and shipped through{' '}
            <strong>Shiprocket</strong> — India's leading e-commerce logistics platform.
            Shiprocket manages order pickup, transit, and last-mile delivery using their
            extensive courier network including Delhivery, BlueDart, Ekart, Xpressbees,
            and other courier partners.
          </p>
          <p>
            The choice of courier partner for your shipment is determined automatically by
            Shiprocket based on your delivery pin code, serviceability, and best estimated
            delivery time.
          </p>
        </PolicySection>

        <PolicySection title="2. Order Processing Time">
          <p>
            Orders are processed within <strong>1–2 business days</strong> after payment
            confirmation. Business days are Monday to Saturday, excluding public holidays.
          </p>
          <p>
            During high-demand periods (festival seasons, sale events), processing may
            take up to <strong>3 business days</strong>. We will notify you in such cases.
          </p>
        </PolicySection>

        <PolicySection title="3. Delivery Timelines">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#FF2D74] text-[#FFEAF2]">
                  <th className="text-left px-4 py-2.5 text-xs rounded-tl-xl">Shipping Type</th>
                  <th className="text-left px-4 py-2.5 text-xs">Estimated Delivery</th>
                  <th className="text-left px-4 py-2.5 text-xs rounded-tr-xl">Charges</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b border-[#FFD1E3]">
                  <td className="px-4 py-3 text-[#B3184F] font-medium">Standard Shipping</td>
                  <td className="px-4 py-3 text-gray-600">5–7 business days</td>
                  <td className="px-4 py-3 text-gray-600">Free above ₹499 | ₹59 below</td>
                </tr>
                <tr className="bg-[#FFEAF2] border-b border-[#FFD1E3]">
                  <td className="px-4 py-3 text-[#B3184F] font-medium">Express Shipping</td>
                  <td className="px-4 py-3 text-gray-600">2–3 business days</td>
                  <td className="px-4 py-3 text-gray-600">₹100 (where available)</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 text-[#B3184F] font-medium">Remote Areas</td>
                  <td className="px-4 py-3 text-gray-600">7–10 business days</td>
                  <td className="px-4 py-3 text-gray-600">May vary</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#B3184F]/50">
            * Delivery timelines are estimates and may vary due to courier delays, natural events,
            or circumstances beyond our control.
          </p>
        </PolicySection>

        <PolicySection title="4. Order Tracking">
          <p>
            Once your order is shipped, you will receive an SMS and/or email containing your
            <strong> AWB (tracking) number</strong> and the courier partner's name.
          </p>
          <p>
            You can track your shipment directly on the courier partner's website using the AWB number,
            or via the <strong>Shiprocket tracking portal</strong> at{' '}
            <a
              href="https://shiprocket.co/tracking"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF2D74] hover:underline"
            >
              shiprocket.co/tracking
            </a>.
          </p>
          <p>
            For any tracking issues, please contact us directly at{' '}
            <a href="tel:+917000863158" className="text-[#FF2D74] hover:underline">+91 70008 63158</a> or{' '}
            <a href="mailto:stringsandstrands26@gmail.com" className="text-[#FF2D74] hover:underline">
              stringsandstrands26@gmail.com
            </a>.
          </p>
        </PolicySection>

        <PolicySection title="5. Serviceability & Non-Deliverable Areas">
          <p>
            Shiprocket serves <strong>29,000+ pin codes</strong> across India. However, some
            remote or restricted areas may not be serviceable.
          </p>
          <p>
            If your pin code is not serviceable, our team will contact you within 24 hours
            of order placement to arrange an alternative or issue a full refund.
          </p>
        </PolicySection>

        <PolicySection title="6. Cash on Delivery (COD)">
          <p>
            Cash on Delivery is available at select pin codes as determined by Shiprocket's
            courier network. COD availability is shown at checkout.
          </p>
          <p>
            Please note: COD orders that are refused at delivery may result in the customer
            being restricted from placing future COD orders.
          </p>
        </PolicySection>

        <PolicySection title="7. Undelivered & Returned Shipments">
          <p>
            If a shipment is returned to us due to an incorrect address, failed delivery
            attempts, or refusal to accept — the order will be cancelled and a refund
            (excluding any shipping charges) will be processed within 5–7 business days.
          </p>
          <p>
            Please ensure your delivery address, phone number, and PIN code are accurate
            at the time of placing your order.
          </p>
        </PolicySection>

        <PolicySection title="8. Contact for Shipping Queries">
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://wa.me/917000863158"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white border border-[#FFD1E3] rounded-xl px-4 py-3 hover:border-[#FF2D74] transition-colors"
            >
              <PhoneCall size={16} className="text-[#FF2D74]" />
              <div>
                <p className="text-[10px] text-[#B3184F]/50 uppercase tracking-widest">WhatsApp / Call</p>
                <p className="text-sm font-semibold text-[#B3184F]">+91 70008 63158</p>
              </div>
            </a>
            <a
              href="mailto:stringsandstrands26@gmail.com"
              className="flex items-center gap-3 bg-white border border-[#FFD1E3] rounded-xl px-4 py-3 hover:border-[#FF2D74] transition-colors"
            >
              <AlertCircle size={16} className="text-[#FF2D74]" />
              <div>
                <p className="text-[10px] text-[#B3184F]/50 uppercase tracking-widest">Email</p>
                <p className="text-sm font-semibold text-[#B3184F]">stringsandstrands26@gmail.com</p>
              </div>
            </a>
          </div>
        </PolicySection>
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
