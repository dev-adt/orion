import { ProductDetailClient } from './_components/product-detail-client';

export const dynamic = 'force-dynamic';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params?.slug ?? ''} />;
}
