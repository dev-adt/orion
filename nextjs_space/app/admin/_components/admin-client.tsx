'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { formatPrice } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, DollarSign,
  TrendingUp, Plus, Pencil, Trash2, Loader2, ChevronDown,
  FileText, Home as HomeIcon, Eye, EyeOff, Bot, MessageSquare, UserCog, Layers, Sparkles, FolderKanban, Megaphone, PanelBottom, CreditCard, Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ProductEditor } from './product-editor';
import { CategoryManager } from './category-manager';
import { PostEditor } from './post-editor';
import { HomepageEditor } from './homepage-editor';
import { PageManager } from './page-manager';
import { AiTraining } from './ai-training';
import { AiAgentManager } from './ai-agent-manager';
import { ChatHistory } from './chat-history';
import { UserManagement } from './user-management';
import { CrmManager } from './crm-manager';
import { ProjectManager } from './project-manager';
import { MarketingManager } from './marketing-manager';
import { FooterEditor } from './footer-editor';
import { PaymentEditor } from './payment-editor';
import { OperationsManager } from './operations-manager';
import { tabsForRole, type Role, type AdminTab } from '@/lib/roles';

type Tab = AdminTab;

const TAB_CONFIG: { key: Tab; labelVi: string; labelEn: string; icon: any }[] = [
  { key: 'dashboard', labelVi: 'Tổng quan', labelEn: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', labelVi: 'Sản phẩm', labelEn: 'Products', icon: Package },
  { key: 'posts', labelVi: 'Bài viết', labelEn: 'Posts', icon: FileText },
  { key: 'pages', labelVi: 'Trang', labelEn: 'Pages', icon: Layers },
  { key: 'orders', labelVi: 'Đơn hàng', labelEn: 'Orders', icon: ShoppingBag },
  { key: 'homepage', labelVi: 'Trang chủ', labelEn: 'Homepage', icon: HomeIcon },
  { key: 'ai', labelVi: 'Huấn luyện AI', labelEn: 'AI Training', icon: Bot },
  { key: 'ai-agents', labelVi: 'AI Agent', labelEn: 'AI Agents', icon: Sparkles },
  { key: 'chat', labelVi: 'Chăm sóc KH', labelEn: 'Customer Care', icon: MessageSquare },
  { key: 'crm', labelVi: 'CRM', labelEn: 'CRM', icon: Users },
  { key: 'projects', labelVi: 'Dự án', labelEn: 'Projects', icon: FolderKanban },
  { key: 'marketing', labelVi: 'Marketing', labelEn: 'Marketing', icon: Megaphone },
  { key: 'payment', labelVi: 'Cổng thanh toán', labelEn: 'Payment', icon: CreditCard },
  { key: 'operations', labelVi: 'Điều hành', labelEn: 'Operations', icon: Network },
  { key: 'footer', labelVi: 'Chân trang', labelEn: 'Footer', icon: PanelBottom },
  { key: 'users', labelVi: 'Phân quyền', labelEn: 'Users & Roles', icon: UserCog },
];

export function AdminClient({ role, userId }: { role: Role; userId: string }) {
  const { t, locale } = useTranslation();
  const allowedTabs = tabsForRole(role);
  const visibleTabs = TAB_CONFIG.filter((tc) => allowedTabs.includes(tc.key));
  const [tab, setTab] = useState<Tab>(visibleTabs[0]?.key ?? 'dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [initialEditPageId, setInitialEditPageId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Deep-link handling: open a specific editor from ?tab=&editProduct/editPost/editPage=
  useEffect(() => {
    if (loading) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const wantTab = params.get('tab') as Tab | null;
    if (wantTab && allowedTabs.includes(wantTab)) setTab(wantTab);
    const ep = params.get('editProduct');
    if (ep) {
      const p = (products ?? []).find((x: any) => x?.id === ep);
      if (p) { setEditing(p); setEditorOpen(true); }
    }
    const epost = params.get('editPost');
    if (epost) {
      const p = (posts ?? []).find((x: any) => x?.id === epost);
      if (p) { setEditingPost(p); setPostEditorOpen(true); }
    }
    const epage = params.get('editPage');
    if (epage) { setInitialEditPageId(epage); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes, catRes, postRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/orders'),
        fetch('/api/categories'),
        fetch('/api/admin/posts'),
      ]);
      const prodData = await prodRes.json();
      const orderData = await orderRes.json();
      const catData = await catRes.json();
      const postData = postRes.ok ? await postRes.json() : { posts: [] };
      setProducts(prodData?.products ?? []);
      setOrders(orderData?.orders ?? []);
      setCategories(catData?.categories ?? catData ?? []);
      setPosts(postData?.posts ?? []);

      const allOrders = orderData?.orders ?? [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = allOrders.filter((o: any) => new Date(o?.createdAt) >= today);
      const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + (o?.total ?? 0), 0);

      setStats({
        totalRevenue,
        todayOrders: todayOrders?.length ?? 0,
        totalProducts: prodData?.total ?? 0,
        totalOrders: allOrders?.length ?? 0,
        totalPosts: postData?.posts?.length ?? 0,
      });
    } catch {}
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) =>
        (prev ?? []).map((o: any) => (o?.id === orderId ? { ...(o ?? {}), status } : o))
      );
      toast.success(locale === 'vi' ? 'Cập nhật thành công' : 'Updated successfully');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const updateOrderPayment = async (orderId: string, paymentStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });
      setOrders((prev) =>
        (prev ?? []).map((o: any) => (o?.id === orderId ? { ...(o ?? {}), paymentStatus } : o))
      );
      toast.success(locale === 'vi' ? 'Cập nhật thanh toán' : 'Payment updated');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm(locale === 'vi' ? 'Bạn có chắc muốn xóa?' : 'Are you sure?')) return;
    try {
      await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      setProducts((prev) => (prev ?? []).filter((p: any) => p?.id !== productId));
      toast.success(locale === 'vi' ? 'Đã xóa' : 'Deleted');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm(locale === 'vi' ? 'Bạn có chắc muốn xóa bài viết?' : 'Delete this post?')) return;
    try {
      await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      setPosts((prev) => (prev ?? []).filter((p: any) => p?.id !== postId));
      toast.success(locale === 'vi' ? 'Đã xóa' : 'Deleted');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipping: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const payStatusColors: Record<string, string> = {
    unpaid: 'bg-gray-100 text-gray-700',
    awaiting: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
  };
  const payStatusLabels: Record<string, string> = {
    unpaid: 'Chưa thanh toán',
    awaiting: 'Chờ xác nhận',
    paid: 'Đã thanh toán',
  };
  const payMethodLabels: Record<string, string> = {
    cod: 'COD (thu hộ)',
    bank: 'Chuyển khoản',
    vietqr: 'VietQR / Napas',
    vnpay: 'VNPay (Visa/MC/ATM)',
    card: 'Thẻ Visa/Mastercard',
  };
  const statusLabels: Record<string, string> = {
    pending: t('admin.pending'),
    confirmed: t('admin.confirmed'),
    shipping: t('admin.shipping'),
    delivered: t('admin.delivered'),
    cancelled: t('admin.cancelled'),
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-6">
        <LayoutDashboard className="inline h-8 w-8 mr-2 text-primary" />
        {t('admin.dashboard')}
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b overflow-x-auto">
        {visibleTabs.map(({ key, labelVi, labelEn, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {locale === 'vi' ? labelVi : labelEn}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Dashboard */}
          {tab === 'dashboard' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t('admin.revenue'), value: formatPrice(stats?.totalRevenue ?? 0), icon: DollarSign, color: 'text-green-500' },
                { label: t('admin.today_orders'), value: stats?.todayOrders ?? 0, icon: TrendingUp, color: 'text-blue-500' },
                { label: t('admin.total_products'), value: stats?.totalProducts ?? 0, icon: Package, color: 'text-purple-500' },
                { label: locale === 'vi' ? 'Bài viết' : 'Posts', value: stats?.totalPosts ?? 0, icon: FileText, color: 'text-teal-500' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-xl border p-6"
                >
                  <stat.icon className={`h-8 w-8 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Products */}
          {tab === 'products' && (
            <div>
              <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline" className="gap-2" onClick={() => setCategoryManagerOpen(true)}>
                  <Layers className="h-4 w-4" />
                  {locale === 'vi' ? 'Quản lý danh mục' : 'Manage categories'}
                </Button>
                <Button className="gap-2" onClick={() => { setEditing(null); setEditorOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  {locale === 'vi' ? 'Thêm sản phẩm' : 'Add product'}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">{locale === 'vi' ? 'Ảnh' : 'Image'}</th>
                      <th className="text-left py-3 px-2">{locale === 'vi' ? 'Tên' : 'Name'}</th>
                      <th className="text-left py-3 px-2">{t('prod.price')}</th>
                      <th className="text-left py-3 px-2">{locale === 'vi' ? 'Kho' : 'Stock'}</th>
                      <th className="text-left py-3 px-2">{t('prod.rating')}</th>
                      <th className="text-right py-3 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(products ?? []).map((p: any) => (
                      <tr key={p?.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2">
                          <div className="w-10 h-10 rounded bg-muted overflow-hidden relative">
                            <img src={p?.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-2 px-2 font-medium">{locale === 'en' ? (p?.nameEn ?? p?.name) : p?.name}</td>
                        <td className="py-2 px-2">{formatPrice(p?.price ?? 0)}</td>
                        <td className="py-2 px-2">{p?.stock ?? 0}</td>
                        <td className="py-2 px-2">{(p?.rating ?? 0).toFixed(1)}</td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title={locale === 'vi' ? 'Xem sản phẩm' : 'View product'} disabled={!p?.slug} onClick={() => { if (p?.slug) window.open(`/products/${p.slug}`, '_blank'); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title={locale === 'vi' ? 'Sửa' : 'Edit'} onClick={() => { setEditing(p); setEditorOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(p?.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Posts */}
          {tab === 'posts' && (
            <div>
              <div className="flex justify-end mb-4">
                <Button className="gap-2" onClick={() => { setEditingPost(null); setPostEditorOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  {locale === 'vi' ? 'Thêm bài viết' : 'Add post'}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">{locale === 'vi' ? 'Ảnh' : 'Image'}</th>
                      <th className="text-left py-3 px-2">{locale === 'vi' ? 'Tiêu đề' : 'Title'}</th>
                      <th className="text-left py-3 px-2">{locale === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      <th className="text-left py-3 px-2">{locale === 'vi' ? 'Ngày tạo' : 'Created'}</th>
                      <th className="text-right py-3 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(posts ?? []).map((p: any) => (
                      <tr key={p?.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2">
                          <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                            {p?.image ? (
                              <img src={p.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <FileText className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 font-medium">
                          {locale === 'en' ? (p?.titleEn ?? p?.title) : p?.title}
                        </td>
                        <td className="py-2 px-2">
                          {p?.published ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                              <Eye className="h-3 w-3" /> {locale === 'vi' ? 'Công khai' : 'Published'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              <EyeOff className="h-3 w-3" /> {locale === 'vi' ? 'Nháp' : 'Draft'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {new Date(p?.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPost(p); setPostEditorOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePost(p?.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(posts?.length ?? 0) === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-muted-foreground">
                          {locale === 'vi' ? 'Chưa có bài viết nào' : 'No posts yet'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {(orders ?? []).map((order: any) => (
                <div key={order?.id} className="bg-card rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <span className="font-mono text-sm font-bold">{order?.orderNumber}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(order?.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order?.status] ?? 'bg-gray-100'}`}>
                        {statusLabels[order?.status] ?? order?.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${payStatusColors[order?.paymentStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                        {payStatusLabels[order?.paymentStatus] ?? 'Chưa thanh toán'}
                      </span>
                      <select
                        value={order?.paymentStatus ?? 'unpaid'}
                        onChange={(e: any) => updateOrderPayment(order?.id, e?.target?.value)}
                        className="text-xs border rounded px-2 py-1 bg-background"
                      >
                        <option value="unpaid">Chưa thanh toán</option>
                        <option value="awaiting">Chờ xác nhận</option>
                        <option value="paid">Đã thanh toán</option>
                      </select>
                      <select
                        value={order?.status ?? 'pending'}
                        onChange={(e: any) => updateOrderStatus(order?.id, e?.target?.value)}
                        className="text-xs border rounded px-2 py-1 bg-background"
                      >
                        <option value="pending">{t('admin.pending')}</option>
                        <option value="confirmed">{t('admin.confirmed')}</option>
                        <option value="shipping">{t('admin.shipping')}</option>
                        <option value="delivered">{t('admin.delivered')}</option>
                        <option value="cancelled">{t('admin.cancelled')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">{t('checkout.name')}:</span> {order?.customerName}</p>
                    <p><span className="text-muted-foreground">{t('checkout.phone')}:</span> {order?.customerPhone}</p>
                    <p><span className="text-muted-foreground">{t('checkout.address')}:</span> {order?.shippingAddress}</p>
                    <p><span className="text-muted-foreground">Thanh toán:</span> {payMethodLabels[order?.paymentMethod] ?? order?.paymentMethod}</p>
                    <p className="font-bold text-primary">{t('cart.total')}: {formatPrice(order?.total ?? 0)}</p>
                  </div>
                </div>
              ))}
              {(orders?.length ?? 0) === 0 && (
                <p className="text-center py-10 text-muted-foreground">{locale === 'vi' ? 'Chưa có đơn hàng' : 'No orders yet'}</p>
              )}
            </div>
          )}

          {/* Pages (block builder) */}
          {tab === 'pages' && <PageManager categories={categories} initialEditId={initialEditPageId} onConsumedInitialEdit={() => setInitialEditPageId(null)} />}

          {/* Homepage Editor */}
          {tab === 'homepage' && <HomepageEditor />}

          {/* AI Training */}
          {tab === 'ai' && <AiTraining />}

          {/* AI Agents */}
          {tab === 'ai-agents' && <AiAgentManager />}

          {/* Customer Care / Chat History */}
          {tab === 'chat' && <ChatHistory />}

          {/* CRM */}
          {tab === 'crm' && <CrmManager />}

          {tab === 'projects' && <ProjectManager userId={userId} role={role} />}

          {tab === 'marketing' && <MarketingManager />}

          {tab === 'payment' && <PaymentEditor />}

          {tab === 'operations' && <OperationsManager userId={userId} role={role} />}

          {/* Footer Editor */}
          {tab === 'footer' && <FooterEditor />}

          {/* Users & Roles */}
          {tab === 'users' && <UserManagement currentUserId={userId} />}
        </>
      )}

      {editorOpen && (
        <ProductEditor
          product={editing}
          categories={categories}
          onClose={() => setEditorOpen(false)}
          onSaved={loadData}
        />
      )}

      {categoryManagerOpen && (
        <CategoryManager
          onClose={() => setCategoryManagerOpen(false)}
          onSaved={loadData}
        />
      )}

      {postEditorOpen && (
        <PostEditor
          post={editingPost}
          onClose={() => setPostEditorOpen(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
