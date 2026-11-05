'use client';

import { useState, useEffect } from 'react';

interface AuctionTimerProps {
    endTime: string;
}

export default function AuctionTimer({ endTime }: AuctionTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const calculateTime = () => {
            const difference = new Date(endTime).getTime() - new Date().getTime();

            if (difference <= 0) {
                setTimeLeft('Ended');
                return;
            }

            const hours = Math.floor((difference / (1000 * 60 * 60)));
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        const timer = setInterval(calculateTime, 1000);
        calculateTime();

        return () => clearInterval(timer);
    }, [endTime]);

    return (
        <div className={`font-mono font-bold ${timeLeft === 'Ended' ? 'text-red-600' : 'text-action'}`}>
            {timeLeft}
        </div>
    );
}
