"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Upload, X } from "lucide-react";
import Image from "next/image";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") || file.type === "application/pdf";
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
      message: "",
    });
    setUploadedFiles([]);

    setIsSubmitting(false);
    alert(
      "Thank you for your message! We will contact you as soon as possible."
    );
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop&crop=center"
          alt="3D Interior Design"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Form */}
          <div className="max-w-md mx-auto lg:mx-0">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              You Need Support?
            </h1>
            <p className="text-gray-300 mb-8 text-lg">
              Leave your information below. We will contact you as soon as
              possible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Name *"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white placeholder-gray-400 transition-colors"
                />
              </div>

              {/* Phone Field */}
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone *"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white placeholder-gray-400 transition-colors"
                />
              </div>

              {/* Email Field */}
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white placeholder-gray-400 transition-colors"
                />
              </div>

              {/* Message Field */}
              <div>
                <textarea
                  name="message"
                  placeholder="Message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white placeholder-gray-400 resize-none transition-colors"
                />
              </div>

              {/* File Upload Field */}
              <div>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg focus-within:border-cyan-400 text-white cursor-pointer transition-colors flex items-center gap-3 hover:border-gray-500"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400">
                      Upload images or PDF (Max 5 files, 10MB each)
                    </span>
                  </label>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          {file.type.startsWith("image/") ? (
                            <div className="w-8 h-8 bg-cyan-500/20 rounded flex items-center justify-center">
                              <span className="text-cyan-400 text-xs">IMG</span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center">
                              <span className="text-red-400 text-xs">PDF</span>
                            </div>
                          )}
                          <span className="text-white text-sm truncate max-w-[200px]">
                            {file.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            ({(file.size / 1024 / 1024).toFixed(1)}MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-400 p-1 h-auto"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      SENDING...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      SEND
                    </>
                  )}
                </div>
              </Button>
            </form>
          </div>

          {/* Right Side - 3D Model Showcase */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main Featured Image */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop&crop=center"
                  alt="Modern Bedroom 3D Model"
                  width={800}
                  height={400}
                  className="object-cover"
                />
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -left-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="text-cyan-400 font-semibold text-sm">
                  Premium Models
                </div>
                <div className="text-white text-xs">High Quality 3D Assets</div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="text-blue-400 font-semibold text-sm">
                  Support 24/7
                </div>
                <div className="text-white text-xs">Always Here to Help</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 lg:mt-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-white">
              Welcome to the official website channel 3D Blue Model Pro
            </h2>
            <p className="text-gray-300 text-lg">
              Every day we publish new and attractive 3D models.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h3 className="text-cyan-400 font-semibold mb-2">Categories</h3>
              <p className="text-gray-300 text-sm">13+ Model Categories</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h3 className="text-cyan-400 font-semibold mb-2">Quality</h3>
              <p className="text-gray-300 text-sm">Premium 3D Assets</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h3 className="text-cyan-400 font-semibold mb-2">Formats</h3>
              <p className="text-gray-300 text-sm">Multiple File Types</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h3 className="text-cyan-400 font-semibold mb-2">Support</h3>
              <p className="text-gray-300 text-sm">24/7 Customer Care</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
