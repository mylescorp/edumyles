export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-emerald-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-forest-900 mb-8">
          EduMyles - School Management for East Africa
        </h1>
        <p className="text-xl text-forest-700 mb-8">
          Replace disconnected spreadsheets and messaging groups with one unified platform for admissions, billing, academics, HR, and communication across East Africa.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-forest-900 mb-2">Admissions</h3>
            <p className="text-forest-600">Streamline your enrollment process</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-forest-900 mb-2">Billing</h3>
            <p className="text-forest-600">Automated fee management and payments</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-forest-900 mb-2">Academics</h3>
            <p className="text-forest-600">Comprehensive academic management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
