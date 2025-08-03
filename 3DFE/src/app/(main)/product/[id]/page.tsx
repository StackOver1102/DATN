"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Download,
  ChevronRight,
  CircleDollarSign,
  Star,
  Send,
} from "lucide-react";
import SimilarProductsSlider from "@/components/SimilarProductsSlider";
import { useParams, useRouter } from "next/navigation";
import { Product } from "@/interface/product";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCreateData, useFetchData } from "@/lib/hooks/useApi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchUserProfile } from "@/lib/store/userSlice";
import { toast } from "sonner";
import { store } from "@/lib/store/store";
import { useState } from "react";

// Request type for creating an order
interface CreateOrderRequest {
  productId: string;
}

// Response type from the API
interface OrderResponse {
  _id: string;
  productId: string;
  userId: string;
  totalAmount: number;
  status: string;
  isPaid: boolean;
  fileUrl?: string;
  urlDownload?: string;
}

// Comment interfaces
interface Comment {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  productId: string;
  content: string;
  rating: number;
  createdAt: string;
}

interface CreateCommentRequest {
  productId: string;
  content: string;
  rating: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const router = useRouter();

  // State for comments
  const [commentContent, setCommentContent] = useState("");
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Use Redux hooks
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);

  // Use the useFetchData hook to fetch the product
  const { data: product, isLoading: isLoadingProduct } = useFetchData<Product>(
    `products/${id}`,
    ["product", id],
    {
      enabled: !!id,
    }
  );

  // Use the useFetchData hook to fetch similar products
  const { data: similarProductsData, isLoading: isLoadingSimilar } =
    useFetchData<Product[]>(
      `products/${id}/similar?limit=10`,
      ["similar-products", id],
      {
        enabled: !!id && !!product,
      }
    );

  // Fetch comments for the product
  const {
    data: comments,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useFetchData<Comment[]>(`comments/product/${id}`, ["comments", id], {
    enabled: !!id,
  });

  const orderMutation = useCreateData<OrderResponse, CreateOrderRequest>(
    "orders",
    ["order"],
    {
      onSuccess: (data) => {
        toast.success("Order placed successfully!");
        // If there's a download URL available, open it
        const downloadUrl = data?.fileUrl || data?.urlDownload;
        if (downloadUrl) {
          window.open(downloadUrl, "_blank");
        }
        // Refresh profile after order
        fetchProfile();
      },
      onError: (err) => {
        toast.error(`Order failed: ${err.message}`);
      },
    }
  );

  // Comment mutation
  const commentMutation = useCreateData<Comment, CreateCommentRequest>(
    "comments",
    ["comments", id],
    {
      onSuccess: () => {
        toast.success("Comment posted successfully!");
        setCommentContent("");
        setRating(5);
        refetchComments();
      },
      onError: (err) => {
        toast.error(`Failed to post comment: ${err.message}`);
      },
    }
  );

  // Function to fetch profile using Redux
  const fetchProfile = async () => {
    try {
      const token = session?.accessToken as string | undefined;
      await dispatch(fetchUserProfile(token)).unwrap();
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Function to handle comment submission
  const handleCommentSubmit = async () => {
    if (!session?.user) {
      toast.error("Please login to comment");
      router.push("/signin?redirect=" + encodeURIComponent(`/product/${id}`));
      return;
    }

    if (!commentContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const commentData: CreateCommentRequest = {
      productId: id,
      content: commentContent,
      rating,
    };

    await commentMutation.mutateAsync(commentData);
  };

  // Fetch profile on mount if user is logged in
  // useEffect(() => {
  //   if (session?.user) {
  //     fetchProfile();
  //   }
  // }, [session]);

  // Transform similar products to match the expected interface
  const similarProducts = similarProductsData
    ? similarProductsData.map((item) => ({
        id: item._id || "",
        name: item.name,
        price: item.price,
        image: item.images || "/placeholder-image.jpg",
      }))
    : [];

  const handleBuyModal = async () => {
    if (!session?.user) {
      toast.error("Please login to buy this product");
      router.push("/signin?redirect=" + encodeURIComponent(`/product/${id}`));
      return;
    }

    // If no profile in store, fetch it
    if (!profile) {
      toast.loading("Loading your profile...");
      try {
        const token = session?.accessToken as string | undefined;
        await dispatch(fetchUserProfile(token)).unwrap();
        toast.dismiss();
      } catch {
        toast.dismiss();
        toast.error("Failed to load profile");
        return;
      }
    }

    // Get updated profile from the store after the state refresh
    const storeState = store.getState();
    const updatedProfile = storeState.user.profile;

    // Check user balance
    if (
      updatedProfile?.balance &&
      product &&
      updatedProfile.balance < product.price
    ) {
      toast.error("Insufficient balance. Please deposit more money.");
      router.push("/deposit");
      return;
    }

    // Process order
    toast.loading("Processing your order...");

    // Create order
    if (product && product._id) {
      const orderData: CreateOrderRequest = {
        productId: product._id,
      };

      await orderMutation
        .mutateAsync(orderData)
        .then(() => {
          toast.dismiss();
        })
        .catch((err) => {
          toast.dismiss();
          toast.error(err.message);
        });
    } else {
      toast.dismiss();
      toast.error("Product information is missing");
      return;
    }
  };

  if (isLoadingProduct || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center text-sm text-gray-600">
            <Link
              href="/"
              className="hover:text-blue-600 transition-colors hover:underline"
            >
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <Link
              href="/models"
              className="hover:text-blue-600 transition-colors hover:underline"
            >
              3D Models
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <Link
              href={`/models?category=${product?.categoryPath}`}
              className="hover:text-blue-600 transition-colors hover:underline"
            >
              {product?.categoryPath}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <Link
              href={`/models?category=${product?.categoryPath}&item=${product?.categoryName}`}
              className="hover:text-blue-600 transition-colors hover:underline"
            >
              {product?.categoryName}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <span className="text-gray-900 font-medium">{product?.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start">
          {/* Left side - 3D Model Image */}
          <div className="lg:col-span-2 space-y-4 h-full">
            {/* Main Product Image */}
            <div className="bg-gray-50 border rounded-lg p-3 relative transition-all hover:shadow-lg hover:border-gray-300">
              <div className="relative aspect-square rounded">
                <Image
                  src={product?.images || "/placeholder-image.jpg"}
                  alt={product?.name || "Product Image"}
                  fill
                  className="object-contain p-4 transition-transform hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Right side - Product Info */}
          <div className="space-y-6 h-full bg-gray-50 p-4 rounded-lg">
            {/* Product Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {product?.name}
            </h1>

            {/* Price Section */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-600">Price:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {product?.price}
                  </span>
                  <CircleDollarSign className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-600">Coin</span>
                  {product?.isPro && (
                    <span className="bg-black text-yellow-400 px-2 py-1 rounded text-xs font-bold">
                      PRO
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4 first-letter:uppercase">
                {product?.description}
              </div>

              {/* <hr className="my-4" /> */}
            </div>

            {/* Product Specifications */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between border-b pb-2 hover:bg-gray-100 px-2 rounded transition-colors">
                  <span className="text-gray-600">ID Product:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {product?._id}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2 hover:bg-gray-100 px-2 rounded transition-colors">
                  <span className="text-gray-600">Platform:</span>
                  <span className="text-gray-900 font-medium">
                    3dsMax 2015 + obj
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2 hover:bg-gray-100 px-2 rounded transition-colors">
                  <span className="text-gray-600">Render:</span>
                  <span className="text-gray-900 font-medium first-letter:uppercase">
                    {product?.render || "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2 hover:bg-gray-100 px-2 rounded transition-colors">
                  <span className="text-gray-600">Size:</span>
                  <span className="text-gray-900 font-medium">
                    {product?.size ? `${product?.size} MB` : "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2 hover:bg-gray-100 px-2 rounded transition-colors">
                  <span className="text-gray-600">Materials:</span>
                  <span className="text-gray-900 font-medium first-letter:uppercase">
                    {product?.materials || "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2 hover:bg-gray-100 px-2 rounded transition-colors">
                  <span className="text-gray-600">Style:</span>
                  <span className="text-gray-900 font-medium first-letter:uppercase">
                    {product?.style || "-"}
                  </span>
                </div>

                <div className="flex justify-between hover:bg-gray-100 px-2 rounded transition-colors">
                  <span className="text-gray-600">Color:</span>
                  {product?.color ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300 hover:scale-125 transition-transform"
                        style={{ backgroundColor: product.color }}
                      />
                    </div>
                  ) : (
                    <span className="text-gray-900 font-medium">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Buy Button and Favorite */}
            <div className="flex gap-3">
              <button
                onClick={handleBuyModal}
                className="flex-1 bg-black text-yellow-400 font-bold py-3 px-6 rounded flex items-center justify-center gap-2 transition-all hover:bg-gray-800 hover:scale-105 hover:shadow-md"
              >
                <Download className="w-5 h-5" />
                Buy Model
              </button>
              <button className="bg-white border border-gray-300 hover:bg-gray-100 hover:text-red-500 hover:border-red-300 text-gray-700 p-3 rounded transition-all hover:scale-110 hover:shadow-sm">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product?.description && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Description
            </h2>
            <div className="bg-gray-50 border rounded-lg p-6 transition-all hover:shadow-md hover:border-gray-300">
              <p className="text-gray-700 whitespace-pre-line first-letter:uppercase">
                {product.description}
              </p>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-10">
          <div className="border rounded-lg transition-all hover:shadow-md">
            <div className="border-b">
              <div className="flex">
                <button className="px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors">
                  Comments
                </button>
              </div>
            </div>

            {/* Comment Form */}
            <div className="p-4 border-b">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= (hoveredRating || rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        } transition-colors`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {rating} out of 5 stars
                  </span>
                </div>

                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write your comment here..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  rows={3}
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleCommentSubmit}
                    disabled={commentMutation.isPending}
                    className="bg-black text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {commentMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Post Comment</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="p-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                            {comment.userId.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {comment.userId.fullName}
                            </p>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < comment.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">
                                {new Date(
                                  comment.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Similar Products Section - Swiper Slider */}
        {isLoadingSimilar ? (
          <div className="mt-16 border-t pt-8">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 hover:text-blue-600 transition-colors inline-block">
              Similar 3D Models
            </h2>
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner size="md" />
            </div>
          </div>
        ) : similarProducts.length > 0 ? (
          <div className="mt-16 border-t pt-8">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 hover:text-blue-600 transition-colors inline-block">
              Similar 3D Models
            </h2>
            <SimilarProductsSlider products={similarProducts} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
