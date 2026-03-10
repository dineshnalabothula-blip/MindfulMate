import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Smile, 
  Frown, 
  Zap, 
  Coffee, 
  Music,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, isSameDay } from 'date-fns';
import { cn } from './lib/utils';
import { generateMoodMessage, Mood, ReminderMessage } from './services/geminiService';

interface Reminder {
  id: string;
  title: string;
  time: string; // HH:mm
  days: string[]; // ['Mon', 'Tue', ...]
  type: 'belonging' | 'action';
  active: boolean;
  lastTriggered?: string; // ISO date
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function App() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('mindful-reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [mood, setMood] = useState<Mood>('neutral');
  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    time: '08:00',
    days: [],
    type: 'belonging',
    active: true
  });
  const [activeNotification, setActiveNotification] = useState<{
    reminder: Reminder;
    content: ReminderMessage;
  } | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('mindful-reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Scheduler Logic
  const checkReminders = useCallback(async () => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const currentDay = format(now, 'EEE');

    const dueReminders = reminders.filter(r => {
      if (!r.active) return false;
      if (r.time !== currentTime) return false;
      if (r.days.length > 0 && !r.days.includes(currentDay)) return false;
      
      // Prevent double triggering in the same minute
      if (r.lastTriggered) {
        const last = new Date(r.lastTriggered);
        if (now.getTime() - last.getTime() < 60000) return false;
      }
      return true;
    });

    for (const r of dueReminders) {
      const content = await generateMoodMessage(r.title, mood, r.type);
      setActiveNotification({ reminder: r, content });
      
      // Update last triggered
      setReminders(prev => prev.map(item => 
        item.id === r.id ? { ...item, lastTriggered: new Date().toISOString() } : item
      ));
    }
  }, [reminders, mood]);

  useEffect(() => {
    const interval = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [checkReminders]);

  const addReminder = () => {
    if (!newReminder.title) return;
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      title: newReminder.title!,
      time: newReminder.time!,
      days: newReminder.days!,
      type: newReminder.type!,
      active: true
    };
    setReminders([...reminders, reminder]);
    setIsAdding(false);
    setNewReminder({ title: '', time: '08:00', days: [], type: 'belonging', active: true });
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const toggleDay = (day: string) => {
    const currentDays = newReminder.days || [];
    if (currentDays.includes(day)) {
      setNewReminder({ ...newReminder, days: currentDays.filter(d => d !== day) });
    } else {
      setNewReminder({ ...newReminder, days: [...currentDays, day] });
    }
  };

  const moodOptions: { id: Mood; icon: any; label: string; color: string }[] = [
    { id: 'cool', icon: Zap, label: 'Cool', color: 'text-blue-400' },
    { id: 'boring', icon: Coffee, label: 'Boring', color: 'text-stone-400' },
    { id: 'anger', icon: AlertCircle, label: 'Anger', color: 'text-red-400' },
    { id: 'hurry', icon: Clock, label: 'Hurry', color: 'text-orange-400' },
    { id: 'sad', icon: Frown, label: 'Sad', color: 'text-indigo-400' },
    { id: 'neutral', icon: Smile, label: 'Neutral', color: 'text-green-400' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 min-h-screen">
      {/* Header */}
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/20 border border-orange-500/30 mb-4 animate-float"
        >
          <Bell className="w-8 h-8 text-orange-500" />
        </motion.div>
        <h1 className="text-4xl font-serif font-medium tracking-tight mb-2">MindfulMate</h1>
        <p className="text-white/60 text-sm uppercase tracking-widest">Your Smart Companion & Guider</p>
      </header>

      {/* Mood Selector */}
      <section className="mb-12">
        <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Heart className="w-3 h-3" /> How are you feeling right now?
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {moodOptions.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl transition-all border",
                mood === m.id 
                  ? "bg-white/10 border-white/20 scale-105 shadow-xl" 
                  : "bg-white/5 border-transparent hover:bg-white/10"
              )}
            >
              <m.icon className={cn("w-6 h-6 mb-2", mood === m.id ? m.color : "text-white/40")} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Reminders List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif">Your Schedule</h2>
          <div className="flex gap-4">
            {reminders.length > 0 && (
              <button 
                onClick={() => setReminders([])}
                className="text-xs font-mono uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            )}
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {reminders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass p-12 text-center text-white/40"
            >
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No reminders set yet. Start by adding one!</p>
            </motion.div>
          ) : (
            reminders.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    r.type === 'belonging' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                  )}>
                    {r.type === 'belonging' ? <Zap className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{r.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-white/40 font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.time}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> 
                        {r.days.length === 7 ? 'Daily' : r.days.length === 0 ? 'Once' : r.days.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={async () => {
                      const content = await generateMoodMessage(r.title, mood, r.type);
                      setActiveNotification({ reminder: r, content });
                    }}
                    className="p-2 text-white/20 hover:text-orange-400 transition-colors"
                    title="Test Reminder"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => deleteReminder(r.id)}
                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </section>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-dark w-full max-w-md p-8 relative z-10"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-serif mb-6">New Reminder</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">What to remember?</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Physics Notebook"
                    className="input-field"
                    value={newReminder.title}
                    onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">Time</label>
                    <input 
                      type="time" 
                      className="input-field"
                      value={newReminder.time}
                      onChange={e => setNewReminder({...newReminder, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">Type</label>
                    <select 
                      className="input-field appearance-none"
                      value={newReminder.type}
                      onChange={e => setNewReminder({...newReminder, type: e.target.value as any})}
                    >
                      <option value="belonging">Belonging</option>
                      <option value="action">Action / Task</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">Repeat on</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all",
                          newReminder.days?.includes(day)
                            ? "bg-orange-600 border-orange-500 text-white"
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={addReminder}
                  className="btn-primary w-full mt-4"
                >
                  Create Reminder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Overlay */}
      <AnimatePresence>
        {activeNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-orange-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="glass-dark w-full max-w-lg p-10 relative z-10 text-center border-orange-500/20"
            >
              <div className="w-20 h-20 rounded-full bg-orange-600/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Bell className="w-10 h-10 text-orange-500" />
              </div>
              
              <div className="mb-8">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-orange-500 mb-2 block">
                  {activeNotification.content.vibe}
                </span>
                <h2 className="text-3xl font-serif mb-4 leading-tight">
                  {activeNotification.content.message}
                </h2>
              </div>

              <div className="glass bg-white/5 p-6 rounded-2xl mb-8 flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-400">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Suggested Vibe</p>
                  <p className="font-medium">{activeNotification.content.songSuggestion}</p>
                </div>
                <Volume2 className="w-5 h-5 ml-auto text-white/20" />
              </div>

              <button 
                onClick={() => setActiveNotification(null)}
                className="btn-primary w-full"
              >
                Got it, thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="mt-20 pt-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
          MindfulMate • Your personal guider for a busy life
        </p>
      </footer>
    </div>
  );
}
