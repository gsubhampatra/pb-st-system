import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SalesTable from './SalesTable';
import SalesForm from './SalesForm';

function SalesPage() {
  return (
    <Routes>
      <Route path="/" element={<SalesTable />} />
      <Route path="/new" element={<SalesForm />} />
      <Route path="/edit/:id" element={<SalesForm />} />
      <Route path="*" element={<Navigate to="/sales" replace />} />
    </Routes>
  );
}

export default SalesPage;