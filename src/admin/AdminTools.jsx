import React from 'react';
import { Button } from 'primereact/button';

const AdminTools = () => {
  const handleLogout = () => {
    localStorage.clear();
    // bisa redirect ke halaman login
    window.location.href = '/';
  };

  return (
    <div className="p-4">
      <div>ini admin bang</div>
      <Button
        label="Logout"
        onClick={handleLogout}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      />
    </div>
  );
};

export default AdminTools;
