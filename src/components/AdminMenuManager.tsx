import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, X, Save, Image as ImageIcon,
  GripVertical, Tag, DollarSign, FileText, ChevronDown, Loader2, AlertCircle
} from 'lucide-react';
import {
  getAllMenuItems,
  upsertMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  type MenuItem,
} from '../services/menuService';
import { uploadMenuItemImage } from '../services/imageUploadService';

const CATEGORIES = ['Sushi', 'Woks', 'Finger Foods', 'Drinks'];

const EMPTY_ITEM: MenuItem = {
  id: '',
  name: '',
  description: '',
  price: 0,
  category: 'Sushi',
  image_url: '',
  is_available: true,
  is_featured: false,
  tags: [],
  sort_order: 0,
};

type ModalMode = 'create' | 'edit' | null;
const isMenuImageUploadEnabled = import.meta.env.VITE_ENABLE_MENU_IMAGE_UPLOAD === 'true';

export function AdminMenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<MenuItem>(EMPTY_ITEM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const ITEMS_PER_PAGE = 20;
  const loaderRef = React.useRef<HTMLDivElement>(null);

  // Load all menu items (including unavailable)
  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMenuItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
      showToast('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const explainDisabledUpload = () => {
    showToast('Direct upload will be available after Firebase Storage is enabled.');
  };

  // Generate a slug from name for the document ID
  const generateId = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[äå]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleOpenCreate = () => {
    setEditItem({
      ...EMPTY_ITEM,
      sort_order: items.filter(i => i.category === 'Sushi').length + 1,
    });
    setTagInput('');
    setImageFile(null);
    setImagePreviewUrl(null);
    setModalMode('create');
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditItem({ ...item });
    setTagInput('');
    setImageFile(null);
    setImagePreviewUrl(null);
    setModalMode('edit');
  };

  const handleImageFileChange = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setImagePreviewUrl(null);
      return;
    }
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!editItem.name.trim()) {
      showToast('Name is required');
      return;
    }
    if (editItem.price <= 0) {
      showToast('Price must be greater than 0');
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = editItem.image_url;
      if (imageFile && !isMenuImageUploadEnabled) {
        explainDisabledUpload();
        setIsSaving(false);
        return;
      }
      if (imageFile && isMenuImageUploadEnabled) {
        imageUrl = await uploadMenuItemImage(imageFile, editItem.name);
      }

      const itemToSave = {
        ...editItem,
        image_url: imageUrl,
        id: modalMode === 'create' ? generateId(editItem.name) : editItem.id,
      };
      await upsertMenuItem(itemToSave);
      showToast(modalMode === 'create' ? '✅ Item created successfully' : '✅ Item updated successfully');
      setModalMode(null);
      setImageFile(null);
      setImagePreviewUrl(null);
      await loadItems();
    } catch (err) {
      console.error('Failed to save item:', err);
      showToast('❌ Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      showToast('✅ Item deleted');
      setDeleteConfirm(null);
      await loadItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
      showToast('❌ Failed to delete item');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await toggleMenuItemAvailability(item.id, !item.is_available);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
      showToast(item.is_available ? `${item.name} hidden from menu` : `${item.name} shown on menu`);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      showToast('❌ Failed to update item');
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !(editItem.tags || []).includes(tag)) {
      setEditItem(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditItem(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  // Filtering
  const filtered = items.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [searchQuery, filterCategory]);

  useEffect(() => {
    if (isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayLimit < filtered.length) {
          setDisplayLimit(prev => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isLoading, filtered.length, displayLimit]);

  // Group by category for display
  const groupedItems: Record<string, MenuItem[]> = {};
  for (const item of filtered) {
    if (!groupedItems[item.category]) groupedItems[item.category] = [];
    groupedItems[item.category].push(item);
  }

  const paginatedItems = filtered.slice(0, displayLimit);
  const hasMore = displayLimit < filtered.length;
  
  // Update grouped items to only include paginated items
  const paginatedGroupedItems: Record<string, MenuItem[]> = {};
  for (const item of paginatedItems) {
    if (!paginatedGroupedItems[item.category]) paginatedGroupedItems[item.category] = [];
    paginatedGroupedItems[item.category].push(item);
  }

  const categoryStats = CATEGORIES.map(cat => ({
    name: cat,
    total: items.filter(i => i.category === cat).length,
    available: items.filter(i => i.category === cat && i.is_available).length,
  }));
  const previewImageSrc = imagePreviewUrl || editItem.image_url;

  return (
    <div className="relative">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-washi)]/10 backdrop-blur-xl border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-6 py-3 text-sm font-medium shadow-2xl"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categoryStats.map(stat => (
            <div
              key={stat.name}
              className="bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/10 p-4"
            >
              <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-washi)]/30 mb-1">{stat.name}</div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-2xl text-[var(--color-washi)]">{stat.available}</span>
                <span className="text-xs text-[var(--color-washi)]/30">/ {stat.total} items</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-2.5 pl-10 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-2.5 pr-10 text-xs tracking-[0.1em] uppercase focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors cursor-pointer"
            >
              <option value="all" className="bg-[var(--color-sumi)] text-[var(--color-washi)]">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-[var(--color-sumi)] text-[var(--color-washi)]">{cat}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30 pointer-events-none" />
          </div>

          {/* Add Item */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-shu)] text-[var(--color-washi)] text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#a02020] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* Menu Items List */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <FileText size={48} className="text-[var(--color-washi)]/10 mx-auto mb-4" />
              <p className="text-[var(--color-washi)]/30 text-sm">No items found</p>
              <p className="text-[var(--color-washi)]/15 text-xs mt-1">
                {searchQuery ? 'Try a different search term' : 'Add your first menu item'}
              </p>
            </div>
          </div>
        ) : (
          Object.entries(paginatedGroupedItems).map(([category, categoryItems]) => (
            <div key={category} className="mb-8">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-serif font-bold text-lg text-[var(--color-washi)]">{category}</h2>
                <div className="flex-1 h-px bg-[var(--color-washi)]/10" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-washi)]/30">
                  {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items Grid */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {categoryItems.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item.id}
                      className={`group flex items-center gap-4 bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/10 p-3 md:p-4 hover:border-[var(--color-washi)]/10 transition-all ${
                        !item.is_available ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Drag handle placeholder */}
                      <GripVertical size={16} className="text-[var(--color-washi)]/10 shrink-0 hidden md:block" />

                      {/* Image */}
                      <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 overflow-hidden bg-[var(--color-washi)]/5 relative">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={20} className="text-[var(--color-washi)]/15" />
                          </div>
                        )}
                        {!item.is_available && (
                          <div className="absolute inset-0 bg-[var(--color-sumi)]/60 flex items-center justify-center">
                            <EyeOff size={16} className="text-[var(--color-washi)]/50" />
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-serif font-bold text-[var(--color-washi)] truncate">{item.name}</h3>
                          {item.tags && item.tags.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1">
                              {item.tags.map(tag => (
                                <span key={tag} className="bg-[var(--color-shu)]/10 border border-[var(--color-shu)]/20 text-[var(--color-shu)] text-[9px] uppercase tracking-wider px-1.5 py-0.5">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-washi)]/40 truncate max-w-md">{item.description}</p>
                      </div>

                      {/* Price */}
                      <div className="font-serif font-bold text-[var(--color-washi)] whitespace-nowrap">
                        €{item.price.toFixed(2)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          title={item.is_available ? 'Hide from menu' : 'Show on menu'}
                          className={`p-2 transition-colors cursor-pointer ${
                            item.is_available
                              ? 'text-emerald-400/50 hover:text-emerald-400'
                              : 'text-[var(--color-washi)]/20 hover:text-amber-400'
                          }`}
                        >
                          {item.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-[var(--color-washi)]/30 hover:text-[var(--color-shu)] transition-colors cursor-pointer"
                          title="Edit item"
                        >
                          <Pencil size={16} />
                        </button>
                        {deleteConfirm === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors cursor-pointer text-[10px] uppercase tracking-wider font-bold"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 text-[var(--color-washi)]/30 hover:text-[var(--color-washi)] transition-colors cursor-pointer text-[10px] uppercase tracking-wider"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="p-2 text-[var(--color-washi)]/20 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}

        {/* Infinite Scroll Trigger & Spinner */}
        {!isLoading && hasMore && (
          <div ref={loaderRef} className="mt-8 flex justify-center py-4">
            <div className="w-10 h-10 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-sumi)]/80 backdrop-blur-sm px-4"
            onClick={() => setModalMode(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[var(--color-sumi)] border border-[var(--color-washi)]/10 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[var(--color-sumi)] border-b border-[var(--color-washi)]/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-serif font-bold text-lg text-[var(--color-washi)] flex items-center gap-3">
                  {modalMode === 'create' ? (
                    <><Plus size={18} className="text-[var(--color-shu)]" /> New Menu Item</>
                  ) : (
                    <><Pencil size={18} className="text-[var(--color-shu)]" /> Edit Item</>
                  )}
                </h2>
                <button
                  onClick={() => setModalMode(null)}
                  className="p-2 text-[var(--color-washi)]/30 hover:text-[var(--color-washi)] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Image Preview */}
                <div className="relative">
                  {previewImageSrc ? (
                    <div className="w-full h-48 overflow-hidden bg-[var(--color-washi)]/5 relative group/img">
                      <img
                        src={previewImageSrc}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-[var(--color-sumi)]/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[var(--color-washi)] text-xs tracking-[0.2em] uppercase">Image preview</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-[var(--color-washi)]/[0.03] border border-dashed border-[var(--color-washi)]/10 flex flex-col items-center justify-center gap-2">
                      <ImageIcon size={24} className="text-[var(--color-washi)]/15" />
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-washi)]/20">Add image URL or upload below</span>
                    </div>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/40 mb-2">
                    <ImageIcon size={12} className="inline mr-1.5 -mt-0.5" />
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editItem.image_url}
                    onChange={(e) => setEditItem(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 text-sm placeholder:text-[var(--color-washi)]/15 focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors"
                  />
                  <p className="text-[10px] text-[var(--color-washi)]/25 mt-2">
                    Keep this for hosted images, or upload a file below.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/40 mb-2">
                    Upload Image File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!isMenuImageUploadEnabled}
                      onChange={(e) => handleImageFileChange(e.target.files?.[0] || null)}
                      className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-[var(--color-shu)] file:px-3 file:py-2 file:text-[var(--color-washi)] file:cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
                    />
                    {!isMenuImageUploadEnabled && (
                      <button
                        type="button"
                        onClick={explainDisabledUpload}
                        onFocus={explainDisabledUpload}
                        className="absolute inset-0 cursor-not-allowed"
                        aria-label="Direct image upload is disabled until Firebase Storage is enabled"
                      />
                    )}
                  </div>
                  <div className="mt-3 flex items-start gap-2 border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[10px] text-amber-200/90">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    <span>
                      Direct upload is disabled for now because Firebase Storage is not enabled on the current plan.
                      Keep using the Image URL field above. When Storage is enabled later, this upload area can be turned on without redesigning the menu form.
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-4">
                    <p className="text-[10px] text-[var(--color-washi)]/25">
                      {isMenuImageUploadEnabled
                        ? 'If a file is selected, it will be uploaded on save and used instead of the URL.'
                        : 'This control is intentionally visible for future use, but inactive for now.'}
                    </p>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={() => handleImageFileChange(null)}
                        className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-shu)] hover:text-[var(--color-washi)] transition-colors cursor-pointer"
                      >
                        Clear File
                      </button>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/40 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Dragon Roll"
                    className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 text-sm placeholder:text-[var(--color-washi)]/15 focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors font-serif font-bold text-lg"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/40 mb-2">
                    <FileText size={12} className="inline mr-1.5 -mt-0.5" />
                    Description
                  </label>
                  <textarea
                    value={editItem.description}
                    onChange={(e) => setEditItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A brief, appetizing description..."
                    rows={3}
                    className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 text-sm placeholder:text-[var(--color-washi)]/15 focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors resize-none"
                  />
                </div>

                {/* Price + Category Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/40 mb-2">
                      <DollarSign size={12} className="inline mr-1.5 -mt-0.5" />
                      Price (€) *
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={editItem.price || ''}
                      onChange={(e) => setEditItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 text-sm placeholder:text-[var(--color-washi)]/15 focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors font-serif font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/40 mb-2">
                      Category *
                    </label>
                    <div className="relative">
                      <select
                        value={editItem.category}
                        onChange={(e) => setEditItem(prev => ({ ...prev, category: e.target.value }))}
                        className="appearance-none w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className="bg-[var(--color-sumi)] text-[var(--color-washi)]">{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/40 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editItem.sort_order || 0}
                    onChange={(e) => setEditItem(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-24 bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors"
                  />
                  <p className="text-[10px] text-[var(--color-washi)]/20 mt-1">Lower numbers appear first within the category</p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/40 mb-2">
                    <Tag size={12} className="inline mr-1.5 -mt-0.5" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editItem.tags || []).map(tag => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 bg-[var(--color-shu)]/10 border border-[var(--color-shu)]/20 text-[var(--color-shu)] text-xs px-2.5 py-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-[var(--color-shu)]/50 hover:text-[var(--color-shu)] cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      placeholder="e.g. Popular, Spicy, Signature..."
                      className="flex-1 bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/10 text-[var(--color-washi)] px-4 py-2 text-sm placeholder:text-[var(--color-washi)]/15 focus:outline-none focus:border-[var(--color-shu)]/50 transition-colors"
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                      className="px-4 py-2 border border-[var(--color-washi)]/10 text-[var(--color-washi)]/50 hover:text-[var(--color-washi)] hover:border-[var(--color-washi)]/10 text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/10">
                  <div>
                    <p className="text-sm text-[var(--color-washi)] font-medium">Visible on Menu</p>
                    <p className="text-[10px] text-[var(--color-washi)]/30 mt-0.5">Toggle whether customers can see and order this item</p>
                  </div>
                  <button
                    onClick={() => setEditItem(prev => ({ ...prev, is_available: !prev.is_available }))}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                      editItem.is_available ? 'bg-[var(--color-shu)]' : 'bg-[var(--color-washi)]/10'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-[var(--color-washi)] transition-transform shadow-sm ${
                      editItem.is_available ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/10">
                  <div>
                    <p className="text-sm text-[var(--color-washi)] font-medium text-amber-400">Featured Item (Max 5)</p>
                    <p className="text-[10px] text-[var(--color-washi)]/30 mt-0.5">Show this item in the featured section on the homepage</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!editItem.is_featured) {
                        const currentFeaturedCount = items.filter(i => i.is_featured && i.id !== editItem.id).length;
                        if (currentFeaturedCount >= 5) {
                          showToast('❌ Maximum 5 featured items allowed');
                          return;
                        }
                      }
                      setEditItem(prev => ({ ...prev, is_featured: !prev.is_featured }));
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                      editItem.is_featured ? 'bg-amber-400' : 'bg-[var(--color-washi)]/10'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-[var(--color-washi)] transition-transform shadow-sm ${
                      editItem.is_featured ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-[var(--color-sumi)] border-t border-[var(--color-washi)]/10 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={() => setModalMode(null)}
                  className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase text-[var(--color-washi)]/40 hover:text-[var(--color-washi)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editItem.name.trim() || editItem.price <= 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-shu)] text-[var(--color-washi)] text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#a02020] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSaving ? 'Saving...' : modalMode === 'create' ? 'Create Item' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
