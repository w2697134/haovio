import { AdminPointRedeemList } from "@/components/admin/AdminPointRedeemList";

export const dynamic = "force-dynamic";

export default function AdminTotalOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <AdminPointRedeemList
      title="总订单"
      action="/admin"
      where={{}}
      searchParams={searchParams}
    />
  );
}
