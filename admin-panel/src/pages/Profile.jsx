import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import api from '../config/api';
import Sidebar from '../components/Sidebar';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const { data } = await api.put('/users/profile', form);
      setUser && setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Failed to update');
    }
    setSaving(false);
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content">
        <div className="py-4 w-100">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="fw-bold">My Profile</h2>
          </div>
          <form onSubmit={handleSave}>
            <div className="card p-3 mb-3">
              <div className="row">
                <div className="col-12 col-md-6 mb-2">
                  <label className="form-label">Name</label>
                  <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="col-12 col-md-6 mb-2">
                  <label className="form-label">Phone</label>
                  <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <div className="col-12 mb-2">
                  <label className="form-label">Bio</label>
                  <textarea className="form-control" name="bio" rows={2} value={form.bio} onChange={handleChange}></textarea>
                </div>
                <div className="col-12 col-md-8 mb-2">
                  <label className="form-label">Profile Picture URL</label>
                  <input className="form-control" name="profilePicture" value={form.profilePicture} onChange={handleChange} />
                  {form.profilePicture && <img alt="profile" src={form.profilePicture} className="rounded mt-2" height={56} />}
                </div>
              </div>
            </div>
            <div className="card p-3 mb-3">
              <div><b>Role:</b> {user?.role}</div>
              <div><b>Department:</b> {user?.department}</div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving? 'Saving...' : 'Save'}</button>
            {msg && <div className="alert alert-info mt-3">{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;


