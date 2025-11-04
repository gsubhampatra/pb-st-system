import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_PATHS } from "../../api";
import { useToast } from "../../contexts/ToastContext";
import Button from "../ui/Button";
import { FiDatabase, FiTrash2, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";

const DatabasePage = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");



  // Clear database mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(API_PATHS.database.clear);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast("Database cleared successfully", "success");
      setShowClearConfirm(false);
      setConfirmText("");
      refetch();
    },
    onError: (error) => {
      showToast(
        error.response?.data?.message || "Failed to clear database",
        "error"
      );
    },
  });

  // Reset database mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(API_PATHS.database.reset);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast("Database reset successfully with seed data", "success");
      setShowResetConfirm(false);
      setConfirmText("");
      refetch();
    },
    onError: (error) => {
      showToast(
        error.response?.data?.message || "Failed to reset database",
        "error"
      );
    },
  });

  const handleClearDatabase = () => {
    if (confirmText === "DELETE ALL DATA") {
      clearMutation.mutate();
    } else {
      showToast("Please type the confirmation text correctly", "error");
    }
  };

  const handleResetDatabase = () => {
    if (confirmText === "RESET DATABASE") {
      resetMutation.mutate();
    } else {
      showToast("Please type the confirmation text correctly", "error");
    }
  };




  return (
    <div className="p-6 max-w-6xl mx-auto">


      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-md border-2 border-red-200">
        <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center gap-3">
          <FiAlertTriangle className="text-2xl text-red-600" />
          <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Reset Database */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiRefreshCw className="text-blue-600" />
                  Reset Database
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Clear all data and seed default units (kg, bag, quintal, ton, pcs)
                </p>
              </div>
              <Button
                onClick={() => setShowResetConfirm(!showResetConfirm)}
                variant="secondary"
                size="sm"
              >
                Reset
              </Button>
            </div>

            {showResetConfirm && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 mb-3">
                  <strong>Warning:</strong> This will delete all data and seed
                  default units. Type <code className="bg-yellow-100 px-2 py-1 rounded">RESET DATABASE</code> to
                  confirm.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type: RESET DATABASE"
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetDatabase}
                    variant="primary"
                    size="sm"
                    loading={resetMutation.isPending}
                    disabled={confirmText !== "RESET DATABASE"}
                  >
                    Confirm Reset
                  </Button>
                  <Button
                    onClick={() => {
                      setShowResetConfirm(false);
                      setConfirmText("");
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Clear Database */}
          <div className="border border-red-300 rounded-lg p-4 bg-red-50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                  <FiTrash2 className="text-red-600" />
                  Clear All Data
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  <strong>Irreversible action!</strong> Permanently delete all
                  database records.
                </p>
              </div>
              <Button
                onClick={() => setShowClearConfirm(!showClearConfirm)}
                variant="danger"
                size="sm"
              >
                Clear All
              </Button>
            </div>

            {showClearConfirm && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded">
                <p className="text-sm text-red-900 mb-3">
                  <strong>⚠️ DANGER:</strong> This action cannot be undone! All
                  data will be permanently deleted. Type{" "}
                  <code className="bg-red-200 px-2 py-1 rounded font-bold">
                    DELETE ALL DATA
                  </code>{" "}
                  to confirm.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type: DELETE ALL DATA"
                  className="w-full px-3 py-2 border border-red-400 rounded-md mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleClearDatabase}
                    variant="danger"
                    size="sm"
                    loading={clearMutation.isPending}
                    disabled={confirmText !== "DELETE ALL DATA"}
                  >
                    Permanently Delete All Data
                  </Button>
                  <Button
                    onClick={() => {
                      setShowClearConfirm(false);
                      setConfirmText("");
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 ${colorClasses[color] || colorClasses.blue
        }`}
    >
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  );
};

export default DatabasePage;
