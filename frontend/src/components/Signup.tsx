import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerValidation } from "../../../backend/src/validations/user.validations";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Role = {
  RESIDENT: "RESIDENT",
  SECURITY: "SECURITY",
  MAINTENANCE: "MAINTENANCE",
  SECRETARY: "SECRETARY",
} as const;

export default function Signup() {
  const form = useForm({
    resolver: zodResolver(registerValidation),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "RESIDENT",
      society: "",
      flat: "",
    },
  });

  const onSubmit = (data: any) => {
    console.log(data);
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
            Create your account
          </h1>

          <p className="mt-3 text-[16px] leading-normal text-[#666]">
            Manage your society, residents, and everyday operations in one
            place.
          </p>
        </div>

        <div
          className="
            bg-white
            border border-[#f2f2f2]
            rounded-[16px]
            p-6
            shadow-[0_2px_4px_rgba(0,0,0,0.05)]
          "
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-medium text-[#08090a]">
                      Full name
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        className="
                          h-10
                          rounded-lg
                          border-[#dddddd]
                          bg-white
                          text-[#08090a]
                          placeholder:text-[#999]
                          focus-visible:ring-1
                          focus-visible:ring-[#08090a]
                          focus-visible:ring-offset-0
                        "
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="
                          h-10
                          rounded-lg
                          border-[#dddddd]
                          bg-white
                          text-[#08090a]
                          placeholder:text-[#999]
                          focus-visible:ring-1
                          focus-visible:ring-[#08090a]
                          focus-visible:ring-offset-0
                        "
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-medium text-[#08090a]">
                      Phone number
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="9876543210"
                        className="
                          h-10
                          rounded-lg
                          border-[#dddddd]
                          bg-white
                          text-[#08090a]
                          placeholder:text-[#999]
                          focus-visible:ring-1
                          focus-visible:ring-[#08090a]
                          focus-visible:ring-offset-0
                        "
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
                    <FormLabel className="text-[14px] font-medium text-[#08090a]">
                      Password
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Create a password"
                        className="
                          h-10
                          rounded-lg
                          border-[#dddddd]
                          bg-white
                          text-[#08090a]
                          placeholder:text-[#999]
                          focus-visible:ring-1
                          focus-visible:ring-[#08090a]
                          focus-visible:ring-offset-0
                        "
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-medium text-[#08090a]">
                      Account type
                    </FormLabel>

                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger
                          className="
                            h-10
                            rounded-lg
                            border-[#dddddd]
                            bg-white
                            focus:ring-1
                            focus:ring-[#08090a]
                          "
                        >
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value={Role.RESIDENT}>Resident</SelectItem>

                        <SelectItem value={Role.SECURITY}>Security</SelectItem>

                        <SelectItem value={Role.MAINTENANCE}>
                          Maintenance
                        </SelectItem>

                        <SelectItem value={Role.SECRETARY}>
                          Secretary
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="society"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-medium text-[#08090a]">
                      Society ID
                      <span className="ml-1 text-[#999] font-normal">
                        (optional)
                      </span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter society ID"
                        className="
                          h-10
                          rounded-lg
                          border-[#dddddd]
                          bg-white
                          text-[#08090a]
                          placeholder:text-[#999]
                          focus-visible:ring-1
                          focus-visible:ring-[#08090a]
                          focus-visible:ring-offset-0
                        "
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-medium text-[#08090a]">
                      Flat ID
                      <span className="ml-1 text-[#999] font-normal">
                        (optional)
                      </span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter flat ID"
                        className="
                          h-10
                          rounded-lg
                          border-[#dddddd]
                          bg-white
                          text-[#08090a]
                          placeholder:text-[#999]
                          focus-visible:ring-1
                          focus-visible:ring-[#08090a]
                          focus-visible:ring-offset-0
                        "
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="
                  w-full
                  h-10
                  mt-2
                  rounded-lg
                  bg-[#08090a]
                  text-white
                  text-[14px]
                  font-medium
                  shadow-[0_2px_4px_rgba(0,0,0,0.03)]
                  hover:bg-[#1a1b1c]
                "
              >
                Create account
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center mt-6 text-[14px] text-[#666]">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-[#0c8c5e] hover:underline"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}
