import React, { useState, useEffect } from 'react';
import Banner from '@/components/Banner';
import { useSections } from "@/hooks/useSections";
import { 
  BookOpen, 
  Users, 
  Check, 
  Mail, 
  ChevronRight, 
  ExternalLink, 
  Briefcase, 
  Send, 
  Users2 
} from 'lucide-react';

const DEFAULT_INFO = {
  heroBadge: "Applications Open",
  statusBadge: "Join Swift Sign IT",
  title: "Cybersecurity & IT Associates Program",
  description: "Kickstart your technical career with our intensive learning pathway. We bridge the gap between academic knowledge and real-world business demands through structured mentorship.",
  duration: "3-Month Program",
  prerequisite: "Basic IT & Networking",
  whoCanApply: [
    "Undergraduates & Graduates",
    "Computer Science & IT Students",
    "Aspiring Security Professionals"
  ],
  whyChoose: [
    "Industry-aligned Curriculum",
    "Hands-on Sandbox Environment",
    "Placement Assistance & Referrals"
  ]
};

const DEFAULT_MODULES = {
  modules: [
    { num: "1", title: "IT Infrastructure & Support", desc: "Master hardware, operating systems (Windows/Linux hardening), network protocols, and troubleshooting workflows." },
    { num: "2", title: "Full-Stack Web Technologies", desc: "Build modern, responsive web architectures using HTML, CSS, JavaScript, and advanced framework concepts." },
    { num: "3", title: "Cybersecurity Fundamentals", desc: "Learn network security, encryption standards, PKI infrastructure, and vulnerability assessment methodologies." },
    { num: "4", title: "App Development & UI/UX", desc: "Design elegant user interfaces and implement robust application logic using modern software design patterns." },
    { num: "5", title: "Security Operations & GRC", desc: "Understand Security Operations Center (SOC) flows, log monitoring, and Governance, Risk & Compliance standards." },
    { num: "6", title: "Capstone & Real-World Lab", desc: "Collaborate in teams on cross-functional business projects, staging environments, and production deployments." }
  ]
};

const DEFAULT_TEAM = {
  formTitle: "Apply Online",
  formSubtitle: "Submit your application to reserve a slot. Our admissions committee will review your profile within 48 hours.",
  formPrereqQuestion: "Do you have basic IT/Programming knowledge?",
  teamTitle: "Join Our Team",
  teamDesc: "Looking for a full-time career? We are always on the lookout for passion-driven cybersecurity analysts, systems engineers, full-stack developers, and technology consultants who want to make an impact.",
  teamSub: "Even if we don't have an active opening matching your profile, drop your credentials to get pre-evaluated for future roles in our global tech hubs.",
  teamEmailSubject: "Job Application",
  newsTitle: "Stay updated with Swift Sign IT",
  newsSub: "Subscribe to receive program launch alerts, cyber insights, and internship announcements."
};

export default function Career() {
  const { sections } = useSections("career");
  const infoData = { ...DEFAULT_INFO, ...(sections.info || {}) };
  const modulesData = { ...DEFAULT_MODULES, ...(sections.modules || {}) };
  const teamData = { ...DEFAULT_TEAM, ...(sections.team || {}) };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    completedPrior: 'No'
  });
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`${infoData.title} Application`);
    const body = encodeURIComponent(
      `Hi Swift Sign IT Team,\n\nI would like to apply for the ${infoData.title}.\n\nHere are my details:\n- Name: ${formData.name}\n- Email: ${formData.email}\n- Phone: ${formData.phone}\n- ${teamData.formPrereqQuestion}: ${formData.completedPrior}\n\nBest regards,\n${formData.name}`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=info@it.swiftsignbm.com&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
    setSubscribed(true);
    setFormData({ name: '', email: '', phone: '', completedPrior: 'No' });
    setTimeout(() => setSubscribed(false), 5000);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent("Newsletter Subscription Request");
    const body = encodeURIComponent(
      `Hi Swift Sign IT Team,\n\nPlease subscribe my email address to the newsletter:\n- Email: ${newsletterEmail}\n\nBest regards.`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=info@it.swiftsignbm.com&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSubscribed(false), 5000);
  };

  return (
    <>
      <Banner 
        title="Careers & Internships" 
        crumbs={[
          { label: "Home", to: "/" }, 
          { label: "Careers" }
        ]} 
      />

      <section className="bg-[#0f0d1d] py-20 px-6 md:px-16 text-white font-[var(--kumbh)]">
        <div className="max-w-[1320px] mx-auto w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            
            {/* LEFT & MIDDLE CONTENT (Columns 1 & 2) */}
            <div className="lg:col-span-2 flex flex-col gap-12">
              
              {/* SECTION 1: VALUE BLOCK */}
              <div className="p-8 md:p-10 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-8 shadow-md">
                <div className="flex flex-wrap items-center gap-4">
                  {infoData.heroBadge && (
                    <span className="inline-flex items-center gap-2 bg-[#3c72fc]/10 border border-[#3c72fc]/25 text-[#3c72fc] px-4 py-1.5 rounded-full text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#3c72fc] animate-ping"></span>
                      {infoData.heroBadge}
                    </span>
                  )}
                  {infoData.statusBadge && (
                    <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold">
                      {infoData.statusBadge}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  {/* Left sub-column: Info */}
                  <div className="flex flex-col gap-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      {infoData.title}
                    </h1>
                    <p className="text-white/80 text-base leading-relaxed">
                      {infoData.description}
                    </p>
                    <div className="flex flex-col gap-2.5 pt-4 border-t border-white/5">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40 font-bold uppercase tracking-wider">Duration</span>
                        <span className="text-white font-semibold text-right">{infoData.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40 font-bold uppercase tracking-wider">Prerequisite</span>
                        <span className="text-white font-semibold text-right">{infoData.prerequisite}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right sub-column: Metadata */}
                  <div className="flex flex-col gap-6 bg-white/2 p-6 rounded-xl border border-white/5">
                    {Array.isArray(infoData.whoCanApply) && infoData.whoCanApply.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-[#3c72fc] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Users size={16} />
                          Who Can Apply
                        </h4>
                        <ul className="flex flex-col gap-2">
                          {infoData.whoCanApply.map((item, idx) => (
                            <li className="flex items-center gap-2 text-sm text-white/80" key={idx}>
                              <ChevronRight size={14} className="text-[#3c72fc] flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(infoData.whyChoose) && infoData.whyChoose.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Check size={16} />
                          Why Choose This Level
                        </h4>
                        <ul className="flex flex-col gap-2">
                          {infoData.whyChoose.map((item, idx) => (
                            <li className="flex items-center gap-2 text-sm text-white/80" key={idx}>
                              <Check size={12} className="text-emerald-400 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: CURRICULUM GRID */}
              {Array.isArray(modulesData.modules) && modulesData.modules.length > 0 && (
                <div className="flex flex-col gap-6">
                  <div className="border-l-3 border-[#3c72fc] pl-3">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <BookOpen size={22} className="text-[#3c72fc]" />
                      Program Modules
                    </h3>
                    <p className="text-white/60 text-sm mt-1">A step-by-step pathway crafted to build industry-ready skills.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modulesData.modules.map((mod, idx) => (
                      <div 
                        key={idx} 
                        className="p-6 bg-[#151327] border border-white/5 rounded-2xl hover:border-[#3c72fc]/30 transition-all duration-300 flex flex-col gap-4 shadow-sm group hover:-translate-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-10 h-10 bg-[#3c72fc]/10 text-[#3c72fc] rounded-xl flex items-center justify-center text-sm font-bold group-hover:bg-[#3c72fc] group-hover:text-white transition-colors duration-300">
                            {mod.num}
                          </span>
                          <span className="text-[11px] uppercase tracking-widest text-white/30 font-bold">MODULE</span>
                        </div>
                        <h4 className="text-lg font-bold text-white leading-snug">
                          {mod.title}
                        </h4>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {mod.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* SECTION 3: FOCUS AREA (STICKY REGISTRATION CARD - Column 3) */}
            <div className="lg:sticky lg:top-28 flex flex-col gap-8">
              <div className="p-8 bg-gradient-to-br from-[#1b1937] to-[#131128] border-2 border-[#3c72fc]/40 rounded-3xl shadow-xl relative overflow-hidden">
                {/* Visual Accent/Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3c72fc]/10 rounded-full blur-3xl -z-10"></div>
                
                <h3 className="text-2xl font-extrabold text-white flex items-center gap-2 border-l-3 border-[#3c72fc] pl-3 mb-2">
                  <Briefcase size={20} className="text-[#3c72fc]" />
                  {teamData.formTitle}
                </h3>
                <p className="text-white/75 text-sm mb-6 leading-relaxed">
                  {teamData.formSubtitle}
                </p>

                <form onSubmit={handleApplySubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs uppercase text-white/50 font-bold tracking-wider mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Full Name"
                      className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#3c72fc] font-[var(--kumbh)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-white/50 font-bold tracking-wider mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@email.com"
                      className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#3c72fc] font-[var(--kumbh)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-white/50 font-bold tracking-wider mb-1.5 block">Contact Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+971 50 123 4567"
                      className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#3c72fc] font-[var(--kumbh)] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2 bg-white/2 p-4 rounded-xl border border-white/5">
                    <span className="text-xs text-white/70 font-semibold leading-relaxed">
                      {teamData.formPrereqQuestion}
                    </span>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input 
                          type="radio" 
                          name="completedPrior" 
                          value="Yes"
                          checked={formData.completedPrior === 'Yes'}
                          onChange={(e) => setFormData({ ...formData, completedPrior: e.target.value })}
                          className="accent-[#3c72fc] w-4 h-4 cursor-pointer"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input 
                          type="radio" 
                          name="completedPrior" 
                          value="No"
                          checked={formData.completedPrior === 'No'}
                          onChange={(e) => setFormData({ ...formData, completedPrior: e.target.value })}
                          className="accent-[#3c72fc] w-4 h-4 cursor-pointer"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-4 px-6 bg-[#3c72fc] hover:bg-[#3c72fc]/80 text-white font-bold rounded-xl cursor-pointer transition-all border-none flex items-center justify-center gap-2 font-[var(--kumbh)] shadow-md shadow-[#3c72fc]/20"
                  >
                    <Send size={15} />
                    <span>Submit Application</span>
                  </button>
                </form>
                
                {subscribed && (
                  <p className="text-emerald-400 text-sm font-semibold mt-4 text-center animate-pulse">
                    ✔ Redirecting to Gmail Application draft...
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: GLOBAL ENGAGEMENT LAYER (Footer/Bottom Section) */}
      
      {/* Join Our Team Section */}
      <section className="bg-[#151327] py-20 px-6 md:px-16 text-white font-[var(--kumbh)] border-t border-white/5">
        <div className="max-w-[1320px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <div className="border-l-3 border-[#3c72fc] pl-3">
                <h3 className="text-3xl font-extrabold text-white flex items-center gap-2">
                  <Users2 size={28} className="text-[#3c72fc]" />
                  {teamData.teamTitle}
                </h3>
              </div>
              <p className="text-white/80 text-base leading-relaxed">
                {teamData.teamDesc}
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                {teamData.teamSub}
              </p>
            </div>
            
            <div className="p-8 bg-[#0f0d1d] border border-white/5 rounded-2xl shadow-lg flex flex-col gap-6">
              <h4 className="text-lg font-bold text-white">General Interest Application</h4>
              <p className="text-white/60 text-sm">Send your credentials directly to our HR team.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=info@it.swiftsignbm.com&su=${encodeURIComponent(teamData.teamEmailSubject || "Job Application")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 px-6 bg-[#3c72fc] hover:bg-[#3c72fc]/80 text-white font-bold rounded-xl text-center text-decoration-none transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Mail size={16} />
                  <span>Email Resume (CV)</span>
                </a>
                <a 
                  href="https://www.linkedin.com/company/swift-sign-it-cyber-solutions/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-4 px-6 border border-white/10 hover:border-white/30 bg-white/2 hover:bg-white/5 text-white font-bold rounded-xl text-center text-decoration-none transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink size={16} />
                  <span>LinkedIn Profile</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-[#3c72fc] py-16 px-6 md:px-16 text-white font-[var(--kumbh)]">
        <div className="max-w-[1320px] mx-auto w-full flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2 max-w-xl">
            <h3 className="text-2xl md:text-3xl font-black tracking-tight">{teamData.newsTitle}</h3>
            <p className="text-white/80 text-sm md:text-base">{teamData.newsSub}</p>
          </div>
          
          <form onSubmit={handleNewsletterSubmit} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 min-w-[320px] sm:min-w-[450px]">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-grow bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-white/60 focus:outline-none focus:bg-white/20 transition-all font-[var(--kumbh)]"
            />
            <button
              type="submit"
              className="py-4 px-8 bg-white text-[#3c72fc] hover:bg-white/95 font-bold rounded-xl cursor-pointer transition-all border-none font-[var(--kumbh)] shadow-md"
            >
              Subscribe
            </button>
          </form>
        </div>
        {newsletterSubscribed && (
          <div className="max-w-[1320px] mx-auto w-full mt-4">
            <p className="text-white text-sm font-bold text-center sm:text-right animate-pulse">
              ✔ Redirecting to Gmail Subscribe draft...
            </p>
          </div>
        )}
      </section>
    </>
  );
}
