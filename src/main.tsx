import React from 'react'
import ReactDOM from 'react-dom/client'
import { FeynmanApp } from './feynman/FeynmanApp'
import './index.css'

// 注：不使用 React.StrictMode。
// 原因：开发环境下 StrictMode 会让 useEffect 双跑，导致每道问题调用两次联网 LLM，
// 浪费 token，并触发 AbortController 竞态（"signal is aborted without reason"）。
ReactDOM.createRoot(document.getElementById('root')!).render(
  <FeynmanApp />,
)

// 小技巧：避免 React 导入未使用的 lint 告警
void React
