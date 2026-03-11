import { Plus, Minus } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  const { formatCurrency, t } = useLanguage();
  const cartItem = items.find(item => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem(product, 1);
  };

  const handleRemove = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      removeItem(product.id);
    }
  };

  const handleClaimAll = () => {
    const remaining = product.availableUnits - quantity;
    if (remaining > 0) {
      addItem(product, remaining);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col gap-1.5">
      {/* Row 1: Manufacturer + Grade Badge */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
        <Badge 
          variant="secondary" 
          className={`font-semibold px-3 py-1 text-xs rounded-full border-0 ${
            product.grade === "A"
              ? "bg-primary/15 text-primary hover:bg-primary/15"
              : product.grade === "B"
              ? "bg-orange-100 text-orange-700 hover:bg-orange-100"
              : "bg-gray-200 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {product.grade}-GRADE
        </Badge>
      </div>

      {/* Row 2: Product Name */}
      <h3 className="text-lg font-bold text-card-foreground leading-tight">
        {product.name}
      </h3>

      {/* Row 3: Specs */}
      <p className="text-sm text-muted-foreground mb-1">
        {product.storage}{product.color ? ` | ${product.color}` : ""} | ⌀ {product.batteryHealth > 0 ? `${product.batteryHealth}%` : "N/A"}
      </p>

      {/* Row 4: Price + Available (grey background) */}
      <div className="flex items-end justify-between bg-muted/60 rounded-lg px-3 py-2">
        <div>
          <p className="text-xs text-muted-foreground">{t.products.costPerUnit}:</p>
          <p className="text-2xl font-bold text-card-foreground">{formatCurrency(product.pricePerUnit)}</p>
        </div>
        <span className="text-sm text-muted-foreground border border-border rounded-full px-3 py-1 bg-card">
          {product.availableUnits} {t.products.available.toLowerCase()}
        </span>
      </div>

      {/* Row 5: Quantity Controls + Claim Button */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center">
          <Button
            onClick={handleRemove}
            size="sm"
            variant="outline"
            className="h-10 w-10 rounded-l-lg rounded-r-none p-0 border-primary bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled={quantity === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex h-10 min-w-[2.5rem] items-center justify-center bg-primary px-2">
            <span className="text-base font-bold text-primary-foreground">{quantity}</span>
          </div>
          <Button
            onClick={handleAdd}
            size="sm"
            className="h-10 w-10 rounded-r-lg rounded-l-none p-0 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={quantity >= product.availableUnits}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleClaimAll}
          className="h-10 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          disabled={product.availableUnits === 0 || quantity >= product.availableUnits}
        >
          {t.products.claimAll}
        </Button>
      </div>
    </div>
  );
}
