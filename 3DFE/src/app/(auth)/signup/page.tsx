"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/lib/hooks/useAuth";
import { Loading } from "@/components/ui/loading";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";

// Define validation schema with Zod
const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and policies",
  }),
});

// Define data type from schema
type SignupFormValues = z.infer<typeof signupSchema>;

function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");

  // Initialize React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      agreeToTerms: false,
    },
  });

  const { mutate: registerAccount, isSuccess, isPending } = useRegister();
  // Handle registration
  const onSubmit = async (data: SignupFormValues) => {
    // Validate CAPTCHA
    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification");
      return;
    }

    setLoading(true);

    registerAccount({ ...data, captchaToken }, {
      onSuccess: () => {
        // Redirect is handled in useRegister hook
      },
      onError: (error) => {
        toast.error(error.message);
        setLoading(false);
      },
    });
  };

  if (isPending) {
    return (
      <Loading variant="spinner" size="lg" text="Processing..." fullScreen />
    );
  }

  if (isSuccess) {
    toast.success("Account created successfully, please log in");
  }

  return (
    <div className="flex min-h-screen">
      {/* Centered Form */}
      <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 py-12 px-6 sm:px-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-medium mb-2">Get Started Now</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name field */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium">
                Name
              </label>
              <div className="relative">
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="fullName"
                  placeholder="Enter your name"
                  className={`h-12 w-full rounded-lg border px-4 ${errors.fullName ? "border-red-500" : ""
                    }`}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  className={`h-12 w-full rounded-lg border px-4 ${errors.email ? "border-red-500" : ""
                    }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`h-12 w-full rounded-lg border px-4 ${errors.password ? "border-red-500" : ""
                    }`}
                  {...register("password")}
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer z-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  className={`w-4 h-4 border rounded ${errors.agreeToTerms ? "border-red-500" : "border-gray-300"
                    }`}
                  {...register("agreeToTerms")}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-xs font-medium">
                  I agree to the terms & policy
                </label>
                {errors.agreeToTerms && (
                  <p className="text-xs text-red-500">
                    {errors.agreeToTerms.message}
                  </p>
                )}
              </div>
            </div>

            {/* Cloudflare Turnstile CAPTCHA */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Security Verification
              </label>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token: string) => setCaptchaToken(token)}
                onError={() => {
                  setCaptchaToken("");
                  toast.error("CAPTCHA verification failed. Please try again.");
                }}
                onExpire={() => {
                  setCaptchaToken("");
                  toast.warning("CAPTCHA expired. Please verify again.");
                }}
              />
            </div>

            {/* Signup button */}
            <Button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full h-12 bg-black hover:bg-gray-800 text-yellow-400 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Signup"}
            </Button>
          </form >

          {/* Divider */}
          < div className="relative my-6" >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div >

          <div className="text-center mt-6">
            <p className="text-sm">
              Have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-black hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center mt-6">
            <Link
              href="/"
              className="flex items-center justify-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A5B22]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div >
      </div >
    </div >
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={<Loading variant="spinner" size="lg" fullScreen />}>
      <SignUpForm />
    </Suspense>
  );
}
