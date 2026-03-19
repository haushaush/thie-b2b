import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, Tablet, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppleLogo } from "@/components/icons/AppleLogo";
import { SamsungLogo } from "@/components/icons/SamsungLogo";
import { useProducts } from "@/hooks/useProducts";
import { modelOptions, gradeOptions } from "@/data/mockProducts";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductList } from "@/components/products/ProductList";
import { ViewToggle, ViewMode } from "@/components/products/ViewToggle";
import { CartBar } from "@/components/products/CartBar";
import { FilterModal, FilterState } from "@/components/products/FilterModal";
import { SubmitModal } from "@/components/products/SubmitModal";
import { ProfileIncompleteModal } from "@/components/ProfileIncompleteModal";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: products = [], isLoading, error } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || null;
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    models: [],
    storage: [],
    grades: [],
    colors: [],
    batteryRange: [0, 100],
    priceRange: [0, 2000],
  });
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileIncomplete, setShowProfileIncomplete] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const categoryTiles = [
    { key: "iphones", label: t.dashboard.categoryIphones, icon: AppleLogo, filter: (p: any) => p.manufacturer === "Apple" && p.name.toLowerCase().includes("iphone") },
    { key: "samsung", label: t.dashboard.categorySamsung, icon: SamsungLogo, filter: (p: any) => p.manufacturer === "Samsung" },
    { key: "tablets", label: t.dashboard.categoryTablets, icon: Tablet, filter: (p: any) => p.name.toLowerCase().includes("ipad") || p.name.toLowerCase().includes("tablet") },
  ];

  const handleCategoryClick = (key: string) => {
    if (activeCategory === key) {
      setSearchParams({});
    } else {
      setSearchParams({ category: key });
    }
  };

  // Extract unique colors from products
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => {
      if (p.color) colors.add(p.color);
    });
    return Array.from(colors).sort();
  }, [products]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.models.length > 0) count++;
    if (filters.storage.length > 0) count++;
    if (filters.grades.length > 0) count++;
    if (filters.colors.length > 0) count++;
    if (filters.batteryRange[0] > 0 || filters.batteryRange[1] < 100) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000) count++;
    return count;
  }, [filters]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category tile filter
      if (activeCategory) {
        const tile = categoryTiles.find(t => t.key === activeCategory);
        if (tile && !tile.filter(product)) return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchable = `${product.name} ${product.manufacturer} ${product.storage}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      // Category filter
      if (filters.categories.length > 0) {
        const modelsInCategories = filters.categories.flatMap((cat) => modelOptions[cat] || []);
        if (!modelsInCategories.includes(product.name)) return false;
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

      // Color filter
      if (filters.colors.length > 0 && !filters.colors.includes(product.color)) {
        return false;
      }

      // Battery filter
      if (
        product.batteryHealth < filters.batteryRange[0] ||
        product.batteryHealth > filters.batteryRange[1]
      ) {
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
  }, [products, searchQuery, filters, activeCategory]);

  // Pagination: grid = 4 rows × 3 cols = 12; list = 32 items before paginating
  const GRID_ROWS = 4;
  const itemsPerPage = viewMode === "grid" ? GRID_ROWS * 3 : 32;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  // Reset page when filters/search/view change
  const resetPage = useCallback(() => setCurrentPage(1), []);
  useMemo(() => { resetPage(); }, [searchQuery, filters, activeCategory, viewMode]);

  const handleSubmitRequest = async (expressShipping: boolean, shippingCost: number) => {
    if (!user || items.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Create the request with shipping info
      const { data: request, error: requestError } = await supabase
        .from("requests")
        .insert({
          user_id: user.id,
          status: "pending",
          shipping_cost: shippingCost,
          express_shipping: expressShipping,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create request items
      const requestItems = items.map((item) => ({
        request_id: request.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price_per_unit: item.product.pricePerUnit,
      }));

      const { error: itemsError } = await supabase
        .from("request_items")
        .insert(requestItems);

      if (itemsError) throw itemsError;

      // Calculate totals for email notification
      const totalDevices = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.product.pricePerUnit), 0);

      // Send notification email to admins
      try {
        await supabase.functions.invoke("notify-new-request", {
          body: {
            requestId: request.id,
            userEmail: user.email,
            companyName: user.companyName,
            items: requestItems.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
              price_per_unit: item.price_per_unit,
            })),
            totalDevices,
            totalAmount,
          },
        });
        console.log("Admin notification sent successfully");
      } catch (notifyError) {
        console.error("Failed to send admin notification:", notifyError);
      }

      // Send confirmation email to the customer
      try {
        await supabase.functions.invoke("notify-request-confirmation", {
          body: {
            requestId: request.id,
            userEmail: user.email,
            companyName: user.companyName,
            contactPerson: user.contactPerson,
            items: requestItems.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
            })),
          },
        });
        console.log("Customer confirmation email sent successfully");
      } catch (notifyError) {
        console.error("Failed to send customer confirmation:", notifyError);
      }

      setIsSubmitModalOpen(false);
      clearCart(true); // Skip release - units are now part of the order
      
      toast({
        title: t.submit.success,
        description: t.submit.successDesc,
      });
      
      navigate("/requests");
    } catch (error: any) {
      toast({
        title: t.submit.error,
        description: t.submit.errorDesc,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <p className="text-destructive">{t.common.error}</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {t.dashboard.noProductsDesc}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.dashboard.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex w-full sm:w-1/2 items-center gap-2">
          <FilterModal
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
            availableColors={availableColors}
            activeCategory={activeCategory}
            products={products}
            className="flex-1"
          />
          {(activeFilterCount > 0 || activeCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({
                  categories: [],
                  models: [],
                  storage: [],
                  grades: [],
                  colors: [],
                  batteryRange: [0, 100],
                  priceRange: [0, 2000],
                });
                setSearchParams({});
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              {t.dashboard.clearFilters}
            </Button>
          )}
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Category Tiles */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {categoryTiles.map((tile) => {
          const Icon = tile.icon;
          const isActive = activeCategory === tile.key;
          return (
            <button
              key={tile.key}
              onClick={() => handleCategoryClick(tile.key)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <Icon className={`shrink-0 ${tile.key === "samsung" ? "h-6 w-20" : "h-6 w-6"}`} />
              <span className="font-semibold">{tile.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grade Quick Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        
        {gradeOptions.filter((grade) => products.some((p) => p.grade === grade)).map((grade) => {
          const isActive = filters.grades.includes(grade);
          return (
            <Button
              key={grade}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  grades: isActive
                    ? prev.grades.filter((g) => g !== grade)
                    : [...prev.grades, grade],
                }));
              }}
            >
              Grade {grade}
            </Button>
          );
        })}
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length > 0 ? (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <ProductList products={paginatedProducts} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === safePage ? "default" : "outline"}
                  size="sm"
                  className="min-w-[2.25rem]"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">{t.dashboard.noResults}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.dashboard.noResultsDesc}
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
