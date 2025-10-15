import { Button } from "@/components/ui/button";

interface Integration {
  integrationId: string;
  integrationName: string;
}

interface IntegrationNavProps {
  integrations: Integration[];
  selectedIntegration: string | null;
  onIntegrationSelect: (integrationId: string | null) => void;
}

export function IntegrationNav({
  integrations,
  selectedIntegration,
  onIntegrationSelect,
}: IntegrationNavProps) {
  if (integrations.length <= 1) {
    return null;
  }

  return (
    <div className="flex gap-2 mb-8 flex-wrap">
      <Button
        variant={selectedIntegration === null ? "default" : "outline"}
        size="sm"
        onClick={() => onIntegrationSelect(null)}
      >
        All
      </Button>
      {integrations.map((integration) => (
        <Button
          key={integration.integrationId}
          variant={
            selectedIntegration === integration.integrationId
              ? "default"
              : "outline"
          }
          size="sm"
          onClick={() => onIntegrationSelect(integration.integrationId)}
        >
          {integration.integrationName}
        </Button>
      ))}
    </div>
  );
}

