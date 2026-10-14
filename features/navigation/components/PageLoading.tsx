const PageLoading = () => (
  <div className="space-y-3" aria-label="Cargando">
    <div className="h-7 w-48 animate-pulse rounded bg-zinc-200" />
    <div className="h-4 w-72 max-w-full animate-pulse rounded bg-zinc-200" />
    <div className="mt-5 h-48 animate-pulse rounded-md border border-zinc-200 bg-white" />
  </div>
);

export default PageLoading;
