import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Trash2, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
import { ProductsTable } from "@/components/admin/ProductsTable";
import { ProductData } from "@/components/admin/ProductEditModal";

interface CSVProduct {
  name: string;
  manufacturer: string;
  storage: string;
  grade: string;
  price_per_unit: number;
  available_units: number;
}

interface ParseResult {
  products: CSVProduct[];
  errors: string[];
}

export default function Admin() {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<CSVProduct[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch all products
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;

      return data.map((p) => ({
        id: p.id,
        name: p.name,
        manufacturer: p.manufacturer,
        storage: p.storage || "",
        grade: p.grade || "A",
        price_per_unit: Number(p.price_per_unit),
        available_units: p.available_units,
      })) as ProductData[];
    },
  });

  const parseCSV = (content: string): ParseResult => {
    const lines = content.trim().split("\n");
    const products: CSVProduct[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      errors.push("Die CSV-Datei muss mindestens eine Kopfzeile und eine Datenzeile enthalten");
      return { products, errors };
    }

    // Parse header
    const header = lines[0].split(";").map((h) => h.trim().toLowerCase());
    const requiredColumns = ["name", "manufacturer", "storage", "grade", "price_per_unit", "available_units"];
    
    const missingColumns = requiredColumns.filter((col) => !header.includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Fehlende Spalten: ${missingColumns.join(", ")}`);
      return { products, errors };
    }

    const columnIndices = {
      name: header.indexOf("name"),
      manufacturer: header.indexOf("manufacturer"),
      storage: header.indexOf("storage"),
      grade: header.indexOf("grade"),
      price_per_unit: header.indexOf("price_per_unit"),
      available_units: header.indexOf("available_units"),
    };

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(";").map((v) => v.trim());
      
      try {
        const name = values[columnIndices.name];
        const manufacturer = values[columnIndices.manufacturer];
        const storage = values[columnIndices.storage];
        const grade = values[columnIndices.grade]?.toUpperCase();
        const priceStr = values[columnIndices.price_per_unit]?.replace(",", ".");
        const unitsStr = values[columnIndices.available_units];

        if (!name || !manufacturer) {
          errors.push(`Zeile ${i + 1}: Name und Hersteller sind erforderlich`);
          continue;
        }

        if (!["A", "B", "C"].includes(grade)) {
          errors.push(`Zeile ${i + 1}: Ungültige Qualitätsstufe "${grade}" (erlaubt: A, B, C)`);
          continue;
        }

        const price = parseFloat(priceStr);
        const units = parseInt(unitsStr, 10);

        if (isNaN(price) || price < 0) {
          errors.push(`Zeile ${i + 1}: Ungültiger Preis "${priceStr}"`);
          continue;
        }

        if (isNaN(units) || units < 0) {
          errors.push(`Zeile ${i + 1}: Ungültige Stückzahl "${unitsStr}"`);
          continue;
        }

        products.push({
          name,
          manufacturer,
          storage: storage || "",
          grade,
          price_per_unit: price,
          available_units: units,
        });
      } catch {
        errors.push(`Zeile ${i + 1}: Fehler beim Parsen`);
      }
    }

    return { products, errors };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Ungültiges Dateiformat",
        description: "Bitte laden Sie eine CSV-Datei hoch",
      });
      return;
    }

    const content = await file.text();
    const result = parseCSV(content);
    
    setParsedProducts(result.products);
    setParseErrors(result.errors);

    if (result.products.length > 0) {
      setShowConfirmDialog(true);
    } else if (result.errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Fehler beim Parsen",
        description: "Die CSV-Datei enthält keine gültigen Produkte",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadConfirm = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);

    try {
      // First, delete all existing products
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (deleteError) throw deleteError;

      // Insert new products
      const { error: insertError } = await supabase
        .from("products")
        .insert(parsedProducts);

      if (insertError) throw insertError;

      toast({
        title: "Katalog erfolgreich aktualisiert",
        description: `${parsedProducts.length} Produkte wurden importiert`,
      });

      setParsedProducts([]);
      setParseErrors([]);
      refetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Upload",
        description: error.message || "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast({
        title: "Katalog gelöscht",
        description: "Alle Produkte wurden entfernt",
      });
      refetchProducts();
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Verwalten Sie den Gerätekatalog
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV Import
          </CardTitle>
          <CardDescription>
            Laden Sie eine CSV-Datei hoch, um den Gerätekatalog zu aktualisieren.
            Die bestehenden Produkte werden ersetzt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex cursor-pointer flex-col items-center gap-2"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <span className="text-lg font-medium">CSV-Datei hochladen</span>
              <span className="text-sm text-muted-foreground">
                Klicken Sie hier oder ziehen Sie eine Datei hierher
              </span>
            </label>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">CSV Format</h4>
            <p className="mb-2 text-sm text-muted-foreground">
              Die CSV-Datei muss folgende Spalten enthalten (Semikolon-getrennt):
            </p>
            <code className="block rounded bg-background p-2 text-xs">
              name;manufacturer;storage;grade;price_per_unit;available_units
            </code>
            <p className="mt-2 text-xs text-muted-foreground">
              Beispiel: iPhone 14 Pro;Apple;256GB;A;899.99;50
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting || isUploading}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Alle Produkte löschen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produktkatalog</CardTitle>
          <CardDescription>
            Alle {products.length} Produkte im System. Klicken Sie auf Bearbeiten, um ein Produkt zu ändern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTable
            products={products}
            isLoading={isLoadingProducts}
            onProductUpdated={refetchProducts}
          />
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {parsedProducts.length} Produkte gefunden
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den aktuellen Katalog mit diesen Produkten ersetzen?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{parseErrors.length} Warnungen</span>
              </div>
              <ul className="mt-2 max-h-20 overflow-y-auto text-sm text-destructive/80">
                {parseErrors.slice(0, 5).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
                {parseErrors.length > 5 && (
                  <li>... und {parseErrors.length - 5} weitere</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Hersteller</TableHead>
                  <TableHead>Speicher</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Preis</TableHead>
                  <TableHead className="text-right">Stück</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedProducts.slice(0, 10).map((product, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.manufacturer}</TableCell>
                    <TableCell>{product.storage}</TableCell>
                    <TableCell>{product.grade}</TableCell>
                    <TableCell className="text-right">
                      {product.price_per_unit.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right">{product.available_units}</TableCell>
                  </TableRow>
                ))}
                {parsedProducts.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      ... und {parsedProducts.length - 10} weitere Produkte
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleUploadConfirm} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Katalog ersetzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Produkte löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Produkte im Katalog werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Alle löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
