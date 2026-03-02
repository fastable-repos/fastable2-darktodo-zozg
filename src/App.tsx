import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'active' | 'completed'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

// ── LocalStorage helpers ───────────────────────────────────────────────────

const STORAGE_KEY_ITEMS = 'darktodo_items'
const STORAGE_KEY_DARKMODE = 'darktodo_darkmode'

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS)
    if (!raw) return []
    return JSON.parse(raw) as Todo[]
  } catch (e) {
    console.error('Failed to load todos from localStorage:', e)
    return []
  }
}

function loadDarkMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_DARKMODE) === 'true'
  } catch (e) {
    console.error('Failed to load dark mode from localStorage:', e)
    return false
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(todos))
  } catch (e) {
    console.error('Failed to save todos to localStorage:', e)
  }
}

function saveDarkMode(dark: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_DARKMODE, String(dark))
  } catch (e) {
    console.error('Failed to save dark mode to localStorage:', e)
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [darkMode, setDarkMode] = useState<boolean>(loadDarkMode)
  const [inputText, setInputText] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  // Persist todos whenever they change
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  // Persist dark mode + apply class to <html>
  useEffect(() => {
    saveDarkMode(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // ── Actions ──────────────────────────────────────────────────────────────

  function addTodo() {
    const text = inputText.trim()
    if (!text) return
    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [...prev, newTodo])
    setInputText('')
  }

  function toggleTodo(id: string) {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  function deleteTodo(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.completed))
  }

  function toggleDarkMode() {
    setDarkMode(prev => !prev)
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  // ── Empty state message ───────────────────────────────────────────────────

  function emptyMessage(): string {
    if (filter === 'active') return "You're all caught up! No active tasks."
    if (filter === 'completed') return 'No completed todos yet.'
    return 'No todos yet. Add one above!'
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* ── Header ── */}
      <header className="bg-indigo-600 dark:bg-indigo-900 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            DarkTodo
          </h1>
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            data-testid="dark-mode-toggle"
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Add todo input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addTodo()
            }}
            placeholder="What needs to be done?"
            aria-label="New todo input"
            data-testid="todo-input"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
          <button
            onClick={addTodo}
            data-testid="add-button"
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Add
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4" role="tablist" aria-label="Filter todos">
          {(['all', 'active', 'completed'] as FilterType[]).map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                filter === f
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Todo list card */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
          data-testid="todo-list"
        >
          {filteredTodos.length === 0 ? (
            <div
              className="py-16 text-center"
              data-testid="empty-state"
            >
              <p className="text-4xl mb-3" role="img" aria-label="checkmark">✅</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {emptyMessage()}
              </p>
            </div>
          ) : (
            <ul>
              {filteredTodos.map((todo, index) => (
                <li
                  key={todo.id}
                  data-testid="todo-item"
                  className={`flex items-center gap-3 px-4 py-3.5 group ${
                    index < filteredTodos.length - 1
                      ? 'border-b border-gray-100 dark:border-gray-700'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                    data-testid="todo-checkbox"
                    className="w-4 h-4 accent-indigo-500 cursor-pointer flex-shrink-0"
                  />
                  <span
                    data-testid="todo-text"
                    className={`flex-1 text-sm select-none ${
                      todo.completed
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    aria-label={`Delete "${todo.text}"`}
                    data-testid="delete-button"
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer: item count + clear completed */}
        {todos.length > 0 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <span
              className="text-xs text-gray-400 dark:text-gray-500"
              data-testid="active-count"
            >
              {activeCount} item{activeCount !== 1 ? 's' : ''} left
            </span>
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                data-testid="clear-completed"
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline-offset-2 hover:underline"
              >
                Clear Completed
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
