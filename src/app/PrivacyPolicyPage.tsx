import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FFEAF2]">
      {/* Header */}
      <section className="bg-[#B3184F] text-[#FFEAF2] py-20 px-4 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #FF2D74 0%, transparent 60%)' }}
        />
        <div className="relative">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#FFD1E3]/70 mb-4">Legal</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Privacy Policy
          </h1>
          <p className="text-[#FFEAF2]/60 text-sm">Last updated: September 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <p className="text-sm text-[#B3184F]/70 leading-relaxed">
          Welcome to Strings & Strands. We respect your privacy and are committed to protecting
          your personal data. This Privacy Policy explains how we collect, use, and safeguard
          your information when you visit our website or make a purchase.
        </p>

        <PolicySection title="1. Information We Collect">
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#B3184F]/70 text-sm">
            <li><strong>Personal Information:</strong> Name, email address, phone number, and shipping address provided during account registration or checkout.</li>
            <li><strong>Payment Information:</strong> Payment transactions are processed securely by Razorpay. We do not store your card or UPI details on our servers.</li>
            <li><strong>Order Information:</strong> Details of products purchased, order history, and delivery information.</li>
            <li><strong>Usage Data:</strong> Information about how you browse and interact with our website (pages visited, time spent, etc.) collected via cookies.</li>
          </ul>
        </PolicySection>

        <PolicySection title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-2 text-[#B3184F]/70 text-sm">
            <li>To process and fulfil your orders</li>
            <li>To send order confirmation, shipping updates, and delivery notifications</li>
            <li>To respond to customer service queries</li>
            <li>To send promotional communications (only with your consent)</li>
            <li>To improve our website and product offerings</li>
            <li>To comply with legal obligations</li>
          </ul>
        </PolicySection>

        <PolicySection title="3. Data Storage & Security">
          <p>
            Your account data, order history, and wishlist are stored securely using{' '}
            <strong>Database</strong> (a secure cloud database platform). All data is
            encrypted in transit using SSL/TLS.
          </p>
          <p>
            Payment processing is handled by <strong>Razorpay</strong>, which is PCI-DSS
            compliant. We do not have access to your full payment credentials.
          </p>
        </PolicySection>

        <PolicySection title="4. Sharing Your Information">
          <p>We do not sell or rent your personal data. We share your information only with:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#B3184F]/70 text-sm">
            <li><strong>Shiprocket & courier partners</strong> — to deliver your orders (name, address, phone)</li>
            <li><strong>Razorpay</strong> — to process payments</li>
            <li><strong>Database</strong> — for secure data storage</li>
            <li><strong>Legal authorities</strong> — when required by law</li>
          </ul>
        </PolicySection>

        <PolicySection title="5. Cookies">
          <p>
            Our website uses cookies to improve your browsing experience. Cookies help us
            remember your cart, preferences, and login state. You can disable cookies
            in your browser settings, but this may affect functionality.
          </p>
        </PolicySection>

        <PolicySection title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#B3184F]/70 text-sm">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:stringsandstrands26@gmail.com" className="text-[#FF2D74] hover:underline">
              stringsandstrands26@gmail.com
            </a>.
          </p>
        </PolicySection>

        <PolicySection title="7. Third-Party Links">
          <p>
            Our website may contain links to third-party websites. We are not responsible
            for their privacy practices. Please read their privacy policies before providing
            any personal information.
          </p>
        </PolicySection>

        <PolicySection title="8. Children's Privacy">
          <p>
            Our services are not directed to children under 13 years of age. We do not
            knowingly collect personal information from children.
          </p>
        </PolicySection>

        <PolicySection title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted
            on this page with an updated revision date. Continued use of our website
            constitutes acceptance of the updated policy.
          </p>
        </PolicySection>

        <PolicySection title="10. Contact Us">
          <p>
            For any privacy-related questions, please contact us at:
          </p>
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
