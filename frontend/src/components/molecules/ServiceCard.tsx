import Link from 'next/link';
import Card from './Card';
import { Calendar, Star } from 'lucide-react';
import Button from '../atoms/Button';

interface ServiceCardProps {
    id: number;
    name: string;
    description: string;
    image?: string | null;
}

export default function ServiceCard({ id, name, description, image }: ServiceCardProps) {
    return (
        <Card hoverable className="p-6 flex flex-col h-full bg-slate-50/50 border-slate-100">
            {image && (
                <div className="h-40 w-full mb-5 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                    <img src={image} alt={name} className="h-full w-full object-cover" />
                </div>
            )}
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-primary">{name}</h3>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                    <Star className="h-3 w-3 fill-amber-600" />
                    4.9
                </div>
            </div>

            <p className="text-secondary text-sm leading-relaxed mb-6 line-clamp-3">
                {description || 'Professional campus service tailored for students.'}
            </p>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200/60">
                <Link href={`/services/${id}`}>
                    <Button size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Now
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
