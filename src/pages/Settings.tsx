import { useWhatsNew } from "@/hooks/useWhatsNew";
import { useDiagnostics } from "@/hooks/useDiagnostics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Info, 
  Server, 
  Database, 
  Wifi, 
  HardDrive, 
  Monitor,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  Globe,
  AlertCircle,
  AlertTriangle,
  Download,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { currentVersion, reopenWhatsNew } = useWhatsNew();
  const { logs, clearLogs, exportLogs } = useDiagnostics();
  const [systemStatus, setSystemStatus] = useState({
    online: navigator.onLine,
    database: 'checking',
    pwa: false,
    storage: { used: 0, available: 0 },
  });

  useEffect(() => {
    checkSystemStatus();
    
    // Listen for online/offline events
    const handleOnline = () => setSystemStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setSystemStatus(prev => ({ ...prev, online: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkSystemStatus = async () => {
    // Check database connection
    try {
      const { error } = await supabase.from('tenants').select('id').limit(1);
      setSystemStatus(prev => ({ 
        ...prev, 
        database: error ? 'error' : 'connected' 
      }));
    } catch (error) {
      setSystemStatus(prev => ({ ...prev, database: 'error' }));
    }

    // Check PWA status
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    setSystemStatus(prev => ({ ...prev, pwa: isPWA }));

    // Check storage (if available)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        setSystemStatus(prev => ({ 
          ...prev, 
          storage: { used, available } 
        }));
      } catch (error) {
        console.error('Storage estimate failed:', error);
      }
    }
  };

  const buildNumber = import.meta.env.MODE === 'production' 
    ? new Date().toISOString().split('T')[0].replace(/-/g, '')
    : 'dev';
  
  const environment = import.meta.env.MODE;
  const isDevelopment = environment === 'development';

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string | boolean) => {
    if (status === 'connected' || status === true) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (status === 'checking') {
      return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">System information and configuration</p>
        </div>
      </div>

      <Separator />

      {/* Version Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            <CardTitle>Version Information</CardTitle>
          </div>
          <CardDescription>Current app version and build details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base">v{currentVersion}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={reopenWhatsNew}
                  className="h-7"
                >
                  What's New
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Build Number</p>
              <p className="text-base font-mono">{buildNumber}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Environment</p>
              <Badge variant={isDevelopment ? "outline" : "default"}>
                {environment}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-base">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>System Status</CardTitle>
          </div>
          <CardDescription>Real-time system health and connectivity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Network</p>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              {getStatusIcon(systemStatus.online)}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {systemStatus.database}
                  </p>
                </div>
              </div>
              {getStatusIcon(systemStatus.database)}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">PWA Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus.pwa ? 'Installed' : 'Browser'}
                  </p>
                </div>
              </div>
              {getStatusIcon(systemStatus.pwa)}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Service Worker</p>
                  <p className="text-xs text-muted-foreground">
                    {'serviceWorker' in navigator ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              {getStatusIcon('serviceWorker' in navigator)}
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSystemStatus}
            className="w-full md:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            <CardTitle>Storage</CardTitle>
          </div>
          <CardDescription>Local storage usage information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemStatus.storage.available > 0 ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">{formatBytes(systemStatus.storage.used)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium">{formatBytes(systemStatus.storage.available)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-medium">
                    {((systemStatus.storage.used / systemStatus.storage.available) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(systemStatus.storage.used / systemStatus.storage.available) * 100}%` 
                  }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Storage information not available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            <CardTitle>Technical Details</CardTitle>
          </div>
          <CardDescription>Browser and platform information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm font-mono">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">User Agent</span>
              <span className="text-right truncate max-w-xs">{navigator.userAgent.split(' ')[0]}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Platform</span>
              <span>{navigator.platform}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Language</span>
              <span>{navigator.language}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Screen</span>
              <span>{window.screen.width} × {window.screen.height}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <div>
                <CardTitle>Diagnostics</CardTitle>
                <CardDescription>Console errors, warnings, and system logs</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportLogs}
                disabled={logs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearLogs}
                disabled={logs.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Logs</span>
              </div>
              <Badge variant={logs.length > 0 ? "destructive" : "secondary"}>
                {logs.length}
              </Badge>
            </div>

            {logs.length > 0 ? (
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <div className="p-4 space-y-3">
                  {logs.map((log) => (
                    <div 
                      key={log.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        log.type === 'error' 
                          ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' 
                          : 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {log.type === 'error' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={log.type === 'error' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {log.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm font-mono break-words whitespace-pre-wrap">
                            {log.message}
                          </p>
                          {log.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                Stack trace
                              </summary>
                              <pre className="mt-2 text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                                {log.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-sm font-medium">No errors or warnings detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The diagnostics system is monitoring your application
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
