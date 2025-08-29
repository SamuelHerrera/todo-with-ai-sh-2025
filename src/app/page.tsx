import App from '@/components/App'
import TasksContextProvider from '@/hooks/tasks.hook'

export default function Index() {
  return (
    <TasksContextProvider>
      <App />
    </TasksContextProvider>
  )
}
