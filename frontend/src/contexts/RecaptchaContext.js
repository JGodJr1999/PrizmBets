import React, { createContext } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// reCAPTCHA Context
const RecaptchaContext = createContext();

// reCAPTCHA site key - this should be stored in environment variables
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key for development

// Custom hook to use reCAPTCHA
export const useRecaptcha = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const executeRecaptchaAction = async (action) => {
    if (!executeRecaptcha) {
      console.warn('reCAPTCHA not available');
      return null;
    }
    
    try {
      const token = await executeRecaptcha(action);
      return token;
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      return null;
    }
  };
  
  return { executeRecaptchaAction };
};

// reCAPTCHA Provider Component
export const RecaptchaProvider = ({ children }) => {
  return (
    <GoogleReCaptchaProvider
      sitekey={RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: 'head',
        nonce: undefined,
      }}
      container={{
        parameters: {
          badge: 'bottomright',
          theme: 'dark',
        },
      }}
    >
      <RecaptchaContext.Provider value={{}}>
        {children}
      </RecaptchaContext.Provider>
    </GoogleReCaptchaProvider>
  );
};

export default RecaptchaProvider;