import Link from 'next/link';
import Image from 'next/image';
import Card from './Card';
import AuctionTimer from '../atoms/AuctionTimer';
import { Gavel } from 'lucide-react';
import Button from '../atoms/Button';
import { formatMoneyGHS } from '@/utils/money';

interface AuctionCardProps {
    id: number;
    title: string;
    current_price: string;
    end_time: string;
    image: string | null;
}

export default function AuctionCard({ id, title, current_price, end_time, image }: AuctionCardProps) {
    return (
        <Card hoverable className="group h-full flex flex-col">
            <Link href={`/auctions/${id}`} className="relative aspect-video overflow-hidden block">
                <Image
                    src={image || '/placeholder-auction.svg'}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                />
                <div className="absolute top-3 left-3 bg-action text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                    Live Auction
                </div>
            </Link>

            <div className="p-5 flex flex-col flex-1">
                <Link href={`/auctions/${id}`} className="text-primary font-bold hover:text-action transition-colors mb-3 line-clamp-1">
                    {title}
                </Link>

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-secondary text-[10px] uppercase font-bold tracking-widest block mb-0.5">Current Bid</span>
                        <span className="text-xl font-black text-primary">{formatMoneyGHS(current_price)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-secondary text-[10px] uppercase font-bold tracking-widest block mb-0.5">Time Left</span>
                        <AuctionTimer endTime={end_time} />
                    </div>
                </div>

                <Link href={`/auctions/${id}`} className="mt-auto">
                    <Button variant="secondary" className="w-full">
                        <Gavel className="h-4 w-4 mr-2" />
                        Place bid
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
