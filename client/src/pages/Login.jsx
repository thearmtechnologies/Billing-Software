import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../context/userContext";
import { 
  FileText, 
  BarChart2, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight
} from "lucide-react";

import logoSrc from "../assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentUser } = useContext(UserContext);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      axios.defaults.withCredentials = true;
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/login`,
        formData
      );

      const data = response.data;

      if (data.user) {
        setCurrentUser(data.user);
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response && error.response.data) {
        setErrors({
          general:
            error.response.data.message ||
            error.response.data.error ||
            "Login failed",
        });
      } else if (error.message) {
        setErrors({ general: error.message });
      } else {
        setErrors({
          general: "An error occurred while logging in. Please try again later.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* LEFT SIDE - Info Panel (Glass / Subtle Gradient) - Hidden on mobile, visible on tablet and desktop */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative overflow-hidden"
        style={{ 
          paddingLeft: "clamp(1.5rem, 5vw, 3rem)", 
          paddingRight: "clamp(1.5rem, 5vw, 3rem)",
          background: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
          borderRight: "1px solid rgba(255,255,255,0.4)"
        }}
      >
        {/* Subtle decorative background shapes */}
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)" }}></div>
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "30vw", height: "30vw", background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)" }}></div>

        <div className="w-full max-w-lg relative z-10">
          {/* Logo block */}
          <div className="flex items-center" style={{ gap: "clamp(0.75rem, 2vw, 1rem)", marginBottom: "clamp(2rem, 5vw, 3rem)" }}>
            <img src={logoSrc} alt="ARM Technologies Logo" style={{ height: "clamp(60px, 8vw, 100px)", width: "clamp(60px, 8vw, 100px)", objectFit: "contain" }} />
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              ARM Technologies
            </h1>
          </div>

          <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-bold text-gray-900 leading-tight tracking-tight" style={{ marginBottom: "clamp(0.75rem, 2vw, 1rem)" }}>
            Welcome to Excellence.
          </h2>
          <p className="text-[clamp(0.9rem,2vw,1.1rem)] font-medium text-gray-600" style={{ marginBottom: "clamp(2rem, 5vw, 3rem)", lineHeight: "1.6" }}>
            Streamline your billing, manage client ledgers, and automate notifications effortlessly with a premium experience.
          </p>

          <div className="flex flex-col" style={{ gap: "clamp(1.5rem, 3vw, 2rem)" }}>
            {/* Feature 1 */}
            <div className="flex items-start" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
              <div className="shrink-0" style={{ padding: "clamp(0.5rem, 1.5vw, 0.75rem)", marginTop: "0.25rem", background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-soft)", border: "1px solid rgba(255,255,255,1)" }}>
                <FileText style={{ width: "clamp(16px, 2vw, 20px)", height: "clamp(16px, 2vw, 20px)", color: "var(--color-primary)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-[clamp(0.9rem,2vw,1rem)] leading-tight">Professional Invoicing</h3>
                <p className="text-[clamp(0.85rem,1.8vw,0.95rem)] text-gray-500" style={{ marginTop: "0.25rem" }}>Generate elegant, GST-ready invoices and estimates instantly.</p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="flex items-start" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
              <div className="shrink-0" style={{ padding: "clamp(0.5rem, 1.5vw, 0.75rem)", marginTop: "0.25rem", background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-soft)", border: "1px solid rgba(255,255,255,1)" }}>
                <BarChart2 style={{ width: "clamp(16px, 2vw, 20px)", height: "clamp(16px, 2vw, 20px)", color: "var(--color-primary)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-[clamp(0.9rem,2vw,1rem)] leading-tight">Comprehensive Ledgers</h3>
                <p className="text-[clamp(0.85rem,1.8vw,0.95rem)] text-gray-500" style={{ marginTop: "0.25rem" }}>Keep track of client balances and payment histories automatically.</p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="flex items-start" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
              <div className="shrink-0" style={{ padding: "clamp(0.5rem, 1.5vw, 0.75rem)", marginTop: "0.25rem", background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-soft)", border: "1px solid rgba(255,255,255,1)" }}>
                <ShieldCheck style={{ width: "clamp(16px, 2vw, 20px)", height: "clamp(16px, 2vw, 20px)", color: "var(--color-primary)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-[clamp(0.9rem,2vw,1rem)] leading-tight">Smart Notifications</h3>
                <p className="text-[clamp(0.85rem,1.8vw,0.95rem)] text-gray-500" style={{ marginTop: "0.25rem" }}>Send automated payment reminders via WhatsApp, SMS, and Email.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Form Panel */}
      <div 
        className="w-full lg:w-1/2 flex flex-col justify-center items-center"
        style={{ paddingLeft: "clamp(1rem, 4vw, 1.5rem)", paddingRight: "clamp(1rem, 4vw, 1.5rem)", background: "var(--surface)" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo for smaller screens */}
          <div className="flex lg:hidden items-center" style={{ gap: "0.75rem", marginBottom: "clamp(1.5rem, 5vh, 2.5rem)", justifyContent: "center" }}>
            <img src={logoSrc} alt="ARM Technologies Logo" style={{ height: "clamp(60px, 6vw, 80px)", width: "clamp(60px, 6vw, 80px)", objectFit: "contain" }} />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">ARM Technologies</h1>
          </div>

          <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-bold text-gray-900 tracking-tight" style={{ marginBottom: "0.3rem" }}>Sign In</h2>
          <p className="text-gray-500 text-[clamp(0.85rem,2vw,0.95rem)]" style={{ marginBottom: "clamp(1.5rem, 5vh, 2.5rem)" }}>Enter your credentials to securely access your account.</p>

          <form className="flex flex-col" style={{ gap: "1.5rem" }} onSubmit={handleSubmit}>
            {errors.general && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", padding: "clamp(0.75rem, 2vw, 1rem)" }}>
                <div className="flex">
                  <div className="flex-shrink-0">
                     <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                     </svg>
                  </div>
                  <div style={{ marginLeft: "0.75rem" }}>
                    <p className="text-sm font-medium text-red-800">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col" style={{ gap: "1.25rem" }}>
              <div>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={{ paddingLeft: "clamp(0.75rem, 2vw, 1rem)" }}>
                    <Mail style={{ height: "18px", width: "18px", color: "#9CA3AF" }} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ paddingLeft: "clamp(2.25rem, 5vw, 2.75rem)" }}
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm" style={{ marginTop: "0.375rem" }}>{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={{ paddingLeft: "clamp(0.75rem, 2vw, 1rem)" }}>
                    <Lock style={{ height: "18px", width: "18px", color: "#9CA3AF" }} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ paddingLeft: "clamp(2.25rem, 5vw, 2.75rem)", paddingRight: "clamp(2rem, 4vw, 3rem)" }}
                    placeholder="••••••••"
                  />
                   <button 
                     type="button" 
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute inset-y-0 right-0 flex items-center focus:outline-none"
                     style={{ paddingRight: "clamp(0.75rem, 2vw, 1rem)" }}
                   >
                     {showPassword ? (
                       <EyeOff style={{ height: "18px", width: "18px", color: "#9CA3AF" }} className="hover:text-gray-600 transition-colors" />
                     ) : (
                       <Eye style={{ height: "18px", width: "18px", color: "#9CA3AF" }} className="hover:text-gray-600 transition-colors" />
                     )}
                   </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm" style={{ marginTop: "0.375rem" }}>{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end" style={{ marginTop: "-6px" }}>
              <a href="#" className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: "100%", padding: "clamp(0.625rem, 2vh, 0.75rem) clamp(0.75rem, 3vw, 1rem)", fontSize: "clamp(0.875rem, 2vw, 1rem)", marginTop: "0.5rem" }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight style={{ height: "18px", width: "18px" }} />
                </>
              )}
            </button>

            <div className="text-center" style={{ marginTop: "1rem" }}>
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-semibold"
                  style={{ color: "var(--color-primary)" }}
                >
                  Create account
                </button>
              </p>
            </div>
            
            <div className="app-card" style={{ marginTop: "clamp(1rem, 3vh, 2rem)", padding: "clamp(0.75rem, 2vw, 1rem)", background: "var(--surface-secondary)", border: "none", boxShadow: "none" }}>
               <div className="flex items-start" style={{ gap: "clamp(0.5rem, 2vw, 0.75rem)" }}>
                  <div className="flex-shrink-0" style={{ marginTop: "0.125rem" }}>
                     <svg className="h-5 w-5" style={{ color: "var(--color-primary)" }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                     </svg>
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold text-gray-900">
                        Demo Instructions
                     </h3>
                     <p className="text-xs text-gray-600 font-medium" style={{ marginTop: "0.25rem", lineHeight: "1.5" }}>
                        First complete registration, then use those credentials to login.
                     </p>
                  </div>
               </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;