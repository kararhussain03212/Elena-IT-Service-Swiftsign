import React, { forwardRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

const RecaptchaField = forwardRef(function RecaptchaField(
  { onChange, className = "" },
  ref,
) {
  if (!SITE_KEY) return null;

  return (
    <div className={className}>
      <ReCAPTCHA ref={ref} sitekey={SITE_KEY} onChange={onChange} />
    </div>
  );
});

export default RecaptchaField;
