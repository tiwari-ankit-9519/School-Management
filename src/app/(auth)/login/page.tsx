"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.email({ error: "Please enter a vaild email address" }),
  password: z
    .string()
    .min(6, "Password should atleast be of 6 characters")
    .max(20, "Password should atmost be of 20 characters"),
});

const Login = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <section className="w-screen h-screen border-2 border-black flex items-center justify-center">
      <div className="w-1/2"></div>
      <div className="border-black border-2 w-1/2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                  <Label>Username</Label>
                  <FormControl>
                    <Input
                      className="rounded-md"
                      placeholder="shadcn"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="shadcn" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </div>
    </section>
  );
};
export default Login;
