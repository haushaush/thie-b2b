import { Product } from "@/hooks/useProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductListRow } from "./ProductListRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">{t.admin.products.table.name}</TableHead>
            <TableHead className="font-semibold">{t.products.storage}</TableHead>
            <TableHead className="font-semibold">{t.products.color}</TableHead>
            <TableHead className="font-semibold">{t.products.grade}</TableHead>
            <TableHead className="font-semibold">{t.products.battery}</TableHead>
            <TableHead className="font-semibold">{t.admin.products.table.price}</TableHead>
            <TableHead className="font-semibold">{t.products.available}</TableHead>
            <TableHead className="font-semibold">{t.admin.products.table.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductListRow key={product.id} product={product} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
