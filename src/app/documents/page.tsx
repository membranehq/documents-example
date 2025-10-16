"use client";

import { useMemo } from "react";
import { IntegrationGroupContainer } from "@/app/documents/components/integration-group-container";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileTextIcon, Plus } from "lucide-react";
import { useIntegrations } from "@integration-app/react";
import { SyncNotifications } from "@/components/sync-notifications";

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 animate-in fade-in-50">
      <div className="h-10 w-48 bg-gray-200 rounded-md mb-8 animate-pulse" />

      {/* Integration cards skeleton */}
      <div className="space-y-8">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-24 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { integrations, loading: integrationsLoading } = useIntegrations();

  // Get connected integrations with their data
  const connectedIntegrations = useMemo(() => {
    return integrations
      .filter((i) => i.connection?.id && !i.connection?.disconnected)
      .map((i) => ({
        connectionId: i.connection!.id,
        integrationId: i.id,
        integrationName: i.name,
        integrationLogo: i.logoUri || "",
      }));
  }, [integrations]);

  if (integrationsLoading) {
    return <LoadingSkeleton />;
  }

  if (connectedIntegrations.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Documents</h1>
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl">
          <FileTextIcon className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            No documents found. Connect an integration to get started.
          </p>
          <Link href="/integrations">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Go to Integrations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Documents</h1>

      <div className="space-y-8">
        {connectedIntegrations.map((integration) => (
          <IntegrationGroupContainer
            key={integration.connectionId}
            connectionId={integration.connectionId}
            integrationId={integration.integrationId}
            integrationName={integration.integrationName}
            integrationLogo={integration.integrationLogo}
          />
        ))}
      </div>

      <SyncNotifications />
    </div>
  );
}
