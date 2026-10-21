import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '../components/common/EmptyState';
import { PageContainer } from '../components/layout/PageContainer';

export function NotFoundPage() {
  return (
    <PageContainer title="Halaman tidak ditemukan">
      <EmptyState
        icon={Compass}
        title="Alamat ini tidak tersedia"
        description="Periksa kembali tautan atau kembali ke peta."
        action={
          <Link to="/peta" className="btn-primary mt-2">
            Kembali ke Peta
          </Link>
        }
      />
    </PageContainer>
  );
}
