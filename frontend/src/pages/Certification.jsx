import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '@/components/Banner';
import { getCertifications } from '@/api/Apis';
import foundationImg from '@/assets/images/foundation.png';
import associateImg from '@/assets/images/team/associate.png';
import professionalImg from '@/assets/images/team/professional.png';
import expertsImg from '@/assets/images/team/experts.png';

export default function Certification() {
  const navigate = useNavigate();
  const [certificationLevels, setCertificationLevels] = useState([
    {
      id: 'sscc-f',
      code: 'SSCC-F',
      title: 'Foundation',
      isOpen: true,
      image: foundationImg
    },
    {
      id: 'sscc-a',
      code: 'SSCC-A',
      title: 'Associate',
      isOpen: false,
      image: associateImg
    },
    {
      id: 'sscc-p',
      code: 'SSCC-P',
      title: 'Professional',
      isOpen: false,
      image: professionalImg
    },
    {
      id: 'sscc-e',
      code: 'SSCC-E',
      title: 'Expert',
      isOpen: false,
      image: expertsImg
    }
  ]);

  const apiRoot = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : "";

  const resolveImageUrl = (value, fallback) => {
    if (!value) return fallback;
    if (value.startsWith("http") || value.startsWith("data:")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/" + value;
  };

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const { data } = await getCertifications();
        const list = data?.data || data || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((item) => {
            const fallbackImage =
              item.code === 'SSCC-F' ? foundationImg :
              item.code === 'SSCC-A' ? associateImg :
              item.code === 'SSCC-P' ? professionalImg :
              expertsImg;
            return {
              id: item.code.toLowerCase(),
              code: item.code,
              title: item.title,
              isOpen: !!item.isOpen,
              image: resolveImageUrl(item.image, fallbackImage)
            };
          });
          setCertificationLevels(mapped);
        }
      } catch (err) {
        console.error("Failed to load dynamic certifications: ", err);
      }
    };
    fetchCerts();
  }, []);

  return (
    <>
      <Banner title="Certifications" crumbs={[{ label: "Home", to: "/" }, { label: "Certifications" }]} />

      {/* Main Pathway Section using Tailwind */}
      <section className="bg-white py-20 px-6 md:px-16">
        <div className="max-w-[1320px] mx-auto w-full">

          {/* Page Headers */}
          <div className="flex flex-col items-center justify-center mb-16 text-center">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.08em] text-[#04B4D4] font-[var(--kumbh)]">SSCC PATHWAY</p>
            <h2 className="text-3xl md:text-5xl font-black text-[#0B1B3A] font-[var(--kumbh)]">Elena Cybersecurity Certification (SSCC)</h2>
          </div>

          {/* 4-Step Grid using Tailwind grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {certificationLevels.map((cert) => (
              <div
                className="relative w-full aspect-[3/4] overflow-hidden cursor-pointer group bg-white border border-black/10 shadow-lg"
                key={cert.id}
                onClick={() => navigate(`/certification/${cert.id}`)}
              >
                {/* Image Wrapper */}
                <div className="w-full h-full overflow-hidden">
                  <img 
                    src={cert.image} 
                    alt={cert.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Bottom Info Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-20 flex flex-col gap-1 z-10">
                  <h3 className="text-xl font-bold text-white font-[var(--kumbh)]">{cert.title}</h3>
                  <p className="text-sm text-white/70 flex items-center gap-2 font-[var(--kumbh)]">
                    <span>{cert.code}</span>
                    <span>&bull;</span>
                    <span className={cert.isOpen ? "text-[#4ade80]" : "text-white/40"}>
                      {cert.isOpen ? '🟢 Admissions Open' : '⚪ Coming Soon'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Closing Strip */}
      <section className="bg-white pb-16 px-6">
        <div className="max-w-[1320px] mx-auto w-full">
          <div className="p-6 md:p-8 bg-[#F3F6FB] border border-black/10 text-center rounded-[var(--radius)] shadow-sm">
            <p className="text-[#0B1B3A]/85 font-semibold text-base md:text-lg">
              Each level builds on the last —{' '}
              <span className="text-[#1C64EC] font-bold">a credentialed path</span>,
              not a one-off course. Start at Foundation, grow all the way to Expert.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
