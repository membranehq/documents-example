"use client";

import { IntegrationGroup } from "./integration-group";
import useSWR from "swr";
import { Document } from "@/models/document";
import { getAuthHeaders } from "@/app/auth-provider";
import { useState } from "react";
import Image from "next/image";

interface DocumentsAPIResponse {
  documents: Document[];
}


interface IntegrationGroupContainerProps {
  connectionId: string;
  integrationId: string;
  integrationName: string;
  integrationLogo: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    // Don't throw errors for 404s or 5xx errors to prevent SWR from retrying too aggressively
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    } else if (response.status === 404) {
      throw new Error(`Not found: ${response.status}`);
    } else {
      throw new Error(`Request failed: ${response.status}`);
    }
  }

  return response.json();
};

export function IntegrationGroupContainer({
  connectionId,
  integrationId,
  integrationName,
  integrationLogo,
}: IntegrationGroupContainerProps) {
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default

  const { data: documentsData, isLoading, error: documentsError, mutate } = useSWR<DocumentsAPIResponse>(
    !isMinimized ? `/api/integrations/${connectionId}/documents` : null, // Only fetch when expanded
    fetcher,
    {
      refreshInterval: 30000, // Reduced from 2000ms to 30 seconds
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
      errorRetryCount: 3, // Limit retry attempts
      errorRetryInterval: 5000, // Wait 5 seconds between retries
      shouldRetryOnError: (error) => {
        // Only retry on network errors, not on 4xx errors
        return !error.message.includes('404') && !error.message.includes('403');
      },
    }
  );

  const handleDocumentsDeleted = () => {
    // Refresh the documents list after deletion
    mutate();
  };



  // Show error state if documents failed to load
  if (documentsError) {
    return (
      <div className="border rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {integrationLogo && (
            <Image
              src={integrationLogo}
              alt={integrationName}
              width={48}
              height={48}
              className="rounded-xl"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{integrationName}</h2>
            <p className="text-sm text-red-600 mt-1">
              Failed to load documents. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const documents = documentsData?.documents || [];

  return (
    <IntegrationGroup
      connectionId={connectionId}
      integrationId={integrationId}
      integrationName={integrationName}
      integrationLogo={integrationLogo}
      documents={documents}
      isTruncated={false}
      isMinimized={isMinimized}
      onToggleMinimize={() => setIsMinimized(!isMinimized)}
      isLoading={isLoading}
      error={documentsError}
      hasFetchedDocuments={!!documentsData}
      onDocumentsDeleted={handleDocumentsDeleted}
    />
  );
}

