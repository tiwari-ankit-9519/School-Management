"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { formSchema } from "@/types/loginTypes";
import { login } from "@/actions/login";

const Login = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    await login(values);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          <div className="relative z-10 flex flex-col justify-end p-8 lg:p-12 xl:p-16 text-white">
            <div className="space-y-6">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Welcome to the
                <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Future of Work
                </span>
              </h1>
              <p className="text-lg xl:text-xl text-blue-100 max-w-md">
                Join thousands of professionals who trust our platform for their
                daily workflow.
              </p>
              <div className="flex items-center space-x-2 text-sm text-blue-200">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Over 10,000+ active users</span>
              </div>
            </div>
          </div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-cyan-400/20 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-purple-400/20 rounded-full blur-md"></div>
        </div>

        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Sign in to your account to continue
              </p>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <FormControl>
                            <Input
                              className="pl-10 h-12 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                              placeholder="Enter your email"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <FormControl>
                            <Input
                              className="pl-10 pr-10 h-12 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                              placeholder="Enter your password"
                              type={showPassword ? "text" : "password"}
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between text-sm">
                    <a
                      href="#"
                      className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don&apos;t have an account?{" "}
                    <a
                      href="#"
                      className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                    >
                      Sign up for free
                    </a>
                  </p>

                  <div className="flex items-center justify-center space-x-4 pt-4">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Secure Login</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>SSL Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing in, you agree to our{" "}
                <a href="#" className="text-indigo-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-indigo-600 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
