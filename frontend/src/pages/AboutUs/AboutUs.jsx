import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Info from "./sections/Info";
import Whoarewe from "./sections/Whoarewe";
import Services from "./sections/Services";
import Case from "./sections/Case";
import Team from "./sections/Team";
import Banner from "../../components/Banner";
import { useSections } from "@/hooks/useSections";

const AboutUs = () => {
  const { sections } = useSections("about");
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const targetId = hash.replace("#", "");
    const timer = window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      const offsetTop =
        target.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(offsetTop, 0), behavior: "smooth" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <div>
      <Banner title="About Us" />
      <section id="about-who-we-are" className="scroll-mt-32">
        <Whoarewe content={sections.whoWeAre} />
      </section>
      <section id="about-services" className="scroll-mt-32">
        <Services />
      </section>
      <section id="about-case-studies" className="scroll-mt-32">
        <Case />
      </section>
      <section id="about-stats" className="scroll-mt-32">
        <Info content={sections.stats} />
      </section>
      {/* <section id="about-team" className="scroll-mt-32">
        <Team />
      </section> */}
    </div>
  );
};

export default AboutUs;
