import { useEffect, useState } from 'react'
import { getPhoto } from '../db/queries'

interface PhotoThumbProps {
  photoBlobId: string
  className?: string
  alt?: string
}

export default function PhotoThumb({
  photoBlobId,
  className = 'w-12 h-12 object-cover rounded-lg shrink-0',
  alt = '',
}: PhotoThumbProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | undefined
    getPhoto(photoBlobId).then((blob) => {
      if (blob) {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      }
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoBlobId])

  if (!url) return null

  return <img src={url} alt={alt} className={className} />
}
