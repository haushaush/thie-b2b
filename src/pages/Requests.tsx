import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { mockRequests, RequestStatus } from "@/data/mockRequests";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<RequestStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: {
    label: "Ausstehend",
    icon: Clock,
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  approved: {
    label: "Genehmigt",
    icon: CheckCircle,
    className: "border-success/30 bg-success/10 text-success",
  },
  rejected: {
    label: "Abgelehnt",
    icon: XCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

export default function Requests() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d. MMMM yyyy", { locale: de });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meine Anfragen</h1>
        <p className="mt-1 text-muted-foreground">
          Übersicht aller Ihrer bisherigen Anfragen
        </p>
      </div>

      {/* Requests List */}
      {mockRequests.length > 0 ? (
        <div className="space-y-4">
          {mockRequests.map((request) => {
            const status = statusConfig[request.status];
            const StatusIcon = status.icon;
            
            return (
              <div
                key={request.id}
                className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{request.id}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDate(request.date)}
                    </p>
                  </div>
                  <Badge variant="outline" className={status.className}>
                    <StatusIcon className="mr-1 h-3.5 w-3.5" />
                    {status.label}
                  </Badge>
                </div>

                {/* Items Summary */}
                <div className="mt-4 space-y-2">
                  {request.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.quantity * item.pricePerUnit)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">
                    {request.totalDevices} Geräte
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(request.totalAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Keine Anfragen vorhanden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Stellen Sie Ihre erste Anfrage über das Dashboard
          </p>
        </div>
      )}
    </div>
  );
}
