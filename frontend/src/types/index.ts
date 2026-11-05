export interface User {
    id: string | number;
    username: string;
    email: string;
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
    phone_number?: string;
    address?: string;
    profile_picture?: string | null;
    profile_picture_url?: string | null;
    is_active?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    date_joined?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    parent?: Category | null;
    is_active?: boolean;
    sort_order?: number;
    created_at?: string;
    product_count?: number;
    children?: Category[];
}

export interface ProductVariant {
    id: number;
    name: string;
    sku: string;
    additional_price: string;
    stock_quantity: number;
}

export interface Product {
    id: string | number;
    name: string;
    slug: string;
    description: string;
    base_price: string;
    stock: number;
    image: string | null;
    category: Category | null;
    category_id?: number | string;
    variants: ProductVariant[];
    is_active?: boolean;
    is_favorited?: boolean;
}

export interface Bid {
    id: number;
    bidder_id: number;
    bidder_username: string;
    amount: string;
    created_at: string;
}

export interface Auction {
    id: number;
    title: string;
    description?: string;
    start_price?: string;
    current_price: string;
    end_time: string;
    image: string | null;
    owner: string;
    is_active: boolean;
    winner: string | null;
    bids: Bid[];
}

export interface Service {
    id: number;
    name: string;
    description: string;
    image?: string | null;
    is_active: boolean;
}

export interface Booking {
    id: number;
    service: number;
    service_name: string;
    user_username?: string;
    date: string;
    time: string;
    notes: string;
    status: string;
    staff?: number | string;
}

export interface CartItem {
    id: number;
    name: string;
    slug: string;
    price: string;
    image: string | null;
    quantity: number;
    variantId?: number;
    variantName?: string;
}

export interface Order {
    id: string | number;
    order_number?: string;
    user?: User;
    user_username?: string;
    user_email?: string;
    user_phone_number?: string;
    user_address?: string;
    total_amount: string | number;
    currency?: string;
    status:
        | 'PENDING'
        | 'PROCESSING'
        | 'SHIPPED'
        | 'DELIVERED'
        | 'CANCELLED'
        | 'PAID'
        | 'FAILED';
    created_at?: string;
    updated_at?: string;
    createdAt?: string;
    items?: any[];
}
