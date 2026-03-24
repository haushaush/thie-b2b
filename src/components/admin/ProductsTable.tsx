import { useState, useMemo } from "react";
import { Pencil, Trash2, Loader2, Search, Plus, X, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ProductEditModal, ProductData } from "./ProductEditModal";
import { ProductAddModal, NewProductData } from "./ProductAddModal";
import { BulkEditModal } from "./BulkEditModal";

interface ProductsTableProps { products: ProductData[]; isLoading: boolean; onProductUpdated: () => void; }

export function ProductsTable({ products, isLoading, onProductUpdated }: ProductsTableProps) {
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  const { toast } = useToast();
  const { t, formatCurrency } = useLanguage();
  const bulk = (t as any).admin?.bulkEdit || {};

  const manufacturers = useMemo(() => [...new Set(products.map((p) => p.manufacturer))].sort(), [products]);
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(query) && !product.manufacturer.toLowerCase().includes(query) && !product.storage?.toLowerCase().includes(query)) return false;
      }
      if (filterGrade !== "all" && product.grade !== filterGrade) return false;
      if (filterManufacturer !== "all" && product.manufacturer !== filterManufacturer) return false;
      return true;
    });
  }, [products, searchQuery, filterGrade, filterManufacturer]);

  const hasActiveFilters = searchQuery || filterGrade !== "all" || filterManufacturer !== "all";
  const clearFilters = () => { setSearchQuery(""); setFilterGrade("all"); setFilterManufacturer("all"); };

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedProducts = useMemo(() => products.filter(p => selectedIds.has(p.id)), [products, selectedIds]);

  const handleAdd = async (product: NewProductData) => {
    setIsAdding(true);
    try {
      const { error } = await supabase.from("products").insert({ name: product.name, manufacturer: product.manufacturer, storage: product.storage || null, grade: product.grade, price_per_unit: product.price_per_unit, available_units: product.available_units });
      if (error) throw error;
      toast({ title: t.admin.addModal.success, description: t.admin.addModal.successDesc });
      setShowAddModal(false);
      onProductUpdated();
    } catch (error: any) { toast({ variant: "destructive", title: t.admin.addModal.error, description: error.message || t.common.error }); }
    finally { setIsAdding(false); }
  };

  const handleSave = async (product: ProductData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("products").update({ name: product.name, manufacturer: product.manufacturer, storage: product.storage, grade: product.grade, price_per_unit: product.price_per_unit, available_units: product.available_units }).eq("id", product.id);
      if (error) throw error;
      toast({ title: t.admin.editModal.success, description: t.admin.editModal.successDesc });
      setEditingProduct(null);
      onProductUpdated();
    } catch (error: any) { toast({ variant: "destructive", title: t.admin.editModal.error, description: error.message || t.common.error }); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", deletingProduct.id);
      if (error) throw error;
      toast({ title: t.admin.products.deleteSuccess, description: t.admin.products.deleteSuccessDesc });
      setDeletingProduct(null);
      onProductUpdated();
    } catch (error: any) { toast({ variant: "destructive", title: t.admin.products.deleteError, description: error.message || t.common.error }); }
    finally { setIsDeleting(false); }
  };

  const handleBulkSaved = () => {
    setSelectedIds(new Set());
    onProductUpdated();
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder={t.admin.products.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
          <Select value={filterGrade} onValueChange={setFilterGrade}><SelectTrigger className="w-[140px]"><SelectValue placeholder={t.products.grade} /></SelectTrigger><SelectContent><SelectItem value="all">{t.admin.products.allGrades}</SelectItem><SelectItem value="A">Grade A</SelectItem><SelectItem value="B">Grade B</SelectItem><SelectItem value="C">Grade C</SelectItem></SelectContent></Select>
          <Select value={filterManufacturer} onValueChange={setFilterManufacturer}><SelectTrigger className="w-[160px]"><SelectValue placeholder={t.products.manufacturer} /></SelectTrigger><SelectContent><SelectItem value="all">{t.admin.products.allManufacturers}</SelectItem>{manufacturers.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent></Select>
          {hasActiveFilters && (<Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-4 w-4" />{t.admin.products.resetFilters}</Button>)}
        </div>
        <div className="flex gap-2">
          {someSelected && (
            <Button variant="outline" onClick={() => setShowBulkEdit(true)}>
              <Edit3 className="mr-2 h-4 w-4" />
              {(bulk.button || "Bulk Edit")} ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)}><Plus className="mr-2 h-4 w-4" />{t.admin.products.addProduct}</Button>
        </div>
      </div>
      {hasActiveFilters && <p className="mb-3 text-sm text-muted-foreground">{filteredProducts.length} / {products.length}</p>}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center"><p className="text-muted-foreground">{t.admin.products.noProducts}</p><p className="text-sm text-muted-foreground">{t.admin.products.noProductsDesc}</p></div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center"><p className="text-muted-foreground">{t.admin.products.noResults}</p><p className="text-sm text-muted-foreground">{t.admin.products.noResultsAction}</p></div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>{t.admin.products.table.name}</TableHead>
                <TableHead>{t.admin.products.table.manufacturer}</TableHead>
                <TableHead>{t.admin.products.table.storage}</TableHead>
                <TableHead>{t.admin.products.table.grade}</TableHead>
                <TableHead className="text-right">{t.admin.products.table.price}</TableHead>
                <TableHead className="text-right">{t.admin.products.table.available}</TableHead>
                <TableHead className="text-right">{t.admin.products.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className={selectedIds.has(product.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={() => toggleOne(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.manufacturer}</TableCell>
                  <TableCell>{product.storage || "-"}</TableCell>
                  <TableCell><Badge variant={product.grade === "A" ? "default" : "secondary"}>{product.grade}</Badge></TableCell>
                  <TableCell className="text-right">{formatCurrency(product.price_per_unit)}</TableCell>
                  <TableCell className="text-right">{product.available_units}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(product)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ProductAddModal open={showAddModal} onOpenChange={setShowAddModal} onSave={handleAdd} isSaving={isAdding} />
      <ProductEditModal product={editingProduct} open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)} onSave={handleSave} isSaving={isSaving} />
      <BulkEditModal products={selectedProducts} open={showBulkEdit} onOpenChange={setShowBulkEdit} onSaved={handleBulkSaved} />
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t.admin.products.confirmDelete}</AlertDialogTitle><AlertDialogDescription>{t.admin.products.confirmDeleteDesc.replace("{name}", deletingProduct?.name || "")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>{t.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t.common.delete}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
