import React, { createContext, useState } from 'react';

export const LanguageContext = createContext();

const translations = {
  en: {
    welcome: 'Welcome to Aamantran',
    menu: 'Menu',
    cart: 'Your Cart',
    checkout: 'Checkout',
    table: 'Table',
    dineIn: 'Dine-In',
    packing: 'Packing',
    placeOrder: 'Place Order',
    orderTracking: 'Live Order Tracker',
    kitchen: 'Kitchen Display',
    admin: 'Admin Dashboard',
    searchPlaceholder: 'Search dishes, momos, biryani...',
    vegOnly: 'Veg Only',
    nonVeg: 'Non-Veg',
    spiceLevel: 'Spice Level',
    customise: 'Customise',
    add: 'Add +',
    subtotal: 'Subtotal',
    tax: 'GST Tax',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    applyCoupon: 'Apply Coupon',
    couponPlaceholder: 'Enter coupon (e.g. WELCOME10)',
    selectPayment: 'Select Payment Method',
    payOnline: 'Pay Online (UPI / Card)',
    payCash: 'Cash at Counter',
    leaveReview: 'Rate Your Meal',
    reviewOnGoogle: 'Share on Google Maps'
  },
  hi: {
    welcome: 'गॉरमेट बाइट्स में आपका स्वागत है',
    menu: 'मेन्यू',
    cart: 'आपकी कार्ट',
    checkout: 'चेकआउट',
    table: 'टेबल',
    dineIn: 'यहाँ खाएं (Dine-In)',
    packing: 'पैकिंग (Takeaway)',
    placeOrder: 'ऑर्डर दें',
    orderTracking: 'लाइव ऑर्डर ट्रैकर',
    kitchen: 'रसोई (Kitchen)',
    admin: 'प्रबंधक (Admin)',
    searchPlaceholder: 'व्यंजनों, मोमोज, बिरयानी खोजें...',
    vegOnly: 'केवल शाकाहारी',
    nonVeg: 'मांसाहारी',
    spiceLevel: 'मसाला स्तर',
    customise: 'अनुकूलित करें',
    add: 'जोड़ें +',
    subtotal: 'उप-योग',
    tax: 'जीएसटी कर',
    discount: 'छूट',
    grandTotal: 'कुल राशि',
    applyCoupon: 'कूपन लागू करें',
    couponPlaceholder: 'कूपन दर्ज करें (जैसे WELCOME10)',
    selectPayment: 'भुगतान का तरीका चुनें',
    payOnline: 'ऑनलाइन भुगतान (UPI / कार्ड)',
    payCash: 'काउंटर पर नकद',
    leaveReview: 'अपने भोजन को रेट करें',
    reviewOnGoogle: 'Google मैप्स पर साझा करें'
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
