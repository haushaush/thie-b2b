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
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-6">
        {/* Left: Product Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
          <h3 className="text-xl font-bold text-card-foreground">
            {product.name}
          </h3>
          <Badge 
            variant="secondary" 
            className="mt-2 bg-accent text-accent-foreground hover:bg-accent font-semibold px-3 py-1 text-xs rounded-full"
          >
            {product.grade}-GRADE
          </Badge>
          <p className="mt-3 text-sm text-muted-foreground">
            {product.storage}{product.color ? ` | ${product.color}` : ""}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            ⌀ {t.products.battery}: <span className="font-bold text-card-foreground">{product.batteryHealth > 0 ? `${product.batteryHealth}%` : "N/A"}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.products.costPerUnit}: <span className="font-bold text-card-foreground">{formatCurrency(product.pricePerUnit)}</span>
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Available Count */}
          <span className="text-sm text-muted-foreground">
            {t.products.available}: {product.availableUnits}
          </span>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            {quantity > 0 && (
              <Button
                onClick={handleRemove}
                size="sm"
                variant="outline"
                className="h-10 w-10 rounded-lg p-0 border-primary/20"
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
            <div className="flex h-10 min-w-[3rem] items-center justify-center rounded-lg bg-primary text-primary-foreground px-3">
              <span className="text-base font-bold">{quantity}</span>
            </div>
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-10 w-10 rounded-lg bg-accent p-0 text-accent-foreground hover:bg-accent/90"
              disabled={quantity >= product.availableUnits}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Claim All Button */}
          <Button
            onClick={handleClaimAll}
            className="h-10 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            disabled={product.availableUnits === 0 || quantity >= product.availableUnits}
          >
            {t.products.claimAll}
          </Button>
        </div>
      </div>
    </div>
  );
}
