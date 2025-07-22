import React, { memo } from "react";
import {
  Card,
  CardSection,
  Title,
  Text,
  Group,
  Badge as MantineBadge,
  Button as MantineButton,
  Skeleton as MantineSkeleton,
  Alert,
  Container,
  Grid,
  Stack,
  Box
} from "@mantine/core";
import { AlertCircle } from "lucide-react";
import { BlogPost } from "@/services";
import { formatDateShort } from "@/lib/dateUtils";
import { useBlogPosts } from "@/hooks/useBlogPosts";

const CompetitionInfo = memo(() => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <Text size="sm" mb="xs">
        De Harelbeekse Minivoetbal Competitie is opgericht in 1979 en is uitgegroeid tot een vaste waarde in de regio.
      </Text>
      <Text size="sm">
        Onze competitie staat bekend om zijn sportiviteit.
      </Text>
    </CardSection>
  </Card>
));

const ContactInfo = memo(() => (
  <section>
    <Title order={2} size="h2" mb="xs">Contact</Title>
    <Card shadow="sm" radius="md" p="md" withBorder>
      <CardSection>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Title order={3} size="h4" mb={4}>Competitieleiding</Title>
            <Stack gap={2}>
              <Text size="sm">Nikki Noppe</Text>
              <Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>noppe.nikki@icloud.com</Text>
              <Text size="sm">+32 468 15 52 16</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Title order={3} size="h4" mb={4}>Locatie</Title>
            <Stack gap={2}>
              <Text size="sm">Sporthal De Dageraad</Text>
              <Text size="sm">Stasegemsesteenweg 21</Text>
              <Text size="sm">8530 Harelbeke</Text>
            </Stack>
          </Grid.Col>
        </Grid>
      </CardSection>
    </Card>
  </section>
));

const NewsItemSkeleton = memo(() => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <Group justify="space-between" mb="xs">
        <MantineSkeleton height={16} width={80} radius="sm" />
      </Group>
      <MantineSkeleton height={24} width="75%" radius="sm" />
    </CardSection>
    <CardSection>
      <MantineSkeleton height={16} width="100%" mb={8} radius="sm" />
      <MantineSkeleton height={16} width="66%" radius="sm" />
      <Group gap={8} mt={12}>
        <MantineSkeleton height={24} width={64} radius="sm" />
        <MantineSkeleton height={24} width={80} radius="sm" />
      </Group>
    </CardSection>
  </Card>
));

const BlogPostItem = memo(({ post }: { post: BlogPost }) => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed">{formatDateShort(post.date)}</Text>
      </Group>
      <Title order={4} size="h4" mb={4}>{post.title}</Title>
    </CardSection>
    <CardSection>
      <Text size="sm">{post.content}</Text>
      {post.tags && post.tags.length > 0 && (
        <Group gap={8} mt={12}>
          {post.tags.map((tag, index) => (
            <MantineBadge key={index} color="grape" variant="light">
              {tag}
            </MantineBadge>
          ))}
        </Group>
      )}
    </CardSection>
  </Card>
));

const NewsSection = memo(() => {
  const {
    data: blogPosts,
    isLoading,
    error,
    refetch
  } = useBlogPosts();

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack gap={12}>
          {[...Array(3)].map((_, index) => (
            <NewsItemSkeleton key={index} />
          ))}
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert
          icon={<AlertCircle size={24} />}
          title="Fout bij laden"
          color="red"
          radius="md"
          withCloseButton={false}
          style={{ textAlign: 'center', marginBottom: 16 }}
        >
          <Text mb={8}>De nieuwsberichten konden niet worden geladen.</Text>
          <MantineButton onClick={() => refetch()} color="grape" variant="filled">
            Opnieuw proberen
          </MantineButton>
        </Alert>
      );
    }

    if (!blogPosts?.length) {
      return (
        <Alert
          icon={<AlertCircle size={24} />}
          title="Geen nieuws beschikbaar"
          color="gray"
          radius="md"
          withCloseButton={false}
          style={{ textAlign: 'center', marginBottom: 16 }}
        >
          <Text size="sm">Geen nieuws beschikbaar</Text>
        </Alert>
      );
    }

    return (
      <Stack gap={12}>
        {blogPosts.map(post => (
          <BlogPostItem key={post.id} post={post} />
        ))}
      </Stack>
    );
  };

  return (
    <section>
      <Title order={2} size="h2" mb="xs">Laatste Nieuws</Title>
      {renderContent()}
    </section>
  );
});

const AlgemeenTab: React.FC = () => {
  return (
    <Container size="md" py="xl">
      <Stack gap={32}>
        <Box>
          <Title order={2} size="h2" mb="xs">Over de Competitie</Title>
        </Box>
        <CompetitionInfo />
        <NewsSection />
        <ContactInfo />
      </Stack>
    </Container>
  );
};

CompetitionInfo.displayName = 'CompetitionInfo';
ContactInfo.displayName = 'ContactInfo';
NewsItemSkeleton.displayName = 'NewsItemSkeleton';
BlogPostItem.displayName = 'BlogPostItem';
NewsSection.displayName = 'NewsSection';

export default memo(AlgemeenTab);