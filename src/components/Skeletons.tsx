import { motion } from 'framer-motion';

export function FoodCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
      <div className="aspect-[4/3] animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded animate-shimmer" />
        <div className="h-3 w-full rounded animate-shimmer" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full animate-shimmer" />
          <div className="h-5 w-16 rounded-full animate-shimmer" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 w-16 rounded animate-shimmer" />
          <div className="h-9 w-20 rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <FoodCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="h-48 rounded-2xl animate-shimmer" />
  );
}
