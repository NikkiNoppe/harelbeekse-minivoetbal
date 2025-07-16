import React from 'react';
import { 
  TextInput, 
  PasswordInput, 
  Stack, 
  Text, 
  Alert,
  Loader
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useLogin } from '@/components/auth/hooks/useLogin';
import { useState } from 'react';
import { MantineCard } from './MantineCard';
import { MantineButton } from './MantineButton';
import { AlertCircle, User, Lock } from 'lucide-react';

interface LoginFormMantineProps {
  onSuccess?: () => void;
}

export const LoginFormMantine: React.FC<LoginFormMantineProps> = ({ onSuccess }) => {
  const { login, isLoading } = useLogin(() => {
    onSuccess?.();
  });
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (!value ? 'Gebruikersnaam is verplicht' : null),
      password: (value) => (!value ? 'Wachtwoord is verplicht' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError(null);
      await login(values.username, values.password);
      notifications.show({
        title: 'Succesvol ingelogd',
        message: 'Welkom terug!',
        color: 'purple',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er is een onbekende fout opgetreden';
      setError(errorMessage);
      notifications.show({
        title: 'Fout bij inloggen',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  return (
    <MantineCard 
      style={{ 
        maxWidth: '400px', 
        margin: '0 auto',
        backgroundColor: '#faf8ff'
      }}
    >
      <Stack gap="lg">
        <Text size="xl" fw={600} ta="center" c="purple.7">
          Inloggen
        </Text>
        
        {error && (
          <Alert 
            icon={<AlertCircle size={16} />} 
            color="red" 
            variant="light"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Gebruikersnaam"
              placeholder="Voer je gebruikersnaam in"
              leftSection={<User size={16} />}
              {...form.getInputProps('username')}
              styles={{
                input: {
                  borderColor: '#e9e0ff',
                  '&:focus': {
                    borderColor: '#60368c',
                  },
                },
              }}
            />
            
            <PasswordInput
              label="Wachtwoord"
              placeholder="Voer je wachtwoord in"
              leftSection={<Lock size={16} />}
              {...form.getInputProps('password')}
              styles={{
                input: {
                  borderColor: '#e9e0ff',
                  '&:focus': {
                    borderColor: '#60368c',
                  },
                },
              }}
            />
            
            <MantineButton
              type="submit"
              fullWidth
              loading={isLoading}
              color="purple"
              size="md"
              leftSection={isLoading ? <Loader size={16} /> : null}
            >
              {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
            </MantineButton>
          </Stack>
        </form>

        <Text size="sm" ta="center" c="dimmed">
          Test: admin/admin123 of referee/ref123
        </Text>
      </Stack>
    </MantineCard>
  );
};