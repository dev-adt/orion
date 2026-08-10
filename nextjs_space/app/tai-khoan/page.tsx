import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/i18n';
import { Package, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipping: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth');
  }
  const userId = (session.user as any)?.id as string;

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
        <Package className="h-8 w-8 text-primary" />
        Đơn hàng của tôi
      </h1>
      <p className="text-muted-foreground mb-8">
        Xin chào {(session.user as any)?.name ?? (session.user as any)?.email}, đây là danh sách đơn hàng của bạn.
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <span className="font-mono text-sm font-bold">{order.orderNumber}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <span className={'text-xs px-2 py-1 rounded-full ' + (STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700')}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <span className="text-sm text-muted-foreground">Tổng cộng</span>
                <span className="font-bold text-primary text-lg">{formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
