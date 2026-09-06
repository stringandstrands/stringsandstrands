import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { CheckCircle, XCircle, Package, CreditCard, Copy, Check, ShoppingBag, RefreshCw } from 'lucide-react';

interface OrderConfirmState {
  success: boolean;
  orderId?: string;
  shiprocketOrderId?: string;
  razorpayPaymentId?: string;
  customerName?: string;
  shiprocketFailed?: boolean;
  paymentFailed?: boolean;
  error?: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="ml-2 text-[#D41E5C]/60 hover:text-[#FF2D74] transition-colors"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(24)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${(i * 4.3 + Math.sin(i) * 8) % 100}%`,
            top: '-8px',
            backgroundColor: ['#FF2D74', '#FFD1E3', '#B3184F', '#FF8FB1', '#FFE8F0'][i % 5],
            animation: `fall ${1.8 + (i % 5) * 0.3}s ease-in ${(i * 0.15) % 2}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function OrderConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as OrderConfirmState | null;

  useEffect(() => {
    if (!state) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  const safeOrderId = state.orderId ? String(state.orderId) : '';
  const shortOrderId = safeOrderId ? safeOrderId.slice(0, 8).toUpperCase() : null;

  // SUCCESS
  if (state.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff5f8] via-white to-[#fff0f5] flex items-center justify-center px-4 py-16 relative overflow-hidden">
        <Confetti />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2D74]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-2xl shadow-[#FF2D74]/10 border border-[#FFD1E3] overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF2D74] to-[#B3184F] px-8 py-10 text-center relative overflow-hidden">
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border-2 border-white/30">
                  <CheckCircle className="text-white" size={42} strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Order Confirmed!
                </h1>
                <p className="text-white/80 text-sm">
                  Thank you{state.customerName ? `, ${state.customerName.split(' ')[0]}` : ''}! Your jewellery is on its way.
                </p>
              </div>
            </div>

            <div className="px-8 py-7">
              <p className="text-[#B3184F]/80 text-sm text-center mb-6">
                Your order has been placed and handed over to our shipping partner. You will receive tracking updates soon.
              </p>

              <div className="space-y-3 mb-7">
                {shortOrderId && (
                  <div className="flex items-center justify-between bg-[#fff5f8] border border-[#FFD1E3] rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#FFD1E3] rounded-xl flex items-center justify-center">
                        <ShoppingBag size={16} className="text-[#B3184F]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#B3184F]/60 uppercase tracking-wider">Order ID</p>
                        <p className="font-bold text-[#B3184F] font-mono text-sm">#{shortOrderId}</p>
                      </div>
                    </div>
                    <CopyButton value={safeOrderId} />
                  </div>
                )}

                {state.shiprocketOrderId && (
                  <div className="flex items-center justify-between bg-[#fff5f8] border border-[#FFD1E3] rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#FFD1E3] rounded-xl flex items-center justify-center">
                        <Package size={16} className="text-[#B3184F]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#B3184F]/60 uppercase tracking-wider">Shiprocket Order ID</p>
                        <p className="font-bold text-[#B3184F] font-mono text-sm">{state.shiprocketOrderId}</p>
                      </div>
                    </div>
                    <CopyButton value={String(state.shiprocketOrderId)} />
                  </div>
                )}

                {state.razorpayPaymentId && (
                  <div className="flex items-center justify-between bg-[#fff5f8] border border-[#FFD1E3] rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#FFD1E3] rounded-xl flex items-center justify-center">
                        <CreditCard size={16} className="text-[#B3184F]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#B3184F]/60 uppercase tracking-wider">Payment ID</p>
                        <p className="font-bold text-[#B3184F] font-mono text-xs truncate max-w-[180px]">{state.razorpayPaymentId}</p>
                      </div>
                    </div>
                    <CopyButton value={String(state.razorpayPaymentId)} />
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
                <div className="text-green-500 mt-0.5 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <p className="text-green-700 text-xs leading-relaxed">
                  A confirmation email has been sent to your registered email address with order details and tracking information.
                </p>
              </div>

              <Link to="/">
                <button className="w-full py-4 bg-gradient-to-r from-[#FF2D74] to-[#B3184F] text-white font-bold text-base rounded-2xl hover:shadow-lg hover:shadow-[#FF2D74]/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>

          <p className="text-center text-[#D41E5C]/50 text-xs mt-5">
            Strings &amp; Strands &mdash; Timeless jewellery for every chapter
          </p>
        </div>
      </div>
    );
  }

  // FAILURE
  const isShippingFailure = state.shiprocketFailed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f8] via-white to-[#fff0f5] flex items-center justify-center px-4 py-16 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl shadow-red-500/10 border border-red-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-700 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
              <XCircle className="text-white" size={42} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Order Cannot Be Placed
            </h1>
            <p className="text-white/80 text-sm">
              {isShippingFailure
                ? 'Payment received but shipping order could not be created.'
                : 'Something went wrong while processing your order.'}
            </p>
          </div>

          <div className="px-8 py-7">
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 mb-5">
              <p className="text-red-700 text-sm font-semibold mb-1">What happened?</p>
              <p className="text-red-600 text-sm leading-relaxed">
                {isShippingFailure
                  ? 'Your payment was successfully processed via Razorpay, but our shipping partner (Shiprocket) could not create the shipment at this time.'
                  : (state.error || 'The order could not be completed. Your payment may not have been captured.')}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5 flex items-start gap-3">
              <div className="text-amber-500 mt-0.5 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-amber-800 text-sm font-bold mb-1">Refund Policy</p>
                <p className="text-amber-700 text-sm leading-relaxed">
                  If any amount was deducted from your account, it will be <strong>automatically refunded to your source account within 5 to 7 business days</strong>. No action is required from you.
                </p>
              </div>
            </div>

            {(state.orderId || state.razorpayPaymentId) && (
              <div className="border border-[#FFD1E3] rounded-2xl p-4 mb-5 space-y-2">
                <p className="text-xs font-bold text-[#B3184F]/60 uppercase tracking-wider mb-3">Reference IDs (Save for Support)</p>
                {state.orderId && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#B3184F]/70">Order Ref</span>
                    <div className="flex items-center">
                      <span className="font-mono text-xs text-[#B3184F] font-semibold">{state.orderId.slice(0, 8).toUpperCase()}</span>
                      <CopyButton value={state.orderId} />
                    </div>
                  </div>
                )}
                {state.razorpayPaymentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#B3184F]/70">Payment Ref</span>
                    <div className="flex items-center">
                      <span className="font-mono text-xs text-[#B3184F] font-semibold truncate max-w-[160px]">{state.razorpayPaymentId}</span>
                      <CopyButton value={state.razorpayPaymentId} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Link to="/checkout">
                <button className="w-full py-4 bg-gradient-to-r from-[#FF2D74] to-[#B3184F] text-white font-bold text-base rounded-2xl hover:shadow-lg hover:shadow-[#FF2D74]/30 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  <RefreshCw size={18} />
                  Try Again
                </button>
              </Link>
              <Link to="/">
                <button className="w-full py-3 border-2 border-[#FFD1E3] text-[#B3184F] font-semibold text-sm rounded-2xl hover:border-[#FF2D74] hover:bg-[#fff5f8] transition-all">
                  Return to Home
                </button>
              </Link>
            </div>

            <p className="text-center text-[#D41E5C]/50 text-xs mt-5">
              Need help? Email us at{' '}
              <a href="mailto:stringandstrands26@gmail.com" className="text-[#FF2D74] hover:underline">
                stringandstrands26@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}