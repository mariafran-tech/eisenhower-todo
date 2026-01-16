import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://pbeqalshtkopahviussl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZXFhbHNodGtvcGFodml1c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MzU5MzQsImV4cCI6MjA4NDExMTkzNH0.um_Bl9uyy0HkJYAS7SeBQeLdwJpcZtE-pjIjqX3uZ5w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EisenhowerTodoApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);

  const defaultCategories = [
    { id: 'mwds', name: 'MWDs', color: '#8B5CF6', icon: '🐕' },
    { id: 'poa', name: 'POA Mission', color: '#EC4899', icon: '🎯' },
    { id: 'offsite', name: 'Leadership Offsite 2026', color: '#F59E0B', icon: '🏨' },
    { id: 'clinic', name: 'Clinic Management', color: '#10B981', icon: '🏥' },
    { id: 'personal', name: 'Personal', color: '#6B7280', icon: '👤' },
    { id: 'admin', name: 'Admin', color: '#3B82F6', icon: '📋' },
    { id: 'enrichment', name: 'Enrichment Project', color: '#14B8A6', icon: '🌱' },
    { id: 'education', name: 'Continuing Education', color: '#F97316', icon: '📚' },
    { id: 'misc', name: 'Miscellaneous', color: '#64748B', icon: '📌' },
  ];

  // Check for existing session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    // Load categories
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (catError) {
      console.error('Error loading categories:', catError);
    } else if (categoriesData.length === 0) {
      // First time user - insert default categories
      const categoriesToInsert = defaultCategories.map(cat => ({
        ...cat,
        user_id: user.id
      }));
      const { data: insertedCats, error: insertError } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
        .select();
      
      if (!insertError) {
        setCategories(insertedCats);
      }
    } else {
      setCategories(categoriesData);
    }

    // Load tasks
    const { data: tasksData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (taskError) {
      console.error('Error loading tasks:', taskError);
    } else {
      setTasks(tasksData);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthError('Check your email for the confirmation link!');
    }
    setAuthLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTasks([]);
    setCategories([]);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Eisenhower Todo</h1>
            <p className="text-gray-500 mt-2">Prioritize what matters</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                authMode === 'signin' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                authMode === 'signup' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <p className={`text-sm ${authError.includes('Check your email') ? 'text-green-600' : 'text-red-500'}`}>
                {authError}
              </p>
            )}

            <button
              onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
              disabled={authLoading}
              className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 transition-all"
            >
              {authLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [view, setView] = useState('matrix');
  const [showCalendar, setShowCalendar] = useState(false);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    urgency: 5,
    importance: 5,
    duration: 30,
    deadline: '',
    recurring: null,
    reminder: 'none',
    category: null
  });

  const getQuadrant = (urgency, importance) => {
    const urgentThreshold = 6;
    const importantThreshold = 6;
    
    if (urgency >= urgentThreshold && importance >= importantThreshold) return 1;
    if (urgency < urgentThreshold && importance >= importantThreshold) return 2;
    if (urgency >= urgentThreshold && importance < importantThreshold) return 3;
    return 4;
  };

  const getPriorityScore = (task) => {
    // Calculate priority score (0-100) based on urgency, importance, and deadline proximity
    const baseScore = (task.urgency * 5) + (task.importance * 5);
    
    // Add deadline bonus (up to 20 points for tasks due within 3 days)
    let deadlineBonus = 0;
    if (task.deadline) {
      const daysUntilDeadline = Math.max(0, (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline <= 3) {
        deadlineBonus = Math.round(20 * (1 - daysUntilDeadline / 3));
      }
    }
    
    return Math.min(100, baseScore + deadlineBonus);
  };

  const getPriorityLabel = (score) => {
    if (score >= 80) return { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700' };
    if (score >= 60) return { label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700' };
    if (score >= 40) return { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { label: 'Low', color: 'bg-green-500', textColor: 'text-green-700' };
  };

  const getTasksByCategory = (categoryId) => {
    return tasks
      .filter(task => task.category === categoryId && !task.completed)
      .sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
  };

  const getCategoryStats = (categoryId) => {
    const categoryTasks = tasks.filter(t => t.category === categoryId);
    const completed = categoryTasks.filter(t => t.completed).length;
    const total = categoryTasks.length;
    const q1Count = categoryTasks.filter(t => !t.completed && getQuadrant(t.urgency, t.importance) === 1).length;
    return { completed, total, q1Count };
  };

  const quadrantInfo = {
    1: { name: 'Do First', color: 'bg-red-500', lightColor: 'bg-red-50', borderColor: 'border-red-300', description: 'Urgent & Important', action: 'Handle immediately' },
    2: { name: 'Schedule', color: 'bg-blue-500', lightColor: 'bg-blue-50', borderColor: 'border-blue-300', description: 'Not Urgent & Important', action: 'Block dedicated time' },
    3: { name: 'Delegate', color: 'bg-yellow-500', lightColor: 'bg-yellow-50', borderColor: 'border-yellow-300', description: 'Urgent & Not Important', action: 'Batch or delegate' },
    4: { name: 'Eliminate', color: 'bg-gray-400', lightColor: 'bg-gray-50', borderColor: 'border-gray-300', description: 'Not Urgent & Not Important', action: 'Consider removing' }
  };

  const recurringOptions = [
    { value: null, label: 'One-time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const reminderOptions = [
    { value: 'none', label: 'No reminder' },
    { value: '15min', label: '15 minutes before' },
    { value: '30min', label: '30 minutes before' },
    { value: '1hour', label: '1 hour before' },
    { value: '1day', label: '1 day before' },
    { value: '1week', label: '1 week before' }
  ];

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTasksByQuadrant = (quadrant) => {
    return tasks
      .filter(task => !task.completed && getQuadrant(task.urgency, task.importance) === quadrant)
      .sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    
    const taskToInsert = {
      title: newTask.title,
      description: newTask.description || null,
      urgency: newTask.urgency,
      importance: newTask.importance,
      duration: newTask.duration,
      deadline: newTask.deadline || null,
      recurring: newTask.recurring,
      reminder: newTask.reminder,
      completed: false,
      category: newTask.category,
      user_id: user.id
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskToInsert])
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      showNotification('Error adding task');
      return;
    }
    
    setTasks([...tasks, data]);
    setNewTask({
      title: '',
      description: '',
      urgency: 5,
      importance: 5,
      duration: 30,
      deadline: '',
      recurring: null,
      reminder: 'none',
      category: null
    });
    setShowAddTask(false);
    
    showNotification(`Task "${data.title}" added to Q${getQuadrant(data.urgency, data.importance)}`);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'];
    const icons = ['📁', '📋', '🎯', '💼', '📊', '🔧', '📌', '⭐'];
    
    const newCategory = {
      id: newCategoryName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      name: newCategoryName,
      color: colors[categories.length % colors.length],
      icon: icons[categories.length % icons.length],
      user_id: user.id
    };
    
    const { data, error } = await supabase
      .from('categories')
      .insert([newCategory])
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      showNotification('Error adding category');
      return;
    }
    
    setCategories([...categories, data]);
    setNewCategoryName('');
    showNotification(`Category "${newCategoryName}" created!`);
  };

  const deleteCategory = async (categoryId) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      return;
    }

    setCategories(categories.filter(c => c.id !== categoryId));
    // Tasks will have category set to null by the database foreign key rule
    setTasks(tasks.map(t => t.category === categoryId ? { ...t, category: null } : t));
  };

  const toggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return;
    }

    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return;
    }

    setTasks(tasks.filter(task => task.id !== taskId));
    setSelectedTask(null);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const scheduleToCalendar = () => {
    const sortedTasks = [...tasks]
      .filter(t => !t.completed)
      .sort((a, b) => {
        const qA = getQuadrant(a.urgency, a.importance);
        const qB = getQuadrant(b.urgency, b.importance);
        if (qA !== qB) return qA - qB;
        return (b.urgency + b.importance) - (a.urgency + a.importance);
      });

    const events = [];
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0);
    
    if (currentTime < new Date()) {
      currentTime.setDate(currentTime.getDate() + 1);
    }

    sortedTasks.forEach(task => {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + task.duration * 60000);
      
      if (endTime.getHours() > 17) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(9, 0, 0, 0);
        startTime.setTime(currentTime.getTime());
        endTime.setTime(currentTime.getTime() + task.duration * 60000);
      }

      events.push({
        id: task.id,
        title: task.title,
        start: new Date(startTime),
        end: new Date(endTime),
        quadrant: getQuadrant(task.urgency, task.importance),
        recurring: task.recurring,
        reminder: task.reminder
      });

      currentTime = new Date(endTime.getTime() + 15 * 60000);
    });

    setScheduledEvents(events);
    setShowCalendar(true);
    showNotification(`${events.length} tasks scheduled to calendar!`);
  };

  const TaskCard = ({ task, compact = false, showCategory = true }) => {
    const quadrant = getQuadrant(task.urgency, task.importance);
    const info = quadrantInfo[quadrant];
    const priorityScore = getPriorityScore(task);
    const priority = getPriorityLabel(priorityScore);
    const category = categories.find(c => c.id === task.category);
    
    const borderColor = priority.color.replace('bg-', '').includes('red') ? '#EF4444' : 
                        priority.color.includes('orange') ? '#F97316' :
                        priority.color.includes('yellow') ? '#EAB308' : '#22C55E';
    
    return (
      <div 
        onClick={() => setSelectedTask(task)}
        className={`p-3 rounded-lg border-l-4 bg-white cursor-pointer hover:shadow-md transition-all ${task.completed ? 'opacity-50' : ''}`}
        style={{ borderLeftColor: borderColor }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleComplete(task.id);
                }}
                className="w-4 h-4 rounded"
              />
              <h4 className={`font-medium text-gray-800 truncate ${task.completed ? 'line-through' : ''}`}>
                {task.title}
              </h4>
            </div>
            {!compact && task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full text-white ${info.color}`}>
              Q{quadrant}
            </span>
            <span className="text-xs text-gray-500">{formatDuration(task.duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {showCategory && category && (
            <span 
              className="text-xs px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.icon} {category.name}
            </span>
          )}
          {task.deadline && (
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
              📅 {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          {task.recurring && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
              🔄 {task.recurring}
            </span>
          )}
          {task.reminder !== 'none' && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              🔔
            </span>
          )}
        </div>
      </div>
    );
  };

  const MatrixView = () => (
    <div className="grid grid-cols-2 gap-4 h-full">
      {[1, 2, 3, 4].map(q => {
        const info = quadrantInfo[q];
        const quadrantTasks = getTasksByQuadrant(q);
        
        return (
          <div key={q} className={`${info.lightColor} rounded-xl p-4 border-2 ${info.borderColor} flex flex-col`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${info.color}`}></span>
                  Q{q}: {info.name}
                </h3>
                <p className="text-xs text-gray-500">{info.description}</p>
              </div>
              <span className="text-sm font-medium text-gray-600">{quadrantTasks.length} tasks</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {quadrantTasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">No tasks</p>
              ) : (
                quadrantTasks.map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const ListView = () => {
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return getPriorityScore(b) - getPriorityScore(a);
    });

    return (
      <div className="space-y-3 overflow-y-auto">
        {sortedTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    );
  };

  const CategoryView = () => {
    const uncategorizedTasks = tasks.filter(t => !t.category && !t.completed);
    
    return (
      <div className="space-y-6">
        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(category => {
            const categoryTasks = getTasksByCategory(category.id);
            const stats = getCategoryStats(category.id);
            
            return (
              <div 
                key={category.id}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Category Header */}
                <div 
                  className="p-4 text-white"
                  style={{ backgroundColor: category.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg">{category.name}</h3>
                        <p className="text-white/80 text-sm">
                          {stats.completed}/{stats.total} completed
                          {stats.q1Count > 0 && (
                            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                              🔥 {stats.q1Count} urgent
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {/* Progress ring */}
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="white"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${(stats.completed / Math.max(stats.total, 1)) * 126} 126`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Task List */}
                <div className="p-4 max-h-80 overflow-y-auto">
                  {categoryTasks.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4 italic">
                      No active tasks in this category
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {/* Priority Legend */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 pb-2 border-b border-gray-100">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> High</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Medium</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Low</span>
                      </div>
                      
                      {categoryTasks.map((task, index) => {
                        const priorityScore = getPriorityScore(task);
                        const priority = getPriorityLabel(priorityScore);
                        const quadrant = getQuadrant(task.urgency, task.importance);
                        
                        return (
                          <div 
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all border-l-4"
                            style={{ borderLeftColor: priority.color.replace('bg-', '').includes('red') ? '#EF4444' : 
                                                       priority.color.includes('orange') ? '#F97316' :
                                                       priority.color.includes('yellow') ? '#EAB308' : '#22C55E' }}
                          >
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleComplete(task.id);
                              }}
                              className="w-4 h-4 rounded"
                            />
                            
                            {/* Task info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate">{task.title}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${quadrantInfo[quadrant].color}`}>
                                  Q{quadrant}
                                </span>
                                {task.deadline && (
                                  <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>
                                )}
                                <span>{formatDuration(task.duration)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Uncategorized Tasks */}
        {uncategorizedTasks.length > 0 && (
          <div className="bg-gray-100 rounded-xl p-4">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-xl">📋</span> Uncategorized Tasks
              <span className="text-sm font-normal text-gray-500">({uncategorizedTasks.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {uncategorizedTasks.map(task => (
                <TaskCard key={task.id} task={task} compact showCategory={false} />
              ))}
            </div>
          </div>
        )}
        
        {/* Add Category Button */}
        <button
          onClick={() => setShowCategoryManager(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span> Manage Categories
        </button>
      </div>
    );
  };

  const CalendarView = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">📅 Scheduled Calendar View</h3>
          <button 
            onClick={() => setShowCalendar(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Tasks
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => (
            <div key={idx} className="text-center">
              <div className="text-xs font-medium text-gray-500">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${idx === 0 ? 'text-blue-600' : 'text-gray-700'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
          {scheduledEvents.map(event => {
            const info = quadrantInfo[event.quadrant];
            return (
              <div 
                key={event.id} 
                className={`flex items-center gap-3 p-3 rounded-lg ${info.lightColor} border ${info.borderColor}`}
              >
                <div className={`w-2 h-full min-h-[40px] rounded-full ${info.color}`}></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{event.title}</div>
                  <div className="text-sm text-gray-500">
                    {event.start.toLocaleDateString()} • {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {event.recurring && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        🔄 {event.recurring}
                      </span>
                    )}
                    {event.reminder !== 'none' && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                        🔔 Reminder set
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <strong>✓ Google Calendar Integration:</strong> In production, these events would sync to your Google Calendar with proper OAuth authentication. Reminders would trigger as push notifications or emails.
          </p>
        </div>
      </div>
    );
  };

  const TaskDetail = ({ task }) => {
    const quadrant = getQuadrant(task.urgency, task.importance);
    const info = quadrantInfo[quadrant];
    const category = categories.find(c => c.id === task.category);
    const priorityScore = getPriorityScore(task);
    const priority = getPriorityLabel(priorityScore);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className={`${info.color} p-4 rounded-t-2xl`}>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Q{quadrant}: {info.name}</span>
              <button onClick={() => setSelectedTask(null)} className="text-white/80 hover:text-white text-2xl">
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
              {task.description && <p className="text-gray-600 mt-1">{task.description}</p>}
            </div>

            {/* Priority Score */}
            <div className={`p-3 rounded-lg ${priority.color.replace('bg-', 'bg-').replace('500', '100')} border ${priority.color.replace('bg-', 'border-').replace('500', '300')}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Priority Score</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${priority.textColor}`}>{priorityScore}</span>
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${priority.color}`}>{priority.label}</span>
                </div>
              </div>
            </div>

            {/* Category */}
            {category && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Category:</span>
                <span 
                  className="px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon} {category.name}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Urgency</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${task.urgency * 10}%` }}></div>
                  </div>
                  <span className="font-bold text-gray-700">{task.urgency}/10</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Importance</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.importance * 10}%` }}></div>
                  </div>
                  <span className="font-bold text-gray-700">{task.importance}/10</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">⏱️ Duration</span>
                <span className="font-medium">{formatDuration(task.duration)}</span>
              </div>
              {task.deadline && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">📅 Deadline</span>
                  <span className="font-medium">{new Date(task.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">🔄 Recurring</span>
                <span className="font-medium">{task.recurring || 'One-time'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">🔔 Reminder</span>
                <span className="font-medium">{reminderOptions.find(r => r.value === task.reminder)?.label}</span>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${info.lightColor} border ${info.borderColor}`}>
              <div className="text-sm font-medium text-gray-700">Recommended Action</div>
              <div className="text-gray-600">{info.action}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => toggleComplete(task.id)}
                className={`flex-1 py-2 rounded-lg font-medium ${task.completed ? 'bg-gray-200 text-gray-700' : 'bg-green-500 text-white'}`}
              >
                {task.completed ? 'Mark Incomplete' : '✓ Mark Complete'}
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddTaskModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-lg">➕ Add New Task</span>
            <button onClick={() => setShowAddTask(false)} className="text-white/80 hover:text-white text-2xl">
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency: {newTask.urgency}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newTask.urgency}
                onChange={(e) => setNewTask({ ...newTask, urgency: parseInt(e.target.value) })}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Importance: {newTask.importance}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newTask.importance}
                onChange={(e) => setNewTask({ ...newTask, importance: parseInt(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">This task will be placed in:</div>
            <div className="font-medium text-gray-800">
              Q{getQuadrant(newTask.urgency, newTask.importance)}: {quadrantInfo[getQuadrant(newTask.urgency, newTask.importance)].name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select
                value={newTask.duration}
                onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🔄 Recurring</label>
              <select
                value={newTask.recurring || ''}
                onChange={(e) => setNewTask({ ...newTask, recurring: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {recurringOptions.map(opt => (
                  <option key={opt.value || 'none'} value={opt.value || ''}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🔔 Reminder</label>
              <select
                value={newTask.reminder}
                onChange={(e) => setNewTask({ ...newTask, reminder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {reminderOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📁 Category</label>
            <select
              value={newTask.category || ''}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={addTask}
            disabled={!newTask.title.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      {notification && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {notification}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Eisenhower Matrix To-Do</h1>
                <p className="text-indigo-200 text-sm mt-1">
                  {completedCount}/{totalCount} tasks completed • Prioritize what matters
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-indigo-200 text-sm hidden sm:inline">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-all"
                >
                  Sign Out
                </button>
                <button
                  onClick={scheduleToCalendar}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  📅 Schedule All
                </button>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-all"
                >
                  + Add Task
                </button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setView('matrix'); setShowCalendar(false); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  view === 'matrix' && !showCalendar ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Matrix View
              </button>
              <button
                onClick={() => { setView('list'); setShowCalendar(false); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  view === 'list' && !showCalendar ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => { setView('category'); setShowCalendar(false); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  view === 'category' && !showCalendar ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                By Category
              </button>
              {scheduledEvents.length > 0 && (
                <button
                  onClick={() => setShowCalendar(true)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    showCalendar ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Calendar
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6" style={{ minHeight: '500px' }}>
            {showCalendar ? (
              <CalendarView />
            ) : view === 'matrix' ? (
              <MatrixView />
            ) : view === 'category' ? (
              <CategoryView />
            ) : (
              <ListView />
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Q1: Do First
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Q2: Schedule
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Q3: Delegate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> Q4: Eliminate
                </span>
              </div>
              <div className="text-gray-400">
                Click any task for details • Drag urgency/importance sliders to prioritize
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddTask && <AddTaskModal />}
      {selectedTask && <TaskDetail task={selectedTask} />}
      
      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-lg">📁 Manage Categories</span>
                <button onClick={() => setShowCategoryManager(false)} className="text-white/80 hover:text-white text-2xl">
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Add new category */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button
                  onClick={addCategory}
                  disabled={!newCategoryName.trim()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-purple-600"
                >
                  Add
                </button>
              </div>
              
              {/* Existing categories */}
              <div className="space-y-2">
                {categories.map(cat => {
                  const stats = getCategoryStats(cat.id);
                  return (
                    <div 
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{cat.name}</div>
                          <div className="text-xs text-gray-500">{stats.total} tasks • {stats.completed} completed</div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {categories.length === 0 && (
                <p className="text-center text-gray-400 py-4">No categories yet. Add one above!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EisenhowerTodoApp;
