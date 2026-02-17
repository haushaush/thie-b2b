import { useState, useRef, useMemo } from "react";
import { Upload, FileSpreadsheet, Trash2, AlertCircle, CheckCircle, Loader2, Clock, CheckCircle2, XCircle, UserPlus, ShoppingCart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequests } from "@/hooks/useRequests";
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
import { CreateCustomerModal } from "@/components/admin/CreateCustomerModal";
import { CreateOrderModal } from "@/components/admin/CreateOrderModal";
import { z } from "zod";
import * as XLSX from "xlsx";

// Zod schema for comprehensive CSV product validation
const CSVProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name may have max. 200 characters"),
  manufacturer: z.string().trim().min(1, "Manufacturer is required").max(100, "Manufacturer may have max. 100 characters"),
  storage: z.string().trim().max(50, "Storage may have max. 50 characters").optional().default(""),
  color: z.string().trim().max(100, "Color may have max. 100 characters").optional().default(""),
  battery_health: z.number().int("Battery health must be an integer").min(0).max(100).optional().default(0),
  grade: z.enum(["A", "B", "C"], { errorMap: () => ({ message: "Invalid grade (allowed: A, B, C)" }) }),
  price_per_unit: z.number().positive("Price must be positive").max(999999, "Price may be max. 999,999"),
  available_units: z.number().int("Units must be an integer").min(0, "Units cannot be negative").max(999999, "Units may be max. 999,999"),
});

type CSVProduct = z.infer<typeof CSVProductSchema>;

const sanitizeText = (str: string): string => {
  return str.replace(/[\x00-\x1F\x7F]/g, "").trim();
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, formatCurrency } = useLanguage();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data.map((p) => ({
        id: p.id, name: p.name, manufacturer: p.manufacturer, storage: p.storage || "",
        color: p.color || "", battery_health: p.battery_health || 0, grade: p.grade || "A",
        price_per_unit: Number(p.price_per_unit), available_units: p.available_units,
      })) as ProductData[];
    },
  });

  // Fetch customers (profiles)
  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = (adminRoles || []).map((r) => r.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, company_name, contact_person, contact_phone")
        .order("company_name");
      if (error) throw error;
      return (data || []).filter((p) => !adminIds.includes(p.user_id));
    },
  });

  // Products formatted for order modal
  const productsForOrder = useMemo(() => products.map(p => ({
    id: p.id, name: p.name, manufacturer: p.manufacturer, storage: p.storage,
    price_per_unit: p.price_per_unit, available_units: p.available_units, grade: p.grade,
  })), [products]);

  const parseCSV = (content: string): ParseResult => {
    const lines = content.trim().split("\n");
    const products: CSVProduct[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      errors.push("CSV file must contain at least a header row and one data row");
      return { products, errors };
    }

    const header = lines[0].split(";").map((h) => h.trim().toLowerCase());
    const requiredColumns = ["name", "manufacturer", "storage", "color", "battery_health", "grade", "price_per_unit", "available_units"];
    const missingColumns = requiredColumns.filter((col) => !header.includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Missing columns: ${missingColumns.join(", ")}`);
      return { products, errors };
    }

    const columnIndices = {
      name: header.indexOf("name"), manufacturer: header.indexOf("manufacturer"),
      storage: header.indexOf("storage"), color: header.indexOf("color"),
      battery_health: header.indexOf("battery_health"), grade: header.indexOf("grade"),
      price_per_unit: header.indexOf("price_per_unit"), available_units: header.indexOf("available_units"),
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(";").map((v) => v.trim());
      const parseResult = validateProductRow(values, columnIndices, i + 1, errors);
      if (parseResult) products.push(parseResult);
    }
    return { products, errors };
  };

  const parseXLSX = (data: ArrayBuffer): ParseResult => {
    const products: CSVProduct[] = [];
    const errors: string[] = [];

    // Column name mappings (alternative names -> standard names)
    const columnMappings: Record<string, string> = {
      // Standard names
      "name": "name",
      "manufacturer": "manufacturer",
      "storage": "storage",
      "color": "color",
      "battery_health": "battery_health",
      "grade": "grade",
      "price_per_unit": "price_per_unit",
      "available_units": "available_units",
      // Alternative names from Thie stock list
      "model": "name",
      "make": "manufacturer",
      "memory": "storage",
      "battery avg.": "battery_health",
      "battery avg": "battery_health",
      "batteryavg": "battery_health",
      "qty": "available_units",
      "quantity": "available_units",
      "price/model": "price_per_unit",
      "pricemodel": "price_per_unit",
      "price": "price_per_unit",
      "units": "available_units",
    };

    try {
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      if (rows.length === 0) {
        errors.push("Excel file must contain at least one data row");
        return { products, errors };
      }

      // Map actual column names to standard names
      const firstRow = rows[0];
      const actualHeaders = Object.keys(firstRow);
      const headerMapping: Record<string, string> = {};
      
      actualHeaders.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
        const originalLower = header.toLowerCase();
        
        // Try exact match first, then normalized match
        if (columnMappings[originalLower]) {
          headerMapping[header] = columnMappings[originalLower];
        } else if (columnMappings[normalizedHeader]) {
          headerMapping[header] = columnMappings[normalizedHeader];
        }
      });

      // Check if we have all required standard columns after mapping
      const mappedColumns = new Set(Object.values(headerMapping));
      const requiredColumns = ["name", "manufacturer", "storage", "color", "battery_health", "grade", "price_per_unit", "available_units"];
      const missingColumns = requiredColumns.filter(col => !mappedColumns.has(col));
      
      if (missingColumns.length > 0) {
        errors.push(`Fehlende Spalten: ${missingColumns.join(", ")}. Gefundene Spalten: ${actualHeaders.join(", ")}`);
        return { products, errors };
      }

      rows.forEach((row, index) => {
        // Map row values to standard column names
        const mappedRow: Record<string, any> = {};
        Object.keys(row).forEach(header => {
          const standardName = headerMapping[header];
          if (standardName) {
            mappedRow[standardName] = row[header];
          }
        });

        const values = [
          String(mappedRow.name || ""),
          String(mappedRow.manufacturer || ""),
          String(mappedRow.storage || ""),
          String(mappedRow.color || ""),
          String(mappedRow.battery_health || "0").replace("%", ""),
          String(mappedRow.grade || ""),
          String(mappedRow.price_per_unit || "").replace("€", "").replace(",", ".").trim(),
          String(mappedRow.available_units || ""),
        ];

        const columnIndices = { name: 0, manufacturer: 1, storage: 2, color: 3, battery_health: 4, grade: 5, price_per_unit: 6, available_units: 7 };
        const parseResult = validateProductRow(values, columnIndices, index + 2, errors);
        if (parseResult) products.push(parseResult);
      });
    } catch (error) {
      errors.push("Failed to parse Excel file");
    }

    return { products, errors };
  };

  const validateProductRow = (
    values: string[],
    columnIndices: Record<string, number>,
    rowNumber: number,
    errors: string[]
  ): CSVProduct | null => {
    try {
      const rawName = sanitizeText(values[columnIndices.name] || "");
      const rawManufacturer = sanitizeText(values[columnIndices.manufacturer] || "");
      const rawStorage = sanitizeText(values[columnIndices.storage] || "");
      const rawColor = sanitizeText(values[columnIndices.color] || "");
      const rawBatteryHealth = String(values[columnIndices.battery_health] || "").replace("%", "");
      const rawGrade = sanitizeText(values[columnIndices.grade] || "").toUpperCase();
      const priceStr = String(values[columnIndices.price_per_unit] || "").replace(",", ".");
      const unitsStr = String(values[columnIndices.available_units] || "");
      const price = parseFloat(priceStr);
      const units = parseInt(unitsStr, 10);
      const batteryHealth = parseInt(rawBatteryHealth, 10);

      const result = CSVProductSchema.safeParse({
        name: rawName, manufacturer: rawManufacturer, storage: rawStorage, color: rawColor,
        battery_health: isNaN(batteryHealth) ? 0 : batteryHealth, grade: rawGrade,
        price_per_unit: isNaN(price) ? -1 : price, available_units: isNaN(units) ? -1 : units,
      });

      if (!result.success) {
        const errorMessages = result.error.errors.map(e => e.message).join("; ");
        errors.push(`${t.admin.upload.validationError.replace("{row}", String(rowNumber))} ${errorMessages}`);
        return null;
      }
      return result.data;
    } catch {
      errors.push(`${t.admin.upload.validationError.replace("{row}", String(rowNumber))} Parse error`);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const isCSV = file.name.endsWith(".csv");
    const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    
    if (!isCSV && !isXLSX) {
      toast({ variant: "destructive", title: t.admin.upload.error, description: t.admin.upload.invalidFormat });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: t.admin.upload.error, description: "Max 5 MB" });
      return;
    }
    
    let result: ParseResult;
    
    if (isXLSX) {
      const arrayBuffer = await file.arrayBuffer();
      result = parseXLSX(arrayBuffer);
    } else {
      const content = await file.text();
      result = parseCSV(content);
    }
    
    setParsedProducts(result.products);
    setParseErrors(result.errors);
    if (result.products.length > 0) setShowConfirmDialog(true);
    else if (result.errors.length > 0) toast({ variant: "destructive", title: t.admin.upload.error, description: t.admin.upload.invalidFormat });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadConfirm = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);
    try {
      const { error: deleteError } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (deleteError) throw deleteError;
      const productsForInsert = parsedProducts.map(p => ({
        name: p.name, manufacturer: p.manufacturer, storage: p.storage, color: p.color,
        battery_health: p.battery_health, grade: p.grade, price_per_unit: p.price_per_unit, available_units: p.available_units,
      }));
      const { error: insertError } = await supabase.from("products").insert(productsForInsert);
      if (insertError) throw insertError;
      
      toast({ title: t.admin.upload.success, description: t.admin.upload.successDesc.replace("{count}", String(parsedProducts.length)) });
      setParsedProducts([]);
      setParseErrors([]);
      refetchProducts();
      
      // Send notification email to all users about new products (fire and forget)
      supabase.functions.invoke("notify-new-products", {
        body: {
          productCount: parsedProducts.length,
          products: parsedProducts.slice(0, 10).map(p => ({
            name: p.name,
            quantity: p.available_units,
            grade: p.grade || undefined,
          })),
        },
      }).then(() => {
        console.log("New product notification sent successfully");
      }).catch((notifyError) => {
        console.error("Failed to send new product notification:", notifyError);
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: t.admin.upload.error, description: error.message || t.common.error });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: t.admin.products.deleteSuccess, description: t.admin.products.deleteSuccessDesc });
      refetchProducts();
    } catch (error: any) {
      toast({ variant: "destructive", title: t.admin.products.deleteError, description: error.message || t.common.error });
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: requests = [] } = useRequests();
  const totalUnits = useMemo(() => products.reduce((sum, p) => sum + p.available_units, 0), [products]);
  const totalValue = useMemo(() => products.reduce((sum, p) => sum + (p.price_per_unit * p.available_units), 0), [products]);
  const requestStats = useMemo(() => {
    const pending = requests.filter(r => r.status === "pending").length;
    const approved = requests.filter(r => r.status === "approved").length;
    const rejected = requests.filter(r => r.status === "rejected").length;
    return { pending, approved, rejected, total: requests.length };
  }, [requests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.admin.description}</p>
      </div>

      {/* Admin Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className="cursor-pointer border-primary bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={() => setShowCreateCustomer(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardDescription className="text-lg font-semibold text-white">
                {t.admin.customers.createTitle}
              </CardDescription>
              <CardTitle className="text-4xl text-white">{customers.length}</CardTitle>
            </div>
            <UserPlus className="h-8 w-8 text-white/80" />
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer border-primary bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={() => setShowCreateOrder(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardDescription className="text-lg font-semibold text-white">
                {t.admin.orders.createTitle}
              </CardDescription>
              <CardTitle className="text-4xl text-white">{requestStats.total}</CardTitle>
            </div>
            <ShoppingCart className="h-8 w-8 text-white/80" />
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>{t.admin.stats.totalProducts}</CardDescription><CardTitle className="text-3xl">{products.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t.admin.products.table.available}</CardDescription><CardTitle className="text-3xl">{totalUnits.toLocaleString()}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t.cart.total}</CardDescription><CardTitle className="text-3xl">{formatCurrency(totalValue)}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><FileSpreadsheet className="h-4 w-4" />{t.admin.stats.totalRequests}</CardDescription><CardTitle className="text-3xl">{requestStats.total}</CardTitle></CardHeader></Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1 text-yellow-600"><Clock className="h-4 w-4" />{t.admin.stats.pending}</CardDescription><CardTitle className="text-3xl text-yellow-600">{requestStats.pending}</CardTitle></CardHeader></Card>
        <Card className="border-green-500/20 bg-green-500/5"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" />{t.admin.stats.approved}</CardDescription><CardTitle className="text-3xl text-green-600">{requestStats.approved}</CardTitle></CardHeader></Card>
        <Card className="border-red-500/20 bg-red-500/5"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" />{t.admin.stats.rejected}</CardDescription><CardTitle className="text-3xl text-red-600">{requestStats.rejected}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />{t.admin.upload.title}</CardTitle><CardDescription>{t.admin.upload.description}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" id="csv-upload" />
            <label htmlFor="csv-upload" className="flex cursor-pointer flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <span className="text-lg font-medium">CSV oder Excel-Datei auswählen</span>
              <span className="text-sm text-muted-foreground">.csv, .xlsx, .xls (max. 5 MB)</span>
            </label>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">{t.admin.upload.csvFormat}</h4>
            <p className="mb-2 text-sm text-muted-foreground">{t.admin.upload.columns}</p>
            <code className="block rounded bg-background p-2 text-xs">name;manufacturer;storage;color;battery_health;grade;price_per_unit;available_units</code>
          </div>
          <div className="flex gap-3">
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting || isUploading}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}{t.common.delete}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.admin.tabs.products}</CardTitle><CardDescription>{products.length} {t.admin.stats.totalProducts}</CardDescription></CardHeader>
        <CardContent><ProductsTable products={products} isLoading={isLoadingProducts} onProductUpdated={refetchProducts} /></CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />{parsedProducts.length} {t.admin.stats.totalProducts}</AlertDialogTitle><AlertDialogDescription>{t.admin.upload.previewDesc.replace("{count}", String(parsedProducts.length))}</AlertDialogDescription></AlertDialogHeader>
          {parseErrors.length > 0 && (<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3"><div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" /><span className="font-medium">{parseErrors.length} {t.admin.upload.warnings}</span></div><ul className="mt-2 max-h-20 overflow-y-auto text-sm text-destructive/80">{parseErrors.slice(0, 5).map((error, i) => (<li key={i}>• {error}</li>))}{parseErrors.length > 5 && (<li>... +{parseErrors.length - 5}</li>)}</ul></div>)}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table><TableHeader><TableRow><TableHead>{t.admin.products.table.name}</TableHead><TableHead>{t.admin.products.table.manufacturer}</TableHead><TableHead>{t.admin.products.table.storage}</TableHead><TableHead>{t.admin.products.table.grade}</TableHead><TableHead className="text-right">{t.admin.products.table.price}</TableHead><TableHead className="text-right">{t.admin.products.table.available}</TableHead></TableRow></TableHeader><TableBody>{parsedProducts.slice(0, 10).map((product, i) => (<TableRow key={i}><TableCell className="font-medium">{product.name}</TableCell><TableCell>{product.manufacturer}</TableCell><TableCell>{product.storage}</TableCell><TableCell>{product.grade}</TableCell><TableCell className="text-right">{formatCurrency(product.price_per_unit)}</TableCell><TableCell className="text-right">{product.available_units}</TableCell></TableRow>))}{parsedProducts.length > 10 && (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">... +{parsedProducts.length - 10}</TableCell></TableRow>)}</TableBody></Table>
          </div>
          <AlertDialogFooter><AlertDialogCancel>{t.admin.upload.cancel}</AlertDialogCancel><AlertDialogAction onClick={handleUploadConfirm} disabled={isUploading}>{isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t.admin.upload.import}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.admin.products.confirmDelete}</AlertDialogTitle><AlertDialogDescription>{t.admin.products.confirmDeleteDesc.replace("{name}", "all products")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.common.delete}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Customer & Order Modals */}
      <CreateCustomerModal
        open={showCreateCustomer}
        onOpenChange={setShowCreateCustomer}
        onCreated={() => refetchCustomers()}
      />
      <CreateOrderModal
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        customers={customers}
        products={productsForOrder}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["requests"] })}
      />
    </div>
  );
}
