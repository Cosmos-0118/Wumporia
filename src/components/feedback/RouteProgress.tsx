import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useEffect } from 'react'
import { useNavigation } from 'react-router-dom'

NProgress.configure({
  showSpinner: false,
  minimum: 0.1,
  trickleSpeed: 140,
})

export function RouteProgress() {
  const navigation = useNavigation()

  useEffect(() => {
    if (navigation.state === 'loading') {
      NProgress.start()
      return
    }
    NProgress.done()
  }, [navigation.state])

  return null
}
