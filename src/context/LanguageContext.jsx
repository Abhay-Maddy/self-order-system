import React, { createContext, useState, useEffect, useCallback } from 'react';

export const LanguageContext = createContext();

// Static fallback dictionary for immediate UI speed
const staticDictionary = {
  en: {
    customerMenu: 'Customer Menu',
    kitchenPass: 'Kitchen Pass',
    adminPortal: 'Admin Portal',
    searchPlaceholder: 'Search for delicious momos, rolls, shakes...',
    vegOnly: 'Veg Only',
    customise: 'Customise',
    add: 'Add',
    cart: 'Cart',
    viewCart: 'View Cart',
    checkout: 'Checkout',
    table: 'Table',
    switchTable: 'Switch Table',
    subtotal: 'Subtotal',
    tax: 'GST Tax (5%)',
    discount: 'Discount',
    total: 'Total',
    placeOrder: 'Place Order',
    payCash: 'Pay Cash',
    onlinePayment: 'Online Payment',
    dineIn: 'Dine-In',
    packing: 'Packing',
    kitchen: 'Kitchen',
    dashboard: 'Dashboard',
    admin: 'Admin',
    customer: 'Customer',
    aamantran: 'Aamantran'
  },
  hi: {
    customerMenu: 'ग्राहक मेन्यू',
    kitchenPass: 'रसोई पास',
    adminPortal: 'एडमिन पोर्टल',
    searchPlaceholder: 'स्वादिष्ट मोमोज, रोल, शेक खोजें...',
    vegOnly: 'केवल शाकाहारी',
    customise: 'कस्टमाइज़',
    add: 'जोड़ें',
    cart: 'कार्ट',
    viewCart: 'कार्ट देखें',
    checkout: 'चेकआउट',
    table: 'टेबल',
    switchTable: 'टेबल बदलें',
    subtotal: 'उप-कुल',
    tax: 'जीएसटी कर (5%)',
    discount: 'छूट',
    total: 'कुल राशि',
    placeOrder: 'ऑर्डर दें',
    payCash: 'नकद भुगतान',
    onlinePayment: 'ऑनलाइन भुगतान',
    dineIn: 'डाइन-इन (हॉल)',
    packing: 'पैकिंग (टेकअवे)',
    kitchen: 'रसोई',
    dashboard: 'डैशबोर्ड',
    admin: 'एडमिन',
    customer: 'ग्राहक',
    aamantran: 'आमंत्रण'
  }
};

// Common dish term mapping for instant Hindi transliteration
const commonTermsMap = {
  'aamantran': 'आमंत्रण',
  'momos': 'मोमोज',
  'momo': 'मोमो',
  'paneer': 'पनीर',
  'chicken': 'चिकन',
  'crispy': 'क्रिस्पी',
  'fried': 'फ्राइड',
  'steamed': 'स्टीम्ड',
  'roll': 'रोल',
  'rolls': 'रोल्स',
  'burger': 'बर्गर',
  'pizza': 'पिज्जा',
  'chowmein': 'चौमीन',
  'noodles': 'नूडल्स',
  'manchurian': 'मंचूरियन',
  'shake': 'शेक',
  'coca cola': 'कोका कोला',
  'coke': 'कोक',
  'pepsi': 'पेप्सी',
  'coffee': 'कॉफी',
  'tea': 'चाय',
  'chai': 'चाय',
  'butter': 'मक्खन',
  'tikka': 'टिक्का',
  'masala': 'मसाला',
  'gravy': 'ग्रेवी',
  'dry': 'ड्राय',
  'soup': 'सूप',
  'dashboard': 'डैशबोर्ड',
  'kitchen': 'रसोई',
  'admin': 'एडमिन',
  'customer': 'ग्राहक',
  'menu': 'मेन्यू',
  'order': 'ऑर्डर'
};

const translationCache = {};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('aamantran_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('aamantran_lang', lang);
  }, [lang]);

  const t = (key) => {
    if (staticDictionary[lang] && staticDictionary[lang][key]) {
      return staticDictionary[lang][key];
    }
    return key;
  };

  // Dynamic Google Translator API fetch for dishes & arbitrary text
  const translateDynamicText = useCallback(async (text) => {
    if (!text || typeof text !== 'string') return text;
    if (lang === 'en') return text; // Default English

    const cacheKey = `${lang}:${text.toLowerCase().trim()}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // Check fast term mapping
    let words = text.split(' ');
    let mappedWords = words.map(w => {
      let clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      return commonTermsMap[clean] || w;
    });

    // If all words mapped locally, return immediately
    let localResult = mappedWords.join(' ');
    if (localResult !== text) {
      translationCache[cacheKey] = localResult;
    }

    try {
      // Call Google Translate free API endpoint
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translated = data[0][0][0];
        translationCache[cacheKey] = translated;
        return translated;
      }
    } catch (e) {
      console.warn('Google Translate API error, falling back to local dictionary:', e);
    }

    return translationCache[cacheKey] || text;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, translateDynamicText }}>
      {children}
    </LanguageContext.Provider>
  );
};
