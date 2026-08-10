import React from "react";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Services from "./sections/Services";
import ChooseUs from "./sections/ChooseUs";
import Case from "./sections/Case";
import Team from "./sections/Team";
import Testimonials from "./sections/Testimonials";
import Blogs from "./sections/Blogs";
import FAQ from "./sections/FAQ";
import InTouch from "./sections/InTouch";
import { useSections } from "@/hooks/useSections";

const Home = () => {
  const { sections } = useSections("home");

  return (
    <>
      <Hero />
      <About content={sections.about} />
      <Services content={sections.servicesHeader} />
      <ChooseUs content={sections.chooseUs} />
      {/* <Team /> */}
      <FAQ content={sections.faq} />
      <Case content={sections.caseStudiesHeader} />
      <Testimonials />
      <Blogs />
      <InTouch content={sections.inTouch} />
    </>
  );
};

export default Home;
