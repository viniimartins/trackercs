'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListDemos } from '@/modules/demo/queries/list-demos';
import { useUploadDemo } from '@/modules/demo/mutations/use-upload-demo';

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
      <h1 className="text-3xl font-bold mb-8">CS2 Demo Viewer</h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-8 ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-zinc-700 hover:border-zinc-500'
        }`}
      >
        {uploadMutation.isPending ? (
          <div>
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-zinc-400">Parsing demo file... This may take a few minutes.</p>
          </div>
        ) : (
          <div>
            <p className="text-lg mb-2">Drop a .rar or .dem file here</p>
            <p className="text-zinc-500 text-sm">or click to browse</p>
          </div>
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
      </div>

      {uploadMutation.isError && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8">
          <p className="text-red-400">
            Upload failed: {uploadMutation.error?.message ?? 'Unknown error'}
          </p>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Parsed Demos</h2>
      {isLoading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : !demos?.length ? (
        <p className="text-zinc-500">No demos parsed yet. Upload one above.</p>
      ) : (
        <div className="grid gap-4">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => router.push(`/demos/${demo.id}`)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{demo.fileName}</p>
                  <p className="text-zinc-400 text-sm">
                    {demo.mapName} &middot; {demo.teamCT} {demo.scoreCT} - {demo.scoreT} {demo.teamT} &middot; {demo.totalRounds} rounds
                  </p>
                </div>
                <span className="text-zinc-600 text-sm">
                  {new Date(demo.createdAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
