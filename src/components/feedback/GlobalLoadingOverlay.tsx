import { useMemo } from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { BarLoader } from 'react-spinners'
import { useNavigation } from 'react-router-dom'
import 'react-loading-skeleton/dist/skeleton.css'

export function GlobalLoadingOverlay() {
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'
  const className = useMemo(
    () =>
      isLoading
        ? 'global-loading global-loading--visible'
        : 'global-loading global-loading--hidden',
    [isLoading],
  )

  return (
    <div className={className} aria-hidden={!isLoading}>
      <div className="global-loading__panel" role="status" aria-live="polite">
        <BarLoader color="var(--color-brand)" width={220} />
        <SkeletonTheme baseColor="#ece6d8" highlightColor="#f8f6ef">
          <div className="global-loading__skeletons">
            <Skeleton height={16} count={1} />
            <Skeleton height={16} count={1} width="85%" />
            <Skeleton height={16} count={1} width="70%" />
          </div>
        </SkeletonTheme>
      </div>
    </div>
  )
}
