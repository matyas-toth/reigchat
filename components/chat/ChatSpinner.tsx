import { useState, useEffect } from 'react';
import spinners from 'unicode-animations';

export default function ChatSpinner({ name = 'braille', children }: { name?: string, children?: React.ReactNode }) {
    const [frame, setFrame] = useState(0);
    const s = (spinners as any)[name];

    useEffect(() => {
        const timer = setInterval(
            () => setFrame(f => (f + 1) % s.frames.length),
            s.interval
        );
        return () => clearInterval(timer);
    }, [name]);

    return <div className="flex items-center gap-4 text-muted-foreground"><span className='w-6' style={{ fontFamily: 'monospace' }}>{s.frames[frame]}</span> <span>{children}</span></div>;
}