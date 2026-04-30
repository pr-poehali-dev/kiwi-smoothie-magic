import { useState, useEffect, type FormEvent } from "react"
import func2url from "../../backend/func2url.json"
import Icon from "@/components/ui/icon"

const ADMIN_EMAIL = "maksimmmmmm12@gmail.com"

interface Event {
  id: number
  title: string
  description: string
  event_date: string | null
  location: string
  max_participants: number | null
  created_at: string
}

interface User {
  email: string
}

interface Props {
  user: User
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: Props) {
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    max_participants: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchEvents = async () => {
    setLoading(true)
    const res = await fetch(func2url.events, {
      headers: { "X-User-Email": user.email },
    })
    const data = await res.json()
    setEvents(data.events || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    const res = await fetch(func2url.events, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Email": user.email },
      body: JSON.stringify({
        ...form,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        event_date: form.event_date || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Ошибка")
    } else {
      setForm({ title: "", description: "", event_date: "", location: "", max_participants: "" })
      setShowForm(false)
      fetchEvents()
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить мероприятие?")) return
    setDeleting(id)
    await fetch(func2url.events, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-User-Email": user.email },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    fetchEvents()
  }

  const formatDate = (d: string | null) => {
    if (!d) return "Дата не указана"
    return new Date(d).toLocaleDateString("ru-RU", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <span className="font-sans text-lg font-bold">E</span>
            </div>
            <span className="font-sans text-lg font-semibold tracking-tight">EventPass</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-white/50 md:block">{user.email}</span>
            {isAdmin && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-xs text-white/70">
                Администратор
              </span>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 font-mono text-xs text-white/70 transition-all hover:bg-white/10"
            >
              <Icon name="LogOut" size={12} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page title */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1 font-mono text-xs text-white/40">/ Личный кабинет</p>
            <h1 className="font-sans text-4xl font-light tracking-tight md:text-5xl">Мероприятия</h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-sans text-sm font-medium text-black transition-all hover:bg-white/90"
            >
              <Icon name={showForm ? "X" : "Plus"} size={16} />
              {showForm ? "Отмена" : "Добавить"}
            </button>
          )}
        </div>

        {/* Add form (admin only) */}
        {isAdmin && showForm && (
          <div className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="mb-6 font-sans text-xl font-light">Новое мероприятие</h2>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block font-mono text-xs text-white/50">Название *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                  placeholder="Название мероприятия"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block font-mono text-xs text-white/50">Описание</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                  placeholder="Краткое описание"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs text-white/50">Дата и время</label>
                <input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-white/40 focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs text-white/50">Место проведения</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                  placeholder="Адрес или онлайн"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs text-white/50">Макс. участников</label>
                <input
                  type="number"
                  min={1}
                  value={form.max_participants}
                  onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                  placeholder="Без ограничений"
                />
              </div>
              {error && <p className="font-mono text-xs text-red-400 md:col-span-2">{error}</p>}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-white px-6 py-2.5 font-sans text-sm font-medium text-black transition-all hover:bg-white/90 disabled:opacity-50"
                >
                  {saving ? "Сохранение..." : "Создать мероприятие"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events list */}
        {loading ? (
          <div className="py-24 text-center font-mono text-sm text-white/40">Загрузка...</div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-white/10 py-24 text-center">
            <p className="mb-2 font-mono text-sm text-white/40">Мероприятий пока нет</p>
            {isAdmin && (
              <p className="font-mono text-xs text-white/25">Нажмите «Добавить», чтобы создать первое</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/8"
              >
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(ev.id)}
                    disabled={deleting === ev.id}
                    className="absolute right-4 top-4 rounded-lg p-1.5 text-white/20 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:opacity-100"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                )}
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Icon name="CalendarDays" size={18} />
                  </div>
                  <h3 className="font-sans text-lg font-light leading-snug">{ev.title}</h3>
                </div>
                {ev.description && (
                  <p className="mb-4 text-sm leading-relaxed text-white/60 line-clamp-2">{ev.description}</p>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs text-white/50">
                    <Icon name="Clock" size={11} />
                    {formatDate(ev.event_date)}
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-2 font-mono text-xs text-white/50">
                      <Icon name="MapPin" size={11} />
                      {ev.location}
                    </div>
                  )}
                  {ev.max_participants && (
                    <div className="flex items-center gap-2 font-mono text-xs text-white/50">
                      <Icon name="Users" size={11} />
                      До {ev.max_participants} участников
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
