import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { format } from 'date-fns';
import { FaPrint } from 'react-icons/fa';
import SearchableSelect from '../purchase/ui/SearchableSelect';
import debounce from 'lodash.debounce';

// Step components
import Step1Customer from './Step1Customer';
import Step2Items from './Step2Items';
import Step3Summary from './Step3Summary';

function SalesForm() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saleItems, setSaleItems] = useState([]); // Array of { itemId, quantity, unitPrice, totalPrice, ... }
  const [status, setStatus] = useState('recorded'); // Default status
  const [receivedAmount, setReceivedAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  // --- Calculate Total Amount ---
  useEffect(() => {
    const total = saleItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setTotalAmount(total);
  }, [saleItems]);

  // --- Navigation ---
  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // --- Step 1 Handler ---
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };
  
  // --- Step 2 Handlers ---
  const handleAddItem = (newItem) => {
    // Always add new item, even if same item ID is already present
    setSaleItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (itemKey) => { // Use the unique key passed from Step 2
    setSaleItems((prev) => prev.filter((item, index) => (item.tempKey || item.itemId + index) !== itemKey));
  };

  // --- Step 3 Handlers ---
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    // If changing status *to* 'paid', auto-fill receivedAmount with totalAmount
    if (newStatus === 'paid') {
      setReceivedAmount(totalAmount.toFixed(2));
    }
  };

  const handleReceivedAmountChange = (amount) => {
    setReceivedAmount(amount);
  };

  // --- Sale Creation Mutation ---
  const { mutate: createSale, isLoading: isSubmitting, error: submitError, isSuccess, reset } = useMutation({
    mutationFn: (saleData) => api.post(API_PATHS.sales.create, saleData),
    onSuccess: (data, variables) => { // data = created sale, variables = submitted data
      console.log('Sale created successfully:', data);
      alert('Sale created successfully!');
      queryClient.invalidateQueries(['sales']); // Invalidate sale list cache
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
      setSelectedCustomer(null);
      setSaleItems([]);
      setStatus('recorded');
      setReceivedAmount('');
      setTotalAmount(0);
      reset(); // Reset mutation state
    },
    onError: (error) => {
      console.error("Error creating sale:", error);
      // Error is displayed in Step3Summary
    }
  });

  const handleSubmit = (shouldPrint = false) => {
    // --- Validation before submitting ---
    if (!selectedCustomer) {
      alert('Please select a customer.');
      setCurrentStep(1);
      return;
    }
    if (saleItems.length === 0) {
      alert('Please add items to the sale.');
      setCurrentStep(2);
      return;
    }

    // Prepare sale data
    const saleData = {
      customerId: selectedCustomer.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      items: saleItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      receivedAmount: receivedAmount ? parseFloat(receivedAmount) : 0,
      status: status,
      shouldPrint: shouldPrint // Pass print flag to onSuccess handler via variables
    };

    console.log("Submitting Sale Data:", saleData);
    createSale(saleData);
  };

  // --- Render Current Step ---
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Customer
            onCustomerSelect={handleCustomerSelect}
            onGoToNext={nextStep}
            currentCustomer={selectedCustomer}
          />
        );
      case 2:
        return (
          <Step2Items
            saleItems={saleItems}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onGoToPrev={prevStep}
            onGoToNext={nextStep}
          />
        );
      case 3:
        return (
          <Step3Summary
            selectedCustomer={selectedCustomer}
            saleItems={saleItems}
            status={status}
            receivedAmount={receivedAmount}
            totalAmount={totalAmount}
            onStatusChange={handleStatusChange}
            onReceivedAmountChange={handleReceivedAmountChange}
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

export default SalesForm;