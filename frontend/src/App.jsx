import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

import { LoginPage, RegisterPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { PlansPage } from './pages/PlansPage';
import { ComparePlansPage } from './pages/ComparePlansPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { TaxesDiscountsPage } from './pages/TaxesDiscountsPage';
import { ReportsPage } from './pages/ReportsPage';
import { BillingAssistantPage } from './pages/BillingAssistantPage';
import { SettingsPage } from './pages/SettingsPage';

const allowedTabsByRole = {
  admin: ['dashboard', 'customers', 'products', 'plans', 'compare-plans', 'quotations', 'subscriptions', 'invoices', 'payments', 'taxes-discounts', 'reports', 'settings'],
  staff: ['dashboard', 'customers', 'products', 'plans', 'compare-plans', 'quotations', 'subscriptions', 'invoices', 'payments', 'reports', 'settings'],
  customer: ['dashboard', 'plans', 'compare-plans', 'quotations', 'subscriptions', 'invoices', 'payments', 'assistant', 'settings'],
};

const AppContent = () => {
  const { isAuthenticated, loading, role } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cross-page action targets
  const [switchTargetSub, setSwitchTargetSub] = useState(null);
  const [payTargetInvoice, setPayTargetInvoice] = useState(null);

  // Enforce role-based tab access
  useEffect(() => {
    if (role) {
      const allowed = allowedTabsByRole[role] || ['dashboard'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [role, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Brightloop...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  const handleOpenSwitchPlan = (sub) => {
    setSwitchTargetSub(sub);
    setActiveTab('subscriptions');
  };

  const handleOpenPayInvoice = (inv) => {
    setPayTargetInvoice(inv);
    setActiveTab('invoices');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              onOpenSwitchPlan={handleOpenSwitchPlan}
              onOpenPayInvoice={handleOpenPayInvoice}
            />
          )}

          {activeTab === 'customers' && ['admin', 'staff'].includes(role) && <CustomersPage />}

          {activeTab === 'products' && ['admin', 'staff'].includes(role) && <ProductsPage />}

          {activeTab === 'plans' && <PlansPage onSelectPlan={handleOpenSwitchPlan} />}

          {activeTab === 'compare-plans' && (
            <ComparePlansPage onSelectPlan={handleOpenSwitchPlan} />
          )}

          {activeTab === 'quotations' && <QuotationsPage />}

          {activeTab === 'subscriptions' && (
            <SubscriptionsPage
              switchTargetSub={switchTargetSub}
              clearSwitchTarget={() => setSwitchTargetSub(null)}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesPage
              payTargetInvoice={payTargetInvoice}
              clearPayTarget={() => setPayTargetInvoice(null)}
            />
          )}

          {activeTab === 'payments' && <PaymentsPage />}

          {activeTab === 'taxes-discounts' && role === 'admin' && <TaxesDiscountsPage />}

          {activeTab === 'reports' && ['admin', 'staff'].includes(role) && <ReportsPage />}

          {activeTab === 'assistant' && (
            <BillingAssistantPage
              setActiveTab={setActiveTab}
              onOpenSwitchPlan={handleOpenSwitchPlan}
              onOpenPayInvoice={handleOpenPayInvoice}
            />
          )}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
