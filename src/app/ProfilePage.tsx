import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, Loader2, Save, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [loading, setLoading] = useState(true);

  // Profile State
  const [profile, setProfile] = useState({ name: '', phone: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', pincode: '', is_default: false
  });

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user) return;
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile({
          name: profileData.name || '',
          phone: profileData.phone || '',
          email: profileData.email || user.email || ''
        });
      } else {
        setProfile({ ...profile, email: user.email || '' });
      }

      // Fetch Addresses
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (addressData) setAddresses(addressData);

      // Fetch Orders
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(quantity, price_at_purchase, products(name, images))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (orderData) setOrders(orderData);

    } catch (err) {
      console.error("Failed to fetch profile data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, name: profile.name, phone: profile.phone, email: profile.email });
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({ user_id: user.id, ...newAddress })
        .select()
        .single();
      
      if (error) throw error;
      setAddresses([data, ...addresses]);
      setShowAddressForm(false);
      setNewAddress({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save address.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message?.includes('foreign key') ? "Cannot delete this address as it is associated with a past order." : "Failed to delete address.");
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[#fff5f8]/50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <h1 className="text-4xl font-bold text-[#FF2D74] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          My Account
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#FFD1E3]">
              <nav className="flex flex-col space-y-2">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'profile' ? 'bg-[#FF2D74] text-white' : 'text-[#B3184F] hover:bg-[#FFD1E3]/30'}`}
                >
                  <User size={20} /> Personal Info
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'orders' ? 'bg-[#FF2D74] text-white' : 'text-[#B3184F] hover:bg-[#FFD1E3]/30'}`}
                >
                  <Package size={20} /> My Orders
                </button>
                <button 
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'addresses' ? 'bg-[#FF2D74] text-white' : 'text-[#B3184F] hover:bg-[#FFD1E3]/30'}`}
                >
                  <MapPin size={20} /> Saved Addresses
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#FFD1E3] min-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-[#FF2D74]" size={40} />
              </div>
            ) : (
              <>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold text-[#FF2D74] mb-6 border-b border-[#FFD1E3] pb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Personal Information</h2>
                    <form onSubmit={handleProfileSave} className="max-w-md space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Full Name</label>
                        <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] outline-none text-[#2a1e12]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Phone Number</label>
                        <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full p-3 bg-[#fff5f8]/50 border border-[#FFD1E3] rounded-xl focus:ring-2 focus:ring-[#FF2D74] outline-none text-[#2a1e12]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Email (Read-only)</label>
                        <input type="email" value={profile.email} readOnly disabled className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                      </div>
                      <button type="submit" disabled={savingProfile} className="mt-4 px-8 py-3 bg-[#FF2D74] text-white font-bold rounded-xl hover:bg-[#D41E5C] transition-colors shadow-lg shadow-[#FF2D74]/20">
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div>
                    <h2 className="text-2xl font-bold text-[#FF2D74] mb-6 border-b border-[#FFD1E3] pb-4" style={{ fontFamily: "'Playfair Display', serif" }}>My Orders</h2>
                    {orders.length === 0 ? (
                      <div className="text-center py-10">
                        <Package size={48} className="text-[#FFD1E3] mx-auto mb-4" />
                        <p className="text-[#B3184F] font-semibold">No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {orders.map(order => (
                          <div key={order.id} className="border border-[#FFD1E3] rounded-2xl p-6 bg-[#fff5f8]/30">
                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 pb-4 border-b border-[#FFD1E3]">
                              <div>
                                <p className="text-xs text-[#B3184F] font-bold uppercase tracking-wider">Order ID</p>
                                <p className="text-sm font-mono text-gray-700">{order.id.split('-')[0].toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#B3184F] font-bold uppercase tracking-wider">Date</p>
                                <p className="text-sm text-gray-700">{new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#B3184F] font-bold uppercase tracking-wider">Total</p>
                                <p className="text-sm font-bold text-[#FF2D74]">₹{(order.total_amount / 100).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#B3184F] font-bold uppercase tracking-wider">Order Status</p>
                                <div className="flex flex-col gap-1 mt-1">
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize text-center ${
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {order.status}
                                  </span>
                                  {order.tracking_status && (
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase text-center bg-blue-50 text-blue-600 border border-blue-100">
                                      {order.tracking_status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              {order.order_items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-4 items-center">
                                  <div className="w-16 h-16 rounded-lg bg-white border border-[#FFD1E3] overflow-hidden">
                                    <img src={item.products?.images?.[0] || 'https://via.placeholder.com/64'} alt={item.products?.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-[#B3184F]">{item.products?.name}</p>
                                    <p className="text-xs text-[#D41E5C]">Qty: {item.quantity}</p>
                                  </div>
                                  <div className="font-bold text-[#FF2D74]">
                                    ₹{(item.price_at_purchase / 100).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div>
                    <div className="flex justify-between items-center mb-6 border-b border-[#FFD1E3] pb-4">
                      <h2 className="text-2xl font-bold text-[#FF2D74]" style={{ fontFamily: "'Playfair Display', serif" }}>Saved Addresses</h2>
                      <button onClick={() => setShowAddressForm(!showAddressForm)} className="flex items-center gap-1 text-sm font-bold text-[#FF2D74] hover:text-[#D41E5C]">
                        <Plus size={16} /> Add New
                      </button>
                    </div>

                    {showAddressForm && (
                      <form onSubmit={handleSaveAddress} className="bg-[#fff5f8] p-6 rounded-2xl mb-8 border border-[#FFD1E3]">
                        <h3 className="font-bold text-[#B3184F] mb-4">Add a new address</h3>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div><label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Full Name</label><input required type="text" value={newAddress.full_name} onChange={e => setNewAddress({...newAddress, full_name: e.target.value})} className="w-full p-2 bg-white border border-[#FFD1E3] rounded-lg focus:ring-2 focus:ring-[#FF2D74] outline-none" /></div>
                          <div><label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Phone</label><input required type="tel" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="w-full p-2 bg-white border border-[#FFD1E3] rounded-lg focus:ring-2 focus:ring-[#FF2D74] outline-none" /></div>
                        </div>
                        <div className="mb-4"><label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Address Line 1</label><input required type="text" value={newAddress.address_line1} onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} className="w-full p-2 bg-white border border-[#FFD1E3] rounded-lg focus:ring-2 focus:ring-[#FF2D74] outline-none" /></div>
                        <div className="mb-4"><label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">Address Line 2 (Optional)</label><input type="text" value={newAddress.address_line2} onChange={e => setNewAddress({...newAddress, address_line2: e.target.value})} className="w-full p-2 bg-white border border-[#FFD1E3] rounded-lg focus:ring-2 focus:ring-[#FF2D74] outline-none" /></div>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div><label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">City</label><input required type="text" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full p-2 bg-white border border-[#FFD1E3] rounded-lg focus:ring-2 focus:ring-[#FF2D74] outline-none" /></div>
                          <div><label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">State</label><input required type="text" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full p-2 bg-white border border-[#FFD1E3] rounded-lg focus:ring-2 focus:ring-[#FF2D74] outline-none" /></div>
                          <div><label className="block text-xs font-bold text-[#B3184F] uppercase tracking-wider mb-1">PIN</label><input required type="text" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} className="w-full p-2 bg-white border border-[#FFD1E3] rounded-lg focus:ring-2 focus:ring-[#FF2D74] outline-none" /></div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setShowAddressForm(false)} className="px-4 py-2 font-bold text-[#B3184F] hover:text-[#FF2D74]">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-[#FF2D74] text-white font-bold rounded-xl hover:bg-[#D41E5C]">Save Address</button>
                        </div>
                      </form>
                    )}

                    {addresses.length === 0 && !showAddressForm ? (
                      <p className="text-[#D41E5C] text-sm">No saved addresses found.</p>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {addresses.map(address => (
                          <div key={address.id} className="border border-[#FFD1E3] rounded-xl p-5 relative">
                            <h4 className="font-bold text-[#B3184F]">{address.full_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {address.address_line1} {address.address_line2 ? `, ${address.address_line2}` : ''}
                            </p>
                            <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                            
                            <button onClick={() => handleDeleteAddress(address.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
