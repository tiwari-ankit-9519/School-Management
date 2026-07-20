"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/hooks/useAuth";
import { ArrowRight, Lock, User } from "lucide-react";
import AnimatedInput from "@/components/smoothui/animated-input";
import { motion } from "motion/react";
import Image from "next/image";
import { LoginFormValues, loginSchema } from "@/validations/validations";
import { useTranslations } from "@/hooks/useTranslations";

const SCHOOL_NAME = "Nageshwari Devi Shree Krishna Girls Inter College";
const SCHOOL_CODE = "N.D.S.K.G.I.C.";

const LoginPage = () => {
  const t = useTranslations("login");
  const { mutate: login, isPending } = useLogin();
  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });
  const identifierValue = useWatch({ control, name: "identifier" });
  const passwordValue = useWatch({ control, name: "password" });
  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050810] flex items-center justify-center px-4 py-12 sm:px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%]"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, #1e3a5f22 0%, transparent 60%), radial-gradient(ellipse at 75% 40%, #0ea5e910 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #6366f108 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute top-1/2 left-[26%] -translate-x-1/2 -translate-y-1/2 w-175 h-175 opacity-[0.05]"
          style={{
            maskImage:
              "radial-gradient(circle at center, black 0%, black 30%, transparent 68%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 0%, black 30%, transparent 68%)",
          }}
        >
          <Image
            src="/logo.png"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, rotate: -6, y: 60 }}
          animate={{ opacity: 1, rotate: -6, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute -right-16 top-[-8%] w-[58vw] max-w-215 h-[75vh] min-h-130 rounded-3xl overflow-hidden shadow-2xl"
          style={{ transformOrigin: "center center" }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-[#0f2847] via-[#0c1e3a] to-[#071224]" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="absolute inset-0 flex flex-col justify-between p-8 xl:p-12">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/30 text-xs font-manrope uppercase tracking-widest mb-1">
                  {t("institutionOverview")}
                </div>
                <div className="text-white text-lg font-bold font-jakarta">
                  {t("schoolDashboard")}
                </div>
              </div>
              <div className="flex gap-1.5">
                {["bg-red-400/60", "bg-yellow-400/60", "bg-green-400/60"].map(
                  (c, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                  ),
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    labelKey: "students",
                    value: "1,240",
                    delta: "+3.1%",
                    up: true,
                  },
                  {
                    labelKey: "teachingStaff",
                    value: "68",
                    delta: "+2",
                    up: true,
                  },
                  {
                    labelKey: "classSections",
                    value: "42",
                    delta: "12",
                    up: true,
                  },
                ].map((s) => (
                  <div
                    key={s.labelKey}
                    className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm"
                  >
                    <div className="text-white/40 text-xs font-manrope mb-1.5">
                      {t(s.labelKey as Parameters<typeof t>[0])}
                    </div>
                    <div className="text-white text-lg font-bold font-jakarta leading-none mb-1">
                      {s.value}
                    </div>
                    <div
                      className={`text-xs font-manrope ${s.up ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {s.delta} {t("thisMonth")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/40 text-xs font-manrope uppercase tracking-wider">
                    {t("attendanceRate")}
                  </span>
                  <span className="text-emerald-400 text-xs font-manrope font-medium">
                    {t("live")}
                  </span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {[72, 85, 78, 91, 88, 94, 82, 96, 89, 93, 87, 91].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          background:
                            i === 11
                              ? "linear-gradient(to top, #6366f1, #818cf8)"
                              : i > 8
                                ? "rgba(99,102,241,0.5)"
                                : "rgba(255,255,255,0.08)",
                        }}
                      />
                    ),
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white text-2xl font-bold font-jakarta">
                    91.4%
                  </span>
                  <span className="text-white/30 text-xs font-manrope">
                    {t("thisSession")}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    labelKey: "feeCollection",
                    value: "₹18.6L",
                    subKey: "thisMonth",
                    color: "from-indigo-500/20 to-indigo-600/5",
                  },
                  {
                    labelKey: "avgPerformance",
                    value: "81.2%",
                    subKey: "boardExams",
                    color: "from-sky-500/20 to-sky-600/5",
                  },
                ].map((c) => (
                  <div
                    key={c.labelKey}
                    className={`bg-linear-to-br ${c.color} border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm`}
                  >
                    <div className="text-white/40 text-xs font-manrope mb-1">
                      {t(c.labelKey as Parameters<typeof t>[0])}
                    </div>
                    <div className="text-white text-xl font-bold font-jakarta">
                      {c.value}
                    </div>
                    <div className="text-white/30 text-xs font-manrope mt-0.5">
                      {t(c.subKey as Parameters<typeof t>[0])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-r from-[#050810] via-[#050810]/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-t from-[#050810]/60 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-120"
      >
        <div className="relative bg-white/4 border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
          </div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8">
              <Image
                src="/logo.png"
                alt={`${SCHOOL_NAME} Logo`}
                width={40}
                height={40}
                className="object-contain"
              />
              <div className="min-w-0">
                <span className="text-white text-sm font-bold font-jakarta tracking-tight block leading-tight truncate">
                  {t("schoolName")}
                </span>
                <span className="text-indigo-300/70 text-xs font-manrope tracking-wide">
                  {SCHOOL_CODE}
                </span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-jakarta text-white leading-tight mb-1.5">
              {t("signIn")}
            </h1>
            <p className="text-sm text-white/40 font-manrope">
              {t("signInSub")}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <AnimatedInput
                label={t("emailOrReg")}
                icon={<User className="h-4 w-4 text-indigo-400" />}
                value={identifierValue}
                onChange={(val) =>
                  setValue("identifier", val, { shouldValidate: true })
                }
                inputClassName="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
                labelClassName="text-white/40"
              />
              {errors.identifier && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 font-manrope ml-1"
                >
                  {errors.identifier.message}
                </motion.p>
              )}
            </div>
            <div className="space-y-1.5">
              <AnimatedInput
                label={t("password")}
                icon={<Lock className="h-4 w-4 text-indigo-400" />}
                type="password"
                value={passwordValue}
                onChange={(val) =>
                  setValue("password", val, { shouldValidate: true })
                }
                inputClassName="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
                labelClassName="text-white/40"
              />
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 font-manrope ml-1"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>
            <div className="flex justify-end pt-0.5">
              <a
                href="#"
                className="text-xs text-indigo-400 font-manrope hover:text-indigo-300 transition-colors"
              >
                {t("forgotPassword")}
              </a>
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-xl font-jakarta font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white border-0 transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 group mt-1"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  {t("signingIn")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t("signInBtn")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/6">
            <p className="text-center text-xs text-white/30 font-manrope">
              {t("needAccess")}{" "}
              <a
                href="#"
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                {t("contactAdmin")}
              </a>
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] text-white/20 font-manrope mt-5">
          {t("footer")}
        </p>
      </motion.div>
    </div>
  );
};
export default LoginPage;
