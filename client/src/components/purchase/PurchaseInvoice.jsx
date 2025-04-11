import PurchaseDetail from './PurchaseDetail';
import { useParams, useNavigate } from 'react-router-dom';

const PurchaseInvoice = () => {
    const { purchaseId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col justify-center max-h-screen  items-center space-y-4  md:space-x-4">
                <PurchaseDetail purchaseId={purchaseId} />
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full w-full md:w-auto"
                onClick={() => navigate('/purchases/new')}
            >
                Create New Purchase
            </button>
        </div>
    );
};

export default PurchaseInvoice;

