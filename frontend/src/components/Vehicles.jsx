import React, { useEffect, useState } from 'react';
import { vehiclesAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function Vehicles() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({ nickname: '', make: '', model: '', year: '', licensePlate: '', vin: '', mileage: '' });

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await vehiclesAPI.getAll();
      setItems(data.vehicles || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const yr = Number(form.year);
      if (!Number.isInteger(yr) || yr < 1900 || yr > currentYear + 1) {
        toast.error(`Year must be between 1900 and ${currentYear + 1}`);
        return;
      }
      const payload = {
        nickname: form.nickname?.trim() || undefined,
        make: form.make,
        model: form.model,
        year: yr,
        licensePlate: String(form.licensePlate).toUpperCase().trim(),
        vin: form.vin?.trim() || undefined,
        mileage: String(form.mileage).trim() !== '' ? Number(form.mileage) : undefined,
      };
      await vehiclesAPI.create(payload);
      toast.success('Vehicle saved');
      setForm({ nickname: '', make: '', model: '', year: '', licensePlate: '', vin: '', mileage: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const remove = async (id) => {
    try {
      await vehiclesAPI.remove(id);
      toast.success('Vehicle deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-primary-dark mb-4">My Vehicles</h1>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nickname (optional)</label>
          <input name="nickname" value={form.nickname} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., Daily Driver" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Make</label>
          <input name="make" value={form.make} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <input name="model" value={form.model} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Year</label>
          <input type="number" name="year" value={form.year} onChange={handleChange} min={1900} max={currentYear + 1} required className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">License Plate</label>
          <input name="licensePlate" value={form.licensePlate} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">VIN (optional)</label>
          <input name="vin" value={form.vin} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mileage (optional)</label>
          <input type="number" name="mileage" value={form.mileage} onChange={handleChange} min={0} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-purple">Add Vehicle</button>
        </div>
      </form>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">No saved vehicles yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(v => (
            <div key={v._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-start">
              <div>
                <div className="font-semibold text-primary-dark">{v.nickname || `${v.make} ${v.model}`}</div>
                <div className="text-sm text-gray-700">{v.make} {v.model} • {v.year} • {v.licensePlate}</div>
                {v.vin && <div className="text-sm text-gray-500">VIN: {v.vin}</div>}
                {typeof v.mileage === 'number' && <div className="text-sm text-gray-500">Mileage: {v.mileage}</div>}
              </div>
              <button onClick={() => remove(v._id)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
