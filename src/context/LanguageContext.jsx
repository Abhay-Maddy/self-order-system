import React, { createContext, useState } from 'react';

export const LanguageContext = createContext();

const translations = {
  en: {
    // Branding
    brandName: 'Aamantran',
    brandSub: 'Self-Ordering Platform',
    // Navigation
    customerMenu: 'Customer Menu',
    kitchenPass: 'Kitchen Pass',
    adminPortal: 'Admin Portal',
    staffLogin: 'Staff Login',
    logout: 'Logout',
    // Menu
    welcome: 'Welcome to Aamantran',
    menu: 'Menu',
    allItems: 'All Items',
    searchPlaceholder: 'Search dishes, starters...',
    vegOnly: 'Veg Only',
    nonVeg: 'Non-Veg',
    // Cart
    cart: 'Your Cart',
    yourCart: 'Your Cart',
    addToCart: 'Add to Cart',
    add: 'Add +',
    customise: 'Customise',
    emptyCart: 'Your cart is empty',
    // Order
    checkout: 'Checkout',
    placeOrder: 'Place Order',
    orderTracking: 'Live Order Tracker',
    orderHistory: 'Order History',
    trackOrder: 'Track Active Order',
    // Table
    table: 'Table',
    switchTable: 'Switch Table',
    selectTable: 'Select Table Number',
    // Payment
    subtotal: 'Subtotal',
    tax: 'GST Tax',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    applyCoupon: 'Apply Coupon',
    couponPlaceholder: 'Enter coupon (e.g. WELCOME10)',
    selectPayment: 'Select Payment Method',
    payOnline: 'Pay Online (UPI / Card)',
    payCash: 'Cash at Counter',
    // Dining type
    dineIn: 'Dine-In',
    packing: 'Packing / Takeaway',
    // Status
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    served: 'Served',
    // Reviews
    leaveReview: 'Rate Your Meal',
    reviewOnGoogle: 'Share on Google Maps',
    // Staff Panels
    kitchen: 'Kitchen Display',
    admin: 'Admin Dashboard',
    // Category labels (common)
    starters: 'Starters & Appetizers',
    mainCourse: 'Main Course',
    beverages: 'Beverages',
    desserts: 'Desserts',
    // Misc
    spiceLevel: 'Spice Level',
    mild: 'Mild',
    medium: 'Medium',
    hot: 'Hot',
    veryHot: 'Very Hot',
    noItems: 'No items found',
    loading: 'Loading...',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No'
  },
  hi: {
    // Branding
    brandName: 'आमंत्रण',
    brandSub: 'स्व-ऑर्डरिंग प्लेटफ़ॉर्म',
    // Navigation
    customerMenu: 'ग्राहक मेन्यू',
    kitchenPass: 'रसोई पास',
    adminPortal: 'प्रशासन पोर्टल',
    staffLogin: 'स्टाफ लॉगिन',
    logout: 'लॉगआउट',
    // Menu
    welcome: 'आमंत्रण में आपका स्वागत है',
    menu: 'मेन्यू',
    allItems: 'सभी व्यंजन',
    searchPlaceholder: 'व्यंजन खोजें...',
    vegOnly: 'केवल शाकाहारी',
    nonVeg: 'मांसाहारी',
    // Cart
    cart: 'आपकी कार्ट',
    yourCart: 'आपकी कार्ट',
    addToCart: 'कार्ट में जोड़ें',
    add: 'जोड़ें +',
    customise: 'अनुकूलित करें',
    emptyCart: 'आपकी कार्ट खाली है',
    // Order
    checkout: 'चेकआउट',
    placeOrder: 'ऑर्डर दें',
    orderTracking: 'लाइव ऑर्डर ट्रैकर',
    orderHistory: 'ऑर्डर इतिहास',
    trackOrder: 'सक्रिय ऑर्डर ट्रैक करें',
    // Table
    table: 'टेबल',
    switchTable: 'टेबल बदलें',
    selectTable: 'टेबल नंबर चुनें',
    // Payment
    subtotal: 'उप-योग',
    tax: 'जीएसटी कर',
    discount: 'छूट',
    grandTotal: 'कुल राशि',
    applyCoupon: 'कूपन लागू करें',
    couponPlaceholder: 'कूपन दर्ज करें (जैसे WELCOME10)',
    selectPayment: 'भुगतान का तरीका चुनें',
    payOnline: 'ऑनलाइन भुगतान (UPI / कार्ड)',
    payCash: 'काउंटर पर नकद',
    // Dining type
    dineIn: 'यहाँ खाएं',
    packing: 'पैकिंग / टेकअवे',
    // Status
    pending: 'प्रतीक्षित',
    preparing: 'तैयार हो रहा है',
    ready: 'तैयार',
    served: 'परोसा गया',
    // Reviews
    leaveReview: 'अपने भोजन को रेट करें',
    reviewOnGoogle: 'Google मैप्स पर साझा करें',
    // Staff Panels
    kitchen: 'रसोई डिस्प्ले',
    admin: 'प्रशासन डैशबोर्ड',
    // Category labels
    starters: 'स्टार्टर्स और स्नैक्स',
    mainCourse: 'मुख्य व्यंजन',
    beverages: 'पेय पदार्थ',
    desserts: 'मिठाई',
    // Misc
    spiceLevel: 'मसाला स्तर',
    mild: 'हल्का',
    medium: 'मध्यम',
    hot: 'तीखा',
    veryHot: 'बहुत तीखा',
    noItems: 'कोई व्यंजन नहीं मिला',
    loading: 'लोड हो रहा है...',
    close: 'बंद करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    confirm: 'पुष्टि करें',
    yes: 'हाँ',
    no: 'नहीं'
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
