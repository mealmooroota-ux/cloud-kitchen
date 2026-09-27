export default function Loading() {
  return <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 md:px-8" aria-busy="true" aria-label="Loading">{Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[20px] bg-raised" />)}</div>;
}
