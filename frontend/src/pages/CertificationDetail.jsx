import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Banner from '@/components/Banner';
import { 
  BookOpen, 
  Users, 
  Check, 
  ArrowLeft, 
  Mail, 
  Bell, 
  Layers,
  Award,
  ChevronRight,
  ExternalLink,
  DollarSign,
  QrCode
} from 'lucide-react';

const API_BASE_URL = '/api';

const priorMap = {
  'SSCC-A': 'SSCC-F',
  'SSCC-P': 'SSCC-A',
  'SSCC-E': 'SSCC-P'
};

export default function CertificationDetail() {
  const { id } = useParams(); // e.g. sscc-f, sscc-a, etc.
  const navigate = useNavigate();
  
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For open registrations (SSCC-F)
  const [inquireStatus, setInquireStatus] = useState('');
  
  // For closed registrations (A, P, E)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    completedPrior: 'No'
  });
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCertDetails();
  }, [id]);

  const fetchCertDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch details from PHP backend
      const response = await fetch(`${API_BASE_URL}/certifications/${id}`);
      if (!response.ok) {
        throw new Error('Certification level not found');
      }
      const result = await response.json();
      if (result.success && result.data) {
        setCertData(result.data);
      } else if (result && result.code) {
        setCertData(result);
      } else {
        throw new Error(result.message || 'Failed to fetch details');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInquiry = () => {
    if (!certData || !certData.applicationLink) return;
    setInquireStatus('Preparing inquiry form...');
    setTimeout(() => {
      window.open(certData.applicationLink, '_blank');
      setInquireStatus('');
    }, 1000);
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    if (!certData) return;

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          certCode: certData.code
        })
      });

      const result = await response.json();
      if (result.success) {
        setSubscribed(true);
        setFormData({ name: '', email: '', phone: '', completedPrior: 'No' });
        setTimeout(() => {
          setSubscribed(false);
        }, 5000);
      } else {
        alert(result.message || 'Failed to submit registration. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to save your registration.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0f0d1d] text-white">
        <div className="w-12 h-12 border-4 border-[#3c72fc] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-white/60 font-semibold animate-pulse">Loading course specifications...</p>
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0f0d1d] text-white px-6 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Program</h2>
        <p className="text-white/60 mb-6">{error || 'The requested certification level does not exist.'}</p>
        <button 
          onClick={() => navigate('/certification')} 
          className="py-3 px-6 bg-[#3c72fc] hover:bg-[#3c72fc]/80 text-white font-bold rounded-lg transition-all"
        >
          Return to Pathway Hub
        </button>
      </div>
    );
  }

  return (
    <>
      <Banner 
        title={certData.title} 
        crumbs={[
          { label: "Home", to: "/" }, 
          { label: "Certifications", to: "/certification" }, 
          { label: certData.title }
        ]} 
      />

      <section className="bg-[#0f0d1d] py-20 px-6 md:px-16 text-white font-[var(--kumbh)]">
        <div className="max-w-[1320px] mx-auto w-full">
          
          {/* Back Navigation Button */}
          <div className="mb-10 text-left">
            <Link 
              to="/certification" 
              className="inline-flex items-center gap-2 py-3 px-5 border border-white/10 hover:border-white/30 text-white font-bold text-sm tracking-wide bg-[#151327] hover:bg-[#1f1b3a] transition-all rounded-[var(--radius)] text-decoration-none"
            >
              <ArrowLeft size={16} />
              <span>Back to Pathway Hub</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* LEFT COLUMN: Main Description, Modules, Outcome, Fees */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Hero details container */}
              <div className="p-8 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-6 shadow-md">
                <div className="flex items-center gap-12">
                  {certData.isOpen ? (
                    <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Admissions Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 px-4 py-1.5 rounded-full text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-white/30"></span>
                      Coming Soon
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {certData.fullName}
                </h1>
                <p className="text-white/80 text-lg font-medium leading-relaxed">
                  {certData.tagline}
                </p>

                {/* Hero meta items horizontal list */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase text-white/40 font-bold tracking-wider">
                      {certData.isOpen ? "Duration" : "Suggested Duration"}
                    </span>
                    <span className="text-sm text-white font-semibold">{certData.duration}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase text-white/40 font-bold tracking-wider">Training Mode</span>
                    <span className="text-sm text-white font-semibold">{certData.mode}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase text-white/40 font-bold tracking-wider">
                      {certData.isOpen ? "Batch Schedule" : "Prerequisite"}
                    </span>
                    <span className="text-sm text-white font-semibold">
                      {certData.isOpen ? certData.dates : certData.prerequisite}
                    </span>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="p-8 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-4 shadow-md">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-3 border-[#3c72fc] pl-3 font-[var(--kumbh)]">
                  <Layers size={18} className="text-[#3c72fc]" />
                  About the Program
                </h3>
                <p className="text-white/80 text-base leading-relaxed">
                  {certData.aboutText}
                </p>
              </div>

              {/* Program Modules Section */}
              <div className="p-8 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-4 shadow-md">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-3 border-[#3c72fc] pl-3 font-[var(--kumbh)]">
                  <BookOpen size={18} className="text-[#3c72fc]" />
                  Program Modules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {certData.modules && certData.modules.map((mod, idx) => (
                    <div 
                      key={idx} 
                      className="flex gap-3 items-start p-4 bg-white/2 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                    >
                      <span className="w-7 h-7 bg-[#3c72fc]/10 text-[#3c72fc] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-white font-medium leading-relaxed pt-0.5">
                        {mod}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certification Outcome Section */}
              <div className="p-8 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-4 shadow-md">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-3 border-[#3c72fc] pl-3 font-[var(--kumbh)]">
                  <Award size={18} className="text-[#3c72fc]" />
                  Certification Outcome
                </h3>
                <p className="text-white/80 text-base leading-relaxed">
                  {certData.outcome}
                </p>
              </div>

              {/* Program Fee Section */}
              <div className="p-8 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-4 shadow-md">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-3 border-[#3c72fc] pl-3 font-[var(--kumbh)]">
                  <DollarSign size={18} className="text-[#3c72fc]" />
                  Program Tuition & Fees
                </h3>
                <div className="w-full overflow-x-auto border border-white/5 rounded-xl mt-4">
                  <table className="w-full min-w-[450px] border-collapse">
                    <thead>
                      <tr className="bg-[#3c72fc]/10">
                        <th className="py-4 px-6 text-left text-sm font-bold text-white border-b border-white/5">Details / Description</th>
                        <th className="py-4 px-6 text-right text-sm font-bold text-white border-b border-white/5">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certData.fees && certData.fees.map((fee, idx) => {
                        const isLast = idx === certData.fees.length - 1;
                        return (
                          <tr key={idx} className={isLast ? "bg-[#3c72fc]/5 font-bold text-white" : ""}>
                            <td className={`py-4 px-6 text-sm border-b border-white/5 ${isLast ? "text-white" : "text-white/80"}`}>{fee.item}</td>
                            <td className={`py-4 px-6 text-sm border-b border-white/5 text-right font-mono ${isLast ? "text-[#3c72fc]" : "text-white"}`}>{fee.amount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-white/45 italic mt-3 block leading-relaxed">
                  * {certData.feeFootnote}
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: Who Can Apply, Why Choose, Forms */}
            <div className="flex flex-col gap-8">
              
              {/* Who Can Apply Section */}
              <div className="p-8 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-4 shadow-md">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-3 border-[#3c72fc] pl-3 font-[var(--kumbh)]">
                  <Users size={18} className="text-[#3c72fc]" />
                  Who Can Apply
                </h3>
                <ul className="flex flex-col gap-3 mt-2">
                  {certData.audience && certData.audience.map((aud, idx) => (
                    <li className="flex items-center gap-2 text-sm text-white/80" key={idx}>
                      <ChevronRight size={16} className="text-[#3c72fc] flex-shrink-0" />
                      <span>{aud}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why Choose This Level Section */}
              <div className="p-8 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-4 shadow-md">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-3 border-[#3c72fc] pl-3 font-[var(--kumbh)]">
                  <Check size={18} className="text-emerald-400" />
                  Why Choose This Level
                </h3>
                <ul className="flex flex-col gap-3 mt-2">
                  {certData.benefits && certData.benefits.map((ben, idx) => (
                    <li className="flex items-start gap-2 text-sm text-white/80" key={idx}>
                      <Check size={14} className="text-emerald-400 mt-1 flex-shrink-0" />
                      <span>{ben}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Forms / Application Section */}
              {certData.isOpen ? (
                /* Apply Online Section (For SSCC-F) */
                <div className="p-8 bg-[#151327] border border-emerald-500/20 rounded-2xl flex flex-col gap-4 shadow-md bg-gradient-to-br from-[#10b981]/5 to-transparent">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-3 border-emerald-400 pl-3 font-[var(--kumbh)]">
                    <Mail size={18} className="text-emerald-400" />
                    Apply Online
                  </h3>
                  
                  <div className="text-center flex flex-col items-center gap-5 mt-2">
                    <p className="text-sm text-white/70 leading-relaxed text-left">
                      Admissions are actively open for the <strong>July–August 2026 Batch</strong>. Seats are highly limited. Scan the QR code or click below to submit your application form.
                    </p>

                    {certData.qrCodeUrl && (
                      <div className="bg-white p-3 rounded-xl w-[174px] h-[174px] flex items-center justify-center shadow-lg border border-white/10">
                        <img 
                          src={certData.qrCodeUrl} 
                          alt="Registration QR Code" 
                          className="w-[150px] h-[150px]" 
                          title="Scan to register"
                        />
                      </div>
                    )}
                    <span className="text-[11px] text-white/45 font-semibold -mt-2 flex items-center gap-1">
                      <QrCode size={12} />
                      Scan QR for quick registration
                    </span>

                    <button
                      onClick={handleInquiry}
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl cursor-pointer shadow-md hover:shadow-emerald-500/20 transition-all border-none font-[var(--kumbh)]"
                    >
                      <span>Submit Application Form</span>
                      <ExternalLink size={16} />
                    </button>
                    {inquireStatus && (
                      <span className="text-[#3c72fc] text-sm font-semibold animate-pulse">
                        {inquireStatus}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Notify Me Section (For A, P, E) */
                <div className="p-8 bg-[#151327] border border-white/5 rounded-2xl flex flex-col gap-4 shadow-md">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-3 border-[#3c72fc] pl-3 font-[var(--kumbh)]">
                    <Bell size={18} className="text-[#3c72fc]" />
                    Notify Me
                  </h3>
                  
                  <div>
                    <p className="text-sm text-white/70 leading-relaxed mb-5">
                      {certData.code} admissions open following the conclusion of the prior level. Register your interest to be notified first.
                    </p>

                    <form onSubmit={handleNotifySubmit} className="flex flex-col gap-3.5">
                      <div>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#3c72fc] font-[var(--kumbh)]"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Your email address"
                          className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#3c72fc] font-[var(--kumbh)]"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Your contact number"
                          className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#3c72fc] font-[var(--kumbh)]"
                        />
                      </div>

                      {/* Completed prior level checkbox */}
                      {priorMap[certData.code] && (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-white/70 font-semibold">
                            I completed {priorMap[certData.code]}?
                          </span>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
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
                            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
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
                      )}

                      <button
                        type="submit"
                        className="w-full mt-4 py-3 px-6 bg-[#3c72fc] hover:bg-[#3c72fc]/80 text-white font-bold rounded-lg cursor-pointer transition-all border-none flex items-center justify-center gap-2 font-[var(--kumbh)]"
                      >
                        <Bell size={15} />
                        <span>Submit Registration</span>
                      </button>
                    </form>
                    
                    {subscribed && (
                      <p className="text-emerald-400 text-sm font-semibold mt-4 text-center animate-pulse">
                        ✔ Registered! You will be notified the moment this level opens.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Footer CTA Banner */}
      <section className="bg-[#0f0d1d] pb-16 px-6">
        <div className="max-w-[1320px] mx-auto w-full">
          <div className="p-6 md:p-8 bg-gradient-to-r from-[#151327] to-[#0b0a1a] border border-white/5 text-center rounded-[var(--radius)] shadow-lg">
            <p className="text-white/85 font-semibold text-base md:text-lg">
              "{certData.footerCta}"
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
