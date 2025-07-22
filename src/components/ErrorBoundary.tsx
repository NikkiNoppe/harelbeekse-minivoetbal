import React from 'react';
import { Card, Button, Text, Title, Group } from '@mantine/core';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: 16 }}>
      <Card shadow="md" padding="xl" radius="md" style={{ maxWidth: 400, width: '100%' }}>
        <Group justify="center" mb="md">
          <div style={{ background: '#fee2e2', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color="#dc2626" />
          </div>
        </Group>
        <Title order={3} ta="center">Er is iets misgegaan</Title>
        <Text c="dimmed" ta="center" mt="sm">
          Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen of ga terug naar de homepage.
        </Text>
        {process.env.NODE_ENV === 'development' && error && (
          <details style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, marginTop: 16, fontSize: 12 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 500, marginBottom: 8 }}>
              Technische details (alleen in ontwikkeling)
            </summary>
            <pre style={{ overflow: 'auto' }}>
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </details>
        )}
        <Group mt="lg" grow>
          <Button variant="outline" leftSection={<RefreshCw size={16} />} onClick={resetErrorBoundary}>
            Opnieuw proberen
          </Button>
          <Button color="grape" leftSection={<Home size={16} />} onClick={() => (window.location.href = '/') }>
            Homepage
          </Button>
        </Group>
      </Card>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 