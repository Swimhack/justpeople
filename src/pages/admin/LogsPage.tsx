import { LogsViewer } from '@/components/admin/LogsViewer';

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Application Logs</h1>
        <p className="text-muted-foreground">
          Monitor application activity and generate URLs for agent consumption
        </p>
      </div>
      
      <LogsViewer />
    </div>
  );
}