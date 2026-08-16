import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LogServiceModal from './components/LogServiceModal';
import AddEquipmentModal from './components/AddEquipmentModal';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Nurse / Clinical Staff Pages
import ClinicalDashboard from './pages/ClinicalDashboard';
import ServiceStation from './pages/ServiceStation';
import EquipmentHealthAssessment from './pages/EquipmentHealthAssessment';
import HospitalEquipmentInventory from './pages/HospitalEquipmentInventory';
import ServiceHistoryInventory from './pages/ServiceHistoryInventory';
import EquipmentServiceDetail from './pages/EquipmentServiceDetail';

// Hospital Administrator Pages
import AdministratorDashboard from './pages/admin/AdministratorDashboard';
import AdminEquipmentOverview from './pages/admin/AdminEquipmentOverview';
import AdminServiceRecordsHistory from './pages/admin/AdminServiceRecordsHistory';
import AdminRecallMonitoring from './pages/admin/AdminRecallMonitoring';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogServiceOpen, setIsLogServiceOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedAdminDetail, setSelectedAdminDetail] = useState(null);

  // We map backend roles to our frontend view states
  // Assuming HOSPITAL_ADMIN is admin, and others are clinical
  const viewRole = user?.role === 'HOSPITAL_ADMIN' ? 'admin' : 'nurse';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleViewAdminDetail = (record) => {
    setSelectedAdminDetail(record);
    setActiveTab('service-detail');
  };

  const handleSaveService = (data) => {
    showToast(`Service log recorded for ${data.assetId} (${data.serviceType})`);
  };

  const handleAddEquipment = (equipment) => {
    showToast(`New asset ${equipment.id} (${equipment.name}) added to inventory!`);
  };

  const renderActivePage = () => {
    if (viewRole === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdministratorDashboard onNavigate={(tab) => setActiveTab(tab)} searchQuery={searchQuery} />;
        case 'equipment-overview':
          return <AdminEquipmentOverview searchQuery={searchQuery} />;
        case 'service-history':
          return (
            <AdminServiceRecordsHistory
              onNavigate={(tab) => setActiveTab(tab)}
              searchQuery={searchQuery}
              onViewDetail={handleViewAdminDetail}
            />
          );
        case 'service-detail':
          return (
            <EquipmentServiceDetail
              onNavigate={(tab) => setActiveTab(tab)}
              selectedRecord={selectedAdminDetail}
            />
          );
        case 'recall-monitoring':
          return <AdminRecallMonitoring />;
        default:
          return <AdministratorDashboard onNavigate={(tab) => setActiveTab(tab)} searchQuery={searchQuery} />;
      }
    }

    // Clinical / Engineer Role
    switch (activeTab) {
      case 'dashboard':
        return <ClinicalDashboard onNavigate={(tab) => setActiveTab(tab)} searchQuery={searchQuery} currentUserRole={viewRole} />;
      case 'service-station':
      case 'equipment':
        return <ServiceStation onNavigate={(tab) => setActiveTab(tab)} searchQuery={searchQuery} currentUserRole={viewRole} />;
      case 'health-assessment':
        return <EquipmentHealthAssessment onNavigate={(tab) => setActiveTab(tab)} currentUserRole={viewRole} />;
      case 'hospital-inventory':
        return (
          <HospitalEquipmentInventory
            onNavigate={(tab) => setActiveTab(tab)}
            onAddClick={() => setIsAddEquipmentOpen(true)}
            searchQuery={searchQuery}
            currentUserRole={viewRole}
          />
        );
      case 'service-history':
        return (
          <ServiceHistoryInventory
            onNavigate={(tab) => setActiveTab(tab)}
            searchQuery={searchQuery}
          />
        );
      case 'service-detail':
        return (
          <EquipmentServiceDetail
            onNavigate={(tab) => setActiveTab(tab)}
            onLogServiceClick={() => setIsLogServiceOpen(true)}
          />
        );
      default:
        return <ClinicalDashboard onNavigate={(tab) => setActiveTab(tab)} searchQuery={searchQuery} currentUserRole={viewRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={viewRole} />

      {/* Main Container */}
      <div className="pl-72 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userRole={viewRole}
        // setUserRole prop is intentionally ignored or can be removed in Header.jsx 
        // because role is now strictly from the backend user object
        />

        {/* Page Content */}
        <main className="pt-16 flex-1 bg-background">
          {renderActivePage()}
        </main>
      </div>

      {/* Modals */}
      <LogServiceModal
        isOpen={isLogServiceOpen}
        onClose={() => setIsLogServiceOpen(false)}
        onSave={handleSaveService}
      />

      <AddEquipmentModal
        isOpen={isAddEquipmentOpen}
        onClose={() => setIsAddEquipmentOpen(false)}
        onAdd={handleAddEquipment}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-white/20 animate-in slide-in-from-bottom-4 duration-300">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
