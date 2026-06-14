import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getTokens } from '../utils/api';
import { 
  Plus, Upload, Receipt, DollarSign, ArrowLeftRight, Users, 
  Settings, CheckCircle, Info, Calendar, Trash2, Edit 
} from 'lucide-react';

// Import modals
import ExpenseModal from '../components/ExpenseModal';
import SettlementModal from '../components/SettlementModal';
import MembersModal from '../components/MembersModal';

interface Expense {
  id: string;
  description: string;
  amount: string;
  currency: string;
  exchangeRate: string | null;
  amountInr: string;
  paidBy: { id: string; name: string };
  splitType: string;
  date: string;
  notes: string | null;
  splits: { userId: string; amountInr: string; rawValue: string }[];
}

interface Settlement {
  id: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
  amount: string;
  date: string;
  notes: string | null;
}

export default function GroupDashboard() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = getTokens();
  
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balancesData, setBalancesData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab state: expenses, balances, settlements, members
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements' | 'members'>('expenses');

  // Modal control states
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined);
  
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | undefined>(undefined);

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(undefined);

  // Rohan's audit state
  const [auditUserId, setAuditUserId] = useState<string | null>(null);

  const fetchGroupDetails = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const groupInfo = await api.get(`/groups/${groupId}`);
      setGroup(groupInfo);
      
      const [expData, setDataSettlements, balances] = await Promise.all([
        api.get(`/expenses?groupId=${groupId}`),
        api.get(`/settlements?groupId=${groupId}`),
        api.get(`/groups/${groupId}/balances`)
      ]);

      setExpenses(expData);
      setSettlements(setDataSettlements);
      setBalancesData(balances);
    } catch (err: any) {
      setError(err.message || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const handleExpenseSuccess = () => {
    setExpenseModalOpen(false);
    setSelectedExpense(undefined);
    fetchGroupDetails();
  };

  const handleSettlementSuccess = () => {
    setSettlementModalOpen(false);
    setSelectedSettlement(undefined);
    fetchGroupDetails();
  };

  const handleMemberSuccess = () => {
    setMembersModalOpen(false);
    setSelectedMember(undefined);
    fetchGroupDetails();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchGroupDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleDeleteSettlement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this settlement record?')) return;
    try {
      await api.delete(`/settlements/${id}`);
      fetchGroupDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to delete settlement');
    }
  };

  if (loading && !group) {
    return <p style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading group details...</p>;
  }

  if (error && !group) {
    return (
      <div className="main-content">
        <Link to="/" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeftRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Dashboard
        </Link>
        <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '1rem', textAlign: 'left' }}>
          {error}
        </div>
      </div>
    );
  }

  // Get current user's balance
  const userAudit = balancesData?.memberAudits?.[user?.id];
  const userBalance = userAudit?.netBalance || 0;

  return (
    <div className="main-content">
      {/* Header section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', marginBottom: '0.75rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '2.75rem', margin: '0 0 0.5rem 0', fontWeight: 800, letterSpacing: '-0.02em' }}>{group.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem', lineHeight: '1.5' }}>{group.description || 'No description provided.'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span 
              className="badge badge-info" 
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} 
              onClick={() => setActiveTab('members')}
              title="Click to view timeline settings"
            >
              <Users size={14} />
              {group.members.length} members
            </span>
            <button 
              onClick={() => { setSelectedMember(undefined); setMembersModalOpen(true); }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              <Plus size={14} /> Add Member
            </button>
          </div>
        </div>

        {/* Dashboard statistics card */}
        <div className="card" style={{ padding: '1.25rem 2rem', display: 'flex', gap: '2.5rem', marginBottom: 0, alignItems: 'center', backgroundColor: 'rgba(17, 24, 39, 0.4)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Your Balance</span>
            <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', fontWeight: 700, color: userBalance > 0 ? 'var(--success)' : userBalance < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {userBalance > 0 ? '+' : ''}₹{userBalance.toFixed(2)}
            </h2>
          </div>
          <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'var(--border-color)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Spend</span>
            <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', fontWeight: 700 }}>
              ₹{expenses.reduce((s, e) => s + Number(e.amountInr), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div style={{ display: 'flex', background: 'rgba(17, 24, 39, 0.4)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2.5rem', gap: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('expenses')}
          className="btn"
          style={{ 
            flex: '1 1 auto', 
            background: activeTab === 'expenses' ? 'var(--primary-gradient)' : 'transparent', 
            color: activeTab === 'expenses' ? 'white' : 'var(--text-secondary)',
            boxShadow: activeTab === 'expenses' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.25rem'
          }}
        >
          <Receipt size={16} /> Expenses
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className="btn"
          style={{ 
            flex: '1 1 auto', 
            background: activeTab === 'balances' ? 'var(--primary-gradient)' : 'transparent', 
            color: activeTab === 'balances' ? 'white' : 'var(--text-secondary)',
            boxShadow: activeTab === 'balances' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.25rem'
          }}
        >
          <ArrowLeftRight size={16} /> Balances & Settle Up
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className="btn"
          style={{ 
            flex: '1 1 auto', 
            background: activeTab === 'settlements' ? 'var(--primary-gradient)' : 'transparent', 
            color: activeTab === 'settlements' ? 'white' : 'var(--text-secondary)',
            boxShadow: activeTab === 'settlements' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.25rem'
          }}
        >
          <DollarSign size={16} /> Settlements Log
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className="btn"
          style={{ 
            flex: '1 1 auto', 
            background: activeTab === 'members' ? 'var(--primary-gradient)' : 'transparent', 
            color: activeTab === 'members' ? 'white' : 'var(--text-secondary)',
            boxShadow: activeTab === 'members' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.25rem'
          }}
        >
          <Users size={16} /> Timeline Settings
        </button>
      </div>

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 600 }}>Shared Bills ({expenses.length})</h3>
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <Link to={`/groups/${groupId}/import`} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                <Upload size={14} /> Import CSV
              </Link>
              <button onClick={() => { setSelectedExpense(undefined); setExpenseModalOpen(true); }} className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                <Plus size={14} /> Record Shared Expense
              </button>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed', backgroundColor: 'transparent' }}>
              <Receipt size={40} style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', strokeWidth: 1.5 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No expenses recorded yet in this group.</p>
              <button onClick={() => setExpenseModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '1.25rem' }}>
                Create First Expense
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Payer</th>
                    <th>Split Type</th>
                    <th>Total Amount</th>
                    <th>Amount in INR</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(exp.date).toISOString().slice(0, 10)}</td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{exp.description}</strong>
                        {exp.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>{exp.notes}</p>}
                      </td>
                      <td style={{ fontWeight: 500 }}>{exp.paidBy.name}</td>
                      <td><span className="badge badge-info" style={{ textTransform: 'lowercase', fontSize: '0.7rem' }}>{exp.splitType}</span></td>
                      <td className="currency-symbol" style={{ fontWeight: 600 }}>
                        {exp.currency === 'USD' ? '$' : '₹'}{Number(exp.amount).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{Number(exp.amountInr).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => { setSelectedExpense(exp); setExpenseModalOpen(true); }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BALANCES TAB */}
      {activeTab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.25s ease-out' }}>
          <div className="grid-2">
            {/* Aisha's Simplified view */}
            <div className="card" style={{ height: '100%' }}>
              <h3 className="card-title">
                <span>Simplified Settle Up</span>
                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                The minimum number of transactions needed to settle all flat debts.
              </p>

              {balancesData?.simplifiedSettlements?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CheckCircle size={36} style={{ marginBottom: '0.75rem', strokeWidth: 1.5 }} />
                  <p style={{ fontWeight: 600, fontSize: '1rem' }}>All settled! No one owes anything.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {balancesData?.simplifiedSettlements?.map((s: any, idx: number) => (
                    <div key={idx} className="card" style={{ padding: '1rem 1.25rem', marginBottom: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.95rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{s.fromUserName}</strong> owes <strong style={{ color: 'var(--text-primary)' }}>{s.toUserName}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>₹{s.amount.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            setSelectedSettlement(undefined);
                            setSettlementModalOpen(true);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.4rem 0.85rem' }}
                        >
                          Settle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Individual balances list with Rohan's Audit capability */}
            <div className="card" style={{ height: '100%' }}>
              <h3 className="card-title">
                <span>Group Balance Summary</span>
                <Users size={18} style={{ color: 'var(--info)' }} />
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Hover or click <b>Audit</b> to see exactly which expenses make up a member's balance.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.values(balancesData?.memberAudits || {}).map((audit: any) => {
                  const bal = audit.netBalance;
                  return (
                    <div key={audit.user.id} className="card" style={{ padding: '1rem 1.25rem', marginBottom: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{audit.user.name}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Joined: {new Date(audit.joinedAt).toISOString().slice(0, 10)} 
                          {audit.leftAt ? ` | Left: ${new Date(audit.leftAt).toISOString().slice(0, 10)}` : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: bal > 0 ? 'var(--success)' : bal < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {bal > 0 ? '+' : ''}₹{bal.toFixed(2)}
                        </span>
                        <button
                          onClick={() => setAuditUserId(auditUserId === audit.user.id ? null : audit.user.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Info size={14} />
                          {auditUserId === audit.user.id ? 'Hide' : 'Audit'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rohan's "No Magic Numbers" Audit Panel */}
          {auditUserId && (() => {
            const audit = balancesData.memberAudits[auditUserId];
            return (
              <div className="card" style={{ borderColor: 'var(--primary)', borderWidth: '2px', animation: 'slideUp 0.3s ease-out', backgroundColor: 'rgba(99, 102, 241, 0.02)' }}>
                <h3 className="card-title" style={{ color: '#a5b4fc', borderBottomColor: 'rgba(99, 102, 241, 0.15)' }}>
                  <span>Detailed Balance Audit: {audit.user.name}</span>
                  <button onClick={() => setAuditUserId(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Verification calculations demonstrating the math behind the net balance of <b style={{ color: audit.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{audit.netBalance.toFixed(2)}</b>.
                </p>

                <div className="grid-2">
                  {/* Credits (What they paid) */}
                  <div className="card" style={{ padding: '1.25rem', backgroundColor: 'rgba(16, 185, 129, 0.02)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                    <h4 style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', paddingBottom: '0.5rem' }}>
                      <span>1. Payments Made (Credits)</span>
                      <strong>+₹{audit.credits.reduce((s: any, c: any) => s + c.creditAmount, 0).toFixed(2)}</strong>
                    </h4>
                    {audit.credits.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>Did not pay for any group expenses.</p>
                    ) : (
                      <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.25rem' }}>
                        {audit.credits.map((c: any, i: number) => (
                          <div key={i} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.4rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{new Date(c.date).toISOString().slice(5, 10)} - {c.description}</span>
                            <strong style={{ color: 'var(--text-primary)' }}>+₹{c.creditAmount.toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Debits (What they owe) */}
                  <div className="card" style={{ padding: '1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                    <h4 style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.1)', paddingBottom: '0.5rem' }}>
                      <span>2. Split Shares (Debits)</span>
                      <strong>-₹{audit.debits.reduce((s: any, d: any) => s + d.debitAmount, 0).toFixed(2)}</strong>
                    </h4>
                    {audit.debits.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>No split shares assigned.</p>
                    ) : (
                      <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.25rem' }}>
                        {audit.debits.map((d: any, i: number) => (
                          <div key={i} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.4rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{new Date(d.date).toISOString().slice(5, 10)} - {d.description} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(by {d.paidBy})</span></span>
                            <strong style={{ color: 'var(--text-primary)' }}>-₹{d.debitAmount.toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Repayments Sent */}
                  <div className="card" style={{ padding: '1.25rem', backgroundColor: 'rgba(59, 130, 246, 0.02)', borderColor: 'rgba(59, 130, 246, 0.15)', marginBottom: 0 }}>
                    <h4 style={{ color: 'var(--info)', marginBottom: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', paddingBottom: '0.5rem' }}>
                      <span>3. Settlements Sent</span>
                      <strong>+₹{audit.settlementsSent.reduce((s: any, st: any) => s + st.amount, 0).toFixed(2)}</strong>
                    </h4>
                    {audit.settlementsSent.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>No manual settlements sent.</p>
                    ) : (
                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.25rem' }}>
                        {audit.settlementsSent.map((st: any, i: number) => (
                          <div key={i} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.4rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{new Date(st.date).toISOString().slice(5, 10)} - To {st.recipient}</span>
                            <strong style={{ color: 'var(--text-primary)' }}>+₹{st.amount.toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Repayments Received */}
                  <div className="card" style={{ padding: '1.25rem', backgroundColor: 'rgba(245, 158, 11, 0.02)', borderColor: 'rgba(245, 158, 11, 0.15)', marginBottom: 0 }}>
                    <h4 style={{ color: 'var(--warning)', marginBottom: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(245, 158, 11, 0.1)', paddingBottom: '0.5rem' }}>
                      <span>4. Settlements Received</span>
                      <strong>-₹{audit.settlementsReceived.reduce((s: any, sr: any) => s + sr.amount, 0).toFixed(2)}</strong>
                    </h4>
                    {audit.settlementsReceived.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>No manual settlements received.</p>
                    ) : (
                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.25rem' }}>
                        {audit.settlementsReceived.map((sr: any, i: number) => (
                          <div key={i} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.4rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{new Date(sr.date).toISOString().slice(5, 10)} - From {sr.sender}</span>
                            <strong style={{ color: 'var(--text-primary)' }}>-₹{sr.amount.toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit summary calculation footer */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', fontSize: '0.95rem' }}>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Credits: <span style={{ color: 'var(--success)', fontWeight: 600 }}>+₹{audit.credits.reduce((s: any, c: any) => s + c.creditAmount, 0).toFixed(2)}</span>
                      {' '}| Debits: <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-₹{audit.debits.reduce((s: any, d: any) => s + d.debitAmount, 0).toFixed(2)}</span>
                      {' '}| Sent: <span style={{ color: 'var(--info)', fontWeight: 600 }}>+₹{audit.settlementsSent.reduce((s: any, st: any) => s + st.amount, 0).toFixed(2)}</span>
                      {' '}| Recv: <span style={{ color: 'var(--warning)', fontWeight: 600 }}>-₹{audit.settlementsReceived.reduce((s: any, sr: any) => s + sr.amount, 0).toFixed(2)}</span>
                    </div>
                    <h3 style={{ marginTop: '0.5rem', fontSize: '1.45rem', fontWeight: 700 }}>
                      Net Sum Balance: <span style={{ color: audit.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{audit.netBalance.toFixed(2)}</span>
                    </h3>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SETTLEMENTS TAB */}
      {activeTab === 'settlements' && (
        <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 600 }}>Settlements Record Log ({settlements.length})</h3>
            <button onClick={() => { setSelectedSettlement(undefined); setSettlementModalOpen(true); }} className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={14} /> Record Repayment
            </button>
          </div>

          {settlements.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed', backgroundColor: 'transparent' }}>
              <DollarSign size={40} style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', strokeWidth: 1.5 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No repayments recorded yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sender (Paid Back)</th>
                    <th>Recipient</th>
                    <th>Repayment Amount</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s) => (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(s.date).toISOString().slice(0, 10)}</td>
                      <td style={{ fontWeight: 500 }}>{s.fromUser.name}</td>
                      <td style={{ fontWeight: 500 }}>{s.toUser.name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(s.amount).toFixed(2)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.notes || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => { setSelectedSettlement(s); setSettlementModalOpen(true); }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteSettlement(s.id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MEMBERS TIMELINE TAB */}
      {activeTab === 'members' && (
        <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 600 }}>Group Members & Timelines</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Timeline configurations ensuring temporal calculations are correct (e.g. Sam won't pay March bills!).</p>
            </div>
            <button onClick={() => { setSelectedMember(undefined); setMembersModalOpen(true); }} className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={14} /> Add New Member
            </button>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Joined Timeline</th>
                  <th>Left Timeline</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.members.map((m: any) => {
                  const joined = new Date(m.joinedAt).toISOString().slice(0, 10);
                  const left = m.leftAt ? new Date(m.leftAt).toISOString().slice(0, 10) : '-';
                  const isActive = !m.leftAt || new Date(m.leftAt) >= new Date();

                  return (
                    <tr key={m.userId}>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{m.user.name}</strong></td>
                      <td style={{ color: 'var(--text-secondary)' }}>@{m.user.username}</td>
                      <td><span className={`badge ${m.role === 'ADMIN' ? 'badge-info' : 'badge-secondary'}`} style={{ textTransform: 'lowercase', fontSize: '0.7rem' }}>{m.role}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={12} />
                          {joined}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={12} />
                          {left}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => { setSelectedMember(m); setMembersModalOpen(true); }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Settings size={12} /> Configure
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {expenseModalOpen && (
        <ExpenseModal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          onSuccess={handleExpenseSuccess}
          groupId={groupId!}
          groupMembers={group.members}
          expense={selectedExpense}
        />
      )}

      {settlementModalOpen && (
        <SettlementModal
          isOpen={settlementModalOpen}
          onClose={() => setSettlementModalOpen(false)}
          onSuccess={handleSettlementSuccess}
          groupId={groupId!}
          groupMembers={group.members}
          settlement={selectedSettlement}
        />
      )}

      {membersModalOpen && (
        <MembersModal
          isOpen={membersModalOpen}
          onClose={() => setMembersModalOpen(false)}
          onSuccess={handleMemberSuccess}
          groupId={groupId!}
          member={selectedMember}
        />
      )}
    </div>
  );
}
