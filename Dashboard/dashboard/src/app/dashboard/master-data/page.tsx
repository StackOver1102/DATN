"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterDataList } from "@/components/master-data/master-data-list";

const masterDataTypes = [
  {
    value: "payment-methods",
    label: "Payment Methods",
    description: "Manage payment methods available in the system",
  },
  {
    value: "product-types",
    label: "Product Types",
    description: "Manage different types of products",
  },
  {
    value: "order-statuses",
    label: "Order Statuses",
    description: "Manage possible statuses for orders",
  },
  {
    value: "transaction-types",
    label: "Transaction Types",
    description: "Manage different types of transactions",
  },
  {
    value: "support-categories",
    label: "Support Categories",
    description: "Manage categories for support tickets",
  },
];

export default function MasterDataPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Master Data Management</h1>
      </div>

      <Tabs defaultValue="payment-methods">
        <TabsList className="mb-6">
          {masterDataTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {masterDataTypes.map((type) => (
          <TabsContent key={type.value} value={type.value}>
            <MasterDataList
              type={type.value}
              title={type.label}
              description={type.description}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
