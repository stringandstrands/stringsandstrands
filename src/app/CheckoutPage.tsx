import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [shipping, setShipping] = useState({
    email: user?.email || '',
    full_name: user?.user_metadata?.name || '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: ''
  });

  const subtotalAfterDiscount = cartTotal;
  const SHIPPING_THRESHOLD = 499;
  const SHIPPING_FEE = 0; // Temporarily 0 for testing
  const shippingCharge = subtotalAfterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const orderTotal = subtotalAfterDiscount + shippingCharge;





  // Load saved addresses
  useEffect(() => {
    if (user) {
      supabase.from('addresses').select('*').eq('user_id', user.id).then(({ data }) => {
        if (data && data.length > 0) setSavedAddresses(data);
      });
    } else {
      const guestAddr = localStorage.getItem('guest_address');
      if (guestAddr) {
        try {
          const parsed = JSON.parse(guestAddr);
          setSavedAddresses([parsed]);
        } catch (e) {}
      }
    }
  }, [user]);

  // Dynamically load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // 1. Call backend create-order (ONLY initializes Razorpay)
      const apiBase = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
      const response = await fetch(`${apiBase}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderTotal
        })
      });
      
      const orderData = await response.json();
      if (orderData.error) throw new Error(orderData.error);

      // 2. Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Strings & Strands",
        description: "Jewellery Purchase",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify payment on backend AND create DB records
          try {
            const verifyRes = await fetch(`${apiBase}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: orderTotal,
                userId: user?.id,
                guestEmail: user ? undefined : shipping.email,
                shippingAddress: shipping,
                cartItems: cartItems
              })
            });
            let verifyData;
            try {
              verifyData = await verifyRes.json();
            } catch (parseErr) {
              console.error('Failed to parse verify response:', parseErr);
              throw new Error('Server returned an invalid response (possibly 502 Bad Gateway). Please try again in a minute.');
            }

            if (verifyData.success) {
              // All good — order + Shiprocket ID created
              if (!user) localStorage.setItem('guest_address', JSON.stringify(shipping));
              await clearCart();
              navigate('/order-confirm', {
                state: {
                  success: true,
                  orderId: verifyData.orderId,
                  shiprocketOrderId: verifyData.shiprocketOrderId,
                  razorpayPaymentId: verifyData.razorpayPaymentId,
                  customerName: shipping.full_name || user?.user_metadata?.name || '',
                },
              });
            } else if (verifyData.shiprocketFailed) {
              // Payment ok but Shiprocket failed
              if (!user) localStorage.setItem('guest_address', JSON.stringify(shipping));
              await clearCart();
              navigate('/order-confirm', {
                state: {
                  success: false,
                  shiprocketFailed: true,
                  orderId: verifyData.orderId,
                  razorpayPaymentId: verifyData.razorpayPaymentId,
                  error: verifyData.error,
                },
              });
            } else {
              // General failure
              navigate('/order-confirm', {
                state: {
                  success: false,
                  paymentFailed: verifyData.paymentFailed ?? true,
                  error: verifyData.detail || verifyData.error || 'Payment verification failed. Please contact support.',
                },
              });
            }
          } catch (err) {
            console.error('Verify error:', err);
            navigate('/order-confirm', {
              state: {
                success: false,
                paymentFailed: true,
                error: 'An unexpected error occurred. If any amount was deducted, it will be refunded within 7 business days.',
              },
            });
          }
        },
        prefill: {
          name: shipping.full_name,
          email: user?.email || shipping.email,
          contact: shipping.phone
        },
        theme: {
          color: "#FF2D74"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fff5f8]/50 min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-10">
          <ShoppingBag size={28} className="text-[#FF2D74]" />
          <h1 className="text-4xl font-bold text-[#FF2D74]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Secure Checkout
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#FFD1E3] shadow-sm">
            <p className="text-[#B3184F] font-semibold mb-6 text-lg">Your cart is empty</p>
            <Link to="/">
              <button className="px-10 py-4 bg-[#FF2D74] text-white font-bold rounded-full hover:bg-[#D41E5C] transition-colors shadow-lg shadow-[#FF2D74]/20">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            
            {/* Shipping Form */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#FFD1E3] shadow-sm h-fit min-w-0">
              <h2 className="font-bold text-[#FF2D74] text-xl mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FF2D74] text-white flex items-center justify-center text-sm">1</span>
                Shipping Details
              </h2>
              
              {savedAddresses.length > 0 && (
                <div className="mb-8">
                  <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-3">Use a Saved Address</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar">
                    {savedAddresses.map((addr, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setShipping({ ...shipping, ...addr, email: addr.email || shipping.email || user?.email || '' })}
                        className="flex-shrink-0 text-left border border-[#FFD1E3] bg-[#fff5f8]/50 p-4 rounded-2xl min-w-[240px] hover:border-[#FF2D74] hover:bg-[#FFD1E3]/30 transition-all snap-start"
                      >
                        <p className="font-bold text-[#B3184F] text-sm truncate">{addr.full_name}</p>
                        <p className="text-xs text-[#D41E5C] truncate mt-1">{addr.address_line1}</p>
                        <p className="text-xs text-[#D41E5C] truncate">{addr.city}, {addr.state} {addr.pincode}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form id="checkout-form" onSubmit={handlePay} className="space-y-4">
                {!user && (
                  <div>
                    <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Email Address</label>
                    <input required type="email" name="email" value={shipping.email} onChange={handleInputChange} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] focus:border-transparent outline-none transition-all text-[#2a1e12]" />
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Full Name</label>
                    <input required type="text" name="full_name" value={shipping.full_name} onChange={handleInputChange} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] focus:border-transparent outline-none transition-all text-[#2a1e12]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Phone Number</label>
                    <input required type="tel" name="phone" value={shipping.phone} onChange={handleInputChange} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] focus:border-transparent outline-none transition-all text-[#2a1e12]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Address Line 1</label>
                  <input required type="text" name="address_line1" value={shipping.address_line1} onChange={handleInputChange} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] focus:border-transparent outline-none transition-all text-[#2a1e12]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Address Line 2 (Optional)</label>
                  <input type="text" name="address_line2" value={shipping.address_line2} onChange={handleInputChange} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] focus:border-transparent outline-none transition-all text-[#2a1e12]" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">City</label>
                    <input required type="text" name="city" value={shipping.city} onChange={handleInputChange} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] focus:border-transparent outline-none transition-all text-[#2a1e12]" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">State</label>
                    <input required type="text" name="state" value={shipping.state} onChange={handleInputChange} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] focus:border-transparent outline-none transition-all text-[#2a1e12]" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">PIN Code</label>
                    <input required type="text" name="pincode" value={shipping.pincode} onChange={handleInputChange} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] focus:border-transparent outline-none transition-all text-[#2a1e12]" />
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#FFD1E3] shadow-sm flex flex-col h-fit sticky top-24">
              <h2 className="font-bold text-[#FF2D74] text-xl mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FF2D74] text-white flex items-center justify-center text-sm">2</span>
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-sm font-semibold text-[#B3184F] line-clamp-2 leading-snug mb-1">{item.name}</p>
                      <p className="text-xs text-[#D41E5C] font-medium">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-[#FF2D74] py-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t-2 border-dashed border-[#FFD1E3] pt-6 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#B3184F] font-medium">Subtotal</span>
                  <span className="font-bold text-[#FF2D74]">₹{cartTotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#B3184F] font-medium">Shipping</span>
                  {shippingCharge === 0 ? (
                    <span className="font-bold text-[#10b981]">FREE</span>
                  ) : (
                    <span className="font-bold text-[#FF2D74]">₹{shippingCharge}</span>
                  )}
                </div>
                {shippingCharge > 0 && (
                  <p className="text-[10px] text-[#B3184F]/50 mt-2 text-right">
                    Add ₹{SHIPPING_THRESHOLD - cartTotal} more for free shipping
                  </p>
                )}
              </div>
              
              <div className="bg-[#fff5f8] -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 rounded-b-3xl">
                <div className="flex justify-between items-end mb-6">
                  <span className="font-bold text-[#B3184F] uppercase tracking-wider text-sm">Total to pay</span>
                  <span className="font-bold text-[#FF2D74] text-3xl leading-none">₹{orderTotal.toLocaleString()}</span>
                </div>
                <button 
                  type="submit" 
                  form="checkout-form"
                  disabled={loading}
                  className="w-full py-4 bg-[#FF2D74] text-white font-bold text-lg rounded-2xl hover:bg-[#D41E5C] hover:shadow-lg hover:shadow-[#FF2D74]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : 'Pay Now'}
                </button>
                <div className="flex items-center justify-center gap-2 mt-4 text-[#D41E5C]/60 text-xs font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Payments processed securely by Razorpay
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
