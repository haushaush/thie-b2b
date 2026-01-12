export type RequestStatus = "pending" | "approved" | "rejected";

export interface RequestItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
}

export interface Request {
  id: string;
  date: string;
  items: RequestItem[];
  totalDevices: number;
  totalAmount: number;
  status: RequestStatus;
}

export const mockRequests: Request[] = [
  {
    id: "REQ-001",
    date: "2026-01-10",
    items: [
      { productId: "1", productName: "iPhone 16 Pro 256GB", quantity: 10, pricePerUnit: 899 },
      { productId: "3", productName: "iPhone 16 Pro Max 256GB", quantity: 5, pricePerUnit: 1099 },
    ],
    totalDevices: 15,
    totalAmount: 14485,
    status: "approved",
  },
  {
    id: "REQ-002",
    date: "2026-01-08",
    items: [
      { productId: "5", productName: "iPhone 15 Pro 128GB", quantity: 20, pricePerUnit: 749 },
    ],
    totalDevices: 20,
    totalAmount: 14980,
    status: "pending",
  },
  {
    id: "REQ-003",
    date: "2026-01-05",
    items: [
      { productId: "7", productName: "iPhone 15 128GB", quantity: 8, pricePerUnit: 549 },
      { productId: "12", productName: "MacBook Air M2 256GB", quantity: 3, pricePerUnit: 899 },
    ],
    totalDevices: 11,
    totalAmount: 7089,
    status: "rejected",
  },
];
