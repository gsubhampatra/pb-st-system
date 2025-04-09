// src/components/purchase/PurchaseForm.jsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
    // Prevent adding duplicate item IDs (or update quantity if desired)
    const existingIndex = purchaseItems.findIndex(item => item.itemId === newItem.itemId);
    if (existingIndex > -1) {
        // Example: Update existing item quantity/price (more complex)
        // alert(`${newItem.itemName} is already added. Remove it first to re-add.`);
        // Or update logic:
         const updatedItems = [...purchaseItems];
         updatedItems[existingIndex] = {
             ...updatedItems[existingIndex],
             quantity: updatedItems[existingIndex].quantity + newItem.quantity,
             totalPrice: updatedItems[existingIndex].totalPrice + newItem.totalPrice,
             // Decide if unit price should be averaged or use the latest - using latest here
             unitPrice: newItem.unitPrice,
         };
        setPurchaseItems(updatedItems);
    } else {
        setPurchaseItems((prev) => [...prev, newItem]);
    }
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

  // --- Stepper UI (Optional) ---
  const steps = [
      { id: 1, name: 'Supplier' },
      { id: 2, name: 'Items' },
      { id: 3, name: 'Summary' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 bg-gray-100 rounded-lg shadow-md">
       <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Create New Purchase</h1>

       {/* Stepper Visualization */}
        <nav aria-label="Progress" className="mb-8">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                    {step.id < currentStep ? (
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-indigo-600" />
                        </div>
                        <button
                         onClick={() => setCurrentStep(step.id)} // Allow clicking back
                         className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-900"
                        >
                         <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                           <span className="absolute -bottom-6 text-xs font-medium text-indigo-600">{step.name}</span>
                        </button>
                    </>
                    ) : step.id === currentStep ? (
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-gray-200" />
                        </div>
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white" aria-current="step">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                         <span className="absolute -bottom-6 text-xs font-medium text-indigo-600">{step.name}</span>
                        </div>
                    </>
                    ) : (
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-gray-200" />
                        </div>
                        <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" aria-hidden="true" />
                         <span className="absolute -bottom-6 text-xs font-medium text-gray-500">{step.name}</span>
                        </div>
                    </>
                    )}
                </li>
                ))}
            </ol>
        </nav>


       {/* Render the active step */}
       <div className="mt-8">
         {renderStep()}
       </div>
    </div>
  );
}

export default PurchaseForm;