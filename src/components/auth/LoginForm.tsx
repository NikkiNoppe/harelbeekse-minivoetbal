
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Card, Title, TextInput, PasswordInput, Button, Group, Stack, Text } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { useLogin } from "./hooks/useLogin";
import LoginFormFields from "./components/LoginFormFields";
import TestCredentialsFooter from "./components/TestCredentialsFooter";
import { formSchema, FormValues } from "./validation/loginFormSchema";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess
}) => {
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const { login, isLoading } = useLogin(onLoginSuccess);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: ""
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await login(data.usernameOrEmail, data.password);
  };

  return (
    <>
      <Card shadow="md" radius="md" p="lg" style={{ maxWidth: 400, margin: '0 auto' }}>
        <Title order={3} ta="center" mb="md">Login</Title>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Gebruikersnaam of e-mail"
              placeholder="Voer je gebruikersnaam of e-mail in"
              {...form.register("usernameOrEmail")}
              error={form.formState.errors.usernameOrEmail?.message}
              disabled={isLoading}
              required
            />
            <PasswordInput
              label="Wachtwoord"
              placeholder="Voer je wachtwoord in"
              {...form.register("password")}
              error={form.formState.errors.password?.message}
              disabled={isLoading}
              required
            />
            <Group justify="space-between">
              <Button
                variant="subtle"
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                size="xs"
              >
                Wachtwoord vergeten?
              </Button>
              <Button type="submit" loading={isLoading} color="grape">
                Inloggen
              </Button>
            </Group>
          </Stack>
        </form>
        <TestCredentialsFooter />
      </Card>
      <ForgotPasswordDialog 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen} 
      />
    </>
  );
};

export default LoginForm;
