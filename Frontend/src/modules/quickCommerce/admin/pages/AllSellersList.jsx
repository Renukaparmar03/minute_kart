import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const AllSellersList = () => {
    const [sellers, setSellers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        setIsLoading(true);
        try {
            const res = await adminApi.getAllSellers();
            if (res.data?.success) {
                setSellers(res.data.results || []);
            }
        } catch (error) {
            console.error("Failed to fetch all sellers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSellers = sellers.filter(seller => 
        seller.approvalStatus === 'approved' && (
        (seller.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seller.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seller.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seller.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">All Sellers</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        View and manage all sellers registered on the platform.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search sellers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full md:w-64 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-[#0c831f] transition-all"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800 text-sm text-slate-600 dark:text-slate-300">
                                <th className="px-6 py-4 font-semibold">Shop Info</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#0c831f] mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredSellers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No sellers found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredSellers.map((seller) => (
                                    <tr key={seller._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                                                    {(seller.shopName || seller.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {seller.shopName || seller.name || 'Unnamed Shop'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        {seller.isVerified ? (
                                                            <span className="flex items-center text-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>
                                                        ) : (
                                                            <span className="flex items-center text-rose-500"><XCircle className="w-3 h-3 mr-1" /> Unverified</span>
                                                        )}
                                                        {seller.fcId && <span className="ml-2 text-slate-400">ID: {seller.fcId}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{seller.name}</div>
                                            <div className="text-xs text-slate-500">{seller.phone}</div>
                                            {seller.email && <div className="text-xs text-slate-500">{seller.email}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${seller.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {seller.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    seller.approvalStatus === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                    seller.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {seller.approvalStatus || 'pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                                {seller.createdAt ? format(new Date(seller.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllSellersList;
