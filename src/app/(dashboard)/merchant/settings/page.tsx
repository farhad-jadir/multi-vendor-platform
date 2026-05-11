'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Upload, Save, Store, Phone, MapPin, FileText, Camera, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';

export default function MerchantSettings() {
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    business_address: '',
    phone_number: '',
    business_logo: '',
    business_cover: '',
  });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchMerchantProfile();
  }, []);

  async function fetchMerchantProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setMerchant(data);
        setFormData({
          business_name: data.business_name || '',
          business_description: data.business_description || '',
          business_address: data.business_address || '',
          phone_number: data.phone_number || '',
          business_logo: data.business_logo || '',
          business_cover: data.business_cover || '',
        });
      }
    }
    
    setLoading(false);
  }

  async function uploadImage(file: File, type: 'logo' | 'cover') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${merchant?.id || 'temp'}/${type}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('merchant-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('merchant-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingCover(true);
    
    try {
      const url = await uploadImage(file, type);
      
      const updateData = type === 'logo' 
        ? { business_logo: url }
        : { business_cover: url };
      
      const { error } = await supabase
        .from('merchants')
        .update(updateData)
        .eq('id', merchant.id);
      
      if (error) throw error;
      
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'business_logo' : 'business_cover']: url
      }));
      
      toast.success(`${type === 'logo' ? 'Logo' : 'Cover image'} uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    // Create slug from business name
    const slug = formData.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const { error } = await supabase
      .from('merchants')
      .update({
        business_name: formData.business_name,
        business_description: formData.business_description,
        business_address: formData.business_address,
        phone_number: formData.phone_number,
        slug: slug,
      })
      .eq('id', merchant.id);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully');
      router.refresh();
    }
    
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cover Image Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-600">
          {formData.business_cover && (
            <Image
              src={formData.business_cover}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          
          {/* Cover Image Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'cover')}
                disabled={uploadingCover}
              />
              <div className="flex flex-col items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-lg hover:bg-gray-50">
                <Camera className="w-5 h-5" />
                <span className="text-sm">
                  {uploadingCover ? 'Uploading...' : 'Change Cover Image'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Logo Section */}
        <div className="relative px-6 pb-6">
          <div className="flex justify-between items-start -mt-12 mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg">
                {formData.business_logo ? (
                  <Image
                    src={formData.business_logo}
                    alt="Logo"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  disabled={uploadingLogo}
                />
                <div className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50">
                  <Camera className="w-4 h-4 text-gray-600" />
                </div>
              </label>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">{formData.business_name}</h2>
          <p className="text-gray-600">Manage your store profile and appearance</p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5" />
            Business Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.business_name}
              onChange={(e) => setFormData({...formData, business_name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Description
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.business_description}
              onChange={(e) => setFormData({...formData, business_description: e.target.value})}
              placeholder="Tell customers about your business..."
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              placeholder="+880 1XXX XXXXXX"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Address
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.business_address}
              onChange={(e) => setFormData({...formData, business_address: e.target.value})}
              placeholder="Full business address..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}