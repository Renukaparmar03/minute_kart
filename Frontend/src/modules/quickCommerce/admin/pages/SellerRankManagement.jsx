import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { Save, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

const SellerRankManagement = () => {
    const [sellers, setSellers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (categories.length > 0) {
            fetchSellers();
        }
    }, [selectedCategoryId, categories]);

    const fetchCategories = async () => {
        try {
            const res = await adminApi.getCategories({ limit: 100 });
            if (res.data?.success) {
                const cats = res.data.results || res.data.result?.items || [];
                // Only take header level categories or all main categories
                setCategories(cats.filter(c => c.type === 'header' || c.level === 0 || !c.parentId));
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchSellers = async () => {
        setIsLoading(true);
        try {
            const res = await adminApi.getSellersRank({ categoryId: selectedCategoryId || undefined });
            if (res.data?.success) {
                let fetchedSellers = res.data.result || [];
                fetchedSellers.sort((a, b) => {
                    const rankA = a.rank ?? 999;
                    const rankB = b.rank ?? 999;
                    return rankA - rankB;
                });
                fetchedSellers = fetchedSellers.map((s, idx) => ({ ...s, rank: idx + 1 }));
                setSellers(fetchedSellers);
            }
        } catch (error) {
            console.error("Failed to fetch sellers rank:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newSellers = [...sellers];
        const temp = newSellers[index];
        newSellers[index] = newSellers[index - 1];
        newSellers[index - 1] = temp;
        newSellers.forEach((s, idx) => s.rank = idx + 1);
        setSellers(newSellers);
    };

    const handleMoveDown = (index) => {
        if (index === sellers.length - 1) return;
        const newSellers = [...sellers];
        const temp = newSellers[index];
        newSellers[index] = newSellers[index + 1];
        newSellers[index + 1] = temp;
        newSellers.forEach((s, idx) => s.rank = idx + 1);
        setSellers(newSellers);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                sellers: sellers.map(s => ({ _id: s._id, rank: s.rank })),
                categoryId: selectedCategoryId || undefined
            };
            await adminApi.updateSellersRank(payload);
            alert('Seller ranks updated successfully');
        } catch (error) {
            console.error("Failed to update ranks:", error);
            alert('Failed to update seller ranks');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Seller Rank Management</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Select a category to arrange the sellers (Pick up points) for that category.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-[#0c831f]"
                    >
                        <option value="">Global (Default) Rank</option>
                        {categories.map(cat => (
                            <option key={cat.id || cat._id} value={cat.id || cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-[#0c831f] text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-[#0a6b19] transition-all disabled:opacity-50 min-w-[140px] justify-center"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Ranks
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-[#0c831f]" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-[80px_1fr_120px_120px] gap-4 p-4 bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800 font-semibold text-sm text-slate-600 dark:text-slate-300">
                            <div className="text-center">Rank</div>
                            <div>Seller Name</div>
                            <div className="text-center">Status</div>
                            <div className="text-center">Reorder</div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {sellers.map((seller, index) => (
                                <div key={seller._id} className="grid grid-cols-[80px_1fr_120px_120px] gap-4 p-4 items-center bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <div className="text-center font-bold text-lg text-[#0c831f]">
                                        {seller.rank || index + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-slate-200">{seller.shopName || seller.name}</div>
                                        <div className="text-xs text-slate-500">{seller.name}</div>
                                    </div>
                                    <div className="text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${seller.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {seller.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ArrowUp className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === sellers.length - 1}
                                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ArrowDown className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {sellers.length === 0 && (
                                <div className="p-12 text-center text-slate-500 font-medium">
                                    No sellers found {selectedCategoryId ? 'for this category' : ''}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SellerRankManagement;
