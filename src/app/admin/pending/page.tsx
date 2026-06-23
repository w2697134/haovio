import { AdminRedeemList } from "@/components/admin/AdminRedeemList";

export const dynamic = "force-dynamic";

const activeStatuses = ["PENDING", "PROCESSING", "RECHARGED_PENDING_CANCEL", "INFO_INVALID"];

export default function AdminPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <AdminRedeemList
      title="待处理"
      action="/admin/pending"
      where={{ status: { in: activeStatuses } }}
      searchParams={searchParams}
    />
  );
}
