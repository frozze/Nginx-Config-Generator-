/**
 * Ad slot placeholder — controlled by NEXT_PUBLIC_ADS_ENABLED.
 *
 * Returns null when ads are disabled (default in open-source mode).
 * When enabled, renders a container for your ad provider (e.g. Google AdSense).
 */
interface AdSlotProps {
    position: 'sidebar' | 'header' | 'footer' | 'inline';
}

export default function AdSlot({ position }: AdSlotProps) {
    if (process.env.NEXT_PUBLIC_ADS_ENABLED !== 'true') return null;

    return (
        <div
            data-ad-slot={position}
            className="ad-container"
            aria-hidden="true"
        />
    );
}
