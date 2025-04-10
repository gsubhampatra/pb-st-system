// src/features/purchase/PurchaseForm.jsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Step1Supplier from './Step1Supplier';
import Step2Items from './Step2Items';
import Step3Summary from './Step3Summary';
import { api, API_PATHS } from '../../api';

function PurchaseForm() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [purchaseItems, setPurchaseItems] = useState([]); // Array of { itemId, quantity, unitPrice, totalPrice, ... }
  const [status, setStatus] = useState('recorded'); // Default status
  const [paidAmount, setPaidAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  // --- Calculate Total Amount ---
  useEffect(() => {
    const total = purchaseItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setTotalAmount(total);
  }, [purchaseItems]);

  // --- Navigation ---
  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // --- Step 1 Handler ---
  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    // Optional: Automatically move to next step if needed
    // nextStep();
  };
  // --- Step 2 Handlers ---
  const handleAddItem = (newItem) => {
    // Always add new item, even if same item ID is already present
    setPurchaseItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (itemKey) => { // Use the unique key passed from Step 2
    setPurchaseItems((prev) => prev.filter((item, index) => (item.tempKey || item.itemId + index) !== itemKey));
  };

  // --- Step 3 Handlers ---
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    // If changing status *to* 'paid', auto-fill paidAmount with totalAmount
    if (newStatus === 'paid') {
      setPaidAmount(totalAmount.toFixed(2));
    } else {
      // Optionally clear or keep paid amount if switching away from 'paid'
      // setPaidAmount('');
    }
  };



  const handlePaidAmountChange = (amount) => {
    setPaidAmount(amount);
  };

  // --- Purchase Creation Mutation ---
  const { mutate: createPurchase, isLoading: isSubmitting, error: submitError, isSuccess, reset } = useMutation({
    mutationFn: (purchaseData) => api.post(API_PATHS.purchases.create, purchaseData),
    onSuccess: (data, variables) => { // data = created purchase, variables = submitted data
      console.log('Purchase created successfully:', data);
      alert('Purchase created successfully!');
      queryClient.invalidateQueries(['purchases']); // Invalidate purchase list cache
      queryClient.invalidateQueries(['items']); // Invalidate items cache (stock changed)
      queryClient.invalidateQueries(['stockTransactions']); // Invalidate stock transactions

      // Handle print action
      if (variables.shouldPrint) {
        // Give a slight delay for UI updates if needed, then print
        setTimeout(() => {
          console.log("Triggering print...");
          window.print(); // Or trigger specific print logic
        }, 100);
      }

      // Reset form state
      setCurrentStep(1);
      setSelectedSupplier(null);
      setPurchaseItems([]);
      setStatus('recorded');
      setPaidAmount('');
      setTotalAmount(0);
      reset(); // Reset mutation state

    },
    onError: (error) => {
      console.error("Error creating purchase:", error);
      // Error is displayed in Step3Summary
    }
  });



  const handleSubmit = (shouldPrint = false) => {
    // --- Validation before submitting ---
    if (!selectedSupplier) {
      alert('Please select a supplier.');
      setCurrentStep(1);
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Please add items to the purchase.');
      setCurrentStep(2);
      return;
    }
    if (status === 'paid' && parseFloat(paidAmount || 0) !== totalAmount) {
      if (!window.confirm(`Status is 'Paid', but the Paid Amount (${paidAmount || 0}) doesn't match the Total Amount (${totalAmount.toFixed(2)}). Proceed anyway?`)) {
        return;
      }
    }
    if (status === 'paid' && (paidAmount === '' || isNaN(parseFloat(paidAmount)))) {
      alert("Status is 'Paid'. Please enter a valid Paid Amount.");
      return;
    }


    const purchaseData = {
      supplierId: selectedSupplier.id,
      date: new Date().toISOString(), // Use current date/time, or add a date picker
      items: purchaseItems.map(item => ({ // Format for backend
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalAmount: totalAmount,
      paidAmount: parseFloat(paidAmount || 0), // Ensure it's a number, default to 0
      status: status,
      shouldPrint: shouldPrint // Pass print flag to onSuccess handler via variables
    };

    console.log("Submitting Purchase Data:", purchaseData);
    createPurchase(purchaseData);
  };


  // --- Render Current Step ---
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Supplier
            onSupplierSelect={handleSupplierSelect}
            onGoToNext={nextStep}
            currentSupplier={selectedSupplier}
          />
        );
      case 2:
        return (
          <Step2Items
            purchaseItems={purchaseItems}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onGoToPrev={prevStep}
            onGoToNext={nextStep}
          />
        );
      case 3:
        return (
          <Step3Summary
            selectedSupplier={selectedSupplier}
            purchaseItems={purchaseItems}
            status={status}
            paidAmount={paidAmount}
            totalAmount={totalAmount}
            onStatusChange={handleStatusChange}
            onPaidAmountChange={handlePaidAmountChange}
            onSubmit={handleSubmit}
            onGoToPrev={prevStep}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        );
      default:
        return <div>Invalid Step</div>;
    }
  };



  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 bg-gray-100 rounded-lg shadow-md">

      {/* Render the active step */}
      <div className="mt-8">
        {renderStep()}
      </div>
    </div>
  );
}

export default PurchaseForm;