import React from "react";
import Banner from "@/components/Banner";
import useScrollReveal from "@/hooks/useScrollReveal";

const PrivacyPolicy = () => {
  const contentRef = useScrollReveal();

  const sections = [
    {
      title: "1. Introduction",
      content:
        "We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this privacy policy carefully. If you do not agree with our policies and practices, please do not use our services.",
    },
    {
      title: "2. Information We Collect",
      content:
        "We may collect information about you in a variety of ways. The information we may collect on the site includes:",
      subPoints: [
        "Personal identification information (name, email address, phone number, etc.) when you submit contact forms",
        "Technical information such as IP address, browser type, and device type",
        "Usage information about how you interact with our website",
        "Cookies and similar tracking technologies",
        "Any other information you voluntarily provide to us",
      ],
    },
    {
      title: "3. Use of Information",
      content:
        "Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the site to:",
      subPoints: [
        "Respond to your inquiries and fulfill your requests",
        "Send periodic emails regarding your inquiry or follow-up",
        "Improve our website and services",
        "Prevent fraudulent transactions and other illegal activities",
        "Personalize your experience on our website",
        "Send marketing and promotional communications (with your consent)",
      ],
    },
    {
      title: "4. Disclosure of Information",
      content:
        "We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information unless we provide you with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.",
    },
    {
      title: "5. Security",
      content:
        "We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.",
    },
    {
      title: "6. Cookies",
      content:
        "Our website may use cookies to enhance your experience. You can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies via your browser settings.",
    },
    {
      title: "7. Third-Party Links",
      content:
        "Our website may contain links to third-party websites. We are not responsible for the privacy practices or the content of these external sites. We encourage you to review the privacy policies of any third-party sites before providing your personal information.",
    },
    {
      title: "8. GDPR Compliance",
      content:
        "If you are a resident of the European Economic Area (EEA), you have certain data protection rights. We comply with the General Data Protection Regulation (GDPR) and provide individuals with the right to access, correct, and delete their personal data.",
    },
    {
      title: "9. Your Privacy Rights",
      content:
        "Depending on your location, you may have certain rights regarding your personal information, including:",
      subPoints: [
        "The right to access your personal data",
        "The right to correct inaccurate data",
        "The right to request deletion of your data",
        "The right to restrict processing of your data",
        "The right to data portability",
        "The right to withdraw consent at any time",
      ],
    },
    {
      title: "10. Changes to This Privacy Policy",
      content:
        "We reserve the right to modify this privacy policy at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website following the posting of revised Privacy Policy means that you accept and agree to the changes.",
    },
    {
      title: "11. Contact Us",
      content:
        "If you have any questions about this Privacy Policy or our privacy practices, please contact us using the information provided on our website.",
    },
  ];

  return (
    <section className="w-full overflow-x-hidden">
      <Banner title="Privacy Policy" />

      <div className="bg-[#151327] py-16 sm:py-20 md:py-28">
        <div
          ref={contentRef}
          className="sr-hidden sr-up mx-auto w-full max-w-[900px] px-6 md:px-10"
        >
          <div className="prose prose-invert max-w-none">
            <p className="text-base text-white/70 mb-8">
              Last updated: {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="space-y-8">
              {sections.map((section, index) => (
                <div key={index} className="space-y-4">
                  <h2 className="text-2xl font-bold text-white relative">
                    {section.title}
                    <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#3c72fc]" />
                  </h2>
                  <p className="text-base text-white/70 leading-relaxed pt-2">
                    {section.content}
                  </p>
                  {section.subPoints && (
                    <ul className="list-disc list-inside space-y-2 pl-4">
                      {section.subPoints.map((point, pointIndex) => (
                        <li
                          key={pointIndex}
                          className="text-base text-white/70"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
