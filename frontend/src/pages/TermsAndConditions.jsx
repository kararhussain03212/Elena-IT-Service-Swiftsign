import React from "react";
import Banner from "@/components/Banner";
import useScrollReveal from "@/hooks/useScrollReveal";

const TermsAndConditions = () => {
  const contentRef = useScrollReveal();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
    },
    {
      title: "2. Use License",
      content:
        "Permission is granted to temporarily download one copy of the materials (information or software) on the website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:",
      subPoints: [
        "Modify or copy the materials",
        "Use the materials for any commercial purpose or for any public display",
        "Attempt to decompile or reverse engineer any software contained on the website",
        "Remove any copyright or other proprietary notations from the materials",
        "Transfer the materials to another person or 'mirror' the materials on any other server",
        "Use the materials for any unlawful purpose or in violation of any applicable laws or regulations",
      ],
    },
    {
      title: "3. Disclaimer",
      content:
        "The materials on the website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
    },
    {
      title: "4. Limitations",
      content:
        "In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the website, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.",
    },
    {
      title: "5. Accuracy of Materials",
      content:
        "The materials appearing on the website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on the website are accurate, complete, or current. We may make changes to the materials contained on the website at any time without notice.",
    },
    {
      title: "6. Links",
      content:
        "We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any such linked website is at the user's own risk.",
    },
    {
      title: "7. Modifications",
      content:
        "We may revise these terms of service for the website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.",
    },
    {
      title: "8. Governing Law",
      content:
        "These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which our company operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.",
    },
    {
      title: "9. Contact Information",
      content:
        "If you have any questions about these Terms and Conditions, please contact us at the email address or physical address provided on our website.",
    },
  ];

  return (
    <section className="w-full overflow-x-hidden">
      <Banner title="Terms and Conditions" />

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

export default TermsAndConditions;
