import { AdminPointRedeemList } from "@/components/admin/AdminPointRedeemList";

export const dynamic = "force-dynamic";

const activeStatuses = ["PENDING", "PROCESSING", "INFO_INVALID"];

export default function AdminPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <AdminPointRedeemList
      title="待处理订单"
      action="/admin/pending"
      where={{ status: { in: activeStatuses } }}
      searchParams={searchParams}
    />
  );
}
