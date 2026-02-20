
"use client"

export function VideoPlayer({ videoId }: { videoId: string }) {
    return (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-value-border">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
            />
        </div>
    )
}
