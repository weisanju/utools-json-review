import { useEffect, useState } from 'react'
import AnyJsonReview from './AnyJsonReview'
export default function App () {
  const [enterAction, setEnterAction] = useState({})
  const [route, setRoute] = useState('')
  // 监听 uTools 插件进入和退出事件
  useEffect(() => {
    // 当插件被调用时触发
    window.utools.onPluginEnter((action) => {
      setRoute(action.code)
      setEnterAction(action)
    })
    // 当插件退出时触发
    window.utools.onPluginOut((isKill) => {
      setRoute('')
    })
  }, [])

  if (route === 'any_json_parse') {
    return <AnyJsonReview enterAction={enterAction} />
  }
  return false
}
