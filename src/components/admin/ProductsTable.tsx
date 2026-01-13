import { useState, useMemo } from "react";
import { Pencil, Trash2, Loader2, Search, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ProductEditModal, ProductData } from "./ProductEditModal";
import { ProductAddModal, NewProductData } from "./ProductAddModal";

interface ProductsTableProps {
  products: ProductData[];
  isLoading: boolean;
  onProductUpdated: () => void;
}

export function ProductsTable({ products, isLoading, onProductUpdated }: ProductsTableProps) {
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  
  const { toast } = useToast();

  // Get unique manufacturers for filter
  const manufacturers = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.manufacturer))];
    return unique.sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(query) ||
          product.manufacturer.toLowerCase().includes(query) ||
          product.storage?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Grade filter
      if (filterGrade !== "all" && product.grade !== filterGrade) {
        return false;
      }

      // Manufacturer filter
      if (filterManufacturer !== "all" && product.manufacturer !== filterManufacturer) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, filterGrade, filterManufacturer]);

  const hasActiveFilters = searchQuery || filterGrade !== "all" || filterManufacturer !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterGrade("all");
    setFilterManufacturer("all");
  };

  const handleAdd = async (product: NewProductData) => {
    setIsAdding(true);
    try {
      const { error } = await supabase.from("products").insert({
        name: product.name,
        manufacturer: product.manufacturer,
        storage: product.storage || null,
        grade: product.grade,
        price_per_unit: product.price_per_unit,
        available_units: product.available_units,
      });

      if (error) throw error;

      toast({
        title: "Produkt hinzugefügt",
        description: `${product.name} wurde erfolgreich erstellt.`,
      });

      setShowAddModal(false);
      onProductUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Hinzufügen",
        description: error.message || "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSave = async (product: ProductData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: product.name,
          manufacturer: product.manufacturer,
          storage: product.storage,
          grade: product.grade,
          price_per_unit: product.price_per_unit,
          available_units: product.available_units,
        })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: "Produkt aktualisiert",
        description: `${product.name} wurde erfolgreich gespeichert.`,
      });

      setEditingProduct(null);
      onProductUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Speichern",
        description: error.message || "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deletingProduct.id);

      if (error) throw error;

      toast({
        title: "Produkt gelöscht",
        description: `${deletingProduct.name} wurde entfernt.`,
      });

      setDeletingProduct(null);
      onProductUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Löschen",
        description: error.message || "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Toolbar: Search, Filters, Add Button */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Grade Filter */}
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Grades</SelectItem>
              <SelectItem value="A">Grade A</SelectItem>
              <SelectItem value="B">Grade B</SelectItem>
              <SelectItem value="C">Grade C</SelectItem>
            </SelectContent>
          </Select>

          {/* Manufacturer Filter */}
          <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Hersteller" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Hersteller</SelectItem>
              {manufacturers.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Filter zurücksetzen
            </Button>
          )}
        </div>

        {/* Add Button */}
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Produkt hinzufügen
        </Button>
      </div>

      {/* Results info */}
      {hasActiveFilters && (
        <p className="mb-3 text-sm text-muted-foreground">
          {filteredProducts.length} von {products.length} Produkten
        </p>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Keine Produkte vorhanden</p>
          <p className="text-sm text-muted-foreground">
            Laden Sie eine CSV-Datei hoch oder fügen Sie einzelne Produkte hinzu.
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Keine Produkte gefunden</p>
          <p className="text-sm text-muted-foreground">
            Versuchen Sie andere Suchbegriffe oder Filter.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Hersteller</TableHead>
                <TableHead>Speicher</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Preis</TableHead>
                <TableHead className="text-right">Stück</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.manufacturer}</TableCell>
                  <TableCell>{product.storage || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={product.grade === "A" ? "default" : "secondary"}>
                      {product.grade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {product.price_per_unit.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right">{product.available_units}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Modal */}
      <ProductAddModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={handleAdd}
        isSaving={isAdding}
      />

      {/* Edit Modal */}
      <ProductEditModal
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{deletingProduct?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
