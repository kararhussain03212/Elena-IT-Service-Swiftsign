import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import swiftLogo from "../assets/images/logo/swift.png";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  if (token) {
    return <Navigate to={redirectTo} replace />;
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Invalid email or password";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1B3A] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14, 112, 196,0.26),transparent_44%),radial-gradient(circle_at_82%_24%,rgba(26,34,71,0.4),transparent_42%),linear-gradient(120deg,#0B1B3A_0%,#121a33_56%,#0B1B3A_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[38px_38px] opacity-25" />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[#0f1231]/82 shadow-[0_30px_120px_rgba(7,9,27,0.78)] backdrop-blur-xl">
        <div className="grid min-h-155 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative hidden flex-col justify-center border-r border-white/10 p-10 lg:flex">
            <div className="absolute -left-16 top-16 h-52 w-52 rounded-full bg-[#0E70C4]/20 blur-3xl" />
            <div className="absolute bottom-6 right-8 h-56 w-56 rounded-full bg-[#0F2A52]/45 blur-3xl" />

            <div className="relative mx-auto flex w-full max-w-lg flex-col items-start justify-center">
              <img
                src={swiftLogo}
                alt="Elena IT Services"
                className="h-28 w-auto"
              />
              <p className="mt-8 max-w-md text-4xl font-black leading-[1.1] tracking-tight text-white">
                ELENA
                <span className="block text-[#3EB6AC]">
                  IT Services
                </span>
              </p>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/72">
                Track content, monitor contact leads, and publish updates from
                one elegant control panel.
              </p>
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <form
              onSubmit={onSubmit}
              className="w-full max-w-md rounded-2xl border border-white/12 bg-[#111737]/90 p-6 shadow-[0_14px_48px_rgba(6,9,30,0.58)] sm:p-8"
            >
              <div className="lg:hidden">
                <img
                  src={swiftLogo}
                  alt="Elena IT Services"
                  className="h-14 w-auto"
                />
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
                Elena IT Services
              </h1>
              <p className="mt-2 text-sm text-white/65">
                Sign in to continue to your admin dashboard.
              </p>

              <div className="mt-7 flex w-full flex-col gap-4">
                <label className="text-xs font-semibold uppercase tracking-[0.13em] text-cyan-100/90">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={onChange}
                  className="h-12 w-full rounded-xl border border-white/20 bg-white/6 px-4 text-white placeholder:text-white/35 outline-none transition-colors focus:border-cyan-300/70 focus:bg-white/10"
                />

                <label className="mt-1 text-xs font-semibold uppercase tracking-[0.13em] text-cyan-100/90">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={onChange}
                  className="h-12 w-full rounded-xl border border-white/20 bg-white/6 px-4 text-white placeholder:text-white/35 outline-none transition-colors focus:border-cyan-300/70 focus:bg-white/10"
                />
              </div>

              {error ? (
                <p className="mt-4 w-full rounded-xl border border-rose-300/45 bg-rose-500/20 px-3 py-2 text-center text-sm text-rose-100">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0E70C4] text-sm font-bold tracking-wide text-white shadow-[0_12px_26px_rgba(14, 112, 196,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1257A8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Logging in..." : "Log In"}
              </button>

              <p className="mt-4 text-center text-xs text-white/45">
                Protected access for authorized Elena IT Services staff.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
