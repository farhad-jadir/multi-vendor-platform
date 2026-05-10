import RegisterForm from '../../../components/forms/RegisterForm';
import Card from '../../../components/ui/Card';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our platform as a customer or merchant
          </p>
        </div>
        <Card>
          <RegisterForm />
        </Card>
      </div>
    </div>
  );
}