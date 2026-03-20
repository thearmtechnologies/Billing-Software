import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Upload, Trash2 } from 'lucide-react';

const SignatureCard = ({ currentSignatureUrl, onSignatureChange }) => {
  const [previewUrl, setPreviewUrl] = useState(currentSignatureUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Sync preview when the prop changes (e.g. after profile fetch on page load)
  useEffect(() => {
    if (currentSignatureUrl) setPreviewUrl(currentSignatureUrl);
  }, [currentSignatureUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        processFile(file);
      } catch (err) {
        console.error("File processing error:", err);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        processFile(file);
      } catch (err) {
        console.error("File processing error:", err);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processFile = (file) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      toast.error('Invalid file type. Allowed: jpeg, jpg, png, svg');
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`File too large. Max size is 5 MB`);
      return;
    }

    // Resize if needed (max width 600px - kept consistent with logo but it also works well for signatures)
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = (MAX_WIDTH / width) * height;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const resizedFile = new File([blob], file.name, { type: file.type });
        uploadFile(resizedFile);
        setPreviewUrl(URL.createObjectURL(blob));
      }, file.type);
    };
    img.onerror = () => {
      toast.error("Failed to load image for processing.");
    };
    img.src = url;
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('signature', file);
    try {
      setUploading(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/upload-signature`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
        withCredentials: true,
      });
      const { url } = response.data;
      toast.success('Signature uploaded successfully');
      setPreviewUrl(url);
      onSignatureChange(url);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/users/remove-signature`, { withCredentials: true });
      toast.success('Signature removed');
      setPreviewUrl(null);
      onSignatureChange('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Remove failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 className="text-lg font-semibold text-gray-900" style={{ marginBottom: '16px' }}>Digital Signature</h3>
      <div
        className="border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-center cursor-pointer"
        style={{ padding: '16px' }}
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        aria-label="Upload digital signature"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Digital signature preview" className="max-h-32 object-contain" style={{ marginBottom: '8px' }} />
        ) : (
          <Upload className="w-8 h-8 text-gray-500" style={{ marginBottom: '8px' }} />
        )}
        <p className="text-sm text-gray-600">{previewUrl ? 'Click to replace signature' : 'Drag & drop or click to upload signature'}</p>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/svg+xml"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5" style={{ marginTop: '8px' }}>
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
      {previewUrl && (
        <button
          onClick={handleRemove}
          className="flex items-center text-red-600 hover:text-red-800"
          style={{ marginTop: '16px' }}
        >
          <Trash2 className="w-4 h-4" style={{ marginRight: '4px' }} /> Remove Signature
        </button>
      )}
    </div>
  );
};

export default SignatureCard;
