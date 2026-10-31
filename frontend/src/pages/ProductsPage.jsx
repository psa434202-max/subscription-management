import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Layers,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';

export const ProductsPage = () => {
  const { role } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('software');
  const [description, setDescription] = useState('');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unit, setUnit] = useState('license');
  const [category, setCategory] = useState('General');
  const [variants, setVariants] = useState([]);
  const [variantName, setVariantName] = useState('');
  const [variantPriceAdj, setVariantPriceAdj] = useState(0);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
    setType('software');
    setDescription('');
    setSalesPrice('');
    setCostPrice('');
    setUnit('license');
    setCategory('General');
    setVariants([]);
    setModalOpen(true);
  };

  const handleAddVariant = () => {
    if (!variantName.trim()) return;
    setVariants([
      ...variants,
      {
        name: variantName.trim(),
        sku: `${code}-${variantName.slice(0, 3).toUpperCase()}`,
        priceAdjustment: Number(variantPriceAdj || 0),
        isDefault: variants.length === 0
      }
    ]);
    setVariantName('');
    setVariantPriceAdj(0);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        code,
        type,
        description,
        salesPrice: Number(salesPrice),
        costPrice: Number(costPrice || 0),
        unit,
        category,
        variants
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert('Save product error: ' + err.message);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-600" />
            Product Catalog & Variants
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure standalone products, addons, user seats, service SLAs, variants, and base pricing adjustments.
          </p>
        </div>

        {role !== 'customer' && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by code, name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">No products found.</div>
        ) : (
          filtered.map(prod => (
            <div key={prod._id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {prod.code}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-2">{prod.name}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-slate-100 text-slate-600 font-semibold">
                    {prod.type}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{prod.description || 'No description added.'}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Sales Price</span>
                    <span className="text-lg font-black text-slate-900">₹{prod.salesPrice}</span>
                    <span className="text-[10px] text-slate-400">/{prod.unit}</span>
                  </div>
                  {role !== 'customer' && prod.costPrice > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Cost</span>
                      <span className="text-xs font-bold text-slate-500">₹{prod.costPrice}</span>
                    </div>
                  )}
                </div>

                {/* Variants preview */}
                {prod.variants?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      {prod.variants.length} Variants:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {prod.variants.map((v, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {v.name} {v.priceAdjustment !== 0 && `(₹${v.priceAdjustment >= 0 ? '+' : ''}${v.priceAdjustment})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Create New Product'}
        subtitle="Specify product attributes, pricing, and variants"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Product Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Product Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="software">Software</option>
                <option value="service">Service</option>
                <option value="addon">Addon</option>
                <option value="physical">Physical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sales Price (₹)</label>
              <input
                type="number"
                value={salesPrice}
                onChange={(e) => setSalesPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Cost Price (₹)</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          {/* Variants builder */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Product Variants</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Variant Name (e.g. Dedicated Instance)"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                className="flex-1 text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="number"
                placeholder="Price Adj (₹)"
                value={variantPriceAdj}
                onChange={(e) => setVariantPriceAdj(Number(e.target.value))}
                className="w-24 text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Add
              </button>
            </div>

            {variants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {variants.map((v, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 flex items-center gap-1">
                    {v.name} (+₹{v.priceAdjustment})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl shadow-md hover:bg-brand-500"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

