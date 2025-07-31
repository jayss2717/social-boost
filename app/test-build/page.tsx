'use client';

import { Page, Layout, Card, Text } from '@shopify/polaris';

export default function TestBuildPage() {
  return (
    <Page title="Build Test">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">
              Build Test Successful
            </Text>
            <Text as="p">
              This page confirms that the build process is working correctly.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 