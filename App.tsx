
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { analyzeMedicineImage } from './services/geminiService';
import { getMedicines, addMedicine, buyMedicine, getWishlist, toggleWishlist } from './services/storageService';
import { MedicineDetails, AnalysisResult } from './types';

type Role = 'Admin' | 'User' | 'NGO';

interface UserProfile {
  username: string;
  role: Role;
}

interface Order {
  orderId: string;
  medicineName: string;
  status: 'In Progress' | 'Shipped' | 'Delivered';
  date: string;
  imageUrl?: string;
  receiverName: string;
  address: string;
  paymentMethod: string;
}

const LoginPage: React.FC<{ onLogin: (user: UserProfile) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('User');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      onLogin({ username, role });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-200">
      <div className="max-w-md w-full glass-card p-10 rounded-3xl shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-white mb-2">Med-Bridge</h1>
        <p className="text-slate-400 text-center mb-8">Access the Pharmaceutical Portal</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Identity</label>
            <input type="text" placeholder="Username" className="w-full px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500 transition-all" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Role Selection</label>
            <div className="grid grid-cols-3 gap-2">
              {(['User', 'NGO', 'Admin'] as Role[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${role === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Secure Passkey</label>
            <input type="password" placeholder="••••••••" className="w-full px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/10 mt-4">
            {isLoading ? "Authenticating..." : "Login to Portal"}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProductDetailModal: React.FC<{
  item: MedicineDetails & { id: string };
  onClose: () => void;
  onAction: () => void;
  role: Role;
}> = ({ item, onClose, onAction, role }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} onClick={handleClose}>
      <div className={`glass-card max-w-2xl w-full rounded-[40px] overflow-hidden shadow-2xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`} onClick={e => e.stopPropagation()}>
        <div className="relative group aspect-video bg-black">
          <img src={item.imageUrls[activeImage]} className="w-full h-full object-contain" alt={item.medicineName} />
          {item.imageUrls.length > 1 && (
            <>
              <button
                onClick={() => setActiveImage(prev => (prev > 0 ? prev - 1 : item.imageUrls.length - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600"
              >
                ←
              </button>
              <button
                onClick={() => setActiveImage(prev => (prev < item.imageUrls.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600"
              >
                →
              </button>
            </>
          )}
          <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors">✕</button>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">{item.medicineName}</h2>
              <p className="text-indigo-400 font-mono text-xs uppercase tracking-widest">{item.id}</p>
            </div>
            {item.imageUrls.length > 1 && (
              <div className="flex gap-2">
                {item.imageUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${activeImage === i ? 'bg-indigo-500 w-6' : 'bg-slate-700'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Expiry Date</p>
              <p className="text-slate-200 font-bold">{item.expiryDate}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dosage Profile</p>
              <p className="text-slate-200 font-bold">{item.dosage}</p>
            </div>
          </div>

          {role !== 'Admin' && (
            <button
              onClick={() => { onAction(); handleClose(); }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-white transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
            >
              Proceed to {role === 'NGO' ? 'Claim' : 'Purchase'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckoutModal: React.FC<{
  item: MedicineDetails & { id: string };
  onClose: () => void;
  onConfirm: (item: MedicineDetails & { id: string }, details: { receiverName: string, address: string, paymentMethod: string }) => void;
  role: Role;
}> = ({ item, onClose, onConfirm, role }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(role === 'NGO' ? 'Donation Claim' : 'Credit Card');

  const isNGO = role === 'NGO';

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      onConfirm(item, { receiverName, address, paymentMethod });
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} onClick={handleClose}>
      <div className={`glass-card max-w-lg w-full rounded-3xl p-8 shadow-2xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{isNGO ? 'Claim Donation' : 'Purchase Medicine'}</h2>
            <p className="text-slate-400 text-sm mt-1">{item.medicineName}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">✕</button>
        </div>

        <form onSubmit={handleOrder} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Receiver / Organization Name</label>
              <input required type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="e.g. Hope NGO / John Doe" className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Delivery Address</label>
              <textarea required value={address} onChange={e => setAddress(e.target.value)} placeholder="Full shipping coordinates" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white resize-none outline-none focus:border-indigo-500 transition-colors" />
            </div>
            {!isNGO && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500 transition-colors">
                  <option>Credit Card</option>
                  <option>Digital Wallet</option>
                  <option>Cash on Delivery</option>
                </select>
              </div>
            )}
          </div>

          <button type="submit" disabled={isProcessing} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/10">
            {isProcessing ? "Processing..." : isNGO ? "Confirm Claim" : "Confirm Order"}
          </button>
        </form>
      </div>
    </div>
  );
};

const OrderSummaryModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} onClick={handleClose}>
      <div className={`glass-card max-w-lg w-full rounded-[40px] p-10 shadow-2xl border-indigo-500/30 ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`} onClick={e => e.stopPropagation()}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Order Confirmed</h2>
          <p className="text-slate-500 mt-2 font-mono text-sm">{order.orderId}</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
            <img src={order.imageUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" />
            <div>
              <p className="font-bold text-white">{order.medicineName}</p>
              <p className="text-xs text-slate-500">Status: {order.status}</p>
            </div>
          </div>

          <div className="space-y-4 px-2">
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Recipient</p>
              <p className="text-slate-200 font-medium">{order.receiverName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Shipping Address</p>
              <p className="text-slate-300 text-sm leading-relaxed">{order.address}</p>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-4">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Method</p>
                <p className="text-slate-200 text-sm">{order.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Date</p>
                <p className="text-slate-200 text-sm">{order.date}</p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleClose} className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold text-white mt-10 transition-all">Close Details</button>
      </div>
    </div>
  );
};

const WishlistModal: React.FC<{
  items: (MedicineDetails & { id: string })[];
  onClose: () => void;
  onBuy: (item: MedicineDetails & { id: string }) => void;
  onView: (item: MedicineDetails & { id: string }) => void;
  onToggleWish: (id: string) => void;
  role: Role;
}> = ({ items, onClose, onBuy, onView, onToggleWish, role }) => {
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} onClick={handleClose}>
      <div className={`glass-card max-w-4xl w-full h-[80vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`} onClick={e => e.stopPropagation()}>
        <header className="p-8 border-b border-slate-800 bg-slate-900/40">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">My Wishlist</h2>
            <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">✕</button>
          </div>
        </header>
        <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar flex-grow">
          {items.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <div className="mb-4 opacity-20">
                <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              Your wishlist is empty.
            </div>
          ) : items.map(item => (
            <div key={item.id} className="bg-slate-900/50 p-5 rounded-2xl flex items-center gap-6 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0 cursor-pointer" onClick={() => onView(item)}>
                <img src={item.imageUrls[0]} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-grow min-w-0 cursor-pointer" onClick={() => onView(item)}>
                <h4 className="font-bold text-white text-lg truncate">{item.medicineName}</h4>
                <p className="text-xs text-slate-500 mt-1">Exp: {item.expiryDate}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onToggleWish(item.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.657 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                </button>
                {(role === 'NGO' || role === 'User') && (
                  <button onClick={() => onBuy(item)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                    {role === 'NGO' ? 'Claim' : 'Buy'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ListModal: React.FC<{
  items: (MedicineDetails & { id: string })[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onClose: () => void;
  onBuy: (item: MedicineDetails & { id: string }) => void;
  onView: (item: MedicineDetails & { id: string }) => void;
  onDelete: (id: string) => void;
  onToggleWish: (id: string) => void;
  wishlistIds: string[];
  role: Role;
}> = ({ items, searchQuery, onSearchChange, onClose, onBuy, onView, onDelete, onToggleWish, wishlistIds, role }) => {
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} onClick={handleClose}>
      <div className={`glass-card max-w-4xl w-full h-[80vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`} onClick={e => e.stopPropagation()}>
        <header className="p-8 border-b border-slate-800 bg-slate-900/40">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Inventory Browser</h2>
            <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">✕</button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter catalog..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </header>
        <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar flex-grow">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 mb-2">No matching inventory records.</p>
              {searchQuery && <button onClick={() => onSearchChange('')} className="text-indigo-400 text-sm font-bold">Clear Filters</button>}
            </div>
          ) : items.map(item => (
            <div key={item.id} className="bg-slate-900/50 p-5 rounded-2xl flex items-center gap-6 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 shrink-0 cursor-pointer" onClick={() => onView(item)}>
                <img src={item.imageUrls[0]} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-grow min-w-0 cursor-pointer" onClick={() => onView(item)}>
                <h4 className="font-bold text-white text-lg truncate">{item.medicineName}</h4>
                <p className="text-xs text-slate-500 mt-1">Expiry: {item.expiryDate} &bull; Dosage: {item.dosage}</p>
                <p className="text-[10px] text-indigo-400 font-mono mt-1 opacity-50">{item.id}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleWish(item.id)}
                  className={`p-2.5 rounded-xl transition-all border ${wishlistIds.includes(item.id) ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-red-400'}`}
                >
                  <svg className="w-5 h-5" fill={wishlistIds.includes(item.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
                {(role === 'NGO' || role === 'User') && (
                  <button onClick={() => onBuy(item)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                    {role === 'NGO' ? 'Claim' : 'Buy'}
                  </button>
                )}
                {role === 'Admin' && (
                  <button onClick={() => onDelete(item.id)} className="px-6 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-xl font-bold text-sm transition-all">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OrdersModal: React.FC<{
  orders: Order[];
  onClose: () => void;
  onViewOrder: (order: Order) => void;
}> = ({ orders, onClose, onViewOrder }) => {
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} onClick={handleClose}>
      <div className={`glass-card max-w-4xl w-full h-[80vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`} onClick={e => e.stopPropagation()}>
        <header className="p-8 border-b border-slate-800 bg-slate-900/40">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">History & Claims</h2>
            <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">✕</button>
          </div>
        </header>
        <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar flex-grow">
          {orders.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              No active or past records found.
            </div>
          ) : orders.map(order => (
            <div key={order.orderId} onClick={() => onViewOrder(order)} className="bg-slate-900/50 p-5 rounded-2xl flex items-center gap-6 border border-slate-800 transition-all cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900 group">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                <img src={order.imageUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-lg truncate group-hover:text-indigo-400 transition-colors">{order.medicineName}</h4>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                    }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Date: {order.date} &bull; {order.receiverName}</p>
                <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase">Click to view details</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult>({ data: null, error: null, loading: false });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [buyItem, setBuyItem] = useState<(MedicineDetails & { id: string }) | null>(null);
  const [viewItem, setViewItem] = useState<(MedicineDetails & { id: string }) | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stock, setStock] = useState<(MedicineDetails & { id: string })[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStock(getMedicines());
  }, []);

  useEffect(() => {
    if (currentUser) {
      setWishlistIds(getWishlist(currentUser.username));
    }
  }, [currentUser]);

  const filteredStock = useMemo(() => {
    if (!searchQuery.trim()) return stock;
    const query = searchQuery.toLowerCase();
    return stock.filter(item => item.medicineName.toLowerCase().includes(query));
  }, [stock, searchQuery]);

  const wishlistedItems = useMemo(() => {
    return stock.filter(item => wishlistIds.includes(item.id));
  }, [stock, wishlistIds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
        setResult({ data: null, error: null, loading: false });
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (images.length <= 1) {
      setResult({ data: null, error: null, loading: false });
    }
  };

  const handleScan = async () => {
    if (images.length === 0) return;
    setResult({ data: null, error: null, loading: true });
    try {
      const data = await analyzeMedicineImage(images);
      setResult({ data, error: null, loading: false });
    } catch (err: any) {
      setResult({ data: null, error: err.message, loading: false });
    }
  };

  const handleSave = () => {
    if (!result.data || images.length === 0) return;
    setIsSaving(true);
    setTimeout(() => {
      const newItem = {
        ...result.data!,
        id: `MED-${Date.now()}`,
        imageUrls: images
      };
      setStock(addMedicine(newItem));
      setIsSaving(false);
      setIsSaved(true);
      setToast("Medicine published to registry");
      setTimeout(() => setToast(null), 3000);
    }, 1000);
  };

  const handleConfirmOrder = (item: MedicineDetails & { id: string }, details: { receiverName: string, address: string, paymentMethod: string }) => {
    const isNGO = currentUser?.role === 'NGO';
    const newOrder: Order = {
      orderId: `ORD-${Date.now()}`,
      medicineName: item.medicineName,
      status: 'In Progress',
      date: new Date().toLocaleDateString(),
      imageUrl: item.imageUrls[0],
      receiverName: details.receiverName,
      address: details.address,
      paymentMethod: details.paymentMethod
    };
    setOrders(prev => [newOrder, ...prev]);
    setStock(buyMedicine(item.id));
    setBuyItem(null);
    setSelectedOrder(newOrder);
    setToast(isNGO ? "Donation Claimed!" : "Purchase successful!");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id: string) => {
    setStock(buyMedicine(id));
    setToast("Item removed from registry");
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleWish = (id: string) => {
    if (!currentUser) return;
    const updated = toggleWishlist(currentUser.username, id);
    setWishlistIds(updated);
    const exists = updated.includes(id);
    setToast(exists ? "Added to wishlist" : "Removed from wishlist");
    setTimeout(() => setToast(null), 2000);
  };

  if (!currentUser) return <LoginPage onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto flex flex-col">
      {toast && <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl animate-in slide-in-from-top-10 duration-500 border border-white/20">{toast}</div>}

      {showStock && (
        <ListModal
          items={filteredStock}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={() => setShowStock(false)}
          onBuy={setBuyItem}
          onView={setViewItem}
          onDelete={handleDelete}
          onToggleWish={handleToggleWish}
          wishlistIds={wishlistIds}
          role={currentUser.role}
        />
      )}

      {showOrders && <OrdersModal orders={orders} onViewOrder={setSelectedOrder} onClose={() => setShowOrders(false)} />}
      {showWishlist && <WishlistModal items={wishlistedItems} onClose={() => setShowWishlist(false)} onBuy={setBuyItem} onView={setViewItem} onToggleWish={handleToggleWish} role={currentUser.role} />}
      {buyItem && <CheckoutModal item={buyItem} role={currentUser.role} onClose={() => setBuyItem(null)} onConfirm={handleConfirmOrder} />}
      {selectedOrder && <OrderSummaryModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {viewItem && <ProductDetailModal item={viewItem} role={currentUser.role} onClose={() => setViewItem(null)} onAction={() => setBuyItem(viewItem)} />}

      <nav className="glass-card mb-10 p-6 rounded-[32px] flex justify-between items-center shadow-xl border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-white">Med-Bridge</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{currentUser.role} Access</p>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-6 items-center">
          <button onClick={() => setShowStock(true)} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Browse Stock</button>
          {currentUser.role !== 'Admin' && (
            <>
              <button onClick={() => setShowWishlist(true)} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors relative flex items-center gap-1">
                Wishlist
                {wishlistIds.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
              </button>
              <button onClick={() => setShowOrders(true)} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                {currentUser.role === 'NGO' ? 'My Claims' : 'My Orders'}
              </button>
            </>
          )}
          <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
          <button onClick={() => setCurrentUser(null)} className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors">Sign Out</button>
        </div>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Registration Section */}
        {(currentUser.role === 'User' || currentUser.role === 'Admin') && (
          <section className="glass-card p-10 rounded-[48px] shadow-2xl border-slate-700/50">
            <h2 className="text-2xl font-bold mb-2 text-white">Register Medicine</h2>
            <p className="text-slate-500 text-sm mb-8">Scan multiple angles of packaging for best results.</p>
            <input ref={fileInputRef} id="file" type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="aspect-square relative group rounded-2xl overflow-hidden border border-slate-800 bg-black">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {!isSaved && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-900/50 hover:border-indigo-500/50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-2 group-hover:bg-indigo-600 transition-colors">
                      <svg className="w-5 h-5 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{images.length === 0 ? 'Upload Photo' : 'Add More'}</p>
                  </button>
                )}
              </div>

              {images.length > 0 && !result.data && !result.loading && (
                <button onClick={handleScan} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-3xl font-bold text-white text-lg transition-all active:scale-[0.98]">
                  Scan {images.length} {images.length === 1 ? 'Image' : 'Images'}
                </button>
              )}

              {result.loading && (
                <div className="text-center py-10 bg-slate-900/30 rounded-3xl border border-slate-800 animate-pulse">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">AI Analyzing Packaging...</p>
                </div>
              )}

              {result.data && !result.loading && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Product</p>
                      <p className="font-bold text-white truncate">{result.data.medicineName}</p>
                    </div>
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Expiry</p>
                      <p className="font-bold text-white">{result.data.expiryDate}</p>
                    </div>
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 col-span-2">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Dosage</p>
                      <p className="font-bold text-white">{result.data.dosage}</p>
                    </div>
                  </div>
                  {!isSaved ? (
                    <button disabled={isSaving} onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-3xl font-bold text-white text-lg transition-all shadow-xl shadow-emerald-500/10">
                      {isSaving ? "Publishing..." : "Add to Shared Catalog"}
                    </button>
                  ) : (
                    <button onClick={() => { setImages([]); setResult({ data: null, error: null, loading: false }); }} className="w-full bg-slate-800 hover:bg-slate-700 py-5 rounded-3xl font-bold text-white">Scan Next</button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Inventory Overview */}
        <section className={`glass-card p-10 rounded-[48px] shadow-2xl flex flex-col border-slate-700/50 ${currentUser.role === 'NGO' ? 'lg:col-span-2' : ''}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">{currentUser.role === 'NGO' ? 'Donation Feed' : 'Shared Registry'}</h2>
              <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Live Inventory</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search..."
                className="w-full sm:w-48 bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs focus:border-indigo-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className={`space-y-5 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar ${currentUser.role === 'NGO' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0' : ''}`}>
            {filteredStock.length > 0 ? filteredStock.slice(0, 15).map(item => (
              <div key={item.id} className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center gap-5 hover:border-slate-700 transition-all group relative">
                <div
                  className="w-full sm:w-20 sm:h-20 h-40 bg-black rounded-2xl overflow-hidden border border-slate-800 shrink-0 relative cursor-pointer"
                  onClick={() => setViewItem(item)}
                >
                  <img src={item.imageUrls[0]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                  {item.imageUrls.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded-lg text-[8px] font-bold text-white backdrop-blur-sm">
                      +{item.imageUrls.length - 1}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleWish(item.id); }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-10 ${wishlistIds.includes(item.id) ? 'bg-red-500 text-white scale-110' : 'bg-black/50 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill={wishlistIds.includes(item.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>
                <div className="flex-grow min-w-0 w-full cursor-pointer" onClick={() => setViewItem(item)}>
                  <p className="font-bold text-white text-base truncate">{item.medicineName}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">Exp: {item.expiryDate}</p>

                  <div className="mt-4 flex gap-2">
                    {currentUser.role === 'Admin' ? (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="w-full sm:w-auto px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/20">Delete</button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setBuyItem(item); }} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/10">
                        {currentUser.role === 'NGO' ? 'Claim' : 'Purchase'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 lg:col-span-3">
                <p className="text-slate-700 font-bold uppercase tracking-widest text-[10px]">Registry Empty</p>
                {searchQuery && <button onClick={() => setSearchQuery('')} className="text-indigo-400 text-[10px] font-bold mt-2 uppercase underline">Clear Search</button>}
              </div>
            )}
          </div>

          {filteredStock.length > 15 && (
            <button onClick={() => setShowStock(true)} className="mt-8 text-xs font-bold text-indigo-400 underline decoration-indigo-500/30 text-center w-full uppercase tracking-widest">Access Full Catalog</button>
          )}
        </section>
      </div>

      <footer className="mt-auto py-10 text-center space-y-2">
        <p className="text-slate-700 text-[10px] font-bold uppercase tracking-[0.5em] opacity-40">Secure Pharmaceutical Bridge &bull; Unified Medical Logistics</p>
        <a href="https://ai.studio/apps/drive/1PT8D1wyt0ozCiW0XZIr9-WNXOuJVrNhM" target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] font-bold text-indigo-500/50 hover:text-indigo-500 transition-colors uppercase tracking-widest">
          View in AI Studio
        </a>
      </footer>
    </div>
  );
};

export default App;
