import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { loginValidation } from "../../../backend/src/validations/user.validations";

export default function Login() {
  const form = useForm({
    resolver: zodResolver(loginValidation),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: any) => {
    console.log(values);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-115">
        <div className="flex justify-center mb-8">
          <a
            href="/"
            className="flex items-center gap-2 text-[16px] font-semibold text-[#08090a]"
          >
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#0c8c5e]" />
            SafeSync
          </a>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-[40px] leading-[1.15] tracking-[-0.4px] font-semibold text-[#08090a]">
            Welcome back
          </h1>

          <p className="mt-3 text-[16px] leading-normal text-[#666]">
            Log in to manage your society with SafeSync.
          </p>
        </div>

        <div className="bg-white border border-[#f2f2f2] rounded-[16px] p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-medium text-[#08090a]">
                      Email address
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        className="h-10 rounded-lg border-[#dddddd] bg-white text-[#08090a] placeholder:text-[#999] focus-visible:ring-1 focus-visible:ring-[#08090a] focus-visible:ring-offset-0"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[14px] font-medium text-[#08090a]">
                        Password
                      </FormLabel>

                      <a
                        href="/forgot-password"
                        className="text-[13px] font-medium text-[#0c8c5e] hover:underline"
                      >
                        Forgot password?
                      </a>
                    </div>

                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        className="h-10 rounded-lg border-[#dddddd] bg-white text-[#08090a] placeholder:text-[#999] focus-visible:ring-1 focus-visible:ring-[#08090a] focus-visible:ring-offset-0"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-10 mt-2 rounded-lg bg-[#08090a] text-white text-[14px] font-medium shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-[#1a1b1c]"
              >
                Log in
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center mt-6 text-[14px] text-[#666]">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="font-medium text-[#0c8c5e] hover:underline"
          >
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
