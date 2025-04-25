import OrderForm from '@/components/OrderForm';
import OrderStatus from '@/components/OrderStatus';
import { Link } from 'wouter';

export default function Home() {
  return (
    <div className="flex-1 overflow-auto">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">Generate SEO Content</h1>
              <p className="mt-1 text-sm text-gray-500">
                Use AI to create high-quality SEO content for your website or blog.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link href="/login">
                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200">
                  Admin Login
                </a>
              </Link>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <OrderForm />
            </div>
          </div>

          {/* Order Tracking Section */}
          <OrderStatus />
        </div>
      </main>
    </div>
  );
}
