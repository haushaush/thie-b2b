import { useState } from "react";
import { FileText, Clock, CheckCircle, XCircle, MessageSquare, Building2, Mail, Loader2, Truck, Zap, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRequests, type Request } from "@/hooks/useRequests";
import { RequestActionModal } from "@/components/requests/RequestActionModal";

type RequestStatus = "pending" | "approved" | "rejected";

export default function Requests() {
  const { isAdmin, user } = useAuth();
  const { t, formatCurrency, formatDate } = useLanguage();
  const { data: requests, isLoading, error } = useRequests();
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    requestId: string;
    action: "approve" | "reject";
    userEmail?: string;
    companyName?: string;
  }>({ open: false, requestId: "", action: "approve" });

  const statusConfig: Record<RequestStatus, { label: string; icon: typeof Clock; className: string }> = {
    pending: {
      label: t.requests.status.pending,
      icon: Clock,
      className: "border-warning/30 bg-warning/10 text-warning",
    },
    approved: {
      label: t.requests.status.approved,
      icon: CheckCircle,
      className: "border-success/30 bg-success/10 text-success",
    },
    rejected: {
      label: t.requests.status.rejected,
      icon: XCircle,
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  };

  const calculateTotal = (request: Request) => {
    return request.items.reduce(
      (sum, item) => sum + item.quantity * item.price_per_unit,
      0
    );
  };

  const calculateDevices = (request: Request) => {
    return request.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleAction = (requestId: string, action: "approve" | "reject", userEmail?: string, companyName?: string) => {
    setActionModal({ open: true, requestId, action, userEmail, companyName });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium">{t.common.error}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.common.error}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isAdmin ? t.admin.tabs.requests : t.requests.title}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t.requests.description}
        </p>
      </div>

      {/* Requests List */}
      {requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => {
            const status = statusConfig[request.status];
            const StatusIcon = status.icon;
            const totalAmount = calculateTotal(request);
            const totalDevices = calculateDevices(request);
            
            return (
              <div
                key={request.id}
                className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {request.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDate(request.created_at)}
                    </p>
                    {/* Show user info - admin sees all, user sees own company */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {(isAdmin ? request.company_name : user?.companyName) && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {isAdmin ? request.company_name : user?.companyName}
                        </span>
                      )}
                      {isAdmin && request.user_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {request.user_email}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={status.className}>
                    <StatusIcon className="mr-1 h-3.5 w-3.5" />
                    {status.label}
                  </Badge>
                </div>

                {/* Items Summary */}
                <div className="mt-4 space-y-2">
                  {request.items.map((item) => {
                    const specs = [
                      item.storage,
                      item.color,
                      item.grade,
                      item.battery_health != null ? `${item.battery_health}% Battery` : null,
                    ].filter(Boolean).join(" · ");

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="text-foreground">
                            {item.quantity}x {item.product_name}
                          </span>
                          {specs && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({specs})
                            </span>
                          )}
                        </div>
                        <span className="font-medium shrink-0 ml-4">
                          {formatCurrency(item.quantity * item.price_per_unit)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Admin Message */}
                {request.admin_message && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {t.requests.adminMessage}
                        </p>
                        <p className="mt-1 text-sm">{request.admin_message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Info */}
                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    {request.express_shipping ? (
                      <Zap className="h-4 w-4 text-warning" />
                    ) : (
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">
                      {request.express_shipping ? t.shipping.expressShipping : t.shipping.standardShipping}
                    </span>
                    <span className="ml-auto font-bold">
                      {request.shipping_cost === 0 
                        ? t.shipping.freeShipping 
                        : formatCurrency(request.shipping_cost)
                      }
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">
                    {totalDevices} {totalDevices === 1 ? "Device" : "Devices"}
                  </span>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground block">
                      {t.shipping.grandTotal}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(totalAmount + request.shipping_cost)}
                    </span>
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && request.status === "pending" && (
                  <div className="mt-4 flex gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-success/30 text-success hover:bg-success/10 hover:text-success"
                      onClick={() => handleAction(request.id, "approve", request.user_email, request.company_name)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t.admin.actionModal.approve}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleAction(request.id, "reject", request.user_email, request.company_name)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {t.admin.actionModal.reject}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">{t.requests.noRequests}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.requests.noRequestsDesc}
          </p>
        </div>
      )}

      {/* Action Modal */}
      <RequestActionModal
        open={actionModal.open}
        onOpenChange={(open) => setActionModal((prev) => ({ ...prev, open }))}
        requestId={actionModal.requestId}
        action={actionModal.action}
        userEmail={actionModal.userEmail}
        companyName={actionModal.companyName}
      />
    </div>
  );
}
