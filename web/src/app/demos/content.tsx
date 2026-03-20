'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, MapPin, Loader2, BarChart3 } from 'lucide-react';
import { useListDemos } from '@/modules/demo/queries/list-demos';
import { useUploadDemo } from '@/modules/demo/mutations/use-upload-demo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function DemosContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: demos, isLoading } = useListDemos();
  const uploadMutation = useUploadDemo();

  const handleFile = useCallback(
    async (file: File) => {
      const result = await uploadMutation.mutateAsync(file);
      router.push(`/demos/${result.id}`);
    },
    [uploadMutation, router],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">CS2 Demo Viewer</h1>
          <p className="text-muted-foreground">Upload and analyze your Counter-Strike 2 demo files</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <BarChart3 className="size-4 mr-2" />
          Dashboard
        </Button>
      </div>

      <Card
        className={`cursor-pointer transition-all duration-200 mb-8 ${
          dragActive
            ? 'ring-2 ring-primary bg-primary/5'
            : 'hover:ring-1 hover:ring-primary/50'
        }`}
      >
        <CardContent
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center py-12"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="size-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Parsing demo file... This may take a few minutes.</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Upload className="size-8 text-primary" />
              </div>
              <p className="text-lg font-medium mb-1">Drop a .rar or .dem file here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".rar,.dem"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </CardContent>
      </Card>

      {uploadMutation.isError && (
        <Card className="ring-destructive/50 bg-destructive/10 mb-8">
          <CardContent>
            <p className="text-destructive text-sm">
              Upload failed: {uploadMutation.error?.message ?? 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-semibold mb-4">Parsed Demos</h2>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : !demos?.length ? (
        <p className="text-muted-foreground">No demos parsed yet. Upload one above.</p>
      ) : (
        <div className="grid gap-3">
          {demos.map((demo) => (
            <Card
              key={demo.id}
              className="cursor-pointer transition-all hover:ring-1 hover:ring-primary/40"
              onClick={() => router.push(`/demos/${demo.id}`)}
            >
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2.5">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{demo.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="size-3" />
                        {demo.mapName}
                      </Badge>
                      <Badge variant="secondary">
                        <span className="text-blue-400">{demo.teamCT}</span>
                        <span className="mx-1.5 font-bold">{demo.scoreCT} - {demo.scoreT}</span>
                        <span className="text-yellow-400">{demo.teamT}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">{demo.totalRounds} rounds</span>
                    </div>
                  </div>
                </div>
                <span className="text-muted-foreground text-sm">
                  {new Date(demo.createdAt).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
