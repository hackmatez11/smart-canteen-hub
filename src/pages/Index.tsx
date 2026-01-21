import { Provider } from 'react-redux';
import { store } from '@/store';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { TodaysSpecialBanner } from '@/components/TodaysSpecialBanner';
import { SurplusFoodAlert } from '@/components/SurplusFoodAlert';
import { FoodCard } from '@/components/FoodCard';
import { CartSidebar } from '@/components/CartSidebar';
import { OrderTracker } from '@/components/OrderTracker';
import { EmptyState } from '@/components/EmptyState';
import { useAppSelector } from '@/hooks/useAppDispatch';

function MenuContent() {
  const { filteredItems, isLoading, searchQuery, selectedCategory, selectedMood } = useAppSelector(state => state.menu);
  
  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedMood;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Today's Special */}
        <TodaysSpecialBanner />

        {/* Surplus Food Alert */}
        <SurplusFoodAlert />

        {/* Category Filter */}
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Menu</h2>
          <CategoryFilter />
        </div>

        {/* Food Grid */}
        {filteredItems.length === 0 ? (
          <EmptyState 
            type="no-results" 
            message={hasActiveFilters ? "No items match your current filters." : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <FoodCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      <CartSidebar />

      {/* Order Tracker */}
      <OrderTracker />
    </div>
  );
}

const Index = () => {
  return (
    <Provider store={store}>
      <MenuContent />
    </Provider>
  );
};

export default Index;
