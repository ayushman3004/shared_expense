import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Plus, Users, ArrowRight } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string | null;
  members: {
    user: {
      id: string;
      name: string;
      username: string;
    };
  }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create group form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await api.get('/groups');
      setGroups(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    setCreating(true);
    setError('');

    try {
      const newGroup = await api.post('/groups', {
        name: newGroupName,
        description: newGroupDesc
      });
      setGroups((prev) => [newGroup, ...prev]);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', fontWeight: 700, letterSpacing: '-0.02em' }}>My Shared Groups</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track shared bills, split expenses, and settle up with flatmates.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <Plus size={18} />
          Create New Group
        </button>
      </div>

      {error && (
        <div className="badge badge-danger" style={{ display: 'flex', width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateGroup} className="card" style={{ maxWidth: '600px', marginBottom: '2.5rem', animation: 'slideUp 0.3s ease-out' }}>
          <h3 className="card-title">Create Group</h3>
          
          <div className="form-group">
            <label className="form-label" htmlFor="groupName">Group Name</label>
            <input
              type="text"
              id="groupName"
              className="form-input"
              placeholder="e.g. Flat 204 Shared Bills"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
              disabled={creating}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="groupDesc">Description (Optional)</label>
            <textarea
              id="groupDesc"
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
              placeholder="e.g. Electricity, maid salary, rent and Goa trip spending"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              disabled={creating}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || !newGroupName}
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Users size={56} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', strokeWidth: 1.5 }} />
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', fontWeight: 600 }}>No Groups Found</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 2rem auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Get started by creating a new shared group or ask a flatmate to add you as a member of an existing one.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            <Plus size={18} />
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {groups.map((group) => (
            <div 
              key={group.id} 
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', minHeight: '190px' }} 
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 600, letterSpacing: '-0.01em' }}>{group.name}</h3>
                  <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                    <Users size={12} />
                    {group.members.length} members
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  {group.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', overflow: 'hidden', maxWidth: '80%', flexWrap: 'wrap' }}>
                    {group.members.slice(0, 4).map((m) => (
                      <span key={m.user.id} className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                        {m.user.name}
                      </span>
                    ))}
                    {group.members.length > 4 && (
                      <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                        +{group.members.length - 4}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/groups/${group.id}`);
                    }}
                    className="btn btn-secondary btn-sm" 
                    style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
