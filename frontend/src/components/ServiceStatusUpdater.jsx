import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getServiceStatus, updateServiceStatus, addServiceNote } from '../utils/serviceStatusApi';

const ServiceStatusUpdater = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await getServiceStatus(id);
        setService(res.data);
        setStatus(res.data.current_status);
      } catch (error) {
        console.error('Error fetching service:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateServiceStatus(id, { status, notes });
      setNotes('');
      alert('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await addServiceNote(id, { notes });
      setNotes('');
      alert('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!service) {
    return <div>Service not found.</div>;
  }

  const statuses = ['Checked In', 'Diagnosis', 'In Progress', 'Quality Check', 'Completed'];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Update Service Status</h1>
      <div className="mb-4">
        <h2 className="text-xl">Current Status: {service.current_status}</h2>
      </div>
      <form onSubmit={handleStatusUpdate} className="mb-4">
        <div className="mb-2">
          <label htmlFor="status" className="block">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="notes" className="block">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border"
          ></textarea>
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Update Status</button>
      </form>
      <form onSubmit={handleAddNote}>
        <div className="mb-2">
          <label htmlFor="notes-only" className="block">Add a Note</label>
          <textarea
            id="notes-only"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border"
          ></textarea>
        </div>
        <button type="submit" className="bg-green-500 text-white p-2 rounded">Add Note</button>
      </form>
    </div>
  );
};

export default ServiceStatusUpdater;
