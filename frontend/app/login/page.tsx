"use client";
import { useState, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  IndianRupee,
  Loader2,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLogin } from "@/hooks/useAuth";
import { LoginFormValues, loginSchema } from "@/validations/validations";
import { useTranslations } from "@/hooks/useTranslations";

const SCHOOL_NAME = "Nageshwari Devi Shree Krishna Girls Inter College";
const SCHOOL_CODE = "N.D.S.K.G.I.C.";
const ATTENDANCE_BARS = [72, 85, 78, 91, 88, 94, 82, 96, 89, 93, 87, 91];
const EASE = [0.16, 1, 0.3, 1] as const;
const WINDOW_COLUMNS = [0, 1, 2];
const WINDOW_ROWS = [0, 1, 2];
const WINGS = [
  { x: 72, offset: 0 },
  { x: 254, offset: 1 },
];

const ILLUSTRATION_VARS =
  "[--illus-wall-top:#e0e7ff] [--illus-wall-bottom:#c7d2fe] [--illus-line:rgba(11,16,32,0.14)] [--illus-window-off:rgba(11,16,32,0.08)] [--illus-window-on:#6366f1] [--illus-face:#ffffff] [--illus-ink:#4338ca] [--illus-shadow:rgba(11,16,32,0.08)] [--illus-trunk:#a8a29e] [--illus-dot:#6366f1] [--illus-book:#eef2ff] dark:[--illus-wall-top:#1c2645] dark:[--illus-wall-bottom:#0c1326] dark:[--illus-line:rgba(255,255,255,0.12)] dark:[--illus-window-off:rgba(255,255,255,0.06)] dark:[--illus-window-on:#818cf8] dark:[--illus-face:#050810] dark:[--illus-ink:#c7d2fe] dark:[--illus-shadow:rgba(0,0,0,0.45)] dark:[--illus-trunk:#3f3f46] dark:[--illus-dot:#c7d2fe] dark:[--illus-book:#1c2645]";

const tileClass =
  "absolute z-10 rounded-2xl border border-border bg-background/85 p-3.5 shadow-[0_16px_40px_rgba(11,16,32,0.08)] backdrop-blur-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)]";

const fieldClass = (hasError: boolean) =>
  `h-11 rounded-full bg-card px-4 font-manrope text-sm text-foreground placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0 ${
    hasError
      ? "border-red-500/50 focus-visible:border-red-500"
      : "border-input focus-visible:border-indigo-500"
  }`;

const tileMotion = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
});

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1.5 ml-1 flex items-center gap-1 font-manrope text-xs text-red-600 dark:text-red-400"
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </motion.p>
  );
};

const TileIcon = ({ children }: { children: ReactNode }) => (
  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-foreground/70">
    {children}
  </span>
);

const SchoolIllustration = () => (
  <svg
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-auto w-full"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="school-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--illus-wall-top)" />
        <stop offset="1" stopColor="var(--illus-wall-bottom)" />
      </linearGradient>
      <linearGradient id="school-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#818cf8" />
        <stop offset="1" stopColor="#4338ca" />
      </linearGradient>
      <radialGradient id="school-glow" cx="0.5" cy="0.55" r="0.5">
        <stop offset="0" stopColor="#6366f1" stopOpacity="0.25" />
        <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
      </radialGradient>
    </defs>

    <ellipse cx="200" cy="165" rx="200" ry="140" fill="url(#school-glow)" />
    <ellipse cx="200" cy="252" rx="165" ry="9" fill="var(--illus-shadow)" />
    <path d="M14 250H386" stroke="var(--illus-line)" strokeWidth="1.5" />

    <rect
      x="36"
      y="222"
      width="4"
      height="28"
      rx="1"
      fill="var(--illus-trunk)"
    />
    <circle cx="38" cy="210" r="18" fill="#059669" fillOpacity="0.55" />
    <circle cx="30" cy="218" r="11" fill="#10b981" fillOpacity="0.45" />
    <rect
      x="360"
      y="222"
      width="4"
      height="28"
      rx="1"
      fill="var(--illus-trunk)"
    />
    <circle cx="362" cy="210" r="18" fill="#059669" fillOpacity="0.55" />
    <circle cx="370" cy="218" r="11" fill="#10b981" fillOpacity="0.45" />

    {WINGS.map((wing) => (
      <g key={wing.x}>
        <rect
          x={wing.x}
          y="152"
          width="74"
          height="98"
          fill="url(#school-wall)"
          stroke="var(--illus-line)"
        />
        <rect
          x={wing.x - 4}
          y="145"
          width="82"
          height="8"
          rx="2"
          fill="#4338ca"
        />
        {WINDOW_ROWS.map((row) =>
          WINDOW_COLUMNS.map((col) => {
            const isLit = (row + col + wing.offset) % 2 === 0;
            return (
              <rect
                key={`${row}-${col}`}
                x={wing.x + 9 + col * 21}
                y={164 + row * 27}
                width="14"
                height="17"
                rx="2"
                fill={
                  isLit ? "var(--illus-window-on)" : "var(--illus-window-off)"
                }
                fillOpacity={isLit ? 0.6 : 1}
              />
            );
          }),
        )}
      </g>
    ))}

    <rect
      x="140"
      y="122"
      width="120"
      height="128"
      fill="url(#school-wall)"
      stroke="var(--illus-line)"
    />
    <path d="M128 126L200 80L272 126Z" fill="url(#school-roof)" />
    <path
      d="M128 126H272"
      stroke="#c7d2fe"
      strokeOpacity="0.6"
      strokeWidth="2"
    />
    <circle
      cx="200"
      cy="106"
      r="11"
      fill="var(--illus-face)"
      stroke="#c7d2fe"
    />
    <path
      d="M200 99V106L205 109"
      stroke="var(--illus-ink)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <path d="M200 80V36" stroke="var(--illus-line)" strokeWidth="1.5" />
    <rect x="201" y="38" width="24" height="5" fill="#ff9933" />
    <rect
      x="201"
      y="43"
      width="24"
      height="5"
      fill="#f8fafc"
      stroke="var(--illus-line)"
      strokeWidth="0.5"
    />
    <rect x="201" y="48" width="24" height="5" fill="#138808" />
    <circle cx="213" cy="45.5" r="1.6" fill="#1e3a8a" />

    {[150, 170, 222, 242].map((x) => (
      <rect
        key={x}
        x={x}
        y="132"
        width="8"
        height="108"
        rx="1"
        fill="var(--illus-window-off)"
      />
    ))}
    <rect
      x="186"
      y="150"
      width="28"
      height="22"
      rx="2"
      fill="var(--illus-window-on)"
      fillOpacity="0.55"
    />
    <path
      d="M186 240V212C186 204.268 192.268 198 200 198C207.732 198 214 204.268 214 212V240Z"
      fill="#6366f1"
      fillOpacity="0.3"
      stroke="#818cf8"
    />
    <rect
      x="170"
      y="240"
      width="60"
      height="5"
      rx="1"
      fill="var(--illus-window-off)"
    />
    <rect
      x="162"
      y="245"
      width="76"
      height="5"
      rx="1"
      fill="var(--illus-window-off)"
    />

    <g opacity="0.8">
      <path d="M52 62L70 54L88 62L70 70Z" fill="#818cf8" />
      <path
        d="M60 66V74C60 74 64 78 70 78C76 78 80 74 80 74V66"
        stroke="#818cf8"
        strokeWidth="2"
      />
      <path d="M88 62V72" stroke="var(--illus-ink)" strokeWidth="1.5" />
    </g>
    <g opacity="0.8">
      <path
        d="M318 60H338C341 60 342 62 342 64V84H322C320 84 318 83 318 80Z"
        fill="var(--illus-book)"
        stroke="#818cf8"
      />
      <path
        d="M342 64C342 62 343 60 346 60H362V80C362 83 360 84 358 84H342"
        fill="var(--illus-book)"
        stroke="#818cf8"
      />
      <path
        d="M324 68H336M324 74H336M348 68H356M348 74H356"
        stroke="var(--illus-ink)"
        strokeOpacity="0.6"
      />
    </g>
    {[
      [110, 40],
      [290, 30],
      [24, 120],
      [376, 130],
      [150, 22],
    ].map(([cx, cy]) => (
      <circle
        key={`${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r="1.6"
        fill="var(--illus-dot)"
        fillOpacity="0.6"
      />
    ))}
  </svg>
);

function ShowcasePanel() {
  const t = useTranslations("login");

  return (
    <aside
      className={`relative hidden overflow-hidden rounded-3xl border border-border bg-card lg:flex lg:flex-col ${ILLUSTRATION_VARS}`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--foreground) 7%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(99,102,241,0.10),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_50%_45%,rgba(99,102,241,0.14),transparent_60%)]" />

      <motion.div {...tileMotion(0.1)} className="relative z-10 px-10 pt-28">
        <p className="font-manrope text-[11px] tracking-widest text-muted-foreground uppercase">
          {t("institutionOverview")}
        </p>
        <p className="mt-1 font-jakarta text-2xl font-bold text-foreground xl:text-3xl">
          {t("schoolDashboard")}
        </p>
      </motion.div>

      <div className="relative z-10 flex flex-1 items-center px-6 py-6 xl:px-10">
        <div className="relative mx-auto w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="px-12 py-14 xl:px-16"
          >
            <SchoolIllustration />
          </motion.div>

          <motion.div
            {...tileMotion(0.25)}
            className={`${tileClass} top-0 left-0 w-44`}
          >
            <div className="flex items-center gap-2">
              <TileIcon>
                <Users className="size-3" />
              </TileIcon>
              <p className="font-manrope text-[11px] text-muted-foreground">
                {t("students")}
              </p>
            </div>
            <p className="mt-2.5 font-jakarta text-xl leading-none font-bold text-foreground">
              1,240
            </p>
            <p className="mt-1 font-manrope text-[10px] text-emerald-600 dark:text-emerald-400">
              +3.1% {t("thisMonth")}
            </p>
            <Separator className="my-2.5" />
            <div className="flex justify-between gap-2 font-manrope text-[10px] text-muted-foreground">
              <span>
                {t("teachingStaff")}{" "}
                <span className="font-jakarta font-semibold text-foreground">
                  68
                </span>
              </span>
              <span>
                {t("classSections")}{" "}
                <span className="font-jakarta font-semibold text-foreground">
                  42
                </span>
              </span>
            </div>
          </motion.div>

          <motion.div
            {...tileMotion(0.4)}
            className={`${tileClass} top-6 right-0 w-52`}
          >
            <div className="flex items-center justify-between">
              <p className="font-manrope text-[10px] tracking-wider text-muted-foreground uppercase">
                {t("attendanceRate")}
              </p>
              <span className="flex items-center gap-1 font-manrope text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {t("live")}
              </span>
            </div>
            <div className="mt-3 flex h-10 items-end gap-0.75">
              {ATTENDANCE_BARS.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-xs"
                  style={{
                    height: `${height}%`,
                    background:
                      i === ATTENDANCE_BARS.length - 1
                        ? "linear-gradient(to top, #6366f1, #818cf8)"
                        : i > 8
                          ? "rgba(99,102,241,0.5)"
                          : "color-mix(in oklab, var(--foreground) 10%, transparent)",
                  }}
                />
              ))}
            </div>
            <div className="mt-2.5 flex items-end justify-between">
              <span className="font-jakarta text-xl font-bold text-foreground">
                91.4%
              </span>
              <span className="font-manrope text-[10px] text-muted-foreground">
                {t("thisSession")}
              </span>
            </div>
          </motion.div>

          <motion.div
            {...tileMotion(0.55)}
            className={`${tileClass} bottom-4 left-2 w-40`}
          >
            <div className="flex items-center gap-2">
              <TileIcon>
                <IndianRupee className="size-3" />
              </TileIcon>
              <p className="font-manrope text-[11px] text-muted-foreground">
                {t("feeCollection")}
              </p>
            </div>
            <p className="mt-2.5 font-jakarta text-xl leading-none font-bold text-foreground">
              ₹18.6L
            </p>
            <p className="mt-1 font-manrope text-[10px] text-muted-foreground">
              {t("thisMonth")}
            </p>
          </motion.div>

          <motion.div
            {...tileMotion(0.7)}
            className={`${tileClass} right-4 bottom-0 w-40`}
          >
            <div className="flex items-center gap-2">
              <TileIcon>
                <TrendingUp className="size-3" />
              </TileIcon>
              <p className="font-manrope text-[11px] text-muted-foreground">
                {t("avgPerformance")}
              </p>
            </div>
            <p className="mt-2.5 font-jakarta text-xl leading-none font-bold text-foreground">
              81.2%
            </p>
            <p className="mt-1 font-manrope text-[10px] text-muted-foreground">
              {t("boardExams")}
            </p>
          </motion.div>
        </div>
      </div>
    </aside>
  );
}

const LoginPage = () => {
  const t = useTranslations("login");
  const { mutate: login, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 gap-3 bg-background p-3 lg:grid-cols-2">
      <ShowcasePanel />

      <div className="flex items-center justify-center px-4 pt-24 pb-12 sm:px-8 lg:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <Image
              src="/logo.png"
              alt={SCHOOL_NAME}
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-jakarta text-sm font-bold tracking-wide text-foreground">
              {SCHOOL_CODE}
            </span>
          </div>

          <div className="text-center">
            <h1 className="font-jakarta text-2xl font-bold text-foreground sm:text-3xl">
              {t("signIn")}
            </h1>
            <p className="mt-2 font-manrope text-sm text-muted-foreground">
              {t("signInSub")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-5"
            noValidate
          >
            <div>
              <Label
                htmlFor="identifier"
                className="mb-1.5 ml-1 block font-manrope text-xs font-normal text-foreground/70"
              >
                {t("emailOrReg")}
              </Label>
              <Input
                id="identifier"
                autoComplete="username"
                placeholder={t("identifierPlaceholder")}
                aria-invalid={!!errors.identifier}
                className={fieldClass(!!errors.identifier)}
                {...register("identifier")}
              />
              <FieldError message={errors.identifier?.message} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="ml-1 font-manrope text-xs font-normal text-foreground/70"
                >
                  {t("password")}
                </Label>
                <Button
                  asChild
                  variant="link"
                  className="h-auto p-0 font-manrope text-xs font-normal text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <Link href="#">{t("forgotPassword")}</Link>
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("passwordPlaceholder")}
                  aria-invalid={!!errors.password}
                  className={`${fieldClass(!!errors.password)} pr-12`}
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                  className="absolute top-1/2 right-1.5 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              <FieldError message={errors.password?.message} />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="group h-11 w-full gap-2 rounded-full bg-primary font-manrope text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("signingIn")}
                </>
              ) : (
                <>
                  {t("signInBtn")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="w-auto flex-1" />
            <span className="font-manrope text-xs text-muted-foreground">
              {t("orDivider")}
            </span>
            <Separator className="w-auto flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Button
              asChild
              variant="outline"
              className="h-11 gap-2 rounded-full border-border bg-card font-manrope text-xs font-medium text-foreground/80 shadow-none hover:bg-accent hover:text-foreground"
            >
              <Link href="/admission">
                <GraduationCap className="size-4" />
                {t("applyAdmission")}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 gap-2 rounded-full border-border bg-card font-manrope text-xs font-medium text-foreground/80 shadow-none hover:bg-accent hover:text-foreground"
            >
              <Link href="/teacher-application">
                <UserPlus className="size-4" />
                {t("applyTeacher")}
              </Link>
            </Button>
          </div>

          <p className="mt-8 text-center font-manrope text-xs text-muted-foreground">
            {t("needAccess")}{" "}
            <Button
              asChild
              variant="link"
              className="h-auto p-0 font-manrope text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <Link href="#">{t("contactAdmin")}</Link>
            </Button>
          </p>

          <p className="mt-6 text-center font-manrope text-[11px] text-muted-foreground/70">
            {t("footer")}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
