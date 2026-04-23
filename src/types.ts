export type ViewMode = 'grid-2' | 'grid-3' | 'grid-4' | 'list';

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'best_selling' | 'best_rated' | 'discount';

export interface FilterState {
  priceMin: number;
  priceMax: number;
  brands: string[];
  sizes: string[];
  colors: string[];
  collections: string[];
  inStock: boolean;
  onSale: boolean;
  minRating: number;
}

export interface CartItem {
  id: string; // Composite ID: productId_size_color
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductFeature {
  label: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  parentId?: string;
  status?: 'Actif' | 'Brouillon';
  position?: number;
  createdAt?: any;
  updatedAt?: any;
  subcategories?: Category[];
  collections?: { id: string; name: string; slug?: string; group?: string }[];
  promo?: {
    image: string;
    text: string;
    title: string;
  };
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  status?: 'Actif' | 'Brouillon';
  createdAt?: any;
  updatedAt?: any;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  brand?: string;
  sku?: string;
  category?: string;
  categoryId?: string; // Links to child category
  categorySlug?: string;
  status?: 'active' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviewsCount: number;
  dateAdded: string; // ISO string
  isPopular: boolean;
  stock: number;
  sizes: string[];
  colors: ProductColor[];
  deliveryEstimate?: string;
  composition?: string;
  careInstructions?: string;
  features?: ProductFeature[];
}
