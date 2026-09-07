import { useEffect, useState } from "react";
import { X, Truck } from "lucide-react";

export default function InstagramPopup() {
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup only for visitors coming from Instagram
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source");

    if (source?.toLowerCase() === "instagram") {
      const alreadyShown = sessionStorage.getItem("instagram_popup_shown");

      if (!alreadyShown) {
        const timer = setTimeout(() => {
          setShow(true);
          // Small delay to allow the DOM to render before adding the transition class
          setTimeout(() => setIsVisible(true), 50);
          sessionStorage.setItem("instagram_popup_shown", "true");
        }, 800);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (!show) return null;

  const handleClose = () => {
    setIsVisible(false);
    // Wait for the transition to finish before removing from DOM
    setTimeout(() => setShow(false), 300);
  };

  const handleShopNow = () => {
    handleClose();
    // Remove the tracking param from the URL cleanly
    window.history.replaceState({}, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center transition-all duration-300 transform ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <Truck className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">
          FREE DELIVERY
        </h2>

        <p className="text-lg font-semibold text-amber-700 mb-4">
          On orders above ₹499
        </p>

        <p className="text-gray-500 text-sm leading-relaxed mb-8 mx-auto max-w-[280px]">
          Shop your favourite pieces from Strings & Strands and enjoy Free
          Delivery on orders of ₹499 or more.
        </p>

        <button
          onClick={handleShopNow}
          className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] tracking-wide"
        >
          SHOP NOW
        </button>

        <p className="text-xs text-gray-400 mt-4">
          *Free Delivery available on eligible orders above ₹499.
        </p>
      </div>
    </div>
  );
}
