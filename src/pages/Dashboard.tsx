import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/products/ProductCard";
import { CartBar } from "@/components/products/CartBar";
import { FilterModal, FilterState } from "@/components/products/FilterModal";
import { SubmitModal } from "@/components/products/SubmitModal";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: products = [], isLoading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    models: [],
    storage: [],
    grades: [],
    priceRange: [0, 2000],
  });
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.models.length > 0) count++;
    if (filters.storage.length > 0) count++;
    if (filters.grades.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000) count++;
    return count;
  }, [filters]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchable = `${product.name} ${product.manufacturer} ${product.storage}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      // Model filter
      if (filters.models.length > 0 && !filters.models.includes(product.name)) {
        return false;
      }

      // Storage filter
      if (filters.storage.length > 0 && !filters.storage.includes(product.storage)) {
        return false;
      }

      // Grade filter
      if (filters.grades.length > 0 && !filters.grades.includes(product.grade)) {
        return false;
      }

      // Price filter
      if (
        product.pricePerUnit < filters.priceRange[0] ||
        product.pricePerUnit > filters.priceRange[1]
      ) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, filters]);

  const handleSubmitRequest = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitModalOpen(false);
    clearCart();
    
    toast({
      title: "Anfrage erfolgreich gesendet",
      description: "Sie finden Ihre Anfrage unter 'Requests'.",
    });
    
    navigate("/requests");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-destructive">Fehler beim Laden der Produkte</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Verfügbare Geräte</h1>
        <p className="mt-1 text-muted-foreground">
          Wählen Sie die gewünschten Produkte für Ihre Anfrage aus
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Produkte suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterModal
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Keine Produkte gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Versuchen Sie andere Suchbegriffe oder Filter
          </p>
        </div>
      )}

      {/* Cart Bar */}
      <CartBar onSubmit={() => setIsSubmitModalOpen(true)} />

      {/* Submit Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmitRequest}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
