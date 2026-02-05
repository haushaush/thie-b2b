import { Plus, Minus } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";

interface ProductListRowProps {
  product: Product;
}

export function ProductListRow({ product }: ProductListRowProps) {
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
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex flex-col gap-1">
          <span className="font-bold">{product.name}</span>
          <span className="text-xs text-muted-foreground">{product.manufacturer}</span>
        </div>
      </TableCell>
      <TableCell>{product.storage}</TableCell>
      <TableCell>{product.color || "-"}</TableCell>
      <TableCell>
        <Badge 
          variant="secondary" 
          className="bg-accent text-accent-foreground font-semibold px-2 py-0.5 text-xs rounded-full"
        >
          {product.grade}
        </Badge>
      </TableCell>
      <TableCell>{product.batteryHealth ? `${product.batteryHealth}%` : "-"}</TableCell>
      <TableCell className="font-bold">{formatCurrency(product.pricePerUnit)}</TableCell>
      <TableCell className="text-muted-foreground">{product.availableUnits}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1">
            {quantity > 0 && (
              <Button
                onClick={handleRemove}
                size="sm"
                variant="outline"
                className="h-8 w-8 rounded-md p-0 border-primary/20"
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
            <div className="flex h-8 min-w-[2.5rem] items-center justify-center rounded-md bg-primary text-primary-foreground px-2">
              <span className="text-sm font-bold">{quantity}</span>
            </div>
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-8 w-8 rounded-md bg-accent p-0 text-accent-foreground hover:bg-accent/90"
              disabled={quantity >= product.availableUnits}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Claim All Button */}
          <Button
            onClick={handleClaimAll}
            size="sm"
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs"
            disabled={product.availableUnits === 0 || quantity >= product.availableUnits}
          >
            {t.products.claimAll}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
