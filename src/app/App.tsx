import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router';
import { AnnouncementBar, Header, Footer } from './Shared';
import HomePage from './HomePage';
import CategoryPage from './CategoryPage';
import ProductPage from './ProductPage';
import WishlistPage from './WishlistPage';
import SearchPage from './SearchPage';
import CheckoutPage from './CheckoutPage';
import ProfilePage from './ProfilePage';
import ResetPasswordPage from './ResetPasswordPage';
import OrderConfirmPage from './OrderConfirmPage';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import ShippingPolicyPage from './ShippingPolicyPage';
import ReturnsPage from './ReturnsPage';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import TermsPage from './TermsPage';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import AdminApp from './admin/AdminApp';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { CartProvider, useCart } from '../lib/CartContext';
import { WishlistProvider, useWishlist } from '../lib/WishlistContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const { user, signOut } = useAuth();
  const { cartCount, openDrawer } = useCart();
  const { wishlist, toggleWishlist, isWishlisted } = useWishlist();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  // Wrapper for wishlist toggle that requires auth
  const handleWishlistToggle = async (productId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    await toggleWishlist(productId);
  };

  return (
    <div className="min-h-screen bg-white pb-14 md:pb-0 flex flex-col">
      <ScrollToTop />
      <AnnouncementBar />
      <Header
        cartCount={cartCount}
        onCartClick={openDrawer}
        onAccountClick={() => user ? navigate('/profile') : setAuthModalOpen(true)}
        isLoggedIn={!!user}
        userName={user?.email?.split('@')[0]}
      />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage wishlist={wishlist} toggleWishlist={handleWishlistToggle} isWishlisted={isWishlisted} />} />
          <Route path="/category/:categoryId" element={<CategoryPage wishlist={wishlist} toggleWishlist={handleWishlistToggle} isWishlisted={isWishlisted} type="category" />} />
          <Route path="/bestsellers" element={<CategoryPage wishlist={wishlist} toggleWishlist={handleWishlistToggle} isWishlisted={isWishlisted} type="bestsellers" />} />
          <Route path="/new-arrivals" element={<CategoryPage wishlist={wishlist} toggleWishlist={handleWishlistToggle} isWishlisted={isWishlisted} type="new-arrivals" />} />
          <Route path="/occasion/:occasionId" element={<CategoryPage wishlist={wishlist} toggleWishlist={handleWishlistToggle} isWishlisted={isWishlisted} type="occasion" />} />
          <Route path="/product/:productId" element={<ProductPage wishlist={wishlist} toggleWishlist={handleWishlistToggle} isWishlisted={isWishlisted} />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/search" element={<SearchPage wishlist={wishlist} toggleWishlist={handleWishlistToggle} isWishlisted={isWishlisted} />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirm" element={<OrderConfirmPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </div>
      <Footer />
      <CartDrawer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin panel — fully isolated, no customer layout */}
          <Route path="/admin/*" element={<AdminApp />} />
          {/* Customer site */}
          <Route path="/*" element={
            <CartProvider>
              <WishlistProvider>
                <AppContent />
              </WishlistProvider>
            </CartProvider>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
