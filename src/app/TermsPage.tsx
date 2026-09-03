import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFEAF2]">
      {/* Header */}
      <section className="bg-[#B3184F] text-[#FFEAF2] py-20 px-4 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #FF2D74 0%, transparent 60%)' }}
        />
        <div className="relative">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#FFD1E3]/70 mb-4">Legal</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Terms & Conditions
          </h1>
          <p className="text-[#FFEAF2]/60 text-sm">Last updated: September 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <p className="text-sm text-[#B3184F]/70 leading-relaxed">
          Please read these Terms and Conditions carefully before using the Strings & Strands
          website. By accessing or using our website and services, you agree to be bound by
          these terms.
        </p>

        <PolicySection title="1. Acceptance of Terms">
          <p>
            By placing an order or creating an account on our website, you confirm that you
            are at least 18 years of age (or have parental/guardian consent) and agree to
            comply with these Terms and Conditions.
          </p>
        </PolicySection>

        <PolicySection title="2. Products & Pricing">
          <p>
            All products listed on our website are subject to availability. We reserve the
            right to modify product listings, descriptions, or prices at any time without
            prior notice.
          </p>
          <p>
            Prices are displayed in Indian Rupees (₹) and are inclusive of applicable taxes.
            Shipping charges (if any) are calculated and shown at checkout.
          </p>
          <p>
            We make every effort to display accurate product images and descriptions. However,
            slight colour variations may occur due to screen display differences.
          </p>
        </PolicySection>

        <PolicySection title="3. Orders & Payment">
          <p>
            An order confirmation email constitutes acceptance of your order. We reserve the
            right to cancel any order due to stock unavailability, pricing errors, or suspected
            fraudulent activity.
          </p>
          <p>
            Payments are processed securely via <strong>Razorpay</strong>. We accept UPI,
            Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery (where available).
          </p>
          <p>
            In case of a payment failure, please do not retry immediately. Contact us at{' '}
            <a href="mailto:stringsandstrands26@gmail.com" className="text-[#FF2D74] hover:underline">
              stringsandstrands26@gmail.com
            </a>{' '}
            to confirm whether the payment was processed.
          </p>
        </PolicySection>

        <PolicySection title="4. Shipping & Delivery">
          <p>
            All shipping is handled by <strong>Shiprocket</strong> and its associated courier
            partners. Delivery timelines are estimates and may vary. Please refer to our{' '}
            <a href="/shipping-policy" className="text-[#FF2D74] hover:underline">
              Shipping Policy
            </a>{' '}
            for detailed information.
          </p>
        </PolicySection>

        <PolicySection title="5. Returns & Refunds">
          <p>
            Returns are accepted only for damaged or defective products, subject to the
            conditions outlined in our{' '}
            <a href="/returns" className="text-[#FF2D74] hover:underline">
              Return Policy
            </a>
            . An unboxing video is mandatory for all return claims.
          </p>
        </PolicySection>

        <PolicySection title="6. Intellectual Property">
          <p>
            All content on this website including product images, descriptions, logos, and
            design elements are the intellectual property of Strings & Strands. You may not
            reproduce, distribute, or use any content without prior written permission.
          </p>
        </PolicySection>

        <PolicySection title="7. User Accounts">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials.
            Any activity conducted under your account is your responsibility. Please contact us
            immediately if you suspect unauthorised access to your account.
          </p>
        </PolicySection>

        <PolicySection title="8. Limitation of Liability">
          <p>
            Strings & Strands shall not be liable for any indirect, incidental, or consequential
            damages arising from the use of our products or website. Our liability, in any case,
            shall not exceed the amount paid for the product in question.
          </p>
        </PolicySection>

        <PolicySection title="9. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India.
            Any disputes shall be subject to the exclusive jurisdiction of courts in India.
          </p>
        </PolicySection>

        <PolicySection title="10. Changes to Terms">
          <p>
            We reserve the right to update these Terms at any time. Changes will be posted on
            this page. Continued use of our website after changes are posted constitutes your
            acceptance of the revised terms.
          </p>
        </PolicySection>

        <PolicySection title="11. Contact">
          <div className="bg-white rounded-xl p-4 text-sm space-y-1 border border-[#FFD1E3]">
            <p className="font-semibold text-[#B3184F]">Strings & Strands</p>
            <p className="text-[#B3184F]/60">
              Email:{' '}
              <a href="mailto:stringsandstrands26@gmail.com" className="text-[#FF2D74] hover:underline">
                stringsandstrands26@gmail.com
              </a>
            </p>
            <p className="text-[#B3184F]/60">
              Phone:{' '}
              <a href="tel:+917000863158" className="text-[#FF2D74] hover:underline">
                +91 70008 63158
              </a>
            </p>
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
