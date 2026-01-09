import AppLayout from '@/components/AppLayout';
import UserLicenseManager from '@/components/UserLicenseManager';

export default function MyLicensesPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <UserLicenseManager />
      </div>
    </AppLayout>
  );
}
