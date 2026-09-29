import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  HiOutlineSquares2X2,
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlineTruck,
  HiOutlineArchiveBox,
  HiOutlineChartBarSquare,
  HiOutlineCreditCard,
  HiOutlineMapPin,
} from "react-icons/hi2";

const navItems = [
  { label: "Dashboard", path: "/seller", icon: HiOutlineSquares2X2 },
  { label: "Products", path: "/seller/products", icon: HiOutlineCube },
  { label: "Stock", path: "/seller/inventory", icon: HiOutlineArchiveBox },
  { label: "Orders", path: "/seller/orders", icon: HiOutlineTruck },
  { label: "Returns", path: "/seller/returns", icon: HiOutlineArchiveBox },
  { label: "Track Orders", path: "/seller/tracking", icon: HiOutlineMapPin },
  {
    label: "Sales Reports",
    path: "/seller/analytics",
    icon: HiOutlineChartBarSquare,
  },
  {
    label: "Money Request",
    path: "/seller/withdrawals",
    icon: HiOutlineCurrencyDollar,
  },
  {
    label: "Payment History",
    path: "/seller/transactions",
    icon: HiOutlineCreditCard,
  },
  {
    label: "Earnings",
    path: "/seller/earnings",
    icon: HiOutlineCurrencyDollar,
  },
  { label: "Profile", path: "/seller/profile", icon: HiOutlineUser },
];

const Explore = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] bg-slate-50 pb-24 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="bg-white px-4 py-6 border-b border-gray-100 shadow-sm sticky top-0 z-40">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Explore Tools</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Access all seller features quickly</p>
            </div>

            <div className="p-4 grid grid-cols-3 gap-3">
                {navItems.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(item.path)}
                        className="w-full bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm active:scale-[0.98] transition-all hover:border-primary/30 hover:shadow-md"
                    >
                        <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                            <item.icon className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Explore;
