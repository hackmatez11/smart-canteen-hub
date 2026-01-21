import { UtensilsCrossed, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setCategory, setSearchQuery, setMoodFilter } from '@/store/slices/menuSlice';

interface EmptyStateProps {
  type: 'no-results' | 'no-items' | 'error';
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  const dispatch = useAppDispatch();

  const handleClearFilters = () => {
    dispatch(setCategory('all'));
    dispatch(setSearchQuery(''));
    dispatch(setMoodFilter(null));
  };

  const content = {
    'no-results': {
      icon: Search,
      title: 'No items found',
      description: message || 'Try adjusting your search or filters to find what you\'re looking for.',
      action: 'Clear Filters',
      onAction: handleClearFilters,
    },
    'no-items': {
      icon: UtensilsCrossed,
      title: 'Menu is being prepared',
      description: 'Our chefs are preparing today\'s menu. Please check back soon!',
      action: null,
      onAction: null,
    },
    'error': {
      icon: UtensilsCrossed,
      title: 'Something went wrong',
      description: message || 'We couldn\'t load the menu. Please try again.',
      action: 'Retry',
      onAction: () => window.location.reload(),
    },
  };

  const { icon: Icon, title, description, action, onAction } = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-md mb-6">{description}</p>
      {action && onAction && (
        <Button onClick={onAction} variant="outline">
          {action}
        </Button>
      )}
    </div>
  );
}
