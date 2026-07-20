import React, { useState, useEffect, useRef } from 'react';
import Banner from '@/components/Banner';
import RecaptchaField from '@/components/RecaptchaField';
import { getCareerPage, getCareerPrograms, submitProgramApplication, subscribeNewsletter } from '@/api/Apis';
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

export default function Career() {
  const [pageContent, setPageContent] = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    completedPrior: 'No'
  });
  const [applyState, setApplyState] = useState({ submitting: false, success: '', error: '' });
  const [applyRecaptchaToken, setApplyRecaptchaToken] = useState('');
  const applyRecaptchaRef = useRef(null);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState({ submitting: false, success: '', error: '' });
  const [newsletterRecaptchaToken, setNewsletterRecaptchaToken] = useState('');
  const newsletterRecaptchaRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pageRes, programsRes] = await Promise.all([
          getCareerPage(),
          getCareerPrograms(),
        ]);
        setPageContent(pageRes?.data || null);
        const programs = Array.isArray(programsRes?.data) ? programsRes.data : [];
        setProgram(programs.length > 0 ? programs[0] : null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();

    if (!program?.id && !program?._id) {
      setApplyState({ submitting: false, success: '', error: 'No active program is available to apply for right now.' });
      return;
    }

    if (!applyRecaptchaToken) {
      setApplyState({ submitting: false, success: '', error: 'Please complete the reCAPTCHA verification.' });
      return;
    }

    setApplyState({ submitting: true, success: '', error: '' });

    try {
      const { data } = await submitProgramApplication({
        programId: program.id || program._id,
        fullName: formData.name,
        email: formData.email,
        contactNumber: formData.phone,
        hasBasicItKnowledge: formData.completedPrior === 'Yes',
        recaptchaToken: applyRecaptchaToken,
      });
      setApplyState({ submitting: false, success: data?.message || 'Application submitted successfully.', error: '' });
      setFormData({ name: '', email: '', phone: '', completedPrior: 'No' });
      applyRecaptchaRef.current?.reset();
      setApplyRecaptchaToken('');
      setTimeout(() => setApplyState((prev) => ({ ...prev, success: '' })), 6000);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to submit application. Please try again.';
      applyRecaptchaRef.current?.reset();
      setApplyRecaptchaToken('');
      setApplyState({ submitting: false, success: '', error: message });
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    if (!newsletterRecaptchaToken) {
      setNewsletterState({ submitting: false, success: '', error: 'Please complete the reCAPTCHA verification.' });
      return;
    }

    setNewsletterState({ submitting: true, success: '', error: '' });

    try {
      const { data } = await subscribeNewsletter({
        email: newsletterEmail,
        sourcePage: 'career',
        recaptchaToken: newsletterRecaptchaToken,
      });
      setNewsletterState({ submitting: false, success: data?.message || 'Subscribed successfully.', error: '' });
      setNewsletterEmail('');
      newsletterRecaptchaRef.current?.reset();
      setNewsletterRecaptchaToken('');
      setTimeout(() => setNewsletterState((prev) => ({ ...prev, success: '' })), 6000);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to subscribe. Please try again.';
      newsletterRecaptchaRef.current?.reset();
      setNewsletterRecaptchaToken('');
      setNewsletterState({ submitting: false, success: '', error: message });
    }
  };

  const modules = Array.isArray(program?.modules) ? program.modules : [];
  const whoCanApply = Array.isArray(program?.who_can_apply) ? program.who_can_apply : [];
  const whyChoose = Array.isArray(program?.why_choose) ? program.why_choose : [];

  if (loading) {
    return (
      <>
        <Banner
          title="Careers & Internships"
          crumbs={[{ label: "Home", to: "/" }, { label: "Careers" }]}
        />
        <section className="bg-[#0f0d1d] py-20 px-6 md:px-16 text-white font-[var(--kumbh)]">
          <div className="max-w-[1320px] mx-auto w-full text-center text-white/60">Loading...</div>
        </section>
      </>
    );
  }

  return (
    <>
      <Banner
        title={pageContent?.hero_title || "Careers & Internships"}
        crumbs={[
          { label: "Home", to: "/" },
          { label: pageContent?.breadcrumb_label || "Careers" }
        ]}
      />

      <section className="bg-[#0f0d1d] py-20 px-6 md:px-16 text-white font-[var(--kumbh)]">
        <div className="max-w-[1320px] mx-auto w-full">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

            {/* LEFT & MIDDLE CONTENT (Columns 1 & 2) */}
            <div className="lg:col-span-2 flex flex-col gap-12">

              {/* SECTION 1: VALUE BLOCK */}
              {program && (
                <div className="p-8 md:p-10 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-8 shadow-md">
                  <div className="flex flex-wrap items-center gap-4">
                    {program.status_badge && (
                      <span className="inline-flex items-center gap-2 bg-[#3c72fc]/10 border border-[#3c72fc]/25 text-[#3c72fc] px-4 py-1.5 rounded-full text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#3c72fc] animate-ping"></span>
                        {program.status_badge}
                      </span>
                    )}
                    {program.join_badge && (
                      <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold">
                        {program.join_badge}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* Left sub-column: Info */}
                    <div className="flex flex-col gap-4">
                      <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        {program.title}
                      </h1>
                      <p className="text-white/80 text-base leading-relaxed">
                        {program.description}
                      </p>
                      <div className="flex flex-col gap-2.5 pt-4 border-t border-white/5">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40 font-bold uppercase tracking-wider">Duration</span>
                          <span className="text-white font-semibold text-right">{program.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40 font-bold uppercase tracking-wider">Prerequisite</span>
                          <span className="text-white font-semibold text-right">{program.prerequisite}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right sub-column: Metadata */}
                    <div className="flex flex-col gap-6 bg-white/2 p-6 rounded-xl border border-white/5">
                      {whoCanApply.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-[#3c72fc] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users size={16} />
                            Who Can Apply
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {whoCanApply.map((item, idx) => (
                              <li className="flex items-center gap-2 text-sm text-white/80" key={idx}>
                                <ChevronRight size={14} className="text-[#3c72fc] flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {whyChoose.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Check size={16} />
                            Why Choose This Level
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {whyChoose.map((item, idx) => (
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
              )}

              {/* SECTION 2: CURRICULUM GRID */}
              {modules.length > 0 && (
                <div className="flex flex-col gap-6">
                  <div className="border-l-3 border-[#3c72fc] pl-3">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <BookOpen size={22} className="text-[#3c72fc]" />
                      Program Modules
                    </h3>
                    <p className="text-white/60 text-sm mt-1">A step-by-step pathway crafted to build industry-ready skills.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((mod) => (
                      <div
                        key={mod.id || mod._id}
                        className="p-6 bg-[#151327] border border-white/5 rounded-2xl hover:border-[#3c72fc]/30 transition-all duration-300 flex flex-col gap-4 shadow-sm group hover:-translate-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-10 h-10 bg-[#3c72fc]/10 text-[#3c72fc] rounded-xl flex items-center justify-center text-sm font-bold group-hover:bg-[#3c72fc] group-hover:text-white transition-colors duration-300">
                            {mod.module_number}
                          </span>
                          <span className="text-[11px] uppercase tracking-widest text-white/30 font-bold">MODULE</span>
                        </div>
                        <h4 className="text-lg font-bold text-white leading-snug">
                          {mod.title}
                        </h4>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {mod.description}
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
                  {pageContent?.apply_form_heading || "Apply Online"}
                </h3>
                <p className="text-white/75 text-sm mb-6 leading-relaxed">
                  {pageContent?.apply_form_description}
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
                      {pageContent?.apply_form_prereq_question}
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

                  <RecaptchaField
                    ref={applyRecaptchaRef}
                    onChange={(token) => setApplyRecaptchaToken(token || '')}
                  />

                  {applyState.error && (
                    <p className="text-rose-400 text-sm font-semibold text-center">{applyState.error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={applyState.submitting}
                    className="w-full mt-4 py-4 px-6 bg-[#3c72fc] hover:bg-[#3c72fc]/80 text-white font-bold rounded-xl cursor-pointer transition-all border-none flex items-center justify-center gap-2 font-[var(--kumbh)] shadow-md shadow-[#3c72fc]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                    <span>{applyState.submitting ? 'Submitting...' : 'Submit Application'}</span>
                  </button>
                </form>

                {applyState.success && (
                  <p className="text-emerald-400 text-sm font-semibold mt-4 text-center animate-pulse">
                    ✔ {applyState.success}
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
                  {pageContent?.join_team_heading || "Join Our Team"}
                </h3>
              </div>
              <p className="text-white/80 text-base leading-relaxed">
                {pageContent?.join_team_paragraph1}
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                {pageContent?.join_team_paragraph2}
              </p>
            </div>

            <div className="p-8 bg-[#0f0d1d] border border-white/5 rounded-2xl shadow-lg flex flex-col gap-6">
              <h4 className="text-lg font-bold text-white">{pageContent?.general_interest_heading || "General Interest Application"}</h4>
              <p className="text-white/60 text-sm">{pageContent?.general_interest_description}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(pageContent?.cv_email || '')}&su=${encodeURIComponent(pageContent?.cv_email_subject || "Job Application")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 px-6 bg-[#3c72fc] hover:bg-[#3c72fc]/80 text-white font-bold rounded-xl text-center text-decoration-none transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Mail size={16} />
                  <span>{pageContent?.cv_button_text || "Email Resume (CV)"}</span>
                </a>
                <a
                  href={pageContent?.linkedin_url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-4 px-6 border border-white/10 hover:border-white/30 bg-white/2 hover:bg-white/5 text-white font-bold rounded-xl text-center text-decoration-none transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink size={16} />
                  <span>{pageContent?.linkedin_button_text || "LinkedIn Profile"}</span>
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
            <h3 className="text-2xl md:text-3xl font-black tracking-tight">{pageContent?.newsletter_heading}</h3>
            <p className="text-white/80 text-sm md:text-base">{pageContent?.newsletter_description}</p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="w-full lg:w-auto flex flex-col gap-3 min-w-[320px] sm:min-w-[450px]">
            <div className="flex flex-col sm:flex-row gap-3">
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
                disabled={newsletterState.submitting}
                className="py-4 px-8 bg-white text-[#3c72fc] hover:bg-white/95 font-bold rounded-xl cursor-pointer transition-all border-none font-[var(--kumbh)] shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {newsletterState.submitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            <RecaptchaField
              ref={newsletterRecaptchaRef}
              onChange={(token) => setNewsletterRecaptchaToken(token || '')}
            />
          </form>
        </div>
        {(newsletterState.success || newsletterState.error) && (
          <div className="max-w-[1320px] mx-auto w-full mt-4">
            <p className="text-white text-sm font-bold text-center sm:text-right">
              {newsletterState.success ? `✔ ${newsletterState.success}` : newsletterState.error}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
