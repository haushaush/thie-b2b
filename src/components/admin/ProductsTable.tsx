import { useState, useMemo } from "react";
import { Pencil, Trash2, Loader2, Search, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ProductEditModal, ProductData } from "./ProductEditModal";
import { ProductAddModal, NewProductData } from "./ProductAddModal";

interface ProductsTableProps { products: ProductData[]; isLoading: boolean; onProductUpdated: () => void; }

export function ProductsTable({ products, isLoading, onProductUpdated }: ProductsTableProps) {
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  const { toast } = useToast();

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

  const handleAdd = async (product: NewProductData) => {
    setIsAdding(true);
    try {
      const { error } = await supabase.from("products").insert({ name: product.name, manufacturer: product.manufacturer, storage: product.storage || null, grade: product.grade, price_per_unit: product.price_per_unit, available_units: product.available_units });
      if (error) throw error;
      toast({ title: "Product added", description: `${product.name} has been created successfully.` });
      setShowAddModal(false);
      onProductUpdated();
    } catch (error: any) { toast({ variant: "destructive", title: "Error adding", description: error.message || "An error occurred" }); }
    finally { setIsAdding(false); }
  };

  const handleSave = async (product: ProductData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("products").update({ name: product.name, manufacturer: product.manufacturer, storage: product.storage, grade: product.grade, price_per_unit: product.price_per_unit, available_units: product.available_units }).eq("id", product.id);
      if (error) throw error;
      toast({ title: "Product updated", description: `${product.name} has been saved successfully.` });
      setEditingProduct(null);
      onProductUpdated();
    } catch (error: any) { toast({ variant: "destructive", title: "Error saving", description: error.message || "An error occurred" }); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", deletingProduct.id);
      if (error) throw error;
      toast({ title: "Product deleted", description: `${deletingProduct.name} has been removed.` });
      setDeletingProduct(null);
      onProductUpdated();
    } catch (error: any) { toast({ variant: "destructive", title: "Error deleting", description: error.message || "An error occurred" }); }
    finally { setIsDeleting(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
          <Select value={filterGrade} onValueChange={setFilterGrade}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Grade" /></SelectTrigger><SelectContent><SelectItem value="all">All Grades</SelectItem><SelectItem value="A">Grade A</SelectItem><SelectItem value="B">Grade B</SelectItem><SelectItem value="C">Grade C</SelectItem></SelectContent></Select>
          <Select value={filterManufacturer} onValueChange={setFilterManufacturer}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Manufacturer" /></SelectTrigger><SelectContent><SelectItem value="all">All Manufacturers</SelectItem>{manufacturers.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent></Select>
          {hasActiveFilters && (<Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-4 w-4" />Reset Filters</Button>)}
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="mr-2 h-4 w-4" />Add Product</Button>
      </div>
      {hasActiveFilters && <p className="mb-3 text-sm text-muted-foreground">{filteredProducts.length} of {products.length} products</p>}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center"><p className="text-muted-foreground">No products available</p><p className="text-sm text-muted-foreground">Upload a CSV file or add individual products.</p></div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center"><p className="text-muted-foreground">No products found</p><p className="text-sm text-muted-foreground">Try different search terms or filters.</p></div>
      ) : (
        <div className="rounded-lg border">
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Manufacturer</TableHead><TableHead>Storage</TableHead><TableHead>Grade</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filteredProducts.map((product) => (<TableRow key={product.id}><TableCell className="font-medium">{product.name}</TableCell><TableCell>{product.manufacturer}</TableCell><TableCell>{product.storage || "-"}</TableCell><TableCell><Badge variant={product.grade === "A" ? "default" : "secondary"}>{product.grade}</Badge></TableCell><TableCell className="text-right">{product.price_per_unit.toFixed(2)} €</TableCell><TableCell className="text-right">{product.available_units}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeletingProduct(product)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell></TableRow>))}</TableBody></Table>
        </div>
      )}
      <ProductAddModal open={showAddModal} onOpenChange={setShowAddModal} onSave={handleAdd} isSaving={isAdding} />
      <ProductEditModal product={editingProduct} open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)} onSave={handleSave} isSaving={isSaving} />
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete product?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
