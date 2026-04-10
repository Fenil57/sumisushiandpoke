import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { loginWithEmail } from "../services/authService";
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginWithEmail(email, password);
      navigate("/admin");
    } catch (err: any) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-sumi)] flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-washi) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <BrandLogo
            stacked
            imageClassName="h-20 w-20 object-contain mx-auto"
            textClassName="text-2xl font-bold tracking-[0.15em] text-[var(--color-washi)]"
            subtextClassName="text-[11px] tracking-[0.28em] uppercase text-[var(--color-shu)]"
          />
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--color-washi)]/40 mt-4">
            Staff Dashboard
          </p>
        </div>

        <div className="bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/10 p-8 md:p-10 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[var(--color-shu)]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[var(--color-shu)]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[var(--color-shu)]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[var(--color-shu)]" />

          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--color-washi)]/10">
            <div className="w-10 h-10 bg-[var(--color-shu)] flex items-center justify-center">
              <Lock size={18} className="text-[var(--color-washi)]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[var(--color-washi)]">
                Sign In
              </h2>
              <p className="text-xs text-[var(--color-washi)]/40">
                Enter your credentials
              </p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 mb-6"
            >
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 pl-11 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="........"
                  className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 pl-11 pr-11 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30 hover:text-[var(--color-washi)]/60 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden w-full py-4 bg-[var(--color-shu)] text-[var(--color-washi)] text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#a02020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-8"
            >
              <span
                className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
              >
                Sign In
              </span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-[var(--color-washi)]/40 border-t-[var(--color-washi)] rounded-full"
                  />
                </span>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-[var(--color-washi)]/20 text-xs mt-6 tracking-wide">
          (c) {new Date().getFullYear()} Sumi Sushi and Poke
        </p>
      </motion.div>
    </div>
  );
}
