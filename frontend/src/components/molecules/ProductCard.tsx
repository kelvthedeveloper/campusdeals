import Link from 'next/link';
import Image from 'next/image';
import Card from './Card';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import Button from '../atoms/Button';
import { formatMoneyGHS } from '@/utils/money';

interface ProductCardProps {
    id: number;
    name: string;
    slug: string;
    base_price: string;
    image: string | null;
    category_name?: string;
    stock?: number;
}

export default function ProductCard({
    name,
    slug,
    base_price,
    image,
    category_name,
    stock
}: ProductCardProps) {
    const stockLabel =
        stock === 0
            ? { text: 'Out of stock', cls: 'bg-rose-50 text-rose-600 border-rose-200' }
            : typeof stock === 'number' && stock > 0 && stock <= 5
                ? { text: `Low stock (${stock})`, cls: 'bg-amber-50 text-amber-700 border-amber-200' }
                : typeof stock === 'number'
                    ? { text: `In stock (${stock})`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                    : null;

    return (
        <Card hoverable className="group h-full flex flex-col">
            <Link href={`/store/${slug}`} className="relative aspect-square overflow-hidden block">
                <Image
                    src={image || '/placeholder-product.svg'}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized={!!image} // Assuming local storage for now, if it's external unoptimized helps skip Next.js proxying for simple dev
                />
                {category_name && (
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                        {category_name}
                    </span>
                )}
                {stockLabel && (
                    <span className={`absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider shadow-sm border ${stockLabel.cls}`}>
                        {stockLabel.text}
                    </span>
                )}
            </Link>

            <div className="p-4 flex flex-col flex-1">
                <div className="mb-2">
                    <Link href={`/store/${slug}`} className="text-primary font-bold hover:text-action transition-colors line-clamp-1">
                        {name}
                    </Link>
                </div>

                <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-extrabold text-primary">{formatMoneyGHS(base_price)}</span>
                    <div className="flex gap-2">
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Link href={`/store/${slug}`}>
                            <Button size="sm" className="h-8 px-3">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </Card>
    );
}
