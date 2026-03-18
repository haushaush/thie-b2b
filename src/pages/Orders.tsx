import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, Mail, Send, Loader2, Eye, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  storage?: string | null;
  color?: string | null;
  grade?: string | null;
  battery_health?: number | null;
}

interface Order {
  id: string;
  user_id: string;
  created_at: string;
  shipping_cost: number;
  express_shipping: boolean;
  admin_message: string | null;
  items: OrderItem[];
  user_email?: string;
  company_name?: string;
  contact_person?: string;
}

export default function Orders() {
  const { t, formatCurrency } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      // Fetch approved requests
      const { data: requests, error } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      // Fetch items
      const requestIds = requests.map((r) => r.id);
      const { data: items } = await supabase
        .from("request_items")
        .select("*, products(storage, color, grade, battery_health)")
        .in("request_id", requestIds);

      // Fetch profiles
      const userIds = [...new Set(requests.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, company_name, contact_person")
        .in("user_id", userIds);

      const profilesMap: Record<string, { email: string; company_name: string | null; contact_person: string | null }> = {};
      (profiles || []).forEach((p) => {
        profilesMap[p.user_id] = { email: p.email, company_name: p.company_name, contact_person: p.contact_person };
      });

      return requests.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        created_at: r.created_at,
        shipping_cost: Number(r.shipping_cost),
        express_shipping: r.express_shipping,
        admin_message: r.admin_message,
        items: (items || [])
          .filter((i) => i.request_id === r.id)
          .map((i) => {
            const product = (i as any).products;
            return {
              id: i.id,
              product_name: i.product_name,
              quantity: i.quantity,
              price_per_unit: Number(i.price_per_unit),
              storage: product?.storage ?? null,
              color: product?.color ?? null,
              grade: product?.grade ?? null,
              battery_health: product?.battery_health ?? null,
            };
          }),
        user_email: profilesMap[r.user_id]?.email,
        company_name: profilesMap[r.user_id]?.company_name ?? undefined,
        contact_person: profilesMap[r.user_id]?.contact_person ?? undefined,
      })) as Order[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        (o.company_name || "").toLowerCase().includes(q) ||
        (o.user_email || "").toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.items.some((i) => i.product_name.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const getOrderTotal = (order: Order) =>
    order.items.reduce((sum, i) => sum + i.quantity * i.price_per_unit, 0);

  const getOrderDevices = (order: Order) =>
    order.items.reduce((sum, i) => sum + i.quantity, 0);

  const handleSendMessage = async () => {
    if (!selectedOrder || !messageText.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-order-message", {
        body: {
          requestId: selectedOrder.id,
          userEmail: selectedOrder.user_email,
          companyName: selectedOrder.company_name,
          contactPerson: selectedOrder.contact_person,
          message: messageText.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: t.admin.ordersPage?.messageSent || "Nachricht gesendet",
        description: t.admin.ordersPage?.messageSentDesc || "Die E-Mail wurde erfolgreich versendet.",
      });
      setMessageText("");
      setSelectedOrder(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error,
        description: error.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buildExportRows = useCallback((orderItems: OrderItem[]) => {
    return orderItems.map((item) => ({
      Make: item.product_name.includes("iPhone") || item.product_name.includes("iPad") || item.product_name.includes("Mac") ? "Apple" : "Samsung",
      Model: item.product_name,
      Memory: item.storage || "",
      Color: item.color || "",
      "Battery Avg.": item.battery_health ? `${item.battery_health}%` : "",
      Grade: item.grade || "",
      QTY: item.quantity,
      "Price/Model": `${item.price_per_unit.toFixed(2)} €`,
      Total: `${(item.quantity * item.price_per_unit).toFixed(2)} €`,
    }));
  }, []);

  const exportOrder = useCallback((order: Order, format: "xlsx" | "csv") => {
    const rows = buildExportRows(order.items);
    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
    const totalValue = order.items.reduce((s, i) => s + i.quantity * i.price_per_unit, 0);
    rows.push({
      Make: "", Model: "", Memory: "", Color: "", "Battery Avg.": "", Grade: "",
      QTY: totalQty,
      "Price/Model": "",
      Total: `${totalValue.toFixed(2)} €`,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    const customerName = order.company_name || "Order";
    const dateStr = new Date(order.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\./g, ".");
    XLSX.utils.book_append_sheet(wb, ws, "Bestellung");
    const filename = `Thie_${order.id.slice(0, 4)}_${customerName.replace(/\s+/g, "_")}_${dateStr}`;
    XLSX.writeFile(wb, `${filename}.${format}`);
  }, [buildExportRows]);

  const exportAllOrders = useCallback((format: "xlsx" | "csv") => {
    const allRows: any[] = [];
    filtered.forEach((order) => {
      const rows = buildExportRows(order.items);
      allRows.push(...rows);
    });
    const totalQty = allRows.reduce((s, r) => s + (r.QTY || 0), 0);
    const totalValue = filtered.reduce((s, o) => s + getOrderTotal(o), 0);
    allRows.push({
      Make: "", Model: "", Memory: "", Color: "", "Battery Avg.": "", Grade: "",
      QTY: totalQty,
      "Price/Model": "",
      Total: `${totalValue.toFixed(2)} €`,
    });

    const ws = XLSX.utils.json_to_sheet(allRows);
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\./g, ".");
    XLSX.utils.book_append_sheet(wb, ws, "Bestellungen");
    XLSX.writeFile(wb, `Thie_Bestellungen_${dateStr}.${format}`);
  }, [filtered, buildExportRows, getOrderTotal]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.ordersPage?.title || "Bestellungen"}</h1>
        <p className="mt-1 text-muted-foreground">
          {t.admin.ordersPage?.description || "Übersicht aller genehmigten Bestellungen."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.admin.ordersPage?.totalOrders || "Bestellungen"}</CardDescription>
            <CardTitle className="text-3xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.admin.ordersPage?.totalDevices || "Geräte"}</CardDescription>
            <CardTitle className="text-3xl">
              {orders.reduce((sum, o) => sum + getOrderDevices(o), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.admin.ordersPage?.totalValue || "Gesamtwert"}</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(orders.reduce((sum, o) => sum + getOrderTotal(o) + o.shipping_cost, 0))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.admin.ordersPage?.title || "Bestellungen"}
              </CardTitle>
              <CardDescription>
                {filtered.length} {t.admin.ordersPage?.title || "Bestellungen"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportAllOrders("xlsx")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Als Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAllOrders("csv")}>
                  <Download className="mr-2 h-4 w-4" />
                  Als CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.admin.ordersPage?.searchPlaceholder || "Bestellungen suchen..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              {t.common.loading}...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">
                {t.admin.ordersPage?.noOrders || "Keine Bestellungen"}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {t.admin.ordersPage?.noOrdersDesc || "Es gibt noch keine genehmigten Bestellungen."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">{t.admin.ordersPage?.orderNumber || "Nr."}</TableHead>
                    <TableHead className="font-semibold">{t.admin.customers?.companyName || "Kunde"}</TableHead>
                    <TableHead className="font-semibold">{t.admin.ordersPage?.date || "Datum"}</TableHead>
                    <TableHead className="font-semibold">{t.admin.ordersPage?.items || "Produkte"}</TableHead>
                    <TableHead className="font-semibold">{t.admin.ordersPage?.totalLabel || "Gesamt"}</TableHead>
                    <TableHead className="font-semibold">{t.admin.ordersPage?.shipping || "Versand"}</TableHead>
                    <TableHead className="font-semibold w-[120px]">{t.admin.products?.table?.actions || "Aktionen"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => {
                    const total = getOrderTotal(order);
                    const devices = getOrderDevices(order);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.company_name || order.user_email}</span>
                            {order.contact_person && (
                              <span className="text-xs text-muted-foreground">{order.contact_person}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{devices} {t.admin.ordersPage?.devices || "Geräte"}</span>
                            <span className="text-xs text-muted-foreground">
                              {order.items.length} {t.admin.ordersPage?.positions || "Positionen"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{formatCurrency(total)}</TableCell>
                        <TableCell>
                          {order.express_shipping ? (
                            <Badge variant="secondary" className="text-xs">Express</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Standard</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => { setSelectedOrder(order); setMessageText(""); }}
                              title={t.admin.ordersPage?.viewDetails || "Details & Nachricht"}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-accent"
                              onClick={() => { setSelectedOrder(order); setMessageText(""); }}
                              title={t.admin.ordersPage?.sendMessage || "Nachricht senden"}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Export">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => exportOrder(order, "xlsx")}>
                                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportOrder(order, "csv")}>
                                  <Download className="mr-2 h-4 w-4" /> CSV
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail / Message Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t.admin.ordersPage?.orderDetails || "Bestelldetails"} #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.company_name || selectedOrder.user_email}
                  {selectedOrder.contact_person && ` • ${selectedOrder.contact_person}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Order Items */}
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">{t.admin.products?.table?.name || "Produkt"}</TableHead>
                        <TableHead className="font-semibold text-right">{t.admin.ordersPage?.quantity || "Menge"}</TableHead>
                        <TableHead className="font-semibold text-right">{t.admin.products?.table?.price || "Preis"}</TableHead>
                        <TableHead className="font-semibold text-right">{t.admin.ordersPage?.totalLabel || "Gesamt"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{item.product_name}</span>
                              {(() => {
                                const specs = [
                                  item.storage,
                                  item.color,
                                  item.grade ? `Grade ${item.grade}` : null,
                                  item.battery_health ? `${item.battery_health}% Battery` : null,
                                ].filter(Boolean).join(" · ");
                                return specs ? (
                                  <span className="text-xs text-muted-foreground">{specs}</span>
                                ) : null;
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price_per_unit)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.quantity * item.price_per_unit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.submit?.subtotal || "Zwischensumme"}</span>
                    <span className="font-medium">{formatCurrency(getOrderTotal(selectedOrder))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selectedOrder.express_shipping ? "Express-Versand" : t.shipping?.shippingCost || "Versand"}
                    </span>
                    <span className="font-medium">
                      {selectedOrder.shipping_cost === 0
                        ? (t.shipping?.freeShipping || "Kostenlos")
                        : formatCurrency(selectedOrder.shipping_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>{t.shipping?.grandTotal || "Gesamtbetrag"}</span>
                    <span className="text-primary">
                      {formatCurrency(getOrderTotal(selectedOrder) + selectedOrder.shipping_cost)}
                    </span>
                  </div>
                </div>

                {/* Send Message */}
                <div className="space-y-2 border-t pt-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Mail className="h-4 w-4" />
                    {t.admin.ordersPage?.sendMessageTitle || "Nachricht an Kunden senden"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.admin.ordersPage?.sendMessageDesc || "Die Nachricht wird per E-Mail an den Kunden gesendet."}
                  </p>
                  <Textarea
                    placeholder={t.admin.ordersPage?.messagePlaceholder || "z.B. Ihre Bestellung wird morgen versendet. Tracking-Nr: ..."}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  {t.common.cancel}
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageText.trim()}
                  className="gap-2"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {t.admin.ordersPage?.send || "Nachricht senden"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
