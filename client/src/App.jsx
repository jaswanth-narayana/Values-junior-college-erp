import React, { useMemo, useRef, useState, useEffect } from 'react';
import { 
  LayoutDashboard, Settings, GraduationCap, Users, WalletCards, ClipboardCheck, 
  CalendarCheck, Bus, MessageSquareText, ShieldAlert, BarChart3, Bell, Menu, X, 
  Plus, Search, Download, Upload, IndianRupee, ChevronDown, LockKeyhole, Mail, 
  Eye, EyeOff, UserPlus, Receipt, BellRing, MoreHorizontal, Calendar, Trash2, Printer, Pencil, MapPin 
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { apiCall, apiUpload, login, logout, getUser, getToken, updateProfile, API_URL } from './api';
import logo from './logo.png';

const navy = '#071b35';
const nav = [
  ['Dashboard', LayoutDashboard],
  ['Admin Settings', Settings],
  ['Students', GraduationCap],
  ['Staff', Users],
  ['Fee Manager', WalletCards],
  ['Exam Manager', ClipboardCheck],
  ['Attendance', CalendarCheck],
  ['Transport', Bus],
  ['Communication', MessageSquareText],
  ['Complaints', ShieldAlert],
  ['Reports', BarChart3]
];

function Login({ go }) {
  const [show, setShow] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (forgot) {
      setForgot(false);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      go();
    } catch (err) {
      setError(err.message || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-navy p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <Brand />
        <div className="relative max-w-lg">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
            SMART CAMPUS ERP
          </span>
          <h1 className="mt-7 text-5xl font-black leading-tight">Everything your campus needs, beautifully connected.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Manage academics, students, fees, attendance and communication from one secure workspace.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">© 2026 Values Junior College. All Rights Reserved.</p>
      </section>
      
      <section className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-3xl font-black text-navy">{forgot ? 'Reset your password' : 'Welcome back'}</h2>
            <p className="mt-2 text-slate-500">
              {forgot ? 'We will send a secure reset link.' : 'Sign in to Values Junior College Management System.'}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 border border-rose-100">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Email or username</span>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                className="field py-3 pl-11" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          </label>
          
          {!forgot && (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type={show ? 'text' : 'password'} 
                    className="field py-3 pl-11" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-3.5 text-slate-400">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <button type="button" onClick={() => setForgot(true)} className="w-full text-right text-sm font-semibold text-sky-600">
                Forgot password?
              </button>
            </>
          )}

          <button className="btn w-full py-3.5" disabled={loading}>
            {loading ? 'Please wait...' : forgot ? 'Send Reset Link' : 'Sign In Securely'}
          </button>
          
          {forgot && (
            <button type="button" onClick={() => setForgot(false)} className="w-full text-sm">
              Back to sign in
            </button>
          )}
        </form>
      </section>
    </div>
  );
}

function Brand({ small = false }) {
  return (
    <div className="relative flex items-center justify-center gap-3">
      {small ? (
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500 text-xl font-black text-white">V</div>
      ) : (
        <img src={logo} alt="Values Junior College" className="h-10 object-contain bg-white px-2 py-0.5 rounded-lg" />
      )}
    </div>
  );
}

function ProfileModal({ close }) {
  const user = getUser() || { username: '', name: '', role: '' };
  const [username, setUsername] = useState(user.username || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotice('');
    setError('');
    try {
      const res = await updateProfile(username, password || null);
      setNotice(res.message || 'Credentials updated successfully.');
      setTimeout(() => {
        close();
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4">
        <div className="flex justify-between border-b pb-3">
          <b className="text-lg text-navy">Update Credentials</b>
          <button type="button" onClick={close} className="p-1"><X /></button>
        </div>

        {notice && (
          <div className="rounded-xl bg-sky-50 p-3 text-sm text-sky-800 border border-sky-100">
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 border border-rose-100">
            {error}
          </div>
        )}

        <label className="block text-left">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Username</span>
          <input
            type="text"
            className="field"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            placeholder="Enter new username"
          />
        </label>

        <label className="block text-left">
          <span className="mb-1 block text-xs font-semibold text-slate-600">New Password (Optional)</span>
          <input
            type="password"
            className="field"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter new password to change"
            minLength="5"
          />
          <small className="text-[10px] text-slate-400 mt-1 block">Leave empty to keep current password.</small>
        </label>

        <div className="flex justify-end gap-2 border-t pt-4 mt-6">
          <button type="button" onClick={close} className="btn2" disabled={loading}>Cancel</button>
          <button className="btn" disabled={loading}>{loading ? 'Updating...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}

function Shell({ active, setActive, children }) {
  const [open, setOpen] = useState(false);
  const [mini, setMini] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const user = getUser() || { name: 'Admin Staff', role: 'super_admin' };

  const fetchRequests = () => {
    if (user.role === 'super_admin') {
      apiCall('/admin/credential-requests')
        .then(res => setRequests(res.data || []))
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id) => {
    try {
      await apiCall(`/admin/credential-requests/${id}/approve`, 'POST');
      alert('Request approved successfully!');
      fetchRequests();
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await apiCall(`/admin/credential-requests/${id}/reject`, 'POST');
      alert('Request rejected.');
      fetchRequests();
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    }
  };

  const visibleNav = nav.filter(([n]) => {
    if (user.role === 'super_admin') {
      return true; // Founder sees everything
    }
    if (user.role === 'accountant') {
      return n === 'Dashboard' || n === 'Fee Manager';
    }
    if (user.role === 'teacher') {
      return n !== 'Admin Settings' && n !== 'Fee Manager';
    }
    return true;
  });

  return (
    <div>
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-navy transition-all ${open ? 'translate-x-0' : '-translate-x-full'} ${mini ? 'w-20' : 'w-64'} lg:translate-x-0`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Brand small={mini} />
          <button onClick={() => setOpen(false)} className="text-white lg:hidden">
            <X />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleNav.map(([n, I]) => (
            <button 
              key={n} 
              title={n} 
              onClick={() => { setActive(n); setOpen(false); }} 
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${active === n ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-white/10'} ${mini ? 'justify-center' : ''}`}
            >
              <I size={19} />
              {!mini && n}
            </button>
          ))}
        </nav>
        <button 
          onClick={logout} 
          className="m-3 rounded-xl border border-white/10 p-3 text-xs text-rose-300 hover:bg-rose-950/20"
        >
          Logout Session
        </button>
        <button onClick={() => setMini(!mini)} className="m-3 hidden rounded-xl border border-white/10 p-3 text-sm text-slate-300 lg:block">
          {mini ? '→' : 'Collapse sidebar'}
        </button>
      </aside>

      <header className={`fixed right-0 top-0 z-20 flex h-20 items-center justify-between border-b bg-white/90 px-4 backdrop-blur transition-all md:px-8 ${mini ? 'lg:left-20' : 'lg:left-64'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="lg:hidden">
            <Menu />
          </button>
          <div>
            <h1 className="text-xl font-bold text-navy">{active}</h1>
            <p className="hidden text-xs text-slate-500 sm:block">Values Junior College Management System</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <button 
              onClick={() => setBellOpen(!bellOpen)}
              className="relative rounded-xl border p-2.5 hover:bg-slate-50 transition-colors"
            >
              <Bell size={19} />
              {requests.length > 0 && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 z-50 w-80 rounded-2xl bg-white shadow-xl border p-4 max-h-[400px] overflow-y-auto">
                <div className="font-bold border-b pb-2 mb-2 text-sm text-navy">Notifications</div>
                {requests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No new credential update requests.</p>
                ) : (
                  requests.map(r => (
                    <div key={r.id} className="border-b py-3 last:border-0 text-left text-xs space-y-2">
                      <p className="font-semibold text-slate-700">
                        <span className="capitalize font-bold text-sky-600">{r.user_name}</span> ({r.user_role === 'teacher' ? 'Vice Principal' : r.user_role}) requested update:
                      </p>
                      <div className="bg-slate-50 p-2 rounded-lg text-slate-600 space-y-1 font-mono">
                        {r.requested_username && <div>Username: {r.requested_username}</div>}
                        {r.requested_password_hash && <div>Password: *******</div>}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleReject(r.id)} 
                          className="px-2.5 py-1 text-rose-600 font-bold hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(r.id)} 
                          className="px-2.5 py-1 text-emerald-600 font-bold hover:bg-emerald-50 rounded-lg border border-emerald-100 transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div 
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-xl border p-1.5 pr-2 cursor-pointer hover:bg-slate-50 transition-colors"
            title="Edit Profile & Credentials"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-xs font-bold text-white">
              {user.name.split(' ').map(x => x[0]).join('')}
            </span>
            <span className="hidden text-left md:block">
              <b className="block text-xs">{user.name}</b>
              <small className="capitalize text-slate-500">{user.role === 'teacher' ? 'Vice Principal' : user.role.replace('_', ' ')}</small>
            </span>
            <ChevronDown size={14} />
          </div>
        </div>
      </header>

      {profileOpen && <ProfileModal close={() => setProfileOpen(false)} />}

      <main className={`min-h-screen pt-20 transition-all ${mini ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="p-4 md:p-8">{children}</div>
        <footer className="border-t bg-white p-5 text-center text-xs text-slate-500">
          © 2026 Values Junior College. All Rights Reserved.
        </footer>
      </main>
    </div>
  );
}

const feeData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m, i) => ({
  m,
  c: [24, 29, 27, 34, 38, 36, 43][i],
  p: [12, 10, 11, 9, 8, 9, 8][i]
}));

function Dashboard({ setActive }) {
  const user = getUser() || { role: 'super_admin' };

  const [statsData, setStatsData] = useState({
    students: '0',
    staff: '0',
    feeCollection: '₹0.00',
    pendingFees: '₹0.00',
    attendance: '92.4%',
    messages: '0',
    complaints: '0'
  });

  useEffect(() => {
    apiCall('/dashboard')
      .then(res => {
        setStatsData({
          students: res.students?.toString() || '0',
          staff: res.staff?.toString() || '0',
          feeCollection: `₹${(res.feeCollection / 100000).toFixed(1)}L`,
          pendingFees: `₹${(res.pendingFees / 100000).toFixed(1)}L`,
          attendance: '94.2%', // Mocked or static average
          messages: '8', // Mocked or counted
          complaints: res.complaints?.toString() || '0'
        });
      })
      .catch(console.error);
  }, []);

  const stats = [
    ['Total Students', statsData.students, GraduationCap, 'blue', 'Students'],
    ['Total Staff', statsData.staff, Users, 'violet', 'Staff'],
    ['Fee Collection', statsData.feeCollection, IndianRupee, 'emerald', 'Fee Manager'],
    ['Pending Fees', statsData.pendingFees, WalletCards, 'amber', 'Fee Manager'],
    ['Today Attendance', statsData.attendance, CalendarCheck, 'cyan', 'Attendance'],
    ['Complaints', statsData.complaints, ShieldAlert, 'rose', 'Complaints']
  ].filter(([,,,, p]) => {
    if (user.role === 'super_admin') return true;
    if (user.role === 'accountant') return p === 'Fee Manager';
    if (user.role === 'teacher') return p !== 'Fee Manager';
    return true;
  });

  const quickActions = [
    ['Add Student', UserPlus, 'Students'],
    ['Fee Receipt', Receipt, 'Fee Manager'],
    ['Enter Marks', ClipboardCheck, 'Exam Manager'],
    ['Send Notice', BellRing, 'Communication']
  ].filter(([,, p]) => {
    if (user.role === 'super_admin') return true;
    if (user.role === 'accountant') return p === 'Fee Manager';
    if (user.role === 'teacher') return p !== 'Fee Manager';
    return true;
  });

  return (
    <>
      <div className="mb-7">
        <p className="text-sm font-semibold text-sky-600">
          {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h2 className="text-3xl font-black text-navy">Good morning, {user.name}.</h2>
        <p className="text-sm text-slate-500">Here is what is happening at Values Junior College today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([l, v, I, c]) => (
          <div className="card p-5" key={l}>
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700`}>
              <I size={21} />
            </div>
            <div className="mt-5 text-2xl font-black text-navy">{v}</div>
            <div className="text-sm text-slate-500">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {user.role !== 'teacher' && (
          <div className="card p-5 xl:col-span-2">
            <h3 className="font-bold">Fee Collection Overview</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={feeData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="m"/><YAxis/><Tooltip/><Area type="monotone" dataKey="c" stroke="#35a9e8" strokeWidth={3} fill="#dff3fd"/><Area type="monotone" dataKey="p" stroke="#f59e0b" fill="transparent"/></AreaChart></ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={`card p-5 ${user.role === 'teacher' ? 'xl:col-span-3' : ''}`}>
          <h3 className="font-bold">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {quickActions.map(([l, I, p]) => (
              <button onClick={() => setActive(p)} className="rounded-xl border p-4 text-left hover:bg-sky-50" key={l}>
                <I className="mb-3 text-sky-600" />
                <b className="text-xs">{l}</b>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="font-bold">Recent Activity</h3>
        {[
          'System database connected permanently.',
          'Firewall rules hardened to limit unauthorized access attempts.',
          'Weekly class timetable scheduling enabled in settings.'
        ].map(x => (
          <div className="border-b py-4 text-sm text-slate-600" key={x}>{x}</div>
        ))}
      </div>
    </>
  );
}

// Config mapping for lists
const config = {
  Students: [
    'Manage admissions, profiles and academic details.',
    'students',
    [['admission_number', 'Admission No.'], ['name', 'Student Name'], ['class_name', 'Class'], ['section_name', 'Section'], ['gender', 'Gender'], ['mobile', 'Mobile'], ['email', 'Email']]
  ],
  Staff: [
    'Manage faculty, departments and login access.',
    'staff',
    [['staff_code', 'Staff ID'], ['name', 'Staff Name'], ['qualification', 'Qualification'], ['department', 'Department'], ['subject', 'Subject'], ['mobile', 'Mobile']]
  ],
  'Fee Manager': [
    'Track payments and generate receipts.',
    'payments',
    [['receipt_number', 'Receipt No.'], ['student_name', 'Student Name'], ['admission_number', 'Admission No.'], ['amount_paid', 'Amount Paid'], ['payment_mode', 'Mode'], ['payment_date', 'Date']]
  ],
  'Exam Manager': [
    'Create exams, enter marks and publish report cards.',
    'exams',
    [['name', 'Exam Name'], ['class_name', 'Class'], ['subject_name', 'Subject'], ['maximum_marks', 'Max Marks'], ['exam_date', 'Exam Date']]
  ],
  Attendance: [
    'Record daily attendance and analyze presence.',
    'attendance',
    [['date', 'Date'], ['status', 'Status']]
  ],
  Transport: [
    'Manage buses, routes, stops and student allocation.',
    'transport',
    [['bus_number', 'Bus Number'], ['driver_name', 'Driver'], ['driver_mobile', 'Driver Mobile'], ['route_name', 'Route']]
  ],
  Communication: [
    'Publish notices and targeted campus messages.',
    'messages',
    [['subject', 'Subject'], ['body', 'Message Body'], ['audience_type', 'Audience']]
  ],
  Complaints: [
    'Track, assign and resolve concerns.',
    'complaints',
    [['complaint_code', 'Complaint Code'], ['subject', 'Subject'], ['description', 'Description'], ['status', 'Status']]
  ]
};

function Table({ cols, rows, onDelete, onEdit, onView, onTrack }) {
  const user = getUser() || { role: 'super_admin' };
  const canDelete = user.role === 'super_admin' || user.role === 'admin_staff';
  const hasActions = canDelete || rows.some(r => r.receipt_number) || onEdit || onView || onTrack;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {cols.map(([k, l]) => <th className="px-5 py-4" key={k}>{l}</th>)}
            {hasActions && <th className="px-5 py-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length + (hasActions ? 1 : 0)} className="text-center py-8 text-slate-400">
                No records found. Click 'Add New' to add entries.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr className="hover:bg-sky-50/40" key={r.id || i}>
                {cols.map(([k]) => (
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700" key={k}>
                    {k === 'status' ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {r[k]}
                      </span>
                    ) : k === 'payment_date' || k === 'exam_date' || k === 'joining_date' ? (
                      r[k] ? new Date(r[k]).toLocaleDateString() : '-'
                    ) : (
                      r[k] !== undefined && r[k] !== null ? String(r[k]) : '-'
                    )}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-3">
                      {onTrack && (
                        <button 
                          onClick={() => onTrack(r)} 
                          className="text-emerald-600 hover:text-emerald-800 p-1 inline-flex items-center"
                          title="Track Live Bus Location"
                        >
                          <MapPin size={16} />
                        </button>
                      )}
                      {onView && (
                        <button 
                          onClick={() => onView(r)} 
                          className="text-slate-600 hover:text-slate-800 p-1 inline-flex items-center"
                          title="View Student details & allocations"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(r)} 
                          className="text-sky-600 hover:text-sky-800 p-1 inline-flex items-center"
                          title="Edit Student"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {r.receipt_number && (
                        <a 
                          href={`${API_URL}/payments/${r.id}/receipt?authorization=${getToken()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:text-sky-800 p-1 inline-flex items-center"
                          title="Print / View Receipt"
                        >
                          <Printer size={16} />
                        </a>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => onDelete(r.id)} 
                          className="text-rose-500 hover:text-rose-700 p-1 inline-flex items-center"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function StudentEditModal({ student, onClose, onSave }) {
  const [name, setName] = useState(student.name || '');
  const [admissionNumber, setAdmissionNumber] = useState(student.admission_number || '');
  const [gender, setGender] = useState(student.gender || 'Male');
  const [mobile, setMobile] = useState(student.mobile || '');
  const [email, setEmail] = useState(student.email || '');
  const [fatherName, setFatherName] = useState(student.father_name || '');
  const [motherName, setMotherName] = useState(student.mother_name || '');
  const [parentMobile, setParentMobile] = useState(student.parent_mobile || '');
  const [address, setAddress] = useState(student.address || '');

  const [classId, setClassId] = useState(student.class_id || '');
  const [sectionId, setSectionId] = useState(student.section_id || '');
  
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiCall('/classes').then(res => setClassesList(res.data || [])).catch(console.error);
    apiCall('/sections').then(res => setSectionsList(res.data || [])).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall(`/students/${student.id}`, 'PUT', {
        name,
        admission_number: admissionNumber,
        gender,
        mobile,
        email,
        class_id: classId || null,
        section_id: sectionId || null,
        father_name: fatherName,
        mother_name: motherName,
        parent_mobile: parentMobile,
        address
      });
      alert('Student updated successfully.');
      onSave();
    } catch (err) {
      alert(err.message || 'Failed to update student.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sectionsList.filter(s => s.class_id === classId);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 space-y-4 text-left">
        <div className="flex justify-between border-b pb-3">
          <b className="text-lg text-navy">Edit Student Profile</b>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Student Name *</span>
            <input type="text" className="field" value={name} onChange={e => setName(e.target.value)} required />
          </label>

          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Admission Number *</span>
            <input type="text" className="field" value={admissionNumber} onChange={e => setAdmissionNumber(e.target.value)} required />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Class</span>
            <select className="field" value={classId} onChange={e => { setClassId(e.target.value); setSectionId(''); }}>
              <option value="">Select Class</option>
              {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Section</span>
            <select className="field" value={sectionId} onChange={e => setSectionId(e.target.value)}>
              <option value="">Select Section</option>
              {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Gender</span>
            <select className="field" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Mobile</span>
            <input type="text" className="field" value={mobile} onChange={e => setMobile(e.target.value)} />
          </label>

          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Email</span>
            <input type="email" className="field" value={email} onChange={e => setEmail(e.target.value)} />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Father's Name</span>
            <input type="text" className="field" value={fatherName} onChange={e => setFatherName(e.target.value)} />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Mother's Name</span>
            <input type="text" className="field" value={motherName} onChange={e => setMotherName(e.target.value)} />
          </label>

          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Parent Mobile</span>
            <input type="text" className="field" value={parentMobile} onChange={e => setParentMobile(e.target.value)} />
          </label>

          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Address</span>
            <textarea className="field h-20 py-2 resize-none" value={address} onChange={e => setAddress(e.target.value)} />
          </label>
        </div>

        <button className="btn w-full py-3" disabled={loading}>
          {loading ? 'Saving Changes...' : 'Save Student Details'}
        </button>
      </form>
    </div>
  );
}

function StudentDetailsModal({ student, onClose }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall('/student_fee_allocations')
      .then(res => {
        const list = res.data || [];
        const filtered = list.filter(a => a.student_id === student.id);
        setAllocations(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [student.id]);

  const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.total_amount || 0), 0);
  const totalPaid = allocations.reduce((sum, a) => sum + Number(a.paid_amount || 0), 0);
  const totalBalance = allocations.reduce((sum, a) => sum + Number(a.balance_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 space-y-6 text-left">
        <div className="flex justify-between border-b pb-3">
          <b className="text-lg text-navy">Student Information Hub</b>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X /></button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl grid grid-cols-2 gap-4 text-sm text-slate-700">
          <div className="col-span-2 border-b pb-2 mb-1">
            <h4 className="text-base font-bold text-navy">{student.name}</h4>
            <span className="text-xs text-slate-500">Class: {student.class_name || '-'} | Section: {student.section_name || '-'}</span>
          </div>

          <div className="col-span-2">
            <span className="block text-xs font-semibold text-slate-400">Admission Number</span>
            <b>{student.admission_number || '-'}</b>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Gender</span>
            <b>{student.gender || '-'}</b>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Mobile</span>
            <b>{student.mobile || '-'}</b>
          </div>
          <div className="col-span-2">
            <span className="block text-xs font-semibold text-slate-400">Email</span>
            <b>{student.email || '-'}</b>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Father's Name</span>
            <b>{student.father_name || '-'}</b>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Mother's Name</span>
            <b>{student.mother_name || '-'}</b>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Parent Mobile</span>
            <b>{student.parent_mobile || '-'}</b>
          </div>
          <div className="col-span-2">
            <span className="block text-xs font-semibold text-slate-400">Address</span>
            <b>{student.address || '-'}</b>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <h4 className="font-bold text-navy">Allocated Fees & Ledger Balance</h4>
            <div className="text-xs space-x-3 bg-slate-50 px-3 py-1.5 rounded-lg border">
              <span>Allocated: <b className="text-navy">₹{totalAllocated.toLocaleString()}</b></span>
              <span>Paid: <b className="text-emerald-700">₹{totalPaid.toLocaleString()}</b></span>
              <span>Balance: <b className="text-amber-700">₹{totalBalance.toLocaleString()}</b></span>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400 py-4 text-center">Fetching allocated fee structures...</p>
          ) : allocations.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center bg-slate-50 rounded-xl">No fee allocations found for this student.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Fee Type / Structure</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Amount Paid</th>
                    <th className="px-4 py-3">Pending Balance</th>
                    <th className="px-4 py-3">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allocations.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-700">{a.fee_type || 'Custom Allocation'}</td>
                      <td className="px-4 py-3 text-slate-600">₹{Number(a.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">₹{Number(a.paid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className={`px-4 py-3 font-bold ${Number(a.balance_amount) > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                        ₹{Number(a.balance_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Module({ type }) {
  const desc = type === 'Fee Manager' 
    ? 'Track fee structures, allocations, payments and receipts.' 
    : config[type][0];
    
  const endpoint = type === 'Fee Manager' ? 'payments' : config[type][1];
    
  const cols = type === 'Fee Manager'
    ? [['receipt_number', 'Receipt No.'], ['student_name', 'Student Name'], ['admission_number', 'Admission No.'], ['amount_paid', 'Amount Paid'], ['pending_amount', 'Pending Fee (Balance)'], ['payment_mode', 'Mode'], ['payment_date', 'Date']]
    : config[type][2];

  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null); // null, 'add', 'payment', 'allocate', {type: 'edit', student}, {type: 'view', student}
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);

  const fetchRows = () => {
    apiCall(`/${endpoint}`)
      .then(res => {
        setRows(res.data || []);
      })
      .catch(err => {
        setNotice('Failed to fetch data: ' + err.message);
      });
  };

  useEffect(() => {
    fetchRows();
    setNotice('');
    setModal(null);
  }, [type]);

  const handleExport = () => {
    window.open(`${API_URL}/${endpoint}/export?authorization=${getToken()}`, '_blank');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setNotice('Uploading & importing data...');
      const res = await apiUpload(`/${endpoint}/import`, file);
      setNotice(res.message || 'Import successful!');
      fetchRows();
    } catch (error) {
      setNotice(error.message || 'Import failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await apiCall(`/${endpoint}/${id}`, 'DELETE');
      setNotice('Record deleted successfully.');
      fetchRows();
    } catch (err) {
      setNotice('Failed to delete: ' + err.message);
    }
  };

  const handleEdit = (student) => {
    setModal({ type: 'edit', student });
  };

  const handleView = (student) => {
    setModal({ type: 'view', student });
  };

  const handleTrack = (bus) => {
    setModal({ type: 'track', bus });
  };

  const filteredRows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text ? rows.filter(r => 
      Object.values(r).some(v => String(v || '').toLowerCase().includes(text))
    ) : rows;
  }, [rows, query]);

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-navy">{type}</h2>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
        {type === 'Fee Manager' ? (
          <div className="flex gap-2">
            <button onClick={() => setModal('allocate')} className="btn2 border-sky-200 text-sky-700 hover:bg-sky-50">
              <Plus size={17} />Allocate Fee
            </button>
            <button onClick={() => setModal('payment')} className="btn">
              <Plus size={17} />Record Payment
            </button>
          </div>
        ) : (
          type !== 'Reports' && (
            <button onClick={() => setModal('add')} className="btn">
              <Plus size={17} />Add New
            </button>
          )
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input 
              className="field pl-9" 
              placeholder={'Search ' + type.toLowerCase()} 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <input 
              ref={fileRef} 
              className="hidden" 
              type="file" 
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
              onChange={handleImport} 
            />
            {(type === 'Students' || type === 'Staff') && (
              <>
                <button 
                  className="btn2 bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100" 
                  onClick={() => window.open(`${API_URL}/${endpoint}/import-template?authorization=${getToken()}`, '_blank')}
                >
                  <Download size={16} /> Download Template
                </button>
                <button className="btn2" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} /> Import Excel
                </button>
                {type === 'Students' && (
                  <button className="btn2" onClick={handleExport}>
                    <Download size={16} /> Export Excel
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {notice && (
          <div className="border-b bg-sky-50 px-5 py-3 text-sm text-sky-800">
            {notice}
          </div>
        )}

        <Table 
          cols={cols} 
          rows={filteredRows} 
          onDelete={handleDelete} 
          onEdit={type === 'Students' ? handleEdit : null}
          onView={type === 'Students' ? handleView : null}
          onTrack={type === 'Transport' ? handleTrack : null}
        />
      </div>

      {modal === 'payment' && (
        <PaymentModal
          close={() => setModal(null)}
          save={async (record) => {
            try {
              await apiCall('/payments', 'POST', record);
              setNotice('Fee payment recorded successfully.');
              setModal(null);
              fetchRows();
            } catch (err) {
              alert('Recording payment failed: ' + err.message);
            }
          }}
        />
      )}
      {modal === 'allocate' && (
        <AllocateFeeModal
          close={() => setModal(null)}
          save={async (record) => {
            try {
              await apiCall('/student_fee_allocations', 'POST', record);
              setNotice('Student fee allocated successfully.');
              setModal(null);
              fetchRows();
            } catch (err) {
              alert('Allocating fee failed: ' + err.message);
            }
          }}
        />
      )}
      {modal === 'add' && type === 'Exam Manager' && (
        <ExamAddModal
          close={() => setModal(null)}
          save={async (record) => {
            try {
              await apiCall('/exams', 'POST', record);
              setNotice('Exam created successfully.');
              setModal(null);
              fetchRows();
            } catch (err) {
              alert('Failed to save exam: ' + err.message);
            }
          }}
        />
      )}
      {modal === 'add' && type !== 'Exam Manager' && (
        <Modal 
          title={'Add ' + type} 
          cols={cols} 
          close={() => setModal(null)} 
          save={async (record) => {
            try {
              await apiCall(`/${endpoint}`, 'POST', record);
              setNotice('Record saved successfully.');
              setModal(null);
              fetchRows();
            } catch (err) {
              alert('Save failed: ' + err.message);
            }
          }} 
        />
      )}
      {modal?.type === 'edit' && (
        <StudentEditModal 
          student={modal.student} 
          onClose={() => setModal(null)} 
          onSave={() => { setModal(null); fetchRows(); }} 
        />
      )}
      {modal?.type === 'view' && (
        <StudentDetailsModal 
          student={modal.student} 
          onClose={() => setModal(null)} 
        />
      )}
      {modal?.type === 'track' && (
        <BusTrackingModal 
          bus={modal.bus} 
          onClose={() => setModal(null)} 
        />
      )}
    </>
  );
}

function BusTrackingModal({ bus, onClose }) {
  const [progress, setProgress] = useState(20);
  const [speed, setSpeed] = useState(35);
  const [nextStopIndex, setNextStopIndex] = useState(1);
  const [status, setStatus] = useState('On Time');
  const [pauseTicks, setPauseTicks] = useState(0);

  const stopsList = useMemo(() => {
    if (!bus.stops) return ['Main Terminal', 'Stop A', 'Stop B', 'College'];
    return bus.stops.split(',').map(s => s.trim()).filter(Boolean);
  }, [bus.stops]);

  useEffect(() => {
    const stopRatio = 100 / (stopsList.length - 1 || 1);

    const timer = setInterval(() => {
      if (pauseTicks > 0) {
        setPauseTicks(prev => prev - 1);
        setSpeed(0);
        setStatus('Boarding Passengers');
        return;
      }

      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setStatus('Arrived');
          setSpeed(0);
          return 100;
        }

        const nextProg = prev + 1;
        const nextIndex = Math.min(
          stopsList.length - 1,
          Math.floor(nextProg / stopRatio) + 1
        );
        setNextStopIndex(nextIndex);

        const currentStopIndex = Math.floor(nextProg / stopRatio);
        const reachedStopVal = currentStopIndex * stopRatio;
        
        if (Math.abs(nextProg - reachedStopVal) < 0.1 && currentStopIndex > 0 && currentStopIndex < stopsList.length) {
          setPauseTicks(3);
          setSpeed(0);
          return nextProg;
        }

        setStatus('On Time');
        setSpeed(s => {
          const delta = Math.floor(Math.random() * 5) - 2;
          const nextSpeed = Math.max(15, Math.min(55, s + delta));
          return Math.floor(nextSpeed);
        });

        return nextProg;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stopsList, pauseTicks]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 space-y-6 text-left">
        <div className="flex justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <b className="text-lg text-navy">Live Bus Tracker: {bus.bus_number}</b>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X /></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border">
            <span className="block text-slate-400 text-xs font-semibold">STATUS</span>
            <b className={`text-sm ${status === 'Arrived' ? 'text-emerald-600' : 'text-sky-600'}`}>{status}</b>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border">
            <span className="block text-slate-400 text-xs font-semibold">SPEED</span>
            <b className="text-sm text-navy">{speed} km/h</b>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border">
            <span className="block text-slate-400 text-xs font-semibold">NEXT STOP</span>
            <b className="text-sm text-navy truncate block">{stopsList[nextStopIndex] || 'College'}</b>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border">
            <span className="block text-slate-400 text-xs font-semibold">EST. ARRIVAL</span>
            <b className="text-sm text-navy">
              {status === 'Arrived' ? 'Now' : '15 mins'}
            </b>
          </div>
        </div>

        <div className="relative h-48 w-full rounded-2xl bg-slate-100 overflow-hidden border">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#071b35_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
          
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M 50 110 C 150 110, 200 40, 320 40 S 450 150, 580 110" 
              fill="none" 
              stroke="#cbd5e1" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            <path 
              d="M 50 110 C 150 110, 200 40, 320 40 S 450 150, 580 110" 
              fill="none" 
              stroke="#0ea5e9" 
              strokeWidth="6" 
              strokeDasharray="600"
              strokeDashoffset={600 - (600 * progress / 100)}
              strokeLinecap="round"
            />
          </svg>

          <div 
            className="absolute top-1/2 left-0 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-600 grid place-items-center text-white shadow-lg transition-all duration-1000 ease-out"
            style={{
              left: `${50 + (progress * 5.3)}px`,
              top: `${110 - (Math.sin((progress / 100) * Math.PI * 2) * 50)}px`
            }}
          >
            <Bus size={16} />
          </div>

          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg border text-[10px] font-bold text-slate-500 shadow-sm flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            GPS ACTIVE
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-navy text-sm">Route Progress & Stops</h4>
          <div className="relative flex justify-between items-center py-4 px-2">
            <div className="absolute left-0 right-0 h-1 bg-slate-200 top-1/2 -translate-y-1/2" />
            <div 
              className="absolute left-0 h-1 bg-sky-500 top-1/2 -translate-y-1/2 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
            
            {stopsList.map((stop, index) => {
              const stopRatio = 100 / (stopsList.length - 1 || 1);
              const isActive = progress >= index * stopRatio;
              return (
                <div key={stop} className="relative z-10 flex flex-col items-center">
                  <div 
                    className={`h-5 w-5 rounded-full border-2 grid place-items-center text-[10px] font-bold transition-all duration-300 ${
                      isActive 
                        ? 'border-sky-500 bg-sky-500 text-white' 
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="absolute top-7 text-[10px] font-medium text-slate-500 whitespace-nowrap text-center">
                    {stop}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t pt-4 flex justify-between items-center gap-4 text-sm text-slate-700">
          <div>
            <span className="block text-slate-400 text-xs font-semibold">DRIVER NAME</span>
            <b>{bus.driver_name || 'Not Assigned'}</b>
          </div>
          <div>
            <span className="block text-slate-400 text-xs font-semibold">CONTACT MOBILE</span>
            <b>{bus.driver_mobile || '-'}</b>
          </div>
          <button 
            type="button" 
            onClick={() => alert(`Calling driver ${bus.driver_name} at ${bus.driver_mobile}...`)}
            className="btn2 px-4 py-2 border-slate-200 hover:bg-slate-50"
            disabled={!bus.driver_mobile}
          >
            Call Driver
          </button>
        </div>
      </div>
    </div>
  );
}

function ExamAddModal({ close, save }) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiCall('/classes').then(res => setClassesList(res.data || [])).catch(console.error);
    apiCall('/subjects').then(res => setSubjectsList(res.data || [])).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classId || !subjectId) {
      alert('Please select a class and a subject.');
      return;
    }
    setLoading(true);
    try {
      await save({
        name,
        class_id: classId,
        subject_id: subjectId,
        maximum_marks: Number(maxMarks),
        exam_date: date
      });
    } catch (err) {
      alert(err.message || 'Failed to create exam.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-6 space-y-4 text-left">
        <div className="flex justify-between border-b pb-3">
          <b className="text-lg text-navy">Add New Exam</b>
          <button type="button" onClick={close} className="p-1 text-slate-400 hover:text-slate-600"><X /></button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Exam Name *</span>
            <input type="text" className="field" placeholder="e.g. Midterm Exams, Unit Test 1" value={name} onChange={e => setName(e.target.value)} required />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Class *</span>
            <select className="field" value={classId} onChange={e => setClassId(e.target.value)} required>
              <option value="">Select Class</option>
              {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Subject *</span>
            <select className="field" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
              <option value="">Select Subject</option>
              {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code || ''})</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Maximum Marks *</span>
            <input type="number" className="field" placeholder="e.g. 100" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} required />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Exam Date *</span>
            <input type="date" className="field" value={date} onChange={e => setDate(e.target.value)} required />
          </label>
        </div>

        <button className="btn w-full py-3" disabled={loading}>
          {loading ? 'Creating Exam...' : 'Create Exam'}
        </button>
      </form>
    </div>
  );
}

function Header({ title, desc, add }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-2xl font-black text-navy">{title}</h2>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      {add && (
        <button onClick={add} className="btn">
          <Plus size={17} />Add New
        </button>
      )}
    </div>
  );
}

function PaymentModal({ close, save }) {
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [allocations, setAllocations] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiCall('/students')
      .then(res => setStudentsList(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedStudent) {
      setAllocations([]);
      setSelectedAllocation('');
      return;
    }
    apiCall('/student_fee_allocations')
      .then(res => {
        const filtered = (res.data || []).filter(a => a.student_id === selectedStudent && Number(a.balance_amount) > 0);
        setAllocations(filtered);
        setSelectedAllocation('');
      })
      .catch(console.error);
  }, [selectedStudent]);

  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.student_code && s.student_code.toLowerCase().includes(search.toLowerCase())) ||
    s.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleAllocationChange = (e) => {
    const allocId = e.target.value;
    setSelectedAllocation(allocId);
    const alloc = allocations.find(a => a.id === allocId);
    if (alloc) {
      setAmount(alloc.balance_amount);
    } else {
      setAmount('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Please select a student.');
      return;
    }
    if (!selectedAllocation) {
      alert('Please select a fee structure.');
      return;
    }
    save({
      student_id: selectedStudent,
      allocation_id: selectedAllocation,
      amount_paid: Number(amount),
      payment_mode: mode,
      payment_date: date
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6">
        <div className="flex justify-between border-b pb-4 mb-4">
          <b className="text-lg text-navy">Record Fee Payment</b>
          <button type="button" onClick={close} className="p-1"><X /></button>
        </div>

        <div className="space-y-4">
          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Search Student</span>
            <input 
              type="text"
              placeholder="Search student by name or ID..."
              className="field mb-2"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="field"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              required
            >
              <option value="">Select Student</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.admission_number})
                </option>
              ))}
            </select>
          </label>

          {selectedStudent && (
            <label className="block text-left animate-fade-in">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Select Fee Structure / Pending Allocations</span>
              <select
                className="field"
                value={selectedAllocation}
                onChange={handleAllocationChange}
                required
              >
                <option value="">-- Choose Allocation --</option>
                {allocations.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.fee_type} (Pending: INR {Number(a.balance_amount).toFixed(2)})
                  </option>
                ))}
              </select>
              {allocations.length === 0 && (
                <span className="text-xs text-rose-500 mt-1 block">No pending fee allocations found for this student.</span>
              )}
            </label>
          )}

          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Amount Paid (INR)</span>
            <input
              type="number"
              className="field"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              min="1"
              placeholder="Enter amount to pay"
            />
          </label>

          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Payment Mode</span>
            <select
              className="field"
              value={mode}
              onChange={e => setMode(e.target.value)}
              required
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </label>

          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Payment Date</span>
            <input
              type="date"
              className="field"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4 mt-6">
          <button type="button" onClick={close} className="btn2">Cancel</button>
          <button className="btn" disabled={allocations.length === 0}>Record Payment</button>
        </div>
      </form>
    </div>
  );
}

function AllocateFeeModal({ close, save }) {
  const [studentsList, setStudentsList] = useState([]);
  const [feesList, setFeesList] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedFee, setSelectedFee] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  });
  
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiCall('/students').then(res => setStudentsList(res.data || [])).catch(console.error);
    apiCall('/fees').then(res => setFeesList(res.data || [])).catch(console.error);
  }, []);

  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.student_code && s.student_code.toLowerCase().includes(search.toLowerCase())) ||
    s.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleFeeChange = (e) => {
    const feeId = e.target.value;
    setSelectedFee(feeId);
    const feeObj = feesList.find(f => f.id === feeId);
    if (feeObj) {
      setTotalAmount(feeObj.amount || '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedFee) {
      alert('Please select a student and a fee structure.');
      return;
    }
    save({
      student_id: selectedStudent,
      fee_id: selectedFee,
      total_amount: Number(totalAmount),
      due_date: dueDate
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6">
        <div className="flex justify-between border-b pb-4 mb-4">
          <b className="text-lg text-navy">Allocate Student Fee (Pending)</b>
          <button type="button" onClick={close} className="p-1"><X /></button>
        </div>

        <div className="space-y-4">
          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Search Student</span>
            <input 
              type="text"
              placeholder="Search student by name or ID..."
              className="field mb-2"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="field"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              required
            >
              <option value="">Select Student</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.admission_number})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Fee Structure / Type</span>
            <select
              className="field"
              value={selectedFee}
              onChange={handleFeeChange}
              required
            >
              <option value="">Select Fee Type</option>
              {feesList.map(f => (
                <option key={f.id} value={f.id}>
                  {f.fee_type} (INR {Number(f.amount).toFixed(2)})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Total Allocated Amount (INR)</span>
            <input
              type="number"
              className="field"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              required
              min="1"
            />
          </label>

          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Payment Due Date</span>
            <input
              type="date"
              className="field"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4 mt-6">
          <button type="button" onClick={close} className="btn2">Cancel</button>
          <button className="btn">Allocate Fee</button>
        </div>
      </form>
    </div>
  );
}

function Modal({ title, cols, close, save }) {
  const [form, setForm] = useState(() => 
    Object.fromEntries(cols.map(([key]) => [key, key === 'status' ? 'Active' : '']))
  );

  const submit = e => {
    e.preventDefault();
    save(form);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white">
        <div className="flex justify-between border-b p-5">
          <b className="text-lg">{title}</b>
          <button type="button" onClick={close}><X /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {cols.map(([key, label]) => (
            <label key={key}>
              <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
              <input 
                className="field" 
                value={form[key] || ''} 
                onChange={e => setForm(current => ({ ...current, [key]: e.target.value }))} 
                required={key === cols[0][0] || key === 'name' || key === 'student' || key === 'subject'} 
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t p-5">
          <button type="button" onClick={close} className="btn2">Cancel</button>
          <button className="btn">Save Record</button>
        </div>
      </form>
    </div>
  );
}

// Sub-manager for Academic settings like classes, sections etc.
function AcademicSettingsManager({ title, endpoint, fields, onClose }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]); // for sections lookup
  const [academicYears, setAcademicYears] = useState([]); // for classes lookup

  const loadData = async () => {
    try {
      const res = await apiCall(`/${endpoint}`);
      setItems(res.data || []);
      
      // Load dependencies
      if (endpoint === 'sections') {
        const clsRes = await apiCall('/classes');
        setClasses(clsRes.data || []);
      } else if (endpoint === 'classes') {
        const ayRes = await apiCall('/academic_years');
        setAcademicYears(ayRes.data || []);
      }
    } catch (err) {
      setError('Error loading records: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [endpoint]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiCall(`/${endpoint}`, 'POST', form);
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to add item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;
    try {
      await apiCall(`/${endpoint}/${id}`, 'DELETE');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between border-b pb-4 mb-4">
          <h3 className="text-xl font-bold text-navy">Manage {title}</h3>
          <button onClick={onClose} className="p-1"><X /></button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleAdd} className="mb-6 grid gap-4 sm:grid-cols-3 items-end bg-slate-50 p-4 rounded-xl">
          {fields.map(f => (
            <label key={f.key} className="block text-left">
              <span className="mb-1 block text-xs font-semibold text-slate-600">{f.label}</span>
              {f.type === 'select' ? (
                <select 
                  className="field"
                  value={form[f.key] || ''}
                  onChange={e => setForm(c => ({ ...c, [f.key]: e.target.value }))}
                  required
                >
                  <option value="">Select option</option>
                  {f.key === 'class_id' ? (
                    classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  ) : f.key === 'academic_year_id' ? (
                    academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)
                  ) : null}
                </select>
              ) : (
                <input 
                  type={f.type || 'text'} 
                  className="field"
                  placeholder={f.label}
                  value={form[f.key] || ''}
                  onChange={e => setForm(c => ({ ...c, [f.key]: e.target.value }))}
                  required
                />
              )}
            </label>
          ))}
          <button className="btn py-2.5 h-[42px] sm:col-span-1">Add Setting</button>
        </form>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {fields.map(f => <th key={f.key} className="px-4 py-3 text-slate-600 font-semibold">{f.label}</th>)}
                <th className="px-4 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1} className="text-center py-6 text-slate-400">No records exist yet.</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    {fields.map(f => (
                      <td key={f.key} className="px-4 py-3 text-slate-700">
                        {f.key === 'class_id' ? (
                          classes.find(c => c.id === item.class_id)?.name || item.class_id
                        ) : f.key === 'academic_year_id' ? (
                          academicYears.find(ay => ay.id === item.academic_year_id)?.name || item.academic_year_id
                        ) : (
                          String(item[f.key] || '')
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Timetable manager sub-component
function TimetableScheduler({ onClose }) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [timetables, setTimetables] = useState([]);
  const [form, setForm] = useState({
    day_of_week: 'Monday',
    subject_id: '',
    teacher_id: '',
    start_time: '09:00',
    end_time: '10:00'
  });
  const [error, setError] = useState('');

  // Days of week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    // Load class, subjects, teachers
    apiCall('/classes').then(res => setClasses(res.data || [])).catch(console.error);
    apiCall('/subjects').then(res => setSubjects(res.data || [])).catch(console.error);
    apiCall('/staff').then(res => setTeachers(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      apiCall('/sections')
        .then(res => {
          // Filter sections by class_id
          const filtered = (res.data || []).filter(s => s.class_id === selectedClass);
          setSections(filtered);
          setSelectedSection('');
        })
        .catch(console.error);
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  const loadTimetable = () => {
    if (selectedClass && selectedSection) {
      apiCall('/timetables')
        .then(res => {
          // Filter by selected class & section
          const filtered = (res.data || []).filter(t => 
            t.class_id === selectedClass && t.section_id === selectedSection
          );
          setTimetables(filtered);
        })
        .catch(console.error);
    } else {
      setTimetables([]);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [selectedClass, selectedSection]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedClass || !selectedSection) {
      setError('Please select Class and Section first.');
      return;
    }
    try {
      await apiCall('/timetables', 'POST', {
        ...form,
        class_id: selectedClass,
        section_id: selectedSection
      });
      loadTimetable();
      setForm(prev => ({
        ...prev,
        subject_id: '',
        teacher_id: ''
      }));
    } catch (err) {
      setError(err.message || 'Conflict: Session schedule overlaps.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiCall(`/timetables/${id}`, 'DELETE');
      loadTimetable();
    } catch (err) {
      setError(err.message || 'Failed to delete slot.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between border-b pb-4 mb-4">
          <h3 className="text-xl font-bold text-navy flex items-center gap-2">
            <Calendar className="text-sky-500" /> Timetable Scheduler
          </h3>
          <button onClick={onClose} className="p-1"><X /></button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 bg-slate-50 p-4 rounded-xl mb-6">
          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Select Class</span>
            <select 
              className="field" 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">Choose Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-left">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Select Section</span>
            <select 
              className="field" 
              value={selectedSection} 
              disabled={!selectedClass}
              onChange={e => setSelectedSection(e.target.value)}
            >
              <option value="">Choose Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>

        {selectedClass && selectedSection && (
          <form onSubmit={handleAdd} className="mb-6 grid gap-4 sm:grid-cols-5 items-end bg-sky-50/50 p-4 border border-sky-100 rounded-xl">
            <label className="block text-left">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Day</span>
              <select 
                className="field"
                value={form.day_of_week}
                onChange={e => setForm(c => ({ ...c, day_of_week: e.target.value }))}
              >
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="block text-left">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Subject</span>
              <select 
                className="field"
                value={form.subject_id}
                onChange={e => setForm(c => ({ ...c, subject_id: e.target.value }))}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block text-left">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Teacher (Staff)</span>
              <select 
                className="field"
                value={form.teacher_id}
                onChange={e => setForm(c => ({ ...c, teacher_id: e.target.value }))}
                required
              >
                <option value="">Select Staff</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="block text-left">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Time Slot</span>
              <div className="flex items-center gap-1">
                <input 
                  type="time" 
                  className="field py-2 px-1 text-center" 
                  value={form.start_time} 
                  onChange={e => setForm(c => ({ ...c, start_time: e.target.value }))}
                  required
                />
                <span>-</span>
                <input 
                  type="time" 
                  className="field py-2 px-1 text-center" 
                  value={form.end_time} 
                  onChange={e => setForm(c => ({ ...c, end_time: e.target.value }))}
                  required
                />
              </div>
            </label>
            <button className="btn w-full py-2.5 h-[42px]">Schedule Slot</button>
          </form>
        )}

        <div className="border rounded-xl overflow-hidden mt-4">
          <table className="w-full text-left text-sm divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-600 font-semibold">Day</th>
                <th className="px-4 py-3 text-slate-600 font-semibold">Schedule Time</th>
                <th className="px-4 py-3 text-slate-600 font-semibold">Subject</th>
                <th className="px-4 py-3 text-slate-600 font-semibold">Teacher</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {timetables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    {!selectedClass || !selectedSection 
                      ? 'Please select Class and Section above to view timetable.' 
                      : 'No scheduled timetable classes exist for this section.'}
                  </td>
                </tr>
              ) : (
                [...timetables].sort((a,b) => {
                  const dDiff = days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week);
                  if (dDiff !== 0) return dDiff;
                  return String(a.start_time).localeCompare(String(b.start_time));
                }).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">{t.day_of_week}</td>
                    <td className="px-4 py-3 text-slate-600">{t.start_time} - {t.end_time}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {subjects.find(s => s.id === t.subject_id)?.name || t.subject_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {teachers.find(st => st.id === t.teacher_id)?.name || t.teacher_id}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(t.id)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState({
    college_name: 'Values Junior College',
    phone: '+91 40 2345 6789',
    email: 'office@values.edu',
    address: 'Hyderabad, Telangana, India',
    logo_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  
  // Manager modes
  const [activeManager, setActiveManager] = useState(null);

  useEffect(() => {
    apiCall('/college-settings')
      .then(res => {
        if (res) setSettings(res);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotice('');
    try {
      const updated = await apiCall('/college-settings', 'PUT', settings);
      setSettings(updated);
      setNotice('College branding settings saved successfully.');
    } catch (err) {
      setNotice('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Admin Settings" desc="Configure institution branding and academic structure." />
      <div className="card p-6">
        <h3 className="text-lg font-bold">College Profile & Branding</h3>
        <p className="text-xs text-slate-500">Changes apply throughout the ERP and generated documents.</p>
        
        {notice && (
          <div className="mt-4 rounded-xl bg-sky-50 p-4 text-sm text-sky-800 border border-sky-100">
            {notice}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="my-6 flex gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-navy text-3xl font-black text-white">V</div>
            <button type="button" className="btn2 self-center"><Upload size={16} /> Upload College Logo</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-left">
              <small className="block font-semibold text-slate-600 mb-1">College Name</small>
              <input 
                className="field" 
                value={settings.college_name || ''} 
                onChange={e => setSettings(c => ({ ...c, college_name: e.target.value }))}
                required
              />
            </label>
            <label className="block text-left">
              <small className="block font-semibold text-slate-600 mb-1">Phone</small>
              <input 
                className="field" 
                value={settings.phone || ''} 
                onChange={e => setSettings(c => ({ ...c, phone: e.target.value }))}
                required
              />
            </label>
            <label className="block text-left">
              <small className="block font-semibold text-slate-600 mb-1">Email</small>
              <input 
                className="field" 
                value={settings.email || ''} 
                onChange={e => setSettings(c => ({ ...c, email: e.target.value }))}
                required
              />
            </label>
            <label className="block text-left">
              <small className="block font-semibold text-slate-600 mb-1">Academic Year</small>
              <input 
                className="field" 
                defaultValue="2026-27"
                disabled
                title="Manage via Academic Years settings manager"
              />
            </label>
            <label className="sm:col-span-2 block text-left">
              <small className="block font-semibold text-slate-600 mb-1">Address</small>
              <textarea 
                className="field min-h-[80px]" 
                value={settings.address || ''} 
                onChange={e => setSettings(c => ({ ...c, address: e.target.value }))}
                required
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              <button 
                type="button" 
                className="btn2"
                onClick={() => setActiveManager({
                  title: 'Academic Years',
                  endpoint: 'academic_years',
                  fields: [
                    { key: 'name', label: 'Academic Year Name (e.g. 2026-27)' },
                    { key: 'start_date', label: 'Start Date', type: 'date' },
                    { key: 'end_date', label: 'End Date', type: 'date' }
                  ]
                })}
              >
                Academic Years
              </button>
              <button 
                type="button" 
                className="btn2"
                onClick={() => setActiveManager({
                  title: 'Classes',
                  endpoint: 'classes',
                  fields: [
                    { key: 'name', label: 'Class Name (e.g. Junior Inter)' },
                    { key: 'academic_year_id', label: 'Academic Year Link', type: 'select' }
                  ]
                })}
              >
                Classes
              </button>
              <button 
                type="button" 
                className="btn2"
                onClick={() => setActiveManager({
                  title: 'Sections',
                  endpoint: 'sections',
                  fields: [
                    { key: 'name', label: 'Section Name (e.g. Section A)' },
                    { key: 'class_id', label: 'Class Link', type: 'select' }
                  ]
                })}
              >
                Sections
              </button>
              <button 
                type="button" 
                className="btn2"
                onClick={() => setActiveManager({
                  title: 'Courses',
                  endpoint: 'courses',
                  fields: [
                    { key: 'name', label: 'Course Name (e.g. MPC)' },
                    { key: 'code', label: 'Course Code' }
                  ]
                })}
              >
                Courses
              </button>
              <button 
                type="button" 
                className="btn2"
                onClick={() => setActiveManager({
                  title: 'Subjects',
                  endpoint: 'subjects',
                  fields: [
                    { key: 'name', label: 'Subject Name' },
                    { key: 'code', label: 'Subject Code' }
                  ]
                })}
              >
                Subjects
              </button>
              
              <button 
                type="button" 
                className="btn bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5"
                onClick={() => setActiveManager({ isTimetable: true })}
              >
                <Calendar size={15} /> Weekly Timetable
              </button>
            </div>
            
            <button className="btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save branding Settings'}
            </button>
          </div>
        </form>
      </div>

      {activeManager && activeManager.isTimetable && (
        <TimetableScheduler onClose={() => setActiveManager(null)} />
      )}

      {activeManager && !activeManager.isTimetable && (
        <AcademicSettingsManager 
          title={activeManager.title}
          endpoint={activeManager.endpoint}
          fields={activeManager.fields}
          onClose={() => setActiveManager(null)}
        />
      )}
    </>
  );
}

function ReportsPage() {
  const [financialData, setFinancialData] = useState({
    totalPaid: '₹0.00',
    totalPending: '₹0.00',
    totalAllocated: '₹0.00'
  });
  const [studentStats, setStudentStats] = useState({
    total: 0,
    boys: 0,
    girls: 0
  });

  useEffect(() => {
    apiCall('/dashboard')
      .then(res => {
        const fc = Number(res.feeCollection || 0);
        const p = Number(res.pendingFees || 0);
        setFinancialData({
          totalPaid: `₹${fc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          totalPending: `₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          totalAllocated: `₹${(fc + p).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        });
      })
      .catch(console.error);

    apiCall('/students')
      .then(res => {
        const list = res.data || [];
        const total = list.length;
        const boys = list.filter(s => s.gender === 'Male' || s.gender === 'M').length;
        const girls = list.filter(s => s.gender === 'Female' || s.gender === 'F').length;
        setStudentStats({ total, boys, girls });
      })
      .catch(console.error);
  }, []);

  const handleExportStudents = () => {
    window.open(`${API_URL}/students/export?authorization=${getToken()}`, '_blank');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-navy">Analytical Reports</h2>
        <p className="text-sm text-slate-500">Download Excel spreadsheets and view campus performance insights.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Academic Reports Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600">
              <GraduationCap size={20} />
            </div>
            <div>
              <b className="block text-navy">Academic & Enrollment Reports</b>
              <small className="text-slate-400 text-xs">Total student counts, demographics, and registration lists</small>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Total Students Enrolled:</span>
              <strong className="text-navy">{studentStats.total}</strong>
            </div>
            <div className="flex justify-between">
              <span>Male Students:</span>
              <strong className="text-navy">{studentStats.boys}</strong>
            </div>
            <div className="flex justify-between">
              <span>Female Students:</span>
              <strong className="text-navy">{studentStats.girls}</strong>
            </div>
          </div>

          <button onClick={handleExportStudents} className="btn w-full">
            <Download size={16} className="mr-2 inline" /> Export Student Enrollment Register
          </button>
        </div>

        {/* Financial Reports Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <WalletCards size={20} />
            </div>
            <div>
              <b className="block text-navy">Financial Ledger Reports</b>
              <small className="text-slate-400 text-xs">Fee collection overview and pending balance registers</small>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Total Fees Allocated:</span>
              <strong className="text-navy">{financialData.totalAllocated}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Fees Collected:</span>
              <strong className="text-emerald-700">{financialData.totalPaid}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Pending Fees:</span>
              <strong className="text-amber-700">{financialData.totalPending}</strong>
            </div>
          </div>

          <button 
            onClick={() => window.open(`${API_URL}/payments/export?authorization=${getToken()}`, '_blank')}
            className="btn w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Download size={16} className="mr-2 inline" /> Export Complete Payments Ledger
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [logged, setLogged] = useState(false);
  const [active, setActive] = useState('Dashboard');

  useEffect(() => {
    const token = getToken();
    if (token) {
      setLogged(true);
      const currUser = getUser();
      if (currUser) {
        if (currUser.role === 'accountant') {
          setActive('Fee Manager');
        } else if (currUser.role === 'teacher') {
          setActive('Students');
        } else {
          setActive('Dashboard');
        }
      }
    }
  }, [logged]);

  if (!logged) {
    return <Login go={() => setLogged(true)} />;
  }

  return (
    <Shell active={active} setActive={setActive}>
      {active === 'Dashboard' ? (
        <Dashboard setActive={setActive} />
      ) : active === 'Admin Settings' ? (
        <SettingsPage />
      ) : active === 'Reports' ? (
        <ReportsPage />
      ) : (
        <Module type={active} />
      )}
    </Shell>
  );
}